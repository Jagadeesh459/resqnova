import React, { useEffect, useState } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { buildGraph, Graph, GraphBuildStats, DEFAULT_VIJAYAWADA_INTERSECTIONS } from '../lib/routing';
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
  Sparkles,
} from 'lucide-react';

export const RoutingTestPage: React.FC = () => {
  const { state, updateRoad, navigate } = useResQNova();
  const [graphData, setGraphData] = useState<{ graph: Graph; stats: GraphBuildStats } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<string>('N001');

  const loadGraph = async () => {
    setLoading(true);
    try {
      const result = await buildGraph(state?.roads, DEFAULT_VIJAYAWADA_INTERSECTIONS);
      setGraphData(result);
      if (!result.graph.nodes.has(selectedNode) && result.graph.nodes.size > 0) {
        setSelectedNode(Array.from(result.graph.nodes.keys())[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [state?.roads]);

  const stats = graphData?.stats;
  const graph = graphData?.graph;
  const currentNode = graph && selectedNode ? graph.nodes.get(selectedNode) : null;
  const currentEdges = graph && selectedNode ? graph.adjacency.get(selectedNode) || [] : [];

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/40">
            <Network className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                PHASE 2 GRAPH ENGINE VERIFICATION
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ADJACENCY GRAPH ACTIVE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Supabase → In-Memory Topological Graph Inspector
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              Verifies the conversion of Supabase road records into a directed adjacency-list graph $G=(V, E)$, verifying that blocked segments are excluded while preserving full GeoJSON road curvatures.
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Intersections (Nodes $V$)</span>
            <Network className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-white">{stats?.totalIntersections || 0}</span>
            <span className="text-xs text-slate-400 ml-1.5">vertices</span>
          </div>
          <div className="mt-1 text-[11px] text-cyan-400/80">WGS84 GPS Anchor Nodes</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Road Records</span>
            <Database className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-blue-400">{stats?.totalRoads || 0}</span>
            <span className="text-xs text-slate-400 ml-1.5">roads</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-300/80">Fetched from Supabase table</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-red-500/30 bg-red-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-300 text-xs">
            <span>Blocked Roads Skipped</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-red-400">{stats?.totalBlockedRoadsSkipped || 0}</span>
            <span className="text-xs text-red-300 ml-1.5">excluded</span>
          </div>
          <div className="mt-1 text-[11px] text-red-400 font-semibold">Zero flood risk in graph</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Graph Edges ($E$)</span>
            <GitFork className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-emerald-400">{stats?.totalGraphEdges || 0}</span>
            <span className="text-xs text-slate-400 ml-1.5">directed edges</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">Available for A* / D* Lite</div>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Intersection Node Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Network className="h-4 w-4 text-cyan-400" />
              Graph Intersections ({graph?.nodes.size || 0})
            </h3>
            <span className="text-xs text-slate-400">Click node to view adjacency</span>
          </div>

          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {graph &&
              Array.from(graph.nodes.values()).map((node) => {
                const isSelected = node.id === selectedNode;
                const outgoingCount = graph.adjacency.get(node.id)?.length || 0;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-600/20 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-cyan-400">{node.id}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {outgoingCount} reachable neighbors
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm text-white mt-1">{node.name}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          GPS: {node.latitude.toFixed(4)}, {node.longitude.toFixed(4)}
                        </span>
                      </div>
                      <ArrowRight className={`h-4 w-4 mt-1 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right 7 Cols: Adjacency Tree & Edge Inspection */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-cyan-400 font-mono font-bold uppercase tracking-wider">
                  ADJACENCY LIST FOR {currentNode?.id}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{currentNode?.name}</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80">
                {currentEdges.length} Active Outgoing Edges
              </span>
            </div>

            {/* Adjacency Flow Diagram */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <GitFork className="h-3.5 w-3.5 text-cyan-400" />
                Sample Graph Adjacency Progression (A* Traversable):
              </span>

              {currentEdges.length === 0 ? (
                <div className="text-slate-400 italic p-2">
                  No outgoing edges from this node (isolated vertex or all connected roads are flooded/blocked).
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-xs pt-1">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Geometry Details */}
            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Layers className="h-4 w-4 text-blue-400" />
                Preserved Geometry Verification (GeoJSON to Leaflet Coordinates)
              </span>

              <div className="space-y-2">
                {currentEdges.map((edge, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {edge.roadName || edge.roadId} ({edge.from} ➔ {edge.to})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {edge.geometry.length} Waypoints Preserved
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      Sample GPS: {edge.geometry.slice(0, 3).map((p) => `[${p[0].toFixed(4)}, ${p[1].toFixed(4)}]`).join(' ➔ ')}
                      {edge.geometry.length > 3 ? ' ...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
