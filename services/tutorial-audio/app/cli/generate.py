"""Generate one tutorial MP3 from approved lesson text."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, replace
from pathlib import Path
from typing import Sequence

from app.config import AzureSpeechSettings, TutorialAudioSettings
from app.generators import TutorialAudioGenerator
from app.providers import AzureSpeechProvider, GttsSpeechProvider
from app.utils.filenames import build_proof_audio_filename
from app.utils.logging import configure_logging


def build_parser(default_language: str = "en-ZA") -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lesson-id", required=True)
    parser.add_argument(
        "--version", "--lesson-version", dest="lesson_version", required=True
    )
    parser.add_argument(
        "--language", "--language-code", dest="language_code", default=default_language
    )
    parser.add_argument("--title", "--lesson-title", dest="lesson_title", required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--provider", choices=("gtts", "azure"), default="gtts")
    parser.add_argument(
        "--voice", help="Explicit provider voice for a controlled proof"
    )
    parser.add_argument(
        "--proof-only",
        action="store_true",
        help="Require a proof- identifier and use the ignored proof-output directory",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        default=None,
        help="Explicitly replace an existing lesson-version MP3",
    )
    parser.add_argument(
        "--slow",
        action="store_true",
        default=None,
        help="Enable gTTS slow-speaking mode",
    )
    return parser


def run(
    argv: Sequence[str] | None = None,
    *,
    generator: TutorialAudioGenerator | None = None,
) -> int:
    settings = TutorialAudioSettings.from_environment()
    arguments = build_parser(settings.default_language).parse_args(argv)
    if arguments.proof_only:
        build_proof_audio_filename(arguments.lesson_id, arguments.lesson_version)
    effective_settings = replace(
        settings,
        slow=settings.slow if arguments.slow is None else arguments.slow,
        output_directory=(
            Path(__file__).resolve().parents[2] / "proof-output"
            if arguments.proof_only
            else settings.output_directory
        ),
    )
    if generator is not None:
        active_generator = generator
    else:
        provider = (
            AzureSpeechProvider(AzureSpeechSettings.from_environment())
            if arguments.provider == "azure"
            else GttsSpeechProvider()
        )
        active_generator = TutorialAudioGenerator(effective_settings, provider=provider)
    result = active_generator.generate(
        lesson_id=arguments.lesson_id,
        lesson_version=arguments.lesson_version,
        language_code=arguments.language_code,
        lesson_title=arguments.lesson_title,
        text=arguments.text,
        voice_name=arguments.voice,
        overwrite=arguments.overwrite,
    )
    print(json.dumps(asdict(result), sort_keys=True))
    return 0


def main() -> None:
    configure_logging()
    raise SystemExit(run())


if __name__ == "__main__":
    main()
