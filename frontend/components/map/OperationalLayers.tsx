"use client";

import { useEffect, useMemo, useState } from "react";
import { LayerGroup, Marker, Polyline, Popup } from "react-leaflet";
import { divIcon, type LatLngExpression } from "leaflet";
import type { AmbulanceRecord, CitizenRequestRecord, HospitalRecord, IncidentRecord, RescueTeamRecord, RoadRecord, ShelterRecord } from "@/lib/map/data";

type MarkerKind = "ambulance" | "rescue" | "hospital" | "shelter" | "incident";

function markerSvg(kind: MarkerKind) {
  const paths = {
    ambulance: '<rect x="5" y="9" width="14" height="9" rx="2"/><path d="M8 9V6h8l3 3M9 14h6M8 19v1M16 19v1"/>',
    rescue: '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"/><path d="M12 7v8M8 11h8"/>',
    hospital: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 7v10M7 12h10"/>',
    shelter: '<path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8Z"/><path d="M9 20v-5h6v5"/>',
    incident: '<path d="M12 3 22 21H2L12 3Z"/><path d="M12 9v5M12 18h.01"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[kind]}</svg>`;
}

function icon(kind: MarkerKind, className = "") {
  return divIcon({ className: "resqnova-div-icon", html: `<span class="resqnova-map-marker resqnova-map-marker--${kind} ${className}">${markerSvg(kind)}</span>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17] });
}

function formatStatus(value: string) { return value.replaceAll("_", " "); }
function StatusRow({ label, value }: { label: string; value: string | number | boolean | null | undefined }) { return <p className="flex justify-between gap-4"><span className="text-text/55">{label}</span><strong className="text-right font-medium capitalize text-text">{value ?? "--"}</strong></p>; }
const popup = "resqnova-glass-popup";

export function IncidentLayer({ incidents }: { incidents: IncidentRecord[] }) {
  const markerIcon = useMemo(() => icon("incident"), []);
  return <LayerGroup>{incidents.map((incident) => <Marker key={incident.id} position={[incident.latitude, incident.longitude]} icon={markerIcon}><Popup className={popup}><div className="space-y-1"><strong>{incident.disaster_type.replaceAll("_", " ")}</strong><StatusRow label="Priority" value={incident.priority} /><StatusRow label="Confidence" value={`${incident.confidence}%`} /><StatusRow label="Status" value={formatStatus(incident.status)} /></div></Popup></Marker>)}</LayerGroup>;
}

export function CitizenRequestLayer({ requests }: { requests: CitizenRequestRecord[] }) {
  const markerIcon = useMemo(() => icon("incident", "resqnova-map-marker--citizen-request"), []);
  return <LayerGroup>{requests.map((request) => <Marker key={request.id} position={[request.latitude, request.longitude]} icon={markerIcon}><Popup className={popup}><div className="space-y-1"><strong>{request.request_id}</strong><StatusRow label="Citizen" value={request.citizen_name ?? "Citizen request"} /><StatusRow label="People" value={request.people_count} /><StatusRow label="Risk" value={formatStatus(request.risk_level)} /><StatusRow label="AI confidence" value={`${request.ai_confidence}%`} /><StatusRow label="Priority" value={request.priority_score} /><StatusRow label="Status" value={formatStatus(request.status)} /><StatusRow label="ETA" value={request.eta ? new Date(request.eta).toLocaleTimeString() : "Pending"} /></div></Popup></Marker>)}</LayerGroup>;
}

export function RescueTeamLayer({ teams }: { teams: RescueTeamRecord[] }) {
  const markerIcon = useMemo(() => icon("rescue"), []);
  return <LayerGroup>{teams.map((team) => <Marker key={team.id} position={[team.latitude, team.longitude]} icon={markerIcon}><Popup className={popup}><div className="space-y-1"><strong>{team.team_name}</strong><StatusRow label="Team type" value={team.team_type} /><StatusRow label="Personnel" value={team.personnel} /><StatusRow label="Readiness" value={team.readiness ?? formatStatus(team.status)} /><StatusRow label="Equipment" value={team.equipment?.join(", ")} /></div></Popup></Marker>)}</LayerGroup>;
}

export function AmbulanceLayer({ ambulances }: { ambulances: AmbulanceRecord[] }) {
  const markerIcons = useMemo(() => ({ available: icon("ambulance"), dispatched: icon("ambulance", "resqnova-map-marker--dispatched"), maintenance: icon("ambulance", "resqnova-map-marker--maintenance") }), []);
  return <LayerGroup>{ambulances.map((ambulance) => { const markerIcon = markerIcons[ambulance.status as keyof typeof markerIcons] ?? markerIcons.available; return <Marker key={ambulance.id} position={[ambulance.latitude, ambulance.longitude]} icon={markerIcon}><Popup className={popup}><div className="space-y-1"><strong>{ambulance.vehicle_code}</strong><StatusRow label="Vehicle code" value={ambulance.vehicle_code} /><StatusRow label="Status" value={formatStatus(ambulance.status)} /><StatusRow label="Crew" value={ambulance.crew_size} /><StatusRow label="Fuel" value={ambulance.fuel != null ? `${ambulance.fuel}%` : undefined} /><StatusRow label="Deployment zone" value={ambulance.deployment_zone} /><StatusRow label="Last updated" value={ambulance.updated_at ? new Date(ambulance.updated_at).toLocaleString() : "--"} /></div></Popup></Marker>; })}</LayerGroup>;
}

export function ShelterLayer({ shelters }: { shelters: ShelterRecord[] }) {
  const markerIcon = useMemo(() => icon("shelter"), []);
  return <LayerGroup>{shelters.map((shelter) => <Marker key={shelter.id} position={[shelter.latitude, shelter.longitude]} icon={markerIcon}><Popup className={popup}><div className="space-y-1"><strong>{shelter.shelter_name}</strong><StatusRow label="Capacity" value={shelter.capacity} /><StatusRow label="Occupancy" value={shelter.occupancy} /><StatusRow label="Food" value={shelter.food_stock} /><StatusRow label="Water" value={shelter.water_stock} /><StatusRow label="Power backup" value={shelter.power_backup ? "Ready" : "Unavailable"} /></div></Popup></Marker>)}</LayerGroup>;
}

export function HospitalLayer({ hospitals }: { hospitals: HospitalRecord[] }) {
  const markerIcon = useMemo(() => icon("hospital"), []);
  return <LayerGroup>{hospitals.map((hospital) => <Marker key={hospital.id} position={[hospital.latitude, hospital.longitude]} icon={markerIcon}><Popup className={popup}><div className="space-y-1"><strong>{hospital.hospital_name}</strong><StatusRow label="Hospital name" value={hospital.hospital_name} /><StatusRow label="Emergency capacity" value={hospital.emergency_capacity} /><StatusRow label="ICU beds" value={hospital.icu_beds} /><StatusRow label="Ambulances available" value={hospital.ambulances_available} /></div></Popup></Marker>)}</LayerGroup>;
}

type RoadGeometry = Record<string, LatLngExpression[]>;
type OsrmRouteResponse = { routes?: Array<{ geometry?: { coordinates?: [number, number][] } }> };

const roadGeometryCache = new Map<string, LatLngExpression[]>();

async function getRoadGeometry(road: RoadRecord, signal: AbortSignal) {
  if (road.start_lat == null || road.start_lng == null || road.end_lat == null || road.end_lng == null) return null;
  const key = `${road.start_lat},${road.start_lng}:${road.end_lat},${road.end_lng}`;
  const cached = roadGeometryCache.get(key);
  if (cached) return { key: road.id, geometry: cached };
  const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL?.trim() || "https://router.project-osrm.org";
  const response = await fetch(`${baseUrl}/route/v1/driving/${road.start_lng},${road.start_lat};${road.end_lng},${road.end_lat}?overview=full&geometries=geojson`, { signal });
  if (!response.ok) return null;
  const payload = await response.json() as OsrmRouteResponse;
  const coordinates = payload.routes?.[0]?.geometry?.coordinates;
  if (!coordinates?.length) return null;
  const geometry = coordinates.map(([lng, lat]) => [lat, lng] as LatLngExpression);
  roadGeometryCache.set(key, geometry);
  return { key: road.id, geometry };
}

export function RoadLayer({ roads }: { roads: RoadRecord[] }) {
  const [geometryByRoad, setGeometryByRoad] = useState<RoadGeometry>({});
  const roadKey = roads.map((road) => `${road.id}:${road.start_lat}:${road.start_lng}:${road.end_lat}:${road.end_lng}`).join("|");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all(roads.map((road) => getRoadGeometry(road, controller.signal).catch(() => null))).then((results) => {
      if (!active) return;
      setGeometryByRoad(Object.fromEntries(results.filter((result): result is { key: string; geometry: LatLngExpression[] } => Boolean(result)).map((result) => [result.key, result.geometry])));
    });
    return () => { active = false; controller.abort(); };
  }, [roadKey]);

  return <LayerGroup>{roads.map((road) => { const path = geometryByRoad[road.id]; if (!path) return null; const color = road.status === "blocked" ? "#EF4444" : road.status === "open" ? "#22C55E" : "#FACC15"; return <Polyline key={road.id} positions={path} pathOptions={{ color, weight: road.status === "blocked" ? 5 : 3, opacity: 0.86, lineCap: "round", lineJoin: "round" }}><Popup className={popup}><div className="space-y-1"><strong>{road.name ?? road.road_name}</strong><StatusRow label="Status" value={formatStatus(road.status)} /><StatusRow label="Travel time" value={road.travel_time ? `${road.travel_time} min` : "--"} /><StatusRow label="Risk score" value={road.risk_score != null ? `${road.risk_score}%` : "--"} /></div></Popup></Polyline>; })}</LayerGroup>;
}
