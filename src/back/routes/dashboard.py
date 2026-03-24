from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.back.core.security import get_current_user
from src.back.logger.logger import BackendLogger
from src.db import get_db
from src.models.audit_log import AuditLog
from src.models.dashboard import Dashboard
from src.models.widget import Widget

router = APIRouter(prefix="/api")
log = BackendLogger()


class WidgetCreateRequest(BaseModel):
    type: str
    configuration: dict | None = None
    position: int | None = None
    enabled: bool | None = True

    @field_validator("type")
    @classmethod
    def type_validator(cls, v: str):
        if not v or not isinstance(v, str) or not v.strip():
            raise PydanticCustomError("value_error", "type must be a non-empty string.")
        return v

    @field_validator("configuration")
    @classmethod
    def config_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise PydanticCustomError("value_error", "configuration must be an object.")
        return v

    @field_validator("position")
    @classmethod
    def position_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, int) or v < 1:
            raise PydanticCustomError(
                "value_error", "position must be an integer >= 1."
            )
        return v

    @field_validator("enabled")
    @classmethod
    def enabled_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, bool):
            raise PydanticCustomError("value_error", "enabled must be a boolean.")
        return v


class WidgetsReorderRequest(BaseModel):
    widgets: list[dict]

    @field_validator("widgets")
    @classmethod
    def widgets_array_validator(cls, v):
        if not isinstance(v, list) or not v:
            raise PydanticCustomError(
                "value_error", "widgets must be a non-empty list."
            )
        for item in v:
            if not isinstance(item, dict):
                raise PydanticCustomError(
                    "value_error", "Each widget must be an object."
                )
            if "id" not in item or "position" not in item:
                raise PydanticCustomError(
                    "value_error", "Each widget must have id and position."
                )
            if not isinstance(item["id"], int):
                raise PydanticCustomError("value_error", "id must be an integer.")
            if not isinstance(item["position"], int) or item["position"] < 1:
                raise PydanticCustomError(
                    "value_error", "position must be an integer >= 1."
                )
        return v


def get_widgets_for_dashboard(db: Session, dashboard_id: int):
    return (
        db.query(Widget)
        .filter(Widget.dashboard_id == dashboard_id)
        .order_by(Widget.position)
        .all()
    )


def serialize_widgets(widgets: list[Widget]):
    return [
        {
            "id": w.id,
            "type": w.type,
            "configuration": w.configuration,
            "layout": w.layout,
            "enabled": w.enabled,
            "position": w.position,
        }
        for w in widgets
    ]


class DashboardUpdateRequest(BaseModel):
    slotsCount: int | None = None

    @field_validator("slotsCount")
    @classmethod
    def slots_validator(cls, v: int | None):
        if v is None:
            return v
        if not isinstance(v, int) or v < 1:
            raise PydanticCustomError(
                "value_error", "slotsCount must be a positive integer."
            )
        return v


class DashboardCreateRequest(BaseModel):
    name: str
    slotsCount: int | None = 4

    @field_validator("name")
    @classmethod
    def name_validator(cls, v: str):
        if not v or not isinstance(v, str) or not v.strip():
            raise PydanticCustomError(
                "value_error", "Dashboard name must be a non-empty string."
            )
        return v.strip()

    @field_validator("slotsCount")
    @classmethod
    def slots_validator(cls, v: int | None):
        if v is None:
            return v
        if not isinstance(v, int) or v < 1:
            raise PydanticCustomError(
                "value_error", "slotsCount must be a positive integer."
            )
        return v


