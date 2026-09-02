import json

from app.cli.capabilities import run


def test_capability_cli_reports_launch_languages_and_nonzero_coverage(capsys) -> None:
    exit_code = run(["--json"])

    payload = json.loads(capsys.readouterr().out)
    assert exit_code == 2
    assert [item["requested_language_code"] for item in payload] == [
        "en-ZA",
        "zu-ZA",
        "nso-ZA",
    ]
    assert [item["status"] for item in payload] == [
        "supported",
        "configured_but_unavailable",
        "requires_verification",
    ]


def test_capability_json_is_deterministic(capsys) -> None:
    run(["--json"])
    first = capsys.readouterr().out
    run(["--json"])
    second = capsys.readouterr().out

    assert first == second
