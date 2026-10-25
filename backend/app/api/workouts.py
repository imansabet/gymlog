import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Exercise, User, Workout, WorkoutSet
from app.schemas.workout import (
    SetCreate,
    SetUpdate,
    WorkoutCreate,
    WorkoutOut,
    WorkoutSetOut,
    WorkoutUpdate,
)

router = APIRouter(tags=["workouts"])


def _own_workout(db: Session, user: User, workout_id: uuid.UUID) -> Workout:
    w = db.scalar(
        select(Workout).where(Workout.id == workout_id, Workout.user_id == user.id)
    )
    if w is None:
        raise HTTPException(404, "Workout not found")
    return w


def _check_order(started_at: datetime, ended_at: datetime | None) -> None:
    if ended_at is not None and ended_at < started_at:
        raise HTTPException(422, "ended_at cannot be before started_at")


@router.post("/workouts", response_model=WorkoutOut, status_code=201)
def start_workout(
    body: WorkoutCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.id is not None:
        existing = db.get(Workout, body.id)
        if existing is not None:
            if existing.user_id != user.id:
                raise HTTPException(409, "ID already in use")
            return existing  # idempotent
    w = Workout(
        id=body.id or uuid.uuid4(),
        user_id=user.id,
        started_at=body.started_at or datetime.now(UTC),
        notes=body.notes,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.get("/workouts", response_model=list[WorkoutOut])
def list_workouts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = (
        select(Workout)
        .where(Workout.user_id == user.id)
        .options(selectinload(Workout.sets))
        .order_by(Workout.started_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return db.scalars(stmt).all()


@router.get("/workouts/{workout_id}", response_model=WorkoutOut)
def get_workout(
    workout_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _own_workout(db, user, workout_id)


@router.patch("/workouts/{workout_id}", response_model=WorkoutOut)
def update_workout(
    workout_id: uuid.UUID,
    body: WorkoutUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    w = _own_workout(db, user, workout_id)
    data = body.model_dump(exclude_unset=True)
    _check_order(w.started_at, data.get("ended_at", w.ended_at))
    for key, value in data.items():
        setattr(w, key, value)
    db.commit()
    db.refresh(w)
    return w


@router.post(
    "/workouts/{workout_id}/sets", response_model=WorkoutSetOut, status_code=201
)
def start_set(
    workout_id: uuid.UUID,
    body: SetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    w = _own_workout(db, user, workout_id)
    if body.id is not None:
        existing = db.get(WorkoutSet, body.id)
        if existing is not None:
            if existing.workout_id != w.id:
                raise HTTPException(409, "ID already in use")
            return existing  # idempotent
    if db.get(Exercise, body.exercise_id) is None:
        raise HTTPException(422, "Unknown exercise")
    next_number = db.scalar(
        select(func.coalesce(func.max(WorkoutSet.set_number), 0) + 1).where(
            WorkoutSet.workout_id == w.id,
            WorkoutSet.exercise_id == body.exercise_id,
        )
    )
    s = WorkoutSet(
        id=body.id or uuid.uuid4(),
        workout_id=w.id,
        exercise_id=body.exercise_id,
        set_number=next_number,
        set_type=body.set_type,
        started_at=body.started_at or datetime.now(UTC),
        weight_kg=body.weight_kg,
        bodyweight_kg=body.bodyweight_kg,
        reps=body.reps,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/sets/{set_id}", response_model=WorkoutSetOut)
def update_set(
    set_id: uuid.UUID,
    body: SetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    s = db.scalar(
        select(WorkoutSet)
        .join(Workout)
        .where(WorkoutSet.id == set_id, Workout.user_id == user.id)
    )
    if s is None:
        raise HTTPException(404, "Set not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("set_type") is None:
        data.pop("set_type", None)
    _check_order(s.started_at, data.get("ended_at", s.ended_at))
    for key, value in data.items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return s
