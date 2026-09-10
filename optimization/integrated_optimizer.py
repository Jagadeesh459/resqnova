import json
import math
from pathlib import Path

import numpy as np
from scipy.optimize import minimize

from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RESULTS_DIR = BASE_DIR / "results"


# ============================================================
# CONSTANTS
# ============================================================

RISK_WEIGHT = {
    "high": 100.0,
    "moderate": 50.0,
    "low": 15.0,
}

ROUTE_BLOCKED_PENALTY = 5000.0

ONE_HOT_PENALTY = 1200.0

HOSPITAL_ROUTE_WEIGHT = 10.0
HOSPITAL_DISTANCE_WEIGHT = 5.0
HOSPITAL_BED_BONUS = 2.0
HOSPITAL_EMERGENCY_BONUS = 5.0

AMBULANCE_TIME_WEIGHT = 3.0
AMBULANCE_CAPACITY_BONUS = 2.0


# ============================================================
# JSON
# ============================================================

def load_json(filename):

    path = DATA_DIR / filename

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def load_scenario():

    return {
        "hospital": load_json(
            "emergency_scenario.json"
        ),
        "resource": load_json(
            "resource_scenario.json"
        ),
    }


def deep_copy(data):

    return json.loads(
        json.dumps(data)
    )


# ============================================================
# HOSPITAL COST
# ============================================================

def hospital_cost(
    hospital,
    route,
    patients,
    high_severity_patients,
):

    cost = 0.0

    # --------------------------------------------------------
    # Blocked route
    # --------------------------------------------------------

    if route["status"].lower() != "open":

        return ROUTE_BLOCKED_PENALTY

    # --------------------------------------------------------
    # Insufficient beds
    # --------------------------------------------------------

    if hospital["available_beds"] < patients:

        cost += 5000.0

    # --------------------------------------------------------
    # Insufficient emergency capacity
    # --------------------------------------------------------

    if (
        hospital["emergency_capacity"]
        < high_severity_patients
    ):

        cost += 3000.0

    # --------------------------------------------------------
    # Travel
    # --------------------------------------------------------

    cost += (
        route["travel_time_min"]
        * HOSPITAL_ROUTE_WEIGHT
    )

    # --------------------------------------------------------
    # Distance
    # --------------------------------------------------------

    cost += (
        hospital["distance_km"]
        * HOSPITAL_DISTANCE_WEIGHT
    )

    # --------------------------------------------------------
    # Capacity bonuses
    # --------------------------------------------------------

    cost -= (
        hospital["available_beds"]
        * HOSPITAL_BED_BONUS
    )

    cost -= (
        hospital["emergency_capacity"]
        * HOSPITAL_EMERGENCY_BONUS
    )

    return cost


# ============================================================
# AMBULANCE COST
# ============================================================

def ambulance_cost(
    ambulance,
    zone,
    travel,
):

    cost = 0.0

    risk = zone[
        "risk_level"
    ].lower()

    # --------------------------------------------------------
    # Risk benefit
    # --------------------------------------------------------

    cost -= RISK_WEIGHT.get(
        risk,
        10.0,
    )

    # --------------------------------------------------------
    # Predicted patient demand
    # --------------------------------------------------------

    cost -= (
        zone["predicted_patients"]
        * 2.0
    )

    # --------------------------------------------------------
    # Resource demand
    # --------------------------------------------------------

    cost -= (
        zone["resource_demand"]
        * 1.5
    )

    # --------------------------------------------------------
    # Travel time
    # --------------------------------------------------------

    cost += (
        travel["travel_time_min"]
        * AMBULANCE_TIME_WEIGHT
    )

    # --------------------------------------------------------
    # Ambulance capacity
    # --------------------------------------------------------

    cost -= (
        ambulance["resource_capacity"]
        * AMBULANCE_CAPACITY_BONUS
    )

    # --------------------------------------------------------
    # Blocked route
    # --------------------------------------------------------

    if (
        travel["route_status"].lower()
        != "open"
    ):

        cost += ROUTE_BLOCKED_PENALTY

    return cost


# ============================================================
# BUILD VARIABLES
# ============================================================

