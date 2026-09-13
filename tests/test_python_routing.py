import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.routing import RoadGraph, RoadNode, RoadEdge, AStarRouter, DStarLiteRouter, haversine_distance

def test_routing():
    print("================================================================")
    print("PYTHON BACKEND ROUTING ENGINE (A* & D* LITE) VERIFICATION")
    print("================================================================")

    # 1. Build road graph
    graph = RoadGraph()
    graph.add_node(RoadNode(id="vja_jetty", name="Krishna Jetty", lat=16.5028, lng=80.6405))
    graph.add_node(RoadNode(id="vja_barrage", name="Prakasam Barrage North", lat=16.5065, lng=80.6050))
    graph.add_node(RoadNode(id="vja_mg_road", name="MG Road Junction", lat=16.5085, lng=80.6425))
    graph.add_node(RoadNode(id="vja_ggh", name="GGH Trauma Center", lat=16.5160, lng=80.6270))

    graph.add_edge(RoadEdge(id="e1", road_name="Jetty to MG Road", u="vja_jetty", v="vja_mg_road", distance_km=0.8, travel_time_min=3.0, status="open"))
    graph.add_edge(RoadEdge(id="e2", road_name="MG Road to GGH", u="vja_mg_road", v="vja_ggh", distance_km=2.1, travel_time_min=6.0, status="open"))
    graph.add_edge(RoadEdge(id="e3_direct", road_name="Direct Barrage Cutoff", u="vja_jetty", v="vja_ggh", distance_km=1.5, travel_time_min=4.0, status="blocked"))

    # 2. Test A* router
    astar = AStarRouter(graph)
    route = astar.find_route("vja_jetty", "vja_ggh")

    assert route.success, "A* should find valid route"
    assert "e3_direct" not in [e.id for e in route.edges], "A* should avoid blocked direct edge"
    assert route.total_distance_km == 2.9, f"Expected 2.9km, got {route.total_distance_km}"
    print(f"  [PASS] A* Router found safe detour via MG Road: {route.path_node_ids} (Dist: {route.total_distance_km}km, Cost: {route.total_cost:.2f})")

    # 3. Test D* Lite incremental replanner
    dstar = DStarLiteRouter(graph, "vja_jetty", "vja_ggh")
    init_path = dstar.plan()
    assert init_path == ["vja_jetty", "vja_mg_road", "vja_ggh"], f"D* Lite initial path mismatch: {init_path}"
    print(f"  [PASS] D* Lite Initial Plan: {init_path}")

    # Dynamically flood e2
    graph.update_edge_status("e2", "flooded", flood_risk=0.9, blocked_reason="1.2m canal spill")
    replan_path = dstar.update_edge("e2", float("inf"))
    print(f"  [PASS] D* Lite Dynamic Block Detection triggered on edge e2.")

    print("================================================================")
    print("ALL PYTHON ROUTING TESTS PASSED!")
    print("================================================================")

if __name__ == "__main__":
    test_routing()
