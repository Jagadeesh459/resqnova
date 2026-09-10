import copy
import json
from pathlib import Path

from optimization.quantum_classical_benchmark import (
    load_json,
    run_scenario,
)


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def print_change(title, changes):
    print()
    print("-" * 70)
    print(title)
    print("-" * 70)

    for change in changes:
        print(change)


def scenario_road_blockage(
    hospital,
    resource,
    shelter,
):
    hospital = copy.deepcopy(hospital)
    resource = copy.deepcopy(resource)
    shelter = copy.deepcopy(shelter)

    changes = [
        "route-001: OPEN → BLOCKED"
    ]

    for route in hospital["routes"]:
        if route["id"] == "route-001":
            route["status"] = "blocked"

    return (
        hospital,
        resource,
        shelter,
        changes,
    )


def scenario_hospital_capacity(
    hospital,
    resource,
    shelter,
):
    hospital = copy.deepcopy(hospital)
    resource = copy.deepcopy(resource)
    shelter = copy.deepcopy(shelter)

    changes = [
        "Government General Hospital beds: 42 → 15",
        "Government General Hospital emergency capacity: 18 → 6",
    ]

    for item in hospital["hospitals"]:

        if item["id"] == "hosp-001":

            item["available_beds"] = 15
            item["emergency_capacity"] = 6

    return (
        hospital,
        resource,
        shelter,
        changes,
    )


def scenario_patient_surge(
    hospital,
    resource,
    shelter,
):
    hospital = copy.deepcopy(hospital)
    resource = copy.deepcopy(resource)
    shelter = copy.deepcopy(shelter)

    changes = [
        "Emergency patients: 20 → 30",
        "High severity patients: 8 → 14",
    ]

    hospital["emergency"]["patients"] = 30
    hospital["emergency"]["high_severity_patients"] = 14

    return (
        hospital,
        resource,
        shelter,
        changes,
    )


def scenario_shelter_reduction(
    hospital,
    resource,
    shelter,
):
    hospital = copy.deepcopy(hospital)
    resource = copy.deepcopy(resource)
    shelter = copy.deepcopy(shelter)

    changes = [
        "Mylavaram Emergency Shelter capacity: 210 → 100",
    ]

    for item in shelter["shelters"]:

        if item["id"] == "shelter-003":

            item["available_capacity"] = 100

    return (
        hospital,
        resource,
        shelter,
        changes,
    )


def scenario_multiple_changes(
    hospital,
    resource,
    shelter,
):
    hospital = copy.deepcopy(hospital)
    resource = copy.deepcopy(resource)
    shelter = copy.deepcopy(shelter)

    changes = [
        "route-001: OPEN → BLOCKED",
        "Mylavaram severity: MODERATE → HIGH",
        "Mylavaram predicted patients: 18 → 35",
        "Mylavaram resource demand: 18 → 35",
        "AMB-001 → Mylavaram: OPEN → BLOCKED",
        "Mylavaram predicted evacuees: 140 → 220",
        "Mylavaram shelter capacity: 210 → 150",
        "Mylavaram → Mylavaram Emergency Shelter: OPEN → BLOCKED",
    ]

    # ---------------------------------------------------------
    # Hospital route
    # ---------------------------------------------------------

    for route in hospital["routes"]:

        if route["id"] == "route-001":

            route["status"] = "blocked"

    # ---------------------------------------------------------
    # Resource zone
    # ---------------------------------------------------------

    for zone in resource["zones"]:

        if zone["id"] == "zone-002":

            zone["risk_level"] = "high"
            zone["predicted_patients"] = 35
            zone["resource_demand"] = 35

    # ---------------------------------------------------------
    # Ambulance route
    # ---------------------------------------------------------

    for travel in resource["travel_times"]:

        if (
            travel["ambulance_id"] == "AMB-001"
            and travel["zone_id"] == "zone-002"
        ):

            travel["route_status"] = "blocked"

    # ---------------------------------------------------------
    # Shelter zone
    # ---------------------------------------------------------

    for zone in shelter["zones"]:

        if zone["id"] == "zone-002":

            zone["risk_level"] = "high"
            zone["predicted_evacuees"] = 220

    # ---------------------------------------------------------
    # Shelter capacity
    # ---------------------------------------------------------

    for item in shelter["shelters"]:

        if item["id"] == "shelter-003":

            item["available_capacity"] = 150

    # ---------------------------------------------------------
    # Shelter route
    # ---------------------------------------------------------

    for travel in shelter["travel_times"]:

        if (
            travel["zone_id"] == "zone-002"
            and travel["shelter_id"] == "shelter-003"
        ):

            travel["route_status"] = "blocked"

    return (
        hospital,
        resource,
        shelter,
        changes,
    )


