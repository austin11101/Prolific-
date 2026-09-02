"""Provider-neutral language capability model."""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class CapabilityStatus(StrEnum):
    SUPPORTED = "supported"
    UNSUPPORTED = "unsupported"
    REQUIRES_VERIFICATION = "requires_verification"
    CONFIGURED_BUT_UNAVAILABLE = "configured_but_unavailable"
    PROVIDER_ERROR = "provider_error"


class CapabilityReason(StrEnum):
    VERIFIED_MAPPING = "verified_provider_mapping"
    NO_MAPPING = "no_provider_mapping"
    PROVIDER_CATALOGUE_MISSING = "provider_catalogue_missing_language"
    PROVIDER_MAPPING_UNVERIFIED = "provider_mapping_unverified"
    PROVIDER_INVOCATION_FAILED = "provider_invocation_failed"


@dataclass(frozen=True, slots=True)
class SpeechCapability:
    requested_language_code: str
    provider_language_code: str | None
    provider_name: str
    status: CapabilityStatus
    reason_code: CapabilityReason
    explanation: str
    selected_voice: str | None = None
    candidate_voices: tuple[str, ...] = ()
    word_boundary_support: bool = False
    supported_audio_formats: tuple[str, ...] = ()
    configured: bool = False
    credentials_available: bool = False
    region: str | None = None
    proof_status: str = "not_run"
