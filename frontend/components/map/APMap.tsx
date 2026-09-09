"use client";

import { useEffect, useState } from "react";
import { LocateFixed, Maximize2, Minimize2 } from "lucide-react";
import { MapContainer, ScaleControl, TileLayer, ZoomControl, useMap } from "react-leaflet";
import { LayerGroup } from "react-leaflet";
import { geoJSON } from "leaflet";
import type { FeatureCollection, GeoJsonObject, Geometry } from "geojson";
import { DistrictLayer } from "@/components/map/DistrictLayer";
import { LayerControls, type MapLayerKey, type MapLayerState } from "@/components/map/LayerControls";
import { IncidentHeatLayer } from "@/components/map/IncidentHeatLayer";
import { AmbulanceLayer, CitizenRequestLayer, HospitalLayer, IncidentLayer, RescueTeamLayer, RoadLayer, ShelterLayer } from "@/components/map/OperationalLayers";
import { fetchMapData, subscribeToMapChanges, VIJAYAWADA_BOUNDS, type MapData } from "@/lib/map/data";
import { APMaskLayer } from "@/components/map/APMaskLayer";
import { VillageLayer } from "@/components/map/NtrContextLayers";
import { TacticalFloodRiskLayer } from "@/components/map/TacticalCoverageLayers";
import { FloodGeoJsonLayer, VijayawadaLabels } from "@/components/map/VijayawadaContextLayers";

const initialLayers: MapLayerState = { rescueTeams: true, ambulances: true, shelters: true, hospitals: true, citizenRequests: true, roads: false, villages: false, floodRisk: true, floodZones: false, roadClosures: true };
const ANDHRA_PRADESH_BOUNDS: [[number, number], [number, number]] = [[12.6, 76.7], [19.3, 84.9]];

function FitToVijayawada() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([[VIJAYAWADA_BOUNDS.south, VIJAYAWADA_BOUNDS.west], [VIJAYAWADA_BOUNDS.north, VIJAYAWADA_BOUNDS.east]], { padding: [24, 24] });
  }, [map]);
  return null;
}

function MapSizeSync() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false, pan: false }));
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function LocateButton() {
  const map = useMap();
  return <button type="button" aria-label="Locate Vijayawada" title="Locate Vijayawada" onClick={() => map.flyTo([16.515, 80.645], 11, { duration: 0.7 })} className="grid h-11 w-11 place-items-center rounded-full border border-primary/35 bg-background/85 text-primary shadow-neon backdrop-blur-xl transition hover:scale-105 hover:border-primary hover:bg-primary/15 hover:shadow-glow"><LocateFixed className="h-5 w-5" /></button>;
}

type APMapProps = {
  fullscreen: boolean;
  onFullscreenToggle: () => void;
};

