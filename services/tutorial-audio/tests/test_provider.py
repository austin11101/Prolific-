from pathlib import Path
from typing import Any

import pytest

from app.models import (
    CapabilityStatus,
    SpeechProviderError,
    TutorialAudioRequest,
    UnsupportedLanguageError,
)
from app.providers import GttsSpeechProvider


class FakeGtts:
    def __init__(self, calls: list[dict[str, Any]], **arguments: Any) -> None:
        self.calls = calls
        self.calls.append(arguments)

    def save(self, savefile: str) -> None:
        Path(savefile).write_bytes(b"ID3mock")


def request(language_code: str = "en-ZA") -> TutorialAudioRequest:
    return TutorialAudioRequest("proof-audio", "1", language_code, "Proof", "Text")


def test_gtts_capabilities_preserve_distinct_statuses() -> None:
    provider = GttsSpeechProvider()

    assert provider.supports_language("en-ZA").status is CapabilityStatus.SUPPORTED
    assert (
        provider.supports_language("zu-ZA").status
        is CapabilityStatus.CONFIGURED_BUT_UNAVAILABLE
    )
    assert (
        provider.supports_language("nso-ZA").status
        is CapabilityStatus.REQUIRES_VERIFICATION
    )
    assert provider.supports_language("xx-ZZ").status is CapabilityStatus.UNSUPPORTED


def test_gtts_adapter_invokes_client_only_for_supported_language(
    tmp_path: Path,
) -> None:
    calls: list[dict[str, Any]] = []
    provider = GttsSpeechProvider(
        tts_factory=lambda **arguments: FakeGtts(calls, **arguments)
    )

    provider.generate(request(), tmp_path / "proof.mp3", slow=False)

    assert calls == [{"text": "Text", "lang": "en", "slow": False}]


def test_gtts_adapter_rejects_unsupported_before_client_invocation(
    tmp_path: Path,
) -> None:
    calls: list[dict[str, Any]] = []
    provider = GttsSpeechProvider(
        tts_factory=lambda **arguments: FakeGtts(calls, **arguments)
    )

    with pytest.raises(UnsupportedLanguageError):
        provider.generate(request("zu-ZA"), tmp_path / "proof.mp3", slow=False)

    assert calls == []


def test_provider_failure_is_safe_and_normalized(tmp_path: Path) -> None:
    def failing_factory(**arguments: Any) -> FakeGtts:
        raise RuntimeError("raw provider response containing lesson text")

    provider = GttsSpeechProvider(tts_factory=failing_factory)

    with pytest.raises(SpeechProviderError) as error:
        provider.generate(request(), tmp_path / "proof.mp3", slow=False)

    assert error.value.capability.status is CapabilityStatus.PROVIDER_ERROR
    assert "raw provider" not in str(error.value)
    assert "lesson text" not in str(error.value)
