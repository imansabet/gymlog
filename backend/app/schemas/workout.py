import uuid
from datetime import datetime

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    model_validator,
)

from app.models.workout import SetType


class WorkoutCreate(BaseModel):
    id: uuid.UUID | None = None
    started_at: AwareDatetime | None = None
    notes: str | None = Field(None, max_length=2000)


class WorkoutUpdate(BaseModel):
    ended_at: AwareDatetime | None = None
    notes: str | None = Field(None, max_length=2000)


class SetCreate(BaseModel):
    id: uuid.UUID | None = None
    exercise_id: uuid.UUID
    set_type: SetType = SetType.working
    started_at: AwareDatetime | None = None
    weight_kg: float | None = Field(None, ge=0, le=1000)
    bodyweight_kg: float | None = Field(None, ge=0, le=500)
    reps: int | None = Field(None, ge=0, le=1000)


class SetUpdate(BaseModel):
    set_type: SetType | None = None
    ended_at: AwareDatetime | None = None
    weight_kg: float | None = Field(None, ge=0, le=1000)
    bodyweight_kg: float | None = Field(None, ge=0, le=500)
    reps: int | None = Field(None, ge=0, le=1000)
    rpe: float | None = Field(None, ge=1, le=10)


class WorkoutSetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workout_id: uuid.UUID
    exercise_id: uuid.UUID
    set_number: int
    set_type: SetType
    started_at: datetime
    ended_at: datetime | None
    reps: int | None
    weight_kg: float | None
    bodyweight_kg: float | None
    rpe: float | None
    rest_before_s: int | None = None  # فقط داخل WorkoutOut پر می‌شه

    @computed_field
    @property
    def duration_s(self) -> int | None:
        if self.ended_at is None:
            return None
        return int((self.ended_at - self.started_at).total_seconds())


class WorkoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    started_at: datetime
    ended_at: datetime | None
    notes: str | None
    sets: list[WorkoutSetOut] = []

    @model_validator(mode="after")
    def fill_rest(self) -> "WorkoutOut":
        prev_end = None
        for s in self.sets:
            if prev_end is not None:
                s.rest_before_s = max(0, int((s.started_at - prev_end).total_seconds()))
            prev_end = s.ended_at
        return self
