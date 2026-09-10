import copy
import json

from optimization.shelter_qaoa_solver import run_shelter_qaoa


BASE_DIR = __file__.replace(
    "\\optimization\\dynamic_shelter_optimizer.py",
    ""
)

SCENARIO_FILE = (
    BASE_DIR
    + "\\data\\shelter_scenario.json"
)


def load_scenario():
    with open(
        SCENARIO_FILE,
        "r",
        encoding="utf-8",
    ) as file:
        return json.load(file)


def print_plan(title, result):
    print()
    print("=" * 60)
    print(title)
    print("=" * 60)

    print()
    print("QAOA bitstring :", result["bitstring"])
    print(
        "Probability    : "
        f"{result['probability']:.6f}"
    )
    print(
        "QUBO cost      : "
        f"{result['qubo_cost']:.2f}"
    )
    print(
        "Expectation     : "
        f"{result['expectation']:.2f}"
    )

    print()
    print("SHELTER ALLOCATION")
    print("-" * 60)

    for assignment in result["assignments"]:

        print(
            f"{assignment['zone']} → "
            f"{assignment['shelter']} | "
            f"{assignment['risk'].upper()} | "
            f"evacuees {assignment['evacuees']} | "
            f"capacity {assignment['capacity']} | "
            f"ETA {assignment['eta_min']} min"
        )


def simulate_environment_change(scenario):

    changed = copy.deepcopy(scenario)

    print()
    print("=" * 60)
    print("DETECTED ENVIRONMENT CHANGES")
    print("=" * 60)

    # ---------------------------------------------------------
    # Mylavaram becomes more dangerous.
    # ---------------------------------------------------------

    for zone in changed["zones"]:

        if zone["id"] == "zone-002":

            print(
                "Mylavaram risk: "
                f"{zone['risk_level'].upper()} → HIGH"
            )

            print(
                "Mylavaram predicted evacuees: "
                f"{zone['predicted_evacuees']} → 220"
            )

            zone["risk_level"] = "high"
            zone["predicted_evacuees"] = 220

    # ---------------------------------------------------------
    # Mylavaram shelter loses available capacity.
    # ---------------------------------------------------------

    for shelter in changed["shelters"]:

        if shelter["id"] == "shelter-003":

            print(
                "Mylavaram Emergency Shelter "
                "available capacity: "
                f"{shelter['available_capacity']} → 150"
            )

            shelter["available_capacity"] = 150

    # ---------------------------------------------------------
    # Mylavaram → Municipal Hall route becomes blocked.
    # ---------------------------------------------------------

    for route in changed["travel_times"]:

        if (
            route["zone_id"] == "zone-002"
            and route["shelter_id"] == "shelter-001"
        ):

            print(
                "Mylavaram → Municipal Hall: "
                f"{route['route_status'].upper()} → BLOCKED"
            )

            route["route_status"] = "blocked"

    return changed


def detect_significant_change(
    original,
    changed,
):

    changes = []

    # Risk and demand changes
    for old_zone in original["zones"]:

        new_zone = next(
            zone
            for zone in changed["zones"]
            if zone["id"] == old_zone["id"]
        )

        if (
            old_zone["risk_level"]
            != new_zone["risk_level"]
        ):

            changes.append("risk_level")

        if (
            old_zone["predicted_evacuees"]
            != new_zone["predicted_evacuees"]
        ):

            changes.append(
                "predicted_evacuees"
            )

    # Shelter capacity changes
    for old_shelter in original["shelters"]:

        new_shelter = next(
            shelter
            for shelter in changed["shelters"]
            if shelter["id"] == old_shelter["id"]
        )

        if (
            old_shelter["available_capacity"]
            != new_shelter["available_capacity"]
        ):

            changes.append(
                "shelter_capacity"
            )

    # Route changes
    for old_route in original["travel_times"]:

        new_route = next(
            route
            for route in changed["travel_times"]
            if (
                route["zone_id"]
                == old_route["zone_id"]
                and
                route["shelter_id"]
                == old_route["shelter_id"]
            )
        )

        if (
            old_route["route_status"]
            != new_route["route_status"]
        ):

            changes.append(
                "route_status"
            )

    return len(changes) > 0


def main():

    print()
    print("=" * 60)
    print(
        "Q-RESCUE DYNAMIC QUANTUM "
        "SHELTER ALLOCATION"
    )
    print("=" * 60)

    print()
    print(
        "Loading Digital Disaster Twin..."
    )

    scenario = load_scenario()

    # ---------------------------------------------------------
    # INITIAL PLAN
    # ---------------------------------------------------------

    initial_result = run_shelter_qaoa(
        scenario
    )

    print_plan(
        "INITIAL QUANTUM SHELTER PLAN",
        initial_result,
    )

    # ---------------------------------------------------------
    # ENVIRONMENT CHANGE
    # ---------------------------------------------------------

    changed_scenario = (
        simulate_environment_change(
            scenario
        )
    )

    # ---------------------------------------------------------
    # CHANGE DETECTION
    # ---------------------------------------------------------

    if detect_significant_change(
        scenario,
        changed_scenario,
    ):

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

        # -----------------------------------------------------
        # RE-OPTIMIZATION
        # -----------------------------------------------------

        new_result = run_shelter_qaoa(
            changed_scenario
        )

        print_plan(
            "NEW QUANTUM SHELTER PLAN",
            new_result,
        )

    else:

        print()
        print(
            "No significant environmental "
            "change detected."
        )

    print()
    print("=" * 60)
    print(
        "DYNAMIC QUANTUM SHELTER "
        "ALLOCATION COMPLETE"
    )
    print("=" * 60)


if __name__ == "__main__":
    main()