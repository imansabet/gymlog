import uuid
from enum import StrEnum

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, UUIDPk


class ExerciseKind(StrEnum):
    barbell = "barbell"
    dumbbell = "dumbbell"
    machine = "machine"
    cable = "cable"
    bodyweight = "bodyweight"


class Exercise(UUIDPk, Timestamps, Base):
    __tablename__ = "exercises"

    slug: Mapped[str] = mapped_column(String(80), unique=True)
    name_en: Mapped[str] = mapped_column(String(120))
    name_fa: Mapped[str] = mapped_column(String(120))
    kind: Mapped[ExerciseKind] = mapped_column(
        Enum(ExerciseKind, native_enum=False, length=20)
    )
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
