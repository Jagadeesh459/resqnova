import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Maximize2,
  Minimize2,
  Navigation,
  MapPin,
  Crosshair,
  Radio,
} from 'lucide-react';
import { DynamicRoutingModal } from './DynamicRoutingModal';
import { geoJsonToLeafletCoordinates, calculateBearing, haversineDistance } from '../lib/routing/utils';

export type TacticalMapMode =
  | 'dashboard'
  | 'citizen'
  | 'ambulance'
  | 'rescue'
  | 'routing-demo'
  | 'routing-test'
  | 'planner';

export type MapTileStyle = 'tf-transport' | 'tf-outdoors' | 'tf-landscape' | 'osm-standard' | 'osm-hot';

export interface TacticalMapProps {
  height?: string;
  mode?: TacticalMapMode;
  focusCoords?: [number, number];
  routePolyline?: [number, number][];
  alternativePolyline?: [number, number][];
  onSelectRequest?: (id: string) => void;
  className?: string;
  showDynamicCorridorsDefault?: boolean;
  minimalCitizenMode?: boolean;
  sosActive?: boolean;
  citizenSource?: { lat: number; lng: number; label: string; address?: string; isSosActive?: boolean };
  citizenDestination?: { lat: number; lng: number; label: string; availableBeds?: number; address?: string };
  bypassWarning?: string;

  // Interactive Routing & Snapping props
  startPoint?: { lat: number; lng: number; label?: string };
  endPoint?: { lat: number; lng: number; label?: string };
  onMapClick?: (lat: number, lng: number, e: L.LeafletMouseEvent) => void;
  selectedNodeId?: string;
  selectedNodeEdges?: any[];
  nearestSnap?: {
    clickLat: number;
    clickLng: number;
    nodeLat: number;
    nodeLng: number;
    nodeId: string;
    distanceMeters: number;
  } | null;

  // Custom Road Overrides (e.g. from graph inspector)
  customRoads?: any[];
  blockedRoadIds?: Set<string>;

  // Route Simulation / Animated Navigation props
  isSimulatingRoute?: boolean;
  simulationSpeed?: number;
  vehicleType?: 'citizen' | 'ambulance' | 'rescue' | 'default';
  onSimulationProgress?: (progress: number) => void;
}

// In-memory cache for OSRM / GeoJSON road geometry
const roadGeometryCache = new Map<string, [number, number][]>();

