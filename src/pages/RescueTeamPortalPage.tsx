import React, { useState, useMemo } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import { StatusBadge } from '../components/StatusBadge';
import {
  Radio,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Anchor,
  Compass,
  ArrowRight,
  LifeBuoy,
  Fuel,
  Activity,
  Waves,
  HeartPulse,
  Send,
  Eye,
  Clock,
  Check,
  PlusCircle,
  MapPin,
} from 'lucide-react';

export const RescueTeamPortalPage: React.FC = () => {
  const {
    state,
    updateMissionStatus,
    updateRescueStatus,
    requestAmbulanceForSos,
    markRescueDone,
    claimSosForTeam,
    submitSos,
  } = useResQNova();

  // Selected squad (defaults to first available/deployed team)
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    state?.rescue_teams[0]?.id || 'team-1'
  );

  // Active view toggle: 'assigned' (Only the team to SOS) or 'other_sos' (Other SOS calls in city)
  const [activeTab, setActiveTab] = useState<'assigned' | 'other_sos'>('assigned');
  const [showReportModal, setShowReportModal] = useState(false);
  const [ambulanceReasonInput, setAmbulanceReasonInput] = useState(
    'Casualty pulled from floodwaters with acute hypothermia & severe limb trauma'
  );
  const [showAmbulancePrompt, setShowAmbulancePrompt] = useState(false);
  const [rescueNotes, setRescueNotes] = useState('Extracted via Zodiac boat, stabilized with life jackets');

  // New field distress sighting form
  const [newSosCitizen, setNewSosCitizen] = useState('');
  const [newSosPhone, setNewSosPhone] = useState('');
  const [newSosAddress, setNewSosAddress] = useState('');
  const [newSosPeople, setNewSosPeople] = useState(4);
  const [newSosSubmitting, setNewSosSubmitting] = useState(false);

  const team = state?.rescue_teams.find((t) => t.id === selectedTeamId) || state?.rescue_teams[0];

  // Specific SOS assigned to this team
  const teamAssignedSos = useMemo(() => {
    return (
      state?.citizen_requests.filter(
        (r) => r.rescue_team_id === team?.id && r.status !== 'completed'
      ) || []
    );
  }, [state?.citizen_requests, team?.id]);

  const currentMission = teamAssignedSos[0];

  // Other active SOS calls (not assigned to this team or unassigned pending)
  const otherSosCalls = useMemo(() => {
    return (
      state?.citizen_requests.filter(
        (r) => r.id !== currentMission?.id && r.status !== 'completed'
      ) || []
    );
  }, [state?.citizen_requests, currentMission?.id]);

  const handleClaimSos = async (requestId: string) => {
    if (!team) return;
    await claimSosForTeam(requestId, team.id);
    setActiveTab('assigned');
  };

  const handleRequestAmbulance = async () => {
    if (!currentMission) return;
    await requestAmbulanceForSos(currentMission.id, ambulanceReasonInput);
    setShowAmbulancePrompt(false);
  };

  const handleMarkRescueDone = async () => {
    if (!currentMission) return;
    await markRescueDone(currentMission.id, rescueNotes);
  };

  const handleCreateFieldSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSosCitizen || !newSosAddress) return;
    setNewSosSubmitting(true);
    try {
      await submitSos({
        citizen_name: newSosCitizen,
        citizen_phone: newSosPhone || '+91 866 2400000',
        latitude: 16.5015 + (Math.random() - 0.5) * 0.015,
        longitude: 80.6425 + (Math.random() - 0.5) * 0.015,
        address_hint: newSosAddress,
        people_count: Number(newSosPeople),
        children_count: 1,
        elderly_count: 1,
        emergency_type: 'Flood Trapped / Waterborne Extraction',
        medical_urgency: 'high',
      });
      setShowReportModal(false);
      setNewSosCitizen('');
      setNewSosAddress('');
      setActiveTab('other_sos');
    } finally {
      setNewSosSubmitting(false);
    }
  };

  if (!team) {
    return <div className="p-8 text-center text-slate-400">Loading Rescue Squad Terminal...</div>;
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* SQUAD HEADER & NAVIGATION TAB CONTROL */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Anchor className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{team.team_name}</h2>
              <StatusBadge status={team.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sector: {team.deployment_zone} • Leader: {team.leader} • Craft: {team.equipment}
            </p>
          </div>
        </div>

        {/* Tab switcher: Only Team SOS vs Other SOS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-500'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>My Squad Assigned SOS</span>
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
            onClick={() => setShowReportModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>Log Field SOS</span>
          </button>

          {/* Squad switch dropdown */}
          <select
            value={team.id}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none"
          >
            {state?.rescue_teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.team_name} ({t.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: SQUAD-ASSIGNED SOS (SHOW ONLY TEAM TO SOS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'assigned' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 6 Cols: Mission Directive Card */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Assigned SOS Call for {team.team_name}
                  </h3>
                </div>
                {currentMission && <StatusBadge priority={currentMission.risk_level} />}
              </div>

              {currentMission ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-white">
                          {currentMission.request_id}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          Received {new Date(currentMission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <StatusBadge status={currentMission.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500">Citizen:</span> <b>{currentMission.citizen_name}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span> <b>{currentMission.citizen_phone}</b>
                      </div>
                      <div>
                        <span className="text-slate-500">People Trapped:</span>{' '}
                        <b className="text-cyan-300">
                          {currentMission.people_count} ({currentMission.children_count} ch, {currentMission.elderly_count} eld)
                        </b>
                      </div>
                      <div>
                        <span className="text-slate-500">Disaster Category:</span>{' '}
                        <b className="text-red-400">{currentMission.emergency_type}</b>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
                      <span className="text-slate-500 block text-[11px]">Submerged Address Landmark:</span>
                      <span className="font-medium text-white">{currentMission.address_hint}</span>
                    </div>

                    {/* Status of Ambulance Request */}
                    {currentMission.ambulance_requested && (
                      <div className="p-3 rounded-lg bg-orange-950/30 border border-orange-500/40 text-orange-200 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <HeartPulse className="h-4 w-4 text-orange-400 animate-pulse" />
                            108 Ambulance Requested & Dispatched
                          </span>
                          <span className="px-2 py-0.5 rounded bg-orange-500/20 text-[10px] text-orange-300 uppercase">
                            {currentMission.ambulance_reached ? 'Ambulance Reached' : 'Unit En Route'}
                          </span>
                        </div>
                        <p className="text-[11px] text-orange-300/80">
                          {currentMission.ambulance_requested_reason}
                        </p>
                      </div>
                    )}

                    {/* Status of Rescue Done */}
                    {currentMission.rescue_done && (
                      <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 text-cyan-200 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                          Waterborne Rescue Completed
                        </span>
                        <span className="text-[11px] text-cyan-300">
                          {currentMission.ambulance_requested && !currentMission.ambulance_reached
                            ? 'Awaiting 108 Ambulance Handoff'
                            : 'Casualties Safe'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Inter-Agency Rescue Workflow Buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="font-bold text-white uppercase text-[11px] tracking-wider">
                      Rescue Mission Progress & Inter-Agency Handoff:
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateMissionStatus(currentMission.id, 'en_route')}
                        disabled={currentMission.status === 'en_route' || currentMission.status === 'on_scene'}
                        className={`p-2.5 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                          currentMission.status === 'en_route'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        1. Boat En Route
                      </button>

                      <button
                        onClick={() => updateMissionStatus(currentMission.id, 'on_scene')}
                        disabled={currentMission.status === 'on_scene'}
                        className={`p-2.5 rounded-xl font-bold border text-center transition-all cursor-pointer ${
                          currentMission.status === 'on_scene'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        2. On Scene (Boat Arrived)
                      </button>
                    </div>

                    {/* Step 3: Request 108 Ambulance Button */}
                    <div className="pt-2">
                      {!currentMission.ambulance_requested ? (
                        <button
                          onClick={() => setShowAmbulancePrompt(true)}
                          className="w-full p-3 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <HeartPulse className="h-4 w-4" />
                          <span>Request 108 Ambulance Support (Medical Casualty)</span>
                        </button>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-orange-500/40 flex items-center justify-between text-orange-300">
                          <span className="flex items-center gap-2 font-medium">
                            <Check className="h-4 w-4 text-emerald-400" />
                            108 Ambulance Requested (Reflected in Ambulance Portal)
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {currentMission.ambulance_reached ? 'Paramedic Reached' : 'En Route'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ambulance Request Modal Prompt */}
                    {showAmbulancePrompt && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-orange-500/60 space-y-2.5 animate-fadeIn">
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <HeartPulse className="h-4 w-4 text-orange-400" />
                          Dispatch 108 Ambulance for this Casualty
                        </div>
                        <textarea
                          value={ambulanceReasonInput}
                          onChange={(e) => setAmbulanceReasonInput(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                          placeholder="Casualty triage condition..."
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShowAmbulancePrompt(false)}
                            className="px-3 py-1 rounded-lg text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleRequestAmbulance}
                            className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold"
                          >
                            Confirm & Dispatch 108 Ambulance
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Rescue Done Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleMarkRescueDone}
                        className={`w-full p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          currentMission.rescue_done
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {currentMission.rescue_done
                            ? currentMission.ambulance_requested && !currentMission.ambulance_reached
                              ? 'Rescue Done (Awaiting Ambulance Handoff)'
                              : '✓ Rescue Done & Solved!'
                            : 'Mark Rescue Done (Extraction Completed)'}
                        </span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center pt-1">
                      {currentMission.ambulance_requested
                        ? 'When both Rescue Done and Ambulance Reached are complete, this incident updates to "Solved" in Dashboard.'
                        : 'Clicking "Rescue Done" marks the incident as Solved in the Command Dashboard.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-base">No Assigned SOS Call Pending</div>
                  <p className="text-xs max-w-sm mx-auto">
                    {team.team_name} is currently standing by at the pre-positioned dock. Check the <b>Other Active SOS Calls</b> tab to claim and dispatch this squad to an urgent citizen call.
                  </p>
                  <button
                    onClick={() => setActiveTab('other_sos')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <span>View Other SOS Calls ({otherSosCalls.length})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Vessel equipment inventory */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 text-slate-300">
              <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
                Assigned Watercraft Inventory
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Primary Vessel</span>
                  <span className="font-semibold text-white">{team.equipment}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block text-[11px]">Pre-Staged Dock GPS</span>
                  <span className="font-mono text-cyan-300">
                    {team.latitude.toFixed(4)}, {team.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 6 Cols: Tactical Navigation Map */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                Live Flood Navigation & Sector Map
              </h3>

              <TacticalMap
                height="450px"
                focusCoords={
                  currentMission
                    ? [currentMission.latitude, currentMission.longitude]
                    : [team.latitude, team.longitude]
                }
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
                Select and press "Dispatch My Squad Here" to assign {team.team_name} to this SOS. The assignment will immediately reflect in the Command Dashboard.
              </p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Log Field Sighting</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherSosCalls.map((req) => {
              const assignedTeam = state?.rescue_teams.find((t) => t.id === req.rescue_team_id);
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
                        <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                        {req.address_hint}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                      <span>{req.people_count} Citizens trapped</span>
                      <span className="text-red-400 font-medium">{req.emergency_type}</span>
                    </div>

                    {assignedTeam && (
                      <div className="text-[11px] text-blue-400 bg-blue-950/40 p-1.5 rounded border border-blue-900/50">
                        Currently assigned to: {assignedTeam.team_name}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleClaimSos(req.id)}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Dispatch {team.team_name} Here</span>
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

      {/* Field SOS Sighting Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                Report Field Waterborne SOS Sighting
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFieldSos} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Citizen / Contact Name</label>
                <input
                  type="text"
                  value={newSosCitizen}
                  onChange={(e) => setNewSosCitizen(e.target.value)}
                  placeholder="e.g. Stranded Family on Rooftop"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Emergency Phone Number</label>
                <input
                  type="text"
                  value={newSosPhone}
                  onChange={(e) => setNewSosPhone(e.target.value)}
                  placeholder="+91 866 2400000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Submerged Location / Landmark</label>
                <input
                  type="text"
                  value={newSosAddress}
                  onChange={(e) => setNewSosAddress(e.target.value)}
                  placeholder="e.g. Krishna Lanka Bund Reach 4, near Water Tank"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">People Count</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newSosPeople}
                  onChange={(e) => setNewSosPeople(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newSosSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  {newSosSubmitting ? 'Transmitting SOS...' : 'Log & Dispatch to Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
