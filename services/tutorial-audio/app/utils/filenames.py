"""Deterministic, path-safe tutorial-audio filenames."""

from __future__ import annotations

import re

from app.models import InvalidTutorialAudioRequestError


_SAFE_COMPONENT = re.compile(r"^[A-Za-z0-9_-]+$")


def _validate_component(value: str, field_name: str) -> None:
    if not value:
        raise InvalidTutorialAudioRequestError(f"{field_name} must not be empty")
    if not _SAFE_COMPONENT.fullmatch(value):
        raise InvalidTutorialAudioRequestError(
            f"{field_name} may contain only letters, numbers, hyphens, and underscores"
        )


def build_tutorial_audio_filename(lesson_id: str, lesson_version: str) -> str:
    """Return the canonical filename without rewriting either identifier."""

    _validate_component(lesson_id, "lesson_id")
    _validate_component(lesson_version, "lesson_version")
    return f"lesson_{lesson_id}_v{lesson_version}.mp3"


def build_proof_audio_filename(proof_id: str, proof_revision: str) -> str:
    """Require a visibly non-production proof identifier."""

    if not proof_id.startswith("proof-"):
        raise InvalidTutorialAudioRequestError(
            "proof_id must start with the proof- prefix"
        )
    return build_tutorial_audio_filename(proof_id, proof_revision)
