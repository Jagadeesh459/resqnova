import copy
import json
import os
from typing import Dict, List


from optimization.final_qubo import build_final_qubo
from optimization.final_qaoa_solver import run_final_qaoa


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

HOSPITAL_FILE = os.path.join(
    BASE_DIR,
    "data",
    "emergency_scenario.json",
)

RESOURCE_FILE = os.path.join(
    BASE_DIR,
    "data",
    "resource_scenario.json",
)

SHELTER_FILE = os.path.join(
    BASE_DIR,
    "data",
    "shelter_scenario.json",
)

RESULT_FILE = os.path.join(
    BASE_DIR,
    "results",
    "final_quantum_plan.json",
)


# ============================================================
# LOAD DATA
# ============================================================

def load_json(path: str) -> dict:

    with open(
        path,
        "r",
        encoding="utf-8",
    ) as file:

        return json.load(file)


# ============================================================
# HOSPITAL OPTIONS
# ============================================================

def build_hospital_options(
    scenario: dict,
) -> List[Dict]:

    hospitals = scenario["hospitals"]
    routes = scenario["routes"]

    options = []

    for index, hospital in enumerate(
        hospitals
    ):

        route = next(
            (
                r
                for r in routes
                if r["hospital_id"]
                == hospital["id"]
            ),
            None,
        )

        if route is None:
            continue

        options.append(
            {
                "index": index,
                "id": hospital["id"],
                "name": hospital["name"],
                "available_beds":
                    hospital["available_beds"],
                "emergency_capacity":
                    hospital[
                        "emergency_capacity"
                    ],
                "distance_km":
                    hospital["distance_km"],
                "travel_time_min":
                    route["travel_time_min"],
                "route_status":
                    route["status"],
            }
        )

    return options


# ============================================================
# AMBULANCE ASSIGNMENTS
# ============================================================

def build_ambulance_assignments(
    scenario: dict,
) -> List[Dict]:

    zones = scenario["zones"]
    ambulances = scenario["ambulances"]
    travel_times = scenario["travel_times"]

    assignments = []

    index = 0

    for ambulance in ambulances:

        for zone in zones:

            travel = next(
                (
                    item
                    for item in travel_times
                    if (
                        item["ambulance_id"]
                        == ambulance["id"]
                        and
                        item["zone_id"]
                        == zone["id"]
                    )
                ),
                None,
            )

            if travel is None:
                continue

            assignments.append(
                {
                    "index": index,
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
                    "predicted_patients":
                        zone[
                            "predicted_patients"
                        ],
                    "resource_demand":
                        zone[
                            "resource_demand"
                        ],
                    "resource_capacity":
                        ambulance[
                            "resource_capacity"
                        ],
                    "travel_time_min":
                        travel[
                            "travel_time_min"
                        ],
                    "route_status":
                        travel[
                            "route_status"
                        ],
                }
            )

            index += 1

    return assignments


# ============================================================
# SHELTER ASSIGNMENTS
# ============================================================

def build_shelter_assignments(
    scenario: dict,
) -> List[Dict]:

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
                    if (
                        item["zone_id"]
                        == zone["id"]
                        and
                        item["shelter_id"]
                        == shelter["id"]
                    )
                ),
                None,
            )

            if travel is None:
                continue

            assignments.append(
                {
                    "index": index,
                    "zone_id":
                        zone["id"],
                    "zone_name":
                        zone["name"],
                    "shelter_id":
                        shelter["id"],
                    "shelter_name":
                        shelter["name"],
                    "risk_level":
                        zone["risk_level"],
                    "predicted_evacuees":
                        zone[
                            "predicted_evacuees"
                        ],
                    "available_capacity":
                        shelter[
                            "available_capacity"
                        ],
                    "travel_time_min":
                        travel[
                            "travel_time_min"
                        ],
                    "route_status":
                        travel[
                            "route_status"
                        ],
                }
            )

            index += 1

    return assignments


# ============================================================
# QUANTUM GROUPS
# ============================================================