export function APMap({ fullscreen, onFullscreenToggle }: APMapProps) {
  const [districts, setDistricts] = useState<FeatureCollection<Geometry> | null>(null);
  const [floodZones, setFloodZones] = useState<FeatureCollection<Geometry> | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [layers, setLayers] = useState(initialLayers);
  const thunderforestKey = process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY?.trim();

  useEffect(() => {
    let active = true;
    fetch("/data/andhra-pradesh-districts.geojson").then((response) => {
      if (!response.ok) throw new Error("District boundary data unavailable");
      return response.json() as Promise<FeatureCollection<Geometry>>;
    }).then((data) => { if (active) setDistricts(data); }).catch(() => { if (active) setDistricts(null); });
    return () => { active = false; };
  }, []);

  useEffect(() => { fetch("/data/vijayawada-flood-zones.geojson").then((response) => response.ok ? response.json() : null).then((data) => setFloodZones(data)).catch(() => setFloodZones(null)); }, []);

  useEffect(() => {
    let active = true;
    const loadMapData = () => fetchMapData().then((data) => { if (active) setMapData(data); }).catch(() => { if (active) setMapData(null); });
    loadMapData();
    const unsubscribe = subscribeToMapChanges(() => { void loadMapData(); });
    return () => { active = false; unsubscribe(); };
  }, []);

  const toggleLayer = (key: MapLayerKey) => setLayers((current) => ({ ...current, [key]: !current[key] }));

  return <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
    <MapContainer center={[16.5062, 80.648]} zoom={7} minZoom={5} maxZoom={19} maxBounds={ANDHRA_PRADESH_BOUNDS} maxBoundsViscosity={0.82} preferCanvas zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false} zoomControl={false} scrollWheelZoom doubleClickZoom dragging touchZoom className="h-full w-full bg-[#081827]">
      {thunderforestKey && <TileLayer attribution='&copy; <a href="https://www.thunderforest.com/">Thunderforest</a> &copy; OpenStreetMap contributors' url={`https://{s}.tile.thunderforest.com/atlas/{z}/{x}/{y}{r}.png?apikey=${encodeURIComponent(thunderforestKey)}`} maxZoom={22} maxNativeZoom={22} updateWhenZooming={false} updateWhenIdle keepBuffer={2} subdomains="abc" />}
      <MapSizeSync />
      <FitToVijayawada />
      <APMaskLayer districts={districts} />
      {districts && <DistrictLayer data={districts} />}
      <VijayawadaLabels />
      {mapData && <>
        {layers.rescueTeams && <LayerGroup><RescueTeamLayer teams={mapData.rescueTeams} /></LayerGroup>}
        {layers.ambulances && <LayerGroup><AmbulanceLayer ambulances={mapData.ambulances} /></LayerGroup>}
        {layers.shelters && <LayerGroup><ShelterLayer shelters={mapData.shelters} /></LayerGroup>}
        {layers.hospitals && <LayerGroup><HospitalLayer hospitals={mapData.hospitals} /></LayerGroup>}
        {layers.citizenRequests && <LayerGroup><CitizenRequestLayer requests={mapData.citizenRequests} /></LayerGroup>}
        {layers.roads && <LayerGroup><RoadLayer roads={mapData.roads} /></LayerGroup>}
        {layers.roadClosures && <LayerGroup><RoadLayer roads={mapData.roads.filter((road) => road.status !== "open")} /></LayerGroup>}
      </>}
      {layers.villages && <VillageLayer />}
      {layers.floodRisk && <TacticalFloodRiskLayer zones={mapData?.riskZones ?? []} />}
      {layers.floodZones && <FloodGeoJsonLayer data={floodZones} />}
      <ScaleControl position="bottomleft" imperial={false} metric />
      <ZoomControl position="bottomright" />
      <LocateButton />
    </MapContainer>
    {!thunderforestKey && <div className="pointer-events-none absolute inset-0 z-[450] grid place-items-center bg-[#07111f]/90 p-6 text-center backdrop-blur-[2px]"><div className="max-w-sm rounded-2xl border border-warning/30 bg-background/90 p-5 shadow-glass"><p className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-warning">Basemap unavailable</p><p className="mt-2 text-sm leading-6 text-text/65">Add <code className="font-mono text-primary">NEXT_PUBLIC_THUNDERFOREST_API_KEY</code> to enable the Atlas tactical map.</p></div></div>}
    <div className="absolute right-4 top-20 z-[500] flex items-center gap-2"><LayerControls layers={layers} counts={{ ambulances: mapData?.ambulances.length ?? 0, rescueTeams: mapData?.rescueTeams.length ?? 0, hospitals: mapData?.hospitals.length ?? 0, shelters: mapData?.shelters.length ?? 0, citizenRequests: mapData?.citizenRequests.length ?? 0, roads: mapData?.roads.length ?? 0, roadClosures: mapData?.roads.filter((road) => road.status !== "open").length ?? 0, floodRisk: mapData?.riskZones.length ?? 0, floodZones: floodZones?.features.length ?? 0 }} onToggle={toggleLayer} /><button type="button" aria-label={fullscreen ? "Exit fullscreen map" : "Open fullscreen map"} title={fullscreen ? "Exit fullscreen" : "Fullscreen map"} onClick={onFullscreenToggle} className="grid h-11 w-11 place-items-center rounded-full border border-primary/35 bg-background/85 text-primary shadow-neon backdrop-blur-xl transition hover:scale-105 hover:border-primary hover:bg-primary/15 hover:shadow-glow">{fullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}</button></div>
  </div>;
}
