import numpy as np
from scipy.optimize import minimize

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector


# ============================================================
# QUBO COST VALUES
# ============================================================

def create_cost_values(qubo: dict):

    n = len(qubo["linear"])

    dimension = 2 ** n

    costs = np.zeros(
        dimension,
        dtype=float,
    )

    for state in range(dimension):

        bits = [
            (state >> i) & 1
            for i in range(n)
        ]

        value = 0.0

        # Linear terms
        for i, bit in enumerate(bits):

            value += (
                qubo["linear"][i]
                * bit
            )

        # Quadratic terms
        for (
            i,
            j,
        ), coefficient in qubo["quadratic"].items():

            value += (
                coefficient
                * bits[i]
                * bits[j]
            )

        costs[state] = value

    return costs


# ============================================================
# QUBO -> ISING
# ============================================================

def qubo_to_ising(qubo: dict):

    n = len(qubo["linear"])

    constant = 0.0

    z_terms = np.zeros(
        n,
        dtype=float,
    )

    zz_terms = {}

    # Linear terms
    for i in range(n):

        qii = qubo["linear"][i]

        constant += qii / 2.0

        z_terms[i] -= qii / 2.0

    # Quadratic terms
    for (
        i,
        j,
    ), qij in qubo["quadratic"].items():

        constant += qij / 4.0

        z_terms[i] -= qij / 4.0

        z_terms[j] -= qij / 4.0

        zz_terms[(i, j)] = qij / 4.0

    return (
        constant,
        z_terms,
        zz_terms,
    )


# ============================================================
# GROUP INFORMATION
# ============================================================

def get_ambulance_groups(
    assignments,
):

    groups = {}

    for index, assignment in enumerate(
        assignments
    ):

        ambulance_id = (
            assignment.ambulance_id
        )

        if ambulance_id not in groups:

            groups[ambulance_id] = []

        groups[ambulance_id].append(
            index
        )

    return list(
        groups.values()
    )


# ============================================================
# INITIAL FEASIBLE STATE
# ============================================================

def create_initial_state(
    circuit,
    groups,
):

    for group in groups:

        if not group:
            continue

        # Activate first zone for each ambulance.
        circuit.x(
            group[0]
        )


# ============================================================
# CONSTRAINT-PRESERVING QAOA CIRCUIT
# ============================================================

def create_resource_qaoa_circuit(
    qubo: dict,
    assignments,
    parameters,
    reps: int = 2,
):

    num_qubits = len(
        assignments
    )

    _, z_terms, zz_terms = (
        qubo_to_ising(qubo)
    )

    parameters = np.asarray(
        parameters,
        dtype=float,
    )

    expected = 2 * reps

    if len(parameters) != expected:

        raise ValueError(
            f"Expected {expected} "
            f"QAOA parameters but received "
            f"{len(parameters)}."
        )

    gammas = parameters[
        :reps
    ]

    betas = parameters[
        reps:
    ]

    groups = get_ambulance_groups(
        assignments
    )

    circuit = QuantumCircuit(
        num_qubits
    )

    # ========================================================
    # FEASIBLE INITIAL STATE
    # ========================================================

    create_initial_state(
        circuit,
        groups,
    )

    # ========================================================
    # QAOA LAYERS
    # ========================================================

    for layer in range(reps):

        gamma = gammas[layer]

        beta = betas[layer]

        # ----------------------------------------------------
        # COST - Z TERMS
        # ----------------------------------------------------

        for i in range(num_qubits):

            coefficient = z_terms[i]

            if abs(coefficient) > 1e-12:

                circuit.rz(
                    2.0
                    * gamma
                    * coefficient,
                    i,
                )

        # ----------------------------------------------------
        # COST - ZZ TERMS
        # ----------------------------------------------------

        for (
            i,
            j,
        ), coefficient in zz_terms.items():

            circuit.cx(
                i,
                j,
            )

            circuit.rz(
                2.0
                * gamma
                * coefficient,
                j,
            )

            circuit.cx(
                i,
                j,
            )

        # ----------------------------------------------------
        # XY MIXER
        # ----------------------------------------------------
        #
        # The XY mixer preserves the number of selected
        # qubits in each ambulance group.
        #
        # Therefore exactly one zone remains selected
        # for every ambulance.
        #
        # ----------------------------------------------------

        for group in groups:

            for position in range(
                len(group) - 1
            ):

                q1 = group[position]

                q2 = group[
                    position + 1
                ]

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


# ============================================================
# EXPECTATION VALUE
# ============================================================

def calculate_expectation(
    qubo: dict,
    assignments,
    parameters,
    reps: int = 2,
):

    circuit = create_resource_qaoa_circuit(
        qubo=qubo,
        assignments=assignments,
        parameters=parameters,
        reps=reps,
    )

    statevector = (
        Statevector.from_instruction(
            circuit
        )
    )

    probabilities = (
        statevector.probabilities()
    )

    costs = create_cost_values(
        qubo
    )

    expectation = float(
        np.dot(
            probabilities,
            costs,
        )
    )

    return expectation


