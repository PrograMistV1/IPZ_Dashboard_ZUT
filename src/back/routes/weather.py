import datetime

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from src.back.logger.logger import BackendLogger
from src.back.services.openweather_service import fetch_and_store_forecast
from src.db import get_db

router = APIRouter(prefix="/api")
log = BackendLogger()


@router.get("/weather/fetch")
def fetch_weather(
    lat: float = Query(...),
    lon: float = Query(...),
    start: str | None = Query(None, description="YYYY-MM-DD"),
    end: str | None = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    log.info(
        "weather_endpoint",
        f"Fetch weather request: lat={lat}, lon={lon}, start={start}, end={end}",
    )

    # Validate latitude and longitude ranges
    if lat < -90 or lat > 90:
        log.error(
            "weather_endpoint", f"Invalid latitude: {lat}. Must be between -90 and 90"
        )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid 'lat' parameter: {lat}. Latitude must be between -90 and 90",
        )

    if lon < -180 or lon > 180:
        log.error(
            "weather_endpoint",
            f"Invalid longitude: {lon}. Must be between -180 and 180",
        )
        raise HTTPException(
            status_code=400,
            detail=f"Invalid 'lon' parameter: {lon}. Longitude must be between -180 and 180",
        )

    try:
        if start:
            try:
                start_date = datetime.datetime.fromisoformat(start).date()
            except ValueError as exc:
                log.error(
                    "weather_endpoint",
                    f"Invalid start date format: {start}, error: {exc}",
                )
                raise ValueError(
                    f"Invalid 'start' parameter: '{start}'. Expected format: YYYY-MM-DD"
                ) from exc
        else:
            start_date = (
                datetime.datetime.now(datetime.timezone.utc)
                - datetime.timedelta(days=1)
            ).date()

        if end:
            try:
                end_date = datetime.datetime.fromisoformat(end).date()
            except ValueError as exc:
                log.error(
                    "weather_endpoint", f"Invalid end date format: {end}, error: {exc}"
                )
                raise ValueError(
                    f"Invalid 'end' parameter: '{end}'. Expected format: YYYY-MM-DD"
                ) from exc
        else:
            end_date = start_date
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        # Use forecast endpoint (free) for future dates
        result = fetch_and_store_forecast(db, lat, lon, start_date, end_date)
    except RuntimeError as exc:
        log.error("weather_endpoint", f"Runtime error fetching weather: {exc}")
        raise HTTPException(
            status_code=500, detail="Unable to process weather request"
        ) from exc
    except Exception as exc:
        log.error("weather_endpoint", f"Error fetching weather: {exc}")
        raise HTTPException(
            status_code=502, detail="Error fetching data from OpenWeather"
        ) from exc

    return result
