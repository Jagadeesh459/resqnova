import copy
import json
from pathlib import Path

from optimization.qubo import (
    build_hospital_options,
    build_qubo,
    evaluate_solution,
    is_valid_solution,
)

from optimization.qaoa_solver import run_qaoa


# ============================================================
# PROJECT PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_FILE = (
    BASE_DIR
    / "data"
    / "emergency_scenario.json"
)


# ============================================================
# LOAD SCENARIO
# ============================================================

def load_scenario():
    """
    Load the original emergency scenario.
    """

    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Scenario file not found:\n{DATA_FILE}"
        )

    with open(
        DATA_FILE,
        "r",
        encoding="utf-8",
    ) as file:

        return json.load(file)


# ============================================================
# GET SELECTED HOSPITAL
# ============================================================

def get_selected_hospital(
    options,
    bitstring,
):
    """
    Decode the QAOA bitstring.

    A valid solution must select exactly
    one hospital.
    """

    if not is_valid_solution(bitstring):
        return None

    for index, bit in enumerate(bitstring):

        if bit == "1":
            return options[index]

    return None


# ============================================================
# RUN QUANTUM OPTIMIZATION
# ============================================================

def optimize_scenario(scenario):
    """
    Build the QUBO and run QAOA for the
    current disaster state.
    """

    emergency = scenario["emergency"]

    patients = emergency["patients"]

    high_severity = (
        emergency["high_severity_patients"]
    )

    options = build_hospital_options(
        scenario
    )

    if not options:
        raise ValueError(
            "No hospital options available."
        )

    qubo = build_qubo(
        options,
        patients,
        high_severity,
    )

    result = run_qaoa(
        qubo,
        reps=2,
    )

    selected = get_selected_hospital(
        options,
        result["bitstring"],
    )

    solution_cost = evaluate_solution(
        qubo,
        result["bitstring"],
    )

    return {
        "options": options,
        "qubo": qubo,
        "qaoa": result,
        "selected": selected,
        "solution_cost": solution_cost,
    }


# ============================================================
# PRINT OPTIMIZATION PLAN
# ============================================================

def print_plan(
    title,
    result,
):
    """
    Display the current quantum optimization
    result.
    """

    print()
    print("=" * 70)
    print(title)
    print("=" * 70)

    qaoa = result["qaoa"]

    selected = result["selected"]

    print()

    print(
        f"QAOA bitstring : "
        f"{qaoa['bitstring']}"
    )

    print(
        f"Probability    : "
        f"{qaoa['probability']:.6f}"
    )

    print(
        f"QUBO cost      : "
        f"{result['solution_cost']:.2f}"
    )

    if selected is None:

        print()
        print(
            "No valid hospital selected."
        )

        return

    print()

    print(
        f"Hospital       : "
        f"{selected.hospital_name}"
    )

    print(
        f"Hospital ID    : "
        f"{selected.hospital_id}"
    )

    print(
        f"Beds available : "
        f"{selected.available_beds}"
    )

    print(
        f"Emergency cap. : "
        f"{selected.emergency_capacity}"
    )

    print(
        f"Distance       : "
        f"{selected.distance_km} km"
    )

    print(
        f"Travel time    : "
        f"{selected.travel_time_min} min"
    )

    print(
        f"Route status   : "
        f"{selected.route_status}"
    )

    print()


# ============================================================
# SIMULATE REAL-TIME ROAD BLOCK
# ============================================================

def simulate_road_block(
    scenario,
    hospital_id,
):
    """
    Simulate a real-time disaster change.

    The route connected to the currently selected
    hospital becomes blocked.
    """

    for route in scenario["routes"]:

        if route["hospital_id"] == hospital_id:

            route["status"] = "blocked"

            print()
            print(
                "!!! REAL-TIME CHANGE DETECTED !!!"
            )

            print()

            print(
                f"Route affected : "
                f"{route['name']}"
            )

            print(
                "Previous status: OPEN"
            )

            print(
                "New status     : BLOCKED"
            )

            return route

    return None


# ============================================================
# PRINT ROUTE STATUS
# ============================================================

