from dataclasses import dataclass
from typing import List


@dataclass
class HospitalOption:
    hospital_id: str
    hospital_name: str
    available_beds: int
    emergency_capacity: int
    distance_km: float
    travel_time_min: int
    route_status: str


def build_hospital_options(scenario: dict) -> List[HospitalOption]:
    hospitals = scenario["hospitals"]
    routes = scenario["routes"]

    options = []

    for hospital in hospitals:
        hospital_routes = [
            route
            for route in routes
            if route["hospital_id"] == hospital["id"]
        ]

        if not hospital_routes:
            continue

        route = hospital_routes[0]

        options.append(
            HospitalOption(
                hospital_id=hospital["id"],
                hospital_name=hospital["name"],
                available_beds=hospital["available_beds"],
                emergency_capacity=hospital["emergency_capacity"],
                distance_km=hospital["distance_km"],
                travel_time_min=route["travel_time_min"],
                route_status=route["status"],
            )
        )

    return options


def calculate_cost(
    option: HospitalOption,
    patients: int,
    high_severity_patients: int,
) -> float:

    # Blocked routes are heavily penalized.
    if option.route_status.lower() != "open":
        return 10000.0

    # Hospital must have enough beds.
    if option.available_beds < patients:
        return 5000.0

    # Hospital must be able to handle high-severity patients.
    if option.emergency_capacity < high_severity_patients:
        return 3000.0

    # Lower travel time is better.
    travel_cost = option.travel_time_min * 10

    # Greater bed availability is better.
    capacity_bonus = option.available_beds * 2

    # Greater emergency capacity is better.
    emergency_bonus = option.emergency_capacity * 5

    # Shorter distance is better.
    distance_cost = option.distance_km * 5

    cost = (
        travel_cost
        + distance_cost
        - capacity_bonus
        - emergency_bonus
    )

    return cost


def build_qubo(
    options: List[HospitalOption],
    patients: int,
    high_severity_patients: int,
):
    """
    Build the QUBO for hospital selection.

    x_i = 1 -> hospital i is selected
    x_i = 0 -> hospital i is not selected

    Constraint:

        x0 + x1 + x2 = 1

    Exactly one hospital must be selected.
    """

    n = len(options)

    if n == 0:
        raise ValueError("No hospital options available.")

    penalty = 1000.0

    linear = {}
    quadratic = {}

    costs = []

    for i, option in enumerate(options):

        cost = calculate_cost(
            option,
            patients,
            high_severity_patients,
        )

        costs.append(cost)

        # Penalty formulation:
        #
        # P * (sum(x_i) - 1)^2
        #
        # The diagonal contribution is:
        #
        # cost_i - P

        linear[i] = cost - penalty

    # Cross terms enforce the one-hospital constraint.
    for i in range(n):
        for j in range(i + 1, n):
            quadratic[(i, j)] = 2 * penalty

    return {
        "linear": linear,
        "quadratic": quadratic,
        "costs": costs,
        "penalty": penalty,
    }


def evaluate_solution(
    qubo: dict,
    bitstring: str,
) -> float:

    bits = [int(bit) for bit in bitstring]

    value = 0.0

    for i, bit in enumerate(bits):
        value += qubo["linear"][i] * bit

    for (i, j), coefficient in qubo["quadratic"].items():
        value += coefficient * bits[i] * bits[j]

    return value


def is_valid_solution(bitstring: str) -> bool:
    """
    A valid solution must select exactly one hospital.
    """

    return bitstring.count("1") == 1