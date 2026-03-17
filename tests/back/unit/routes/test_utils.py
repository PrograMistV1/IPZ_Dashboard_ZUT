"""Unit tests for route utilities."""

from datetime import datetime, timezone

from src.back.routes.utils import config_to_dict


class DummyConfig:
    """Mock config object for testing."""

    def __init__(
        self,
        id=7,
        name="Default config",
        configuration={"theme": "dark", "lang": "pl"},
        created_at=datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 2, 12, 30, tzinfo=timezone.utc),
    ):
        self.id = id
        self.name = name
        self.configuration = configuration
        self.created_at = created_at
        self.updated_at = updated_at


class TestConfigToDict:
    """Tests for config_to_dict function."""

    def test_config_to_dict_maps_fields_and_serializes_datetimes(self):
        """Should convert config object to dictionary with ISO format datetimes."""
        obj = DummyConfig()

        result = config_to_dict(obj)

        assert result == {
            "id": 7,
            "name": "Default config",
            "configuration": {"theme": "dark", "lang": "pl"},
            "created_at": "2026-01-01T10:00:00+00:00",
            "updated_at": "2026-01-02T12:30:00+00:00",
        }

    def test_config_to_dict_with_none_configuration(self):
        """Should handle None configuration gracefully."""
        obj = DummyConfig(configuration=None)
        result = config_to_dict(obj)
        assert result["configuration"] is None

    def test_config_to_dict_with_empty_configuration(self):
        """Should handle empty configuration dictionary."""
        obj = DummyConfig(configuration={})
        result = config_to_dict(obj)
        assert result["configuration"] == {}

    def test_config_to_dict_with_different_data_types(self):
        """Should handle various data types in configuration."""
        obj = DummyConfig(
            configuration={
                "number": 42,
                "boolean": True,
                "list": [1, 2, 3],
                "nested": {"key": "value"},
            }
        )
        result = config_to_dict(obj)
        assert result["configuration"]["number"] == 42
        assert result["configuration"]["boolean"] is True
        assert result["configuration"]["list"] == [1, 2, 3]

    def test_config_to_dict_with_timezone_aware_datetime(self):
        """Should properly serialize timezone-aware datetime."""
        obj = DummyConfig(
            created_at=datetime(2026, 6, 15, 14, 30, 0, tzinfo=timezone.utc),
            updated_at=datetime(2026, 6, 16, 9, 0, 0, tzinfo=timezone.utc),
        )
        result = config_to_dict(obj)
        assert result["created_at"] == "2026-06-15T14:30:00+00:00"
        assert result["updated_at"] == "2026-06-16T09:00:00+00:00"

    def test_config_to_dict_preserves_id_type(self):
        """Should preserve the ID field type."""
        obj = DummyConfig(id=999)
        result = config_to_dict(obj)
        assert result["id"] == 999
        assert isinstance(result["id"], int)

    def test_config_to_dict_with_special_characters_in_name(self):
        """Should handle special characters in config name."""
        obj = DummyConfig(name="Config-Testowanie-Hasło")
        result = config_to_dict(obj)
        assert result["name"] == "Config-Testowanie-Hasło"
