from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.quantum.engine import quantum_available, run_live_quantum

router = APIRouter(prefix="/api/quantum", tags=["quantum"])


class QuantumRequest(BaseModel):
    request_id: str | None = None


@router.get("/status")
def status():
    return {"status": "ready" if quantum_available() else "unavailable", "engine": "QAOA", "simulator": "statevector", "optimizer": "COBYLA", "source": "live Supabase Vijayawada data"}


def execute(mode: str, payload: QuantumRequest):
    result = run_live_quantum(mode, payload.request_id)
    if result["status"] == "unavailable":
        raise HTTPException(status_code=503, detail=result)
    return result


@router.post("/preposition")
def preposition(payload: QuantumRequest):
    return execute("preposition", payload)


@router.post("/rescue")
def rescue(payload: QuantumRequest):
    return execute("rescue", payload)


@router.post("/ambulance")
def ambulance(payload: QuantumRequest):
    return execute("ambulance", payload)


@router.post("/evacuation")
def evacuation(payload: QuantumRequest):
    return execute("evacuation", payload)


@router.post("/reoptimize")
def reoptimize(payload: QuantumRequest):
    return execute("reoptimize", payload)


@router.post("/benchmark")
def benchmark(payload: QuantumRequest):
    return execute("benchmark", payload)
