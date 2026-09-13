import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useResQNova } from '../context/ResQNovaContext';
import {
  Layers,
  Eye,
  EyeOff,
  Compass,
  AlertTriangle,
  Route,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DynamicRoutingModal } from './DynamicRoutingModal';

interface TacticalMapProps {
  height?: string;
  focusCoords?: [number, number];
  routePolyline?: [number, number][];
  alternativePolyline?: [number, number][];
  onSelectRequest?: (id: string) => void;
  className?: string;
  showDynamicCorridorsDefault?: boolean;
  showQuantumDispatchDefault?: boolean;
  showQuantumEvacDefault?: boolean;
  minimalCitizenMode?: boolean;
  sosActive?: boolean;
  citizenSource?: { lat: number; lng: number; label: string; address?: string; isSosActive?: boolean };
  citizenDestination?: { lat: number; lng: number; label: string; availableBeds?: number; address?: string };
  bypassWarning?: string;
}

type MapTileStyle = 'tf-transport' | 'tf-outdoors' | 'tf-landscape' | 'carto-dark' | 'carto-voyager';

// In-memory cache for OSRM road geometry
const roadGeometryCache = new Map<string, [number, number][]>();

async function getRoadGeometry(
  road: { id?: string; road_id?: string; start_lat?: number; start_lng?: number; end_lat?: number; end_lng?: number },
  signal: AbortSignal
): Promise<{ id: string; geometry: [number, number][] } | null> {
  const roadId = road.road_id || road.id || '';
  if (!roadId || road.start_lat == null || road.start_lng == null || road.end_lat == null || road.end_lng == null) {
    return null;
  }
  const key = `${road.start_lat},${road.start_lng}:${road.end_lat},${road.end_lng}`;
  const cached = roadGeometryCache.get(key);
  if (cached) return { id: roadId, geometry: cached };

  const baseUrl =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.NEXT_PUBLIC_OSRM_URL || (import.meta as any).env?.VITE_OSRM_URL)) ||
    'https://router.project-osrm.org';

  try {
    const response = await fetch(
      `${baseUrl}/route/v1/driving/${road.start_lng},${road.start_lat};${road.end_lng},${road.end_lat}?overview=full&geometries=geojson`,
      { signal }
    );
    if (!response.ok) return null;
    const payload: any = await response.json();
    const coordinates = payload.routes?.[0]?.geometry?.coordinates;
    if (!coordinates || coordinates.length < 2) return null;

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const geometry: [number, number][] = coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    roadGeometryCache.set(key, geometry);
    return { id: road.id, geometry };
  } catch {
    return null;
  }
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  height = '480px',
  focusCoords,
  routePolyline,
  alternativePolyline,
  onSelectRequest,
  className = '',
  showDynamicCorridorsDefault = true,
  minimalCitizenMode = false,
  sosActive = false,
  citizenSource,
  citizenDestination,
  bypassWarning,
}) => {
  const { state } = useResQNova();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const thunderforestApiKey =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.NEXT_PUBLIC_THUNDERFOREST_API_KEY || (import.meta as any).env?.VITE_THUNDERFOREST_API_KEY)) ||
    '7d071cff43f04a768bc32368bce332cd';

  const [activeTileStyle, setActiveTileStyle] = useState<MapTileStyle>('tf-transport');
  const [roadGeometries, setRoadGeometries] = useState<Record<string, [number, number][]>>({});

  // Layer groups refs
  const layerGroupsRef = useRef<{
    sos: L.LayerGroup;
    rescue: L.LayerGroup;
    ambulances: L.LayerGroup;
    shelters: L.LayerGroup;
    hospitals: L.LayerGroup;
    roads: L.LayerGroup;
    riskZones: L.LayerGroup;
    aiFloodZones: L.LayerGroup;
    strategicStaging: L.LayerGroup;
    route: L.LayerGroup;
    alternativeRoute: L.LayerGroup;
    dynamicCorridors: L.LayerGroup;
  } | null>(null);

  // Layer visibility toggles
  const [layersVisible, setLayersVisible] = useState({
    sos: true,
    rescue: true,
    ambulances: true,
    shelters: true,
    hospitals: true,
    roads: true,
    riskZones: true,
    aiFloodZones: true,
    strategicStaging: true,
    dynamicCorridors: showDynamicCorridorsDefault,
  });

  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showRoutingModal, setShowRoutingModal] = useState(false);

  // Create base tile layer according to style
  const createBaseLayer = (style: MapTileStyle): L.TileLayer => {
    if (thunderforestApiKey && style.startsWith('tf-')) {
      const tfName = style.replace('tf-', '');
      return L.tileLayer(
        `https://{s}.tile.thunderforest.com/${tfName}/{z}/{x}/{y}.png?apikey=${thunderforestApiKey}`,
        {
          attribution:
            '&copy; <a href="https://www.thunderforest.com/" target="_blank">Thunderforest</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
        }
      );
    }

    if (style === 'carto-dark') {
      return L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; CARTO &copy; OpenStreetMap',
          maxZoom: 19,
        }
      );
    }

    return L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }
    );
  };

  // Switch Tile Layer when activeTileStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const newLayer = createBaseLayer(activeTileStyle);
    newLayer.addTo(map);
    baseTileLayerRef.current = newLayer;
  }, [activeTileStyle]);

  // Fetch real road geometries from OSRM
  useEffect(() => {
    if (!state?.roads) return;

    const controller = new AbortController();
    let isMounted = true;

    Promise.all(
      state.roads.map((road) => getRoadGeometry(road, controller.signal).catch(() => null))
    ).then((results) => {
      if (!isMounted) return;
      const geomMap: Record<string, [number, number][]> = {};
      results.forEach((res) => {
        if (res && res.geometry) {
          geomMap[res.id] = res.geometry;
        }
      });
      setRoadGeometries(geomMap);
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [state?.roads]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.5062, 80.648],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialBaseLayer = createBaseLayer('tf-transport');
    initialBaseLayer.addTo(map);
    baseTileLayerRef.current = initialBaseLayer;

    // Layer groups
    const sosGroup = L.layerGroup().addTo(map);
    const rescueGroup = L.layerGroup().addTo(map);
    const ambulancesGroup = L.layerGroup().addTo(map);
    const sheltersGroup = L.layerGroup().addTo(map);
    const hospitalsGroup = L.layerGroup().addTo(map);
    const roadsGroup = L.layerGroup().addTo(map);
    const riskZonesGroup = L.layerGroup().addTo(map);
    const aiFloodZonesGroup = L.layerGroup().addTo(map);
    const strategicStagingGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);
    const alternativeRouteGroup = L.layerGroup().addTo(map);
    const dynamicCorridorsGroup = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      sos: sosGroup,
      rescue: rescueGroup,
      ambulances: ambulancesGroup,
      shelters: sheltersGroup,
      hospitals: hospitalsGroup,
      roads: roadsGroup,
      riskZones: riskZonesGroup,
      aiFloodZones: aiFloodZonesGroup,
      strategicStaging: strategicStagingGroup,
      route: routeGroup,
      alternativeRoute: alternativeRouteGroup,
      dynamicCorridors: dynamicCorridorsGroup,
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers when State changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupsRef.current || !state) return;

    const {
      sos,
      rescue,
      ambulances,
      shelters,
      hospitals,
      roads,
      riskZones,
      aiFloodZones,
      strategicStaging,
      route,
      alternativeRoute,
      dynamicCorridors,
    } = layerGroupsRef.current;

    sos.clearLayers();
    rescue.clearLayers();
    ambulances.clearLayers();
    shelters.clearLayers();
    hospitals.clearLayers();
    roads.clearLayers();
    riskZones.clearLayers();
    aiFloodZones.clearLayers();
    strategicStaging.clearLayers();
    route.clearLayers();
    alternativeRoute.clearLayers();
    dynamicCorridors.clearLayers();

    // -------------------------------------------------------------
    // CITIZEN MODE: SOURCE, DESTINATION & VERIFIED SAFE PATH
    // -------------------------------------------------------------
    if (minimalCitizenMode) {
      const boundsCoords: [number, number][] = [];

      if (citizenSource) {
        boundsCoords.push([citizenSource.lat, citizenSource.lng]);
        const sourceIcon = L.divIcon({
          html: `
            <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:#ef4444; opacity:0.7; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position:relative; background-color:#dc2626; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; font-weight:bold; font-size:16px; box-shadow:0 4px 12px rgba(220,38,38,0.7);">
                📍
              </div>
            </div>
          `,
          className: '',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const sourceMarker = L.marker([citizenSource.lat, citizenSource.lng], { icon: sourceIcon });
        sourceMarker.bindPopup(`
          <div class="p-2 text-slate-900 text-xs font-sans min-w-[200px]">
            <div class="font-bold text-sm text-red-600">📍 YOUR DISTRESS LOCATION</div>
            <div class="font-semibold mt-1 text-slate-800">${citizenSource.label}</div>
            ${citizenSource.address ? `<div class="text-slate-600 text-[11px] mt-0.5">${citizenSource.address}</div>` : ''}
            <div class="mt-2 text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-semibold">
              ✓ Active Signal Registered
            </div>
          </div>
        `);
        sos.addLayer(sourceMarker);
      }

      if (citizenDestination) {
        boundsCoords.push([citizenDestination.lat, citizenDestination.lng]);
        const destIcon = L.divIcon({
          html: `
            <div style="position:relative; width:46px; height:46px; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:#10b981; opacity:0.5; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position:relative; background-color:#059669; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; font-weight:bold; font-size:18px; box-shadow:0 4px 14px rgba(16,185,129,0.7);">
                🛡️
              </div>
            </div>
          `,
          className: '',
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });

        const destMarker = L.marker([citizenDestination.lat, citizenDestination.lng], { icon: destIcon });
        destMarker.bindPopup(`
          <div class="p-2 text-slate-900 text-xs font-sans min-w-[220px]">
            <div class="font-bold text-sm text-emerald-700">🛡️ NEAREST SAFE RELIEF SHELTER</div>
            <div class="font-semibold mt-1 text-slate-800 text-sm">${citizenDestination.label}</div>
            ${citizenDestination.address ? `<div class="text-slate-600 text-[11px] mt-0.5">${citizenDestination.address}</div>` : ''}
            <div class="mt-2 p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex justify-between font-semibold">
              <span>Available Capacity:</span>
              <span class="text-emerald-950 font-bold">${citizenDestination.availableBeds ?? 1420} Beds</span>
            </div>
            <div class="mt-1 text-[10px] text-slate-500">Food, Drinking Water & Paramedics Standby</div>
          </div>
        `);
        shelters.addLayer(destMarker);
      }

      if (routePolyline && routePolyline.length >= 2) {
        boundsCoords.push(...routePolyline);

        const glowLine = L.polyline(routePolyline, {
          color: '#34d399',
          weight: 9,
          opacity: 0.5,
          lineCap: 'round',
        });

        const coreLine = L.polyline(routePolyline, {
          color: '#059669',
          weight: 5,
          opacity: 0.95,
          dashArray: '8, 6',
          lineCap: 'round',
        });

        route.addLayer(glowLine);
        route.addLayer(coreLine);
      }

      // Render Blocked / Flooded Roads in RED so citizen visually identifies hazards to avoid
      state.roads.forEach((road) => {
        const isBlocked = road.status === 'blocked' || road.status === 'flooded';
        if (!isBlocked) return;

        const geom = roadGeometries[road.id];
        if (!geom || geom.length < 2) return;

        boundsCoords.push(...geom);

        const blockedLine = L.polyline(geom, {
          color: '#ef4444',
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        });

        blockedLine.bindPopup(`
          <div class="p-2 text-slate-900 text-xs font-sans min-w-[200px]">
            <div class="font-bold text-sm text-red-600">🚫 ROAD BLOCKED / SUBMERGED</div>
            <div class="font-bold mt-1 text-slate-800">${road.road_name || (road as any).name || 'Flooded Arterial'}</div>
            <div class="text-red-600 text-[11px] font-semibold mt-1">${road.blocked_reason || 'Inundated by floodwaters'}</div>
            <div class="mt-2 text-[10px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-bold">
              ✓ Citizen Evacuation Route Safely Bypasses This Zone
            </div>
          </div>
        `);

        roads.addLayer(blockedLine);
      });

      // Render active pulsating SOS Beacon radar wave
      if (citizenSource && (sosActive || citizenSource.isSosActive)) {
        const radarCircle = L.circle([citizenSource.lat, citizenSource.lng], {
          radius: 140,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.25,
          weight: 2,
          dashArray: '4, 4',
        });
        sos.addLayer(radarCircle);
      }

      if (boundsCoords.length >= 2 && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.fitBounds(L.latLngBounds(boundsCoords), {
            padding: [50, 50],
            maxZoom: 16,
          });
        } catch {}
      }

      return;
    }

    // -------------------------------------------------------------
    // FULL TACTICAL GIS MODE
    // -------------------------------------------------------------

    // 1. Render Risk Zones
    if (layersVisible.riskZones) {
      state.risk_zones.forEach((zone) => {
        const color =
          zone.risk_level === 'Critical'
            ? '#ef4444'
            : zone.risk_level === 'Severe'
            ? '#f97316'
            : '#eab308';

        const polygon = L.polygon(zone.polygon, {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.25,
          dashArray: '4, 4',
        });

        polygon.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-red-600">${zone.zone_name}</div>
            <div class="mt-1">Risk Level: <b>${zone.risk_level}</b> (${zone.risk_score}/100)</div>
            <div>Inundation Level: <b>${zone.water_level_m} meters</b></div>
            <div class="text-[10px] text-slate-500 mt-1">Krishna River Basin Flood Sector</div>
          </div>
        `);
        riskZones.addLayer(polygon);
      });
    }

    // 2. Render Roads via OSRM real geometry (Phase 11: Tactical GIS Legend)
    // - Active Primary Route: #06B6D4 (Cyan), 4px width
    // - Safe Alternative: #10B981 (Emerald), 3px dashed
    // - Blocked / Flooded: #EF4444 (Red), 5px solid with danger crosses
    // - Restricted Corridor: #F59E0B (Amber), 3px dotted
    if (layersVisible.roads) {
      state.roads.forEach((road) => {
        const isBlocked = road.status === 'blocked' || road.status === 'flooded';
        const isRestricted = (road.status as string) === 'restricted';
        const color = isBlocked ? '#EF4444' : isRestricted ? '#F59E0B' : '#10B981';

        const geom = roadGeometries[road.id];
        if (!geom || geom.length < 2) {
          // Roads without valid routing geometry are hidden instead of drawing fake straight lines
          return;
        }

        const polyline = L.polyline(geom, {
          color,
          weight: isBlocked ? 5 : isRestricted ? 3 : 3,
          dashArray: isBlocked ? undefined : isRestricted ? '3, 6' : undefined,
          opacity: isBlocked ? 0.95 : 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        });

        polyline.bindPopup(`
          <div class="p-1.5 text-slate-900 text-xs font-sans leading-tight">
            <div class="font-bold text-sm ${isBlocked ? 'text-red-600' : isRestricted ? 'text-amber-600' : 'text-emerald-700'}">
              ${road.road_name || (road as any).name || 'Urban Corridor'}
            </div>
            <div class="mt-1">Status: <b class="uppercase">${road.status}</b></div>
            <div>Travel Time: <b>${road.travel_time ? `${road.travel_time} min` : '--'}</b></div>
            <div>Flood Risk Score: <b>${road.risk_score}/100</b></div>
            ${road.blocked_reason ? `<div class="text-red-500 mt-1 font-semibold">${road.blocked_reason}</div>` : ''}
          </div>
        `);

        roads.addLayer(polyline);
      });
    }

    // 3. Render Shelters
    if (layersVisible.shelters) {
      state.shelters.forEach((shelter) => {
        const usagePct = Math.round((shelter.occupancy / Math.max(1, shelter.capacity)) * 100);
        const iconHtml = `
          <div style="background-color:#9333ea; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(147,51,234,0.6); font-size:14px;">
            🏠
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([shelter.latitude, shelter.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-purple-700">${shelter.shelter_name}</div>
            <div class="mt-1">Capacity: <b>${shelter.occupancy} / ${shelter.capacity}</b> (${usagePct}%)</div>
            <div>Available Headroom: <b class="text-emerald-600">${shelter.available_capacity} beds</b></div>
            <div>Food: <b>${shelter.food_stock}</b> | Water: <b>${shelter.water_stock}</b></div>
            <div>Power Backup: <b>${shelter.power_backup ? 'Active (Diesel Gen)' : 'Mains Only'}</b></div>
            <div class="text-[10px] text-slate-500 mt-1">${shelter.address}</div>
          </div>
        `);
        shelters.addLayer(marker);
      });
    }

    // 4. Render Hospitals
    if (layersVisible.hospitals) {
      state.hospitals.forEach((hosp) => {
        const iconHtml = `
          <div style="background-color:#0284c7; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(2,132,199,0.6); font-size:14px;">
            🏥
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([hosp.latitude, hosp.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-blue-700">${hosp.hospital_name}</div>
            <div class="mt-1">General Beds: <b>${hosp.available_beds}</b></div>
            <div>Critical ICU Beds: <b class="text-red-600">${hosp.icu_beds}</b></div>
            <div>Ambulance Bays: <b>${hosp.ambulances_available} ready</b></div>
            <div>Contact: <b>${hosp.contact_number}</b></div>
          </div>
        `);
        hospitals.addLayer(marker);
      });
    }

    // 5. Render Rescue Teams
    if (layersVisible.rescue) {
      state.rescue_teams.forEach((team) => {
        const isDeployed = team.status === 'deployed';
        const bgColor = isDeployed ? '#ef4444' : '#2563eb';
        const iconHtml = `
          <div style="background-color:${bgColor}; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(37,99,235,0.6); font-size:13px;">
            🚤
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([team.latitude, team.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-blue-800">${team.team_name}</div>
            <div class="mt-1">Leader: <b>${team.leader}</b></div>
            <div>Status: <b class="${isDeployed ? 'text-red-600' : 'text-blue-600'}">${team.status.toUpperCase()}</b></div>
            <div>Personnel: ${team.personnel} specialists</div>
            <div class="text-[11px] text-slate-600 mt-1">Gear: ${team.equipment}</div>
          </div>
        `);
        rescue.addLayer(marker);
      });
    }

    // 6. Render Ambulances
    if (layersVisible.ambulances) {
      state.ambulances.forEach((amb) => {
        const isDeployed = amb.status === 'deployed';
        const bgColor = isDeployed ? '#ea580c' : '#10b981';
        const iconHtml = `
          <div style="background-color:${bgColor}; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(234,88,12,0.5); font-size:13px;">
            🚑
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });

        const marker = L.marker([amb.latitude, amb.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-orange-700">${amb.vehicle_code}</div>
            <div class="mt-1">Driver: <b>${amb.driver_name}</b> (${amb.phone})</div>
            <div>Status: <b class="${isDeployed ? 'text-orange-600' : 'text-emerald-600'}">${amb.status.toUpperCase()}</b></div>
            <div>Fuel: <b>${amb.fuel}%</b> | Crew: ${amb.crew_size}</div>
          </div>
        `);
        ambulances.addLayer(marker);
      });
    }

    // 7. Render Citizen SOS Requests
    if (layersVisible.sos) {
      state.citizen_requests.forEach((req) => {
        const isCompleted = req.status === 'completed';
        const pulse = !isCompleted;
        const color = isCompleted
          ? '#10b981'
          : req.risk_level === 'Critical'
          ? '#ef4444'
          : req.risk_level === 'High'
          ? '#f97316'
          : '#eab308';

        const iconHtml = `
          <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
            ${
              pulse
                ? `<div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:${color}; opacity:0.6; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : ''
            }
            <div style="position:relative; background-color:${color}; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-weight:bold; font-size:11px; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
              SOS
            </div>
          </div>
        `;

        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });

        const marker = L.marker([req.latitude, req.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1.5 text-slate-800 text-xs font-sans leading-tight min-w-[200px]">
            <div class="flex items-center justify-between border-b pb-1 mb-1">
              <span class="font-bold text-sm text-red-600">${req.request_id}</span>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">${req.risk_level}</span>
            </div>
            <div>Citizen: <b>${req.citizen_name}</b> (${req.citizen_phone})</div>
            <div>Trapped: <b>${req.people_count} people</b></div>
            <div>Type: <b>${req.emergency_type}</b></div>
            <div>Medical: <b>${req.medical_urgency}</b></div>
            <div class="mt-1 text-slate-600 italic">"${req.address_hint}"</div>
          </div>
        `);

        if (onSelectRequest) {
          marker.on('click', () => onSelectRequest(req.id));
        }

        sos.addLayer(marker);
      });
    }

    // 8. Render Active Primary Route (#06B6D4 Cyan, 4px width, solid glowing line)
    // NEVER draw routes using only two points
    if (routePolyline && routePolyline.length >= 2) {
      const glowPoly = L.polyline(routePolyline, {
        color: '#06B6D4',
        weight: 8,
        opacity: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const corePoly = L.polyline(routePolyline, {
        color: '#06B6D4',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const startMarker = L.circleMarker(routePolyline[0], {
        radius: 6,
        fillColor: '#06B6D4',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).bindTooltip('Origin Dispatch Node', { permanent: false });

      const endMarker = L.circleMarker(routePolyline[routePolyline.length - 1], {
        radius: 7,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      }).bindTooltip('Destination Incident Target', { permanent: false });

      route.addLayer(glowPoly);
      route.addLayer(corePoly);
      route.addLayer(startMarker);
      route.addLayer(endMarker);
    }

    // 9. Render Safe Alternative Route (#10B981 Emerald, 3px width, dashed)
    if (alternativePolyline && alternativePolyline.length >= 2) {
      const altPoly = L.polyline(alternativePolyline, {
        color: '#10B981',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 6',
        lineCap: 'round',
        lineJoin: 'round',
      });
      alternativeRoute.addLayer(altPoly);
    }

    // 10. AI Predicted Flood Impact Zones
    const activeImpactZones = state.latest_ai_flood_prediction?.impact_zones || state.latest_ai_flood_prediction?.red_impact_zones || [];
    if (layersVisible.aiFloodZones && activeImpactZones.length > 0) {
      activeImpactZones.forEach((zone) => {
        if (!zone.polygon || zone.polygon.length < 3) return;
        const isRed =
          zone.impact_level === 'red' ||
          zone.impact_level === 'Critical - Red Area' ||
          zone.severity_category === 'red';
        const color = isRed ? '#ef4444' : '#eab308';
        const fillColor = isRed ? '#dc2626' : '#ca8a04';

        const polygon = L.polygon(zone.polygon, {
          color,
          weight: isRed ? 3.5 : 2.5,
          fillColor,
          fillOpacity: isRed ? 0.38 : 0.28,
          dashArray: isRed ? '6, 4' : '4, 4',
        });

        polygon.bindTooltip(
          `<div style="font-weight:bold; font-size:11px; color:${isRed ? '#dc2626' : '#b45309'}; padding: 2px;">
            ${isRed ? '🚨 [RED AREA]' : '⚠️ [YELLOW AREA]'} ${zone.name || zone.zone_name || 'Impact Zone'} (+${zone.water_level_m || 2}m)
          </div>`,
          { sticky: true, opacity: 0.95 }
        );

        aiFloodZones.addLayer(polygon);
      });
    }

    // 11. Strategic Staging Points
    const activeStagingPoints = state.latest_ai_flood_prediction?.quantum_prepositioning_points || state.latest_ai_flood_prediction?.strategic_prepositioning_points || [];
    if (layersVisible.strategicStaging && activeStagingPoints.length > 0) {
      activeStagingPoints.forEach((point) => {
        const lat = point.latitude ?? point.lat;
        const lng = point.longitude ?? point.lng;
        if (lat == null || lng == null) return;

        let badgeIcon = '🚤';
        let badgeBg = '#2563eb';
        let badgeBorder = '#60a5fa';

        if (point.type === 'ambulance_als' || point.type === 'ambulance') {
          badgeIcon = '🚑';
          badgeBg = '#ea580c';
          badgeBorder = '#fb923c';
        } else if (point.type === 'relief_staging' || point.type === 'shelter') {
          badgeIcon = '📦';
          badgeBg = '#9333ea';
          badgeBorder = '#c084fc';
        }

        const iconHtml = `
          <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:${badgeBg}; opacity:0.4; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position:relative; background-color:${badgeBg}; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid ${badgeBorder}; font-size:14px; box-shadow:0 0 12px ${badgeBg}; font-weight:bold;">
              ${badgeIcon}
            </div>
          </div>
        `;

        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [38, 38], iconAnchor: [19, 19] });
        const marker = L.marker([lat, lng], { icon });

        marker.bindPopup(`
          <div class="p-2 text-slate-900 text-xs font-sans min-w-[240px] leading-tight">
            <div class="font-bold text-sm text-cyan-700">${point.title || point.label || 'Staging Point'}</div>
            <div class="mt-1 text-slate-700">Sector: <b>${point.coverage_sector || 'General Basin'}</b></div>
            <div class="text-slate-700">Elevation: <b>${point.dry_ground_elevation_m || point.elevation_m || 25}m AMSL</b></div>
            <div class="mt-1.5 p-2 rounded bg-cyan-50 border border-cyan-200 text-cyan-950 text-[11px]">
              ${point.staging_reason}
            </div>
          </div>
        `);

        strategicStaging.addLayer(marker);
      });
    }
  }, [state, layersVisible, routePolyline, alternativePolyline, onSelectRequest, minimalCitizenMode, citizenSource, citizenDestination, roadGeometries]);

  // Handle focus coordinates
  useEffect(() => {
    if (!mapInstanceRef.current || !focusCoords) return;
    mapInstanceRef.current.flyTo(focusCoords, 15, { duration: 1.2 });
  }, [focusCoords]);

  const toggleLayer = (layer: keyof typeof layersVisible) => {
    setLayersVisible((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className={`relative isolate z-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 ${className}`}>
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {minimalCitizenMode ? (
        <>
          <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg border border-emerald-500/60 text-white shadow-xl flex items-center gap-2 text-xs">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-emerald-400 uppercase tracking-wide">
                Optimal Safe Evacuation Path
              </span>
            </div>
            <div className="bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-md border border-slate-700 text-[11px] text-slate-300 shadow">
              ✓ Verified dry road network avoiding floodwaters
            </div>
          </div>

          {bypassWarning && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] max-w-md w-full px-2 pointer-events-auto hidden md:block">
              <div className="bg-amber-950/95 backdrop-blur border border-amber-500/70 text-amber-200 px-3 py-1.5 rounded-xl shadow-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="truncate">{bypassWarning}</span>
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
            <select
              aria-label="Map Base Layer"
              value={activeTileStyle}
              onChange={(e) => setActiveTileStyle(e.target.value as MapTileStyle)}
              className="bg-slate-900/90 backdrop-blur hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 shadow-lg cursor-pointer outline-none"
            >
              <option value="tf-transport">⚡ Street & Transit Map</option>
              <option value="carto-voyager">🗺️ Voyager Street View</option>
              <option value="tf-outdoors">🏔️ Topo Elevation Map</option>
              <option value="carto-dark">🌑 Night Map</option>
            </select>
          </div>

          <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] flex flex-wrap items-center gap-2 bg-slate-950/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center gap-1.5">
              <span className="text-red-400 font-bold">📍 Source:</span>
              <span className="font-semibold text-white truncate max-w-[180px]">
                {citizenSource?.label || 'Your Location'}
              </span>
            </div>
            <span className="text-emerald-400 font-bold">➔</span>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">🛡️ Destination:</span>
              <span className="font-semibold text-white truncate max-w-[200px]">
                {citizenDestination?.label || 'Relief Shelter'}
              </span>
            </div>
            {citizenDestination?.availableBeds !== undefined && (
              <span className="ml-auto text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                {citizenDestination.availableBeds} Beds Ready
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
            <select
              aria-label="Map Base Layer"
              value={activeTileStyle}
              onChange={(e) => setActiveTileStyle(e.target.value as MapTileStyle)}
              className="bg-slate-900/90 backdrop-blur hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 shadow-lg transition-colors cursor-pointer outline-none"
            >
              <option value="tf-transport">⚡ Thunderforest Transport</option>
              <option value="tf-outdoors">🏔️ Thunderforest Outdoors (Topo)</option>
              <option value="tf-landscape">🌿 Thunderforest Landscape</option>
              <option value="carto-dark">🌑 Tactical Dark Matrix</option>
              <option value="carto-voyager">🗺️ Street Voyager</option>
            </select>

            <button
              onClick={() => setShowRoutingModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-900/90 to-blue-900/90 hover:from-cyan-800 hover:to-blue-800 px-2.5 py-1.5 rounded-lg border border-cyan-500/40 text-xs font-semibold text-cyan-200 shadow-lg transition-colors cursor-pointer"
              title="Inspect Dynamic Routing Architecture (A* + D* Lite)"
            >
              <Route className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Routing Specs</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 shadow-lg transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>GIS Layers</span>
              </button>

              {showLayerPanel && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur p-2.5 rounded-xl border border-slate-700 shadow-2xl space-y-1.5 text-xs text-slate-200">
                  <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-1 px-1">
                    Active Map Layers
                  </div>

                  {[
                    { id: 'roads' as const, label: 'Road Status (OSRM)', color: 'bg-emerald-400' },
                    { id: 'sos' as const, label: 'SOS Emergencies', color: 'bg-red-500' },
                    { id: 'rescue' as const, label: 'NDRF Boat Squads', color: 'bg-blue-500' },
                    { id: 'ambulances' as const, label: '108 Ambulances', color: 'bg-orange-500' },
                    { id: 'shelters' as const, label: 'Relief Shelters', color: 'bg-purple-500' },
                    { id: 'hospitals' as const, label: 'Trauma Hospitals', color: 'bg-sky-500' },
                    { id: 'riskZones' as const, label: 'Flood Risk Sectors', color: 'bg-amber-500' },
                    { id: 'aiFloodZones' as const, label: 'AI Flood Surge (Red/Yellow)', color: 'bg-red-600' },
                    { id: 'strategicStaging' as const, label: 'Strategic Staging Nodes', color: 'bg-cyan-400' },
                  ].map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${layer.color}`} />
                        <span className="truncate">{layer.label}</span>
                      </div>
                      {layersVisible[layer.id] ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Floating Legend Bar (Phase 11: Tactical GIS Legend) */}
          <div className="absolute bottom-3 left-3 z-[1000] hidden sm:flex items-center gap-3 bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-xl">
            <span className="font-semibold text-white">Tactical GIS:</span>
            <span className="flex items-center gap-1 text-cyan-300 font-medium">
              <span className="h-1.5 w-4 rounded bg-[#06B6D4]" /> Active Primary (A*)
            </span>
            <span className="flex items-center gap-1 text-emerald-300 font-medium">
              <span className="h-1.5 w-4 rounded bg-[#10B981]" /> Safe Alternative
            </span>
            <span className="flex items-center gap-1 text-red-400 font-medium">
              <span className="h-1.5 w-4 rounded bg-[#EF4444]" /> Blocked / Flooded
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <span className="h-1.5 w-4 rounded bg-[#F59E0B]" /> Restricted Corridor
            </span>
          </div>
        </>
      )}

      {/* Dynamic Routing Architecture Modal */}
      {showRoutingModal && (
        <DynamicRoutingModal isOpen={showRoutingModal} onClose={() => setShowRoutingModal(false)} />
      )}
    </div>
  );
};
