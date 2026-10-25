from fastapi import FastAPI

app = FastAPI(title="GymLog API")


@app.get("/health")
def health():
    return {"status": "ok"}
