import React, { useState, useMemo, useEffect } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import { StatusBadge } from '../components/StatusBadge';
import { getAStarRoute } from '../lib/api';
import {
  HeartPulse,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Phone,
  Fuel,
  Hospital,
  Activity,
  Radio,
  Clock,
  ShieldAlert,
  ArrowRight,
  Stethoscope,
  AlertTriangle,
  Check,
  PlusCircle,
  MapPin,
  Anchor,
} from 'lucide-react';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const AmbulancePortalPage: React.FC = () => {
  const {
    state,
    updateMissionStatus,
    updateAmbulanceStatus,
    updateHospital,
    markAmbulanceReached,
    claimSosForAmbulance,
    submitSos,
  } = useResQNova();

  const [selectedAmbId, setSelectedAmbId] = useState<string>(
    state?.ambulances[0]?.id || 'amb-1'
  );

  // Tab switcher: 'assigned' (Only team to SOS) vs 'other_sos' (Other SOS calls)
  const [activeTab, setActiveTab] = useState<'assigned' | 'other_sos'>('assigned');
  const [showLogModal, setShowLogModal] = useState(false);

  // Direct Field Paramedic SOS
  const [paramedicCitizen, setParamedicCitizen] = useState('');
  const [paramedicPhone, setParamedicPhone] = useState('');
  const [paramedicAddress, setParamedicAddress] = useState('');
  const [paramedicUrgency, setParamedicUrgency] = useState<'critical' | 'high'>('critical');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amb = state?.ambulances.find((a) => a.id === selectedAmbId) || state?.ambulances[0];

  // Specific SOS assigned to this ambulance, or any SOS where rescue requested this ambulance
  const assignedRequests = useMemo(() => {
    return (
      state?.citizen_requests.filter(
        (r) =>
          r.status !== 'completed' &&
          (r.ambulance_id === amb?.id || (r.ambulance_requested && (!r.ambulance_id || r.ambulance_id === amb?.id)))
      ) || []
    );
  }, [state?.citizen_requests, amb?.id]);

  const currentMission = assignedRequests[0];

  // Other active SOS calls in the city needing medical/emergency dispatch
  const otherSosCalls = useMemo(() => {
    return (
      state?.citizen_requests.filter(
        (r) => r.id !== currentMission?.id && r.status !== 'completed'
      ) || []
    );
  }, [state?.citizen_requests, currentMission?.id]);

  // Target trauma center: prioritized nearest hospital with open ICU beds (icu_beds > 0)
  const targetHospital = useMemo(() => {
    if (!state?.hospitals || state.hospitals.length === 0) return null;
    const icuHospitals = state.hospitals.filter((h) => h.icu_beds > 0);
    const pool = icuHospitals.length > 0 ? icuHospitals : state.hospitals;
    if (!currentMission) return pool[0];
    return [...pool].sort(
      (a, b) =>
        haversineKm(currentMission.latitude, currentMission.longitude, a.latitude, a.longitude) -
        haversineKm(currentMission.latitude, currentMission.longitude, b.latitude, b.longitude)
    )[0];
  }, [state?.hospitals, currentMission?.latitude, currentMission?.longitude]);

  // Two-phase Green Corridor Routing State
  const [pickupRoute, setPickupRoute] = useState<[number, number][] | undefined>(undefined);
  const [corridorRoute, setCorridorRoute] = useState<[number, number][] | undefined>(undefined);
  const [pickupEta, setPickupEta] = useState<number | null>(null);
  const [corridorEta, setCorridorEta] = useState<number | null>(null);
  const [pickupDist, setPickupDist] = useState<number | null>(null);
  const [corridorDist, setCorridorDist] = useState<number | null>(null);
  const [routeBlocked, setRouteBlocked] = useState<boolean>(false);
  const [loadingRoutes, setLoadingRoutes] = useState<boolean>(false);

  useEffect(() => {
    if (!amb || !currentMission) {
      setPickupRoute(undefined);
      setCorridorRoute(undefined);
      setPickupEta(null);
      setCorridorEta(null);
      setPickupDist(null);
      setCorridorDist(null);
      setRouteBlocked(false);
      return;
    }

    let isMounted = true;
    setLoadingRoutes(true);

    // Leg 1: Ambulance to Patient Rendezvous
    const leg1Promise = getAStarRoute(amb.latitude, amb.longitude, currentMission.latitude, currentMission.longitude);

    // Leg 2: Patient Rendezvous to Trauma Hospital
    const leg2Promise = targetHospital
      ? getAStarRoute(currentMission.latitude, currentMission.longitude, targetHospital.latitude, targetHospital.longitude)
      : Promise.resolve(null);

    Promise.all([leg1Promise, leg2Promise])
      .then(([leg1, leg2]) => {
        if (!isMounted) return;

        let blocked = false;

        if (leg1 && leg1.success && leg1.coordinates && leg1.coordinates.length > 0 && leg1.is_safe !== false) {
          setPickupRoute(leg1.coordinates);
          setPickupEta(leg1.duration_min);
          setPickupDist(leg1.distance_km);
        } else {
          setPickupRoute(undefined);
          setPickupEta(null);
          setPickupDist(null);
          blocked = true;
        }

        if (leg2 && leg2.success && leg2.coordinates && leg2.coordinates.length > 0 && leg2.is_safe !== false) {
          setCorridorRoute(leg2.coordinates);
          setCorridorEta(leg2.duration_min);
          setCorridorDist(leg2.distance_km);
        } else if (targetHospital) {
          setCorridorRoute(undefined);
          setCorridorEta(null);
          setCorridorDist(null);
          blocked = true;
        }

        setRouteBlocked(blocked);
      })
      .catch(() => {
        if (!isMounted) return;
        setPickupRoute(undefined);
        setCorridorRoute(undefined);
        setRouteBlocked(true);
      })
      .finally(() => {
        if (isMounted) setLoadingRoutes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    amb?.id,
    amb?.latitude,
    amb?.longitude,
    currentMission?.id,
    currentMission?.latitude,
    currentMission?.longitude,
    targetHospital?.id,
    targetHospital?.latitude,
    targetHospital?.longitude,
    state?.roads,
  ]);

  const handleClaimSos = async (requestId: string) => {
    if (!amb) return;
    await claimSosForAmbulance(requestId, amb.id);
    setActiveTab('assigned');
  };

  const handleAmbulanceReached = async () => {
    if (!currentMission) return;
    await markAmbulanceReached(currentMission.id);
  };

  const handleResolveMedical = async () => {
    if (!currentMission) return;
    await updateMissionStatus(currentMission.id, 'completed');

    // Decrease hospital bed count if casualty admitted
    const nearestHosp = state?.hospitals[0];
    if (nearestHosp && nearestHosp.available_beds > 0) {
      await updateHospital(nearestHosp.id, {
        available_beds: nearestHosp.available_beds - 1,
      });
    }
  };

  const handleCreateParamedicSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramedicCitizen || !paramedicAddress) return;
    setIsSubmitting(true);
    try {
      await submitSos({
        citizen_name: paramedicCitizen,
        citizen_phone: paramedicPhone || '+91 866 2570000',
        latitude: 16.5055 + (Math.random() - 0.5) * 0.015,
        longitude: 80.6508 + (Math.random() - 0.5) * 0.015,
        address_hint: paramedicAddress,
        people_count: 2,
        children_count: 0,
        elderly_count: 1,
        emergency_type: 'Medical Emergency / Trauma',
        medical_urgency: paramedicUrgency,
      });
      setShowLogModal(false);
      setParamedicCitizen('');
      setParamedicAddress('');
      setActiveTab('other_sos');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!amb) {
    return <div className="p-8 text-center text-slate-400">Loading 108 ALS Ambulance Terminal...</div>;
  }

  const assignedRescueTeam = currentMission
    ? state?.rescue_teams.find((t) => t.id === currentMission.rescue_team_id)
    : null;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* AMBULANCE HEADER & TAB SELECTOR */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{amb.vehicle_code}</h2>
              <StatusBadge status={amb.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Staging Base: {amb.deployment_zone} • Paramedic: {amb.driver_name} ({amb.phone}) • Fuel: {amb.fuel}%
            </p>
          </div>
        </div>

        {/* Tab switcher: Only Team SOS vs Other SOS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20 border border-orange-500'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>My Ambulance Assigned SOS</span>
            {currentMission && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('other_sos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'other_sos'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 border border-amber-500'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Other Active SOS Calls ({otherSosCalls.length})</span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-orange-400" />
            <span>Log Trauma SOS</span>
          </button>

          <select
            value={amb.id}
            onChange={(e) => setSelectedAmbId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
          >
            {state?.ambulances.map((a) => (
              <option key={a.id} value={a.id}>
                {a.vehicle_code} ({a.status.toUpperCase()} - {a.fuel}% Fuel)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: AMBULANCE ASSIGNED SOS (SHOW ONLY TEAM TO SOS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'assigned' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 6 Cols: Mission Details & Inter-Agency Handoff */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Casualty Directive for {amb.vehicle_code}
                  </h3>
                </div>
                {currentMission && <StatusBadge priority={currentMission.risk_level} />}
              </div>

              {currentMission ? (
                <div className="space-y-4 text-xs">
                  {/* Alert if this was requested by Rescue Boat */}
                  {currentMission.ambulance_requested && (
                    <div className="p-3.5 rounded-xl bg-orange-950/40 border-2 border-orange-500/50 text-orange-200 space-y-1.5 shadow-md">
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-2 text-orange-300">
                          <Anchor className="h-4 w-4 text-cyan-400" />
                          Requested by Waterborne Rescue Boat Squad
                        </span>
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-[10px] uppercase font-mono">
                          PRIORITY DISPATCH
                        </span>
                      </div>
                      <p className="text-[11px] text-orange-200/90 leading-relaxed">
                        <b>Triage Condition:</b> {currentMission.ambulance_requested_reason || 'Casualty pulled from floodwaters requiring emergency ALS support.'}
                      </p>
                      {assignedRescueTeam && (
                        <div className="text-[11px] text-cyan-300 font-medium">
                          Rescue Unit on Scene: {assignedRescueTeam.team_name} (Leader: {assignedRescueTeam.leader})
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-white">
                        {currentMission.request_id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase text-[10px]">
                        Urgency: {currentMission.medical_urgency}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500">Patient:</span> <b>{currentMission.citizen_name}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Contact Phone:</span> <b>{currentMission.citizen_phone}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Casualties / Pax:</span>{' '}
                        <b className="text-orange-300">{currentMission.people_count} citizens</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Triage Level:</span>{' '}
                        <b className="text-orange-400">{currentMission.risk_level}</b>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                      <span className="text-slate-500 block text-[11px]">Pickup / Staging Rendezvous Point:</span>
                      <span className="font-medium text-white">{currentMission.address_hint}</span>
                    </div>

                    {/* Indicators for Rescue Done & Ambulance Reached */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div className={`p-2 rounded-lg border ${
                        currentMission.ambulance_reached
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        Ambulance: {currentMission.ambulance_reached ? '✓ Reached Scene' : 'En Route / Pending'}
                      </div>
                      <div className={`p-2 rounded-lg border ${
                        currentMission.rescue_done
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-medium'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        Water Extraction: {currentMission.rescue_done ? '✓ Rescue Done' : 'In Progress'}
                      </div>
                    </div>
                  </div>

                  {/* Destination Trauma Center Callout */}
                  <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/40 space-y-1">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5 text-xs">
                      <Hospital className="h-4 w-4" /> Destination: Government General Hospital (GGH)
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Trauma ICU Bed Reserved. Available GGH Trauma Beds:{' '}
                      <b className="text-sky-300">{state?.hospitals[0]?.available_beds} free</b>
                    </p>
                  </div>

                  {/* Ambulance Workflow State Transitions */}
                  <div className="space-y-2 pt-1">
                    <div className="font-bold text-white uppercase text-[11px] tracking-wider">
                      Ambulance Action Transitions:
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateMissionStatus(currentMission.id, 'en_route')}
                        disabled={currentMission.status === 'en_route' || currentMission.ambulance_reached}
                        className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                          currentMission.status === 'en_route' && !currentMission.ambulance_reached
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        1. Ambulance En Route
                      </button>

                      {/* Ambulance Reached Button */}
                      <button
                        onClick={handleAmbulanceReached}
                        className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer ${
                          currentMission.ambulance_reached
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow'
                            : 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500 shadow-md'
                        }`}
                      >
                        {currentMission.ambulance_reached
                          ? '✓ 2. Ambulance Reached (On Scene)'
                          : '2. Ambulance Reached'}
                      </button>
                    </div>

                    {/* Step 3: Rescue Done & Solved Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleResolveMedical}
                        className="w-full p-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        <span>
                          {currentMission.rescue_done && currentMission.ambulance_reached
                            ? 'Casualty Admitted at ER & Rescue Done ➔ Mark Solved'
                            : 'Rescue Done & Patient Admitted ➔ Solved'}
                        </span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      Once Ambulance Reached and Rescue Done are completed, pressing this button immediately reflects <b>"Solved"</b> in the Command Dashboard.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-base">No Active Casualty Dispatch Pending</div>
                  <p className="text-xs max-w-sm mx-auto">
                    {amb.vehicle_code} is standing by at the elevated ramp. Check <b>Other Active SOS Calls</b> to accept an unassigned medical or citizen call.
                  </p>
                  <button
                    onClick={() => setActiveTab('other_sos')}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <span>View Other SOS Calls ({otherSosCalls.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right 6 Cols: Tactical Navigation Map */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-orange-400" />
                  Green Corridor Navigation & Hospital Approach
                </h3>
                {loadingRoutes && (
                  <span className="text-[11px] text-orange-400 animate-pulse">Calculating corridor...</span>
                )}
              </div>

              {/* Corridor status alert */}
              {routeBlocked && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/80 text-red-200 text-xs flex items-center gap-2 shadow-sm">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>
                    <b>Route unavailable:</b> One or more arterial road segments on this corridor are flooded or blocked.
                  </span>
                </div>
              )}

              {/* Real Road Vector ETA HUD */}
              {currentMission && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/40 text-orange-200">
                    <div className="text-[10px] text-orange-400 uppercase font-bold flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> Leg 1: Ambulance to Patient
                    </div>
                    <div className="font-bold text-white mt-0.5">
                      {pickupEta !== null ? `${pickupEta} mins (${pickupDist} km)` : 'Calculating / Blocked'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <Hospital className="h-3 w-3" /> Leg 2: Green Corridor to ER
                    </div>
                    <div className="font-bold text-white mt-0.5 truncate" title={targetHospital?.hospital_name}>
                      {targetHospital?.hospital_name || 'Hospital ER'}
                    </div>
                    <div className="text-[10px] text-emerald-300">
                      {targetHospital?.icu_beds ?? 0} ICU beds • {corridorEta !== null ? `${corridorEta} mins (${corridorDist} km)` : 'Calculating'}
                    </div>
                  </div>
                </div>
              )}

              <TacticalMap
                height="450px"
                focusCoords={
                  currentMission
                    ? [currentMission.latitude, currentMission.longitude]
                    : [amb.latitude, amb.longitude]
                }
                routePolyline={currentMission?.ambulance_reached ? corridorRoute : pickupRoute}
                alternativePolyline={currentMission?.ambulance_reached ? undefined : corridorRoute}
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: OTHER SOS CALLS (OTHER SOS BUTTON DISPLAYED) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'other_sos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Active Citywide SOS Emergency Calls ({otherSosCalls.length})
              </h3>
              <p className="text-xs text-slate-400">
                Select and press "Accept Medical Call & Dispatch {amb.vehicle_code}". The assignment will immediately reflect in the Command Dashboard.
              </p>
            </div>
            <button
              onClick={() => setShowLogModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Log Trauma SOS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherSosCalls.map((req) => {
              const assignedAmb = state?.ambulances.find((a) => a.id === req.ambulance_id);
              const distKm = haversineKm(amb.latitude, amb.longitude, req.latitude, req.longitude);
              const estEtaMin = Math.max(2, Math.round(distKm * 2.2 + 2));
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-3 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{req.request_id}</span>
                      <StatusBadge priority={req.risk_level} />
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white">{req.citizen_name}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-orange-400 shrink-0" />
                        {req.address_hint}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                      <span>{req.people_count} citizens</span>
                      <span className="text-red-400 font-medium">Urgency: {req.medical_urgency}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-orange-400 font-medium bg-orange-950/30 p-1.5 rounded border border-orange-900/40">
                      <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <span>Est. 108 ALS ETA: ~{estEtaMin} min ({distKm} km)</span>
                    </div>

                    {req.ambulance_requested && (
                      <div className="text-[11px] text-orange-300 bg-orange-950/40 p-1.5 rounded border border-orange-900/50">
                        🚑 Rescue Squad requested ambulance for this casualty
                      </div>
                    )}

                    {assignedAmb && (
                      <div className="text-[11px] text-sky-400 bg-sky-950/40 p-1.5 rounded border border-sky-900/50">
                        Assigned vehicle: {assignedAmb.vehicle_code}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleClaimSos(req.id)}
                    className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Accept Medical Call & Dispatch {amb.vehicle_code}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {otherSosCalls.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <div className="text-white font-bold">No other pending SOS calls at this time</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log Trauma SOS Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-orange-400" />
                Log Direct Paramedic Trauma SOS
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParamedicSos} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Casualty / Patient Name</label>
                <input
                  type="text"
                  value={paramedicCitizen}
                  onChange={(e) => setParamedicCitizen(e.target.value)}
                  placeholder="e.g. Elderly Diabetic Trauma Patient"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={paramedicPhone}
                  onChange={(e) => setParamedicPhone(e.target.value)}
                  placeholder="+91 866 2570000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Pickup Location / Rendezvous Ramp</label>
                <input
                  type="text"
                  value={paramedicAddress}
                  onChange={(e) => setParamedicAddress(e.target.value)}
                  placeholder="e.g. Varadhi North Approach, near Railway Culvert"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Medical Urgency</label>
                <select
                  value={paramedicUrgency}
                  onChange={(e) => setParamedicUrgency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="critical">Critical (Immediate ALS resuscitation)</option>
                  <option value="high">High (Fracture / Severe Hypothermia)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Transmitting...' : 'Log & Dispatch to Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
