"""Environment-backed configuration for tutorial-audio generation."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping


class ConfigurationError(ValueError):
    """Raised when service configuration is invalid."""


SERVICE_ROOT = Path(__file__).resolve().parents[2]


def _parse_bool(value: str, variable_name: str) -> bool:
    normalized = value.lower()
    if normalized in {"1", "true", "yes"}:
        return True
    if normalized in {"0", "false", "no"}:
        return False
    raise ConfigurationError(
        f"{variable_name} must be one of true, false, 1, 0, yes, or no"
    )


@dataclass(frozen=True, slots=True)
class TutorialAudioSettings:
    """Immutable runtime settings for one generator instance."""

    output_directory: Path
    slow: bool = False
    overwrite: bool = False
    default_language: str = "en-ZA"

    @classmethod
    def from_environment(
        cls, environment: Mapping[str, str] | None = None
    ) -> "TutorialAudioSettings":
        values = os.environ if environment is None else environment
        output_value = values.get("TUTORIAL_AUDIO_OUTPUT_DIR")
        output_directory = (
            Path(output_value).expanduser() if output_value else SERVICE_ROOT / "output"
        )
        return cls(
            output_directory=output_directory.resolve(),
            slow=_parse_bool(
                values.get("TUTORIAL_AUDIO_SLOW", "false"), "TUTORIAL_AUDIO_SLOW"
            ),
            overwrite=_parse_bool(
                values.get("TUTORIAL_AUDIO_OVERWRITE", "false"),
                "TUTORIAL_AUDIO_OVERWRITE",
            ),
            default_language=values.get("TUTORIAL_AUDIO_DEFAULT_LANGUAGE", "en-ZA"),
        )
