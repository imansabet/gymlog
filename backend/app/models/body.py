import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamps, UUIDPk


class BodyMeasurement(UUIDPk, Timestamps, Base):
    __tablename__ = "body_measurements"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    chest_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    waist_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    arm_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    thigh_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