def build_groups(
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
):

    groups = []

    # Hospital group

    hospital_group = [
        option["index"]
        for option in hospital_options
    ]

    groups.append(
        hospital_group
    )

    # Ambulance groups

    ambulance_ids = []

    for assignment in (
        ambulance_assignments
    ):

        if (
            assignment["ambulance_id"]
            not in ambulance_ids
        ):

            ambulance_ids.append(
                assignment[
                    "ambulance_id"
                ]
            )

    ambulance_offset = len(
        hospital_options
    )

    for ambulance_id in ambulance_ids:

        group = []

        for assignment in (
            ambulance_assignments
        ):

            if (
                assignment[
                    "ambulance_id"
                ]
                == ambulance_id
            ):

                group.append(
                    ambulance_offset
                    + assignment[
                        "index"
                    ]
                )

        groups.append(group)

    # Shelter groups

    shelter_offset = (
        len(hospital_options)
        + len(ambulance_assignments)
    )

    zone_ids = []

    for assignment in (
        shelter_assignments
    ):

        if (
            assignment["zone_id"]
            not in zone_ids
        ):

            zone_ids.append(
                assignment["zone_id"]
            )

    for zone_id in zone_ids:

        group = []

        for assignment in (
            shelter_assignments
        ):

            if (
                assignment["zone_id"]
                == zone_id
            ):

                group.append(
                    shelter_offset
                    + assignment[
                        "index"
                    ]
                )

        groups.append(group)

    return groups


# ============================================================
# SOLUTION VALIDATION
# ============================================================

def create_validator(
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
    hospital_scenario,
    resource_scenario,
    shelter_scenario,
):

    hospital_count = len(
        hospital_options
    )

    ambulance_count = len(
        ambulance_assignments
    )

    shelter_offset = (
        hospital_count
        + ambulance_count
    )

    def validator(
        bitstring: str
    ) -> bool:

        # ----------------------------------------------------
        # BASIC LENGTH
        # ----------------------------------------------------

        expected_length = (
            hospital_count
            + ambulance_count
            + len(shelter_assignments)
        )

        if len(bitstring) != expected_length:
            return False

        # ----------------------------------------------------
        # HOSPITAL
        # ----------------------------------------------------

        selected_hospitals = []

        for option in hospital_options:

            index = option["index"]

            if bitstring[index] == "1":

                selected_hospitals.append(
                    option
                )

        if len(
            selected_hospitals
        ) != 1:

            return False

        hospital = (
            selected_hospitals[0]
        )

        emergency = (
            hospital_scenario[
                "emergency"
            ]
        )

        if (
            hospital["route_status"]
            == "blocked"
        ):

            return False

        if (
            hospital["available_beds"]
            < emergency["patients"]
        ):

            return False

        if (
            hospital[
                "emergency_capacity"
            ]
            < emergency[
                "high_severity_patients"
            ]
        ):

            return False

        # ----------------------------------------------------
        # AMBULANCES
        # ----------------------------------------------------

        ambulance_offset = (
            hospital_count
        )

        ambulance_ids = []

        for assignment in (
            ambulance_assignments
        ):

            if (
                assignment[
                    "ambulance_id"
                ]
                not in ambulance_ids
            ):

                ambulance_ids.append(
                    assignment[
                        "ambulance_id"
                    ]
                )

        for ambulance_position, ambulance_id in enumerate(
            ambulance_ids
        ):

            selected = []

            for assignment in (
                ambulance_assignments
            ):

                if (
                    assignment[
                        "ambulance_id"
                    ]
                    != ambulance_id
                ):
                    continue

                index = (
                    ambulance_offset
                    + assignment[
                        "index"
                    ]
                )

                if (
                    bitstring[index]
                    == "1"
                ):

                    selected.append(
                        assignment
                    )

            if len(selected) != 1:
                return False

            assignment = selected[0]

            if (
                assignment[
                    "route_status"
                ]
                == "blocked"
            ):

                return False

        # ----------------------------------------------------
        # SHELTERS
        # ----------------------------------------------------

        zone_ids = []

        for assignment in (
            shelter_assignments
        ):

            if (
                assignment["zone_id"]
                not in zone_ids
            ):

                zone_ids.append(
                    assignment[
                        "zone_id"
                    ]
                )

        selected_shelters = []

        for zone_id in zone_ids:

            selected = []

            for assignment in (
                shelter_assignments
            ):

                if (
                    assignment["zone_id"]
                    != zone_id
                ):

                    continue

                index = (
                    shelter_offset
                    + assignment[
                        "index"
                    ]
                )

                if (
                    bitstring[index]
                    == "1"
                ):

                    selected.append(
                        assignment
                    )

            if len(selected) != 1:
                return False

            assignment = selected[0]

            if (
                assignment[
                    "route_status"
                ]
                == "blocked"
            ):

                return False

            if (
                assignment[
                    "available_capacity"
                ]
                <
                assignment[
                    "predicted_evacuees"
                ]
            ):

                return False

            selected_shelters.append(
                assignment
            )

        # ----------------------------------------------------
        # SHARED SHELTER CAPACITY
        # ----------------------------------------------------
        #
        # A shelter may be selected by more
        # than one evacuation zone.
        #
        # Total evacuees assigned to a shelter
        # must not exceed its available capacity.
        # ----------------------------------------------------

        shelter_usage = {}

        for assignment in selected_shelters:

            shelter_id = (
                assignment[
                    "shelter_id"
                ]
            )

            shelter_usage.setdefault(
                shelter_id,
                0,
            )

            shelter_usage[
                shelter_id
            ] += assignment[
                "predicted_evacuees"
            ]

        for shelter_id, evacuees in (
            shelter_usage.items()
        ):

            shelter = next(
                (
                    s
                    for s
                    in shelter_scenario[
                        "shelters"
                    ]
                    if s["id"]
                    == shelter_id
                ),
                None,
            )

            if shelter is None:
                return False

            if (
                evacuees
                >
                shelter[
                    "available_capacity"
                ]
            ):

                return False

        return True

    return validator


