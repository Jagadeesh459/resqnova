import React, { useState } from 'react';
import {
  ShieldAlert,
  Radio,
  RefreshCw,
  Zap,
  MapPin,
  Menu,
  X,
  PlayCircle,
  Building2,
  Stethoscope,
  HeartPulse,
  LifeBuoy,
  Cpu,
  CheckCircle2,
  Scale,
  LogIn,
  SlidersHorizontal,
  Brain,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useResQNova } from '../context/ResQNovaContext';
import { LoginModal } from './LoginModal';
import { UserRole } from '../types';

interface SidebarProps {
  onOpenSimulationModal: () => void;
}

interface NavLinkItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  hint?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSimulationModal }) => {
  const {
    activePath,
    navigate,
    currentRole,
    switchRole,
    resetScenario,
    state,
  } = useResQNova();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [fieldTerminalsOpen, setFieldTerminalsOpen] = useState(false);

  const activeSosCount = state?.citizen_requests.filter((r) => r.status !== 'completed').length || 0;
  const criticalCount = state?.citizen_requests.filter((r) => r.risk_level === 'Critical' && r.status !== 'completed').length || 0;

  // Role-scoped navigation definitions
  const roleNavConfigs: Record<UserRole, {
    modeLabel: string;
    modeDescription: string;
    modeBadgeClass: string;
    landingPath: string;
    sectionTitle: string;
    links: NavLinkItem[];
  }> = {
    citizen: {
      modeLabel: 'Citizen Mode',
      modeDescription: 'Public safety & SOS routing',
      modeBadgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      landingPath: '/citizen',
      sectionTitle: 'Citizen Safety',
      links: [
        { path: '/citizen', label: 'Citizen SOS', icon: LifeBuoy, badge: activeSosCount > 0 ? activeSosCount : undefined, hint: 'Submit emergency request & track rescue' },
        { path: '/evacuation-planner', label: 'Safe Evac Routes', icon: MapPin, hint: 'Turn-by-turn dry routes to shelters' },
        { path: '/shelter', label: 'Relief Shelters', icon: Building2, hint: 'Dry camps with beds and meals' },
        { path: '/hospital', label: 'Emergency Hospitals', icon: Stethoscope, hint: 'Trauma & medical centers' },
      ],
    },
    rescue: {
      modeLabel: 'Rescue Squad',
      modeDescription: 'NDRF boat ops & casualty extraction',
      modeBadgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      landingPath: '/rescue',
      sectionTitle: 'Field Rescue',
      links: [
        { path: '/rescue', label: 'Rescue Terminal', icon: Radio, badge: activeSosCount > 0 ? activeSosCount : undefined, hint: 'Zodiac boat staging & casualty extraction' },
        { path: '/evacuation-planner', label: 'Tactical Evac Map', icon: MapPin, hint: 'Flood depth & backwater routes' },
        { path: '/shelter', label: 'Drop-off Shelters', icon: Building2, hint: 'Camp capacities for survivor drop-off' },
        { path: '/hospital', label: 'Trauma Hospitals', icon: Stethoscope, hint: 'Handoff points for critical casualties' },
        { path: '/resolved-operations', label: 'Mission Logs', icon: CheckCircle2, hint: 'Completed rescue history' },
      ],
    },
    ambulance: {
      modeLabel: '108 Ambulance',
      modeDescription: 'ALS transit & hospital green corridors',
      modeBadgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      landingPath: '/ambulance',
      sectionTitle: 'Paramedic Operations',
      links: [
        { path: '/ambulance', label: '108 Ambulance Unit', icon: HeartPulse, badge: criticalCount > 0 ? criticalCount : undefined, hint: 'Trauma dispatch & ALS patient transit' },
        { path: '/hospital', label: 'Hospital Trauma Bay', icon: Stethoscope, hint: 'ICU ventilator reservation & bed count' },
        { path: '/evacuation-planner', label: 'Green Corridors', icon: MapPin, hint: 'Cleared elevated highway bypasses' },
        { path: '/shelter', label: 'Shelter First-Aid', icon: Building2, hint: 'First-aid posts at relief camps' },
      ],
    },
    shelter: {
      modeLabel: 'Shelter Admin',
      modeDescription: 'Camp headroom, check-in & ration logistics',
      modeBadgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      landingPath: '/shelter',
      sectionTitle: 'Shelter Management',
      links: [
        { path: '/shelter', label: 'Shelter Operations', icon: Building2, hint: 'Live capacity gauge, gate intake & stocks' },
        { path: '/evacuation-planner', label: 'Evacuee Inflow Map', icon: MapPin, hint: 'Incoming evacuee movement corridors' },
        { path: '/hospital', label: 'Hospital Network', icon: Stethoscope, hint: 'Medical centers for sick refugees' },
      ],
    },
    hospital: {
      modeLabel: 'Hospital Trauma',
      modeDescription: 'Apex ER bed surge & ICU allocation',
      modeBadgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      landingPath: '/hospital',
      sectionTitle: 'Trauma & Emergency',
      links: [
        { path: '/hospital', label: 'Trauma & ICU Center', icon: Stethoscope, hint: 'ICU ventilators, triage beds & admissions' },
        { path: '/ambulance', label: 'Inbound 108 Fleet', icon: HeartPulse, badge: criticalCount > 0 ? criticalCount : undefined, hint: 'Ambulances en route with casualties' },
        { path: '/shelter', label: 'Relief Camp Network', icon: Building2, hint: 'Discharge to non-emergency camps' },
      ],
    },
    admin: {
      modeLabel: 'Incident Command',
      modeDescription: 'Collectorate command & flood diagnostics',
      modeBadgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
      landingPath: '/dashboard',
      sectionTitle: 'Command Modules',
      links: [
        { path: '/dashboard', label: 'Command Dashboard', icon: ShieldAlert, badge: activeSosCount > 0 ? activeSosCount : undefined, hint: 'Unified citywide tactical GIS command' },
        { path: '/ai-flood-predictor', label: 'AI Flood Predictor', icon: Brain, hint: 'Train AI models on datasets & quantum impact staging' },
        { path: '/resource-planner', label: 'Quantum Pre-Position', icon: Cpu, hint: 'QAOA & QUBO mathematical staging' },
        { path: '/evacuation-planner', label: 'Evac Planner', icon: MapPin, hint: 'Dynamic flood road closures & high ground' },
        { path: '/quantum-vs-classical', label: 'Quantum vs Classical', icon: Scale, hint: 'Statistical benchmarks & dynamic charts' },
        { path: '/admin/ai-diagnostics', label: 'AI Diagnostics', icon: Zap, hint: 'Gemini multi-modal flood triage' },
        { path: '/resolved-operations', label: 'Resolved History', icon: CheckCircle2, hint: 'Citywide audit log of completed missions' },
      ],
    },
  };