def build_variables(
    scenario,
):

    variables = []

    # --------------------------------------------------------
    # Hospital variables
    # --------------------------------------------------------

    hospital_data = scenario[
        "hospital"
    ]

    hospitals = hospital_data[
        "hospitals"
    ]

    routes = {
        route["hospital_id"]: route
        for route in hospital_data[
            "routes"
        ]
    }

    emergency = hospital_data[
        "emergency"
    ]

    for hospital in hospitals:

        route = routes[
            hospital["id"]
        ]

        cost = hospital_cost(
            hospital,
            route,
            emergency["patients"],
            emergency[
                "high_severity_patients"
            ],
        )

        variables.append({
            "type": "hospital",
            "id": hospital["id"],
            "name": hospital["name"],
            "cost": cost,
        })

    # --------------------------------------------------------
    # Ambulance variables
    # --------------------------------------------------------

    resource_data = scenario[
        "resource"
    ]

    zones = resource_data[
        "zones"
    ]

    zone_lookup = {
        zone["id"]: zone
        for zone in zones
    }

    ambulances = resource_data[
        "ambulances"
    ]

    travel_lookup = {
        (
            item["ambulance_id"],
            item["zone_id"],
        ): item
        for item in resource_data[
            "travel_times"
        ]
    }

    for ambulance in ambulances:

        for zone in zones:

            travel = travel_lookup[
                (
                    ambulance["id"],
                    zone["id"],
                )
            ]

            cost = ambulance_cost(
                ambulance,
                zone,
                travel,
            )

            variables.append({
                "type": "ambulance",
                "ambulance_id":
                    ambulance["id"],
                "ambulance_name":
                    ambulance["name"],
                "zone_id":
                    zone["id"],
                "zone_name":
                    zone["name"],
                "risk_level":
                    zone["risk_level"],
                "travel_time_min":
                    travel["travel_time_min"],
                "resource_capacity":
                    ambulance[
                        "resource_capacity"
                    ],
                "route_status":
                    travel["route_status"],
                "cost": cost,
            })

    return variables


# ============================================================
# GROUP VARIABLES
# ============================================================

def build_groups(
    variables,
):

    groups = []

    hospital_indices = []

    ambulance_groups = {}

    for index, variable in enumerate(
        variables
    ):

        if variable["type"] == "hospital":

            hospital_indices.append(
                index
            )

        elif variable["type"] == "ambulance":

            ambulance_id = variable[
                "ambulance_id"
            ]

            ambulance_groups.setdefault(
                ambulance_id,
                [],
            )

            ambulance_groups[
                ambulance_id
            ].append(index)

    groups.append(
        hospital_indices
    )

    groups.extend(
        ambulance_groups.values()
    )

    return groups


# ============================================================
# QUBO COST FOR A BITSTRING
# ============================================================

def calculate_qubo_cost(
    bits,
    variables,
    groups,
):

    cost = 0.0

    # --------------------------------------------------------
    # Individual variable costs
    # --------------------------------------------------------

    for index, bit in enumerate(
        bits
    ):

        if bit:

            cost += variables[
                index
            ]["cost"]

    # --------------------------------------------------------
    # Exactly-one constraints
    #
    # (sum(x)-1)^2
    # --------------------------------------------------------

    for group in groups:

        selected = sum(
            bits[index]
            for index in group
        )

        cost += (
            ONE_HOT_PENALTY
            * (selected - 1) ** 2
        )

    return cost


# ============================================================
# QUBO MATRIX
# ============================================================

def build_qubo_matrix(
    variables,
    groups,
):

    n = len(
        variables
    )

    linear = np.zeros(
        n,
        dtype=float,
    )

    quadratic = {}

    for index, variable in enumerate(
        variables
    ):

        linear[index] = variable[
            "cost"
        ]

    # --------------------------------------------------------
    # Exactly-one constraint:
    #
    # P(sum xi - 1)^2
    #
    # = P(sum xi + 2 sum xixj - 2 sum xi + 1)
    #
    # --------------------------------------------------------

    for group in groups:

        for index in group:

            linear[index] -= (
                ONE_HOT_PENALTY
            )

        for position_i in range(
            len(group)
        ):

            for position_j in range(
                position_i + 1,
                len(group),
            ):

                i = group[
                    position_i
                ]

                j = group[
                    position_j
                ]

                quadratic[
                    (i, j)
                ] = (
                    quadratic.get(
                        (i, j),
                        0.0,
                    )
                    + 2.0
                    * ONE_HOT_PENALTY
                )

    return linear, quadratic


