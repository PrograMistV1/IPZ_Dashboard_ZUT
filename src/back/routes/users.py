from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.back.core.security import get_current_user
from src.db import get_db
from src.models.user import User

router = APIRouter(prefix="/users")


@router.get("/")
def list_users(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    current = db.query(User).filter(User.id == user_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Current user not found")
    if current.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    users = db.query(User).all()

    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "isEnabled": bool(u.is_enabled),
        }
        for u in users
    ]
