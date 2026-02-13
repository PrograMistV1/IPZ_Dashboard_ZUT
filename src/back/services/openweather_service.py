import datetime

import requests
from sqlalchemy.exc import SQLAlchemyError

from src.back.core.config import OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL
from src.back.logger.logger import BackendLogger
from src.models.weather import Weather

log = BackendLogger()


def _check_api_key() -> None:
    """Raise RuntimeError if API key is not configured."""
    if not OPENWEATHER_API_KEY:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured in environment")


def _get_base_url() -> str:
    """Return base URL without trailing slash."""
    return OPENWEATHER_BASE_URL.rstrip("/")


def _get_host_base() -> str:
    """Extract host base URL for geocoding endpoints."""
    try:
        from urllib.parse import urlparse

        parsed = urlparse(OPENWEATHER_BASE_URL)
        return f"{parsed.scheme}://{parsed.netloc}"
    except (ValueError, AttributeError):
        return _get_base_url()


def _fetch_json(
    url: str, params: dict, context: str, timeout: int = 10
) -> dict | list | None:
    """Fetch JSON data from OpenWeather API. Returns None on error for geocoding calls."""
    try:
        resp = requests.get(url, params=params, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout as exc:
        log.error("openweather", f"Timeout ({context}): {exc}")
        raise
    except requests.exceptions.RequestException as exc:
        log.error("openweather", f"Request failed ({context}): {exc}")
        raise
    except ValueError as exc:
        log.error("openweather", f"Invalid JSON ({context}): {exc}")
        raise


def _fetch_json_safe(
    url: str, params: dict, context: str, timeout: int = 5
) -> dict | list | None:
    """Fetch JSON data, returning None on any error (for geocoding)."""
    try:
        resp = requests.get(url, params=params, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as exc:
        log.error("openweather", f"Request failed ({context}): {exc}")
        return None
    except ValueError as exc:
        log.error("openweather", f"Invalid JSON ({context}): {exc}")
        return None


def _parse_weather_entry(entry: dict, lat: float, lon: float) -> dict | None:
    """Parse a single forecast entry into a row dict."""
    dt_ts = entry.get("dt")
    if not dt_ts:
        return None

    ts = datetime.datetime.fromtimestamp(dt_ts, tz=datetime.timezone.utc)
    main = entry.get("main", {})
    weather_list = entry.get("weather") or []

    w_main = None
    w_desc = None
    if weather_list and isinstance(weather_list, list) and len(weather_list) > 0:
        w_main = weather_list[0].get("main")
        w_desc = weather_list[0].get("description")

    return {
        "lat": lat,
        "lon": lon,
        "timestamp": ts,
        "temp": main.get("temp"),
        "feels_like": main.get("feels_like"),
        "pressure": main.get("pressure"),
        "humidity": main.get("humidity"),
        "wind_speed": (entry.get("wind") or {}).get("speed"),
        "weather_main": w_main,
        "weather_description": w_desc,
        "source": "openweather",
        "created_at": datetime.datetime.now(datetime.UTC),
    }


def _upsert_weather_rows(db, rows: list[dict], context: str) -> int:
    """Insert or update weather rows. Returns count of processed rows."""
    inserted = 0
    try:
        for row in rows:
            existing = (
                db.query(Weather)
                .filter(
                    Weather.lat == row["lat"],
                    Weather.lon == row["lon"],
                    Weather.timestamp == row["timestamp"],
                    Weather.source == row["source"],
                )
                .first()
            )

            if existing:
                existing.temp = row["temp"]
                existing.feels_like = row["feels_like"]
                existing.pressure = row["pressure"]
                existing.humidity = row["humidity"]
                existing.wind_speed = row["wind_speed"]
                existing.weather_main = row["weather_main"]
                existing.weather_description = row["weather_description"]
                existing.created_at = row["created_at"]
            else:
                weather_obj = Weather(**row)
                db.add(weather_obj)
            inserted += 1
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        log.error("openweather", f"DB error saving forecast rows ({context}): {exc}")
        raise

    return inserted


def _filter_forecast_rows(
    data: dict,
    lat: float,
    lon: float,
    start_date: datetime.date,
    end_date: datetime.date,
) -> list[dict]:
    """Parse and filter forecast entries by date range."""
    rows = []
    for entry in data.get("list", []):
        row = _parse_weather_entry(entry, lat, lon)
        if row is None:
            continue
        if not (start_date <= row["timestamp"].date() <= end_date):
            continue
        rows.append(row)
    return rows


def _parse_coord(coord_data: dict | None) -> tuple[float, float] | None:
    """Parse coordinate dict into (lat, lon) tuple."""
    if not coord_data:
        return None
    try:
        lat = float(coord_data.get("lat"))
        lon = float(coord_data.get("lon"))
        return lat, lon
    except (TypeError, ValueError):
        return None


def fetch_and_store_forecast(
    db, lat: float, lon: float, start_date: datetime.date, end_date: datetime.date
) -> dict:
    """Fetch forecast (future) weather from OpenWeather `/forecast` endpoint and store points.

    This uses the free 5-day/3-hour forecast endpoint which does not require paid access.
    Only rows whose date fall into [start_date, end_date] are stored.
    """
    _check_api_key()

    url = f"{_get_base_url()}/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    data = _fetch_json(url, params, "forecast by coords")
    rows = _filter_forecast_rows(data, lat, lon, start_date, end_date)

    if not rows:
        return {"inserted": 0}

    inserted = _upsert_weather_rows(db, rows, "by coords")
    return {"inserted": inserted}


def geocode_city(city: str) -> tuple[float, float] | None:
    """Resolve city name to (lat, lon) using OpenWeather geocoding API."""
    _check_api_key()

    url = f"{_get_host_base()}/geo/1.0/direct"
    params = {"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY}

    data = _fetch_json_safe(url, params, f"geocoding '{city}'")

    if not data or not isinstance(data, list):
        return None

    return _parse_coord(data[0])


def reverse_geocode(lat: float, lon: float) -> str | None:
    """Resolve coordinates to a human-friendly place name using OpenWeather reverse geocoding."""
    _check_api_key()

    url = f"{_get_host_base()}/geo/1.0/reverse"
    params = {"lat": lat, "lon": lon, "limit": 1, "appid": OPENWEATHER_API_KEY}

    data = _fetch_json_safe(url, params, f"reverse geocoding {lat},{lon}")

    if not data or not isinstance(data, list):
        return None

    first = data[0]
    parts = [
        p for p in (first.get("name"), first.get("state"), first.get("country")) if p
    ]
    return ", ".join(parts) if parts else None


def fetch_and_store_forecast_by_city(
    db, city: str, start_date: datetime.date, end_date: datetime.date
) -> dict:
    """Fetch forecast using `q=city` parameter and store rows; return inserted count and coords."""
    _check_api_key()

    url = f"{_get_base_url()}/forecast"
    params = {"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}

    data = _fetch_json(url, params, f"forecast by city '{city}'")

    city_block = data.get("city") or {}
    coord = _parse_coord(city_block.get("coord"))
    lat, lon = coord if coord else (None, None)

    rows = _filter_forecast_rows(data, lat, lon, start_date, end_date)

    if not rows:
        return {"inserted": 0, "lat": lat, "lon": lon}

    inserted = _upsert_weather_rows(db, rows, f"by city '{city}'")
    return {"inserted": inserted, "lat": lat, "lon": lon}