@router.post("/dashboards", status_code=201)
def create_dashboard(
    req: DashboardCreateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = Dashboard(
        user_id=user_id,
        name=req.name,
        slots_count=req.slotsCount or 4,
    )

    try:
        db.add(dashboard)
        db.commit()
        db.refresh(dashboard)

        audit = AuditLog(
            user_id=user_id,
            dashboard_id=dashboard.id,
            widget_id=None,
            action="create_dashboard",
        )
        db.add(audit)
        db.commit()

        log.info(
            "create_dashboard",
            f"User {user_id} created dashboard {dashboard.id}",
        )

        return {
            "id": dashboard.id,
            "name": dashboard.name,
            "slotsCount": dashboard.slots_count,
            "created_at": dashboard.created_at.isoformat(),
            "updated_at": dashboard.updated_at.isoformat(),
            "widgets": [],
        }

    except Exception as exc:
        db.rollback()
        log.error("create_dashboard", f"Error: {exc}")
        raise HTTPException(500, "Database error")


# noinspection PyTypeChecker
@router.get("/dashboards")
def list_dashboards(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboards = db.query(Dashboard).filter(Dashboard.user_id == user_id).all()

    result = []
    for d in dashboards:
        widgets = get_widgets_for_dashboard(db, d.id)
        result.append(
            {
                "id": d.id,
                "name": d.name,
                "slotsCount": d.slots_count,
                "created_at": d.created_at.isoformat(),
                "updated_at": d.updated_at.isoformat(),
                "widgets": serialize_widgets(widgets),
            }
        )

    return result


# noinspection PyTypeChecker
@router.get("/dashboards/{dashboard_id}")
def get_dashboard(
    dashboard_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    widgets = get_widgets_for_dashboard(db, dashboard_id)

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slotsCount": dashboard.slots_count,
        "created_at": dashboard.created_at.isoformat(),
        "updated_at": dashboard.updated_at.isoformat(),
        "widgets": serialize_widgets(widgets),
    }


@router.patch("/dashboards/{dashboard_id}")
def update_dashboard(
    dashboard_id: int,
    req: DashboardUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if req.slotsCount is not None:
        dashboard.slots_count = req.slotsCount

    db.commit()
    db.refresh(dashboard)

    return {
        "id": dashboard.id,
        "slotsCount": dashboard.slots_count,
    }


@router.post("/dashboards/{dashboard_id}/widgets", status_code=201)
def create_widget(
    dashboard_id: int,
    req: WidgetCreateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    type_map = {
        "rates": "rates",
        "currency": "rates",
        "currencyfeed": "currencyFeed",
        "news": "news",
        "newsfeed": "newsFeed",
        "history": "history",
        "history_operations": "history",
        "weather": "weather",
    }

    widget_type = (
        type_map.get(req.type) or type_map.get(req.type.lower())
        if isinstance(req.type, str)
        else None
    )

    if not widget_type:
        raise HTTPException(status_code=400, detail="Unsupported widget type")

    config = req.configuration or {}
    if not isinstance(config, dict):
        raise HTTPException(status_code=400, detail="Invalid configuration format")

    if widget_type == "rates":
        currency = config.get("currency")
        from src.back.routes.rates import VALID_CURRENCIES

        if currency and currency not in VALID_CURRENCIES:
            raise HTTPException(status_code=400, detail="Unsupported currency")

    if widget_type in ("news", "newsFeed"):
        category = config.get("category")
        if not category:
            raise HTTPException(
                status_code=400, detail="'category' is required for news widget"
            )

    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if req.position is None:
        max_pos = (
            db.query(Widget.position)
            .filter(Widget.dashboard_id == dashboard_id)
            .order_by(Widget.position.desc())
            .limit(1)
            .first()
        )
        next_pos = (max_pos[0] + 1) if max_pos else 1
    else:
        if req.position < 1:
            raise HTTPException(status_code=400, detail="Position must be >= 1")
        next_pos = req.position

    enabled = bool(req.enabled) if req.enabled is not None else True

    # If client requested a specific position and that position is already occupied,
    # shift existing widgets at or after next_pos to the right to avoid collisions.
    if req.position is not None:
        occupied = (
            db.query(Widget)
            .filter(Widget.dashboard_id == dashboard_id, Widget.position == next_pos)
            .first()
        )
        if occupied:
            widgets_to_shift = (
                db.query(Widget)
                .filter(
                    Widget.dashboard_id == dashboard_id, Widget.position >= next_pos
                )
                .order_by(Widget.position.desc())
                .all()
            )
            for w in widgets_to_shift:
                w.position = w.position + 1
            db.commit()

    widget = Widget(
        dashboard_id=dashboard_id,
        type=widget_type,
        configuration=config,
        position=next_pos,
        enabled=enabled,
    )

    try:
        db.add(widget)
        db.commit()
        db.refresh(widget)

        audit = AuditLog(
            user_id=user_id,
            dashboard_id=dashboard_id,
            widget_id=widget.id,
            action="create_widget",
        )
        db.add(audit)
        db.commit()

        log.info(
            "create_widget",
            f"User {user_id} created widget {widget.id} on dashboard {dashboard_id}",
        )

        return {
            "id": widget.id,
            "type": widget.type,
            "configuration": widget.configuration,
            "enabled": widget.enabled,
            "position": widget.position,
        }
    except Exception as exc:
        db.rollback()
        log.error("create_widget", f"Error creating widget: {exc}")
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc


@router.delete("/dashboards/{dashboard_id}/widgets/{widget_id}")
def delete_widget(
    dashboard_id: int,
    widget_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    widget = (
        db.query(Widget)
        .filter(Widget.id == widget_id, Widget.dashboard_id == dashboard_id)
        .first()
    )
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    # Delete widget and leave its slot empty. We do not shift other widgets —
    # this preserves empty slots so UI can show an empty slot after deletion.
    db.delete(widget)

    audit = AuditLog(
        user_id=user_id,
        dashboard_id=dashboard_id,
        widget_id=widget_id,
        action="delete_widget",
    )
    db.add(audit)

    db.commit()

    return {"status": "ok"}


class WidgetUpdateRequest(BaseModel):
    configuration: dict | None = None
    layout: dict | None = None

    @field_validator("configuration")
    @classmethod
    def configuration_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise PydanticCustomError("value_error", "configuration must be an object.")
        return v

    @field_validator("layout")
    @classmethod
    def layout_validator(cls, v):
        if v is None:
            return v
        if not isinstance(v, dict):
            raise PydanticCustomError("value_error", "layout must be an object.")
        return v


@router.patch("/widgets/{widget_id}")
def update_widget(
    widget_id: int,
    req: WidgetUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widget = db.query(Widget).filter(Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(404, "Widget not found")

    dashboard = db.query(Dashboard).filter(Dashboard.id == widget.dashboard_id).first()
    if not dashboard:
        raise HTTPException(404, "Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(403, "Forbidden")

    if req.configuration is not None:
        widget.configuration = req.configuration

    if req.layout is not None:
        widget.layout = req.layout

    db.commit()
    db.refresh(widget)

    return {
        "id": widget.id,
        "configuration": widget.configuration,
        "layout": widget.layout,
    }


@router.patch("/dashboards/{dashboard_id}/widgets/reorder")
def reorder_widgets(
    dashboard_id: int,
    req: WidgetsReorderRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    ids = [item["id"] for item in req.widgets]
    widgets = (
        db.query(Widget)
        .filter(Widget.dashboard_id == dashboard_id, Widget.id.in_(ids))
        .all()
    )

    if len(widgets) != len(ids):
        raise HTTPException(
            status_code=400, detail="One or more widgets not found on this dashboard"
        )

    id_to_widget = {w.id: w for w in widgets}
    for item in req.widgets:
        wid = item["id"]
        pos = item["position"]
        w = id_to_widget.get(wid)
        if w:
            w.position = pos

            audit = AuditLog(
                user_id=user_id,
                dashboard_id=dashboard_id,
                widget_id=wid,
                action="reorder",
            )
            db.add(audit)

    db.commit()

    return {"status": "ok"}


@router.delete("/dashboards/{dashboard_id}")
def delete_dashboard(
    dashboard_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    dashboards_count = (
        db.query(func.count(Dashboard.id)).filter(Dashboard.user_id == user_id).scalar()
    )

    if dashboards_count <= 1:
        raise HTTPException(
            status_code=400,
            detail="Nie można usunąć ostatniego dashboardu",
        )

    # Usuń najpierw wszystkie widgety powiązane z dashboardem
    widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard_id).all()
    for widget in widgets:
        db.delete(widget)

    audit = AuditLog(
        user_id=user_id,
        dashboard_id=dashboard_id,
        widget_id=None,
        action="delete_dashboard",
    )
    db.add(audit)

    db.delete(dashboard)
    db.commit()

    return {"status": "ok"}
