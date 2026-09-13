"""
Directed road network representation and edge weight model for Vijayawada.
Builds and synchronizes topology from Supabase 'roads' table and in-memory stores.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Set, Any
from .utils import haversine_distance

@dataclass
class RoadNode:
    id: str
    name: str
    lat: float
    lng: float

@dataclass
class RoadEdge:
    id: str
    road_name: str
    u: str  # source node id
    v: str  # target node id
    distance_km: float
    travel_time_min: float
    flood_risk: float = 0.0      # 0.0 (Dry) to 1.0 (Submerged)
    congestion: float = 1.0      # 1.0 (Free flow) to 5.0 (Gridlock)
    status: str = "open"         # 'open' | 'flooded' | 'blocked' | 'restricted'
    blocked_reason: Optional[str] = None
    coordinates: List[List[float]] = field(default_factory=list)  # [[lat, lng], ...]

class RoadGraph:
    """
    Topological directed graph G = (V, E) of the Vijayawada / NTR District urban network.
    """
    def __init__(self, wd: float = 1.0, wt: float = 1.5, wf: float = 5.0, wc: float = 1.0):
        self.wd = wd  # distance weight
        self.wt = wt  # travel time weight
        self.wf = wf  # flood risk weight
        self.wc = wc  # congestion weight

        self.nodes: Dict[str, RoadNode] = {}
        self.edges: Dict[str, RoadEdge] = {}
        self.adj: Dict[str, Dict[str, RoadEdge]] = {}       # u -> {v: RoadEdge}
        self.pred: Dict[str, Dict[str, RoadEdge]] = {}      # v -> {u: RoadEdge} (for reverse search)

    def add_node(self, node_or_id: Any, name: str = "", lat: float = 0.0, lng: float = 0.0) -> RoadNode:
        if isinstance(node_or_id, RoadNode):
            node = node_or_id
            node_id = node.id
        else:
            node_id = str(node_or_id)
            node = RoadNode(id=node_id, name=name, lat=lat, lng=lng)
        self.nodes[node_id] = node
        if node_id not in self.adj:
            self.adj[node_id] = {}
        if node_id not in self.pred:
            self.pred[node_id] = {}
        return node

    def add_edge(self, edge: RoadEdge, bidirectional: bool = True):
        self.edges[edge.id] = edge
        if edge.u not in self.adj:
            self.adj[edge.u] = {}
        if edge.v not in self.pred:
            self.pred[edge.v] = {}
        self.adj[edge.u][edge.v] = edge
        self.pred[edge.v][edge.u] = edge

        if bidirectional:
            rev_id = f"{edge.id}_rev"
            rev_coords = list(reversed(edge.coordinates)) if edge.coordinates else []
            rev_edge = RoadEdge(
                id=rev_id,
                road_name=edge.road_name,
                u=edge.v,
                v=edge.u,
                distance_km=edge.distance_km,
                travel_time_min=edge.travel_time_min,
                flood_risk=edge.flood_risk,
                congestion=edge.congestion,
                status=edge.status,
                blocked_reason=edge.blocked_reason,
                coordinates=rev_coords,
            )
            self.edges[rev_id] = rev_edge
            if rev_edge.u not in self.adj:
                self.adj[rev_edge.u] = {}
            if rev_edge.v not in self.pred:
                self.pred[rev_edge.v] = {}
            self.adj[rev_edge.u][rev_edge.v] = rev_edge
            self.pred[rev_edge.v][rev_edge.u] = rev_edge

    def calculate_edge_cost(self, edge: RoadEdge, mode: str = "standard") -> float:
        """
        Mathematical edge cost:
        Cost(u, v) = inf if status in {'blocked', 'flooded'}
        Cost(u, v) = wd*distance + wt*travel_time + wf*(flood_risk*10) + wc*congestion if 'open'
        """
        if edge.status in ("blocked", "flooded"):
            return float("inf")

        effective_wf = self.wf
        effective_wc = self.wc

        if mode in ("rescue_dispatch", "boat"):
            # Boats / heavy trucks are less penalized by water depth
            effective_wf = max(0.5, self.wf * 0.2)
        elif mode == "ambulance_trauma":
            # Ambulances prioritize emergency green corridors; congestion discounted
            effective_wc = max(0.2, self.wc * 0.3)

        cost = (
            self.wd * edge.distance_km +
            self.wt * edge.travel_time_min +
            effective_wf * (edge.flood_risk * 10.0) +
            effective_wc * edge.congestion
        )
        return cost

    def get_edge(self, u: str, v: str) -> Optional[RoadEdge]:
        return self.adj.get(u, {}).get(v)

    def get_cost(self, u: str, v: str, mode: str = "standard") -> float:
        edge = self.get_edge(u, v)
        if edge is None:
            return float("inf")
        return self.calculate_edge_cost(edge, mode)

    def get_successors(self, u: str) -> List[str]:
        return list(self.adj.get(u, {}).keys())

    def get_predecessors(self, v: str) -> List[str]:
        return list(self.pred.get(v, {}).keys())

    def update_road_status(self, road_id: str, status: str, blocked_reason: Optional[str] = None) -> List[Tuple[str, str]]:
        """
        Mutates edge status (e.g. to 'blocked' or 'open'). Returns affected (u, v) edges.
        """
        affected = []
        for edge_key in (road_id, f"{road_id}_rev"):
            if edge_key in self.edges:
                edge = self.edges[edge_key]
                edge.status = status
                if blocked_reason is not None:
                    edge.blocked_reason = blocked_reason
                affected.append((edge.u, edge.v))
        return affected

    def update_edge_status(self, edge_id: str, status: str, flood_risk: Optional[float] = None, blocked_reason: Optional[str] = None) -> List[Tuple[str, str]]:
        affected = self.update_road_status(edge_id, status, blocked_reason)
        if flood_risk is not None:
            for edge_key in (edge_id, f"{edge_id}_rev"):
                if edge_key in self.edges:
                    self.edges[edge_key].flood_risk = flood_risk
        return affected

    def find_nearest_node(self, lat: float, lng: float) -> str:
        best_id = ""
        min_dist = float("inf")
        for node_id, node in self.nodes.items():
            d = haversine_distance(lat, lng, node.lat, node.lng)
            if d < min_dist:
                min_dist = d
                best_id = node_id
        return best_id
