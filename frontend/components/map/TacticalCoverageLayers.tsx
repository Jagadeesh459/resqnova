"use client";

import { useEffect, useState } from "react";
import { Circle, LayerGroup, Marker, Polygon, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import type { AmbulanceRecord, DeploymentZoneRecord, HospitalRecord, RiskZoneRecord, ShelterRecord } from "@/lib/map/data";

function zoomFade(zoom: number, start: number) { return Math.max(0, Math.min(0.28, (zoom - start) * 0.07)); }
function useMapZoom() { const map = useMap(); const [zoom, setZoom] = useState(map.getZoom()); useEffect(() => { const update = () => setZoom(map.getZoom()); map.on("zoomend", update); return () => { map.off("zoomend", update); }; }, [map]); return zoom; }
function polygonPositions(polygon: { coordinates?: number[][][] }) { return (polygon.coordinates?.[0] ?? []).map(([lng, lat]) => [lat, lng] as [number, number]); }

export function ResourceCoverageLayer({ ambulances, hospitals, shelters }: { ambulances: AmbulanceRecord[]; hospitals: HospitalRecord[]; shelters: ShelterRecord[] }) {
  const opacity = zoomFade(useMapZoom(), 7);
  return <LayerGroup>{ambulances.map((item) => <Circle key={`ambulance-${item.id}`} center={[item.latitude, item.longitude]} radius={1200} pathOptions={{ color: "#00D4FF", weight: 1, opacity, fillColor: "#00D4FF", fillOpacity: opacity * 0.22 }} />)}{hospitals.map((item) => <Circle key={`hospital-${item.id}`} center={[item.latitude, item.longitude]} radius={2500} pathOptions={{ color: "#60A5FA", weight: 1, opacity: opacity * 0.9, fillColor: "#60A5FA", fillOpacity: opacity * 0.14 }} />)}{shelters.map((item) => <Circle key={`shelter-${item.id}`} center={[item.latitude, item.longitude]} radius={800} pathOptions={{ color: "#22C55E", weight: 1, opacity: opacity * 0.8, fillColor: "#22C55E", fillOpacity: opacity * 0.16 }} />)}</LayerGroup>;
}

export function TacticalFloodRiskLayer({ zones }: { zones: RiskZoneRecord[] }) {
  return <LayerGroup>{zones.map((zone) => { const high = zone.risk_level === "critical" || zone.risk_level === "high"; const color = high ? "#dc5b5b" : zone.risk_level === "moderate" ? "#d58a35" : "#c5a83e"; const positions = polygonPositions(zone.polygon); if (!positions.length) return null; return <Polygon key={zone.id} positions={positions} pathOptions={{ className: `resqnova-risk-zone ${high ? "resqnova-risk-zone--high" : ""}`, color, weight: high ? 1.25 : 1, opacity: high ? 0.68 : 0.5, fillColor: color, fillOpacity: zone.risk_level === "critical" ? 0.14 : zone.risk_level === "high" ? 0.1 : zone.risk_level === "moderate" ? 0.07 : 0.05 }} />; })}</LayerGroup>;
}

export function DeploymentZoneLayer({ zones }: { zones: DeploymentZoneRecord[] }) {
  return <LayerGroup>{zones.map((zone) => { const positions = polygonPositions(zone.polygon); if (!positions.length) return null; return <span key={zone.id}><Polygon positions={positions} pathOptions={{ color: "#38BDF8", weight: 1.5, opacity: 0.8, fillColor: "#2563EB", fillOpacity: 0.13 }} /><Marker position={positions[0]} interactive={false} icon={divIcon({ className: "resqnova-deployment-label", html: `${zone.zone_name}<br/><span>READY ${zone.ready_units} · ${zone.coverage}% COVERAGE</span>` })} /></span>; })}</LayerGroup>;
}
