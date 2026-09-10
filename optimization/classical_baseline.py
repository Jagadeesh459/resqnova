import json
import itertools
from pathlib import Path

import numpy as np

from optimization.final_qubo import build_final_qubo
from optimization.integrated_quantum_engine import (
    build_hospital_options,
    build_ambulance_assignments,
    build_shelter_assignments,
)


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename):
    path = DATA_DIR / filename

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def qubo_cost(Q, bitstring):
    x = np.array([int(bit) for bit in bitstring], dtype=float)

    return float(x @ Q @ x)


def build_groups(
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
):
    groups = []

    # Hospital group
    groups.append(
        [option["index"] for option in hospital_options]
    )

    # Ambulance groups
    ambulance_groups = {}

    for assignment in ambulance_assignments:
        ambulance_groups.setdefault(
            assignment["ambulance_id"], []
        ).append(assignment["index"])

    hospital_count = len(hospital_options)

    for ambulance_id in sorted(ambulance_groups.keys()):
        groups.append(
            [
                hospital_count + index
                for index in ambulance_groups[ambulance_id]
            ]
        )

    # Shelter groups
    ambulance_count = len(ambulance_assignments)

    shelter_groups = {}

    for assignment in shelter_assignments:
        shelter_groups.setdefault(
            assignment["zone_id"], []
        ).append(assignment["index"])

    shelter_offset = hospital_count + ambulance_count

    for zone_id in sorted(shelter_groups.keys()):
        groups.append(
            [
                shelter_offset + index
                for index in shelter_groups[zone_id]
            ]
        )

    return groups


def create_validator(
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
    hospital_scenario,
):
    hospital_count = len(hospital_options)
    ambulance_count = len(ambulance_assignments)

    hospital_emergency = hospital_scenario["emergency"]

    def validator(bitstring):
        bits = [int(bit) for bit in bitstring]

        # ---------------------------------------------------------
        # HOSPITAL
        # ---------------------------------------------------------

        hospital_bits = bits[:hospital_count]

        if sum(hospital_bits) != 1:
            return False

        selected_hospital_index = hospital_bits.index(1)

        hospital = hospital_options[selected_hospital_index]

        if hospital["route_status"] == "blocked":
            return False

        if hospital["available_beds"] < hospital_emergency["patients"]:
            return False

        if (
            hospital["emergency_capacity"]
            < hospital_emergency["high_severity_patients"]
        ):
            return False

        # ---------------------------------------------------------
        # AMBULANCES
        # ---------------------------------------------------------

        ambulance_start = hospital_count
        ambulance_end = hospital_count + ambulance_count

        ambulance_bits = bits[
            ambulance_start:ambulance_end
        ]

        selected_ambulance_indices = [
            i
            for i, bit in enumerate(ambulance_bits)
            if bit == 1
        ]

        # Exactly one assignment per ambulance.
        if len(selected_ambulance_indices) != 3:
            return False

        selected_ambulances = []

        for local_index in selected_ambulance_indices:
            assignment = ambulance_assignments[local_index]

            if assignment["route_status"] == "blocked":
                return False

            selected_ambulances.append(assignment)

        # ---------------------------------------------------------
        # SHELTERS
        # ---------------------------------------------------------

        shelter_start = hospital_count + ambulance_count

        shelter_bits = bits[shelter_start:]

        selected_shelters = [
            shelter_assignments[i]
            for i, bit in enumerate(shelter_bits)
            if bit == 1
        ]

        # One shelter per zone.
        zones = {
            assignment["zone_id"]
            for assignment in shelter_assignments
        }

        for zone_id in zones:
            zone_selected = [
                assignment
                for assignment in selected_shelters
                if assignment["zone_id"] == zone_id
            ]

            if len(zone_selected) != 1:
                return False

        # Routes must be open and each zone must have enough
        # individual capacity.
        for assignment in selected_shelters:

            if assignment["route_status"] == "blocked":
                return False

            if (
                assignment["available_capacity"]
                < assignment["predicted_evacuees"]
            ):
                return False

        # ---------------------------------------------------------
        # SHARED SHELTER CAPACITY
        # ---------------------------------------------------------

        shelter_usage = {}

        for assignment in selected_shelters:

            shelter_id = assignment["shelter_id"]

            shelter_usage.setdefault(
                shelter_id,
                {
                    "evacuees": 0,
                    "capacity": assignment["available_capacity"],
                },
            )

            shelter_usage[shelter_id]["evacuees"] += (
                assignment["predicted_evacuees"]
            )

        for shelter_id, usage in shelter_usage.items():

            if usage["evacuees"] > usage["capacity"]:
                return False

        return True

    return validator


