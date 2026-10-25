import uuid

from pydantic import BaseModel, ConfigDict

from app.models.exercise import ExerciseKind


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name_en: str
    name_fa: str
    kind: ExerciseKind