async function getRoadGeometry(
  road: { id?: string; road_id?: string; start_lat?: number; start_lng?: number; end_lat?: number; end_lng?: number; coordinates?: any },
  signal: AbortSignal
): Promise<{ id: string; geometry: [number, number][] } | null> {
  const roadId = road.road_id || road.id || '';
  if (!roadId) return null;

  // 1. If road already has valid GeoJSON coordinates from Supabase, use them directly (0 latency!)
  if (road.coordinates) {
    const coords = geoJsonToLeafletCoordinates(road.coordinates);
    if (coords && coords.length >= 2) {
      return { id: roadId, geometry: coords };
    }
  }

  if (road.start_lat == null || road.start_lng == null || road.end_lat == null || road.end_lng == null) {
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

    const geometry: [number, number][] = coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    roadGeometryCache.set(key, geometry);
    return { id: roadId, geometry };
  } catch {
    return null;
  }
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  height = '480px',
  mode = 'dashboard',
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
  startPoint,
  endPoint,
  onMapClick,
  selectedNodeId,
  selectedNodeEdges,
  nearestSnap,
  customRoads,
  blockedRoadIds,
  isSimulatingRoute = false,
  simulationSpeed = 1,
  vehicleType = 'default',
  onSimulationProgress,
}) => {
  const { state } = useResQNova();
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTileStyle, setActiveTileStyle] = useState<MapTileStyle>('tf-transport');
  const [roadGeometries, setRoadGeometries] = useState<Record<string, [number, number][]>>({});
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showRoutingModal, setShowRoutingModal] = useState(false);

  const thunderforestApiKey =
    (typeof import.meta !== 'undefined' &&
      ((import.meta as any).env?.NEXT_PUBLIC_THUNDERFOREST_API_KEY || (import.meta as any).env?.VITE_THUNDERFOREST_API_KEY)) ||
    '7d071cff43f04a768bc32368bce332cd';

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
    endpoints: L.LayerGroup;
    snapping: L.LayerGroup;
    vehicles: L.LayerGroup;
  } | null>(null);


  // Initialize Layer Visibility according to portal mode
  const [layersVisible, setLayersVisible] = useState(() => {
    switch (mode) {
      case 'citizen':
        return {
          sos: true,
          rescue: false,
          ambulances: false,
          shelters: true,
          hospitals: true,
          roads: true,
          riskZones: true,
          aiFloodZones: true,
          strategicStaging: false,
          dynamicCorridors: false,
        };
      case 'ambulance':
        return {
          sos: true,
          rescue: false,
          ambulances: true,
          shelters: false,
          hospitals: true,
          roads: true,
          riskZones: true,
          aiFloodZones: false,
          strategicStaging: false,
          dynamicCorridors: true,
        };
      case 'rescue':
        return {
          sos: true,
          rescue: true,
          ambulances: false,
          shelters: true,
          hospitals: false,
          roads: true,
          riskZones: true,
          aiFloodZones: true,
          strategicStaging: true,
          dynamicCorridors: true,
        };
      case 'routing-demo':
      case 'routing-test':
        return {
          sos: false,
          rescue: false,
          ambulances: false,
          shelters: false,
          hospitals: false,
          roads: true,
          riskZones: false,
          aiFloodZones: false,
          strategicStaging: false,
          dynamicCorridors: false,
        };
      case 'dashboard':
      case 'planner':
      default:
        return {
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
        };
    }
  });

  // Base Tile Layer Creator (Removed CARTO, Standardized to Thunderforest + OSM)
  const createBaseLayer = useCallback((style: MapTileStyle): L.TileLayer => {
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

    if (style === 'osm-hot') {
      return L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team',
        maxZoom: 19,
      });
    }

    // Default: OpenStreetMap Standard
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });
  }, [thunderforestApiKey]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!rootContainerRef.current) return;

    if (!document.fullscreenElement) {
      rootContainerRef.current.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen((prev) => !prev);
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Switch Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const newLayer = createBaseLayer(activeTileStyle);
    newLayer.addTo(map);
    baseTileLayerRef.current = newLayer;
  }, [activeTileStyle, createBaseLayer]);

  // Extract / Cache road geometries
  useEffect(() => {
    const roadsToProcess = customRoads || state?.roads || [];
    if (roadsToProcess.length === 0) return;

    const controller = new AbortController();
    let isMounted = true;

    Promise.all(
      roadsToProcess.map((road) => getRoadGeometry(road, controller.signal).catch(() => null))
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
  }, [state?.roads, customRoads]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.5062, 80.648], // Central Vijayawada
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialBaseLayer = createBaseLayer('tf-transport');
    initialBaseLayer.addTo(map);
    baseTileLayerRef.current = initialBaseLayer;

    // Layer groups
    layerGroupsRef.current = {
      sos: L.layerGroup().addTo(map),
      rescue: L.layerGroup().addTo(map),
      ambulances: L.layerGroup().addTo(map),
      shelters: L.layerGroup().addTo(map),
      hospitals: L.layerGroup().addTo(map),
      roads: L.layerGroup().addTo(map),
      riskZones: L.layerGroup().addTo(map),
      aiFloodZones: L.layerGroup().addTo(map),
      strategicStaging: L.layerGroup().addTo(map),
      route: L.layerGroup().addTo(map),
      alternativeRoute: L.layerGroup().addTo(map),
      dynamicCorridors: L.layerGroup().addTo(map),
      endpoints: L.layerGroup().addTo(map),
      snapping: L.layerGroup().addTo(map),
      vehicles: L.layerGroup().addTo(map),
    };

    // Attach click listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)), e);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [createBaseLayer, onMapClick]);

  // Render Dynamic GIS Layers
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
      endpoints,
      snapping,
    } = layerGroupsRef.current;

    // Clear all layers
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
    endpoints.clearLayers();
    snapping.clearLayers();

    const activeRoadList = customRoads || state.roads || [];

    // 1. Render Roads with High-Resolution Curvature Geometry
    if (layersVisible.roads) {
      activeRoadList.forEach((road) => {
        const roadId = road.road_id || road.id || '';
        const isBlocked =
          (blockedRoadIds && blockedRoadIds.has(roadId)) ||
          road.status === 'blocked' ||
          road.status === 'flooded';
        const isRestricted = (road.status as string) === 'restricted';

        // Retrieve full coordinates from cache or direct GeoJSON
        let geom = roadGeometries[roadId] || roadGeometries[road.id];
        if (!geom && road.coordinates) {
          geom = geoJsonToLeafletCoordinates(road.coordinates);
        }

        if (!geom || geom.length < 2) return;

        if (isBlocked) {
          // Blocked Road: Glowing Red Border + Thick Red Dashed Line
          const glowLine = L.polyline(geom, {
            color: '#dc2626',
            weight: 8,
            opacity: 0.4,
            lineCap: 'round',
          });

          const dashedLine = L.polyline(geom, {
            color: '#ef4444',
            weight: 4,
            opacity: 0.95,
            dashArray: '6, 6',
            lineCap: 'round',
          });

          dashedLine.bindPopup(`
            <div class="p-2 text-slate-900 text-xs font-sans min-w-[200px]">
              <div class="font-bold text-sm text-red-600">🚫 ROAD BLOCKED / INUNDATED</div>
              <div class="font-bold mt-1 text-slate-800">${road.road_name || roadId}</div>
              <div class="text-red-600 text-[11px] font-semibold mt-1">${road.blocked_reason || 'Submerged by urban floodwaters'}</div>
              <div class="mt-1 text-[10px] text-slate-500 font-mono">Excluded from A* & D* Lite graph</div>
            </div>
          `);

          roads.addLayer(glowLine);
          roads.addLayer(dashedLine);
        } else if (isRestricted) {
          // Restricted Road: Yellow Dashed
          const yellowLine = L.polyline(geom, {
            color: '#f59e0b',
            weight: 3.5,
            opacity: 0.9,
            dashArray: '4, 4',
            lineCap: 'round',
          });
          roads.addLayer(yellowLine);
        } else if (mode === 'routing-demo' || mode === 'routing-test' || mode === 'dashboard') {
          // Open Road: Subtle Slate/Cyan
          const openLine = L.polyline(geom, {
            color: '#38bdf8',
            weight: 2,
            opacity: 0.4,
            lineCap: 'round',
          });
          roads.addLayer(openLine);
        }
      });
    }

    // 2. Render Selected Node & Outgoing Edges Highlight (Graph Inspector mode)
    if (selectedNodeId && selectedNodeEdges) {
      selectedNodeEdges.forEach((edge) => {
        if (edge.geometry && edge.geometry.length >= 2) {
          const edgePoly = L.polyline(edge.geometry, {
            color: '#06b6d4',
            weight: 5,
            opacity: 0.9,
            lineCap: 'round',
          });
          roads.addLayer(edgePoly);
        }
      });
    }

    // 3. Render Nearest Snap Indicator (Click ➔ Snapped Node)
    if (nearestSnap) {
      const snapClickIcon = L.divIcon({
        html: `
          <div style="background-color:#f59e0b; color:#000; font-weight:900; font-size:10px; width:22px; height:22px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px #f59e0b;">
            Tap
          </div>
        `,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const clickMarker = L.marker([nearestSnap.clickLat, nearestSnap.clickLng], { icon: snapClickIcon });
      const snapLine = L.polyline(
        [
          [nearestSnap.clickLat, nearestSnap.clickLng],
          [nearestSnap.nodeLat, nearestSnap.nodeLng],
        ],
        {
          color: '#f59e0b',
          weight: 3,
          dashArray: '4, 4',
          opacity: 0.9,
        }
      );

      snapping.addLayer(clickMarker);
      snapping.addLayer(snapLine);
    }

    // 4. Render Active Route Polyline (Google Maps-Style Glowing Neon Blue)
    if (routePolyline && routePolyline.length >= 2) {
      const glowPoly = L.polyline(routePolyline, {
        color: '#06b6d4',
        weight: 9,
        opacity: 0.4,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const corePoly = L.polyline(routePolyline, {
        color: '#38bdf8',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      route.addLayer(glowPoly);
      route.addLayer(corePoly);
    }

    // 5. Render Alternative Safe Route (Emerald Green Dashed)
    if (alternativePolyline && alternativePolyline.length >= 2) {
      const altPoly = L.polyline(alternativePolyline, {
        color: '#10b981',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 6',
        lineCap: 'round',
        lineJoin: 'round',
      });
      alternativeRoute.addLayer(altPoly);
    }

    // 6. Render Start Point (Pin A) & Destination (Pin B)
    if (startPoint) {
      const startIcon = L.divIcon({
        html: `
          <div style="background:linear-gradient(135deg,#10b981,#059669); color:#fff; font-weight:900; font-size:11px; width:28px; height:28px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(16,185,129,0.8);">
            A
          </div>
        `,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const sMarker = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon });
      sMarker.bindPopup(`<b>ORIGIN (A)</b><br/>${startPoint.label || 'Start Point'}`);
      endpoints.addLayer(sMarker);
    }

    if (endPoint) {
      const destIcon = L.divIcon({
        html: `
          <div style="background:linear-gradient(135deg,#ef4444,#dc2626); color:#fff; font-weight:900; font-size:11px; width:28px; height:28px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 16px rgba(239,68,68,0.8);">
            B
          </div>
        `,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const dMarker = L.marker([endPoint.lat, endPoint.lng], { icon: destIcon });
      dMarker.bindPopup(`<b>DESTINATION (B)</b><br/>${endPoint.label || 'Destination Target'}`);
      endpoints.addLayer(dMarker);
    }

    // 7. Citizen Distress Mode Markers
    if (citizenSource) {
      const sourceIcon = L.divIcon({
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:#ef4444; opacity:0.7; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative; background-color:#dc2626; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-weight:bold; font-size:14px; box-shadow:0 2px 8px rgba(220,38,38,0.7);">
              📍
            </div>
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const sourceMarker = L.marker([citizenSource.lat, citizenSource.lng], { icon: sourceIcon });
      sourceMarker.bindPopup(`
        <div class="p-1 text-slate-900 text-xs font-sans">
          <div class="font-bold text-red-600">📍 YOUR SOS LOCATION</div>
          <div class="font-semibold text-slate-800">${citizenSource.label}</div>
        </div>
      `);
      sos.addLayer(sourceMarker);
    }

    if (citizenDestination) {
      const destIcon = L.divIcon({
        html: `
          <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:#10b981; opacity:0.5; animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:relative; background-color:#059669; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-weight:bold; font-size:16px; box-shadow:0 2px 8px rgba(16,185,129,0.7);">
              🛡️
            </div>
          </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const destMarker = L.marker([citizenDestination.lat, citizenDestination.lng], { icon: destIcon });
      destMarker.bindPopup(`
        <div class="p-1 text-slate-900 text-xs font-sans">
          <div class="font-bold text-emerald-700">🛡️ ASSIGNED RELIEF SHELTER</div>
          <div class="font-semibold text-slate-800">${citizenDestination.label}</div>
          <div class="mt-1 font-bold text-emerald-800">${citizenDestination.availableBeds ?? 100} Beds Available</div>
        </div>
      `);
      shelters.addLayer(destMarker);
    }

    // 8. Operational Entities (Shelters, Hospitals, Ambulances, Rescue Teams, Citizen SOS)
    if (layersVisible.shelters && state.shelters) {
      state.shelters.forEach((shelter) => {
        const usagePct = Math.round((shelter.occupancy / Math.max(1, shelter.capacity)) * 100);
        const iconHtml = `
          <div style="background-color:#9333ea; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(147,51,234,0.6); font-size:13px;">
            🏠
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([shelter.latitude, shelter.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-purple-700">${shelter.shelter_name}</div>
            <div class="mt-1">Capacity: <b>${shelter.occupancy} / ${shelter.capacity}</b> (${usagePct}%)</div>
            <div>Available Headroom: <b class="text-emerald-600">${shelter.available_capacity} beds</b></div>
            <div>Food: <b>${shelter.food_stock}</b> | Water: <b>${shelter.water_stock}</b></div>
            <div class="text-[10px] text-slate-500 mt-1">${shelter.address}</div>
          </div>
        `);
        shelters.addLayer(marker);
      });
    }

    if (layersVisible.hospitals && state.hospitals) {
      state.hospitals.forEach((hosp) => {
        const iconHtml = `
          <div style="background-color:#0284c7; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(2,132,199,0.6); font-size:13px;">
            🏥
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([hosp.latitude, hosp.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-blue-700">${hosp.hospital_name}</div>
            <div class="mt-1">General Beds: <b>${hosp.available_beds}</b></div>
            <div>ICU Beds: <b class="text-red-600">${hosp.icu_beds}</b></div>
            <div>Ambulances: <b>${hosp.ambulances_available} ready</b></div>
            <div>Contact: <b>${hosp.contact_number}</b></div>
          </div>
        `);
        hospitals.addLayer(marker);
      });
    }

    if (layersVisible.rescue && state.rescue_teams) {
      state.rescue_teams.forEach((team) => {
        const isDeployed = team.status === 'deployed';
        const bgColor = isDeployed ? '#ef4444' : '#10b981';
        const iconHtml = `
          <div style="background-color:${bgColor}; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(16,185,129,0.6); font-size:13px;">
            🚤
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([team.latitude, team.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-emerald-800">${team.team_name}</div>
            <div class="mt-1">Leader: <b>${team.leader}</b></div>
            <div>Status: <b class="uppercase">${team.status}</b></div>
            <div>Personnel: ${team.personnel} specialists</div>
          </div>
        `);
        rescue.addLayer(marker);
      });
    }

    if (layersVisible.ambulances && state.ambulances) {
      state.ambulances.forEach((amb) => {
        const isDeployed = amb.status === 'deployed';
        const bgColor = isDeployed ? '#ea580c' : '#06b6d4';
        const iconHtml = `
          <div style="background-color:${bgColor}; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 8px rgba(6,182,212,0.6); font-size:13px;">
            🚑
          </div>
        `;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
        const marker = L.marker([amb.latitude, amb.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs font-sans leading-tight">
            <div class="font-bold text-sm text-cyan-700">${amb.vehicle_code}</div>
            <div class="mt-1">Driver: <b>${amb.driver_name}</b></div>
            <div>Status: <b class="uppercase">${amb.status}</b></div>
            <div>Fuel: <b>${amb.fuel}%</b></div>
          </div>
        `);
        ambulances.addLayer(marker);
      });
    }

    if (layersVisible.sos && state.citizen_requests) {
      state.citizen_requests.forEach((req) => {
        const isCompleted = req.status === 'completed';
        const color = isCompleted
          ? '#10b981'
          : req.risk_level === 'Critical'
          ? '#ef4444'
          : '#f97316';

        const iconHtml = `
          <div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">
            ${!isCompleted ? `<div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:${color}; opacity:0.6; animation:ping 1.5s infinite;"></div>` : ''}
            <div style="position:relative; background-color:${color}; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-weight:bold; font-size:10px; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
              SOS
            </div>
          </div>
        `;

        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [30, 30], iconAnchor: [15, 15] });
        const marker = L.marker([req.latitude, req.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1.5 text-slate-800 text-xs font-sans leading-tight min-w-[190px]">
            <div class="font-bold text-sm text-orange-600">${req.request_id}</div>
            <div>Citizen: <b>${req.citizen_name}</b></div>
            <div>Trapped: <b>${req.people_count} people</b></div>
            <div class="mt-1 text-slate-600 italic">"${req.address_hint}"</div>
          </div>
        `);

        if (onSelectRequest) {
          marker.on('click', () => onSelectRequest(req.id));
        }

        sos.addLayer(marker);
      });
    }

    // 9. Risk Zones (Flood Polygons)
    if (layersVisible.riskZones && state.risk_zones) {
      state.risk_zones.forEach((zone) => {
        const color = zone.risk_level === 'Critical' ? '#ef4444' : '#f97316';
        const polygon = L.polygon(zone.polygon, {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.25,
          dashArray: '4, 4',
        });
        polygon.bindPopup(`<b>${zone.zone_name}</b><br/>Risk: ${zone.risk_level} (+${zone.water_level_m}m)`);
        riskZones.addLayer(polygon);
      });
    }
  }, [
    state,
    layersVisible,
    routePolyline,
    alternativePolyline,
    onSelectRequest,
    mode,
    citizenSource,
    citizenDestination,
    roadGeometries,
    startPoint,
    endPoint,
    selectedNodeId,
    selectedNodeEdges,
    nearestSnap,
    customRoads,
    blockedRoadIds,
  ]);

  // Route Simulation / Animated Vehicle Movement
  useEffect(() => {
    if (!layerGroupsRef.current) return;
    const { vehicles } = layerGroupsRef.current;
    vehicles.clearLayers();

    if (!isSimulatingRoute || !routePolyline || routePolyline.length < 2) {
      return;
    }

    // Precalculate cumulative distances along polyline
    const cumDists: number[] = [0];
    for (let i = 0; i < routePolyline.length - 1; i++) {
      const segDist = haversineDistance(
        routePolyline[i][0],
        routePolyline[i][1],
        routePolyline[i + 1][0],
        routePolyline[i + 1][1]
      );
      cumDists.push(cumDists[cumDists.length - 1] + Math.max(0.1, segDist));
    }
    const totalDist = cumDists[cumDists.length - 1];
    if (totalDist <= 0) return;

    // Determine vehicle badge design based on type
    const getVehicleHtml = (heading: number) => {
      let icon = '🚙';
      let color = '#0ea5e9';
      let shadowColor = '#38bdf8';
      let pulseColor = 'rgba(14, 165, 233, 0.5)';

      if (vehicleType === 'ambulance') {
        icon = '🚑';
        color = '#dc2626';
        shadowColor = '#ef4444';
        pulseColor = 'rgba(239, 68, 68, 0.6)';
      } else if (vehicleType === 'rescue') {
        icon = '🚤';
        color = '#059669';
        shadowColor = '#10b981';
        pulseColor = 'rgba(16, 185, 129, 0.6)';
      } else if (vehicleType === 'citizen') {
        icon = '🚗';
        color = '#2563eb';
        shadowColor = '#60a5fa';
        pulseColor = 'rgba(37, 99, 235, 0.6)';
      }

      return `
        <div style="position:relative; width:48px; height:48px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:${pulseColor}; animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="transform: rotate(${heading}deg); transition: transform 0.08s linear; display:flex; align-items:center; justify-content:center; z-index:10;">
            <div style="background:${color}; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 16px ${shadowColor}; font-size:16px;">
              ${icon}
            </div>
          </div>
        </div>
      `;
    };

    const initialHeading = calculateBearing(
      routePolyline[0][0],
      routePolyline[0][1],
      routePolyline[1][0],
      routePolyline[1][1]
    );

    const vehicleMarker = L.marker([routePolyline[0][0], routePolyline[0][1]], {
      icon: L.divIcon({
        html: getVehicleHtml(initialHeading),
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      }),
      zIndexOffset: 1000,
    });

    vehicles.addLayer(vehicleMarker);

    // Duration scales with route length (min 6s, max 25s at 1x speed)
    const baseDuration = Math.max(6000, Math.min(25000, totalDist * 4));
    const durationMs = baseDuration / Math.max(0.1, simulationSpeed);
    const startTime = performance.now();
    let animId: number;
    let lastProgressReported = -1;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = (elapsed % durationMs) / durationMs;

      // Distance traveled so far along polyline
      const currentDist = progress * totalDist;

      // Find segment
      let segIdx = 0;
      for (let i = 0; i < cumDists.length - 1; i++) {
        if (currentDist >= cumDists[i] && currentDist <= cumDists[i + 1]) {
          segIdx = i;
          break;
        }
      }

      const p1 = routePolyline[segIdx];
      const p2 = routePolyline[Math.min(segIdx + 1, routePolyline.length - 1)];
      const segStartDist = cumDists[segIdx];
      const segLength = cumDists[segIdx + 1] - segStartDist;
      const alpha = segLength > 0 ? (currentDist - segStartDist) / segLength : 0;

      const currentLat = p1[0] + alpha * (p2[0] - p1[0]);
      const currentLng = p1[1] + alpha * (p2[1] - p1[1]);
      const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

      vehicleMarker.setLatLng([currentLat, currentLng]);
      vehicleMarker.setIcon(
        L.divIcon({
          html: getVehicleHtml(heading),
          className: '',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        })
      );

      // Report progress periodically
      const progressPercent = Math.round(progress * 100);
      if (progressPercent !== lastProgressReported) {
        lastProgressReported = progressPercent;
        if (onSimulationProgress) {
          onSimulationProgress(progress);
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      vehicles.clearLayers();
    };
  }, [isSimulatingRoute, simulationSpeed, vehicleType, routePolyline, onSimulationProgress]);

  // Handle focus coordinates
  useEffect(() => {
    if (!mapInstanceRef.current || !focusCoords) return;
    mapInstanceRef.current.flyTo(focusCoords, 15, { duration: 1.0 });
  }, [focusCoords]);

  const toggleLayer = (layer: keyof typeof layersVisible) => {
    setLayersVisible((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };


  return (
    <div
      ref={rootContainerRef}
      className={`relative isolate z-0 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 ${
        isFullscreen ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none border-0' : ''
      } ${className}`}
    >
      <div
        ref={mapContainerRef}
        style={{ height: isFullscreen ? '100vh' : height, width: '100%' }}
      />

      {/* Top-Right Control Bar (Tile Selector, Fullscreen, Routing Modal, Layer Toggles) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-auto">
        {/* Base Tile Layer Selector */}
        <select
          aria-label="Map Base Layer"
          value={activeTileStyle}
          onChange={(e) => setActiveTileStyle(e.target.value as MapTileStyle)}
          className="bg-slate-900/90 backdrop-blur hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 shadow-lg cursor-pointer outline-none"
        >
          <option value="tf-transport">⚡ Thunderforest Transport</option>
          <option value="tf-outdoors">🏔️ Thunderforest Outdoors (Topo)</option>
          <option value="tf-landscape">🌿 Thunderforest Landscape</option>
          <option value="osm-standard">🗺️ OpenStreetMap Standard</option>
          <option value="osm-hot">🚨 Humanitarian OSM</option>
        </select>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center h-8 w-8 bg-slate-900/90 backdrop-blur hover:bg-slate-800 rounded-lg border border-slate-700 text-slate-200 shadow-lg transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4 text-cyan-400" /> : <Maximize2 className="h-4 w-4 text-slate-300" />}
        </button>

        {mode !== 'routing-demo' && mode !== 'routing-test' && (
          <>
            <button
              onClick={() => setShowRoutingModal(true)}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-cyan-900/90 to-blue-900/90 hover:from-cyan-800 hover:to-blue-800 px-2.5 py-1.5 rounded-lg border border-cyan-500/40 text-xs font-semibold text-cyan-200 shadow-lg transition-colors cursor-pointer"
              title="Inspect Dynamic Routing Architecture"
            >
              <Route className="h-3.5 w-3.5 text-cyan-400" />
              <span>Routing Specs</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLayerPanel(!showLayerPanel)}
                className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-200 shadow-lg transition-colors cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-blue-400" />
                <span>Layers</span>
              </button>

              {showLayerPanel && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur p-2.5 rounded-xl border border-slate-700 shadow-2xl space-y-1.5 text-xs text-slate-200">
                  <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-1 px-1">
                    Active GIS Layers
                  </div>

                  {[
                    { id: 'roads' as const, label: 'Road Curvature (OSM)', color: 'bg-emerald-400' },
                    { id: 'sos' as const, label: 'Citizen SOS', color: 'bg-orange-500' },
                    { id: 'rescue' as const, label: 'NDRF Boat Squads', color: 'bg-emerald-500' },
                    { id: 'ambulances' as const, label: '108 Ambulances', color: 'bg-cyan-500' },
                    { id: 'shelters' as const, label: 'Relief Shelters', color: 'bg-purple-500' },
                    { id: 'hospitals' as const, label: 'Trauma Hospitals', color: 'bg-blue-500' },
                    { id: 'riskZones' as const, label: 'Flood Risk Sectors', color: 'bg-red-500' },
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
          </>
        )}
      </div>

      {/* Floating Legend / Status Badge */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-3 bg-slate-950/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-xl pointer-events-auto">
        <span className="font-semibold text-white">Vijayawada GIS:</span>
        <span className="flex items-center gap-1 text-cyan-300 font-medium">
          <span className="h-1.5 w-4 rounded bg-[#38bdf8]" /> Primary Route (A*)
        </span>
        <span className="flex items-center gap-1 text-emerald-300 font-medium">
          <span className="h-1.5 w-4 rounded bg-[#10b981]" /> Safe Alternative
        </span>
        <span className="flex items-center gap-1 text-red-400 font-medium">
          <span className="h-1.5 w-4 rounded border border-red-500 bg-red-500/40 border-dashed" /> Blocked / Flooded
        </span>
      </div>

      {/* Dynamic Routing Architecture Modal */}
      {showRoutingModal && (
        <DynamicRoutingModal isOpen={showRoutingModal} onClose={() => setShowRoutingModal(false)} />
      )}
    </div>
  );
};
