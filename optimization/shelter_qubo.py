from dataclasses import dataclass
from typing import Dict, List


RISK_WEIGHT = {
    "high": 100,
    "moderate": 50,
    "low": 15,
}


@dataclass
class ShelterAssignment:
    index: int
    zone_id: str
    zone_name: str
    shelter_id: str
    shelter_name: str
    risk_level: str
    predicted_evacuees: int
    available_capacity: int
    travel_time_min: int
    route_status: str


def build_assignments(scenario: dict) -> List[ShelterAssignment]:
    zones = scenario["zones"]
    shelters = scenario["shelters"]
    travel_times = scenario["travel_times"]

    assignments = []

    index = 0

    for zone in zones:
        for shelter in shelters:

            travel = next(
                (
                    item
                    for item in travel_times
                    if item["zone_id"] == zone["id"]
                    and item["shelter_id"] == shelter["id"]
                ),
                None,
            )

            if travel is None:
                continue

            assignments.append(
                ShelterAssignment(
                    index=index,
                    zone_id=zone["id"],
                    zone_name=zone["name"],
                    shelter_id=shelter["id"],
                    shelter_name=shelter["name"],
                    risk_level=zone["risk_level"],
                    predicted_evacuees=zone["predicted_evacuees"],
                    available_capacity=shelter["available_capacity"],
                    travel_time_min=travel["travel_time_min"],
                    route_status=travel["route_status"],
                )
            )

            index += 1

    return assignments


def calculate_assignment_cost(
    assignment: ShelterAssignment,
) -> float:

    cost = 0.0

    # Blocked route is effectively infeasible.
    if assignment.route_status == "blocked":
        cost += 5000

    # Shelter cannot accommodate the affected population.
    if assignment.available_capacity < assignment.predicted_evacuees:
        shortage = (
            assignment.predicted_evacuees
            - assignment.available_capacity
        )

        cost += 3000 + shortage * 100

    # Prefer shorter evacuation travel time.
    cost += assignment.travel_time_min * 10

    # High-risk zones receive higher priority.
    risk = RISK_WEIGHT.get(
        assignment.risk_level.lower(),
        15,
    )

    cost -= risk

    # Prefer shelters with greater available capacity.
    cost -= assignment.available_capacity * 0.5

    return cost


def build_shelter_qubo(
    assignments: List[ShelterAssignment],
    scenario: dict,
) -> Dict:

    linear = {}
    quadratic = {}

    # ---------------------------------------------------------
    # Base assignment costs
    # ---------------------------------------------------------

    for assignment in assignments:

        linear[assignment.index] = calculate_assignment_cost(
            assignment
        )

    # ---------------------------------------------------------
    # Exactly one shelter per zone
    # ---------------------------------------------------------

    penalty = 1500

    zones = scenario["zones"]

    for zone in zones:

        zone_assignments = [
            assignment.index
            for assignment in assignments
            if assignment.zone_id == zone["id"]
        ]

        # P(sum(x) - 1)^2
        #
        # Linear contribution:
        # -P for each variable
        #
        # Quadratic contribution:
        # 2P for every pair.

        for index in zone_assignments:
            linear[index] += -penalty

        for i in range(len(zone_assignments)):
            for j in range(i + 1, len(zone_assignments)):

                q1 = zone_assignments[i]
                q2 = zone_assignments[j]

                key = (q1, q2)

                quadratic[key] = (
                    quadratic.get(key, 0.0)
                    + 2 * penalty
                )

    # ---------------------------------------------------------
    # Shelter capacity protection
    # ---------------------------------------------------------

    for assignment in assignments:

        if (
            assignment.available_capacity
            < assignment.predicted_evacuees
        ):

            linear[assignment.index] += 5000

    # ---------------------------------------------------------
    # Encourage high-risk evacuation coverage
    # ---------------------------------------------------------

    for assignment in assignments:

        if assignment.risk_level.lower() == "high":

            linear[assignment.index] -= 150

    return {
        "linear": linear,
        "quadratic": quadratic,
    }


def is_valid_shelter_solution(
    bitstring: str,
    assignments: List[ShelterAssignment],
    scenario: dict,
) -> bool:

    if len(bitstring) != len(assignments):
        return False

    # ---------------------------------------------------------
    # Exactly one shelter per zone
    # ---------------------------------------------------------

    for zone in scenario["zones"]:

        selected = 0

        for assignment in assignments:

            if assignment.zone_id != zone["id"]:
                continue

            if bitstring[assignment.index] == "1":
                selected += 1

        if selected != 1:
            return False

    # ---------------------------------------------------------
    # Selected assignment must have a usable route
    # ---------------------------------------------------------

    for assignment in assignments:

        if bitstring[assignment.index] != "1":
            continue

        if assignment.route_status == "blocked":
            return False

        # Do not select a shelter that cannot handle
        # the predicted evacuees.
        if (
            assignment.available_capacity
            < assignment.predicted_evacuees
        ):
            return False

    return True


def calculate_qubo_cost(
    bitstring: str,
    qubo: Dict,
) -> float:

    cost = 0.0

    linear = qubo["linear"]
    quadratic = qubo["quadratic"]

    for index, coefficient in linear.items():

        if bitstring[index] == "1":
            cost += coefficient

    for (i, j), coefficient in quadratic.items():

        if (
            bitstring[i] == "1"
            and bitstring[j] == "1"
        ):
            cost += coefficient

    return cost


def evaluate_solution(
    bitstring: str,
    assignments: List[ShelterAssignment],
    qubo: Dict,
    scenario: dict,
) -> Dict:

    selected = []

    for assignment in assignments:

        if bitstring[assignment.index] == "1":

            selected.append(
                {
                    "zone_id": assignment.zone_id,
                    "zone_name": assignment.zone_name,
                    "shelter_id": assignment.shelter_id,
                    "shelter_name": assignment.shelter_name,
                    "risk_level": assignment.risk_level,
                    "predicted_evacuees": assignment.predicted_evacuees,
                    "available_capacity": assignment.available_capacity,
                    "travel_time_min": assignment.travel_time_min,
                    "route_status": assignment.route_status,
                }
            )

    return {
        "bitstring": bitstring,
        "qubo_cost": calculate_qubo_cost(
            bitstring,
            qubo,
        ),
        "selected_assignments": selected,
        "valid": is_valid_shelter_solution(
            bitstring,
            assignments,
            scenario,
        ),
    }


def decode_shelter_solution(
    bitstring: str,
    assignments: List[ShelterAssignment],
) -> List[Dict]:

    result = []

    for assignment in assignments:

        if bitstring[assignment.index] == "1":

            result.append(
                {
                    "zone": assignment.zone_name,
                    "shelter": assignment.shelter_name,
                    "risk": assignment.risk_level,
                    "evacuees": assignment.predicted_evacuees,
                    "capacity": assignment.available_capacity,
                    "eta_min": assignment.travel_time_min,
                }
            )

    return result