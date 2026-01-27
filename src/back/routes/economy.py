from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.back.core.security import get_current_user
from src.back.logger.logger import BackendLogger
from src.db import get_db
from src.models.economy_config import EconomyConfig

router = APIRouter(prefix="/api")
log = BackendLogger()


class EconomyConfigCreateRequest(BaseModel):
    name: str
    configuration: dict | None = None

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str):
        if not v or not isinstance(v, str) or not v.strip():
            raise PydanticCustomError("value_error", "Name must be provided")
        return v.strip()

    @field_validator("configuration")
    @classmethod
    def config_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise PydanticCustomError("value_error", "configuration must be an object")
        return v


class EconomyConfigUpdateRequest(BaseModel):
    configuration: dict | None = None

    @field_validator("configuration")
    @classmethod
    def config_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise PydanticCustomError("value_error", "configuration must be an object")
        return v


@router.get("/economy/configs")
def list_configs(
    user_id: int = Depends(get_current_user), db: Session = Depends(get_db)
):
    configs = (
        db.query(EconomyConfig)
        .filter(EconomyConfig.user_id == user_id)
        .order_by(EconomyConfig.updated_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "name": c.name,
            "configuration": c.configuration,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        }
        for c in configs
    ]


@router.post("/economy/configs", status_code=201)
def create_config(
    req: EconomyConfigCreateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = EconomyConfig(user_id=user_id, name=req.name, configuration=req.configuration)
    try:
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
        log.info(
            "create_economy_config", f"User {user_id} created economy config {cfg.id}"
        )
        return {"id": cfg.id, "name": cfg.name, "configuration": cfg.configuration}
    except IntegrityError as exc:
        db.rollback()
        log.error("create_economy_config", f"IntegrityError: {exc}")
        raise HTTPException(
            status_code=400,
            detail="Invalid data: configuration already exists or violates constraints",
        )

    except SQLAlchemyError as exc:
        db.rollback()
        log.error("create_economy_config", f"Database error: {exc}")
        raise HTTPException(status_code=500, detail="Database operation failed")


@router.get("/economy/configs/{config_id}")
def get_config(
    config_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = db.query(EconomyConfig).filter(EconomyConfig.id == config_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    if cfg.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"id": cfg.id, "name": cfg.name, "configuration": cfg.configuration}


@router.patch("/economy/configs/{config_id}")
def update_config(
    config_id: int,
    req: EconomyConfigUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cfg = db.query(EconomyConfig).filter(EconomyConfig.id == config_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Config not found")
    if cfg.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        if req.configuration is not None:
            cfg.configuration = req.configuration

        db.commit()
        db.refresh(cfg)

        return {
            "id": cfg.id,
            "name": cfg.name,
            "configuration": cfg.configuration,
        }

    except SQLAlchemyError as exc:
        db.rollback()
        log.error("update_economy_config", f"Database error: {exc}")
        raise HTTPException(status_code=500, detail="Database operation failed")
