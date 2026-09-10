import json
import time
from pathlib import Path

from optimization.classical_baseline import (
    build_problem,
    solve_classically,
    decode_plan,
    apply_dynamic_changes,
)

from optimization.final_qaoa_solver import (
    run_final_qaoa,
)


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json(filename):
    path = DATA_DIR / filename

    with open(
        path,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def print_plan(
    title,
    bitstring,
    cost,
    probability,
    expectation,
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
):
    plan = decode_plan(
        bitstring,
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    print()
    print("=" * 70)
    print(title)
    print("=" * 70)

    print(
        f"Bitstring        : {bitstring}"
    )

    print(
        f"QUBO cost        : {cost:.2f}"
    )

    if probability is not None:
        print(
            f"QAOA probability : {probability:.10f}"
        )

    if expectation is not None:
        print(
            f"Expectation      : {expectation:.2f}"
        )

    print()
    print("HOSPITAL")

    hospital = plan["hospital"]

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
            f"ETA {ambulance['travel_time_min']} min | "
            f"capacity {ambulance['resource_capacity']}"
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


def calculate_gap(
    classical_cost,
    quantum_cost,
):
    if classical_cost == 0:
        return 0.0

    return (
        abs(quantum_cost - classical_cost)
        / abs(classical_cost)
    ) * 100.0


def print_comparison(
    title,
    classical_result,
    quantum_result,
):
    classical_cost = (
        classical_result["qubo_cost"]
    )

    quantum_cost = (
        quantum_result["qubo_cost"]
    )

    gap = calculate_gap(
        classical_cost,
        quantum_cost,
    )

    print()
    print("=" * 70)
    print(title)
    print("=" * 70)

    print(
        f"Classical optimum : "
        f"{classical_cost:.2f}"
    )

    print(
        f"QAOA solution     : "
        f"{quantum_cost:.2f}"
    )

    print(
        f"Optimality gap    : "
        f"{gap:.4f}%"
    )

    print(
        f"QAOA probability  : "
        f"{quantum_result['probability']:.10f}"
    )

    print(
        f"QAOA expectation   : "
        f"{quantum_result['expectation']:.2f}"
    )

    print()

    if abs(
        classical_cost - quantum_cost
    ) < 1e-9:

        print(
            "RESULT: QAOA MATCHED "
            "THE CLASSICAL OPTIMUM"
        )

    else:

        print(
            "RESULT: QAOA FOUND A "
            "FEASIBLE NON-OPTIMAL SOLUTION"
        )

    return gap


def run_scenario(
    title,
    hospital_scenario,
    resource_scenario,
    shelter_scenario,
):
    print()
    print("#" * 70)
    print(title)
    print("#" * 70)

    (
        Q,
        validator,
        groups,
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    ) = build_problem(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    number_of_variables = Q.shape[0]

    # ---------------------------------------------------------
    # CLASSICAL
    # ---------------------------------------------------------

    classical_start = time.perf_counter()

    classical_result = solve_classically(
        Q,
        validator,
        number_of_variables,
    )

    classical_time = (
        time.perf_counter()
        - classical_start
    )

    print_plan(
        "CLASSICAL OPTIMAL PLAN",
        classical_result["bitstring"],
        classical_result["qubo_cost"],
        None,
        None,
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    # ---------------------------------------------------------
    # QAOA
    # ---------------------------------------------------------

    quantum_start = time.perf_counter()

    quantum_result = run_final_qaoa(
        Q,
        groups,
        validator,
        reps=2,
    )

    quantum_time = (
        time.perf_counter()
        - quantum_start
    )

    print_plan(
        "QAOA PLAN",
        quantum_result["bitstring"],
        quantum_result["qubo_cost"],
        quantum_result["probability"],
        quantum_result["expectation"],
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    # ---------------------------------------------------------
    # COMPARISON
    # ---------------------------------------------------------

    gap = print_comparison(
        "CLASSICAL vs QAOA",
        classical_result,
        quantum_result,
    )

    print()
    print("RUNTIME INFORMATION")
    print("-------------------")

    print(
        f"Classical search time : "
        f"{classical_time:.4f} sec"
    )

    print(
        f"QAOA simulation time  : "
        f"{quantum_time:.4f} sec"
    )

    return {
        "classical": classical_result,
        "quantum": quantum_result,
        "optimality_gap_percent": gap,
        "classical_runtime_sec": classical_time,
        "quantum_runtime_sec": quantum_time,
        "number_of_variables": number_of_variables,
        "number_of_groups": len(groups),
    }


def save_results(
    initial_result,
    dynamic_result,
):
    output_dir = BASE_DIR / "results"

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_dir
        / "quantum_classical_benchmark.json"
    )

    output = {
        "initial": {
            "classical": {
                "bitstring": initial_result[
                    "classical"
                ]["bitstring"],
                "qubo_cost": initial_result[
                    "classical"
                ]["qubo_cost"],
            },
            "qaoa": {
                "bitstring": initial_result[
                    "quantum"
                ]["bitstring"],
                "qubo_cost": initial_result[
                    "quantum"
                ]["qubo_cost"],
                "probability": initial_result[
                    "quantum"
                ]["probability"],
                "expectation": initial_result[
                    "quantum"
                ]["expectation"],
            },
            "optimality_gap_percent":
                initial_result[
                    "optimality_gap_percent"
                ],
            "classical_runtime_sec":
                initial_result[
                    "classical_runtime_sec"
                ],
            "quantum_runtime_sec":
                initial_result[
                    "quantum_runtime_sec"
                ],
            "number_of_variables":
                initial_result[
                    "number_of_variables"
                ],
            "number_of_groups":
                initial_result[
                    "number_of_groups"
                ],
        },

        "dynamic": {
            "classical": {
                "bitstring": dynamic_result[
                    "classical"
                ]["bitstring"],
                "qubo_cost": dynamic_result[
                    "classical"
                ]["qubo_cost"],
            },
            "qaoa": {
                "bitstring": dynamic_result[
                    "quantum"
                ]["bitstring"],
                "qubo_cost": dynamic_result[
                    "quantum"
                ]["qubo_cost"],
                "probability": dynamic_result[
                    "quantum"
                ]["probability"],
                "expectation": dynamic_result[
                    "quantum"
                ]["expectation"],
            },
            "optimality_gap_percent":
                dynamic_result[
                    "optimality_gap_percent"
                ],
            "classical_runtime_sec":
                dynamic_result[
                    "classical_runtime_sec"
                ],
            "quantum_runtime_sec":
                dynamic_result[
                    "quantum_runtime_sec"
                ],
            "number_of_variables":
                dynamic_result[
                    "number_of_variables"
                ],
            "number_of_groups":
                dynamic_result[
                    "number_of_groups"
                ],
        },
    }

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            output,
            file,
            indent=2,
        )

    return output_path


def main():
    print()
    print("=" * 70)
    print(
        "Q-RESCUE QUANTUM vs CLASSICAL "
        "BENCHMARK"
    )
    print("=" * 70)

    print()
    print(
        "Loading Digital Disaster Twin "
        "scenarios..."
    )

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

    initial_result = run_scenario(
        "INITIAL DISASTER SCENARIO",
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    # ---------------------------------------------------------
    # DYNAMIC CHANGE
    # ---------------------------------------------------------

    print()
    print("#" * 70)
    print("DYNAMIC DISASTER CHANGE")
    print("#" * 70)

    print()
    print(
        "route-001: OPEN → BLOCKED"
    )

    print(
        "Mylavaram: MODERATE → HIGH"
    )

    print(
        "Mylavaram predicted patients: "
        "18 → 35"
    )

    print(
        "Mylavaram resource demand: "
        "18 → 35"
    )

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
        "Mylavaram → Mylavaram Emergency "
        "Shelter: OPEN → BLOCKED"
    )

    apply_dynamic_changes(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    # ---------------------------------------------------------
    # DYNAMIC SCENARIO
    # ---------------------------------------------------------

    dynamic_result = run_scenario(
        "DYNAMIC DISASTER SCENARIO",
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    # ---------------------------------------------------------
    # FINAL SUMMARY
    # ---------------------------------------------------------

    print()
    print("=" * 70)
    print("FINAL BENCHMARK SUMMARY")
    print("=" * 70)

    print()
    print("INITIAL SCENARIO")

    print(
        f"Classical cost : "
        f"{initial_result['classical']['qubo_cost']:.2f}"
    )

    print(
        f"QAOA cost      : "
        f"{initial_result['quantum']['qubo_cost']:.2f}"
    )

    print(
        f"Optimality gap : "
        f"{initial_result['optimality_gap_percent']:.4f}%"
    )

    print()
    print("DYNAMIC SCENARIO")

    print(
        f"Classical cost : "
        f"{dynamic_result['classical']['qubo_cost']:.2f}"
    )

    print(
        f"QAOA cost      : "
        f"{dynamic_result['quantum']['qubo_cost']:.2f}"
    )

    print(
        f"Optimality gap : "
        f"{dynamic_result['optimality_gap_percent']:.4f}%"
    )

    initial_match = (
        initial_result[
            "optimality_gap_percent"
        ] < 1e-9
    )

    dynamic_match = (
        dynamic_result[
            "optimality_gap_percent"
        ] < 1e-9
    )

    print()

    if initial_match and dynamic_match:

        print(
            "OVERALL RESULT"
        )

        print(
            "QAOA MATCHED THE CLASSICAL "
            "OPTIMUM IN BOTH SCENARIOS."
        )

    else:

        print(
            "OVERALL RESULT"
        )

        print(
            "QAOA PRODUCED FEASIBLE "
            "SOLUTIONS, BUT DID NOT MATCH "
            "THE CLASSICAL OPTIMUM IN "
            "EVERY SCENARIO."
        )

    # ---------------------------------------------------------
    # SAVE
    # ---------------------------------------------------------

    output_path = save_results(
        initial_result,
        dynamic_result,
    )

    print()
    print(
        "Benchmark results saved to:"
    )

    print(output_path)

    print()
    print(
        "QUANTUM vs CLASSICAL "
        "BENCHMARK COMPLETE"
    )


if __name__ == "__main__":
    main()