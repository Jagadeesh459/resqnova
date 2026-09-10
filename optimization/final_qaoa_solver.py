import numpy as np

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

from scipy.optimize import minimize


def qubo_to_ising(Q):
    n = Q.shape[0]

    h = np.zeros(n)
    J = {}

    for i in range(n):
        h[i] += -Q[i, i] / 2.0

    for i in range(n):
        for j in range(i + 1, n):

            coefficient = (
                Q[i, j] + Q[j, i]
            )

            if abs(coefficient) < 1e-12:
                continue

            h[i] -= coefficient / 4.0
            h[j] -= coefficient / 4.0

            J[(i, j)] = (
                J.get((i, j), 0.0)
                + coefficient / 4.0
            )

    return h, J


def bitstring_from_state(
    state,
    number_of_qubits,
):
    return format(
        state,
        f"0{number_of_qubits}b",
    )[::-1]


def qubo_cost(bitstring, Q):

    x = np.array(
        [
            int(bit)
            for bit in bitstring
        ],
        dtype=float,
    )

    return float(
        x @ Q @ x
    )


def create_initial_state(
    groups,
    number_of_qubits,
):
    circuit = QuantumCircuit(
        number_of_qubits
    )

    # Start with one selected variable
    # in every exactly-one group.

    for group in groups:

        if group:
            circuit.x(group[0])

    return circuit


def create_qaoa_circuit(
    Q,
    groups,
    gamma,
    beta,
    reps=2,
):
    number_of_qubits = Q.shape[0]

    h, J = qubo_to_ising(Q)

    circuit = create_initial_state(
        groups,
        number_of_qubits,
    )

    for layer in range(reps):

        # -----------------------------------------------------
        # Cost Hamiltonian
        # -----------------------------------------------------

        for i in range(number_of_qubits):

            if abs(h[i]) > 1e-12:

                circuit.rz(
                    2.0
                    * gamma[layer]
                    * h[i],
                    i,
                )

        for (i, j), coefficient in J.items():

            circuit.rzz(
                2.0
                * gamma[layer]
                * coefficient,
                i,
                j,
            )

        # -----------------------------------------------------
        # XY mixer
        # -----------------------------------------------------

        for group in groups:

            for position in range(
                len(group) - 1
            ):

                q1 = group[position]
                q2 = group[position + 1]

                circuit.rxx(
                    2.0
                    * beta[layer],
                    q1,
                    q2,
                )

                circuit.ryy(
                    2.0
                    * beta[layer],
                    q1,
                    q2,
                )

    return circuit


def calculate_expectation(
    Q,
    statevector,
):
    probabilities = (
        statevector.probabilities()
    )

    expectation = 0.0

    for state, probability in enumerate(
        probabilities
    ):

        if probability < 1e-12:
            continue

        bitstring = bitstring_from_state(
            state,
            Q.shape[0],
        )

        expectation += (
            probability
            * qubo_cost(
                bitstring,
                Q,
            )
        )

    return float(expectation)


def run_final_qaoa(
    Q,
    groups,
    valid_solution,
    reps=2,
):
    number_of_qubits = Q.shape[0]

    print(
        f"Total QAOA variables : "
        f"{number_of_qubits}"
    )

    print(
        f"Quantum groups       : "
        f"{len(groups)}"
    )

    print(
        "Running final QAOA..."
    )

    def objective(parameters):

        gamma = parameters[:reps]
        beta = parameters[reps:]

        circuit = create_qaoa_circuit(
            Q,
            groups,
            gamma,
            beta,
            reps,
        )

        statevector = (
            Statevector.from_instruction(
                circuit
            )
        )

        return calculate_expectation(
            Q,
            statevector,
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
            "maxiter": 150
        },
    )

    parameters = result.x

    gamma = parameters[:reps]
    beta = parameters[reps:]

    circuit = create_qaoa_circuit(
        Q,
        groups,
        gamma,
        beta,
        reps,
    )

    statevector = (
        Statevector.from_instruction(
            circuit
        )
    )

    probabilities = (
        statevector.probabilities()
    )

    best_bitstring = None
    best_probability = 0.0
    best_cost = float("inf")

    # ---------------------------------------------------------
    # Select the best feasible state produced by QAOA.
    # ---------------------------------------------------------

    for state, probability in enumerate(
        probabilities
    ):

        if probability < 1e-10:
            continue

        bitstring = bitstring_from_state(
            state,
            number_of_qubits,
        )

        if not valid_solution(
            bitstring
        ):
            continue

        cost = qubo_cost(
            bitstring,
            Q,
        )

        if cost < best_cost:

            best_cost = cost
            best_bitstring = bitstring
            best_probability = probability

    if best_bitstring is None:
        raise RuntimeError(
            "QAOA did not produce a "
            "feasible integrated solution."
        )

    expectation = calculate_expectation(
        Q,
        statevector,
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
        "circuit": circuit,
        "optimization_success": bool(
            result.success
        ),
    }