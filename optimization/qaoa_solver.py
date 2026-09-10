import numpy as np
from scipy.optimize import minimize

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector


# ============================================================
# QUBO → ISING
# ============================================================

def qubo_to_ising(qubo: dict):
    """
    Convert a QUBO problem into an Ising representation.

    QUBO:

        f(x) = sum(Qii * xi)
             + sum(Qij * xi * xj)

    Binary variable:

        xi ∈ {0, 1}

    Ising mapping:

        xi = (1 - Zi) / 2
    """

    n = len(qubo["linear"])

    constant = 0.0

    z_terms = np.zeros(
        n,
        dtype=float,
    )

    zz_terms = {}

    # --------------------------------------------------------
    # Linear QUBO terms
    # --------------------------------------------------------

    for i in range(n):

        qii = qubo["linear"][i]

        constant += qii / 2.0

        z_terms[i] -= qii / 2.0

    # --------------------------------------------------------
    # Quadratic QUBO terms
    # --------------------------------------------------------

    for (i, j), qij in qubo["quadratic"].items():

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
# QUBO COST FOR ALL BASIS STATES
# ============================================================

def create_cost_values(qubo: dict):
    """
    Calculate the QUBO cost of every possible
    computational basis state.
    """

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

        # ----------------------------------------------------
        # Linear contribution
        # ----------------------------------------------------

        for i, bit in enumerate(bits):

            value += (
                qubo["linear"][i]
                * bit
            )

        # ----------------------------------------------------
        # Quadratic contribution
        # ----------------------------------------------------

        for (
            i,
            j,
        ), coefficient in (
            qubo["quadratic"].items()
        ):

            value += (
                coefficient
                * bits[i]
                * bits[j]
            )

        costs[state] = value

    return costs


# ============================================================
# QAOA CIRCUIT
# ============================================================

def create_qaoa_circuit(
    qubo: dict,
    parameters,
    reps: int = 2,
):
    """
    Create the QAOA circuit.

    parameters:

        [gamma_1, gamma_2, ..., gamma_p,
         beta_1,  beta_2,  ..., beta_p]

    Each QAOA layer contains:

        1. Cost Hamiltonian
        2. Mixer Hamiltonian
    """

    num_qubits = len(
        qubo["linear"]
    )

    _, z_terms, zz_terms = (
        qubo_to_ising(qubo)
    )

    parameters = np.asarray(
        parameters,
        dtype=float,
    )

    expected_parameters = 2 * reps

    if len(parameters) != expected_parameters:

        raise ValueError(
            "Incorrect number of QAOA parameters. "
            f"Expected {expected_parameters}, "
            f"received {len(parameters)}."
        )

    gammas = parameters[:reps]

    betas = parameters[reps:]

    circuit = QuantumCircuit(
        num_qubits
    )

    # ========================================================
    # INITIAL SUPERPOSITION
    # ========================================================

    for qubit in range(num_qubits):

        circuit.h(qubit)

    # ========================================================
    # QAOA LAYERS
    # ========================================================

    for layer in range(reps):

        gamma = gammas[layer]

        beta = betas[layer]

        # ----------------------------------------------------
        # COST HAMILTONIAN — Z TERMS
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
        # COST HAMILTONIAN — ZZ TERMS
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
        # MIXER HAMILTONIAN
        # ----------------------------------------------------

        for qubit in range(num_qubits):

            circuit.rx(
                2.0 * beta,
                qubit,
            )

    return circuit


# ============================================================
# EXPECTATION VALUE
# ============================================================

def calculate_expectation(
    qubo: dict,
    parameters,
    reps: int = 2,
):
    """
    Calculate the expected QUBO cost of the
    QAOA quantum state.
    """

    circuit = create_qaoa_circuit(
        qubo=qubo,
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
# CLASSICAL OPTIMIZATION OF QAOA PARAMETERS
# ============================================================

def optimize_qaoa_parameters(
    qubo: dict,
    reps: int = 2,
):
    """
    Optimize the QAOA gamma and beta parameters.

    This is the hybrid quantum-classical loop:

        QAOA circuit
             ↓
        Quantum state
             ↓
        Expectation value
             ↓
        Classical optimizer
             ↓
        Updated parameters
             ↓
        QAOA circuit
             ↓
            ...

    """

    # --------------------------------------------------------
    # Initial parameter guess
    # --------------------------------------------------------

    initial_parameters = np.array(
        [0.5] * reps
        + [0.5] * reps,
        dtype=float,
    )

    # --------------------------------------------------------
    # Objective function
    # --------------------------------------------------------

    def objective(parameters):

        return calculate_expectation(
            qubo=qubo,
            parameters=parameters,
            reps=reps,
        )

    # --------------------------------------------------------
    # Classical optimizer
    # --------------------------------------------------------

    optimization_result = minimize(
        objective,
        initial_parameters,
        method="COBYLA",
        options={
            "maxiter": 100,
        },
    )

    return optimization_result


# ============================================================
# RUN VARIATIONAL QAOA
# ============================================================

def run_qaoa(
    qubo: dict,
    reps: int = 2,
):
    """
    Run the complete variational QAOA workflow.

    1. Build parameterized QAOA
    2. Optimize gamma and beta
    3. Build final circuit
    4. Simulate using Statevector
    5. Obtain probability distribution
    6. Select the most probable state
    """

    # ========================================================
    # STEP 1 — CLASSICAL OPTIMIZATION OF PARAMETERS
    # ========================================================

    optimization_result = (
        optimize_qaoa_parameters(
            qubo=qubo,
            reps=reps,
        )
    )

    optimized_parameters = (
        optimization_result.x
    )

    # ========================================================
    # STEP 2 — BUILD FINAL QAOA CIRCUIT
    # ========================================================

    circuit = create_qaoa_circuit(
        qubo=qubo,
        parameters=optimized_parameters,
        reps=reps,
    )

    # ========================================================
    # STEP 3 — QUANTUM SIMULATION
    # ========================================================

    statevector = (
        Statevector.from_instruction(
            circuit
        )
    )

    probabilities = (
        statevector.probabilities()
    )

    # ========================================================
    # STEP 4 — MOST PROBABLE QUANTUM STATE
    # ========================================================

    best_state = int(
        np.argmax(probabilities)
    )

    best_probability = float(
        probabilities[best_state]
    )

    num_qubits = len(
        qubo["linear"]
    )

    # ========================================================
    # STEP 5 — CONVERT TO BITSTRING
    # ========================================================

    bitstring = format(
        best_state,
        f"0{num_qubits}b",
    )

    # Qiskit uses little-endian qubit ordering.
    # Reverse it so x0,x1,x2 match our QUBO variables.
    bitstring = bitstring[::-1]

    # ========================================================
    # STEP 6 — FINAL QUBO COST
    # ========================================================

    costs = create_cost_values(
        qubo
    )

    final_cost = float(
        costs[best_state]
    )

    # ========================================================
    # STEP 7 — RETURN RESULT
    # ========================================================

    return {
        "bitstring": bitstring,

        "probability": best_probability,

        "qubo_cost": final_cost,

        "expectation_value": float(
            optimization_result.fun
        ),

        "parameters": optimized_parameters,

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