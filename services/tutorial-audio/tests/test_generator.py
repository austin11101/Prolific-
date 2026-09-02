from pathlib import Path
import json

import pytest

from app.config import TutorialAudioSettings
from app.generators import TutorialAudioGenerator
from app.models import (
    AudioFileExistsError,
    CapabilityReason,
    CapabilityStatus,
    InvalidTutorialAudioRequestError,
    ProviderGenerationResult,
    SpeechCapability,
    TutorialAudioRequest,
    UnsupportedLanguageError,
    WordBoundary,
)


class FakeProvider:
    provider_name = "fake"

    def __init__(self, calls: list[TutorialAudioRequest]) -> None:
        self.calls = calls

    def supports_language(self, language_code: str) -> SpeechCapability:
        supported = language_code == "en-ZA"
        return SpeechCapability(
            requested_language_code=language_code,
            provider_language_code="en" if supported else None,
            provider_name=self.provider_name,
            status=(
                CapabilityStatus.SUPPORTED
                if supported
                else CapabilityStatus.UNSUPPORTED
            ),
            reason_code=(
                CapabilityReason.VERIFIED_MAPPING
                if supported
                else CapabilityReason.NO_MAPPING
            ),
            explanation="supported" if supported else "unsupported",
        )

    def capability_summary(self) -> tuple[SpeechCapability, ...]:
        return (self.supports_language("en-ZA"),)

    def generate(
        self, request: TutorialAudioRequest, output_path: Path, *, slow: bool
    ) -> ProviderGenerationResult:
        self.calls.append(request)
        output_path.write_bytes(b"mock mp3")
        return ProviderGenerationResult(
            provider_name=self.provider_name,
            provider_language_code=request.language_code,
            selected_voice=request.voice_name,
        )


def generator(
    tmp_path: Path, calls: list[TutorialAudioRequest]
) -> TutorialAudioGenerator:
    return TutorialAudioGenerator(
        TutorialAudioSettings(output_directory=tmp_path),
        provider=FakeProvider(calls),
    )


def request() -> dict[str, str]:
    return {
        "lesson_id": "lesson-123",
        "lesson_version": "4",
        "language_code": "en-ZA",
        "lesson_title": "Lesson",
        "text": "Approved lesson text.",
    }


def test_generation_uses_provider_and_returns_metadata(tmp_path: Path) -> None:
    calls: list[TutorialAudioRequest] = []

    result = generator(tmp_path, calls).generate(**request())

    assert result.filename == "lesson_lesson-123_v4.mp3"
    assert Path(result.absolute_path).is_absolute()
    assert Path(result.absolute_path).read_bytes() == b"mock mp3"
    assert result.duration_seconds is None
    assert result.language == "en-ZA"
    assert result.success is True
    assert len(calls) == 1
    assert calls[0].text == "Approved lesson text."


def test_existing_file_is_not_overwritten_by_default(tmp_path: Path) -> None:
    target = tmp_path / "lesson_lesson-123_v4.mp3"
    target.write_bytes(b"existing")
    calls: list[TutorialAudioRequest] = []

    with pytest.raises(AudioFileExistsError):
        generator(tmp_path, calls).generate(**request())

    assert target.read_bytes() == b"existing"
    assert calls == []


def test_explicit_overwrite_replaces_existing_file(tmp_path: Path) -> None:
    target = tmp_path / "lesson_lesson-123_v4.mp3"
    target.write_bytes(b"existing")
    calls: list[TutorialAudioRequest] = []

    generator(tmp_path, calls).generate(**request(), overwrite=True)

    assert target.read_bytes() == b"mock mp3"


@pytest.mark.parametrize("text", ["", "  ", "\n"])
def test_empty_text_is_rejected(tmp_path: Path, text: str) -> None:
    values = request()
    values["text"] = text

    with pytest.raises(InvalidTutorialAudioRequestError):
        generator(tmp_path, []).generate(**values)


def test_unsupported_language_never_invokes_provider(tmp_path: Path) -> None:
    calls: list[TutorialAudioRequest] = []
    values = request()
    values["language_code"] = "zu-ZA"

    with pytest.raises(UnsupportedLanguageError):
        generator(tmp_path, calls).generate(**values)

    assert calls == []


def test_provider_word_boundaries_create_deterministic_alignment(
    tmp_path: Path,
) -> None:
    calls: list[TutorialAudioRequest] = []

    class BoundaryProvider(FakeProvider):
        def generate(
            self, request: TutorialAudioRequest, output_path: Path, *, slow: bool
        ) -> ProviderGenerationResult:
            self.calls.append(request)
            output_path.write_bytes(b"ID3mock")
            return ProviderGenerationResult(
                provider_name="azure-speech",
                provider_language_code="en-ZA",
                selected_voice="en-ZA-LeahNeural",
                word_boundaries=(
                    WordBoundary(0, 8, 100, 25, "Approved", "Word"),
                    WordBoundary(9, 6, 200, 30, "lesson", "Word"),
                ),
            )

    active = TutorialAudioGenerator(
        TutorialAudioSettings(output_directory=tmp_path),
        provider=BoundaryProvider(calls),
    )
    result = active.generate(**request())

    assert result.selected_voice == "en-ZA-LeahNeural"
    assert result.alignment_path is not None
    payload = json.loads(Path(result.alignment_path).read_text(encoding="utf-8"))
    assert payload["schema"] == "azure-word-boundary-proof-v1"
    assert payload["time_unit"] == "100-nanosecond ticks"
    assert [event["audio_offset_ticks"] for event in payload["events"]] == [100, 200]
