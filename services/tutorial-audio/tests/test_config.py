from pathlib import Path

import pytest

from app.config.settings import ConfigurationError, TutorialAudioSettings


def test_configuration_defaults_are_safe() -> None:
    settings = TutorialAudioSettings.from_environment({})

    assert settings.output_directory.name == "output"
    assert settings.slow is False
    assert settings.overwrite is False
    assert settings.default_language == "en-ZA"


def test_configuration_reads_explicit_values(tmp_path: Path) -> None:
    settings = TutorialAudioSettings.from_environment(
        {
            "TUTORIAL_AUDIO_OUTPUT_DIR": str(tmp_path),
            "TUTORIAL_AUDIO_SLOW": "yes",
            "TUTORIAL_AUDIO_OVERWRITE": "1",
            "TUTORIAL_AUDIO_DEFAULT_LANGUAGE": "zu-ZA",
        }
    )

    assert settings.output_directory == tmp_path.resolve()
    assert settings.slow is True
    assert settings.overwrite is True
    assert settings.default_language == "zu-ZA"


def test_configuration_rejects_invalid_boolean() -> None:
    with pytest.raises(ConfigurationError):
        TutorialAudioSettings.from_environment({"TUTORIAL_AUDIO_SLOW": "maybe"})
