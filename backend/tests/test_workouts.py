import uuid
from datetime import datetime, timedelta, timezone

T0 = datetime(2026, 10, 25, 17, 0, tzinfo=timezone.utc)


def at(seconds: int) -> str:
    return (T0 + timedelta(seconds=seconds)).isoformat()


def test_set_flow_computes_duration_and_rest(client, exercise):
    wid = client.post("/workouts", json={"started_at": at(0)}).json()["id"]
    base = {"exercise_id": str(exercise.id), "weight_kg": 10, "bodyweight_kg": 80}

    r1 = client.post(f"/workouts/{wid}/sets", json={**base, "started_at": at(0)})
    assert r1.status_code == 201
    assert r1.json()["set_number"] == 1
    client.patch(f"/sets/{r1.json()['id']}", json={"ended_at": at(40), "reps": 9})

    r2 = client.post(f"/workouts/{wid}/sets", json={**base, "started_at": at(160)})
    assert r2.json()["set_number"] == 2
    client.patch(f"/sets/{r2.json()['id']}", json={"ended_at": at(195), "reps": 8})

    sets = client.get(f"/workouts/{wid}").json()["sets"]
    assert [s["duration_s"] for s in sets] == [40, 35]
    assert [s["rest_before_s"] for s in sets] == [None, 120]
    assert [s["reps"] for s in sets] == [9, 8]


def test_client_supplied_id_is_idempotent(client):
    wid = str(uuid.uuid4())
    a = client.post("/workouts", json={"id": wid})
    b = client.post("/workouts", json={"id": wid})
    assert a.json()["id"] == b.json()["id"] == wid
    assert len(client.get("/workouts").json()) == 1


def test_unknown_exercise_is_rejected(client):
    wid = client.post("/workouts", json={}).json()["id"]
    r = client.post(
        f"/workouts/{wid}/sets", json={"exercise_id": str(uuid.uuid4())}
    )
    assert r.status_code == 422


def test_set_cannot_end_before_it_starts(client, exercise):
    wid = client.post("/workouts", json={}).json()["id"]
    sid = client.post(
        f"/workouts/{wid}/sets",
        json={"exercise_id": str(exercise.id), "started_at": at(0)},
    ).json()["id"]
    r = client.patch(f"/sets/{sid}", json={"ended_at": at(-1)})
    assert r.status_code == 422


def test_naive_datetime_is_rejected(client):
    r = client.post("/workouts", json={"started_at": "2026-10-25T17:00:00"})
    assert r.status_code == 422



def test_progress_aggregates_per_workout(client, exercise):
    def session(offset, sets):
        wid = client.post("/workouts", json={"started_at": at(offset)}).json()["id"]
        t = offset
        for weight, reps in sets:
            sid = client.post(
                f"/workouts/{wid}/sets",
                json={
                    "exercise_id": str(exercise.id),
                    "started_at": at(t),
                    "weight_kg": weight,
                },
            ).json()["id"]
            client.patch(f"/sets/{sid}", json={"ended_at": at(t + 40), "reps": reps})
            t += 160

    session(0, [(10, 8), (10, 6)])
    session(86400, [(12.5, 4), (10, 9)])

    pts = client.get(f"/exercises/{exercise.id}/progress").json()
    assert [p["top_weight_kg"] for p in pts] == [10, 12.5]
    assert [p["top_reps"] for p in pts] == [8, 4]
    assert [p["sets"] for p in pts] == [2, 2]
    assert pts[1]["est_1rm_kg"] == round(12.5 * (1 + 4 / 30), 1)


def test_deletes_are_idempotent(client, exercise):
    wid = client.post("/workouts", json={}).json()["id"]
    sid = client.post(
        f"/workouts/{wid}/sets", json={"exercise_id": str(exercise.id)}
    ).json()["id"]

    assert client.delete(f"/sets/{sid}").status_code == 204
    assert client.delete(f"/sets/{sid}").status_code == 204
    assert client.get(f"/workouts/{wid}").json()["sets"] == []

    assert client.delete(f"/workouts/{wid}").status_code == 204
    assert client.delete(f"/workouts/{wid}").status_code == 204
    assert client.get(f"/workouts/{wid}").status_code == 404
    
