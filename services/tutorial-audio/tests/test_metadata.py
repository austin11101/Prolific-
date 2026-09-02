import hashlib
from pathlib import Path

import pytest

from app.models import InvalidTutorialAudioRequestError
from app.utils.filenames import build_proof_audio_filename
from app.utils.metadata import inspect_proof_mp3


def test_proof_filename_requires_visible_proof_prefix() -> None:
    assert (
        build_proof_audio_filename("proof-english-pangolin", "1")
        == "lesson_proof-english-pangolin_v1.mp3"
    )
    with pytest.raises(InvalidTutorialAudioRequestError):
        build_proof_audio_filename("production-lesson", "1")


def test_metadata_hashes_and_validates_mp3(tmp_path: Path) -> None:
    content = b"ID3\x04\x00\x00\x00\x00\x00\x00proof"
    path = tmp_path / "proof.mp3"
    path.write_bytes(content)

    metadata = inspect_proof_mp3(
        path,
        source_provider="gtts",
        source_language="en-ZA",
        provider_language_code="en",
        proof_lesson_id="proof-english-pangolin",
        proof_revision_id="1",
    )

    assert metadata.file_size_bytes == len(content)
    assert metadata.sha256 == hashlib.sha256(content).hexdigest()
    assert metadata.media_type == "audio/mpeg"
    assert metadata.duration_seconds is None


def test_metadata_rejects_non_mp3(tmp_path: Path) -> None:
    path = tmp_path / "not-audio.mp3"
    path.write_text("not mp3", encoding="utf-8")

    with pytest.raises(InvalidTutorialAudioRequestError):
        inspect_proof_mp3(
            path,
            source_provider="gtts",
            source_language="en-ZA",
            provider_language_code="en",
            proof_lesson_id="proof-english-pangolin",
            proof_revision_id="1",
        )
