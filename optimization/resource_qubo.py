from dataclasses import dataclass
from typing import Dict, List, Tuple


@dataclass
class AmbulanceAssignment:
    ambulance_id: str
    ambulance_name: str
    zone_id: str
    zone_name: str
    risk_level: str
    predicted_patients: int
    resource_demand: int
    travel_time_min: int
    route_status: str
    resource_capacity: int


RISK_WEIGHT = {
    "high": 100,
    "moderate": 50,
    "low": 15,
}


def build_assignments(
    scenario: dict,
) -> List[AmbulanceAssignment]:

    zones = {
        zone["id"]: zone
        for zone in scenario["zones"]
    }

    ambulances = {
        ambulance["id"]: ambulance
        for ambulance in scenario["ambulances"]
    }

    assignments = []

    for travel in scenario["travel_times"]:

        ambulance = ambulances[
            travel["ambulance_id"]
        ]

        zone = zones[
            travel["zone_id"]
        ]

        assignments.append(
            AmbulanceAssignment(
                ambulance_id=ambulance["id"],
                ambulance_name=ambulance["name"],
                zone_id=zone["id"],
                zone_name=zone["name"],
                risk_level=zone["risk_level"].lower(),
                predicted_patients=zone["predicted_patients"],
                resource_demand=zone["resource_demand"],
                travel_time_min=travel["travel_time_min"],
                route_status=travel["route_status"].lower(),
                resource_capacity=ambulance["resource_capacity"],
            )
        )

    return assignments


def calculate_assignment_cost(
    assignment: AmbulanceAssignment,
) -> float:

    cost = 0.0

    # Blocked routes are strongly penalized.
    if assignment.route_status != "open":
        cost += 10000

    # Faster response is preferred.
    cost += assignment.travel_time_min * 8

    # Disaster risk priority.
    risk = RISK_WEIGHT.get(
        assignment.risk_level,
        10,
    )

    cost -= risk

    # Predicted patient demand.
    cost -= (
        assignment.predicted_patients * 2
    )

    # Resource demand.
    cost -= (
        assignment.resource_demand * 1.5
    )

    # Ambulance resource capacity.
    cost -= (
        assignment.resource_capacity * 3
    )

    # Capacity compatibility.
    if (
        assignment.resource_capacity
        >= assignment.resource_demand
    ):
        cost -= 20

    else:

        shortage = (
            assignment.resource_demand
            - assignment.resource_capacity
        )

        cost += shortage * 8

    return cost


def calculate_zone_targets(
    scenario: dict,
) -> Dict[str, int]:
    """
    Determine how many ambulances should cover
    each zone.

    Every HIGH-risk zone receives at least
    one ambulance.

    Remaining ambulances are distributed
    according to risk and predicted demand.
    """

    zones = scenario["zones"]

    ambulance_count = len(
        scenario["ambulances"]
    )

    scores = {}

    for zone in zones:

        risk = RISK_WEIGHT.get(
            zone["risk_level"].lower(),
            10,
        )

        demand = zone.get(
            "resource_demand",
            zone.get(
                "predicted_patients",
                0,
            ),
        )

        scores[zone["id"]] = (
            risk
            + demand * 2
        )

    targets = {
        zone["id"]: 0
        for zone in zones
    }

    # ---------------------------------------------------------
    # Guarantee one ambulance for every HIGH-risk zone.
    # ---------------------------------------------------------

    high_risk_zones = [
        zone
        for zone in zones
        if zone["risk_level"].lower() == "high"
    ]

    for zone in high_risk_zones:

        if (
            sum(targets.values())
            < ambulance_count
        ):

            targets[zone["id"]] = 1

    # ---------------------------------------------------------
    # Distribute remaining ambulances.
    # ---------------------------------------------------------

    remaining = (
        ambulance_count
        - sum(targets.values())
    )

    ranked_zones = sorted(
        zones,
        key=lambda zone: scores[
            zone["id"]
        ],
        reverse=True,
    )

    index = 0

    while remaining > 0:

        zone = ranked_zones[
            index % len(ranked_zones)
        ]

        targets[zone["id"]] += 1

        remaining -= 1
        index += 1

    return targets


