import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Exercise, SetType, User, Workout, WorkoutSet
from app.schemas.exercise import ExerciseOut
from app.schemas.progress import ProgressPoint

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseOut])
def list_exercises(db: Session = Depends(get_db)):
    return db.scalars(select(Exercise).order_by(Exercise.name_en)).all()


@router.get("/{exercise_id}/progress", response_model=list[ProgressPoint])
def exercise_progress(
    exercise_id: uuid.UUID,
    days: int | None = Query(None, ge=1, le=3650),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(WorkoutSet, Workout.started_at)
        .join(Workout, WorkoutSet.workout_id == Workout.id)
        .where(
            Workout.user_id == user.id,
            WorkoutSet.exercise_id == exercise_id,
            WorkoutSet.set_type == SetType.working,
            WorkoutSet.ended_at.is_not(None),
            WorkoutSet.reps.is_not(None),
        )
        .order_by(Workout.started_at, WorkoutSet.started_at)
    )
    if days is not None:
        stmt = stmt.where(
            Workout.started_at >= datetime.now(UTC) - timedelta(days=days)
        )

    sessions: dict[uuid.UUID, tuple[datetime, list[WorkoutSet]]] = {}
    for s, started_at in db.execute(stmt):
        sessions.setdefault(s.workout_id, (started_at, []))[1].append(s)

    points = []
    for workout_id, (started_at, sets) in sessions.items():
        weights = [float(s.weight_kg or 0) for s in sets]
        top = max(weights)
 
        est = max(
            (float(s.weight_kg or 0) + float(s.bodyweight_kg or 0)) * (1 + s.reps / 30)
            for s in sets
        )
        points.append(
            ProgressPoint(
                workout_id=workout_id,
                date=started_at,
                sets=len(sets),
                top_weight_kg=top,
                top_reps=max(s.reps for s, w in zip(sets, weights) if w == top),
                est_1rm_kg=round(est, 1),
                volume=round(sum(w * s.reps for s, w in zip(sets, weights)), 1),
            )
        )
    return points
