import numpy as np


PENALTY = 1500.0

RISK_WEIGHT = {
    "high": 100.0,
    "moderate": 50.0,
    "low": 15.0,
}


def add_qubo_term(Q, i, j, value):
    Q[i, j] += value


def add_exactly_one(Q, indices, penalty):
    # P(sum(x)-1)^2
    for i in indices:
        add_qubo_term(Q, i, i, -penalty)

    for a in range(len(indices)):
        for b in range(a + 1, len(indices)):
            i = indices[a]
            j = indices[b]

            add_qubo_term(Q, i, j, 2.0 * penalty)
            add_qubo_term(Q, j, i, 2.0 * penalty)


def build_final_qubo(
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
    scenario,
):
    hospital_count = len(hospital_options)
    ambulance_count = len(ambulance_assignments)
    shelter_count = len(shelter_assignments)

    total_variables = (
        hospital_count
        + ambulance_count
        + shelter_count
    )

    Q = np.zeros(
        (total_variables, total_variables),
        dtype=float,
    )

    # ---------------------------------------------------------
    # Variable offsets
    # ---------------------------------------------------------

    hospital_offset = 0

    ambulance_offset = hospital_count

    shelter_offset = (
        hospital_count
        + ambulance_count
    )

    # ---------------------------------------------------------
    # HOSPITAL COST
    # ---------------------------------------------------------

    for option in hospital_options:

        index = (
            hospital_offset
            + option["index"]
        )

        cost = 0.0

        if option["route_status"] == "blocked":
            cost += 5000

        if (
            option["available_beds"]
            < scenario["patients"]
        ):
            cost += 5000

        if (
            option["emergency_capacity"]
            < scenario["high_severity_patients"]
        ):
            cost += 3000

        cost += option["travel_time_min"] * 10
        cost += option["distance_km"] * 5

        cost -= option["available_beds"] * 2
        cost -= option["emergency_capacity"] * 5

        add_qubo_term(Q, index, index, cost)

    hospital_indices = list(
        range(
            hospital_offset,
            hospital_offset + hospital_count,
        )
    )

    add_exactly_one(
        Q,
        hospital_indices,
        PENALTY,
    )

    # ---------------------------------------------------------
    # AMBULANCE COST
    # ---------------------------------------------------------

    ambulance_groups = {}

    for assignment in ambulance_assignments:

        index = (
            ambulance_offset
            + assignment["index"]
        )

        risk = RISK_WEIGHT.get(
            assignment["risk_level"].lower(),
            15,
        )

        cost = 0.0

        cost += (
            assignment["travel_time_min"]
            * 3
        )

        cost -= (
            assignment["predicted_patients"]
            * 2
        )

        cost -= (
            assignment["resource_demand"]
            * 1.5
        )

        cost -= (
            assignment["resource_capacity"]
            * 2
        )

        cost -= risk

        if assignment["route_status"] == "blocked":
            cost += 5000

        add_qubo_term(
            Q,
            index,
            index,
            cost,
        )

        ambulance_id = assignment[
            "ambulance_id"
        ]

        ambulance_groups.setdefault(
            ambulance_id,
            [],
        ).append(index)

    for group in ambulance_groups.values():
        add_exactly_one(
            Q,
            group,
            PENALTY,
        )

    # ---------------------------------------------------------
    # SHELTER COST
    # ---------------------------------------------------------

    shelter_groups = {}

    for assignment in shelter_assignments:

        index = (
            shelter_offset
            + assignment["index"]
        )

        risk = RISK_WEIGHT.get(
            assignment["risk_level"].lower(),
            15,
        )

        cost = 0.0

        cost += (
            assignment["travel_time_min"]
            * 10
        )

        cost -= risk

        cost -= (
            assignment["available_capacity"]
            * 0.5
        )

        if assignment["route_status"] == "blocked":
            cost += 5000

        if (
            assignment["available_capacity"]
            < assignment["predicted_evacuees"]
        ):
            shortage = (
                assignment["predicted_evacuees"]
                - assignment["available_capacity"]
            )

            cost += 5000 + shortage * 100

        add_qubo_term(
            Q,
            index,
            index,
            cost,
        )

        shelter_groups.setdefault(
            assignment["zone_id"],
            [],
        ).append(index)

    for group in shelter_groups.values():
        add_exactly_one(
            Q,
            group,
            PENALTY,
        )

    return Q