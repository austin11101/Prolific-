"""Report deterministic launch-language capability for the selected provider."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict
from typing import Sequence

from app.config import AzureSpeechSettings
from app.models import CapabilityStatus
from app.providers import (
    AzureSpeechProvider,
    GttsSpeechProvider,
    TutorialSpeechProvider,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--provider", choices=("gtts", "azure"), default="gtts")
    parser.add_argument("--json", action="store_true", help="Print deterministic JSON")
    return parser


def run(
    argv: Sequence[str] | None = None,
    *,
    provider: TutorialSpeechProvider | None = None,
) -> int:
    arguments = build_parser().parse_args(argv)
    active_provider = provider or (
        AzureSpeechProvider(AzureSpeechSettings.from_environment())
        if arguments.provider == "azure"
        else GttsSpeechProvider()
    )
    capabilities = active_provider.capability_summary()
    if arguments.json:
        print(json.dumps([asdict(item) for item in capabilities], sort_keys=True))
    else:
        for item in capabilities:
            mapping = item.provider_language_code or "-"
            print(
                f"{item.requested_language_code}\t{item.provider_name}\t"
                f"{mapping}\t{item.status.value}\t{item.reason_code.value}"
            )
    return (
        0
        if all(item.status is CapabilityStatus.SUPPORTED for item in capabilities)
        else 2
    )


def main() -> None:
    raise SystemExit(run())


if __name__ == "__main__":
    main()
