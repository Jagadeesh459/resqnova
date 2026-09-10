from fastapi import FastAPI

from backend.routes.quantum import router as quantum_router

app = FastAPI(title="ResQNova Quantum Engine", version="1.0.0")
app.include_router(quantum_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "resqnova-quantum-engine"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False)
