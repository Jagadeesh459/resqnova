"""Small server-side adapter for live Vijayawada optimization inputs."""

import os
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from supabase import Client


class SupabaseAdapter:
    def __init__(self) -> None:
        url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.")
        try:
            from supabase import create_client
        except ImportError as error:
            raise RuntimeError("Install backend/requirements.txt before starting the Quantum Engine.") from error
        self.client: Client = create_client(url, key)

    def rows(self, table: str, *, district: str | None = "NTR", limit: int = 100) -> list[dict[str, Any]]:
        query = self.client.table(table).select("*")
        if district and table not in {"ambulances", "rescue_teams"}:
            query = query.eq("district", district)
        response = query.limit(limit).execute()
        return list(response.data or [])

    def operational_state(self) -> dict[str, list[dict[str, Any]]]:
        tables = ("ambulances", "rescue_teams", "shelters", "hospitals", "roads", "risk_zones", "citizen_requests")
        return {table: self.rows(table) for table in tables}

    def save_quantum_run(self, result: dict[str, Any]) -> None:
        self.client.table("quantum_optimization_runs").insert({
            "mode": result.get("mode", "reoptimize"),
            "status": result.get("status", "failed"),
            "engine": result.get("engine", "qaoa_statevector"),
            "request_id": result.get("request_id"),
            "bitstring": result.get("bitstring"),
            "qubo_cost": result.get("qubo_cost"),
            "probability": result.get("probability"),
            "expectation": result.get("expectation"),
            "runtime_ms": result.get("runtime_ms"),
            "input_summary": result.get("input_summary", {}),
            "plan": result.get("plan", {}),
            "error": result.get("error") or result.get("reason"),
        }).execute()