# ============================================================
# DECODE FINAL PLAN
# ============================================================

def decode_plan(
    bitstring,
    hospital_options,
    ambulance_assignments,
    shelter_assignments,
):

    hospital_count = len(
        hospital_options
    )

    ambulance_count = len(
        ambulance_assignments
    )

    shelter_offset = (
        hospital_count
        + ambulance_count
    )

    # --------------------------------------------------------
    # HOSPITAL
    # --------------------------------------------------------

    selected_hospital = None

    for option in hospital_options:

        if (
            bitstring[
                option["index"]
            ]
            == "1"
        ):

            selected_hospital = option
            break

    # --------------------------------------------------------
    # AMBULANCES
    # --------------------------------------------------------

    ambulance_plan = []

    for assignment in (
        ambulance_assignments
    ):

        index = (
            hospital_count
            + assignment["index"]
        )

        if (
            bitstring[index]
            == "1"
        ):

            ambulance_plan.append(
                {
                    "ambulance_id":
                        assignment[
                            "ambulance_id"
                        ],
                    "ambulance_name":
                        assignment[
                            "ambulance_name"
                        ],
                    "zone":
                        assignment[
                            "zone_name"
                        ],
                    "risk":
                        assignment[
                            "risk_level"
                        ],
                    "eta_min":
                        assignment[
                            "travel_time_min"
                        ],
                    "resource_capacity":
                        assignment[
                            "resource_capacity"
                        ],
                }
            )

    # --------------------------------------------------------
    # SHELTERS
    # --------------------------------------------------------

    shelter_plan = []

    for assignment in (
        shelter_assignments
    ):

        index = (
            shelter_offset
            + assignment["index"]
        )

        if (
            bitstring[index]
            == "1"
        ):

            shelter_plan.append(
                {
                    "zone":
                        assignment[
                            "zone_name"
                        ],
                    "shelter":
                        assignment[
                            "shelter_name"
                        ],
                    "risk":
                        assignment[
                            "risk_level"
                        ],
                    "evacuees":
                        assignment[
                            "predicted_evacuees"
                        ],
                    "capacity":
                        assignment[
                            "available_capacity"
                        ],
                    "eta_min":
                        assignment[
                            "travel_time_min"
                        ],
                }
            )

    return {
        "hospital": (
            {
                "id":
                    selected_hospital[
                        "id"
                    ],
                "name":
                    selected_hospital[
                        "name"
                    ],
                "available_beds":
                    selected_hospital[
                        "available_beds"
                    ],
                "emergency_capacity":
                    selected_hospital[
                        "emergency_capacity"
                    ],
            }
            if selected_hospital
            else None
        ),
        "ambulances":
            ambulance_plan,
        "shelters":
            shelter_plan,
    }


# ============================================================
# PRINT PLAN
# ============================================================