# ============================================================
# COST FROM INTEGER QUANTUM STATE
# ============================================================

def state_bits(
    state,
    n,
):

    return [
        (state >> index) & 1
        for index in range(n)
    ]


def state_cost(
    state,
    variables,
    groups,
):

    bits = state_bits(
        state,
        len(variables),
    )

    return calculate_qubo_cost(
        bits,
        variables,
        groups,
    )


# ============================================================
# VALID SOLUTION
# ============================================================

def is_valid_solution(
    bits,
    groups,
):

    for group in groups:

        if sum(
            bits[index]
            for index in group
        ) != 1:

            return False

    return True


# ============================================================
# QUBO → ISING
# ============================================================

def qubo_to_ising(
    linear,
    quadratic,
):

    n = len(
        linear
    )

    h = np.zeros(
        n,
        dtype=float,
    )

    couplings = {}

    constant = 0.0

    # x_i = (1 - Z_i) / 2

    for i in range(n):

        constant += (
            linear[i] / 2.0
        )

        h[i] -= (
            linear[i] / 2.0
        )

    # x_i x_j
    #
    # = 1/4(
    #   1 - Zi - Zj + ZiZj
    # )

    for (i, j), value in (
        quadratic.items()
    ):

        constant += (
            value / 4.0
        )

        h[i] -= (
            value / 4.0
        )

        h[j] -= (
            value / 4.0
        )

        couplings[
            (i, j)
        ] = (
            couplings.get(
                (i, j),
                0.0,
            )
            + value / 4.0
        )

    return (
        constant,
        h,
        couplings,
    )


# ============================================================
# INITIAL STATE
# ============================================================

def create_initial_state(
    groups,
    n,
):

    circuit = QuantumCircuit(
        n
    )

    # Select first option from
    # every one-hot group.

    for group in groups:

        if group:

            circuit.x(
                group[0]
            )

    return circuit


# ============================================================
# XY MIXER
# ============================================================

def apply_xy_mixer(
    circuit,
    groups,
    beta,
):

    for group in groups:

        for position in range(
            len(group) - 1
        ):

            q1 = group[
                position
            ]

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


# ============================================================
# COST UNITARY
# ============================================================

def apply_cost_unitary(
    circuit,
    h,
    couplings,
    gamma,
):

    # exp(-i gamma h_i Z_i)

    for index, coefficient in (
        enumerate(h)
    ):

        if abs(coefficient) > 1e-12:

            circuit.rz(
                2.0
                * gamma
                * coefficient,
                index,
            )

    # exp(-i gamma J_ij ZiZj)

    for (i, j), coefficient in (
        couplings.items()
    ):

        if abs(coefficient) > 1e-12:

            circuit.rzz(
                2.0
                * gamma
                * coefficient,
                i,
                j,
            )


# ============================================================
# QAOA CIRCUIT
# ============================================================

def create_qaoa_circuit(
    variables,
    groups,
    linear,
    quadratic,
    parameters,
    reps=2,
):

    n = len(
        variables
    )

    gamma_values = parameters[
        :reps
    ]

    beta_values = parameters[
        reps:
        reps * 2
    ]

    (
        _constant,
        h,
        couplings,
    ) = qubo_to_ising(
        linear,
        quadratic,
    )

    circuit = (
        create_initial_state(
            groups,
            n,
        )
    )

    for layer in range(
        reps
    ):

        apply_cost_unitary(
            circuit,
            h,
            couplings,
            gamma_values[
                layer
            ],
        )

        apply_xy_mixer(
            circuit,
            groups,
            beta_values[
                layer
            ],
        )

    return circuit


# ============================================================
# EXPECTATION VALUE
# ============================================================

def expectation_value(
    statevector,
    variables,
    groups,
):

    probabilities = (
        statevector.probabilities()
    )

    expectation = 0.0

    for state, probability in (
        enumerate(probabilities)
    ):

        if probability < 1e-12:

            continue

        cost = state_cost(
            state,
            variables,
            groups,
        )

        expectation += (
            probability
            * cost
        )

    return float(
        expectation
    )


# ============================================================
# QAOA OPTIMIZATION
# ============================================================

