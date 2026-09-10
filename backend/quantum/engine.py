"""Live Supabase to QAOA scenario adapter.

The upstream quantum-engine modules remain unchanged. This adapter limits the
candidate set for statevector simulation and converts live Vijayawada rows into
the scenario contract expected by the integrated engine.
"""

from __future__ import annotations

import importlib.util
import time
from typing import Any

from backend.quantum.supabase_adapter import SupabaseAdapter


def quantum_available() -> bool:
    return importlib.util.find_spec("qiskit") is not None and importlib.util.find_spec("scipy") is not None


def _risk_value(row: dict[str, Any]) -> int:
    level = str(row.get("risk_level", "moderate")).lower()
    return int(row.get("risk_score") or {"critical": 95, "high": 80, "moderate": 55, "low": 25}.get(level, 40))


def _route_status(roads: list[dict[str, Any]]) -> str:
    statuses = {str(row.get("status", "open")).lower() for row in roads}
    if "blocked" in statuses:
        return "blocked"
    if statuses.intersection({"partial", "restricted", "slow"}):
        return "partial"
    return "open"


def build_live_scenarios(state: dict[str, list[dict[str, Any]]], request_id: str | None = None) -> tuple[dict, dict, dict]:
    hospitals = sorted(
        [row for row in state["hospitals"] if int(row.get("available_beds") or 0) > 0],
        key=lambda row: int(row.get("available_beds") or 0),
        reverse=True,
    )[:2]
    ambulances = [row for row in state["ambulances"] if str(row.get("status", "")).lower() in {"available", "standby"}][:2]
    shelters = sorted(
        [row for row in state["shelters"] if int(row.get("available_capacity") or 0) > 0],
        key=lambda row: int(row.get("available_capacity") or 0),
        reverse=True,
    )[:2]
    zones = sorted(state["risk_zones"], key=_risk_value, reverse=True)[:2]
    roads = state["roads"]
    request = next((row for row in state["citizen_requests"] if row.get("id") == request_id), None) if request_id else None
    people = int((request or {}).get("people_count") or sum(int(row.get("predicted_patients") or 0) for row in zones) or 1)
    high_severity = max(1, int(people * 0.35))
    route_status = _route_status(roads)
    average_time = max(5, round(sum(float(row.get("travel_time") or 0) for row in roads) / max(1, len(roads))))

    if not zones:
        zones = [{"id": "zone-vijayawada", "zone_name": "Vijayawada Central", "risk_level": "moderate", "risk_score": 50}]

    hospital_scenario = {
        "emergency": {"incident_id": request_id or "PREPOSITION", "location": "Vijayawada", "patients": people, "high_severity_patients": high_severity, "moderate_severity_patients": max(0, people - high_severity)},
        "hospitals": [{"id": row["id"], "name": row.get("hospital_name", "Hospital"), "available_beds": int(row.get("available_beds") or 0), "emergency_capacity": int(row.get("emergency_capacity") or 0), "distance_km": 1.0} for row in hospitals],
        "routes": [{"id": f"route-{row['id']}", "name": row.get("hospital_name", "Hospital"), "hospital_id": row["id"], "travel_time_min": average_time, "status": route_status} for row in hospitals],
    }
    resource_zones = [{"id": f"zone-{index}", "name": row.get("zone_name", f"Risk Zone {index}"), "risk_level": row.get("risk_level", "moderate"), "predicted_patients": max(1, int(people / max(1, len(zones)))), "resource_demand": max(1, int(people / max(1, len(zones))))} for index, row in enumerate(zones, 1)]
    resource_scenario = {
        "zones": resource_zones,
        "ambulances": [{"id": row["id"], "name": row.get("vehicle_code", "Ambulance"), "resource_capacity": max(1, int(row.get("crew_size") or 2))} for row in ambulances],
        "travel_times": [{"ambulance_id": ambulance["id"], "zone_id": zone["id"], "travel_time_min": average_time + index * 2, "route_status": route_status} for index, ambulance in enumerate(ambulances) for zone in resource_zones],
    }
    shelter_zones = [{"id": zone["id"], "name": zone["name"], "risk_level": zone["risk_level"], "predicted_evacuees": max(1, int(people / max(1, len(resource_zones))))} for zone in resource_zones]
    shelter_scenario = {
        "zones": shelter_zones,
        "shelters": [{"id": row["id"], "name": row.get("shelter_name", "Shelter"), "location": "Vijayawada", "capacity": int(row.get("capacity") or 0), "available_capacity": int(row.get("available_capacity") or 0)} for row in shelters],
        "travel_times": [{"zone_id": zone["id"], "shelter_id": shelter["id"], "travel_time_min": average_time + index * 2, "route_status": route_status} for index, zone in enumerate(shelter_zones) for shelter in shelters],
    }
    return hospital_scenario, resource_scenario, shelter_scenario


def run_live_quantum(mode: str = "reoptimize", request_id: str | None = None) -> dict[str, Any]:
    started = time.perf_counter()
    adapter = SupabaseAdapter()
    state = adapter.operational_state()
    hospital_scenario, resource_scenario, shelter_scenario = build_live_scenarios(state, request_id)
    if not quantum_available():
        result = {"status": "unavailable", "mode": mode, "engine": "qaoa", "reason": "Install qiskit and scipy in the backend environment.", "runtime_ms": round((time.perf_counter() - started) * 1000, 2), "request_id": request_id}
        adapter.save_quantum_run(result)
        return result

    from optimization.integrated_quantum_engine import run_integrated_plan

    try:
        result, plan = run_integrated_plan(hospital_scenario, resource_scenario, shelter_scenario)
        result_payload = {
            "status": "completed",
            "mode": mode,
            "engine": "qaoa_statevector",
            "bitstring": result.get("bitstring"),
            "qubo_cost": result.get("qubo_cost"),
            "probability": result.get("probability"),
            "expectation": result.get("expectation"),
            "optimization_success": result.get("optimization_success"),
            "runtime_ms": round((time.perf_counter() - started) * 1000, 2),
            "request_id": request_id,
            "plan": plan,
            "input_summary": {"ambulances": len(state["ambulances"]), "rescue_teams": len(state["rescue_teams"]), "shelters": len(state["shelters"]), "hospitals": len(state["hospitals"]), "roads": len(state["roads"]), "risk_zones": len(state["risk_zones"])},
        }
        adapter.save_quantum_run(result_payload)
        return result_payload
    except Exception as error:
        result = {"status": "failed", "mode": mode, "engine": "qaoa_statevector", "error": str(error), "runtime_ms": round((time.perf_counter() - started) * 1000, 2), "request_id": request_id}
        adapter.save_quantum_run(result)
        return result