def print_route_status(
    scenario,
):
    """
    Display all current route conditions.
    """

    print()
    print("CURRENT ROUTE CONDITIONS")
    print("-" * 70)

    for route in scenario["routes"]:

        print(
            f"{route['id']} | "
            f"{route['name']} | "
            f"{route['status'].upper()}"
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 70)

    print(
        "Q-RESCUE DYNAMIC "
        "QUANTUM OPTIMIZATION"
    )

    print("=" * 70)

    # --------------------------------------------------------
    # LOAD ORIGINAL SCENARIO
    # --------------------------------------------------------

    original_scenario = load_scenario()

    # Work on a copy so the original JSON file
    # is NEVER permanently modified.
    scenario = copy.deepcopy(
        original_scenario
    )

    emergency = scenario["emergency"]

    print()

    print("EMERGENCY SCENARIO")

    print("-" * 70)

    print(
        f"Incident location : "
        f"{emergency['location']}"
    )

    print(
        f"Patients          : "
        f"{emergency['patients']}"
    )

    print(
        f"High severity     : "
        f"{emergency['high_severity_patients']}"
    )

    print(
        f"Moderate severity : "
        f"{emergency['moderate_severity_patients']}"
    )

    # --------------------------------------------------------
    # STEP 1
    # INITIAL OPTIMIZATION
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "STEP 1 — INITIAL DISASTER STATE"
    )

    print("=" * 70)

    print_route_status(
        scenario
    )

    initial_result = optimize_scenario(
        scenario
    )

    print_plan(
        "INITIAL QUANTUM RESPONSE PLAN",
        initial_result,
    )

    selected = initial_result["selected"]

    if selected is None:

        print(
            "Unable to create initial "
            "response plan."
        )

        return

    # --------------------------------------------------------
    # STEP 2
    # DISASTER CONDITION CHANGES
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "STEP 2 — DISASTER CONDITION CHANGES"
    )

    print("=" * 70)

    print()

    print(
        "The system detects a change "
        "in the selected route."
    )

    blocked_route = simulate_road_block(
        scenario,
        selected.hospital_id,
    )

    if blocked_route is None:

        print(
            "Could not find the selected "
            "hospital route."
        )

        return

    # --------------------------------------------------------
    # SHOW UPDATED DIGITAL TWIN STATE
    # --------------------------------------------------------

    print_route_status(
        scenario
    )

    # --------------------------------------------------------
    # STEP 3
    # INVALIDATE OLD PLAN
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "STEP 3 — OLD PLAN INVALIDATED"
    )

    print("=" * 70)

    print()

    print(
        f"Previous hospital : "
        f"{selected.hospital_name}"
    )

    print(
        f"Previous route    : "
        f"{blocked_route['name']}"
    )

    print(
        "Reason            : "
        "ROUTE BLOCKED"
    )

    print()

    print(
        "The previous response plan "
        "is no longer feasible."
    )

    # --------------------------------------------------------
    # STEP 4
    # UPDATE QUBO
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "STEP 4 — QUBO UPDATED"
    )

    print("=" * 70)

    print()

    print(
        "Updating optimization constraints..."
    )

    print(
        "Blocked route receives a "
        "large penalty."
    )

    print(
        "Feasible hospitals remain "
        "available to QAOA."
    )

    # --------------------------------------------------------
    # STEP 5
    # RUN QAOA AGAIN
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "STEP 5 — QUANTUM RE-OPTIMIZATION"
    )

    print("=" * 70)

    print()

    print(
        "Running QAOA again..."
    )

    updated_result = optimize_scenario(
        scenario
    )

    print_plan(
        "NEW QUANTUM RESPONSE PLAN",
        updated_result,
    )

    new_selected = (
        updated_result["selected"]
    )

    # --------------------------------------------------------
    # STEP 6
    # COMPARE OLD AND NEW PLANS
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "STEP 6 — RESPONSE PLAN COMPARISON"
    )

    print("=" * 70)

    print()

    print(
        "OLD PLAN"
    )

    print("-" * 70)

    print(
        f"Hospital : "
        f"{selected.hospital_name}"
    )

    print(
        f"Route    : "
        f"{blocked_route['name']}"
    )

    print(
        "Status   : BLOCKED"
    )

    print()

    print(
        "NEW PLAN"
    )

    print("-" * 70)

    if new_selected is None:

        print(
            "No valid replacement "
            "hospital selected."
        )

    else:

        print(
            f"Hospital : "
            f"{new_selected.hospital_name}"
        )

        print(
            f"Route    : "
            f"Travel time "
            f"{new_selected.travel_time_min} min"
        )

        print(
            f"Status   : "
            f"{new_selected.route_status.upper()}"
        )

        print(
            f"Beds     : "
            f"{new_selected.available_beds}"
        )

        print(
            f"Emergency capacity : "
            f"{new_selected.emergency_capacity}"
        )

    # --------------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------------

    print()
    print("=" * 70)

    print(
        "DYNAMIC QUANTUM "
        "RE-OPTIMIZATION COMPLETE"
    )

    print("=" * 70)

    print()

    print(
        "DISASTER CHANGE"
    )

    print(
        "OPEN ROUTE → BLOCKED ROUTE"
    )

    print()

    print(
        "OLD PLAN"
    )

    print(
        f"{selected.hospital_name}"
    )

    print()

    print(
        "NEW PLAN"
    )

    if new_selected is not None:

        print(
            f"{new_selected.hospital_name}"
        )

    else:

        print(
            "NO FEASIBLE PLAN"
        )

    print()

    print(
        "The original emergency_scenario.json "
        "was not modified."
    )

    print()

    print("=" * 70)


if __name__ == "__main__":
    main()