"""Speech-provider contracts and adapters."""

from app.providers.contracts import TutorialSpeechProvider
from app.providers.azure_provider import AzureSpeechProvider
from app.providers.gtts_provider import GttsSpeechProvider

__all__ = ["AzureSpeechProvider", "GttsSpeechProvider", "TutorialSpeechProvider"]
