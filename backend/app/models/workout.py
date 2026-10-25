import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamps, UUIDPk


class SetType(StrEnum):
    warmup = "warmup"
    working = "working"


class Workout(UUIDPk, Timestamps, Base):
    __tablename__ = "workouts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)

    sets: Mapped[list["WorkoutSet"]] = relationship(
        back_populates="workout",
        cascade="all, delete-orphan",
        order_by="WorkoutSet.started_at",
    )


class WorkoutSet(UUIDPk, Timestamps, Base):
    __tablename__ = "workout_sets"
    __table_args__ = (Index("ix_sets_exercise_started", "exercise_id", "started_at"),)

    workout_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"), index=True
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id"))
    set_number: Mapped[int] = mapped_column(SmallInteger)
    set_type: Mapped[SetType] = mapped_column(
        Enum(SetType, native_enum=False, length=20), default=SetType.working
    )
    
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    reps: Mapped[int | None] = mapped_column(SmallInteger)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    bodyweight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    rpe: Mapped[Decimal | None] = mapped_column(Numeric(3, 1))

    workout: Mapped["Workout"] = relationship(back_populates="sets")
