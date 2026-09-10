import React, { useState } from 'react';
import {
  Navigation,
  Shield,
  AlertTriangle,
  Compass,
  CheckCircle2,
  XCircle,
  MapPin,
  Anchor,
  HeartPulse,
  Building2,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useResQNova } from '../context/ResQNovaContext';

interface Props {
  variant?: 'admin' | 'citizen' | 'rescue' | 'ambulance' | 'shelter' | 'hospital';
  onInspectRoute?: () => void;
}

export const PrepositioningAndRoutingHighlight: React.FC<Props> = ({
  variant = 'admin',
  onInspectRoute,
}) => {
  const { state, updateRoad, navigate } = useResQNova();
  const [activeTab, setActiveTab] = useState<'both' | 'preposition' | 'routing'>('both');
  const [simulatingChange, setSimulatingChange] = useState(false);

  // Prepositioning data
  const totalBoatsPrepositioned = state?.rescue_teams.length || 4;
  const totalAmbsPrepositioned = state?.ambulances.length || 3;
  const blockedRoadsCount = state?.roads.filter((r) => r.status === 'blocked').length || 1;
  const floodedRoadsCount = state?.roads.filter((r) => r.status === 'flooded').length || 2;
  const openRoadsCount = state?.roads.filter((r) => r.status === 'open').length || 2;

  // Toggle road status for dynamic simulation
  const toggleBarrageRoad = async () => {
    const rd = state?.roads.find((r) => r.id === 'rd-1');
    if (!rd) return;
    setSimulatingChange(true);
    try {
      const nextStatus = rd.status === 'blocked' ? 'open' : 'blocked';
      const reason =
        nextStatus === 'blocked'
          ? 'Krishna River overtopping with 2.8m violent flood current'
          : undefined;
      await updateRoad(rd.id, nextStatus, reason);
    } finally {
      setTimeout(() => setSimulatingChange(false), 400);
    }
  };

  // Persona-specific titles & descriptions
  const variantConfig: Record<NonNullable<Props['variant']>, {
    tag: string;
    title: string;
    preposTitle: string;
    preposDesc: string;
    routingTitle: string;
    routingDesc: string;
    actionLabel: string;
  }> = {
    citizen: {
      tag: 'CITIZEN LIFE SAFETY ROUTE',
      title: 'Safe Evacuation Path & Nearest Staged Rescue Units',
      preposTitle: 'Rescue Teams Staged Near You',
      preposDesc: 'Rescue boats and ambulances were pre-positioned at Krishna Lanka riverbank before floodwaters peaked, ensuring responders are only 0.8km away.',
      routingTitle: 'Turn-by-Turn Safe Dry Route',
      routingDesc: 'Your evacuation route automatically detours around the submerged Prakasam Barrage road, taking you safely along elevated MG Road to IGMC Stadium.',
      actionLabel: 'View Safe Shelter Route',
    },
    rescue: {
      tag: 'WATERBORNE RESCUE TACTICAL',
      title: 'Squad Boat Staging & Dynamic Extraction Corridors',
      preposTitle: 'Zodiac Staging Positions',
      preposDesc: 'Boats pre-positioned at riverside spillways prior to peak surge, cutting deployment response latency from 45 min down to 12 min.',
      routingTitle: 'Navigable Water & Land Corridors',
      routingDesc: 'Live depth sensors continuously reroute boats around violent undercurrents and direct land vehicles to dry drop-off shelters.',
      actionLabel: 'Inspect Tactical Corridors',
    },
    ambulance: {
      tag: '108 EMERGENCY MEDICAL CORRIDOR',
      title: 'Ambulance Staging & Hospital Green Corridors',
      preposTitle: 'Paramedic Pre-Positioning',
      preposDesc: '108 ALS units staged along elevated flyover ramps to prevent being trapped behind submerged riverside underpasses.',
      routingTitle: 'Priority Green Corridors',
      routingDesc: 'Cleared arterial bypasses along NH-16 ensure uninterrupted casualty transport to GGH Trauma ICU with zero flood detours.',
      actionLabel: 'Check Trauma Green Corridors',
    },
    shelter: {
      tag: 'RELIEF CAMP INFLOW LOGISTICS',
      title: 'Pre-Positioned Camp Stocks & Safe Inflow Corridors',
      preposTitle: 'Pre-Positioned Relief Supplies',
      preposDesc: 'Emergency rations, clean water, generators, and first-aid kits staged at camps before roadway access was severed.',
      routingTitle: 'Citizen Inflow Arteries',
      routingDesc: 'Guiding approaching evacuee foot traffic along safe, well-lit elevated highways directly to your camp gates.',
      actionLabel: 'Inspect Inflow Corridors',
    },
    hospital: {
      tag: 'APEX TRAUMA TRIAGE PROTOCOL',
      title: 'Trauma ICU Pre-Allocation & Inbound Casualty Corridors',
      preposTitle: 'Emergency Bed Pre-Allocation',
      preposDesc: 'ICU beds, oxygen banks, and surgical teams mobilized prior to water cresting, ready to receive flood survivors.',
      routingTitle: 'Inbound 108 Emergency Lanes',
      routingDesc: 'Elevated bypass corridors kept clear of flood debris so ambulances can transfer critical patients directly to ER trauma bays.',
      actionLabel: 'View Inbound Transit Lanes',
    },
    admin: {
      tag: 'DISTRICT COMMAND INTELLIGENCE',
      title: 'Citywide Tactical Pre-Positioning & Safe Routing Status',
      preposTitle: 'Strategic Asset Pre-Positioning',
      preposDesc: 'Assets staged in vulnerable riverside sectors before water levels peak, avoiding bridge cutoff delays and reducing emergency latency from 45 mins to 12 mins.',
      routingTitle: 'Dynamic Safe Arterial Rerouting',
      routingDesc: 'All citizen evacuation and responder dispatch vectors are automatically recomputed along elevated high-ground arteries, completely bypassing submerged underpasses.',
      actionLabel: 'View Full Evac Corridors',
    },
  };

  const currentCfg = variantConfig[variant] || variantConfig.admin;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-2 border-cyan-500/40 p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden mb-6">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-950/50">
            <Compass className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono">
                {currentCfg.tag}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              {currentCfg.title}
            </h2>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'both' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('preposition')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'preposition' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pre-Positioning
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              activeTab === 'routing' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Safe Routes
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN: STRATEGIC ASSET PRE-POSITIONING */}
        {(activeTab === 'both' || activeTab === 'preposition') && (
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300">
                <Shield className="h-4 w-4 text-cyan-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  {currentCfg.preposTitle}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Staged Prior to Peak Inundation
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentCfg.preposDesc}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Anchor className="h-3.5 w-3.5 text-blue-400" /> Rescue Boats
                  </span>
                  <span className="font-bold text-blue-400 font-mono">{totalBoatsPrepositioned} Staged</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  📍 Krishna Lanka Riverfront & Bhavanipuram Spillway
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <HeartPulse className="h-3.5 w-3.5 text-orange-400" /> ALS Ambulances
                  </span>
                  <span className="font-bold text-orange-400 font-mono">{totalAmbsPrepositioned} Units</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  📍 Kanaka Durga Flyover Approach & Benz Circle
                </div>
              </div>
            </div>

            {/* Tactical Prepositioning Zone Chips */}
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-slate-200">NDRF Squad Alpha (Zodiac Boats)</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">0.8km from Trapped Cluster</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-slate-200">108 ALS Medic Unit 101</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Standby at High-Elevation Bund</span>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: DYNAMIC SAFE ROUTING */}
        {(activeTab === 'both' || activeTab === 'routing') && (
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300">
                <Navigation className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  {currentCfg.routingTitle}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Detouring Flooded Nodes
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentCfg.routingDesc}
            </p>

            {/* Arteries status row */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/40 border border-red-500/40">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold text-red-200">Prakasam Barrage Direct Road</span>
                    <p className="text-[10px] text-red-300/80">Closed • 2.8m violent flood overtopping</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/80 text-red-200 font-mono uppercase font-bold">
                  Blocked
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-200">NH-16 Elevated Bypass & MG Road</span>
                    <p className="text-[10px] text-emerald-300/80">Active Corridor • 100% Dry & Cleared for ResQ Transits</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 font-mono uppercase font-bold">
                  Open Safe
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                onClick={toggleBarrageRoad}
                disabled={simulatingChange}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{simulatingChange ? 'Updating...' : 'Simulate Flood Road Closure/Open'}</span>
              </button>

              <button
                onClick={() => {
                  if (onInspectRoute) onInspectRoute();
                  else navigate('/evacuation-planner');
                }}
                className="text-[11px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{currentCfg.actionLabel}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

