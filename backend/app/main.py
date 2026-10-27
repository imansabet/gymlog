from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api import exercises, workouts
from app.db.session import get_db

app = FastAPI(title="GymLog API")
app.include_router(exercises.router)
app.include_router(workouts.router) 

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/ready")
def ready(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ready"}
