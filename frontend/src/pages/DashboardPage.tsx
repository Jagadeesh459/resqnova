import React, { useState, useEffect } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { getSafeRoute } from '../lib/api';
import {
  AlertOctagon,
  Users,
  Shield,
  HeartPulse,
  Building2,
  Navigation,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  AlertTriangle,
  Compass,
  X,
  ArrowRight,
} from 'lucide-react';
import { PriorityLevel, RequestStatus } from '../types';

export const DashboardPage: React.FC = () => {
  const {
    state,
    selectedRequestId,
    setSelectedRequestId,
    triggerAiDispatch,
    updateMissionStatus,
    updateRoad,
    navigate,
  } = useResQNova();

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const [activeRoute, setActiveRoute] = useState<{
    coordinates: [number, number][];
    distanceKm: number;
    durationMinutes: number;
    isSafe: boolean;
    warnings: string[];
    alternativeUsed: boolean;
    provider: string;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const selectedRequest = state?.citizen_requests.find((r) => r.id === selectedRequestId);

  // Compute road-following safe route when selectedRequest changes (must be called before any early return)
  useEffect(() => {
    if (!selectedRequest || !state) {
      setActiveRoute(null);
      return;
    }

    let isMounted = true;
    setLoadingRoute(true);

    // Origin: assigned rescue team or default NDRF Team Alpha depot
    let startLat = 16.518;
    let startLng = 80.608;

    if (selectedRequest.rescue_team_id) {
      const team = state.rescue_teams.find((t) => t.id === selectedRequest.rescue_team_id);
      if (team) {
        startLat = team.latitude;
        startLng = team.longitude;
      }
    } else if (state.rescue_teams.length > 0) {
      startLat = state.rescue_teams[0].latitude;
      startLng = state.rescue_teams[0].longitude;
    }

    getSafeRoute(startLat, startLng, selectedRequest.latitude, selectedRequest.longitude)
      .then((route) => {
        if (isMounted) {
          setActiveRoute(route);
          setLoadingRoute(false);
        }
      })
      .catch((err) => {
        console.error('Failed to compute safe road route:', err);
        if (isMounted) setLoadingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRequest?.id, state?.roads]);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Synchronizing ResQNova Command State...</p>
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const totalSos = state.citizen_requests.length;
  const activeSos = state.citizen_requests.filter((r) => r.status !== 'completed').length;
  const criticalCount = state.citizen_requests.filter(
    (r) => r.risk_level === 'Critical' && r.status !== 'completed'
  ).length;
  const completedCount = state.citizen_requests.filter((r) => r.status === 'completed').length;

  const totalEvacuated = state.citizen_requests
    .filter((r) => r.status === 'completed')
    .reduce((acc, curr) => acc + curr.people_count, 0);

  const availableRescue = state.rescue_teams.filter((t) => t.status === 'available').length;
  const deployedRescue = state.rescue_teams.filter((t) => t.status === 'deployed').length;

  const availableAmbs = state.ambulances.filter((a) => a.status === 'available').length;
  const totalShelterCapacity = state.shelters.reduce((acc, s) => acc + s.capacity, 0);
  const remainingShelterCapacity = state.shelters.reduce((acc, s) => acc + s.available_capacity, 0);
  const shelterUsagePct = Math.round(((totalShelterCapacity - remainingShelterCapacity) / totalShelterCapacity) * 100);

  // Filter requests
  const filteredRequests = state.citizen_requests.filter((req) => {
    if (priorityFilter !== 'all' && req.risk_level !== priorityFilter) return false;
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    return true;
  });

  const handleManualDispatch = async (id: string) => {
    setDispatchingId(id);
    try {
      await triggerAiDispatch(id);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Alert */}
      <AlertBanner
        type="warning"
        title="Active Flood Command Directive: Krishna River Catchment Inundation"
        message="Prakasam Barrage outflow exceeding 4.2 lakh cusecs. Low-lying wards in Krishna Lanka, Bhavanipuram, and Ranigari Thota are under immediate evacuation protocol."
        action={{
          label: 'AI Flood Prediction & Dynamic Routing',
          onClick: () => navigate('/ai-flood-predictor'),
        }}
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Incidents</span>
            <AlertOctagon className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">{activeSos}</span>
            <span className="text-xs text-slate-400 ml-1.5">/ {totalSos} total</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-400 font-medium">
            {criticalCount} Critical Priority
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Rescued Citizens</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">{totalEvacuated}</span>
            <span className="text-xs text-slate-400 ml-1.5">lives saved</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80 font-medium">
            {completedCount} missions cleared
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Rescue Boats</span>
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-400 tracking-tight">{availableRescue}</span>
            <span className="text-xs text-slate-400 ml-1.5">ready</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-300/80">
            {deployedRescue} deployed on scene
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>108 Ambulances</span>
            <HeartPulse className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-orange-400 tracking-tight">{availableAmbs}</span>
            <span className="text-xs text-slate-400 ml-1.5">units standby</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            ALS & BLS Fleet Active
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Shelter Capacity</span>
            <Building2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-400 tracking-tight">
              {remainingShelterCapacity}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">available</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-300/80">
            {shelterUsagePct}% current occupancy
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Blocked Corridors</span>
            <Navigation className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-red-400 tracking-tight">
              {state.roads.filter((r) => r.status !== 'open').length}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">roads</span>
          </div>
          <div className="mt-1 text-[11px] text-red-400/80">
            Bypass routing active
          </div>
        </div>
      </div>

      {/* Main Grid: GIS Digital Twin & Real-Time Incident Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: GIS Tactical Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Live Geographic Information System (GIS) Digital Twin
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Auto-refreshes on incoming distress & sensor updates
            </span>
          </div>

          {state.latest_ai_flood_prediction && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/60 via-amber-950/40 to-slate-900 border border-red-500/40 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold text-white uppercase tracking-wider">
                  AI Flood Forecast Active:
                </span>
                <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                  {(state.latest_ai_flood_prediction.impact_zones || state.latest_ai_flood_prediction.red_impact_zones || []).filter((z) => z.impact_level === 'red' || z.impact_level === 'Critical - Red Area' || z.severity_category === 'red').length} Red Impact Zones
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">
                  {(state.latest_ai_flood_prediction.impact_zones || state.latest_ai_flood_prediction.yellow_impact_zones || []).filter((z) => z.impact_level === 'yellow' || z.impact_level === 'Warning - Yellow Area' || z.severity_category === 'yellow').length} Yellow Impact Zones
                </span>
                <span className="text-slate-300 text-[11px] hidden sm:inline">
                  • {(state.latest_ai_flood_prediction.quantum_prepositioning_points || state.latest_ai_flood_prediction.strategic_prepositioning_points || []).length} Staged Strategic Logistics Nodes
                </span>
              </div>
              <button
                onClick={() => navigate('/ai-flood-predictor')}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>AI Predictor & Flood Model</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          <TacticalMap
            height="520px"
            focusCoords={
              selectedRequest
                ? [selectedRequest.latitude, selectedRequest.longitude]
                : undefined
            }
            routePolyline={activeRoute?.coordinates && activeRoute.coordinates.length > 0 ? activeRoute.coordinates : undefined}
            onSelectRequest={(id) => setSelectedRequestId(id)}
          />

          {/* Active Safe Road Navigation Vector HUD */}
          {selectedRequest && (
            <div className="p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-xs shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span className="font-bold text-white tracking-wide">
                    Real Road Navigation Vector ({activeRoute?.provider?.toUpperCase() || 'OSRM / ROAD NETWORK'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    !activeRoute || activeRoute.coordinates.length === 0
                      ? 'bg-red-950 text-red-300 border border-red-700/60'
                      : activeRoute?.isSafe
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                  }`}>
                    {!activeRoute || activeRoute.coordinates.length === 0
                      ? 'ROUTE UNAVAILABLE (ROAD SUBMERGED)'
                      : activeRoute?.isSafe
                      ? 'VERIFIED CLEAR OF FLOOD RISKS'
                      : 'BYPASS ACTIVE (AVOIDING SUBMERGED ARTERIES)'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRequestId(null);
                      setActiveRoute(null);
                    }}
                    className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                    title="Clear Active Route"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {loadingRoute ? (
                <div className="flex items-center gap-2 text-slate-400 text-[11px] py-1">
                  <div className="h-3 w-3 border border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Calculating safe route along Vijayawada road network...</span>
                </div>
              ) : activeRoute ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Incident Target:</span>
                    <b className="text-white truncate block">{selectedRequest.request_id} ({selectedRequest.citizen_name})</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Road Distance:</span>
                    <b className="text-cyan-300 font-mono">{activeRoute.distanceKm} km</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estimated Transit Time:</span>
                    <b className="text-emerald-400 font-mono">{activeRoute.durationMinutes} minutes</b>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Corridor Type:</span>
                    <b className="text-purple-300">
                      {activeRoute.alternativeUsed ? 'Hazard Bypass Arterial' : 'Direct Verified Street'}
                    </b>
                  </div>
                </div>
              ) : null}

              {activeRoute?.warnings && activeRoute.warnings.length > 0 && (
                <div className="text-[10px] text-amber-300/90 bg-amber-950/40 p-1.5 rounded border border-amber-800/40">
                  ⚠️ {activeRoute.warnings.join(' ')}
                </div>
              )}
            </div>
          )}

          {/* Quick Road Status Bar */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-blue-400" />
                Key Transit Arteries & Flood Closures
              </span>
              <span className="text-[11px] text-slate-400">Toggle condition to recalculate safe detours</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {state.roads.map((road) => {
                const isOpen = road.status === 'open';
                return (
                  <div
                    key={road.id}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      isOpen
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white truncate max-w-[130px]">
                        {road.road_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isOpen ? 'Clear' : road.blocked_reason || 'Inundated'}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        updateRoad(
                          road.id,
                          isOpen ? 'flooded' : 'open',
                          isOpen ? '1.1m Krishna backwater spill' : undefined
                        )
                      }
                      className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                        isOpen
                          ? 'bg-slate-800 hover:bg-red-600/30 text-slate-300 hover:text-red-300'
                          : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                      }`}
                    >
                      {isOpen ? 'Mark Flooded' : 'Clear Road'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Emergency Triage Queue & Details */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency Incident Queue ({filteredRequests.length})
              </h3>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none text-[11px]"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none text-[11px]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="en_route">En Route</option>
                <option value="on_scene">On Scene</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Incident List */}
          <div className="space-y-2 max-h-[570px] overflow-y-auto pr-1">
            {filteredRequests.map((req) => {
              const isSelected = req.id === selectedRequestId;
              const assignedTeam = state.rescue_teams.find((t) => t.id === req.rescue_team_id);
              const assignedAmb = state.ambulances.find((a) => a.id === req.ambulance_id);
              const assignedShelter = state.shelters.find((s) => s.id === req.recommended_shelter_id);

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10'
                      : req.risk_level === 'Critical' && req.status !== 'completed'
                      ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white">
                          {req.request_id}
                        </span>
                        <StatusBadge priority={req.risk_level} />
                        {req.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 uppercase shadow-sm">
                            <CheckCircle2 className="h-3 w-3" />
                            SOLVED
                          </span>
                        ) : (
                          <StatusBadge status={req.status} />
                        )}
                        {req.ambulance_reached && req.rescue_done && (
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60">
                            🚑 Ambulance & Rescue Done
                          </span>
                        )}
                        {req.ambulance_requested && !req.ambulance_reached && (
                          <span className="text-[10px] text-orange-400 font-medium bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-800/60">
                            🚑 108 Requested by Squad
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-white mt-1">
                        {req.citizen_name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{req.address_hint}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-200">
                        {req.people_count} People
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({req.children_count} ch, {req.elderly_count} eld)
                      </div>
                    </div>
                  </div>

                  {/* AI Reason Summary */}
                  {req.ai_reason && (
                    <div className="mt-2 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1 text-blue-400 font-semibold text-[10px] uppercase mb-0.5">
                        <Zap className="h-3 w-3" />
                        AI Triage Assessment ({req.ai_confidence}% confidence)
                      </div>
                      <p className="leading-snug line-clamp-2">{req.ai_reason}</p>
                    </div>
                  )}

                  {/* Resource Assignments */}
                  {(assignedTeam || assignedAmb || assignedShelter) && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-[10px]">
                      {assignedTeam && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                          Boat: {assignedTeam.team_name}
                        </span>
                      )}
                      {assignedAmb && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-medium">
                          Medic: {assignedAmb.vehicle_code}
                        </span>
                      )}
                      {assignedShelter && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
                          Shelter: {assignedShelter.shelter_name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(req.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {req.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualDispatch(req.id);
                          }}
                          disabled={dispatchingId === req.id}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Zap className="h-3 w-3" />
                          {dispatchingId === req.id ? 'Dispatching...' : 'Run AI Dispatch'}
                        </button>
                      )}

                      {req.status !== 'completed' && req.status !== 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateMissionStatus(req.id, 'completed');
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-medium transition-colors"
                        >
                          Resolve Mission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Resource Readiness Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NDRF Squads */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              NDRF / SDRF Squads ({state.rescue_teams.length})
            </h4>
            <button
              onClick={() => navigate('/rescue')}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
            >
              Terminal <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {state.rescue_teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div>
                  <div className="font-semibold text-white">{team.team_name}</div>
                  <div className="text-[10px] text-slate-400">{team.leader} • {team.equipment}</div>
                </div>
                <StatusBadge status={team.status} />
              </div>
            ))}
          </div>
        </div>

        {/* 108 Ambulances */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-orange-400" />
              108 Ambulances ({state.ambulances.length})
            </h4>
            <button
              onClick={() => navigate('/ambulance')}
              className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
            >
              Terminal <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {state.ambulances.map((amb) => (
              <div
                key={amb.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div>
                  <div className="font-semibold text-white">{amb.vehicle_code}</div>
                  <div className="text-[10px] text-slate-400">{amb.driver_name} • Fuel: {amb.fuel}%</div>
                </div>
                <StatusBadge status={amb.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Shelters */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-400" />
              Relief Shelters ({state.shelters.length})
            </h4>
            <button
              onClick={() => navigate('/shelter')}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
            >
              Terminal <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {state.shelters.map((shelter) => (
              <div
                key={shelter.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div>
                  <div className="font-semibold text-white truncate max-w-[140px]">
                    {shelter.shelter_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Food: {shelter.food_stock} • Water: {shelter.water_stock}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-300">
                    {shelter.available_capacity}
                  </div>
                  <div className="text-[10px] text-slate-500">beds open</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospitals */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-sky-400" />
              Trauma Hospitals ({state.hospitals.length})
            </h4>
            <button
              onClick={() => navigate('/hospital')}
              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5"
            >
              Terminal <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {state.hospitals.map((hosp) => (
              <div
                key={hosp.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div>
                  <div className="font-semibold text-white truncate max-w-[140px]">
                    {hosp.hospital_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ICU: {hosp.icu_beds} • ER: {hosp.emergency_capacity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sky-300">
                    {hosp.available_beds}
                  </div>
                  <div className="text-[10px] text-slate-500">beds free</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