def optimize_qaoa(
    variables,
    groups,
    linear,
    quadratic,
    reps=2,
):

    n_parameters = (
        reps * 2
    )

    initial_parameters = np.array(
        [0.5] * n_parameters,
        dtype=float,
    )

    def objective(
        parameters
    ):

        circuit = (
            create_qaoa_circuit(
                variables,
                groups,
                linear,
                quadratic,
                parameters,
                reps,
            )
        )

        statevector = (
            Statevector.from_instruction(
                circuit
            )
        )

        return expectation_value(
            statevector,
            variables,
            groups,
        )

    result = minimize(
        objective,
        initial_parameters,
        method="COBYLA",
        options={
            "maxiter": 100,
        },
    )

    return result


# ============================================================
# DECODE SOLUTION
# ============================================================

def decode_solution(
    bitstring,
    variables,
    groups,
):

    selected_hospital = None

    ambulance_plan = []

    for index, bit in enumerate(
        bitstring
    ):

        if bit != "1":

            continue

        variable = variables[
            index
        ]

        if variable["type"] == "hospital":

            selected_hospital = variable

        elif variable["type"] == "ambulance":

            ambulance_plan.append(
                variable
            )

    return (
        selected_hospital,
        ambulance_plan,
    )


# ============================================================
# FIND BEST FEASIBLE QUANTUM STATE
# ============================================================

def find_best_state(
    statevector,
    variables,
    groups,
):

    probabilities = (
        statevector.probabilities()
    )

    best_state = None
    best_cost = math.inf
    best_probability = 0.0

    n = len(
        variables
    )

    for state, probability in (
        enumerate(probabilities)
    ):

        if probability <= 1e-12:

            continue

        bits = state_bits(
            state,
            n,
        )

        if not is_valid_solution(
            bits,
            groups,
        ):

            continue

        cost = calculate_qubo_cost(
            bits,
            variables,
            groups,
        )

        if cost < best_cost:

            best_state = state
            best_cost = cost
            best_probability = (
                float(probability)
            )

    if best_state is None:

        raise RuntimeError(
            "QAOA produced no feasible "
            "one-hot state."
        )

    bitstring = format(
        best_state,
        f"0{n}b",
    )[::-1]

    return (
        bitstring,
        best_cost,
        best_probability,
    )


# ============================================================
# RUN QUANTUM ENGINE
# ============================================================

