import json

from app.cli.generate import build_parser, run
from app.models import TutorialAudioResult


class StubGenerator:
    def __init__(self) -> None:
        self.arguments: dict[str, object] | None = None

    def generate(self, **arguments: object) -> TutorialAudioResult:
        self.arguments = arguments
        return TutorialAudioResult(
            filename="lesson_abc_v1.mp3",
            absolute_path="C:/audio/lesson_abc_v1.mp3",
            duration_seconds=None,
            language="en-ZA",
            success=True,
        )


def test_cli_parser_accepts_required_generation_input() -> None:
    arguments = build_parser().parse_args(
        [
            "--lesson-id",
            "abc",
            "--version",
            "1",
            "--language",
            "en-ZA",
            "--title",
            "Title",
            "--text",
            "Lesson text",
        ]
    )

    assert arguments.lesson_id == "abc"
    assert arguments.lesson_version == "1"
    assert arguments.language_code == "en-ZA"
    assert arguments.overwrite is None


def test_cli_prints_structured_result(capsys) -> None:
    stub = StubGenerator()

    exit_code = run(
        [
            "--lesson-id",
            "abc",
            "--version",
            "1",
            "--title",
            "Title",
            "--text",
            "Lesson text",
        ],
        generator=stub,  # type: ignore[arg-type]
    )

    assert exit_code == 0
    assert stub.arguments == {
        "lesson_id": "abc",
        "lesson_version": "1",
        "language_code": "en-ZA",
        "lesson_title": "Title",
        "text": "Lesson text",
        "voice_name": None,
        "overwrite": None,
    }
    assert json.loads(capsys.readouterr().out)["success"] is True
