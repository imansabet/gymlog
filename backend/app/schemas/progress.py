import uuid
from datetime import datetime

from pydantic import BaseModel


class ProgressPoint(BaseModel):
    workout_id: uuid.UUID
    date: datetime
    sets: int
    top_weight_kg: float
    top_reps: int 
    est_1rm_kg: float
    volume: float
