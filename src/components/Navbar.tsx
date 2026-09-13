import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  CheckCircle2,
  Scale,
  LogIn,
  ChevronDown,
  ExternalLink,
  SlidersHorizontal,
  Brain,
  Route,
} from 'lucide-react';
import { useResQNova } from '../context/ResQNovaContext';
import { LoginModal } from './LoginModal';
import { UserRole } from '../types';

interface NavbarProps {
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

export const Navbar: React.FC<NavbarProps> = ({ onOpenSimulationModal }) => {
  const {
    activePath,
    navigate,
    currentRole,
    switchRole,
    resetScenario,
    state,
  } = useResQNova();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false);
  const fieldMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fieldMenuRef.current && !fieldMenuRef.current.contains(e.target as Node)) {
        setFieldMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSosCount = state?.citizen_requests.filter((r) => r.status !== 'completed').length || 0;
  const criticalCount = state?.citizen_requests.filter((r) => r.risk_level === 'Critical' && r.status !== 'completed').length || 0;

  // ---------------------------------------------------------------------------
  // ROLE-SCOPED NAVIGATION DEFINITIONS
  // Citizens only see citizen tools; Field units see their respective operations;
  // Incident Commander sees high-level command modules + field access dropdown.
  // ---------------------------------------------------------------------------
  const roleNavConfigs: Record<UserRole, {
    modeLabel: string;
    modeDescription: string;
    modeBadgeClass: string;
    landingPath: string;
    links: NavLinkItem[];
  }> = {
    citizen: {
      modeLabel: 'Citizen Resident Mode',
      modeDescription: 'Public safety, SOS rescue & safe shelter routing',
      modeBadgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      landingPath: '/citizen',
      links: [
        { path: '/citizen', label: 'Citizen SOS', icon: LifeBuoy, badge: activeSosCount > 0 ? activeSosCount : undefined, hint: 'Submit emergency request & track rescue' },
        { path: '/evacuation-planner', label: 'Safe Evac Routes', icon: MapPin, hint: 'Turn-by-turn dry routes to shelters' },
        { path: '/shelter', label: 'Relief Shelters', icon: Building2, hint: 'Dry camps with beds and meals' },
        { path: '/hospital', label: 'Emergency Hospitals', icon: Stethoscope, hint: 'Trauma & medical centers' },
      ],
    },
    rescue: {
      modeLabel: 'Rescue Squad Mode',
      modeDescription: 'NDRF boat operations, extraction waypoints & live squad telemetry',
      modeBadgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      landingPath: '/rescue',
      links: [
        { path: '/rescue', label: 'Rescue Terminal', icon: Radio, badge: activeSosCount > 0 ? activeSosCount : undefined, hint: 'Zodiac boat staging & casualty extraction' },
        { path: '/evacuation-planner', label: 'Tactical Evac Map', icon: MapPin, hint: 'Flood depth & backwater routes' },
        { path: '/shelter', label: 'Drop-off Shelters', icon: Building2, hint: 'Camp capacities for survivor drop-off' },
        { path: '/hospital', label: 'Trauma Hospitals', icon: Stethoscope, hint: 'Handoff points for critical casualties' },
        { path: '/resolved-operations', label: 'Mission Logs', icon: CheckCircle2, hint: 'Completed rescue history' },
      ],
    },
    ambulance: {
      modeLabel: '108 Ambulance Mode',
      modeDescription: 'ALS transit, patient vitals & trauma hospital green corridor routing',
      modeBadgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
      landingPath: '/ambulance',
      links: [
        { path: '/ambulance', label: '108 Ambulance Unit', icon: HeartPulse, badge: criticalCount > 0 ? criticalCount : undefined, hint: 'Trauma dispatch & ALS patient transit' },
        { path: '/hospital', label: 'Hospital Trauma Bay', icon: Stethoscope, hint: 'ICU ventilator reservation & bed count' },
        { path: '/evacuation-planner', label: 'Green Corridors', icon: MapPin, hint: 'Cleared elevated highway bypasses' },
        { path: '/shelter', label: 'Shelter First-Aid', icon: Building2, hint: 'First-aid posts at relief camps' },
      ],
    },
    shelter: {
      modeLabel: 'Shelter Admin Mode',
      modeDescription: 'Relief camp headroom, survivor check-in & ration logistics',
      modeBadgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      landingPath: '/shelter',
      links: [
        { path: '/shelter', label: 'Shelter Operations', icon: Building2, hint: 'Live capacity gauge, gate intake & stocks' },
        { path: '/evacuation-planner', label: 'Evacuee Inflow Map', icon: MapPin, hint: 'Incoming evacuee movement corridors' },
        { path: '/hospital', label: 'Hospital Network', icon: Stethoscope, hint: 'Medical centers for sick refugees' },
      ],
    },
    hospital: {
      modeLabel: 'Hospital Trauma Mode',
      modeDescription: 'Emergency room surge, ICU ventilators & casualty bed management',
      modeBadgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      landingPath: '/hospital',
      links: [
        { path: '/hospital', label: 'Trauma & ICU Center', icon: Stethoscope, hint: 'ICU ventilators, triage beds & admissions' },
        { path: '/ambulance', label: 'Inbound 108 Fleet', icon: HeartPulse, badge: criticalCount > 0 ? criticalCount : undefined, hint: 'Ambulances en route with casualties' },
        { path: '/shelter', label: 'Relief Camp Network', icon: Building2, hint: 'Discharge to non-emergency camps' },
      ],
    },
    admin: {
      modeLabel: 'Incident Command Mode',
      modeDescription: 'District Collectorate command, dynamic graph routing & AI flood diagnostics',
      modeBadgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
      landingPath: '/dashboard',
      links: [
        { path: '/dashboard', label: 'Command Dashboard', icon: ShieldAlert, badge: activeSosCount > 0 ? activeSosCount : undefined, hint: 'Unified citywide tactical GIS command' },
        { path: '/ai-flood-predictor', label: 'AI Flood Predictor', icon: Brain, hint: 'Train AI models on datasets & impact staging' },
        { path: '/resource-planner', label: 'Resource Planner', icon: Cpu, hint: 'Priority queue & dynamic graph staging' },
        { path: '/evacuation-planner', label: 'Evac Planner', icon: MapPin, hint: 'Dynamic flood road closures & high ground' },
        { path: '/routing-operations', label: 'Routing Operations', icon: Route, hint: 'A* & D* Lite dynamic graph replanning' },
        { path: '/admin/ai-diagnostics', label: 'AI Diagnostics', icon: Zap, hint: 'Gemini multi-modal flood triage' },
        { path: '/resolved-operations', label: 'Resolved History', icon: CheckCircle2, hint: 'Citywide audit log of completed missions' },
      ],
    },
  };

  const currentNavConfig = roleNavConfigs[currentRole] || roleNavConfigs.admin;
  const navLinks = currentNavConfig.links;

  // Field terminals available in dropdown for Admin
  const adminFieldTerminals = [
    { path: '/citizen', label: 'Citizen SOS Portal', roleKey: 'citizen' as UserRole, icon: LifeBuoy, desc: 'Public SOS submission & evac view' },
    { path: '/rescue', label: 'NDRF Rescue Squad Terminal', roleKey: 'rescue' as UserRole, icon: Radio, desc: 'Boat extractions & waterborne telemetry' },
    { path: '/ambulance', label: '108 Ambulance Terminal', roleKey: 'ambulance' as UserRole, icon: HeartPulse, desc: 'Critical trauma patient transit' },
    { path: '/shelter', label: 'Relief Shelter Terminal', roleKey: 'shelter' as UserRole, icon: Building2, desc: 'Refugee intake & camp headroom' },
    { path: '/hospital', label: 'Trauma Hospital Terminal', roleKey: 'hospital' as UserRole, icon: Stethoscope, desc: 'Apex ER bed surge & ICU allocation' },
  ];

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetScenario();
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(currentNavConfig.landingPath)}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-white">ResQNova</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${currentNavConfig.modeBadgeClass}`}>
                    {currentRole.toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 -mt-0.5 truncate max-w-[210px] sm:max-w-none">
                  {currentNavConfig.modeDescription}
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links (Scoped specifically to the active role) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activePath === link.path;
              return (
                <button
                  key={link.path}
                  id={`nav-link-${link.path.replace('/', '').replace('/', '-') || 'home'}`}
                  onClick={() => navigate(link.path)}
                  title={link.hint}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin only: Dropdown to inspect field worker terminals without cluttering the bar */}
            {currentRole === 'admin' && (
              <div className="relative ml-1" ref={fieldMenuRef}>
                <button
                  id="btn-admin-field-terminals"
                  onClick={() => setFieldMenuOpen(!fieldMenuOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    fieldMenuOpen
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-slate-800'
                  }`}
                  title="View Field Unit Terminals (Rescue Squad, 108 Ambulance, Shelters, Hospitals, Citizen SOS)"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Field Terminals</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${fieldMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {fieldMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Field Unit Terminals
                    </div>
                    {adminFieldTerminals.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activePath === item.path;
                      return (
                        <button
                          key={item.path}
                          onClick={() => {
                            navigate(item.path);
                            setFieldMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-800 transition-colors cursor-pointer ${
                            isCurrent ? 'bg-blue-600/15 text-blue-300' : 'text-slate-200'
                          }`}
                        >
                          <Icon className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold text-white">{item.label}</div>
                            <div className="text-[10px] text-slate-400">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Action Tools */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Persona Switcher */}
            <button
              id="btn-open-login-modal"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 transition-all cursor-pointer"
              title="Change user login persona"
            >
              <LogIn className="h-3.5 w-3.5 text-blue-400" />
              <span>Switch Persona</span>
            </button>

            {/* End-to-End Simulation trigger */}
            <button
              id="btn-open-simulation-modal"
              onClick={onOpenSimulationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 hover:border-emerald-500/60 transition-all shadow-sm cursor-pointer"
              title="Execute full automated 19-step End-to-End lifecycle test"
            >
              <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>Simulate E2E Lifecycle</span>
            </button>

            {/* Reset Scenario */}
            <button
              id="btn-reset-scenario"
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              title="Reset initial Vijayawada flood scenario"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">Reset</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              id="btn-open-simulation-mobile"
              onClick={onOpenSimulationModal}
              className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold"
            >
              E2E Test
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {/* Persona banner on mobile */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Role</span>
              <span className="font-bold text-white">{currentNavConfig.modeLabel}</span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsLoginModalOpen(true);
              }}
              className="text-[11px] px-2 py-1 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40"
            >
              Switch Role
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activePath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* If admin, also show field links */}
          {currentRole === 'admin' && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Field Unit Terminals:
              </span>
              <div className="grid grid-cols-2 gap-1">
                {adminFieldTerminals.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 text-[11px] rounded bg-slate-950/80 text-slate-300 hover:text-white text-left truncate"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={() => {
                handleReset();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset Demo Scenario
            </button>
          </div>
        </div>
      )}

      {/* Role-Based Login & Persona Selection Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={(role) => {
          switchRole(role);
          setIsLoginModalOpen(false);
        }}
      />
    </header>
  );
};
