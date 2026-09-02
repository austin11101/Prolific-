"""Prototype-only gTTS speech-provider adapter."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Protocol

from gtts import gTTS

from app.models import (
    CapabilityReason,
    CapabilityStatus,
    ProviderGenerationResult,
    SpeechCapability,
    SpeechProviderError,
    TutorialAudioRequest,
    UnsupportedLanguageError,
)
from app.utils.language_mapping import LANGUAGE_MAPPINGS


class TextToSpeechClient(Protocol):
    def save(self, savefile: str) -> None: ...


TextToSpeechFactory = Callable[..., TextToSpeechClient]


class GttsSpeechProvider:
    """Keep all gTTS-specific behavior behind the provider contract."""

    provider_name = "gtts"

    def __init__(self, tts_factory: TextToSpeechFactory = gTTS) -> None:
        self._tts_factory = tts_factory

    def supports_language(self, language_code: str) -> SpeechCapability:
        mapping = LANGUAGE_MAPPINGS.get(language_code)
        if mapping is None:
            return SpeechCapability(
                requested_language_code=language_code,
                provider_language_code=None,
                provider_name=self.provider_name,
                status=CapabilityStatus.UNSUPPORTED,
                reason_code=CapabilityReason.NO_MAPPING,
                explanation="No approved gTTS mapping exists for this language.",
            )
        if mapping.verified and mapping.gtts_code:
            return SpeechCapability(
                requested_language_code=language_code,
                provider_language_code=mapping.gtts_code,
                provider_name=self.provider_name,
                status=CapabilityStatus.SUPPORTED,
                reason_code=CapabilityReason.VERIFIED_MAPPING,
                explanation="The installed gTTS catalogue contains this provider language.",
            )
        if mapping.gtts_code:
            return SpeechCapability(
                requested_language_code=language_code,
                provider_language_code=mapping.gtts_code,
                provider_name=self.provider_name,
                status=CapabilityStatus.CONFIGURED_BUT_UNAVAILABLE,
                reason_code=CapabilityReason.PROVIDER_CATALOGUE_MISSING,
                explanation="The mapping is configured but absent from the installed gTTS catalogue.",
            )
        return SpeechCapability(
            requested_language_code=language_code,
            provider_language_code=None,
            provider_name=self.provider_name,
            status=CapabilityStatus.REQUIRES_VERIFICATION,
            reason_code=CapabilityReason.PROVIDER_MAPPING_UNVERIFIED,
            explanation="No provider code is approved until language and pronunciation are verified.",
        )

    def capability_summary(self) -> tuple[SpeechCapability, ...]:
        return tuple(self.supports_language(code) for code in LANGUAGE_MAPPINGS)

    def generate(
        self, request: TutorialAudioRequest, output_path: Path, *, slow: bool
    ) -> ProviderGenerationResult:
        capability = self.supports_language(request.language_code)
        if capability.status is not CapabilityStatus.SUPPORTED:
            raise UnsupportedLanguageError(capability.explanation)
        try:
            client = self._tts_factory(
                text=request.text,
                lang=capability.provider_language_code,
                slow=slow,
            )
            client.save(str(output_path))
        except Exception:
            provider_failure = SpeechCapability(
                requested_language_code=request.language_code,
                provider_language_code=capability.provider_language_code,
                provider_name=self.provider_name,
                status=CapabilityStatus.PROVIDER_ERROR,
                reason_code=CapabilityReason.PROVIDER_INVOCATION_FAILED,
                explanation="The speech provider failed without exposing provider internals.",
            )
            raise SpeechProviderError(provider_failure) from None
        return ProviderGenerationResult(
            provider_name=self.provider_name,
            provider_language_code=capability.provider_language_code,
            selected_voice=None,
        )
