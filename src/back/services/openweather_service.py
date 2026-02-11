import datetime

import requests
from sqlalchemy import text, func

from src.back.core.config import (
    OPENWEATHER_API_KEY,
    OPENWEATHER_BASE_URL,
    OPENWEATHER_CACHE_TTL_MINUTES,
)
from src.back.logger.logger import BackendLogger
from src.models.weather import Weather

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

    # DB-based cache: if we have a recent row for the same lat/lon AND
    # there are records for all requested dates, return cached.
    try:
        now = datetime.datetime.utcnow()
        ttl = datetime.timedelta(minutes=int(OPENWEATHER_CACHE_TTL_MINUTES))
        latest = (
            db.query(Weather)
            .filter(
                func.abs(Weather.lat - lat) < 0.00001,
                func.abs(Weather.lon - lon) < 0.00001,
            )
            .order_by(Weather.created_at.desc())
            .first()
        )
        if latest and (now - latest.created_at) < ttl:
            # check that we have data for every date in [start_date, end_date]
            expected_days = (end_date - start_date).days + 1
            count_dates = (
                db.query(func.count(func.distinct(func.date(Weather.timestamp))))
                .filter(
                    func.abs(Weather.lat - lat) < 0.00001,
                    func.abs(Weather.lon - lon) < 0.00001,
                    func.date(Weather.timestamp) >= start_date,
                    func.date(Weather.timestamp) <= end_date,
                )
                .scalar()
            )
            try:
                count_dates = int(count_dates or 0)
            except Exception:
                count_dates = 0

            if count_dates >= expected_days:
                return {
                    "cached": True,
                    "source": "database",
                    "cached_at": getattr(
                        latest.created_at, "isoformat", lambda: str(latest.created_at)
                    )(),
                    "available_days": count_dates,
                }
    except Exception as exc:
        log.error("openweather", f"Cache check failed: {exc}")

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
        return {"inserted": 0, "source": "openweather_api"}

    try:
        sql = (
            "INSERT INTO weather"
            " (lat, lon, timestamp, temp, feels_like, pressure, humidity, "
            "wind_speed, weather_main, weather_description, source, created_at)"
            " VALUES (:lat, :lon, :timestamp, :temp, :feels_like, :pressure, :humidity, "
            " :wind_speed, :weather_main, :weather_description, :source, :created_at)"
            " ON DUPLICATE KEY UPDATE temp = VALUES(temp), feels_like = VALUES(feels_like),"
            " pressure = VALUES(pressure), humidity = VALUES(humidity),"
            " wind_speed = VALUES(wind_speed), weather_main = VALUES(weather_main),"
            " weather_description = VALUES(weather_description), created_at = VALUES(created_at)"
        )

        for row in rows:
            db.execute(text(sql), row)
            inserted += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        log.error("openweather", f"DB error saving forecast rows: {exc}")
        raise

    return {"inserted": inserted, "source": "openweather_api"}
