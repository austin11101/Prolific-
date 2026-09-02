from pathlib import Path

import pytest

from app.config import AzureSpeechSettings
from app.config.settings import ConfigurationError
from app.models import (
    CapabilityStatus,
    ProviderGenerationResult,
    SpeechProviderError,
    TutorialAudioRequest,
    UnsupportedLanguageError,
    WordBoundary,
)
from app.providers.azure_provider import AzureSpeechProvider, validate_word_boundaries


def request(
    language_code: str = "en-ZA", voice_name: str | None = None
) -> TutorialAudioRequest:
    return TutorialAudioRequest(
        "proof-azure",
        "1",
        language_code,
        "Azure proof",
        "Approved proof text.",
        voice_name,
    )


def configured_settings() -> AzureSpeechSettings:
    return AzureSpeechSettings(subscription_key="test-key", region="southafricanorth")


def test_azure_configuration_requires_key_and_location() -> None:
    settings = AzureSpeechSettings.from_environment({})

    assert settings.credentials_available is False
    assert "test-key" not in repr(AzureSpeechSettings(subscription_key="test-key"))
    with pytest.raises(ConfigurationError):
        settings.require_credentials()


def test_azure_configuration_reads_voice_selection() -> None:
    settings = AzureSpeechSettings.from_environment(
        {
            "AZURE_SPEECH_KEY": "test-key",
            "AZURE_SPEECH_REGION": "southafricanorth",
            "AZURE_SPEECH_VOICE_EN_ZA": "en-ZA-LukeNeural",
            "AZURE_SPEECH_VOICE_ZU_ZA": "zu-ZA-ThembaNeural",
        }
    )

    assert settings.credentials_available is True
    assert settings.english_voice == "en-ZA-LukeNeural"
    assert settings.isizulu_voice == "zu-ZA-ThembaNeural"


def test_azure_capability_maps_launch_languages_without_network() -> None:
    provider = AzureSpeechProvider(AzureSpeechSettings())

    english = provider.supports_language("en-ZA")
    isizulu = provider.supports_language("zu-ZA")
    sepedi = provider.supports_language("nso-ZA")

    assert english.status is CapabilityStatus.SUPPORTED
    assert english.selected_voice == "en-ZA-LeahNeural"
    assert english.word_boundary_support is True
    assert english.credentials_available is False
    assert isizulu.status is CapabilityStatus.SUPPORTED
    assert isizulu.selected_voice == "zu-ZA-ThandoNeural"
    assert sepedi.status is CapabilityStatus.UNSUPPORTED


def test_missing_credentials_abort_before_sdk_invocation(tmp_path: Path) -> None:
    calls = 0

    def synthesize(*args):
        nonlocal calls
        calls += 1
        raise AssertionError("must not run")

    provider = AzureSpeechProvider(AzureSpeechSettings(), synthesize=synthesize)

    with pytest.raises(ConfigurationError):
        provider.generate(request(), tmp_path / "proof.mp3", slow=False)

    assert calls == 0


def test_explicit_candidate_voice_and_result_mapping(tmp_path: Path) -> None:
    calls: list[str] = []
    boundaries = (
        WordBoundary(0, 8, 100, 30, "Approved", "Word"),
        WordBoundary(9, 5, 200, 40, "proof", "Word"),
    )

    def synthesize(request_value, voice, output_path, settings):
        calls.append(voice)
        output_path.write_bytes(b"ID3azure")
        return ProviderGenerationResult(
            "azure-speech", request_value.language_code, voice, boundaries
        )

    provider = AzureSpeechProvider(configured_settings(), synthesize=synthesize)
    result = provider.generate(
        request(voice_name="en-ZA-LukeNeural"), tmp_path / "proof.mp3", slow=False
    )

    assert calls == ["en-ZA-LukeNeural"]
    assert result.selected_voice == "en-ZA-LukeNeural"
    assert result.word_boundaries == boundaries


def test_unsupported_voice_and_sepedi_never_invoke_sdk(tmp_path: Path) -> None:
    calls = 0

    def synthesize(*args):
        nonlocal calls
        calls += 1
        raise AssertionError("must not run")

    provider = AzureSpeechProvider(configured_settings(), synthesize=synthesize)

    with pytest.raises(UnsupportedLanguageError):
        provider.generate(
            request(voice_name="en-US-GenericNeural"),
            tmp_path / "english.mp3",
            slow=False,
        )
    with pytest.raises(UnsupportedLanguageError):
        provider.generate(request("nso-ZA"), tmp_path / "sepedi.mp3", slow=False)

    assert calls == 0


def test_azure_error_is_redacted(tmp_path: Path) -> None:
    def synthesize(*args):
        raise RuntimeError("raw Azure response with secret and proof text")

    provider = AzureSpeechProvider(configured_settings(), synthesize=synthesize)

    with pytest.raises(SpeechProviderError) as error:
        provider.generate(request(), tmp_path / "proof.mp3", slow=False)

    assert error.value.capability.status is CapabilityStatus.PROVIDER_ERROR
    assert "raw Azure" not in str(error.value)
    assert "proof text" not in str(error.value)


def test_word_boundaries_must_be_monotonic() -> None:
    valid = (
        WordBoundary(0, 3, 10, 2, "one", "Word"),
        WordBoundary(4, 3, 20, 2, "two", "Word"),
    )
    validate_word_boundaries(valid)

    invalid = (
        WordBoundary(4, 3, 20, 2, "two", "Word"),
        WordBoundary(0, 3, 10, 2, "one", "Word"),
    )
    with pytest.raises(ValueError):
        validate_word_boundaries(invalid)
