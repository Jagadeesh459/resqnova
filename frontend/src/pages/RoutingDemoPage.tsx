import React, { useEffect, useState, useMemo } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { buildGraph, findShortestPath, Graph, RouteResult, TurnInstruction, ManeuverType, RoadStatus, updateGraphEdgeStatus } from '../lib/routing';
import { supabase } from '../lib/supabase';
import { TacticalMap } from '../components/TacticalMap';

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
  Play,
  Pause,
  RotateCcw,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Gauge,
  Car,
  AlertOctagon,
  ShieldAlert,
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
  const [roadStatusOverrides, setRoadStatusOverrides] = useState<Map<string, RoadStatus>>(new Map());

  // Vehicle Movement Simulation States
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [vehicleType, setVehicleType] = useState<'default' | 'citizen' | 'ambulance' | 'rescue'>('ambulance');
  const [simProgress, setSimProgress] = useState<number>(0);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // 1. Load Graph Engine from Supabase
  const initGraph = async () => {
    setLoadingGraph(true);
    setNavigationError(null);
    try {
      const res = await buildGraph();
      setGraph(res.graph);
    } catch (err: any) {
      console.error('[Routing Demo] Failed to initialize graph:', err);
      setNavigationError(err?.message || 'Failed to load Vijayawada road network from Supabase.');
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    initGraph();
  }, []);

  // Realtime Supabase Subscription for Dynamic Road Status Updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('routing_demo_roads_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roads' },
        (payload: any) => {
          if (payload.new && (payload.new.road_id || payload.new.id)) {
            const rid = payload.new.road_id || payload.new.id;
            const newStatus = (payload.new.status || 'open') as RoadStatus;
            setRoadStatusOverrides((prev) => new Map(prev).set(rid, newStatus));
            if (graph) {
              updateGraphEdgeStatus(graph, rid, newStatus);
            }
            if (newStatus === 'blocked' || newStatus === 'flooded') {
              setBlockedRoadIds((prev) => new Set(prev).add(rid));
            } else {
              setBlockedRoadIds((prev) => {
                const next = new Set(prev);
                next.delete(rid);
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [graph]);

  // Handle road status update from map popup or UI
  const handleRoadStatusChange = (roadId: string, newStatus: RoadStatus) => {
    const rid = roadId.replace(/_rev$/, '');
    
    // 1. Instant in-memory update on graph (< 1ms)
    if (graph) {
      updateGraphEdgeStatus(graph, rid, newStatus);
    }

    // 2. Update local state
    setRoadStatusOverrides((prev) => {
      const next = new Map(prev);
      next.set(rid, newStatus);
      return next;
    });

    if (newStatus === 'blocked' || newStatus === 'flooded') {
      setBlockedRoadIds((prev) => new Set(prev).add(rid));
    } else {
      setBlockedRoadIds((prev) => {
        const next = new Set(prev);
        next.delete(rid);
        return next;
      });
    }

    // 3. Persist to Supabase in background
    if (supabase) {
      supabase
        .from('roads')
        .update({ status: newStatus })
        .eq('road_id', rid)
        .then(({ error }) => {
          if (error) console.warn('[Routing Demo] Failed to persist road status to Supabase:', error);
        });
    }
  };

  // 2. Compute Route with Multi-Stage Dynamic A*
  const computeRoute = () => {
    if (!graph || !startPoint || !endPoint) return;
    setIsCalculating(true);
    setNavigationError(null);

    try {
      const result = findShortestPath(
        startPoint.lat,
        startPoint.lng,
        endPoint.lat,
        endPoint.lng,
        graph,
        blockedRoadIds
      );
      setRouteResult(result);
      if (!result || result.geometry.length < 2) {
        setNavigationError('No connected road path found between selected coordinates. Origin/destination may be isolated or blocked.');
        setIsSimulating(false);
      }
    } catch (err) {
      console.error('[Routing Demo] A* computation error:', err);
      setRouteResult(null);
      setNavigationError('Error computing shortest path across graph.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Re-run routing whenever start, end, graph, or blocked roads change
  useEffect(() => {
    if (graph) {
      computeRoute();
    }
  }, [graph, startPoint, endPoint, blockedRoadIds, roadStatusOverrides]);

  // Handle Map Click (Setting Start / Destination)
  const handleMapClick = (lat: number, lng: number) => {
    if (clickMode === 'start') {
      setStartPoint({ lat, lng, label: `Custom Origin [${lat}, ${lng}]` });
      setClickMode('end');
    } else {
      setEndPoint({ lat, lng, label: `Custom Destination [${lat}, ${lng}]` });
      setClickMode('start');
    }
  };

  // Select a preset route
  const selectPreset = (preset: PresetRoute) => {
    setStartPoint(preset.start);
    setEndPoint(preset.end);
    setIsSimulating(false);
    setSimProgress(0);
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

  // Helper for Maneuver Icons
  const renderManeuverIcon = (maneuver: ManeuverType) => {
    switch (maneuver) {
      case 'turn-left':
        return <CornerUpLeft className="h-4 w-4 text-cyan-400" />;
      case 'turn-right':
        return <CornerUpRight className="h-4 w-4 text-cyan-400" />;
      case 'slight-left':
        return <ArrowUpLeft className="h-4 w-4 text-cyan-300" />;
      case 'slight-right':
        return <ArrowUpRight className="h-4 w-4 text-cyan-300" />;
      case 'u-turn':
        return <RotateCcw className="h-4 w-4 text-amber-400" />;
      case 'arrive':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'depart':
      case 'straight':
      default:
        return <ArrowUp className="h-4 w-4 text-blue-400" />;
    }
  };

  // Simulation toggle with helpful error reporting
  const handleToggleSimulation = () => {
    if (!routeResult || routeResult.geometry.length < 2) {
      setNavigationError('No connected road path found. Click valid origin/destination on the road network or reopen blocked roads.');
      return;
    }
    setNavigationError(null);
    setIsSimulating(!isSimulating);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimProgress(0);
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
                PHASE 4 DYNAMIC A* ROUTING ENGINE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MULTI-STAGE FALLBACK
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                REALTIME OBSTACLE AVOIDANCE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Dynamic A* Shortest Path & Blocked Road Avoidance
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              Real-time multi-stage routing across 23k+ Vijayawada road segments. Avoids flooded & blocked streets, leverages restricted detour corridors when necessary, and falls back to emergency passage with live warnings.
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

      {/* Emergency Fallback Alert Banner */}
      {routeResult?.warning && (
        <div className="p-4 rounded-2xl bg-orange-950/90 border-2 border-orange-500/80 text-orange-200 text-xs flex items-start sm:items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 shrink-0">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-orange-300 uppercase tracking-wide text-xs">
                  STAGE 3 EMERGENCY FALLBACK ROUTE ACTIVE
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-orange-500/30 text-orange-200 border border-orange-500/40">
                  VIBRANT ORANGE CORRIDOR
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium mt-0.5">
                {routeResult.warning}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-orange-300 bg-orange-900/60 px-2.5 py-1 rounded-lg border border-orange-700/50 shrink-0 hidden md:inline-block">
            High-Clearance / Rescue Vehicles Only
          </span>
        </div>
      )}

      {/* Navigation Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Route Status Badge Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Route Type</span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            {routeResult?.routeType === 'safe' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Safe (Stage 1)
              </span>
            )}
            {routeResult?.routeType === 'restricted' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Restricted (Stage 2)
              </span>
            )}
            {routeResult?.routeType === 'emergency' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">
                <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                Emergency (Stage 3)
              </span>
            )}
            {!routeResult && <span className="text-sm font-bold text-slate-500">--</span>}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {routeResult ? `Stage ${routeResult.stage} Solver` : 'No route'}
          </div>
        </div>

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
            <span>Estimated ETA</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {routeResult ? Math.max(1, Math.round(routeResult.travelTimeSeconds / 60)) : '--'}
            </span>
            <span className="text-xs text-emerald-300 ml-1.5">mins</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">
            {routeResult ? `${routeResult.travelTimeSeconds} seconds` : 'No route'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avoidance Stats</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-red-400">
              {routeResult ? routeResult.blockedRoadsAvoided : 0}
            </span>
            <span className="text-xs text-slate-400">blocked avoided</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-300/90 font-mono">
            {routeResult ? `${routeResult.restrictedRoadsUsed} restricted used` : '0 restricted'}
          </div>
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
          <div className="mt-1 text-[11px] text-amber-300/80">
            {routeResult ? `${routeResult.visitedNodes.length} nodes explored` : 'Sub-50ms speed'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Corridor Head</span>
            <Compass className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-base sm:text-lg font-black text-blue-300 truncate block">
              {routeResult?.startingRoadName || '--'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Optimal Traversable</span>
          </div>
        </div>
      </div>

      {/* Quick-Select Benchmark Scenarios */}
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
        {/* Left 8 Cols: Unified Tactical Map & Simulation Controls */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">Live Dynamic Route & Road Status Simulator</span>
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

            {/* Standardized Tactical Map Component */}
            <TacticalMap
              height="500px"
              mode="routing-demo"
              startPoint={startPoint}
              endPoint={endPoint}
              routePolyline={routeResult?.geometry}
              onMapClick={handleMapClick}
              blockedRoadIds={blockedRoadIds}
              roadStatusOverrides={roadStatusOverrides}
              onRoadStatusChange={handleRoadStatusChange}
              isEmergencyRoute={routeResult?.routeType === 'emergency'}
              isSimulatingRoute={isSimulating}
              simulationSpeed={simSpeed}
              vehicleType={vehicleType}
              onSimulationProgress={(progress) => setSimProgress(progress)}
            />

            {/* Live Navigation Simulation Toolbar */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Play / Pause Button */}
                <button
                  onClick={handleToggleSimulation}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isSimulating
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                  }`}
                >
                  {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isSimulating ? 'Pause Movement' : 'Start Navigation Simulation'}</span>
                </button>

                {/* Reset Button */}
                <button
                  onClick={handleResetSimulation}
                  title="Reset vehicle to start"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Speed Multipliers */}
                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Speed:</span>
                  {[1, 2, 5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setSimSpeed(speed)}
                      className={`px-2 py-0.5 rounded font-mono font-bold transition-colors cursor-pointer ${
                        simSpeed === speed ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                {/* Vehicle Type Selector */}
                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Unit:</span>
                  {[
                    { type: 'ambulance' as const, label: '🚑 Ambulance' },
                    { type: 'rescue' as const, label: '🚤 NDRF Boat' },
                    { type: 'citizen' as const, label: '🚗 Citizen' },
                  ].map((v) => (
                    <button
                      key={v.type}
                      onClick={() => setVehicleType(v.type)}
                      className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer text-[11px] ${
                        vehicleType === v.type ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Bar Indicator */}
              <div className="w-full sm:w-48 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Trajectory Progress:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(simProgress * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-75"
                    style={{ width: `${Math.round(simProgress * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Error Alert Banner */}
            {navigationError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{navigationError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Turn-by-Turn Route Guidance & Live Obstacle Simulator */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Navigation Panel */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] text-cyan-400 font-mono font-bold uppercase tracking-wider flex items-center justify-between">
                <span>ACTIVE NAVIGATION PATH</span>
                <span className="text-slate-400 text-[10px]">{routeResult?.distanceMeters || 0}m total</span>
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
                      {routeResult?.startSnapDistanceMeters != null && (
                        <span className="text-emerald-400 ml-1 font-bold">• {routeResult.startSnapDistanceMeters}m snap</span>
                      )}
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
                      {routeResult?.targetSnapDistanceMeters != null && (
                        <span className="text-emerald-400 ml-1 font-bold">• {routeResult.targetSnapDistanceMeters}m snap</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Turn-by-Turn Maneuver Guidance (Google Maps Style) */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-cyan-400" />
                  Turn-by-Turn Maneuvers:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {routeResult?.instructions?.length || 0} steps
                </span>
              </span>

              {!routeResult || !routeResult.instructions || routeResult.instructions.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                  No traversable road sequence available.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {routeResult.instructions.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs flex items-start gap-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        {renderManeuverIcon(inst.maneuver)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-100 block leading-tight">
                          {inst.instruction}
                        </span>
                        {inst.distanceMeters > 0 && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                            <span className="text-cyan-400 font-bold">{inst.distanceMeters}m</span>
                            <span>•</span>
                            <span>{inst.travelTimeSeconds}s</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Obstacle Simulator (Phase 4 Road Block Simulator) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Flame className="h-4 w-4 text-orange-400" />
                Live Road Status Simulator on Active Route:
              </span>
              <p className="text-[11px] text-slate-400">
                Click any status below to instantly update the graph cost model. A* recalculates in &lt;100ms.
              </p>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {routeResult?.stepSegments && routeResult.stepSegments.length > 0 ? (
                  routeResult.stepSegments.slice(0, 6).map((step) => {
                    const currentStatus = roadStatusOverrides.get(step.roadId) || 'open';
                    return (
                      <div
                        key={step.roadId}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 truncate mr-2" title={step.roadName}>
                            {step.roadName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {step.distanceMeters}m
                          </span>
                        </div>

                        {/* Status Selectors */}
                        <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                          <button
                            onClick={() => handleRoadStatusChange(step.roadId, 'open')}
                            className={`py-1 rounded transition-colors cursor-pointer text-center ${
                              currentStatus === 'open'
                                ? 'bg-emerald-600 text-white font-black shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleRoadStatusChange(step.roadId, 'restricted')}
                            className={`py-1 rounded transition-colors cursor-pointer text-center ${
                              currentStatus === 'restricted'
                                ? 'bg-amber-600 text-white font-black shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            Restricted
                          </button>
                          <button
                            onClick={() => handleRoadStatusChange(step.roadId, 'blocked')}
                            className={`py-1 rounded transition-colors cursor-pointer text-center ${
                              currentStatus === 'blocked'
                                ? 'bg-red-600 text-white font-black shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            Blocked
                          </button>
                          <button
                            onClick={() => handleRoadStatusChange(step.roadId, 'flooded')}
                            className={`py-1 rounded transition-colors cursor-pointer text-center ${
                              currentStatus === 'flooded'
                                ? 'bg-blue-600 text-white font-black shadow'
                                : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            Flooded
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                    No active road steps to simulate. Select start and destination.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

