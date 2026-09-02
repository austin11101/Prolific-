import json

import pytest

from app.cli.capabilities import run as run_capabilities
from app.cli.generate import build_parser, run as run_generate
from app.config.settings import ConfigurationError


def test_generate_cli_accepts_explicit_azure_provider_and_voice() -> None:
    arguments = build_parser().parse_args(
        [
            "--provider",
            "azure",
            "--voice",
            "en-ZA-LeahNeural",
            "--proof-only",
            "--lesson-id",
            "proof-azure-english",
            "--version",
            "1",
            "--language",
            "en-ZA",
            "--title",
            "Proof",
            "--text",
            "Approved text",
        ]
    )

    assert arguments.provider == "azure"
    assert arguments.voice == "en-ZA-LeahNeural"
    assert arguments.proof_only is True


def test_azure_capability_cli_is_offline_and_reports_missing_credentials(
    monkeypatch, capsys
) -> None:
    monkeypatch.delenv("AZURE_SPEECH_KEY", raising=False)
    monkeypatch.delenv("AZURE_SPEECH_REGION", raising=False)
    exit_code = run_capabilities(["--provider", "azure", "--json"])

    payload = json.loads(capsys.readouterr().out)
    assert exit_code == 2
    assert payload[0]["credentials_available"] is False
    assert payload[0]["selected_voice"] == "en-ZA-LeahNeural"
    assert payload[1]["selected_voice"] == "zu-ZA-ThandoNeural"


def test_azure_generate_cli_fails_before_network_without_credentials(
    monkeypatch,
) -> None:
    monkeypatch.delenv("AZURE_SPEECH_KEY", raising=False)
    monkeypatch.delenv("AZURE_SPEECH_REGION", raising=False)

    with pytest.raises(ConfigurationError):
        run_generate(
            [
                "--provider",
                "azure",
                "--proof-only",
                "--lesson-id",
                "proof-azure-missing-credentials",
                "--version",
                "1",
                "--language",
                "en-ZA",
                "--voice",
                "en-ZA-LeahNeural",
                "--title",
                "Proof",
                "--text",
                "Approved text",
            ]
        )
