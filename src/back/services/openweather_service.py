import datetime

import requests
from sqlalchemy import text

from src.back.core.config import OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL
from src.back.logger.logger import BackendLogger

log = BackendLogger()


def fetch_and_store_forecast(
    db, lat: float, lon: float, start_date: datetime.date, end_date: datetime.date
) -> dict:
    """Fetch forecast (future) weather from OpenWeather `/forecast` endpoint and store points.

    This uses the free 5-day/3-hour forecast endpoint which does not require paid access.
    Only rows whose date fall into [start_date, end_date] are stored.
    """
    if not OPENWEATHER_API_KEY:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured in environment")

    base = OPENWEATHER_BASE_URL.rstrip("/")
    url = f"{base}/forecast"

    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout as exc:
        log.error("openweather", f"Timeout fetching forecast: {exc}")
        raise
    except requests.exceptions.RequestException as exc:
        log.error("openweather", f"RequestException fetching forecast: {exc}")
        raise
    except ValueError as exc:
        log.error("openweather", f"Invalid JSON from OpenWeather forecast: {exc}")
        raise

    entries = data.get("list", [])
    rows = []
    inserted = 0

    for e in entries:
        dt_ts = e.get("dt")
        if not dt_ts:
            continue
        ts = datetime.datetime.fromtimestamp(dt_ts, tz=datetime.timezone.utc)
        d = ts.date()
        if d < start_date or d > end_date:
            continue

        main = e.get("main", {})
        weather = e.get("weather") or []
        w_main = None
        w_desc = None
        if weather and isinstance(weather, list) and len(weather) > 0:
            w_main = weather[0].get("main")
            w_desc = weather[0].get("description")

        row = {
            "lat": lat,
            "lon": lon,
            "timestamp": ts,
            "temp": main.get("temp"),
            "feels_like": main.get("feels_like"),
            "pressure": main.get("pressure"),
            "humidity": main.get("humidity"),
            "wind_speed": (e.get("wind") or {}).get("speed"),
            "weather_main": w_main,
            "weather_description": w_desc,
            "source": "openweather",
            "created_at": datetime.datetime.utcnow(),
        }

        rows.append(row)

    if not rows:
        return {"inserted": 0}

    try:
        sql = """
        INSERT INTO weather (
            lat,
            lon,
            timestamp,
            temp,
            feels_like,
            pressure,
            humidity,
            wind_speed,
            weather_main,
            weather_description,
            source,
            created_at
        )
        VALUES (
            :lat,
            :lon,
            :timestamp,
            :temp,
            :feels_like,
            :pressure,
            :humidity,
            :wind_speed,
            :weather_main,
            :weather_description,
            :source,
            :created_at
        )
        ON DUPLICATE KEY UPDATE
            temp = VALUES(temp),
            feels_like = VALUES(feels_like),
            pressure = VALUES(pressure),
            humidity = VALUES(humidity),
            wind_speed = VALUES(wind_speed),
            weather_main = VALUES(weather_main),
            weather_description = VALUES(weather_description),
            created_at = VALUES(created_at)
        """

        for row in rows:
            db.execute(text(sql), row)
            inserted += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        log.error("openweather", f"DB error saving forecast rows: {exc}")
        raise

    return {"inserted": inserted}


