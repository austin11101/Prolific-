"""Minimal structured console logging with no lesson text or telemetry."""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime


class JsonConsoleFormatter(logging.Formatter):
    """Render predictable JSON records for local and pipeline logs."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "event": getattr(record, "event", "log"),
            "message": record.getMessage(),
        }
        return json.dumps(payload, ensure_ascii=True)


def configure_logging(level: int = logging.INFO) -> None:
    """Configure one structured stderr handler without external telemetry."""

    handler = logging.StreamHandler()
    handler.setFormatter(JsonConsoleFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
