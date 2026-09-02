"""Dependency-free metadata and integrity inspection for proof MP3 files."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from app.models import InvalidTutorialAudioRequestError


@dataclass(frozen=True, slots=True)
class AudioProofMetadata:
    absolute_path: str
    file_size_bytes: int
    sha256: str
    duration_seconds: float | None
    media_type: str
    generation_timestamp: str
    source_provider: str
    source_language: str
    provider_language_code: str
    proof_lesson_id: str
    proof_revision_id: str
    source_voice: str | None = None


def _has_mp3_header(path: Path) -> bool:
    with path.open("rb") as stream:
        header = stream.read(10)
    return header.startswith(b"ID3") or (
        len(header) >= 2 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0
    )


def inspect_proof_mp3(
    path: Path,
    *,
    source_provider: str,
    source_language: str,
    provider_language_code: str,
    proof_lesson_id: str,
    proof_revision_id: str,
    source_voice: str | None = None,
) -> AudioProofMetadata:
    resolved = path.resolve(strict=True)
    if not resolved.is_file() or not _has_mp3_header(resolved):
        raise InvalidTutorialAudioRequestError(
            "Proof output is not a valid MP3 container"
        )
    digest = hashlib.sha256()
    with resolved.open("rb") as stream:
        for block in iter(lambda: stream.read(65536), b""):
            digest.update(block)
    timestamp = datetime.fromtimestamp(resolved.stat().st_mtime, UTC).isoformat()
    return AudioProofMetadata(
        absolute_path=str(resolved),
        file_size_bytes=resolved.stat().st_size,
        sha256=digest.hexdigest(),
        duration_seconds=None,
        media_type="audio/mpeg",
        generation_timestamp=timestamp,
        source_provider=source_provider,
        source_language=source_language,
        provider_language_code=provider_language_code,
        proof_lesson_id=proof_lesson_id,
        proof_revision_id=proof_revision_id,
        source_voice=source_voice,
    )