  const currentNavConfig = roleNavConfigs[currentRole] || roleNavConfigs.admin;

  const adminFieldTerminals = [
    { path: '/citizen', role: 'citizen' as UserRole, label: 'Citizen SOS Portal', icon: LifeBuoy, desc: 'Public SOS submission' },
    { path: '/rescue', role: 'rescue' as UserRole, label: 'NDRF Rescue Squad', icon: Radio, desc: 'Boat extractions & telemetry' },
    { path: '/ambulance', role: 'ambulance' as UserRole, label: '108 Ambulance Unit', icon: HeartPulse, desc: 'Trauma casualty transit' },
    { path: '/shelter', role: 'shelter' as UserRole, label: 'Relief Camp Shelter', icon: Building2, desc: 'Refugee intake & headroom' },
    { path: '/hospital', role: 'hospital' as UserRole, label: 'Apex Trauma Hospital', icon: Stethoscope, desc: 'ER bed surge & ICU' },
  ];

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetScenario();
    } finally {
      setResetting(false);
    }
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80">
        <button
          onClick={() => handleLinkClick(currentNavConfig.landingPath)}
          className="flex items-center gap-3 w-full text-left group cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ResQNova</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${currentNavConfig.modeBadgeClass}`}>
                {currentRole.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {currentNavConfig.modeDescription}
            </div>
          </div>
        </button>
      </div>

      {/* Vertical Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Section */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {currentNavConfig.sectionTitle}
          </div>
          <div className="space-y-1">
            {currentNavConfig.links.map((link) => {
              const Icon = link.icon;
              const isActive = activePath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  title={link.hint}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-bold animate-pulse">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Field Terminals Section */}
        {currentRole === 'admin' && (
          <div>
            <button
              onClick={() => setFieldTerminalsOpen(!fieldTerminalsOpen)}
              className="w-full flex items-center justify-between px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3 w-3 text-cyan-400" />
                <span>Field Terminals</span>
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform ${fieldTerminalsOpen ? 'rotate-180' : ''}`} />
            </button>

            {fieldTerminalsOpen && (
              <div className="space-y-1 mt-1 pl-1 animate-in fade-in duration-150">
                {adminFieldTerminals.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        switchRole(item.role);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="truncate font-medium">{item.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Action Tools / Footer */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
        {/* Switch Persona */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-200 transition-all cursor-pointer shadow-sm"
        >
          <LogIn className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>Switch Persona</span>
        </button>

        {/* Simulate E2E Lifecycle */}
        <button
          onClick={onOpenSimulationModal}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 transition-all cursor-pointer shadow-sm"
        >
          <PlayCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Simulate E2E Lifecycle</span>
        </button>

        {/* Reset Scenario */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Scenario'}</span>
        </button>
      </div>

      {/* Login / Persona Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={(role) => switchRole(role)}
      />
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-white">ResQNova</span>
          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${currentNavConfig.modeBadgeClass}`}>
            {currentRole.toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="p-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/40 text-xs font-semibold"
          title="Switch Persona"
        >
          <LogIn className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Vertical Left Sidebar (Persistent) */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 shrink-0 z-30 flex-col">
        {sidebarContent}
      </aside>
    </>
  );
};
