from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.back.core.security import get_current_user
from src.db import get_db
from src.models.audit_log import AuditLog
from src.models.user import User

router = APIRouter(prefix="/logs")


def _parse_iso(dt_str: str) -> datetime:
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    return datetime.fromisoformat(dt_str)


@router.get("/")
def get_logs(
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current = db.query(User).filter(User.id == user_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Current user not found")
    if current.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    q = db.query(AuditLog)

    if dateFrom:
        try:
            dt_from = _parse_iso(dateFrom)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid dateFrom format")
        q = q.filter(AuditLog.timestamp >= dt_from)

    if dateTo:
        try:
            dt_to = _parse_iso(dateTo)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid dateTo format")
        q = q.filter(AuditLog.timestamp <= dt_to)

    logs = q.order_by(AuditLog.timestamp.desc()).all()

    results = []
    for entry in logs:
        acting = db.query(User).filter(User.id == entry.user_id).first()
        results.append(
            {
                "id": entry.id,
                "user_id": entry.user_id,
                "role": acting.role if acting else None,
                "action": entry.action,
                "timestamp": entry.timestamp.isoformat(),
            }
        )

    return results
