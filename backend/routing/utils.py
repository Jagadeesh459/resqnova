"""
Mathematical utilities, coordinate geometry, and priority queues for ResQNova routing.
"""
import math
import heapq
from typing import Tuple, Dict, Any, List, Optional

EARTH_RADIUS_KM = 6371.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Admissible and consistent Haversine distance heuristic in kilometers.
    h(n) = 2R * arcsin(sqrt(sin^2(dlat/2) + cos(lat1)*cos(lat2)*sin^2(dlon/2)))
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return EARTH_RADIUS_KM * c

class PriorityQueue:
    """Min-heap priority queue supporting element updates and multi-dimensional keys."""
    def __init__(self):
        self._heap: List[Tuple[Any, ...]] = []
        self._entry_finder: Dict[str, Any] = {}
        self._counter = 0

    def insert(self, item: str, priority: Tuple[float, ...]):
        self._counter += 1
        entry = list(priority) + [self._counter, item]
        self._entry_finder[item] = entry
        heapq.heappush(self._heap, entry)

    def remove(self, item: str):
        if item in self._entry_finder:
            entry = self._entry_finder.pop(item)
            entry[-1] = None  # mark as removed

    def pop(self) -> Optional[Tuple[str, Tuple[float, ...]]]:
        while self._heap:
            entry = heapq.heappop(self._heap)
            item = entry[-1]
            if item is not None:
                del self._entry_finder[item]
                priority = tuple(entry[:-2])
                return item, priority
        return None

    def top_key(self) -> Tuple[float, ...]:
        while self._heap:
            if self._heap[0][-1] is None:
                heapq.heappop(self._heap)
            else:
                return tuple(self._heap[0][:-2])
        return (float('inf'), float('inf'))

    def contains(self, item: str) -> bool:
        return item in self._entry_finder

    def is_empty(self) -> bool:
        while self._heap and self._heap[0][-1] is None:
            heapq.heappop(self._heap)
        return len(self._heap) == 0