def decode_plan(
    bitstring,
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
):
    bits = [int(bit) for bit in bitstring]

    hospital_count = len(hospital_options)
    ambulance_count = len(ambulance_assignments)

    # ---------------------------------------------------------
    # HOSPITAL
    # ---------------------------------------------------------

    hospital_bits = bits[:hospital_count]

    selected_hospital = hospital_options[
        hospital_bits.index(1)
    ]

    # ---------------------------------------------------------
    # AMBULANCES
    # ---------------------------------------------------------

    ambulance_start = hospital_count
    ambulance_end = hospital_count + ambulance_count

    ambulance_bits = bits[
        ambulance_start:ambulance_end
    ]

    selected_ambulances = [
        ambulance_assignments[i]
        for i, bit in enumerate(ambulance_bits)
        if bit == 1
    ]

    # ---------------------------------------------------------
    # SHELTERS
    # ---------------------------------------------------------

    shelter_start = hospital_count + ambulance_count

    shelter_bits = bits[shelter_start:]

    selected_shelters = [
        shelter_assignments[i]
        for i, bit in enumerate(shelter_bits)
        if bit == 1
    ]

    return {
        "hospital": selected_hospital,
        "ambulances": selected_ambulances,
        "shelters": selected_shelters,
    }


def solve_classically(
    Q,
    validator,
    number_of_variables,
):
    """
    Exhaustive classical optimization.

    This checks every possible binary state and keeps
    the lowest-cost feasible solution.

    For the current prototype there are only 18 variables,
    so this is practical for benchmarking.
    """

    best_bitstring = None
    best_cost = float("inf")

    feasible_count = 0

    total_states = 2 ** number_of_variables

    print()
    print("CLASSICAL BASELINE")
    print("------------------")
    print(f"Total binary states : {total_states}")
    print("Searching feasible states...")

    for state in range(total_states):

        bitstring = format(
            state,
            f"0{number_of_variables}b"
        )

        if not validator(bitstring):
            continue

        feasible_count += 1

        cost = qubo_cost(Q, bitstring)

        if cost < best_cost:
            best_cost = cost
            best_bitstring = bitstring

    if best_bitstring is None:
        raise RuntimeError(
            "No feasible classical solution was found."
        )

    return {
        "bitstring": best_bitstring,
        "qubo_cost": best_cost,
        "feasible_states": feasible_count,
        "total_states": total_states,
    }