# ============================================================
# PARAMETER OPTIMIZATION
# ============================================================

def optimize_parameters(
    qubo: dict,
    assignments,
    reps: int = 2,
):

    initial_parameters = np.array(
        [0.2] * reps
        + [0.4] * reps,
        dtype=float,
    )

    def objective(parameters):

        return calculate_expectation(
            qubo=qubo,
            assignments=assignments,
            parameters=parameters,
            reps=reps,
        )

    result = minimize(
        objective,
        initial_parameters,
        method="COBYLA",
        options={
            "maxiter": 150,
        },
    )

    return result


# ============================================================
# RUN CONSTRAINED QAOA
# ============================================================

def run_resource_qaoa(
    qubo: dict,
    assignments,
    reps: int = 2,
):

    # --------------------------------------------------------
    # Optimize QAOA parameters
    # --------------------------------------------------------

    optimization_result = (
        optimize_parameters(
            qubo=qubo,
            assignments=assignments,
            reps=reps,
        )
    )

    parameters = (
        optimization_result.x
    )

    # --------------------------------------------------------
    # Final QAOA circuit
    # --------------------------------------------------------

    circuit = create_resource_qaoa_circuit(
        qubo=qubo,
        assignments=assignments,
        parameters=parameters,
        reps=reps,
    )

    # --------------------------------------------------------
    # Quantum simulation
    # --------------------------------------------------------

    statevector = (
        Statevector.from_instruction(
            circuit
        )
    )

    probabilities = (
        statevector.probabilities()
    )

    # --------------------------------------------------------
    # Calculate cost of every state
    # --------------------------------------------------------

    costs = create_cost_values(
        qubo
    )

    # --------------------------------------------------------
    # Ambulance groups
    # --------------------------------------------------------

    groups = get_ambulance_groups(
        assignments
    )

    valid_states = []

    # ========================================================
    # SEARCH ALL QUANTUM STATES
    # ========================================================

    for state in range(
        len(probabilities)
    ):

        probability = float(
            probabilities[state]
        )

        if probability <= 1e-12:

            continue

        bits = [
            (state >> i) & 1
            for i in range(
                len(assignments)
            )
        ]

        valid = True

        # ----------------------------------------------------
        # Constraint 1:
        # Exactly one zone per ambulance.
        # ----------------------------------------------------

        for group in groups:

            selected_count = sum(
                bits[index]
                for index in group
            )

            if selected_count != 1:

                valid = False

                break

        if not valid:

            continue

        # ----------------------------------------------------
        # Constraint 2:
        # Blocked routes cannot be selected.
        # ----------------------------------------------------

        for index, bit in enumerate(
            bits
        ):

            if bit == 1:

                if (
                    assignments[index]
                    .route_status
                    != "open"
                ):

                    valid = False

                    break

        if not valid:

            continue

        # ----------------------------------------------------
        # Keep feasible states.
        # ----------------------------------------------------

        valid_states.append(
            {
                "state": state,
                "probability": probability,
                "cost": float(
                    costs[state]
                ),
            }
        )

    # ========================================================
    # FEASIBILITY CHECK
    # ========================================================

    if not valid_states:

        raise RuntimeError(
            "No feasible QAOA state found."
        )

    # ========================================================
    # SELECT BEST FEASIBLE SOLUTION
    # ========================================================
    #
    # IMPORTANT:
    #
    # Highest probability does NOT necessarily mean
    # lowest QUBO cost.
    #
    # Therefore the final solution is the feasible
    # state with the lowest QUBO cost.
    #
    # ========================================================

    best_solution = min(
        valid_states,
        key=lambda item: item["cost"],
    )

    best_state = best_solution[
        "state"
    ]

    best_probability = best_solution[
        "probability"
    ]

    final_cost = best_solution[
        "cost"
    ]

    # --------------------------------------------------------
    # Convert state to bitstring.
    # --------------------------------------------------------

    num_qubits = len(
        assignments
    )

    bitstring = format(
        best_state,
        f"0{num_qubits}b",
    )

    # Qiskit uses little-endian ordering.
    bitstring = bitstring[::-1]

    # ========================================================
    # RETURN RESULTS
    # ========================================================

    return {
        "bitstring": bitstring,

        "probability": best_probability,

        "qubo_cost": final_cost,

        "expectation_value": float(
            optimization_result.fun
        ),

        "parameters": parameters,

        "iterations": getattr(
            optimization_result,
            "nfev",
            None,
        ),

        "optimizer_success": bool(
            optimization_result.success
        ),

        "optimizer_message": str(
            optimization_result.message
        ),

        "circuit": circuit,

        "statevector": statevector,

        "probabilities": probabilities,
    }