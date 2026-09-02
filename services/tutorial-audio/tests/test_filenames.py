import pytest

from app.models import InvalidTutorialAudioRequestError
from app.utils.filenames import build_tutorial_audio_filename


def test_filename_is_deterministic() -> None:
    assert (
        build_tutorial_audio_filename("lesson-123", "2") == "lesson_lesson-123_v2.mp3"
    )


@pytest.mark.parametrize("value", ["", "../escape", "has space", "a/b"])
def test_filename_rejects_unsafe_components(value: str) -> None:
    with pytest.raises(InvalidTutorialAudioRequestError):
        build_tutorial_audio_filename(value, "1")
