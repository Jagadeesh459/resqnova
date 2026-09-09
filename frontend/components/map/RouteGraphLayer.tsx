"use client";

import { useMemo } from "react";
import { CircleMarker, LayerGroup, Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { NTR_ROUTE_GRAPH } from "@/lib/route-graph";

const nodePositions: Record<string, LatLngExpression> = {
  "Benz Circle": [16.517, 80.648], Governorpet: [16.526, 80.635], "Kanaka Durga Bridge": [16.506, 80.648], "Railway Station": [16.519, 80.642], "Bus Stand": [16.515, 80.635], GGH: [16.5193, 80.6305], "MG Road": [16.515, 80.645], "Eluru Road": [16.53, 80.64], Bhavanipuram: [16.533, 80.6], Vijayawada: [16.5062, 80.648], "Auto Nagar": [16.498, 80.69],
};

export function RouteGraphLayer({ safe = false }: { safe?: boolean }) {
  const edges = useMemo(() => NTR_ROUTE_GRAPH.edges.filter((edge) => nodePositions[edge.source] && nodePositions[edge.destination]), []);
  return <LayerGroup>{edges.map((edge) => <Polyline key={`${edge.source}-${edge.destination}`} positions={[nodePositions[edge.source], nodePositions[edge.destination]]} pathOptions={{ color: safe ? "#22C55E" : "#00D4FF", weight: safe ? 3 : 2, opacity: safe ? 0.8 : 0.55, dashArray: safe ? undefined : "5 8" }} />)}{Object.entries(nodePositions).map(([name, position]) => <CircleMarker key={name} center={position} radius={3} pathOptions={{ color: safe ? "#22C55E" : "#8B5CF6", fillColor: safe ? "#22C55E" : "#00D4FF", fillOpacity: 0.9, weight: 1 }} />)}</LayerGroup>;
}
