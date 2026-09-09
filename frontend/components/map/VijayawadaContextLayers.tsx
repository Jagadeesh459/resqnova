"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { GeoJSON, CircleMarker, LayerGroup, Marker, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import type { FeatureCollection, Geometry } from "geojson";
import type { AmbulanceRecord, HospitalRecord, ShelterRecord } from "@/lib/map/data";

const labels = [
  ["Vijayawada", [16.5062, 80.648], 8], ["Benz Circle", [16.517, 80.648], 10], ["Governorpet", [16.526, 80.635], 10], ["Railway Station", [16.519, 80.642], 10], ["Bus Stand", [16.515, 80.635], 11], ["Kanaka Durga Bridge", [16.506, 80.648], 11], ["MG Road", [16.515, 80.645], 11], ["Eluru Road", [16.53, 80.64], 11],
] as const;

export function VijayawadaLabels() {
  const [zoom, setZoom] = useState(7);
  const map = useMap();
  useEffect(() => { const update = () => setZoom(map.getZoom()); setZoom(map.getZoom()); map.on("zoomend", update); return () => { map.off("zoomend", update); }; }, [map]);
  return <LayerGroup>{labels.filter(([, , minZoom]) => zoom >= minZoom).map(([name, position]) => <Marker key={name} position={position as [number, number]} interactive={false} icon={divIcon({ className: "resqnova-location-label", html: name })} />)}</LayerGroup>;
}

export function FloodGeoJsonLayer({ data }: { data: FeatureCollection<Geometry> | null }) {
  if (!data) return null;
  const focusedData = { ...data, features: data.features.filter((feature) => !/mylavaram/i.test(String(feature.properties?.name ?? ""))) } as FeatureCollection<Geometry>;
  return <GeoJSON data={focusedData} style={(feature) => { const risk = String(feature?.properties?.risk ?? "moderate"); const color = risk === "extreme" || risk === "high" ? "#EF4444" : risk === "medium" ? "#F97316" : "#FACC15"; return { color, fillColor: color, weight: 1.5, opacity: 0.85, fillOpacity: risk === "extreme" ? 0.32 : risk === "high" ? 0.28 : 0.18 }; }} />;
}

export function ResourceClusterLayer({ ambulances, hospitals, shelters }: { ambulances: AmbulanceRecord[]; hospitals: HospitalRecord[]; shelters: ShelterRecord[] }) {
  const points = useMemo(() => [...ambulances.map((item) => [item.latitude, item.longitude] as [number, number]), ...hospitals.map((item) => [item.latitude, item.longitude] as [number, number]), ...shelters.map((item) => [item.latitude, item.longitude] as [number, number])], [ambulances, hospitals, shelters]);
  const clusters = useMemo(() => { const groups = new Map<string, [number, number, number]>(); points.forEach(([lat, lng]) => { const key = `${lat.toFixed(2)}:${lng.toFixed(2)}`; const current = groups.get(key); groups.set(key, current ? [current[0], current[1], current[2] + 1] : [lat, lng, 1]); }); return [...groups.values()]; }, [points]);
  return <LayerGroup>{clusters.map(([lat, lng, count]) => <Fragment key={`${lat}-${lng}`}><CircleMarker center={[lat, lng]} radius={12 + count * 2} pathOptions={{ color: "#00D4FF", fillColor: "#00D4FF", fillOpacity: 0.2, weight: 2 }} /><Marker position={[lat, lng]} interactive={false} icon={divIcon({ className: "resqnova-cluster-label", html: `${count}` })} /></Fragment>)}</LayerGroup>;
}