def print_plan(
    title,
    result,
    plan,
):

    print()
    print("=" * 60)
    print(title)
    print("=" * 60)

    print()
    print(
        "QAOA bitstring : "
        f"{result['bitstring']}"
    )

    print(
        "Probability    : "
        f"{result['probability']:.10f}"
    )

    print(
        "QUBO cost      : "
        f"{result['qubo_cost']:.2f}"
    )

    print(
        "Expectation    : "
        f"{result['expectation']:.2f}"
    )

    # --------------------------------------------------------
    # HOSPITAL
    # --------------------------------------------------------

    print()
    print("SELECTED HOSPITAL")
    print("-" * 60)

    if plan["hospital"]:

        hospital = plan["hospital"]

        print(
            hospital["name"]
        )

        print(
            "Available beds: "
            f"{hospital['available_beds']}"
        )

        print(
            "Emergency capacity: "
            f"{hospital['emergency_capacity']}"
        )

    # --------------------------------------------------------
    # AMBULANCES
    # --------------------------------------------------------

    print()
    print(
        "AMBULANCE PRE-POSITIONING"
    )
    print("-" * 60)

    for ambulance in (
        plan["ambulances"]
    ):

        print(
            f"{ambulance['ambulance_name']} "
            f"→ {ambulance['zone']} "
            f"[{ambulance['risk'].upper()}] "
            f"| ETA "
            f"{ambulance['eta_min']} min "
            f"| capacity "
            f"{ambulance['resource_capacity']}"
        )

    # --------------------------------------------------------
    # SHELTERS
    # --------------------------------------------------------

    print()
    print(
        "SHELTER ALLOCATION"
    )
    print("-" * 60)

    for shelter in (
        plan["shelters"]
    ):

        print(
            f"{shelter['zone']} "
            f"→ {shelter['shelter']} "
            f"[{shelter['risk'].upper()}] "
            f"| evacuees "
            f"{shelter['evacuees']} "
            f"| capacity "
            f"{shelter['capacity']} "
            f"| ETA "
            f"{shelter['eta_min']} min"
        )


# ============================================================
# SIMULATE ENVIRONMENT CHANGE
# ============================================================

def simulate_environment_change(
    hospital_scenario,
    resource_scenario,
    shelter_scenario,
):

    hospital_changed = copy.deepcopy(
        hospital_scenario
    )

    resource_changed = copy.deepcopy(
        resource_scenario
    )

    shelter_changed = copy.deepcopy(
        shelter_scenario
    )

    print()
    print("=" * 60)
    print(
        "DETECTED ENVIRONMENT CHANGES"
    )
    print("=" * 60)

    # --------------------------------------------------------
    # HOSPITAL ROUTE CHANGE
    # --------------------------------------------------------

    for route in (
        hospital_changed["routes"]
    ):

        if route["id"] == "route-001":

            print(
                "route-001: "
                f"{route['status'].upper()} "
                "→ BLOCKED"
            )

            route["status"] = "blocked"

    # --------------------------------------------------------
    # MYLAVARAM RISK
    # --------------------------------------------------------

    for zone in (
        resource_changed["zones"]
    ):

        if zone["id"] == "zone-002":

            print(
                "Mylavaram: "
                f"{zone['risk_level'].upper()} "
                "→ HIGH"
            )

            print(
                "Mylavaram predicted patients: "
                f"{zone['predicted_patients']} "
                "→ 35"
            )

            print(
                "Mylavaram resource demand: "
                f"{zone['resource_demand']} "
                "→ 35"
            )

            zone["risk_level"] = "high"
            zone["predicted_patients"] = 35
            zone["resource_demand"] = 35

    # --------------------------------------------------------
    # AMBULANCE ROUTE CHANGE
    # --------------------------------------------------------

    for route in (
        resource_changed["travel_times"]
    ):

        if (
            route["ambulance_id"]
            == "AMB-001"
            and
            route["zone_id"]
            == "zone-002"
        ):

            print(
                "AMB-001 → zone-002: "
                f"{route['route_status'].upper()} "
                "→ BLOCKED"
            )

            route["route_status"] = "blocked"

    # --------------------------------------------------------
    # SHELTER CHANGE
    # --------------------------------------------------------

    for zone in (
        shelter_changed["zones"]
    ):

        if zone["id"] == "zone-002":

            print(
                "Mylavaram evacuees: "
                f"{zone['predicted_evacuees']} "
                "→ 220"
            )

            zone[
                "risk_level"
            ] = "high"

            zone[
                "predicted_evacuees"
            ] = 220

    # Reduce local Mylavaram shelter
    # capacity.

    for shelter in (
        shelter_changed["shelters"]
    ):

        if (
            shelter["id"]
            == "shelter-003"
        ):

            print(
                "Mylavaram Emergency Shelter "
                "available capacity: "
                f"{shelter['available_capacity']} "
                "→ 150"
            )

            shelter[
                "available_capacity"
            ] = 150

    # Block the Mylavaram local
    # shelter route.

    for route in (
        shelter_changed["travel_times"]
    ):

        if (
            route["zone_id"]
            == "zone-002"
            and
            route["shelter_id"]
            == "shelter-003"
        ):

            print(
                "Mylavaram → "
                "Mylavaram Emergency Shelter: "
                f"{route['route_status'].upper()} "
                "→ BLOCKED"
            )

            route[
                "route_status"
            ] = "blocked"

    return (
        hospital_changed,
        resource_changed,
        shelter_changed,
    )


