"use client";

import { LayerGroup, Polygon, CircleMarker } from "react-leaflet";
import type { RiskZoneRecord } from "@/lib/map/data";

const villages = [
  [16.545, 80.65, "Ajit Singh Nagar"], [16.57, 80.61, "Gollapudi"], [16.533, 80.6, "Bhavanipuram"], [16.51, 80.65, "Krishna Lanka"],
] as const;

export function VillageLayer() {
  return <LayerGroup>{villages.map(([lat, lng, name]) => <CircleMarker key={name} center={[lat, lng]} radius={4} pathOptions={{ color: "#FACC15", fillColor: "#FACC15", fillOpacity: 0.8, weight: 1 }} />)}</LayerGroup>;
}

export function FloodRiskLayer({ zones }: { zones: RiskZoneRecord[] }) {
  const fallbackZones = [
    [[16.500, 80.630], [16.525, 80.630], [16.525, 80.660], [16.500, 80.660]],
    [[16.515, 80.640], [16.535, 80.640], [16.535, 80.665], [16.515, 80.665]],
  ] as [number, number][][];
  const databaseZones = zones.map((zone) => ({ zone, positions: (zone.polygon.coordinates?.[0] ?? []).map(([lng, lat]) => [lat, lng] as [number, number]) }));
  const rendered = databaseZones.length ? databaseZones : fallbackZones.map((_, index) => ({ zone: { id: `fallback-${index}`, zone_name: index === 0 ? "Vijayawada riverfront" : "Vijayawada low-lying zone", risk_level: "high", risk_score: 80, polygon: {} }, positions: fallbackZones[index] }));
  return <LayerGroup>{rendered.map(({ zone, positions }) => <Polygon key={zone.id} positions={positions} pathOptions={{ color: zone.risk_level === "critical" ? "#EF4444" : "#FACC15", weight: 1, opacity: 0.55, fillColor: zone.risk_level === "critical" ? "#EF4444" : "#FACC15", fillOpacity: 0.08 }} />)}</LayerGroup>;
}
