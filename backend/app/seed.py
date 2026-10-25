from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Exercise, ExerciseKind

SEED = [
    ("pull-up", "Pull-up", "بارفیکس", ExerciseKind.bodyweight),
    ("weighted-pull-up", "Weighted pull-up", "بارفیکس با وزنه", ExerciseKind.bodyweight),
    ("barbell-row", "Barbell row", "زیربغل هالتر", ExerciseKind.barbell),
    ("lat-pulldown", "Lat pulldown", "لت پول‌داون", ExerciseKind.cable),
    ("bench-press", "Bench press", "پرس سینه هالتر", ExerciseKind.barbell),
    ("overhead-press", "Overhead press", "پرس سرشانه هالتر", ExerciseKind.barbell),
    ("squat", "Barbell squat", "اسکوات هالتر", ExerciseKind.barbell),
    ("deadlift", "Deadlift", "ددلیفت", ExerciseKind.barbell),
]


def run() -> None:
    with SessionLocal() as db:
        existing = set(db.scalars(select(Exercise.slug)))
        for slug, en, fa, kind in SEED:
            if slug not in existing:
                db.add(Exercise(slug=slug, name_en=en, name_fa=fa, kind=kind))
        db.commit()


if __name__ == "__main__":
    run()