def apply_dynamic_changes(
    hospital_scenario,
    resource_scenario,
    shelter_scenario,
):
    """
    Apply the same dynamic changes used by the
    integrated quantum engine.
    """

    # Hospital route becomes blocked.
    for route in hospital_scenario["routes"]:
        if route["id"] == "route-001":
            route["status"] = "blocked"

    # Mylavaram becomes high risk.
    for zone in resource_scenario["zones"]:
        if zone["name"] == "Mylavaram":
            zone["risk_level"] = "high"
            zone["predicted_patients"] = 35
            zone["resource_demand"] = 35

    # Ambulance 1 -> Mylavaram route blocked.
    for travel in resource_scenario["travel_times"]:
        if (
            travel["ambulance_id"] == "AMB-001"
            and travel["zone_id"] == "zone-002"
        ):
            travel["route_status"] = "blocked"

    # Mylavaram evacuation demand increases.
    for zone in shelter_scenario["zones"]:
        if zone["name"] == "Mylavaram":
            zone["risk_level"] = "high"
            zone["predicted_evacuees"] = 220

    # Mylavaram shelter capacity decreases.
    for shelter in shelter_scenario["shelters"]:
        if shelter["id"] == "shelter-003":
            shelter["available_capacity"] = 150

    # Mylavaram -> Mylavaram Emergency Shelter blocked.
    for travel in shelter_scenario["travel_times"]:
        if (
            travel["zone_id"] == "zone-002"
            and travel["shelter_id"] == "shelter-003"
        ):
            travel["route_status"] = "blocked"


