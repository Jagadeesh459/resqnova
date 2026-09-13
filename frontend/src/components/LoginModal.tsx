import React from 'react';
import {
  UserRole,
  UserProfile,
} from '../types';
import {
  ShieldAlert,
  LifeBuoy,
  Radio,
  HeartPulse,
  Building2,
  Stethoscope,
  Lock,
  Check,
  X,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { useResQNova } from '../context/ResQNovaContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
}

interface PersonaInfo {
  role: UserRole;
  title: string;
  name: string;
  agency: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  landingPage: string;
  keyFeatures: string[];
}

const PERSONAS: PersonaInfo[] = [
  {
    role: 'citizen',
    title: 'Citizen Resident Portal',
    name: 'P. Ramesh',
    agency: 'Krishna Lanka Resident (NTR District)',
    badge: 'PUBLIC CITIZEN',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: LifeBuoy,
    description: 'Distressed citizen requiring emergency SOS rescue, turn-by-turn safe shelter navigation, and real-time evacuation tracking bypassing flooded roads.',
    landingPage: '/citizen',
    keyFeatures: [
      'Big, uncluttered safe evacuation map',
      'Direct path from SOS to nearest safe shelter',
      'Automatic bypass of flooded roads & drainages',
      'Instant 1-Click SOS broadcast with live GPS',
    ],
  },
  {
    role: 'rescue',
    title: 'NDRF / SDRF Rescue Commander',
    name: 'Insp. Vikram Singh',
    agency: 'NDRF 10th Battalion (Boat Squad Alpha)',
    badge: 'FIELD COMMANDER',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Radio,
    description: 'Tactical field unit commander receiving prioritized citizen extractions, A* dynamic dispatch corridors, and squad deployment telemetry.',
    landingPage: '/rescue',
    keyFeatures: [
      'Live SOS triage queue with medical urgency',
      'A* dynamic graph dispatch corridors',
      'En-route, on-scene, and rescue completion controls',
      'Offline-capable survivor roster',
    ],
  },
  {
    role: 'ambulance',
    title: '108 Emergency Ambulance Medic',
    name: 'S. Koteswara Rao (EMT)',
    agency: 'Andhra Pradesh 108 ALS Ambulance #101',
    badge: '108 PARAMEDIC',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: HeartPulse,
    description: 'Critical patient transit medic coordinating rapid ICU/ventilator corridor navigation to Government General Hospital.',
    landingPage: '/ambulance',
    keyFeatures: [
      'Real-time ICU/Ventilator bed reservation',
      'Emergency green corridor road routing',
      'Oxygen & patient vitals reporting',
      'Direct radio patch to trauma center',
    ],
  },
  {
    role: 'shelter',
    title: 'Relief Shelter Camp Administrator',
    name: 'M. Anitha',
    agency: 'IGMC Stadium Emergency Relief Camp',
    badge: 'CAMP ADMIN',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Building2,
    description: 'Shelter warden managing refugee intake, available bed headroom, food/water stocks, and capacity evacuation streams.',
    landingPage: '/shelter',
    keyFeatures: [
      'Bed headroom & capacity tracker',
      'Food, water, and infant formula stocks',
      'Evacuee intake registration',
      'Dynamic evacuation stream coordination',
    ],
  },
  {
    role: 'admin',
    title: 'District Disaster Admin (DDMA Command)',
    name: 'Dr. K. Swaminathan, IAS',
    agency: 'District Collector & DM, NTR District',
    badge: 'DISTRICT MAGISTRATE',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: ShieldAlert,
    description: 'Supreme command authority overseeing all agencies, dynamic graph pre-positioning algorithms, AI triage, and citywide infrastructure status.',
    landingPage: '/dashboard',
    keyFeatures: [
      'All 11 command modules and GIS tactical layers',
      'Dynamic graph routing & resource optimization',
      'Citywide road closure & drainage management',
      'Gemini AI multi-modal disaster diagnostics',
    ],
  },
  {
    role: 'hospital',
    title: 'Trauma Hospital Superintendent',
    name: 'Dr. V. Prasad',
    agency: 'Government General Hospital (GGH) Vijayawada',
    badge: 'HOSPITAL CHIEF',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: Stethoscope,
    description: 'Apex medical trauma director coordinating casualty surge, ICU bed headroom, ventilator staging, and emergency medical triage.',
    landingPage: '/hospital',
    keyFeatures: [
      'Real-time ICU & ventilator capacity tracking',
      'Emergency casualty admission buffer',
      'Inbound 108 ambulance triage integration',
      'Discharge coordination to relief camps',
    ],
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentRole: propRole,
  onSelectRole,
}) => {
  const { currentRole: contextRole, switchRole, navigate } = useResQNova();
  const effectiveRole = propRole || contextRole;

  if (!isOpen) return null;

  const handleSelectPersona = (persona: PersonaInfo) => {
    try {
      if (onSelectRole) {
        onSelectRole(persona.role);
      } else {
        switchRole(persona.role);
      }
      navigate(persona.landingPage);
    } catch (e) {
      console.error('Error switching persona:', e);
      switchRole(persona.role);
      navigate(persona.landingPage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-900/60 text-blue-400 border border-blue-700/60 flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                ResQNova Identity & Role Gateway
              </h3>
              <p className="text-xs text-slate-400">
                Log in to a dedicated portal tailored strictly to your emergency responsibilities.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Persona Selection Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Select Your Active Persona:
          </div>

          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = effectiveRole === persona.role;

            return (
              <div
                key={persona.role}
                onClick={() => handleSelectPersona(persona)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/50 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">{persona.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${persona.badgeColor}`}>
                        {persona.badge}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      {persona.name} • <span className="text-slate-400">{persona.agency}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug max-w-xl">
                      {persona.description}
                    </p>

                    <div className="pt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                      {persona.keyFeatures.map((feat, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          <Check className="h-3 w-3 text-emerald-400" />
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPersona(persona);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{isSelected ? 'Active Portal' : 'Login Here'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Your login role determines navigation and map view complexity automatically.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
