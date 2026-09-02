"""Provider-neutral deterministic tutorial-audio generation."""

from __future__ import annotations

import logging
import os
import tempfile
import json
from dataclasses import asdict
from pathlib import Path

from app.config import TutorialAudioSettings
from app.models import (
    AudioFileExistsError,
    CapabilityStatus,
    InvalidTutorialAudioRequestError,
    TutorialAudioRequest,
    TutorialAudioResult,
    UnsupportedLanguageError,
)
from app.providers import GttsSpeechProvider, TutorialSpeechProvider
from app.utils.filenames import build_tutorial_audio_filename

LOGGER = logging.getLogger(__name__)


class TutorialAudioGenerator:
    """Generate one MP3 while preserving the publication/storage boundary."""

    def __init__(
        self,
        settings: TutorialAudioSettings,
        provider: TutorialSpeechProvider | None = None,
    ) -> None:
        self._settings = settings
        self._provider = provider or GttsSpeechProvider()

    def generate(
        self,
        *,
        lesson_id: str,
        lesson_version: str,
        language_code: str,
        lesson_title: str,
        text: str,
        voice_name: str | None = None,
        overwrite: bool | None = None,
    ) -> TutorialAudioResult:
        request = TutorialAudioRequest(
            lesson_id=lesson_id,
            lesson_version=lesson_version,
            language_code=language_code,
            lesson_title=lesson_title,
            text=text,
            voice_name=voice_name,
        )
        self._validate_request(request)
        capability = self._provider.supports_language(request.language_code)
        if capability.status is not CapabilityStatus.SUPPORTED:
            raise UnsupportedLanguageError(capability.explanation)
        filename = build_tutorial_audio_filename(
            request.lesson_id, request.lesson_version
        )
        output_directory = self._settings.output_directory.resolve()
        target = output_directory / filename
        alignment_target = target.with_suffix(".alignment.json")
        allow_overwrite = self._settings.overwrite if overwrite is None else overwrite

        if target.exists() and not allow_overwrite:
            raise AudioFileExistsError(
                f"Tutorial audio already exists and overwrite is disabled: {target}"
            )
        if alignment_target.exists() and not allow_overwrite:
            raise AudioFileExistsError(
                "Tutorial alignment already exists and overwrite is disabled: "
                f"{alignment_target}"
            )

        output_directory.mkdir(parents=True, exist_ok=True)
        LOGGER.info(
            "Generating tutorial audio",
            extra={"event": "tutorial_audio_generation_started"},
        )
        temporary_path = self._temporary_path(output_directory)
        try:
            provider_result = self._provider.generate(
                request,
                temporary_path,
                slow=self._settings.slow,
            )
            self._publish(temporary_path, target, allow_overwrite)
            alignment_path = self._write_alignment(
                alignment_target,
                provider_result.word_boundaries,
                allow_overwrite,
            )
        except Exception:
            temporary_path.unlink(missing_ok=True)
            LOGGER.exception(
                "Tutorial audio generation failed",
                extra={"event": "tutorial_audio_generation_failed"},
            )
            raise

        LOGGER.info(
            "Tutorial audio generated",
            extra={"event": "tutorial_audio_generation_completed"},
        )
        return TutorialAudioResult(
            filename=filename,
            absolute_path=str(target.resolve()),
            duration_seconds=None,
            language=request.language_code,
            success=True,
            provider_name=provider_result.provider_name,
            provider_language_code=provider_result.provider_language_code,
            selected_voice=provider_result.selected_voice,
            alignment_path=alignment_path,
        )

    @staticmethod
    def _validate_request(request: TutorialAudioRequest) -> None:
        if not request.lesson_title:
            raise InvalidTutorialAudioRequestError("lesson_title must not be empty")
        if not request.text or not request.text.strip():
            raise InvalidTutorialAudioRequestError("text must not be empty")

    @staticmethod
    def _temporary_path(output_directory: Path) -> Path:
        descriptor, name = tempfile.mkstemp(
            prefix=".tutorial-audio-", suffix=".tmp", dir=output_directory
        )
        os.close(descriptor)
        return Path(name)

    @staticmethod
    def _publish(temporary_path: Path, target: Path, overwrite: bool) -> None:
        if overwrite:
            target.unlink(missing_ok=True)
            os.replace(temporary_path, target)
            return

        try:
            descriptor = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError as error:
            raise AudioFileExistsError(
                f"Tutorial audio already exists and overwrite is disabled: {target}"
            ) from error

        os.close(descriptor)
        try:
            os.replace(temporary_path, target)
        except Exception:
            target.unlink(missing_ok=True)
            raise

    @staticmethod
    def _write_alignment(
        target: Path,
        boundaries: tuple,
        overwrite: bool,
    ) -> str | None:
        if not boundaries:
            return None
        if target.exists() and not overwrite:
            raise AudioFileExistsError(
                f"Tutorial alignment already exists and overwrite is disabled: {target}"
            )
        payload = {
            "schema": "azure-word-boundary-proof-v1",
            "time_unit": "100-nanosecond ticks",
            "provider_specific": True,
            "events": [asdict(boundary) for boundary in boundaries],
        }
        temporary = target.with_suffix(target.suffix + ".tmp")
        temporary.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        if overwrite:
            target.unlink(missing_ok=True)
        os.replace(temporary, target)
        return str(target.resolve())
