import pytest

from app.models import UnsupportedLanguageError
from app.utils.language_mapping import LANGUAGE_MAPPINGS, resolve_language


def test_launch_language_mappings_are_explicit() -> None:
    assert resolve_language("en-ZA").gtts_code == "en"
    assert LANGUAGE_MAPPINGS["zu-ZA"].gtts_code == "zu"
    assert LANGUAGE_MAPPINGS["zu-ZA"].verified is False
    assert LANGUAGE_MAPPINGS["nso-ZA"].gtts_code is None
    assert LANGUAGE_MAPPINGS["nso-ZA"].verified is False


@pytest.mark.parametrize("language_code", ["zu-ZA", "nso-ZA", "fr-FR", "en-za", ""])
def test_invalid_or_unverified_language_is_rejected(language_code: str) -> None:
    with pytest.raises(UnsupportedLanguageError):
        resolve_language(language_code)
