"""Narrow provider-neutral tutorial speech contract."""

from __future__ import annotations

from pathlib import Path
from typing import Protocol

from app.models import ProviderGenerationResult, SpeechCapability, TutorialAudioRequest


class TutorialSpeechProvider(Protocol):
    """Generate tutorial speech without exposing provider implementation details."""

    @property
    def provider_name(self) -> str: ...

    def supports_language(self, language_code: str) -> SpeechCapability: ...

    def capability_summary(self) -> tuple[SpeechCapability, ...]: ...

    def generate(
        self, request: TutorialAudioRequest, output_path: Path, *, slow: bool
    ) -> ProviderGenerationResult: ...