def run_quantum_engine(
    scenario,
    title,
):

    print()
    print("=" * 60)
    print(title)
    print("=" * 60)

    variables = build_variables(
        scenario
    )

    groups = build_groups(
        variables
    )

    linear, quadratic = (
        build_qubo_matrix(
            variables,
            groups,
        )
    )

    print()
    print(
        f"Total QAOA variables : "
        f"{len(variables)}"
    )

    print(
        f"Quantum groups       : "
        f"{len(groups)}"
    )

    print(
        "Running QAOA..."
    )

    optimization_result = (
        optimize_qaoa(
            variables,
            groups,
            linear,
            quadratic,
            reps=2,
        )
    )

    parameters = (
        optimization_result.x
    )

    circuit = (
        create_qaoa_circuit(
            variables,
            groups,
            linear,
            quadratic,
            parameters,
            reps=2,
        )
    )

    statevector = (
        Statevector.from_instruction(
            circuit
        )
    )

    (
        bitstring,
        cost,
        probability,
    ) = find_best_state(
        statevector,
        variables,
        groups,
    )

    (
        selected_hospital,
        ambulance_plan,
    ) = decode_solution(
        bitstring,
        variables,
        groups,
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print(
        f"QAOA bitstring : "
        f"{bitstring}"
    )

    print(
        f"Probability    : "
        f"{probability:.6f}"
    )

    print(
        f"QUBO cost      : "
        f"{cost:.2f}"
    )

    print(
        f"Expectation     : "
        f"{optimization_result.fun:.2f}"
    )

    print()

    print(
        "SELECTED HOSPITAL"
    )

    print("-" * 60)

    if selected_hospital:

        print(
            f"{selected_hospital['name']}"
        )

    else:

        print(
            "No hospital selected"
        )

    print()
    print(
        "AMBULANCE PRE-POSITIONING"
    )

    print("-" * 60)

    for ambulance in ambulance_plan:

        print(
            f"{ambulance['ambulance_name']} "
            f"→ {ambulance['zone_name']} "
            f"[{ambulance['risk_level'].upper()}] "
            f"| ETA "
            f"{ambulance['travel_time_min']} min "
            f"| capacity "
            f"{ambulance['resource_capacity']}"
        )

    return {
        "bitstring": bitstring,
        "probability": probability,
        "qubo_cost": cost,
        "expectation": float(
            optimization_result.fun
        ),
        "hospital": selected_hospital,
        "ambulances": ambulance_plan,
    }


# ============================================================
# DETECT CHANGES
# ============================================================

def detect_changes(
    original,
    changed,
):

    changes = []

    # --------------------------------------------------------
    # Hospital routes
    # --------------------------------------------------------

    old_routes = {
        item["id"]: item
        for item in original[
            "hospital"
        ]["routes"]
    }

    new_routes = {
        item["id"]: item
        for item in changed[
            "hospital"
        ]["routes"]
    }

    for route_id in old_routes:

        old_status = old_routes[
            route_id
        ]["status"]

        new_status = new_routes[
            route_id
        ]["status"]

        if old_status != new_status:

            changes.append({
                "type": "hospital_route",
                "id": route_id,
                "old": old_status,
                "new": new_status,
            })

    # --------------------------------------------------------
    # Disaster zones
    # --------------------------------------------------------

    old_zones = {
        item["id"]: item
        for item in original[
            "resource"
        ]["zones"]
    }

    new_zones = {
        item["id"]: item
        for item in changed[
            "resource"
        ]["zones"]
    }

    for zone_id in old_zones:

        old = old_zones[
            zone_id
        ]

        new = new_zones[
            zone_id
        ]

        if (
            old["risk_level"]
            != new["risk_level"]
        ):

            changes.append({
                "type": "risk",
                "zone": new["name"],
                "old": old[
                    "risk_level"
                ],
                "new": new[
                    "risk_level"
                ],
            })

        if (
            old["predicted_patients"]
            != new["predicted_patients"]
        ):

            changes.append({
                "type": "patients",
                "zone": new["name"],
                "old": old[
                    "predicted_patients"
                ],
                "new": new[
                    "predicted_patients"
                ],
            })

        if (
            old["resource_demand"]
            != new["resource_demand"]
        ):

            changes.append({
                "type": "resource_demand",
                "zone": new["name"],
                "old": old[
                    "resource_demand"
                ],
                "new": new[
                    "resource_demand"
                ],
            })

    # --------------------------------------------------------
    # Ambulance routes
    # --------------------------------------------------------

    old_travel = {
        (
            item["ambulance_id"],
            item["zone_id"],
        ): item
        for item in original[
            "resource"
        ]["travel_times"]
    }

    new_travel = {
        (
            item["ambulance_id"],
            item["zone_id"],
        ): item
        for item in changed[
            "resource"
        ]["travel_times"]
    }

    for key in old_travel:

        old_status = old_travel[
            key
        ]["route_status"]

        new_status = new_travel[
            key
        ]["route_status"]

        if old_status != new_status:

            changes.append({
                "type": "ambulance_route",
                "ambulance": key[0],
                "zone": key[1],
                "old": old_status,
                "new": new_status,
            })

    return changes


# ============================================================
# SIMULATE LIVE CHANGE
# ============================================================

def create_changed_scenario(
    scenario,
):

    changed = deep_copy(
        scenario
    )

    # --------------------------------------------------------
    # Mylavaram:
    # MODERATE → HIGH
    # --------------------------------------------------------

    for zone in changed[
        "resource"
    ]["zones"]:

        if zone["name"] == "Mylavaram":

            zone[
                "risk_level"
            ] = "high"

            zone[
                "predicted_patients"
            ] = 35

            zone[
                "resource_demand"
            ] = 35

    # --------------------------------------------------------
    # Hospital route:
    # Government General Hospital
    # OPEN → BLOCKED
    # --------------------------------------------------------

    for route in changed[
        "hospital"
    ]["routes"]:

        if route["id"] == "route-001":

            route[
                "status"
            ] = "blocked"

    # --------------------------------------------------------
    # Ambulance route:
    # Ambulance 1 → Mylavaram
    # OPEN → BLOCKED
    # --------------------------------------------------------

    for travel in changed[
        "resource"
    ]["travel_times"]:

        if (
            travel["ambulance_id"]
            == "AMB-001"
            and travel["zone_id"]
            == "zone-002"
        ):

            travel[
                "route_status"
            ] = "blocked"

    return changed


# ============================================================
# PRINT CHANGES
# ============================================================

def print_changes(
    changes,
):

    print()
    print("=" * 60)
    print(
        "DETECTED ENVIRONMENT CHANGES"
    )
    print("=" * 60)

    if not changes:

        print(
            "No significant changes."
        )

        return

    for change in changes:

        change_type = change[
            "type"
        ]

        if change_type == "hospital_route":

            print(
                f"{change['id']}: "
                f"{change['old'].upper()} "
                f"→ "
                f"{change['new'].upper()}"
            )

        elif change_type == "risk":

            print(
                f"{change['zone']}: "
                f"{change['old'].upper()} "
                f"→ "
                f"{change['new'].upper()}"
            )

        elif change_type == "patients":

            print(
                f"{change['zone']} "
                f"predicted patients: "
                f"{change['old']} "
                f"→ "
                f"{change['new']}"
            )

        elif change_type == "resource_demand":

            print(
                f"{change['zone']} "
                f"resource demand: "
                f"{change['old']} "
                f"→ "
                f"{change['new']}"
            )

        elif change_type == "ambulance_route":

            print(
                f"{change['ambulance']} → "
                f"{change['zone']}: "
                f"{change['old'].upper()} "
                f"→ "
                f"{change['new'].upper()}"
            )


# ============================================================
# SAVE RESULT
# ============================================================

def save_result(
    initial,
    final,
    changes,
):

    RESULTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output = {

        "system":
            "Q-Rescue Integrated Quantum Decision Engine",

        "initial_plan": {

            "qaoa_bitstring":
                initial[
                    "bitstring"
                ],

            "probability":
                initial[
                    "probability"
                ],

            "qubo_cost":
                initial[
                    "qubo_cost"
                ],

            "expectation":
                initial[
                    "expectation"
                ],

            "selected_hospital":
                (
                    initial["hospital"]["name"]
                    if initial["hospital"]
                    else None
                ),

            "ambulance_positions":
                initial[
                    "ambulances"
                ],
        },

        "environment_changes":
            changes,

        "reoptimized_plan": {

            "qaoa_bitstring":
                final[
                    "bitstring"
                ],

            "probability":
                final[
                    "probability"
                ],

            "qubo_cost":
                final[
                    "qubo_cost"
                ],

            "expectation":
                final[
                    "expectation"
                ],

            "selected_hospital":
                (
                    final["hospital"]["name"]
                    if final["hospital"]
                    else None
                ),

            "ambulance_positions":
                final[
                    "ambulances"
                ],
        },
    }

    output_path = (
        RESULTS_DIR
        / "integrated_plan.json"
    )

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

    print()
    print(
        "Integrated result saved to:"
    )

    print(
        output_path
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print(
        "Q-RESCUE INTEGRATED QUANTUM DECISION ENGINE"
    )
    print("=" * 60)

    # --------------------------------------------------------
    # LOAD
    # --------------------------------------------------------

    print()
    print(
        "Loading Digital Disaster Twin..."
    )

    scenario = load_scenario()

    # --------------------------------------------------------
    # INITIAL PLAN
    # --------------------------------------------------------

    initial = run_quantum_engine(
        scenario,
        "INITIAL QUANTUM RESPONSE PLAN",
    )

    # --------------------------------------------------------
    # LIVE CHANGE
    # --------------------------------------------------------

    changed_scenario = (
        create_changed_scenario(
            scenario
        )
    )

    changes = detect_changes(
        scenario,
        changed_scenario,
    )

    print_changes(
        changes
    )

    # --------------------------------------------------------
    # RE-OPTIMIZATION
    # --------------------------------------------------------

    if changes:

        print()
        print("=" * 60)
        print(
            "SIGNIFICANT CHANGE DETECTED"
        )
        print(
            "STARTING DYNAMIC RE-OPTIMIZATION"
        )
        print("=" * 60)

        final = run_quantum_engine(
            changed_scenario,
            "NEW QUANTUM RESPONSE PLAN",
        )

        save_result(
            initial,
            final,
            changes,
        )

    else:

        final = initial

        print()
        print(
            "No re-optimization required."
        )

    # --------------------------------------------------------
    # COMPLETE
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print(
        "INTEGRATED QUANTUM ENGINE COMPLETE"
    )
    print("=" * 60)
    print()


if __name__ == "__main__":

    main()