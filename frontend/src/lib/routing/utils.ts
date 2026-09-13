/**
 * Computes exact Haversine distance between two GPS coordinates in meters
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts GeoJSON LineString coordinates ([lng, lat] format) into Leaflet Polyline format ([lat, lng] format)
 * Preserves all intermediate geometric bend points without loss.
 * @param rawCoordinates Array of [lng, lat] pairs or GeoJSON LineString object
 * @returns Array of [lat, lng] pairs for Leaflet Polyline rendering
 */
export function geoJsonToLeafletCoordinates(
  rawCoordinates: any
): [number, number][] {
  if (!rawCoordinates) return [];

  // Case 1: GeoJSON Object {"type": "LineString", "coordinates": [[lng, lat], ...]}
  if (typeof rawCoordinates === 'object' && rawCoordinates.type === 'LineString' && Array.isArray(rawCoordinates.coordinates)) {
    return rawCoordinates.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
  }

  // Case 2: Array of coordinates
  if (Array.isArray(rawCoordinates)) {
    if (rawCoordinates.length === 0) return [];
    
    // Check if the first point looks like [lng, lat] (India: lng ~ 80.6, lat ~ 16.5)
    // If coordinate[0] > 60 and coordinate[1] < 40, it is [lng, lat] GeoJSON format
    const firstPoint = rawCoordinates[0];
    if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
      if (firstPoint[0] > 50 && firstPoint[1] < 40) {
        // [lng, lat] format -> convert to [lat, lng]
        return rawCoordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      }
      // Already in [lat, lng] format
      return rawCoordinates as [number, number][];
    }
  }

  return [];
}

/**
 * Finds the nearest graph node to a target GPS coordinate
 */
export function findNearestNode(
  nodes: Map<string, { id: string; latitude: number; longitude: number }>,
  targetLat: number,
  targetLng: number
): string | null {
  let nearestId: string | null = null;
  let minDistance = Infinity;

  nodes.forEach((node) => {
    const dist = haversineDistance(targetLat, targetLng, node.latitude, node.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestId = node.id;
    }
  });

  return nearestId;
}
