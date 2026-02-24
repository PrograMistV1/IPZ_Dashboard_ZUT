from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from src.back.core.security import get_current_user
from src.back.logger.logger import BackendLogger
from src.back.routes.utils import config_to_dict
from src.back.services.openweather_service import geocode_city
from src.db import get_db
from src.models.weather_config import WeatherConfig

router = APIRouter(prefix="/api")
log = BackendLogger()


def _validate_configuration(v: dict | None) -> dict | None:
    """Validate the configuration field."""
    if v is None:
        return v
    if not isinstance(v, dict):
        raise PydanticCustomError("value_error", "configuration must be an object")
    return v


def _geocode_city_to_coords(city_name: str) -> tuple[float, float] | None:
    """Geocode a city name to coordinates. Returns (lat, lon) or None."""
    try:
        return geocode_city(city_name)
    except (ValueError, TypeError, KeyError, ConnectionError, TimeoutError):
        return None


def _get_user_config(config_id: int, user_id: int, db: Session) -> WeatherConfig:
    """Retrieve a config by ID and verify user access."""
    cfg: WeatherConfig | None = (
        db.query(WeatherConfig).filter(WeatherConfig.id == config_id).first()
    )
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    if cfg.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return cfg


class WeatherConfigCreateRequest(BaseModel):
    name: str
    configuration: dict | None = None

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            raise PydanticCustomError("value_error", "Name must be provided")
        return v.strip()

    @field_validator("configuration")
    @classmethod
    def config_validator(cls, v: dict | None) -> dict | None:
        return _validate_configuration(v)


class WeatherConfigUpdateRequest(BaseModel):
    configuration: dict | None = None

    @field_validator("configuration")
    @classmethod
    def config_validator(cls, v: dict | None) -> dict | None:
        return _validate_configuration(v)


@router.get("/weather/configs")
def list_configs(
    user_id: int = Depends(get_current_user), db: Session = Depends(get_db)
):
    configs = (
        db.query(WeatherConfig)
        .filter(WeatherConfig.user_id == user_id)
        .order_by(WeatherConfig.updated_at.desc())
        .all()
    )
    return [config_to_dict(c) for c in configs]


@router.post("/weather/configs", status_code=201)
def create_config(
    req: WeatherConfigCreateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg_data = req.configuration or {}
    # If user supplied a city, geocode it and store only coordinates
    if "city" in cfg_data:
        city_name = cfg_data.get("city")
        geo = _geocode_city_to_coords(city_name)
        if not geo:
            raise HTTPException(
                status_code=400, detail="City not found or geocoding failed"
            )
        lat, lon = geo
        cfg_data = {"lat": lat, "lon": lon}

    cfg = WeatherConfig(user_id=user_id, name=req.name, configuration=cfg_data)
    try:
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
        log.info(
            "create_weather_config", f"User {user_id} created weather config {cfg.id}"
        )
        return {"id": cfg.id, "name": cfg.name, "configuration": cfg.configuration}
    except IntegrityError as exc:
        db.rollback()
        log.error("create_weather_config", f"IntegrityError: {exc}")
        raise HTTPException(
            status_code=400,
            detail="Invalid data: configuration already exists or violates constraints",
        )
    except SQLAlchemyError as exc:
        db.rollback()
        log.error("create_weather_config", f"Database error: {exc}")
        raise HTTPException(status_code=500, detail="Database operation failed")


@router.get("/weather/configs/{config_id}")
def get_config(
    config_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = _get_user_config(config_id, user_id, db)
    return {"id": cfg.id, "name": cfg.name, "configuration": cfg.configuration}


@router.patch("/weather/configs/{config_id}")
def update_config(
    config_id: int,
    req: WeatherConfigUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = _get_user_config(config_id, user_id, db)
    try:
        if req.configuration is not None:
            # merge incoming configuration into existing one so we don't lose lat/lon
            existing = cfg.configuration or {}
            merged = dict(existing)

            incoming = req.configuration or {}
            # If incoming has 'city', geocode and replace with coords only
            if "city" in incoming:
                city_name = incoming.get("city")
                geo = _geocode_city_to_coords(city_name)
                if geo:
                    lat, lon = geo
                    merged.update({"lat": lat, "lon": lon})
                # if geocoding fails, keep existing coords and do not overwrite
            else:
                # overlay other provided keys (but avoid storing 'city' if present elsewhere)
                for k, v in incoming.items():
                    if k != "city":
                        merged[k] = v

            cfg.configuration = merged

        db.commit()
        db.refresh(cfg)

        return {
            "id": cfg.id,
            "name": cfg.name,
            "configuration": cfg.configuration,
        }
    except SQLAlchemyError as exc:
        db.rollback()
        log.error("update_weather_config", f"Database error: {exc}")
        raise HTTPException(status_code=500, detail="Database operation failed")
