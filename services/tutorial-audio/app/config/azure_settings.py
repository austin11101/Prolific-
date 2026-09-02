"""Secret-safe Azure Speech configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Mapping

from app.config.settings import ConfigurationError


@dataclass(frozen=True, slots=True)
class AzureSpeechSettings:
    subscription_key: str | None = field(default=None, repr=False)
    region: str | None = None
    endpoint: str | None = None
    english_voice: str = "en-ZA-LeahNeural"
    isizulu_voice: str = "zu-ZA-ThandoNeural"

    @property
    def credentials_available(self) -> bool:
        return bool(self.subscription_key and (self.region or self.endpoint))

    def require_credentials(self) -> None:
        if not self.credentials_available:
            raise ConfigurationError(
                "Azure Speech requires AZURE_SPEECH_KEY and either "
                "AZURE_SPEECH_REGION or AZURE_SPEECH_ENDPOINT"
            )

    @classmethod
    def from_environment(
        cls, environment: Mapping[str, str] | None = None
    ) -> "AzureSpeechSettings":
        values = os.environ if environment is None else environment
        return cls(
            subscription_key=values.get("AZURE_SPEECH_KEY") or None,
            region=values.get("AZURE_SPEECH_REGION") or None,
            endpoint=values.get("AZURE_SPEECH_ENDPOINT") or None,
            english_voice=values.get("AZURE_SPEECH_VOICE_EN_ZA", "en-ZA-LeahNeural"),
            isizulu_voice=values.get("AZURE_SPEECH_VOICE_ZU_ZA", "zu-ZA-ThandoNeural"),
        )
