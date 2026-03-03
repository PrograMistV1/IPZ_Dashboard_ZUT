from datetime import datetime, timezone

from src.back.routes.utils import config_to_dict


class DummyConfig:
    def __init__(self):
        self.id = 7
        self.name = "Default config"
        self.configuration = {"theme": "dark", "lang": "pl"}
        self.created_at = datetime(2026, 1, 1, 10, 0, tzinfo=timezone.utc)
        self.updated_at = datetime(2026, 1, 2, 12, 30, tzinfo=timezone.utc)


def test_config_to_dict_maps_fields_and_serializes_datetimes():
    obj = DummyConfig()

    result = config_to_dict(obj)

    assert result == {
        "id": 7,
        "name": "Default config",
        "configuration": {"theme": "dark", "lang": "pl"},
        "created_at": "2026-01-01T10:00:00+00:00",
        "updated_at": "2026-01-02T12:30:00+00:00",
    }
