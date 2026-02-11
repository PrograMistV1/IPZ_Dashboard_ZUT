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

    try:
        if start:
            start_date = datetime.datetime.fromisoformat(start).date()
        else:
            start_date = (
                datetime.datetime.utcnow() - datetime.timedelta(days=1)
            ).date()

        if end:
            end_date = datetime.datetime.fromisoformat(end).date()
        else:
            end_date = start_date
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
        ) from exc

    try:
        # Use forecast endpoint (free) for future dates
        result = fetch_and_store_forecast(db, lat, lon, start_date, end_date)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        log.error("weather_endpoint", f"Error fetching weather: {exc}")
        raise HTTPException(
            status_code=502, detail="Error fetching data from OpenWeather"
        ) from exc

    return result
