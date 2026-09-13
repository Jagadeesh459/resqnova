import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useResQNova } from '../context/ResQNovaContext';
import { buildGraph, Graph, GraphNode, GraphEdge, GraphBuildStats } from '../lib/routing';
import {
  Network,
  Database,
  Route,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  GitFork,
  ArrowRight,
  Layers,
  Search,
  MapPin,
  Flame,
  Unlock,
  Lock,
  Compass,
  Check,
  Zap,
} from 'lucide-react';

export const RoutingTestPage: React.FC = () => {
  const { state, updateRoad, navigate } = useResQNova();
  const [graphData, setGraphData] = useState<{ graph: Graph; stats: GraphBuildStats; source: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [nodeSearchQuery, setNodeSearchQuery] = useState<string>('');
  const [roadSearchQuery, setRoadSearchQuery] = useState<string>('');
  const [blockedRoadIds, setBlockedRoadIds] = useState<Set<string>>(new Set(['R_OSM_102', 'R_OSM_205']));

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const roadLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const markerLayersGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Build Graph from OSM / Supabase
  const loadGraph = async () => {
    setLoading(true);
    try {
      // Pass overrides if any roads have been blocked in local state
      const roadsWithStatus = (state?.roads || []).map((r) => {
        if (blockedRoadIds.has(r.road_id || r.id)) {
          return { ...r, status: 'blocked' };
        }
        return r;
      });

      const result = await buildGraph(roadsWithStatus.length > 0 ? roadsWithStatus : undefined);
      setGraphData(result);

      if (!selectedNodeId && result.graph.nodes.size > 0) {
        // Pick a key landmark node as default
        const nodeKeys = Array.from(result.graph.nodes.keys());
        const defaultNode = nodeKeys.find(k => k.includes('Prakasam') || k.includes('Benz') || k.includes('N_OSM')) || nodeKeys[0];
        setSelectedNodeId(defaultNode);
      }
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [state?.roads, blockedRoadIds]);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.5062, 80.6480], // Vijayawada Center
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    roadLayersGroupRef.current = L.layerGroup().addTo(map);
    markerLayersGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Render Road Segments & Selected Node on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !graphData?.graph) return;
    const roadGroup = roadLayersGroupRef.current;
    const markerGroup = markerLayersGroupRef.current;
    if (!roadGroup || !markerGroup) return;

    roadGroup.clearLayers();
    markerGroup.clearLayers();

    const graph = graphData.graph;
    const selectedEdges = selectedNodeId ? graph.adjacency.get(selectedNodeId) || [] : [];
    const selectedEdgeRoadIds = new Set(selectedEdges.map((e) => e.roadId));

    // Render a sample of roads (up to 1,200 for smooth 60fps rendering)
    let renderedCount = 0;
    for (const [fromNodeId, edgeList] of graph.adjacency.entries()) {
      for (const edge of edgeList) {
        if (renderedCount > 1500) break;
        renderedCount++;

        const isSelected = selectedEdgeRoadIds.has(edge.roadId);
        const isBlocked = blockedRoadIds.has(edge.roadId) || edge.status === 'blocked';

        const polyline = L.polyline(edge.geometry, {
          color: isBlocked ? '#ef4444' : isSelected ? '#06b6d4' : '#3b82f6',
          weight: isSelected ? 5 : isBlocked ? 3 : 2,
          opacity: isSelected ? 1.0 : isBlocked ? 0.8 : 0.45,
          dashArray: isBlocked ? '6, 6' : undefined,
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <div style="font-weight: bold; margin-bottom: 4px;">${edge.roadName || edge.roadId}</div>
            <div><strong>From:</strong> ${edge.from}</div>
            <div><strong>To:</strong> ${edge.to}</div>
            <div><strong>Distance:</strong> ${edge.distance} meters</div>
            <div><strong>Travel Time:</strong> ${edge.travelTime} sec</div>
            <div><strong>Status:</strong> <span style="color: ${isBlocked ? 'red' : 'green'}; font-weight: bold;">${isBlocked ? 'BLOCKED' : 'OPEN'}</span></div>
            <div><strong>Waypoints:</strong> ${edge.geometry.length} points</div>
          </div>
        `);

        roadGroup.addLayer(polyline);
      }
    }

    // Render Selected Node Marker
    if (selectedNodeId && graph.nodes.has(selectedNodeId)) {
      const node = graph.nodes.get(selectedNodeId)!;
      const customIcon = L.divIcon({
        className: 'custom-node-pin',
        html: `
          <div style="
            background-color: #06b6d4;
            color: #020617;
            font-weight: 900;
            font-size: 10px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 14px #06b6d4;
          ">
            V
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([node.latitude, node.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <div style="font-weight: bold; color: #0891b2;">Node: ${node.id}</div>
          <div>${node.name || 'Vijayawada Junction'}</div>
          <div>GPS: ${node.latitude.toFixed(5)}, ${node.longitude.toFixed(5)}</div>
          <div>Reachable Edges: ${selectedEdges.length}</div>
        </div>
      `);
      markerGroup.addLayer(marker);
    }
  }, [graphData, selectedNodeId, blockedRoadIds]);

  // Handle fly to selected node
  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    if (graphData?.graph && mapInstanceRef.current) {
      const node = graphData.graph.nodes.get(nodeId);
      if (node) {
        mapInstanceRef.current.flyTo([node.latitude, node.longitude], 15, { duration: 1.2 });
      }
    }
  };

  const toggleBlockRoad = (roadId: string) => {
    setBlockedRoadIds((prev) => {
      const next = new Set(prev);
      if (next.has(roadId)) {
        next.delete(roadId);
      } else {
        next.add(roadId);
      }
      return next;
    });
  };

  const stats = graphData?.stats;
  const graph = graphData?.graph;
  const currentNode = graph && selectedNodeId ? graph.nodes.get(selectedNodeId) : null;
  const currentEdges = graph && selectedNodeId ? graph.adjacency.get(selectedNodeId) || [] : [];

  // Filter nodes for search list
  const filteredNodes = useMemo(() => {
    if (!graph) return [];
    const all = Array.from(graph.nodes.values());
    if (!nodeSearchQuery.trim()) return all.slice(0, 40);
    const q = nodeSearchQuery.toLowerCase();
    return all.filter((n) => n.id.toLowerCase().includes(q) || (n.name && n.name.toLowerCase().includes(q))).slice(0, 50);
  }, [graph, nodeSearchQuery]);

  // Collect sample roads for blocking simulator
  const sampleRoads = useMemo(() => {
    if (!graph) return [];
    const seen = new Set<string>();
    const list: GraphEdge[] = [];
    for (const edges of graph.adjacency.values()) {
      for (const edge of edges) {
        if (!seen.has(edge.roadId)) {
          seen.add(edge.roadId);
          list.push(edge);
        }
      }
    }
    if (!roadSearchQuery.trim()) return list.slice(0, 30);
    const q = roadSearchQuery.toLowerCase();
    return list.filter((r) => r.roadId.toLowerCase().includes(q) || (r.roadName && r.roadName.toLowerCase().includes(q))).slice(0, 40);
  }, [graph, roadSearchQuery]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/40">
            <Network className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                OPENSTREETMAP VIJAYAWADA ROAD NETWORK
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE GRAPH ENGINE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SOURCE: {graphData?.source === 'supabase' ? 'SUPABASE POSTGRES' : 'VIJAYAWADA OSM DATASET'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Real Vijayawada Topological Graph & Routing Inspector
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              High-resolution graph built directly from OpenStreetMap data covering Vijayawada Municipal Area (Benz Circle, Governorpet, Krishna Lanka, Bhavanipuram, Prakasam Barrage, Kanaka Durga Flyover). Preserves full GeoJSON curvature geometry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadGraph}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Rebuild Graph</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>OSM Intersections ($V$)</span>
            <Network className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats?.totalIntersections?.toLocaleString() || 0}</span>
            <span className="text-xs text-slate-400 ml-1.5">nodes</span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-400/80">Real GPS Junctions</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Road Segments ($E$)</span>
            <Database className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">{stats?.totalRoads?.toLocaleString() || 0}</span>
            <span className="text-xs text-slate-400 ml-1.5">segments</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-300/80">Drivable street network</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Preserved Curves</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-400">{stats?.totalGeometryPoints?.toLocaleString() || '69,000+'}</span>
            <span className="text-xs text-slate-400 ml-1.5">points</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-300/80">Zero straight air-lines</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-red-500/30 bg-red-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-300 text-xs">
            <span>Blocked / Flooded</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-red-400">{blockedRoadIds.size}</span>
            <span className="text-xs text-red-300 ml-1.5">excluded</span>
          </div>
          <div className="mt-1 text-[11px] text-red-400 font-semibold">Ignored by A* & D* Lite</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Graph Edges</span>
            <GitFork className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats?.totalGraphEdges?.toLocaleString() || 0}</span>
            <span className="text-xs text-slate-400 ml-1.5">directed</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">Traversable in memory</div>
        </div>
      </div>

      {/* Interactive Map & Graph Visualization */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">Vijayawada Road Curvature & Topo-Mesh Live View</span>
            <span className="text-xs text-slate-400">(Leaflet GeoJSON Render)</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded bg-blue-500 inline-block"></span>
              <span className="text-slate-300">Open Roads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded bg-cyan-400 inline-block"></span>
              <span className="text-cyan-300 font-bold">Selected Node Edges</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-6 rounded border border-red-500 bg-red-500/40 inline-block border-dashed"></span>
              <span className="text-red-400 font-bold">Blocked Roads</span>
            </div>
          </div>
        </div>

        {/* Leaflet Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-[460px] rounded-xl border border-slate-800 overflow-hidden relative shadow-inner z-0"
        />
      </div>

      {/* Main Inspection Grid: Left (Intersections) | Right (Edge Inspector & Dynamic Road Blocker) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Intersection Node Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Network className="h-4 w-4 text-cyan-400" />
                OSM Junctions Explorer ({stats?.totalIntersections || 0})
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search node ID or junction name (e.g. Prakasam, Benz, N_OSM)..."
                value={nodeSearchQuery}
                onChange={(e) => setNodeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Nodes List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredNodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const outgoingCount = graph?.adjacency.get(node.id)?.length || 0;

                return (
                  <div
                    key={node.id}
                    onClick={() => handleSelectNode(node.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600/20 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-cyan-400">{node.id}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {outgoingCount} edges
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-white mt-1">{node.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          GPS: {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
                        </span>
                      </div>
                      <MapPin className={`h-4 w-4 mt-1 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Adjacency Tree & Dynamic Road Blocker */}
        <div className="lg:col-span-7 space-y-4">
          {/* Node Adjacency & Waypoints */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                  SELECTED VERTEX ADJACENCY ({currentNode?.id})
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{currentNode?.name}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Coordinates: [{currentNode?.latitude.toFixed(5)}, {currentNode?.longitude.toFixed(5)}]
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 shrink-0">
                {currentEdges.length} Connected Segments
              </span>
            </div>

            {/* Flow Diagram */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <GitFork className="h-3.5 w-3.5 text-cyan-400" />
                Active Outgoing Edges for A* Search:
              </span>

              {currentEdges.length === 0 ? (
                <div className="text-slate-400 italic p-2">
                  No outgoing traversable edges (node is isolated or all connected roads are marked blocked).
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-xs pt-1 max-h-[220px] overflow-y-auto pr-1">
                  {currentEdges.map((edge, idx) => {
                    const targetNode = graph?.nodes.get(edge.to);
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-cyan-400">{edge.from}</span>
                          <span className="text-slate-500">──[{edge.roadName || edge.roadId}]──►</span>
                          <span className="font-black text-emerald-400">{edge.to}</span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline">
                            ({targetNode?.name || edge.to})
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-cyan-300 font-bold">{edge.distance}m</span>
                          <span className="text-slate-400 ml-1.5">({edge.travelTime}s)</span>
                          <span className="text-purple-300 ml-1.5 font-bold">[{edge.geometry.length} pts]</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Geometry Waypoints Sample */}
            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Layers className="h-4 w-4 text-blue-400" />
                GeoJSON Curvature Details (Leaflet Polylines)
              </span>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {currentEdges.map((edge, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate mr-2">
                        {edge.roadName || edge.roadId}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                        {edge.geometry.length} Waypoints
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      GPS Path: {edge.geometry.slice(0, 3).map((p) => `[${p[0].toFixed(5)}, ${p[1].toFixed(5)}]`).join(' ➔ ')}
                      {edge.geometry.length > 3 ? ` ... (+${edge.geometry.length - 3} more)` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Road Status & Flood Block Simulator (Step 7) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Dynamic Road Status Simulator (D* Lite Trigger)</h3>
              </div>
              <span className="text-xs text-slate-400">Click button to toggle road block</span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search road to simulate flood blockage (e.g. Barrage, Highway, R_OSM)..."
                value={roadSearchQuery}
                onChange={(e) => setRoadSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {sampleRoads.map((road) => {
                const isBlocked = blockedRoadIds.has(road.roadId);
                return (
                  <div
                    key={road.roadId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isBlocked
                        ? 'bg-red-950/30 border-red-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{road.roadId}</span>
                        <span className="text-[11px] text-slate-400 truncate">{road.roadName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {road.distance}m • {road.travelTime}s • {road.geometry.length} waypoints
                      </div>
                    </div>

                    <button
                      onClick={() => toggleBlockRoad(road.roadId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                        isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {isBlocked ? (
                        <>
                          <Unlock className="h-3 w-3" />
                          <span>Reopen</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          <span>Mark Blocked</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
