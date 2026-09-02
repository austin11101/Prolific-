"""Transport-neutral tutorial-audio models and narrow service errors."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.capability import SpeechCapability


class TutorialAudioError(Exception):
    """Base error for expected tutorial-audio generation failures."""


class InvalidTutorialAudioRequestError(TutorialAudioError, ValueError):
    """Raised when required generation input is empty or unsafe."""


class UnsupportedLanguageError(TutorialAudioError, ValueError):
    """Raised when a language has no verified provider mapping."""


class AudioFileExistsError(TutorialAudioError, FileExistsError):
    """Raised when generation would replace an existing file without approval."""


class SpeechProviderError(TutorialAudioError):
    """Safe provider failure carrying only normalized capability information."""

    def __init__(self, capability: "SpeechCapability") -> None:
        self.capability = capability
        super().__init__(capability.explanation)


@dataclass(frozen=True, slots=True)
class TutorialAudioRequest:
    """Immutable input for one lesson-version tutorial asset."""

    lesson_id: str
    lesson_version: str
    language_code: str
    lesson_title: str
    text: str
    voice_name: str | None = None


@dataclass(frozen=True, slots=True)
class WordBoundary:
    """Normalized provider proof event using Azure's 100-nanosecond tick unit."""

    text_offset: int
    word_length: int
    audio_offset_ticks: int
    duration_ticks: int
    word_text: str
    event_type: str


@dataclass(frozen=True, slots=True)
class ProviderGenerationResult:
    provider_name: str
    provider_language_code: str
    selected_voice: str | None
    word_boundaries: tuple[WordBoundary, ...] = ()


@dataclass(frozen=True, slots=True)
class TutorialAudioResult:
    """Immutable metadata returned after successful generation."""

    filename: str
    absolute_path: str
    duration_seconds: float | None
    language: str
    success: bool
    provider_name: str | None = None
    provider_language_code: str | None = None
    selected_voice: str | None = None
    alignment_path: str | None = None
