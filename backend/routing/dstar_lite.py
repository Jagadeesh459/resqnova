"""
D* Lite Incremental Dynamic Replanning Engine (Koenig & Likhachev).
When road segments flood or clear during disaster escalation, D* Lite updates only
the affected vertices and incrementally shifts paths without recalculating from scratch.
"""
import time
from typing import Dict, List, Optional, Tuple, Any
from .graph import RoadGraph, RoadNode
from .utils import PriorityQueue, haversine_distance

class DStarLiteRouter:
    def __init__(self, graph: RoadGraph, start_node: str, goal_node: str, mode: str = "standard"):
        self.graph = graph
        self.s_start = start_node
        self.s_goal = goal_node
        self.s_last = start_node
        self.mode = mode
        self.km = 0.0

        self.queue = PriorityQueue()
        self.g: Dict[str, float] = {}
        self.rhs: Dict[str, float] = {}

        self._initialize()

    def _heuristic(self, a_id: str, b_id: str) -> float:
        node_a = self.graph.nodes[a_id]
        node_b = self.graph.nodes[b_id]
        return haversine_distance(node_a.lat, node_a.lng, node_b.lat, node_b.lng)

    def _calculate_key(self, s: str) -> Tuple[float, float]:
        min_val = min(self.g.get(s, float("inf")), self.rhs.get(s, float("inf")))
        k1 = min_val + self._heuristic(self.s_start, s) + self.km
        k2 = min_val
        return (k1, k2)

    def _initialize(self):
        self.queue = PriorityQueue()
        self.km = 0.0
        self.g = {node: float("inf") for node in self.graph.nodes}
        self.rhs = {node: float("inf") for node in self.graph.nodes}

        # Goal lookahead is 0
        self.rhs[self.s_goal] = 0.0
        self.queue.insert(self.s_goal, self._calculate_key(self.s_goal))

    def _update_vertex(self, u: str):
        if u != self.s_goal:
            min_rhs = float("inf")
            for sprime in self.graph.get_successors(u):
                c = self.graph.get_cost(u, sprime, self.mode)
                val = c + self.g.get(sprime, float("inf"))
                if val < min_rhs:
                    min_rhs = val
            self.rhs[u] = min_rhs

        self.queue.remove(u)
        if self.g.get(u, float("inf")) != self.rhs.get(u, float("inf")):
            self.queue.insert(u, self._calculate_key(u))

    def compute_shortest_path(self) -> bool:
        """
        Incrementally expands inconsistent nodes until s_start is consistent
        and has key <= queue.top_key().
        """
        while True:
            top_key = self.queue.top_key()
            start_key = self._calculate_key(self.s_start)

            if top_key >= start_key and self.rhs.get(self.s_start, float("inf")) == self.g.get(self.s_start, float("inf")):
                break

            pop_result = self.queue.pop()
            if pop_result is None:
                break
            u, k_old = pop_result
            k_new = self._calculate_key(u)

            if k_old < k_new:
                self.queue.insert(u, k_new)
            elif self.g.get(u, float("inf")) > self.rhs.get(u, float("inf")):
                self.g[u] = self.rhs.get(u, float("inf"))
                for pred in self.graph.get_predecessors(u):
                    self._update_vertex(pred)
            else:
                self.g[u] = float("inf")
                for pred in self.graph.get_predecessors(u) + [u]:
                    self._update_vertex(pred)

        return self.g.get(self.s_start, float("inf")) < float("inf")

    def update_road_blockage(self, road_id: str, new_status: str = "blocked", blocked_reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Dynamic replanning trigger when a road status mutates.
        """
        t0 = time.perf_counter()

        self.km += self._heuristic(self.s_last, self.s_start)
        self.s_last = self.s_start

        affected_edges = self.graph.update_road_status(road_id, new_status, blocked_reason)

        for u, v in affected_edges:
            self._update_vertex(u)

        success = self.compute_shortest_path()
        latency_ms = (time.perf_counter() - t0) * 1000.0

        if not success:
            return {
                "success": False,
                "algorithm": "D* Lite",
                "replanned": False,
                "error": "Route unavailable - all alternative corridors blocked",
                "recompute_latency_ms": round(latency_ms, 2),
            }

        # Extract path
        curr = self.s_start
        path = [curr]
        visited = {curr}
        total_dist = 0.0
        total_time = 0.0
        full_coords: List[List[float]] = []

        while curr != self.s_goal:
            best_succ = None
            best_cost = float("inf")
            for sprime in self.graph.get_successors(curr):
                c = self.graph.get_cost(curr, sprime, self.mode)
                val = c + self.g.get(sprime, float("inf"))
                if val < best_cost:
                    best_cost = val
                    best_succ = sprime

            if best_succ is None or best_succ in visited or best_cost == float("inf"):
                break

            edge = self.graph.get_edge(curr, best_succ)
            if edge:
                total_dist += edge.distance_km
                total_time += edge.travel_time_min
                if edge.coordinates:
                    if full_coords and edge.coordinates[0] == full_coords[-1]:
                        full_coords.extend(edge.coordinates[1:])
                    else:
                        full_coords.extend(edge.coordinates)
                else:
                    u_node = self.graph.nodes[curr]
                    v_node = self.graph.nodes[best_succ]
                    if not full_coords:
                        full_coords.append([u_node.lat, u_node.lng])
                    full_coords.append([v_node.lat, v_node.lng])

            curr = best_succ
            visited.add(curr)
            path.append(curr)

        if not full_coords:
            for node_id in path:
                n = self.graph.nodes[node_id]
                full_coords.append([n.lat, n.lng])

        return {
            "success": True,
            "algorithm": "D* Lite",
            "replanned": True,
            "recompute_latency_ms": round(latency_ms, 2),
            "new_distance_km": round(total_dist, 2),
            "new_duration_min": round(total_time, 1),
            "detour_reason": f"Live replanning avoided {road_id} ({blocked_reason or 'Flooded'})",
            "path_nodes": path,
            "coordinates": full_coords,
        }

    def plan(self) -> List[str]:
        """Compute shortest path and return node ID sequence."""
        success = self.compute_shortest_path()
        if not success:
            return []
        curr = self.s_start
        path = [curr]
        visited = {curr}
        while curr != self.s_goal:
            best_succ = None
            best_cost = float("inf")
            for sprime in self.graph.get_successors(curr):
                c = self.graph.get_cost(curr, sprime, self.mode)
                val = c + self.g.get(sprime, float("inf"))
                if val < best_cost:
                    best_cost = val
                    best_succ = sprime

            if best_succ is None or best_succ in visited or best_cost == float("inf"):
                break
            curr = best_succ
            visited.add(curr)
            path.append(curr)
        return path

    def update_edge(self, edge_id: str, new_cost: float = float("inf")) -> List[str]:
        """Dynamically update an edge's blockage status and incrementally replan."""
        status = "blocked" if new_cost == float("inf") else "open"
        res = self.update_road_blockage(edge_id, new_status=status)
        if isinstance(res, dict) and "path_nodes" in res:
            return res["path_nodes"]
        return self.plan()
