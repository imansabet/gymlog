from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import User

DEFAULT_EMAIL = "owner@gymlog.local"


def get_current_user(db: Session = Depends(get_db)) -> User:
    user = db.scalar(select(User).where(User.email == DEFAULT_EMAIL))
    if user is None:
        user = User(email=DEFAULT_EMAIL)
        db.add(user)
        db.commit()
    return user
