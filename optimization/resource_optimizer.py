import copy
import json
from pathlib import Path

from optimization.resource_qubo import (
    build_assignments,
    build_resource_qubo,
    decode_resource_solution,
)

from optimization.resource_qaoa_solver import (
    run_resource_qaoa,
)


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "resource_scenario.json"


def load_scenario():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def print_plan(title, result, assignments, targets):
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)

    print()
    print(f"QAOA bitstring : {result['bitstring']}")
    print(f"Probability    : {result['probability']:.6f}")
    print(f"QUBO cost      : {result['qubo_cost']:.2f}")
    print(f"Expectation    : {result['expectation_value']:.2f}")

    print()
    print("TARGET COVERAGE")
    print("-" * 60)

    for assignment in assignments:
        if assignment.zone_id in targets:
            pass

    printed_zones = set()

    for assignment in assignments:
        if assignment.zone_id not in printed_zones:
            printed_zones.add(assignment.zone_id)

            print(
                f"{assignment.zone_name:<20}"
                f" target ambulances: "
                f"{targets[assignment.zone_id]}"
            )

    print()
    print("AMBULANCE POSITIONS")
    print("-" * 60)

    selected = decode_resource_solution(
        result["bitstring"],
        assignments,
    )

    for assignment in selected:
        print(
            f"{assignment.ambulance_name}"
            f" → {assignment.zone_name}"
            f" [{assignment.risk_level.upper()}]"
            f" | ETA {assignment.travel_time_min} min"
            f" | capacity {assignment.resource_capacity}"
        )


def optimize(scenario):
    assignments = build_assignments(scenario)

    qubo, targets = build_resource_qubo(
        assignments,
        scenario,
    )

    result = run_resource_qaoa(
        qubo,
        assignments,
    )

    return result, assignments, targets


def main():

    print()
    print("=" * 60)
    print("Q-RESCUE DYNAMIC QUANTUM RESOURCE ALLOCATION")
    print("=" * 60)

    # ---------------------------------------------------------
    # INITIAL STATE
    # ---------------------------------------------------------

    scenario = load_scenario()

    initial_result, initial_assignments, initial_targets = optimize(
        scenario
    )

    print_plan(
        "INITIAL QUANTUM RESOURCE PLAN",
        initial_result,
        initial_assignments,
        initial_targets,
    )

    # ---------------------------------------------------------
    # DYNAMIC CHANGE
    # ---------------------------------------------------------

    print()
    print("=" * 60)
    print("DETECTED ENVIRONMENT CHANGE")
    print("=" * 60)

    changed_scenario = copy.deepcopy(scenario)

    # Mylavaram becomes a HIGH-risk zone.
    for zone in changed_scenario["zones"]:
        if zone["id"] == "zone-002":

            print()
            print(
                "Mylavaram:"
                f" {zone['risk_level'].upper()} "
                "→ HIGH"
            )

            print(
                f"Predicted patients:"
                f" {zone['predicted_patients']} → 35"
            )

            print(
                f"Resource demand:"
                f" {zone['resource_demand']} → 35"
            )

            zone["risk_level"] = "high"
            zone["predicted_patients"] = 35
            zone["resource_demand"] = 35

    # ---------------------------------------------------------
    # ROAD CHANGE
    # ---------------------------------------------------------

    for route in changed_scenario["travel_times"]:

        if (
            route["ambulance_id"] == "AMB-001"
            and route["zone_id"] == "zone-002"
        ):
            print()
            print(
                "AMB-001 → Mylavaram:"
                f" {route['route_status'].upper()} "
                "→ BLOCKED"
            )

            route["route_status"] = "blocked"

    # ---------------------------------------------------------
    # AUTOMATIC RE-OPTIMIZATION
    # ---------------------------------------------------------

    print()
    print("=" * 60)
    print("RE-OPTIMIZING QUANTUM RESOURCE PLAN")
    print("=" * 60)

    new_result, new_assignments, new_targets = optimize(
        changed_scenario
    )

    print_plan(
        "NEW QUANTUM RESOURCE PLAN",
        new_result,
        new_assignments,
        new_targets,
    )

    print()
    print("=" * 60)
    print("DYNAMIC QUANTUM RESOURCE ALLOCATION COMPLETE")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()