def build_problem(
    hospital_scenario,
    resource_scenario,
    shelter_scenario,
):
    hospital_options = build_hospital_options(
        hospital_scenario
    )

    ambulance_assignments = build_ambulance_assignments(
        resource_scenario
    )

    shelter_assignments = build_shelter_assignments(
        shelter_scenario
    )

    scenario = {
        "patients": hospital_scenario["emergency"]["patients"],
        "high_severity_patients": hospital_scenario[
            "emergency"
        ]["high_severity_patients"],
    }

    Q = build_final_qubo(
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
        scenario,
    )

    validator = create_validator(
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
        hospital_scenario,
    )

    groups = build_groups(
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    return (
        Q,
        validator,
        groups,
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )


def print_plan(
    title,
    result,
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
):
    print()
    print("=" * 65)
    print(title)
    print("=" * 65)

    print(f"Bitstring : {result['bitstring']}")
    print(f"QUBO cost : {result['qubo_cost']:.2f}")

    if "feasible_states" in result:
        print(
            f"Feasible states : "
            f"{result['feasible_states']}"
        )

    plan = decode_plan(
        result["bitstring"],
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    hospital = plan["hospital"]

    print()
    print("HOSPITAL")
    print(
        f"{hospital['name']} | "
        f"beds {hospital['available_beds']} | "
        f"emergency capacity "
        f"{hospital['emergency_capacity']}"
    )

    print()
    print("AMBULANCE PRE-POSITIONING")

    for ambulance in plan["ambulances"]:
        print(
            f"{ambulance['ambulance_id']} → "
            f"{ambulance['zone_name']} | "
            f"{ambulance['risk_level'].upper()} | "
            f"ETA {ambulance['travel_time_min']} min"
        )

    print()
    print("SHELTER ALLOCATION")

    for shelter in plan["shelters"]:
        print(
            f"{shelter['zone_name']} → "
            f"{shelter['shelter_name']} | "
            f"evacuees {shelter['predicted_evacuees']} | "
            f"capacity {shelter['available_capacity']} | "
            f"ETA {shelter['travel_time_min']} min"
        )


def compare_results(
    classical_result,
    quantum_result,
):
    classical_cost = classical_result["qubo_cost"]
    quantum_cost = quantum_result["qubo_cost"]

    print()
    print("=" * 65)
    print("CLASSICAL vs QUANTUM")
    print("=" * 65)

    print(
        f"Classical QUBO cost : "
        f"{classical_cost:.2f}"
    )

    print(
        f"Quantum QUBO cost   : "
        f"{quantum_cost:.2f}"
    )

    difference = quantum_cost - classical_cost

    print(
        f"Cost difference     : "
        f"{difference:.2f}"
    )

    if classical_cost != 0:
        gap = (
            abs(difference)
            / abs(classical_cost)
        ) * 100
    else:
        gap = 0.0

    print(
        f"Quantum optimality gap : "
        f"{gap:.2f}%"
    )

    if quantum_cost <= classical_cost:
        print(
            "Result: Quantum solution matches or "
            "beats the classical baseline."
        )
    else:
        print(
            "Result: Quantum solution is feasible "
            "but did not reach the classical optimum."
        )

    print()
    print(
        "Important: this prototype uses local "
        "statevector simulation, so this comparison "
        "does not claim quantum speedup."
    )


def run():
    print()
    print("=" * 65)
    print("Q-RESCUE CLASSICAL BASELINE BENCHMARK")
    print("=" * 65)

    print()
    print("Loading Digital Disaster Twin scenarios...")

    hospital_scenario = load_json(
        "emergency_scenario.json"
    )

    resource_scenario = load_json(
        "resource_scenario.json"
    )

    shelter_scenario = load_json(
        "shelter_scenario.json"
    )

    # ---------------------------------------------------------
    # INITIAL SCENARIO
    # ---------------------------------------------------------

    (
        Q_initial,
        validator_initial,
        groups_initial,
        hospital_options_initial,
        ambulance_assignments_initial,
        shelter_assignments_initial,
    ) = build_problem(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    variable_count = Q_initial.shape[0]

    print()
    print(
        f"QAOA variables : {variable_count}"
    )

    print(
        f"Quantum groups : {len(groups_initial)}"
    )

    classical_initial = solve_classically(
        Q_initial,
        validator_initial,
        variable_count,
    )

    print_plan(
        "INITIAL CLASSICAL OPTIMAL PLAN",
        classical_initial,
        hospital_options_initial,
        ambulance_assignments_initial,
        shelter_assignments_initial,
    )

    # ---------------------------------------------------------
    # DYNAMIC CHANGE
    # ---------------------------------------------------------

    print()
    print("=" * 65)
    print("DYNAMIC ENVIRONMENT CHANGE")
    print("=" * 65)

    print()
    print("route-001: OPEN → BLOCKED")
    print("Mylavaram: MODERATE → HIGH")
    print("Mylavaram predicted patients: 18 → 35")
    print("Mylavaram resource demand: 18 → 35")
    print(
        "AMB-001 → Mylavaram: "
        "OPEN → BLOCKED"
    )
    print(
        "Mylavaram predicted evacuees: "
        "140 → 220"
    )
    print(
        "Mylavaram shelter capacity: "
        "210 → 150"
    )
    print(
        "Mylavaram → Mylavaram Emergency Shelter: "
        "OPEN → BLOCKED"
    )

    apply_dynamic_changes(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    # ---------------------------------------------------------
    # DYNAMIC CLASSICAL RE-OPTIMIZATION
    # ---------------------------------------------------------

    (
        Q_dynamic,
        validator_dynamic,
        groups_dynamic,
        hospital_options_dynamic,
        ambulance_assignments_dynamic,
        shelter_assignments_dynamic,
    ) = build_problem(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    classical_dynamic = solve_classically(
        Q_dynamic,
        validator_dynamic,
        variable_count,
    )

    print_plan(
        "NEW CLASSICAL OPTIMAL PLAN",
        classical_dynamic,
        hospital_options_dynamic,
        ambulance_assignments_dynamic,
        shelter_assignments_dynamic,
    )

    # ---------------------------------------------------------
    # QUANTUM COMPARISON
    # ---------------------------------------------------------

    print()
    print("=" * 65)
    print("QUANTUM COMPARISON")
    print("=" * 65)

    print(
        "The existing final QAOA engine can now be "
        "compared against these classical optima."
    )

    print()
    print("INITIAL classical optimum:")
    print(
        classical_initial["bitstring"],
        f"| cost {classical_initial['qubo_cost']:.2f}"
    )

    print()
    print("DYNAMIC classical optimum:")
    print(
        classical_dynamic["bitstring"],
        f"| cost {classical_dynamic['qubo_cost']:.2f}"
    )

    print()
    print(
        "CLASSICAL BASELINE COMPLETE"
    )


if __name__ == "__main__":
    run()