import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Navigation,
  History,
  Car,
  MapPin,
  Radio,
  User,
  Shield,
  ShieldAlert,
  Plus,
  Ambulance,
  LogOut,
} from 'lucide-react';
import AmbulanceDashboardPage from './frontend/app/ambulance/page';
import AmbulanceAssignmentPage from './frontend/app/ambulance/assignment/page';
import AmbulanceIncidentsPage from './frontend/app/ambulance/incidents/page';
import { mockAmbulanceData, AmbulanceData } from './frontend/data/mockData';
import { createClient } from '@/lib/supabase/client';
import { LiveAssignmentBanner } from './LiveAssignmentBanner';
import { LiveAmbulanceOverview } from './LiveAmbulanceOverview';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'assignment' | 'incidents'>('dashboard');
  const [logoIconStyle, setLogoIconStyle] = useState<'shield' | 'plus'>('shield');
  const [data, setData] = useState<AmbulanceData>(mockAmbulanceData);
  const [liveAmbulanceId, setLiveAmbulanceId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: row } = await supabase.from('ambulances').select('id,vehicle_code,status,deployment_zone,crew_size,fuel,updated_at').or(`manager_auth_id.eq.${authData.user.id},manager_auth_id.is.null`).order('assigned_request_id', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(1).maybeSingle();
      if (!active || !row) return;
      setLiveAmbulanceId(row.id);
      setData((previous) => ({
        ...previous,
        vehicleCode: row.vehicle_code,
        assignedZone: row.deployment_zone ?? previous.assignedZone,
        stationBase: row.deployment_zone ?? previous.stationBase,
        activeCrew: `${row.crew_size ?? 0} CREW MEMBERS`,
        status: row.status === 'available' ? 'AVAILABLE' : row.status === 'dispatched' ? 'EN_ROUTE' : row.status === 'standby' ? 'STANDBY' : previous.status,
        statusLabel: row.status.toUpperCase(),
        statusDetail: `Fuel ${row.fuel ?? 0}% / last update ${row.updated_at ?? 'pending'}`,
      }));
    };
    void load();
    const channel = supabase.channel('ambulance-portal').on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  // Sync route with URL hash if provided
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('assignment')) {
        setCurrentRoute('assignment');
      } else if (hash.includes('incident') || hash.includes('log') || hash.includes('task')) {
        setCurrentRoute('incidents');
      } else {
        setCurrentRoute('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: 'dashboard' | 'assignment' | 'incidents') => {
    setCurrentRoute(route);
    if (route === 'assignment') {
      window.location.hash = '/ambulance/assignment';
    } else if (route === 'incidents') {
      window.location.hash = '/ambulance/incidents';
    } else {
      window.location.hash = '/ambulance';
    }
  };

  const handleStatusChange = (newStatus: 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY') => {
    setData((prev) => ({
      ...prev,
      status: newStatus,
      statusLabel: newStatus === 'AVAILABLE' ? 'UNIT READY' : newStatus,
    }));
    if (liveAmbulanceId) {
      const databaseStatus = newStatus === 'AVAILABLE' ? 'available' : newStatus === 'EN_ROUTE' ? 'dispatched' : newStatus === 'STANDBY' ? 'standby' : 'available';
      void createClient().from('ambulances').update({ status: databaseStatus, updated_at: new Date().toISOString() }).eq('id', liveAmbulanceId);
    }
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#081321] text-[#d8e3f7] flex flex-col font-sans">
      {/* Top Bar Header */}
      <header className="h-16 px-4 sm:px-6 bg-[#040F1C]/90 backdrop-blur-md border-b border-[#00B8E6]/20 flex items-center justify-between z-30 sticky top-0">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="brand-logo-icon-btn"
            onClick={() => setLogoIconStyle((prev) => (prev === 'shield' ? 'plus' : 'shield'))}
            title="Click to toggle brand icon (Shield Alert / Medical +)"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#061826] border-[1.5px] border-[#00D4FF] hover:border-[#00D4FF] flex items-center justify-center text-[#00D4FF] shadow-[0_0_14px_rgba(0,212,255,0.35)] transition-all cursor-pointer group shrink-0"
          >
            {logoIconStyle === 'shield' ? (
              <ShieldAlert className="w-5 h-5 stroke-[2.2] drop-shadow-[0_0_6px_rgba(0,212,255,0.5)] group-hover:scale-105 transition-transform" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.5] drop-shadow-[0_0_6px_rgba(0,212,255,0.5)] group-hover:scale-105 transition-transform" />
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white font-display">
                RESQNOVA
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-display bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
                OPS-MED
              </span>
            </div>
            <div className="text-[11px] text-[#8EADC7] -mt-0.5 font-medium">
              Ambulance Operations
            </div>
          </div>
        </div>

        {/* Center Badges */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Vehicle Code Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B1F36]/80 border border-[#00B8E6]/25 text-xs font-bold text-white font-display">
            <Car className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>{data.vehicleCode}</span>
          </div>

          {/* Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B1F36]/80 border border-[#00B8E6]/25 text-xs font-bold text-white font-display">
            <span className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF] animate-pulse" />
            <span>{data.status === 'AVAILABLE' ? 'READY' : data.status}</span>
          </div>

          {/* Location Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B1F36]/80 border border-[#00B8E6]/25 text-xs font-bold text-white font-display">
            <MapPin className="w-3.5 h-3.5 text-[#8EADC7]" />
            <span>VIJAYAWADA</span>
          </div>
        </div>

        {/* Right Status & Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#00D4FF] font-display">
            <Radio className="w-3.5 h-3.5 text-[#00D4FF] animate-pulse" />
            <span className="hidden sm:inline">V2H TELEMETRY LIVE</span>
          </div>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#0B1F36] border border-[#00B8E6]/30 flex items-center justify-center text-[#8EADC7] hover:text-white transition-colors cursor-pointer">
            <User className="w-4 h-4" />
          </div>
          <button type="button" onClick={handleSignOut} title="Sign out" className="w-8 h-8 rounded-lg border border-[#ff4d4d]/30 bg-[#ff4d4d]/10 flex items-center justify-center text-[#ff8a8a] hover:bg-[#ff4d4d]/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body with Cockpit Sidebar & Content */}
      <LiveAssignmentBanner />
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Cockpit Controls Sidebar */}
        <aside className="w-full md:w-60 lg:w-64 bg-[#040F1C]/70 border-r border-[#00B8E6]/20 p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="text-[10px] font-bold tracking-[0.12em] text-[#8EADC7] uppercase mb-3 px-2 font-display">
              COCKPIT CONTROLS
            </div>

            <nav className="space-y-1.5">
              {/* Ambulance Dashboard */}
              <button
                type="button"
                id="nav-ambulance-dashboard-btn"
                onClick={() => navigateTo('dashboard')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold font-display tracking-wide transition-all cursor-pointer ${
                  currentRoute === 'dashboard'
                    ? 'bg-[#00D4FF] text-[#081321] shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                    : 'text-[#8EADC7] hover:text-white hover:bg-[#0B1F36]/60'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="text-left">Ambulance Dashboard</span>
              </button>

              {/* Assignment & Navigation */}
              <button
                type="button"
                id="nav-assignment-nav-btn"
                onClick={() => navigateTo('assignment')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold font-display tracking-wide transition-all cursor-pointer ${
                  currentRoute === 'assignment'
                    ? 'bg-[#00D4FF] text-[#081321] shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                    : 'text-[#8EADC7] hover:text-white hover:bg-[#0B1F36]/60'
                }`}
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span className="text-left">Assignment & Navigation</span>
              </button>

              {/* Incident Log (Completed Tasks) */}
              <button
                type="button"
                id="nav-incident-log-btn"
                onClick={() => navigateTo('incidents')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold font-display tracking-wide transition-all cursor-pointer ${
                  currentRoute === 'incidents'
                    ? 'bg-[#00D4FF] text-[#081321] shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                    : 'text-[#8EADC7] hover:text-white hover:bg-[#0B1F36]/60'
                }`}
              >
                <History className="w-4 h-4 shrink-0" />
                <span className="text-left">Incident Log</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer Telemetry Status */}
          <div className="pt-4 border-t border-[#00B8E6]/20 space-y-2 mt-6">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8EADC7] font-display font-semibold">CAD LINK</span>
              <span className="text-[#00D4FF] font-bold">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8EADC7] font-display font-semibold">GPS LOCK</span>
              <span className="text-white font-bold">{data.gpsLock}</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Screen View */}
        <main className="flex-1 flex flex-col bg-[#081321] overflow-y-auto">
          <LiveAmbulanceOverview />
        </main>
      </div>
    </div>
  );
}

