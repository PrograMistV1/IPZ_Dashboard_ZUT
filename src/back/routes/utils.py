"""Common utilities for API routes."""

from typing import Any


def config_to_dict(config: Any) -> dict:
    """Convert a config object to a dictionary for API response."""
    return {
        "id": config.id,
        "name": config.name,
        "configuration": config.configuration,
        "created_at": config.created_at.isoformat(),
        "updated_at": config.updated_at.isoformat(),
    }