# ============================================================
# RUN ONE INTEGRATED QUANTUM PLAN
# ============================================================

def run_integrated_plan(
    hospital_scenario,
    resource_scenario,
    shelter_scenario,
):

    hospital_emergency = (
        hospital_scenario[
            "emergency"
        ]
    )

    hospital_options = (
        build_hospital_options(
            hospital_scenario
        )
    )

    ambulance_assignments = (
        build_ambulance_assignments(
            resource_scenario
        )
    )

    shelter_assignments = (
        build_shelter_assignments(
            shelter_scenario
        )
    )

    Q = build_final_qubo(
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
        {
            "patients":
                hospital_emergency[
                    "patients"
                ],
            "high_severity_patients":
                hospital_emergency[
                    "high_severity_patients"
                ],
        },
    )

    groups = build_groups(
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    validator = create_validator(
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    result = run_final_qaoa(
        Q,
        groups,
        validator,
        reps=2,
    )

    plan = decode_plan(
        result["bitstring"],
        hospital_options,
        ambulance_assignments,
        shelter_assignments,
    )

    return result, plan


# ============================================================
# SAVE RESULT
# ============================================================

def save_result(
    initial_result,
    initial_plan,
    final_result,
    final_plan,
):

    os.makedirs(
        os.path.dirname(
            RESULT_FILE
        ),
        exist_ok=True,
    )

    output = {

        "engine":
            "Q-Rescue Final Quantum Decision Engine",

        "algorithm":
            "QAOA",

        "quantum_variables":
            18,

        "initial_plan": {
            "bitstring":
                initial_result[
                    "bitstring"
                ],
            "probability":
                initial_result[
                    "probability"
                ],
            "qubo_cost":
                initial_result[
                    "qubo_cost"
                ],
            "expectation":
                initial_result[
                    "expectation"
                ],
            "decision":
                initial_plan,
        },

        "reoptimized_plan": {
            "bitstring":
                final_result[
                    "bitstring"
                ],
            "probability":
                final_result[
                    "probability"
                ],
            "qubo_cost":
                final_result[
                    "qubo_cost"
                ],
            "expectation":
                final_result[
                    "expectation"
                ],
            "decision":
                final_plan,
        },

        "dynamic_reoptimization":
            True,

        "status":
            "RE-OPTIMIZED",
    }

    with open(
        RESULT_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            output,
            file,
            indent=4,
        )


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print(
        "Q-RESCUE FINAL QUANTUM "
        "DECISION ENGINE"
    )
    print("=" * 60)

    print()
    print(
        "Loading Digital Disaster Twin..."
    )

    hospital_scenario = load_json(
        HOSPITAL_FILE
    )

    resource_scenario = load_json(
        RESOURCE_FILE
    )

    shelter_scenario = load_json(
        SHELTER_FILE
    )

    # ========================================================
    # INITIAL PLAN
    # ========================================================

    (
        initial_result,
        initial_plan,
    ) = run_integrated_plan(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    print_plan(
        "INITIAL QUANTUM RESPONSE PLAN",
        initial_result,
        initial_plan,
    )

    # ========================================================
    # ENVIRONMENT CHANGE
    # ========================================================

    (
        changed_hospital,
        changed_resource,
        changed_shelter,
    ) = simulate_environment_change(
        hospital_scenario,
        resource_scenario,
        shelter_scenario,
    )

    print()
    print("=" * 60)
    print(
        "SIGNIFICANT CHANGE DETECTED"
    )
    print(
        "STARTING DYNAMIC "
        "RE-OPTIMIZATION"
    )
    print("=" * 60)

    # ========================================================
    # NEW PLAN
    # ========================================================

    (
        final_result,
        final_plan,
    ) = run_integrated_plan(
        changed_hospital,
        changed_resource,
        changed_shelter,
    )

    print_plan(
        "NEW QUANTUM RESPONSE PLAN",
        final_result,
        final_plan,
    )

    # ========================================================
    # SAVE
    # ========================================================

    save_result(
        initial_result,
        initial_plan,
        final_result,
        final_plan,
    )

    print()
    print(
        "Final integrated result saved to:"
    )

    print(
        RESULT_FILE
    )

    print()
    print("=" * 60)
    print(
        "FINAL QUANTUM DECISION "
        "ENGINE COMPLETE"
    )
    print("=" * 60)


if __name__ == "__main__":
    main()