import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useResQNova } from '../context/ResQNovaContext';
import { buildGraph, findShortestPath, Graph, RouteResult, findNearestNodeWithDistance } from '../lib/routing';
import {
  Navigation,
  Route,
  Zap,
  Clock,
  Compass,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Layers,
  Sparkles,
  Activity,
  GitCommit,
  Flame,
  Unlock,
  Lock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface PresetRoute {
  id: string;
  name: string;
  description: string;
  start: { lat: number; lng: number; label: string };
  end: { lat: number; lng: number; label: string };
}

const VIJAYAWADA_PRESETS: PresetRoute[] = [
  {
    id: 'preset-1',
    name: 'Benz Circle ➔ GGH Apex Trauma Center',
    description: 'Critical medical ICU green corridor via Mahatma Gandhi Road',
    start: { lat: 16.5005, lng: 80.6555, label: 'Benz Circle Junction' },
    end: { lat: 16.5193, lng: 80.6305, label: 'GGH Apex Trauma Center' },
  },
  {
    id: 'preset-2',
    name: 'Prakasam Barrage ➔ Governorpet Collectorate',
    description: 'Flood evacuation route from Krishna River embankment',
    start: { lat: 16.5075, lng: 80.6185, label: 'Prakasam Barrage North Head' },
    end: { lat: 16.5135, lng: 80.6312, label: 'Governorpet Collectorate Junction' },
  },
  {
    id: 'preset-3',
    name: 'Bhavanipuram Ferry ➔ Ramavarappadu Junction',
    description: 'East-West cross-city emergency transport via NH65 / BRTS Corridor',
    start: { lat: 16.5185, lng: 80.6055, label: 'Bhavanipuram Ferry Terminal' },
    end: { lat: 16.5285, lng: 80.6685, label: 'Ramavarappadu Ring Junction' },
  },
  {
    id: 'preset-4',
    name: 'Kanaka Durga Flyover ➔ Auto Nagar Relief Hub',
    description: 'Elevated bypass route avoiding low-lying canal flood plains',
    start: { lat: 16.5215, lng: 80.6125, label: 'Kanaka Durga Flyover North' },
    end: { lat: 16.4950, lng: 80.6650, label: 'Auto Nagar Industrial Relief Hub' },
  },
];

export const RoutingDemoPage: React.FC = () => {
  const { state, navigate } = useResQNova();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(true);

  // Start and End Selection
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number; label: string }>(VIJAYAWADA_PRESETS[0].start);
  const [endPoint, setEndPoint] = useState<{ lat: number; lng: number; label: string }>(VIJAYAWADA_PRESETS[0].end);
  const [clickMode, setClickMode] = useState<'start' | 'end'>('start');

  // Computed Route Result
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [blockedRoadIds, setBlockedRoadIds] = useState<Set<string>>(new Set());

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const roadNetworkLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineLayerRef = useRef<L.Polyline | null>(null);
  const routeGlowLayerRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);
  const exploredLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Load Graph Engine
  const initGraph = async () => {
    setLoadingGraph(true);
    try {
      const roads = (state?.roads || []).map((r) => {
        if (blockedRoadIds.has(r.road_id || r.id)) {
          return { ...r, status: 'blocked' };
        }
        return r;
      });
      const res = await buildGraph(roads.length > 0 ? roads : undefined);
      setGraph(res.graph);
    } catch (err) {
      console.error('[Routing Demo] Failed to initialize graph:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    initGraph();
  }, [state?.roads, blockedRoadIds]);

  // 2. Compute Route with A*
  const computeRoute = () => {
    if (!graph || !startPoint || !endPoint) return;
    setIsCalculating(true);

    try {
      const result = findShortestPath(
        startPoint.lat,
        startPoint.lng,
        endPoint.lat,
        endPoint.lng,
        graph
      );
      setRouteResult(result);
    } catch (err) {
      console.error('[Routing Demo] A* computation error:', err);
      setRouteResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  // Re-run routing whenever start, end, or graph changes
  useEffect(() => {
    if (graph) {
      computeRoute();
    }
  }, [graph, startPoint, endPoint]);

  // 3. Initialize Leaflet Tactical Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.5090, 80.6400],
      zoom: 13,
      zoomControl: true,
    });

    // Dark Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    roadNetworkLayerRef.current = L.layerGroup().addTo(map);
    exploredLayerRef.current = L.layerGroup().addTo(map);

    // Interactive Click to Set Start or Destination
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));

      setClickMode((current) => {
        if (current === 'start') {
          setStartPoint({ lat, lng, label: `Custom Origin [${lat}, ${lng}]` });
          return 'end';
        } else {
          setEndPoint({ lat, lng, label: `Custom Destination [${lat}, ${lng}]` });
          return 'start';
        }
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Render Background Road Network
  useEffect(() => {
    if (!mapInstanceRef.current || !graph || !roadNetworkLayerRef.current) return;
    const layer = roadNetworkLayerRef.current;
    layer.clearLayers();

    let count = 0;
    for (const [_, edgeList] of graph.adjacency.entries()) {
      for (const edge of edgeList) {
        if (count > 800) break;
        count++;

        const isBlocked = blockedRoadIds.has(edge.roadId);
        const polyline = L.polyline(edge.geometry, {
          color: isBlocked ? '#ef4444' : '#1e293b',
          weight: isBlocked ? 3 : 1.5,
          opacity: isBlocked ? 0.8 : 0.4,
          dashArray: isBlocked ? '4, 4' : undefined,
        });
        layer.addLayer(polyline);
      }
    }
  }, [graph, blockedRoadIds]);

  // 5. Render A* Calculated Route with Smooth Animation & Road-Following Curves
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Clean up previous route layers
    if (routePolylineLayerRef.current) {
      map.removeLayer(routePolylineLayerRef.current);
      routePolylineLayerRef.current = null;
    }
    if (routeGlowLayerRef.current) {
      map.removeLayer(routeGlowLayerRef.current);
      routeGlowLayerRef.current = null;
    }
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
      endMarkerRef.current = null;
    }

    if (!routeResult || routeResult.geometry.length < 2) return;

    // Outer Neon Glow Polyline
    const glowPolyline = L.polyline(routeResult.geometry, {
      color: '#06b6d4',
      weight: 9,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routeGlowLayerRef.current = glowPolyline;

    // Core Solid Navigation Polyline (Google Maps Blue)
    const mainPolyline = L.polyline(routeResult.geometry, {
      color: '#38bdf8',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    routePolylineLayerRef.current = mainPolyline;

    // Start Marker (Green Pin A)
    const startIcon = L.divIcon({
      className: 'start-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          font-weight: 900;
          font-size: 11px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);
        ">
          A
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const sMarker = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).addTo(map);
    sMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
        <div style="font-weight: bold; color: #059669;">ORIGIN (A)</div>
        <div>${startPoint.label}</div>
        <div><strong>Snapped Node:</strong> ${routeResult.startNode?.id || 'Nearest'}</div>
      </div>
    `);
    startMarkerRef.current = sMarker;

    // Destination Marker (Red Pin B)
    const destIcon = L.divIcon({
      className: 'dest-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          font-weight: 900;
          font-size: 11px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.8);
        ">
          B
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const dMarker = L.marker([endPoint.lat, endPoint.lng], { icon: destIcon }).addTo(map);
    dMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
        <div style="font-weight: bold; color: #dc2626;">DESTINATION (B)</div>
        <div>${endPoint.label}</div>
        <div><strong>Snapped Node:</strong> ${routeResult.targetNode?.id || 'Nearest'}</div>
      </div>
    `);
    endMarkerRef.current = dMarker;

    // Smoothly zoom/fit bounds to the calculated route
    const bounds = L.latLngBounds(routeResult.geometry);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [routeResult, startPoint, endPoint]);

  // Handle selecting a preset route
  const selectPreset = (preset: PresetRoute) => {
    setStartPoint(preset.start);
    setEndPoint(preset.end);
  };

  // Toggle blocking a road on the current route
  const toggleBlockRoadOnRoute = (roadId: string) => {
    setBlockedRoadIds((prev) => {
      const next = new Set(prev);
      if (next.has(roadId)) next.delete(roadId);
      else next.add(roadId);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/40">
            <Navigation className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                PHASE 3 A* NAVIGATION ENGINE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                O(E log V) PRIORITY HEAP
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                GEOJSON CURVES PRESERVED
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Google Maps-Style A* Shortest Path Engine
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              Calculates optimal turn-by-turn routes across OpenStreetMap geometry for Vijayawada (NTR District). Click anywhere on the map to set Start (A) and Destination (B) or select a quick scenario.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={computeRoute}
            disabled={isCalculating || loadingGraph}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Route</span>
          </button>
          <button
            onClick={() => navigate('/routing-test')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Graph Inspector</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Route Distance</span>
            <Route className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">
              {routeResult ? (routeResult.distanceMeters / 1000).toFixed(2) : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">km</span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-400/80">
            {routeResult ? `${routeResult.distanceMeters.toLocaleString()} meters` : 'No route'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Estimated Travel Time</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {routeResult ? Math.round(routeResult.travelTimeSeconds / 60) : '--'}
            </span>
            <span className="text-xs text-emerald-300 ml-1.5">mins</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">
            {routeResult ? `${routeResult.travelTimeSeconds} seconds` : 'No route'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Explored Vertices</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-400">
              {routeResult ? routeResult.visitedNodes.length : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">nodes</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-300/80">Search space expansion</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>A* Compute Latency</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {routeResult ? routeResult.computationTimeMs : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">ms</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-300/80">Sub-5ms Google Maps speed</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Curve Waypoints</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">
              {routeResult ? routeResult.geometry.length : '--'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">points</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-300/80">Zero air-lines</div>
        </div>
      </div>

      {/* Quick-Select Scenarios (Step 8) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
        <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          Vijayawada Benchmark Routing Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {VIJAYAWADA_PRESETS.map((preset) => {
            const isSelected = startPoint.label === preset.start.label && endPoint.label === preset.end.label;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600/20 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="truncate">{preset.name}</span>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Map & Route Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Leaflet Tactical Map */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">Live Route Trajectory Visualizer</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={`px-2.5 py-1 rounded-lg font-bold border ${clickMode === 'start' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  1. Tap Map for Origin (A)
                </span>
                <span className={`px-2.5 py-1 rounded-lg font-bold border ${clickMode === 'end' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  2. Tap Map for Destination (B)
                </span>
              </div>
            </div>

            {/* Leaflet Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-[540px] rounded-xl border border-slate-800 overflow-hidden relative shadow-inner z-0"
            />
          </div>
        </div>

        {/* Right 4 Cols: Turn-by-Turn Route Guidance & Live Obstacle Simulator */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Navigation Panel */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                ACTIVE NAVIGATION PATH
              </span>
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center justify-center shrink-0">
                    A
                  </span>
                  <div>
                    <span className="font-bold text-white">{startPoint.label}</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Snapped: {routeResult?.startNode.id || '...'} ({routeResult?.startNode.name})
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold flex items-center justify-center shrink-0">
                    B
                  </span>
                  <div>
                    <span className="font-bold text-white">{endPoint.label}</span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Snapped: {routeResult?.targetNode.id || '...'} ({routeResult?.targetNode.name})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Segment Sequence */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <GitCommit className="h-4 w-4 text-cyan-400" />
                Street Progression ({routeResult?.stepSegments.length || 0} segments):
              </span>

              {!routeResult || routeResult.stepSegments.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                  No traversable road sequence available.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {routeResult.stepSegments.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold text-white block truncate">{step.roadName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {step.from} ➔ {step.to} ({step.geometry.length} pts)
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-cyan-300 font-mono">{step.distanceMeters}m</span>
                        <div className="text-[10px] text-slate-400 font-mono">{step.travelTimeSeconds}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Obstacle Simulator (Step 11 & D* Lite Prep) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Flame className="h-4 w-4 text-orange-400" />
                Simulate Flood Blockage on Current Route:
              </span>
              <p className="text-[11px] text-slate-400">
                Block a street segment on this route to verify that A* immediately re-routes around the obstruction.
              </p>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {routeResult?.stepSegments.slice(0, 5).map((step) => {
                  const isBlocked = blockedRoadIds.has(step.roadId);
                  return (
                    <div
                      key={step.roadId}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-[11px] text-slate-300 truncate mr-2">{step.roadName}</span>
                      <button
                        onClick={() => toggleBlockRoadOnRoute(step.roadId)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          isBlocked ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isBlocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        <span>{isBlocked ? 'Reopen' : 'Block'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

