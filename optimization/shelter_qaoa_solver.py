import numpy as np

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

from scipy.optimize import minimize

from optimization.shelter_qubo import (
    ShelterAssignment,
    build_shelter_qubo,
    calculate_qubo_cost,
    decode_shelter_solution,
    is_valid_shelter_solution,
)


def qubo_to_ising(qubo: dict):

    linear = qubo["linear"]
    quadratic = qubo["quadratic"]

    n = 0

    if linear:
        n = max(n, max(linear.keys()) + 1)

    for i, j in quadratic.keys():
        n = max(n, i + 1, j + 1)

    h = np.zeros(n)
    J = {}

    # x = (1 - Z) / 2

    for i, coefficient in linear.items():
        h[i] += -coefficient / 2.0

    for (i, j), coefficient in quadratic.items():

        h[i] += -coefficient / 4.0
        h[j] += -coefficient / 4.0

        J[(i, j)] = (
            J.get((i, j), 0.0)
            + coefficient / 4.0
        )

    return h, J


def create_initial_state(
    assignments: list[ShelterAssignment],
    scenario: dict,
):

    n = len(assignments)

    circuit = QuantumCircuit(n)

    # Start with the first available shelter
    # for every evacuation zone.

    zones = scenario["zones"]

    for zone in zones:

        zone_assignments = [
            assignment
            for assignment in assignments
            if assignment.zone_id == zone["id"]
        ]

        if not zone_assignments:
            continue

        selected = None

        for assignment in zone_assignments:

            if assignment.route_status == "open":

                if (
                    assignment.available_capacity
                    >= assignment.predicted_evacuees
                ):

                    selected = assignment
                    break

        if selected is None:
            selected = zone_assignments[0]

        circuit.x(selected.index)

    return circuit


def create_shelter_qaoa_circuit(
    qubo: dict,
    assignments: list[ShelterAssignment],
    scenario: dict,
    gamma: float,
    beta: float,
    reps: int = 2,
):

    n = len(assignments)

    h, J = qubo_to_ising(qubo)

    circuit = create_initial_state(
        assignments,
        scenario,
    )

    for _ in range(reps):

        # -----------------------------------------------------
        # Cost Hamiltonian
        # -----------------------------------------------------

        for i in range(n):

            if abs(h[i]) > 1e-12:

                circuit.rz(
                    2.0 * gamma * h[i],
                    i,
                )

        for (i, j), coefficient in J.items():

            if abs(coefficient) > 1e-12:

                circuit.rzz(
                    2.0 * gamma * coefficient,
                    i,
                    j,
                )

        # -----------------------------------------------------
        # XY mixer
        # Preserves one-hot structure better than X mixer.
        # -----------------------------------------------------

        for zone in scenario["zones"]:

            zone_indices = [
                assignment.index
                for assignment in assignments
                if assignment.zone_id == zone["id"]
            ]

            for position in range(
                len(zone_indices) - 1
            ):

                q1 = zone_indices[position]
                q2 = zone_indices[position + 1]

                circuit.rxx(
                    2.0 * beta,
                    q1,
                    q2,
                )

                circuit.ryy(
                    2.0 * beta,
                    q1,
                    q2,
                )

    return circuit


def statevector_from_parameters(
    qubo,
    assignments,
    scenario,
    parameters,
    reps=2,
):

    gamma = parameters[:reps]
    beta = parameters[reps:]

    circuit = create_initial_state(
        assignments,
        scenario,
    )

    n = len(assignments)

    h, J = qubo_to_ising(qubo)

    for layer in range(reps):

        for i in range(n):

            if abs(h[i]) > 1e-12:

                circuit.rz(
                    2.0 * gamma[layer] * h[i],
                    i,
                )

        for (i, j), coefficient in J.items():

            if abs(coefficient) > 1e-12:

                circuit.rzz(
                    2.0
                    * gamma[layer]
                    * coefficient,
                    i,
                    j,
                )

        for zone in scenario["zones"]:

            indices = [
                assignment.index
                for assignment in assignments
                if assignment.zone_id == zone["id"]
            ]

            for position in range(
                len(indices) - 1
            ):

                q1 = indices[position]
                q2 = indices[position + 1]

                circuit.rxx(
                    2.0 * beta[layer],
                    q1,
                    q2,
                )

                circuit.ryy(
                    2.0 * beta[layer],
                    q1,
                    q2,
                )

    return Statevector.from_instruction(circuit)


def expectation_value(
    statevector: Statevector,
    qubo: dict,
):

    probabilities = statevector.probabilities()

    n = len(qubo["linear"])

    expectation = 0.0

    for state, probability in enumerate(probabilities):

        if probability < 1e-12:
            continue

        bitstring = format(
            state,
            f"0{n}b",
        )[::-1]

        cost = calculate_qubo_cost(
            bitstring,
            qubo,
        )

        expectation += probability * cost

    return expectation


def run_shelter_qaoa(
    scenario: dict,
    reps: int = 2,
):

    assignments = []

    from optimization.shelter_qubo import build_assignments

    assignments = build_assignments(
        scenario
    )

    qubo = build_shelter_qubo(
        assignments,
        scenario,
    )

    n = len(assignments)

    print(
        f"Total QAOA variables : {n}"
    )

    print(
        "Running Shelter QAOA..."
    )

    def objective(parameters):

        statevector = statevector_from_parameters(
            qubo,
            assignments,
            scenario,
            parameters,
            reps,
        )

        return expectation_value(
            statevector,
            qubo,
        )

    initial_parameters = np.array(
        [0.5] * reps
        + [0.3] * reps,
        dtype=float,
    )

    result = minimize(
        objective,
        initial_parameters,
        method="COBYLA",
        options={
            "maxiter": 120
        },
    )

    optimized_parameters = result.x

    statevector = statevector_from_parameters(
        qubo,
        assignments,
        scenario,
        optimized_parameters,
        reps,
    )

    probabilities = statevector.probabilities()

    best_bitstring = None
    best_probability = 0.0
    best_cost = float("inf")

    for state, probability in enumerate(
        probabilities
    ):

        if probability < 1e-10:
            continue

        bitstring = format(
            state,
            f"0{n}b",
        )[::-1]

        if not is_valid_shelter_solution(
            bitstring,
            assignments,
            scenario,
        ):
            continue

        cost = calculate_qubo_cost(
            bitstring,
            qubo,
        )

        if cost < best_cost:

            best_cost = cost
            best_bitstring = bitstring
            best_probability = probability

    if best_bitstring is None:

        raise RuntimeError(
            "QAOA did not produce a feasible shelter allocation."
        )

    expectation = expectation_value(
        statevector,
        qubo,
    )

    decoded = decode_shelter_solution(
        best_bitstring,
        assignments,
    )

    return {
        "bitstring": best_bitstring,
        "probability": float(
            best_probability
        ),
        "qubo_cost": float(
            best_cost
        ),
        "expectation": float(
            expectation
        ),
        "assignments": decoded,
        "optimization_success": bool(
            result.success
        ),
    }