def build_resource_qubo(
    assignments: List[AmbulanceAssignment],
    scenario: dict,
) -> Tuple[dict, Dict[str, int]]:
    """
    Build the ambulance-positioning QUBO.

    QUBO format:

        {
            "linear": [...],
            "quadratic": {
                (i, j): coefficient
            }
        }

    x_i = 1 means assignment i is selected.
    """

    n = len(assignments)

    linear = [0.0] * n

    quadratic = {}

    def add_linear(
        index: int,
        value: float,
    ):
        linear[index] += value

    def add_quadratic(
        i: int,
        j: int,
        value: float,
    ):

        if i == j:

            linear[i] += value

            return

        key = (
            min(i, j),
            max(i, j),
        )

        quadratic[key] = (
            quadratic.get(key, 0.0)
            + value
        )

    # ---------------------------------------------------------
    # 1. Assignment cost
    # ---------------------------------------------------------

    for i, assignment in enumerate(
        assignments
    ):

        add_linear(
            i,
            calculate_assignment_cost(
                assignment
            ),
        )

    # ---------------------------------------------------------
    # 2. Exactly one zone per ambulance
    #
    # P(sum(x) - 1)^2
    # ---------------------------------------------------------

    assignment_groups = {}

    for i, assignment in enumerate(
        assignments
    ):

        assignment_groups.setdefault(
            assignment.ambulance_id,
            [],
        ).append(i)

    ASSIGNMENT_PENALTY = 1200.0

    for indices in (
        assignment_groups.values()
    ):

        # Linear portion of:
        #
        # P(sum(x) - 1)^2
        #
        for i in indices:

            add_linear(
                i,
                -ASSIGNMENT_PENALTY,
            )

        # Quadratic portion.
        for position_i in range(
            len(indices)
        ):

            for position_j in range(
                position_i + 1,
                len(indices),
            ):

                i = indices[position_i]
                j = indices[position_j]

                add_quadratic(
                    i,
                    j,
                    2
                    * ASSIGNMENT_PENALTY,
                )

    # ---------------------------------------------------------
    # 3. Dynamic zone coverage targets
    # ---------------------------------------------------------

    targets = calculate_zone_targets(
        scenario
    )

    zone_groups = {}

    for i, assignment in enumerate(
        assignments
    ):

        zone_groups.setdefault(
            assignment.zone_id,
            [],
        ).append(i)

    COVERAGE_PENALTY = 500.0

    for zone_id, indices in (
        zone_groups.items()
    ):

        target = targets.get(
            zone_id,
            0,
        )

        # -----------------------------------------------------
        # No ambulance target.
        # -----------------------------------------------------

        if target == 0:

            for i in indices:

                add_linear(
                    i,
                    COVERAGE_PENALTY,
                )

            continue

        # -----------------------------------------------------
        # Target penalty:
        #
        # P(sum(x) - target)^2
        # -----------------------------------------------------

        linear_term = (
            COVERAGE_PENALTY
            - (
                2
                * COVERAGE_PENALTY
                * target
            )
        )

        for i in indices:

            add_linear(
                i,
                linear_term,
            )

        for position_i in range(
            len(indices)
        ):

            for position_j in range(
                position_i + 1,
                len(indices),
            ):

                i = indices[position_i]
                j = indices[position_j]

                add_quadratic(
                    i,
                    j,
                    2
                    * COVERAGE_PENALTY,
                )

    # ---------------------------------------------------------
    # 4. Additional HIGH-risk priority.
    # ---------------------------------------------------------

    HIGH_RISK_BONUS = 180.0

    for i, assignment in enumerate(
        assignments
    ):

        if assignment.risk_level == "high":

            add_linear(
                i,
                -HIGH_RISK_BONUS,
            )

    qubo = {
        "linear": linear,
        "quadratic": quadratic,
    }

    return qubo, targets


def is_valid_resource_solution(
    bitstring: str,
    assignments: List[AmbulanceAssignment],
) -> bool:

    if len(bitstring) != len(
        assignments
    ):
        return False

    selected_indices = [
        i
        for i, bit in enumerate(
            bitstring
        )
        if bit == "1"
    ]

    assignment_groups = {}

    for i, assignment in enumerate(
        assignments
    ):

        assignment_groups.setdefault(
            assignment.ambulance_id,
            [],
        ).append(i)

    # Exactly one zone per ambulance.
    for indices in (
        assignment_groups.values()
    ):

        selected_count = sum(
            1
            for i in indices
            if i in selected_indices
        )

        if selected_count != 1:
            return False

    # Blocked routes cannot be selected.
    for i in selected_indices:

        if (
            assignments[i].route_status
            != "open"
        ):

            return False

    return True


def decode_resource_solution(
    bitstring: str,
    assignments: List[AmbulanceAssignment],
) -> List[AmbulanceAssignment]:

    selected = []

    for i, bit in enumerate(
        bitstring
    ):

        if bit == "1":

            selected.append(
                assignments[i]
            )

    return selected


def evaluate_solution(
    bitstring: str,
    assignments: List[AmbulanceAssignment],
) -> float:

    cost = 0.0

    for i, bit in enumerate(
        bitstring
    ):

        if bit == "1":

            cost += calculate_assignment_cost(
                assignments[i]
            )

    return cost