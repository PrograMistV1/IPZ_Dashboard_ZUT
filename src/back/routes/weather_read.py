import datetime

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.back.logger.logger import BackendLogger
from src.back.services.openweather_service import fetch_and_store_forecast, geocode_city
from src.db import get_db
from src.models.weather import Weather

router = APIRouter(prefix="/api")
log = BackendLogger()


@router.get("/geocode/reverse")
def reverse_geocode_endpoint(lat: float, lon: float):
    try:
        from src.back.services.openweather_service import reverse_geocode

        name = reverse_geocode(lat, lon)
        if not name:
            return {"name": None}
        return {"name": name}
    except (RuntimeError, ImportError):
        return {"name": None}


@router.get("/weather")
def get_weather(
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    city: str | None = Query(None, description="City name (e.g. Warsaw)"),
    date: str | None = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    try:
        if date:
            ds = date
            if "T" in ds and ds.endswith("Z"):
                ds = ds[:-1]
            if "T" in ds:
                target = datetime.datetime.fromisoformat(ds).date()
            else:
                target = datetime.date.fromisoformat(ds)
        else:
            target = datetime.datetime.utcnow().date()
    except Exception as exc:
        try:
            import re

            if date:
                m = re.search(r"\d{4}-\d{2}-\d{2}", str(date))
                if m:
                    target = datetime.date.fromisoformat(m.group(0))
                else:
                    raise
            else:
                raise
        except Exception:
            raise HTTPException(
                status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
            ) from exc

    # Resolve coordinates: prefer explicit lat/lon, then city geocoding
    resolved_lat = lat
    resolved_lon = lon
    if city and (resolved_lat is None or resolved_lon is None):
        geo = geocode_city(city)
        if not geo:
            # try forecast by city name as a fallback
            try:
                from src.back.services.openweather_service import (
                    fetch_and_store_forecast_by_city,
                )

                fb = fetch_and_store_forecast_by_city(db, city, target, target)
                if not fb or fb.get("inserted", 0) == 0:
                    raise HTTPException(
                        status_code=404,
                        detail="City not found or no forecast available",
                    )
                # use returned coords if available
                resolved_lat = fb.get("lat")
                resolved_lon = fb.get("lon")
                if resolved_lat is None or resolved_lon is None:
                    # still allow query but will likely not match DB; return empty
                    resolved_lat = 0.0
                    resolved_lon = 0.0
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(
                    status_code=503, detail="Failed to fetch weather for city"
                )
        else:
            resolved_lat, resolved_lon = geo

    if resolved_lat is None or resolved_lon is None:
        raise HTTPException(status_code=400, detail="Provide either lat+lon or city")

    rows = (
        db.query(Weather)
        .filter(
            func.abs(Weather.lat - resolved_lat) < 0.00001,
            func.abs(Weather.lon - resolved_lon) < 0.00001,
            func.date(Weather.timestamp) == target,
        )
        .order_by(Weather.timestamp)
        .all()
    )

    # If we have data in DB return it
    if rows:
        return [
            {
                "timestamp": r.timestamp.isoformat(),
                "temp": r.temp,
                "feels_like": r.feels_like,
                "pressure": r.pressure,
                "humidity": r.humidity,
                "wind_speed": r.wind_speed,
                "weather_main": r.weather_main,
                "weather_description": r.weather_description,
                "source": "database",
            }
            for r in rows
        ]

    # No data — try to fetch from OpenWeather and store
    try:
        fetch_and_store_forecast(db, resolved_lat, resolved_lon, target, target)
    except Exception as exc:
        log.exception("fetch_and_store_forecast failed", exc_info=exc)
        raise HTTPException(
            status_code=503, detail="Failed to fetch weather from upstream"
        ) from exc

    # Re-query after fetch
    rows = (
        db.query(Weather)
        .filter(
            func.abs(Weather.lat - resolved_lat) < 0.00001,
            func.abs(Weather.lon - resolved_lon) < 0.00001,
            func.date(Weather.timestamp) == target,
        )
        .order_by(Weather.timestamp)
        .all()
    )

    return [
        {
            "timestamp": r.timestamp.isoformat(),
            "temp": r.temp,
            "feels_like": r.feels_like,
            "pressure": r.pressure,
            "humidity": r.humidity,
            "wind_speed": r.wind_speed,
            "weather_main": r.weather_main,
            "weather_description": r.weather_description,
            "source": "api",
        }
        for r in rows
    ]