def run_dynamic_scenario(
    scenario_number,
    scenario_name,
    change_function,
    base_hospital,
    base_resource,
    base_shelter,
):
    print()
    print()
    print("#" * 70)
    print(
        f"SCENARIO {scenario_number}: "
        f"{scenario_name}"
    )
    print("#" * 70)

    (
        hospital,
        resource,
        shelter,
        changes,
    ) = change_function(
        base_hospital,
        base_resource,
        base_shelter,
    )

    print_change(
        "ENVIRONMENT CHANGE",
        changes,
    )

    result = run_scenario(
        f"SCENARIO {scenario_number} RESULT",
        hospital,
        resource,
        shelter,
    )

    return {
        "scenario_number": scenario_number,
        "scenario_name": scenario_name,
        "changes": changes,

        "classical_cost": result[
            "classical"
        ]["qubo_cost"],

        "classical_bitstring": result[
            "classical"
        ]["bitstring"],

        "qaoa_cost": result[
            "quantum"
        ]["qubo_cost"],

        "qaoa_bitstring": result[
            "quantum"
        ]["bitstring"],

        "qaoa_probability": result[
            "quantum"
        ]["probability"],

        "qaoa_expectation": result[
            "quantum"
        ]["expectation"],

        "optimality_gap_percent": result[
            "optimality_gap_percent"
        ],

        "classical_runtime_sec": result[
            "classical_runtime_sec"
        ],

        "qaoa_runtime_sec": result[
            "quantum_runtime_sec"
        ],

        "variables": result[
            "number_of_variables"
        ],

        "groups": result[
            "number_of_groups"
        ],
    }


def save_results(results):

    output_dir = BASE_DIR / "results"

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_dir
        / "multi_scenario_benchmark.json"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            {
                "scenarios": results
            },
            file,
            indent=2,
        )

    return output_path


def print_final_summary(results):

    print()
    print()
    print("=" * 70)
    print(
        "MULTI-SCENARIO QUANTUM "
        "BENCHMARK SUMMARY"
    )
    print("=" * 70)

    print()

    print(
        f"{'Scenario':<35}"
        f"{'Classical':>14}"
        f"{'QAOA':>14}"
        f"{'Gap':>12}"
    )

    print("-" * 75)

    for result in results:

        name = result[
            "scenario_name"
        ]

        classical_cost = result[
            "classical_cost"
        ]

        qaoa_cost = result[
            "qaoa_cost"
        ]

        gap = result[
            "optimality_gap_percent"
        ]

        print(
            f"{name:<35}"
            f"{classical_cost:>14.2f}"
            f"{qaoa_cost:>14.2f}"
            f"{gap:>11.4f}%"
        )

    # ---------------------------------------------------------
    # Summary statistics
    # ---------------------------------------------------------

    exact_matches = sum(
        1
        for result in results
        if result[
            "optimality_gap_percent"
        ] < 1e-9
    )

    near_optimal_cases = sum(
        1
        for result in results
        if result[
            "optimality_gap_percent"
        ] < 1.0
    )

    total = len(results)

    print()

    print(
        f"Exact QAOA matches : "
        f"{exact_matches}/{total}"
    )

    print(
        f"Near-optimal cases : "
        f"{near_optimal_cases}/{total}"
    )

    print()

    if exact_matches == total:

        print(
            "RESULT: QAOA MATCHED THE "
            "CLASSICAL OPTIMUM IN ALL "
            "SCENARIOS."
        )

    elif near_optimal_cases == total:

        print(
            "RESULT: QAOA REMAINED "
            "NEAR-OPTIMAL IN ALL "
            "SCENARIOS."
        )

    else:

        print(
            "RESULT: QAOA PRODUCED "
            "FEASIBLE SOLUTIONS ACROSS "
            "THE DYNAMIC SCENARIOS."
        )

    print()

    print(
        "The benchmark demonstrates "
        "dynamic quantum re-optimization "
        "under changing disaster conditions."
    )


def main():

    print()
    print("=" * 70)
    print(
        "Q-RESCUE MULTI-SCENARIO "
        "DYNAMIC QUANTUM BENCHMARK"
    )
    print("=" * 70)

    print()
    print(
        "Loading Digital Disaster Twin..."
    )

    base_hospital = load_json(
        "emergency_scenario.json"
    )

    base_resource = load_json(
        "resource_scenario.json"
    )

    base_shelter = load_json(
        "shelter_scenario.json"
    )

    scenarios = [

        (
            "Road Blockage",
            scenario_road_blockage,
        ),

        (
            "Hospital Capacity Reduction",
            scenario_hospital_capacity,
        ),

        (
            "Patient Surge",
            scenario_patient_surge,
        ),

        (
            "Shelter Capacity Reduction",
            scenario_shelter_reduction,
        ),

        (
            "Multiple Simultaneous Changes",
            scenario_multiple_changes,
        ),
    ]

    results = []

    for index, (
        scenario_name,
        change_function,
    ) in enumerate(
        scenarios,
        start=1,
    ):

        result = run_dynamic_scenario(
            index,
            scenario_name,
            change_function,
            base_hospital,
            base_resource,
            base_shelter,
        )

        results.append(result)

    print_final_summary(
        results
    )

    output_path = save_results(
        results
    )

    print()

    print(
        "Detailed results saved to:"
    )

    print(output_path)

    print()

    print(
        "MULTI-SCENARIO BENCHMARK COMPLETE"
    )


if __name__ == "__main__":
    main()