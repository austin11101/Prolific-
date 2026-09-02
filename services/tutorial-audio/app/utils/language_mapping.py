"""Explicit Prolific-to-gTTS language mappings."""

from __future__ import annotations

from dataclasses import dataclass
from types import MappingProxyType
from typing import Mapping

from app.models import UnsupportedLanguageError


@dataclass(frozen=True, slots=True)
class LanguageMapping:
    prolific_code: str
    gtts_code: str | None
    verified: bool
    note: str


LANGUAGE_MAPPINGS: Mapping[str, LanguageMapping] = MappingProxyType(
    {
        "en-ZA": LanguageMapping("en-ZA", "en", True, "Enabled foundation mapping"),
        "zu-ZA": LanguageMapping(
            "zu-ZA",
            "zu",
            False,
            "Candidate mapping; unavailable in the gTTS 2.5.4 language catalogue",
        ),
        "nso-ZA": LanguageMapping(
            "nso-ZA",
            None,
            False,
            "Placeholder until provider support and pronunciation are validated",
        ),
    }
)


def resolve_language(language_code: str) -> LanguageMapping:
    """Resolve only an exact, verified mapping; never substitute a language."""

    mapping = LANGUAGE_MAPPINGS.get(language_code)
    if mapping is None:
        raise UnsupportedLanguageError(
            f"Unsupported tutorial-audio language: {language_code}"
        )
    if not mapping.verified or mapping.gtts_code is None:
        raise UnsupportedLanguageError(
            f"Tutorial-audio language is not yet verified: {language_code}"
        )
    return mapping
