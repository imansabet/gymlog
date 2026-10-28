from sqlalchemy import select

from app.db.session import SessionLocal
from app.models import Exercise, ExerciseKind

K = ExerciseKind

SEED = [
  
    ("squat", "Back squat", "اسکوات هالتر (پشت)", K.barbell),
    ("front-squat", "Front squat", "اسکوات جلو", K.barbell),
    ("bench-press", "Bench press", "پرس سینه هالتر", K.barbell),
    ("close-grip-bench-press", "Close-grip bench press", "پرس سینه دست‌جمع", K.barbell),
    ("overhead-press", "Strict press (overhead press)", "پرس سرشانه هالتر", K.barbell),
    ("push-press", "Push press", "پوش پرس", K.barbell),
    ("deadlift", "Deadlift", "ددلیفت", K.barbell),
    ("romanian-deadlift", "Romanian deadlift", "ددلیفت رومانیایی", K.barbell),
    ("power-clean", "Power clean", "پاور کلین", K.barbell),
    ("barbell-row", "Barbell row", "زیربغل هالتر", K.barbell),
    ("thruster", "Thruster", "ثراستر", K.barbell),
   
    ("dumbbell-bench-press", "Dumbbell bench press", "پرس سینه دمبل", K.dumbbell),
    ("incline-dumbbell-press", "Incline dumbbell press", "پرس بالاسینه دمبل", K.dumbbell),
    ("dumbbell-overhead-press", "Dumbbell overhead press", "پرس سرشانه دمبل", K.dumbbell),
    ("arnold-press", "Arnold press", "پرس آرنولد", K.dumbbell),
    ("lateral-raise", "Lateral raise", "نشر از جانب", K.dumbbell),
    ("biceps-curl", "Biceps curl", "جلو بازو", K.dumbbell),
    ("dumbbell-clean", "Dumbbell clean", "کلین با دمبل", K.dumbbell),
    ("dumbbell-snatch", "Dumbbell snatch", "اسنچ با دمبل", K.dumbbell),
    ("bulgarian-split-squat", "Bulgarian split squat", "اسکوات بلغاری", K.dumbbell),
    ("lunges", "Lunges", "لانج", K.dumbbell),
    
    ("lat-pulldown", "Lat pulldown", "لت پول‌داون", K.cable),
    ("seated-cable-row", "Seated cable row", "زیربغل سیم‌کش نشسته", K.cable),
    ("face-pull", "Face pull", "فیس پول", K.cable),
    ("triceps-pushdown", "Triceps pushdown", "پشت بازو سیم‌کش", K.cable),
    ("chest-supported-row", "Chest-supported row", "زیربغل با تکیه‌گاه سینه", K.machine),
    
    ("pull-up", "Pull-up", "بارفیکس", K.bodyweight),
    ("weighted-pull-up", "Weighted pull-up", "بارفیکس با وزنه", K.bodyweight),
    ("dips", "Dips", "دیپ", K.bodyweight),
    ("push-up", "Push-up", "شنا", K.bodyweight),
    ("inverted-row", "Inverted row", "اینورتد رو", K.bodyweight),
    ("hanging-knee-raise", "Hanging knee raise", "بالا آوردن زانو در آویزان", K.bodyweight),
    ("ab-wheel", "Ab wheel", "چرخ شکم", K.bodyweight),
    ("burpee", "Burpee", "برپی", K.bodyweight),
    ("box-jump", "Box jump", "پرش روی جعبه", K.bodyweight),
    ("step-up", "Step-up", "استپ‌آپ", K.bodyweight),
  
    ("kettlebell-swing", "Kettlebell swing", "کتل‌بل سوئینگ", K.kettlebell),
    ("band-pull-apart", "Band pull-apart", "باند پول‌اپارت", K.band),
]


def run() -> None:
    with SessionLocal() as db:
        existing = {e.slug: e for e in db.scalars(select(Exercise))}
        for slug, en, fa, kind in SEED:
            ex = existing.get(slug)
            if ex is None:
                db.add(Exercise(slug=slug, name_en=en, name_fa=fa, kind=kind))
            else:
                ex.name_en, ex.name_fa, ex.kind = en, fa, kind
        db.commit()


if __name__ == "__main__":
    run()