def geocode_city(city: str) -> tuple[float, float] | None:
    """Resolve city name to (lat, lon) using OpenWeather geocoding API."""
    if not OPENWEATHER_API_KEY:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured in environment")

    try:
        from urllib.parse import urlparse

        parsed = urlparse(OPENWEATHER_BASE_URL)
        host_base = f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        host_base = OPENWEATHER_BASE_URL.rstrip("/")

    url = f"{host_base}/geo/1.0/direct"
    params = {"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY}

    try:
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.error("openweather", f"Geocoding request failed for '{city}': {exc}")
        return None

    if not data or not isinstance(data, list):
        return None

    first = data[0]
    lat = first.get("lat")
    lon = first.get("lon")
    if lat is None or lon is None:
        return None
    try:
        return float(lat), float(lon)
    except Exception:
        return None


def reverse_geocode(lat: float, lon: float) -> str | None:
    """Resolve coordinates to a human-friendly place name using OpenWeather reverse geocoding."""
    if not OPENWEATHER_API_KEY:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured in environment")

    try:
        from urllib.parse import urlparse

        parsed = urlparse(OPENWEATHER_BASE_URL)
        host_base = f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        host_base = OPENWEATHER_BASE_URL.rstrip("/")

    url = f"{host_base}/geo/1.0/reverse"
    params = {"lat": lat, "lon": lon, "limit": 1, "appid": OPENWEATHER_API_KEY}

    try:
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
    except Exception as exc:
        log.error("openweather", f"Reverse geocoding failed for {lat},{lon}: {exc}")
        return None

    if not data or not isinstance(data, list):
        return None

    first = data[0]
    # prefer 'name' and 'state' and 'country'
    parts = []
    if first.get("name"):
        parts.append(first.get("name"))
    if first.get("state"):
        parts.append(first.get("state"))
    if first.get("country"):
        parts.append(first.get("country"))

    if not parts:
        return None

    return ", ".join(parts)


def fetch_and_store_forecast_by_city(
    db, city: str, start_date: datetime.date, end_date: datetime.date
) -> dict:
    """Fetch forecast using `q=city` parameter and store rows; return inserted count and coords."""
    if not OPENWEATHER_API_KEY:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured in environment")

    base = OPENWEATHER_BASE_URL.rstrip("/")
    url = f"{base}/forecast"
    params = {"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.RequestException as exc:
        log.error(
            "openweather", f"RequestException fetching forecast by city '{city}': {exc}"
        )
        raise

    coord = (None, None)
    city_block = data.get("city") or {}
    if city_block:
        ccoord = city_block.get("coord") or {}
        try:
            coord = (float(ccoord.get("lat")), float(ccoord.get("lon")))
        except Exception:
            coord = (None, None)

    entries = data.get("list", [])
    rows = []
    inserted = 0

    for e in entries:
        dt_ts = e.get("dt")
        if not dt_ts:
            continue
        ts = datetime.datetime.fromtimestamp(dt_ts, tz=datetime.timezone.utc)
        d = ts.date()
        if d < start_date or d > end_date:
            continue

        main = e.get("main", {})
        weather = e.get("weather") or []
        w_main = None
        w_desc = None
        if weather and isinstance(weather, list) and len(weather) > 0:
            w_main = weather[0].get("main")
            w_desc = weather[0].get("description")

        lat = coord[0]
        lon = coord[1]

        row = {
            "lat": lat,
            "lon": lon,
            "timestamp": ts,
            "temp": main.get("temp"),
            "feels_like": main.get("feels_like"),
            "pressure": main.get("pressure"),
            "humidity": main.get("humidity"),
            "wind_speed": (e.get("wind") or {}).get("speed"),
            "weather_main": w_main,
            "weather_description": w_desc,
            "source": "openweather",
            "created_at": datetime.datetime.utcnow(),
        }

        rows.append(row)

    if not rows:
        return {"inserted": 0, "lat": coord[0], "lon": coord[1]}

    try:
        sql = """
        INSERT INTO weather (
            lat,
            lon,
            timestamp,
            temp,
            feels_like,
            pressure,
            humidity,
            wind_speed,
            weather_main,
            weather_description,
            source,
            created_at
        )
        VALUES (
            :lat,
            :lon,
            :timestamp,
            :temp,
            :feels_like,
            :pressure,
            :humidity,
            :wind_speed,
            :weather_main,
            :weather_description,
            :source,
            :created_at
        )
        ON DUPLICATE KEY UPDATE
            temp = VALUES(temp),
            feels_like = VALUES(feels_like),
            pressure = VALUES(pressure),
            humidity = VALUES(humidity),
            wind_speed = VALUES(wind_speed),
            weather_main = VALUES(weather_main),
            weather_description = VALUES(weather_description),
            created_at = VALUES(created_at)
        """

        for row in rows:
            db.execute(text(sql), row)
            inserted += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        log.error("openweather", f"DB error saving forecast rows (by city): {exc}")
        raise

    return {"inserted": inserted, "lat": coord[0], "lon": coord[1]}
