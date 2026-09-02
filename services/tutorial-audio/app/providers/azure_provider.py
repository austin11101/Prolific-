"""Azure Speech adapter behind the provider-neutral contract."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path

from app.config import AzureSpeechSettings
from app.models import (
    CapabilityReason,
    CapabilityStatus,
    ProviderGenerationResult,
    SpeechCapability,
    SpeechProviderError,
    TutorialAudioRequest,
    UnsupportedLanguageError,
    WordBoundary,
)

AZURE_VOICE_CANDIDATES = {
    "en-ZA": ("en-ZA-LeahNeural", "en-ZA-LukeNeural"),
    "zu-ZA": ("zu-ZA-ThandoNeural", "zu-ZA-ThembaNeural"),
}

AzureSynthesisCallable = Callable[
    [TutorialAudioRequest, str, Path, AzureSpeechSettings], ProviderGenerationResult
]


def validate_word_boundaries(boundaries: tuple[WordBoundary, ...]) -> None:
    previous_audio = -1
    previous_text = -1
    for boundary in boundaries:
        if boundary.audio_offset_ticks < previous_audio:
            raise ValueError("Azure word-boundary audio offsets must be monotonic")
        if boundary.text_offset < previous_text:
            raise ValueError("Azure word-boundary text offsets must be monotonic")
        previous_audio = boundary.audio_offset_ticks
        previous_text = boundary.text_offset


class AzureSpeechProvider:
    provider_name = "azure-speech"

    def __init__(
        self,
        settings: AzureSpeechSettings,
        synthesize: AzureSynthesisCallable | None = None,
    ) -> None:
        self._settings = settings
        self._synthesize = synthesize or self._synthesize_with_sdk

    def _selected_voice(self, language_code: str) -> str | None:
        if language_code == "en-ZA":
            return self._settings.english_voice
        if language_code == "zu-ZA":
            return self._settings.isizulu_voice
        return None

    def supports_language(self, language_code: str) -> SpeechCapability:
        candidates = AZURE_VOICE_CANDIDATES.get(language_code, ())
        selected_voice = self._selected_voice(language_code)
        if not candidates:
            return SpeechCapability(
                requested_language_code=language_code,
                provider_language_code=None,
                provider_name=self.provider_name,
                status=CapabilityStatus.UNSUPPORTED,
                reason_code=CapabilityReason.NO_MAPPING,
                explanation="Azure Speech has no approved proof mapping for this language.",
                configured=self._settings.credentials_available,
                credentials_available=self._settings.credentials_available,
                region=self._settings.region,
                proof_status="not_authorized",
            )
        voice_valid = selected_voice in candidates
        return SpeechCapability(
            requested_language_code=language_code,
            provider_language_code=language_code,
            provider_name=self.provider_name,
            status=(
                CapabilityStatus.SUPPORTED
                if voice_valid
                else CapabilityStatus.CONFIGURED_BUT_UNAVAILABLE
            ),
            reason_code=(
                CapabilityReason.VERIFIED_MAPPING
                if voice_valid
                else CapabilityReason.PROVIDER_CATALOGUE_MISSING
            ),
            explanation=(
                "Official Azure documentation lists this proof locale and voice."
                if voice_valid
                else "The configured voice is outside the approved proof candidates."
            ),
            selected_voice=selected_voice,
            candidate_voices=candidates,
            word_boundary_support=True,
            supported_audio_formats=("audio/mpeg", "audio/wav"),
            configured=self._settings.credentials_available and voice_valid,
            credentials_available=self._settings.credentials_available,
            region=self._settings.region,
            proof_status=(
                "pending_live_proof"
                if self._settings.credentials_available and voice_valid
                else "blocked_missing_credentials"
            ),
        )

    def capability_summary(self) -> tuple[SpeechCapability, ...]:
        return tuple(
            self.supports_language(code) for code in ("en-ZA", "zu-ZA", "nso-ZA")
        )

    def generate(
        self, request: TutorialAudioRequest, output_path: Path, *, slow: bool
    ) -> ProviderGenerationResult:
        del slow  # Azure proof pace is controlled by the selected neural voice.
        capability = self.supports_language(request.language_code)
        if capability.status is not CapabilityStatus.SUPPORTED:
            raise UnsupportedLanguageError(capability.explanation)
        selected_voice = request.voice_name or capability.selected_voice
        if selected_voice not in capability.candidate_voices:
            raise UnsupportedLanguageError(
                "The requested Azure voice is not an approved proof candidate."
            )
        self._settings.require_credentials()
        try:
            result = self._synthesize(
                request, selected_voice, output_path, self._settings
            )
            validate_word_boundaries(result.word_boundaries)
            return result
        except (UnsupportedLanguageError, ValueError):
            raise
        except Exception:
            failure = SpeechCapability(
                requested_language_code=request.language_code,
                provider_language_code=request.language_code,
                provider_name=self.provider_name,
                status=CapabilityStatus.PROVIDER_ERROR,
                reason_code=CapabilityReason.PROVIDER_INVOCATION_FAILED,
                explanation="Azure Speech synthesis failed without exposing provider internals.",
                selected_voice=selected_voice,
                credentials_available=True,
                region=self._settings.region,
                proof_status="provider_error",
            )
            raise SpeechProviderError(failure) from None

    @staticmethod
    def _synthesize_with_sdk(
        request: TutorialAudioRequest,
        selected_voice: str,
        output_path: Path,
        settings: AzureSpeechSettings,
    ) -> ProviderGenerationResult:
        import azure.cognitiveservices.speech as speechsdk

        if settings.endpoint:
            speech_config = speechsdk.SpeechConfig(
                subscription=settings.subscription_key, endpoint=settings.endpoint
            )
        else:
            speech_config = speechsdk.SpeechConfig(
                subscription=settings.subscription_key, region=settings.region
            )
        speech_config.speech_synthesis_voice_name = selected_voice
        speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3
        )
        audio_config = speechsdk.audio.AudioOutputConfig(filename=str(output_path))
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config, audio_config=audio_config
        )
        boundaries: list[WordBoundary] = []

        def on_boundary(event: object) -> None:
            duration = getattr(event, "duration", 0)
            duration_ticks = (
                int(duration.total_seconds() * 10_000_000)
                if hasattr(duration, "total_seconds")
                else int(duration or 0)
            )
            boundaries.append(
                WordBoundary(
                    text_offset=int(getattr(event, "text_offset", 0)),
                    word_length=int(getattr(event, "word_length", 0)),
                    audio_offset_ticks=int(getattr(event, "audio_offset", 0)),
                    duration_ticks=duration_ticks,
                    word_text=str(getattr(event, "text", "")),
                    event_type=str(getattr(event, "boundary_type", "word")),
                )
            )

        synthesizer.synthesis_word_boundary.connect(on_boundary)
        sdk_result = synthesizer.speak_text_async(request.text).get()
        if sdk_result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            raise RuntimeError("Azure synthesis did not complete")
        normalized = tuple(boundaries)
        validate_word_boundaries(normalized)
        return ProviderGenerationResult(
            provider_name="azure-speech",
            provider_language_code=request.language_code,
            selected_voice=selected_voice,
            word_boundaries=normalized,
        )
