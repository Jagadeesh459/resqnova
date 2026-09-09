import React, { useState } from 'react';
import { LeafletEvacMap } from './LeafletEvacMap';
import { Link } from '../../lib/router';
import {
  Satellite,
  ShieldCheck,
  Radio,
  Timer,
  Ruler,
  Compass,
  Navigation,
  Volume2,
  VolumeX,
  Download,
  Check,
  Hospital,
  Zap,
  Footprints,
  Info,
  X,
  ChevronRight,
  AlertTriangle,
  Locate,
  MapPin,
  Layers,
  Sparkles,
} from 'lucide-react';

export const SafeRoutePage: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState<'elevated' | 'highground'>('elevated');
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);
  const [activeWaypoint, setActiveWaypoint] = useState<number | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleRouteSelect = (type: 'elevated' | 'highground') => {
    setSelectedRoute(type);
    if (type === 'elevated') {
      showToast('Optimal Safe Route Active', 'Selected: MG Elevated Highway (Dry & Clear).');
      if (isVoiceActive && 'speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance('Optimal route selected. Follow MG Elevated Highway.');
        window.speechSynthesis.speak(msg);
      }
    } else {
      showToast('Alternate High Ground Selected', 'Selected: North Ridge Trail (+6 min travel time).');
      if (isVoiceActive && 'speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance('Alternate high ground route selected.');
        window.speechSynthesis.speak(msg);
      }
    }
  };

  const toggleVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVoiceActive((prev) => {
      const next = !prev;
      if (next) {
        showToast('Navigation Voice Engine', 'Spoken safety cues enabled in Telugu & English.');
        if ('speechSynthesis' in window) {
          const msg = new SpeechSynthesisUtterance('Voice guidance enabled. Follow elevated corridor.');
          window.speechSynthesis.speak(msg);
        }
      } else {
        showToast('Navigation Voice Muted', 'Audio alerts disabled.');
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      }
      return next;
    });
  };

  const startNavigation = () => {
    showToast('Turn-by-Turn Activated', 'Proceed 350m toward Benz Circle Flyover Ramp.');
    if (isVoiceActive && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('Proceed 350 meters toward Benz Circle Flyover Ramp.');
      window.speechSynthesis.speak(msg);
    }
  };

  const downloadMeshMap = () => {
    showToast('Offline Route Map Synced', '1.4MB high-res vector package stored to device cache.');
  };

  return (
    <main className="w-full pt-20 bg-[#091422] min-h-[calc(100vh-80px)] text-[#d8e3f7] flex flex-col">
      {/* Top Breadcrumb & Page Header */}
      <div className="border-b border-[#3c494e]/25 bg-[#0d1827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-5 flex flex-col gap-3">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-[#859398]">
            <Link href="/citizen" className="hover:text-[#00d4ff] transition-colors">
              Citizen Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#d8e3f7] font-semibold">Safe Route Navigation</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl sm:text-3xl text-[#d8e3f7] tracking-tight">
                  Safe Evacuation Corridors
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#4ae183]/15 text-[#4ae183] text-xs font-bold uppercase tracking-wider border border-[#4ae183]/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4ae183] animate-pulse" />
                  Live Clearance: Optimal
                </span>
              </div>
              <p className="text-sm text-[#bbc9cf] mt-1 max-w-2xl">
                Real-time elevated bypass paths and IoT flood sensor telemetry avoiding Eluru Canal spillover.
              </p>
            </div>

            {/* Quick System Telemetry Status */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202b39] border border-[#3c494e]/30 text-[#bbc9cf]">
                <Satellite className="w-4 h-4 text-[#00d4ff]" />
                <span>42 Sensors Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202b39] border border-[#3c494e]/30 text-[#4ae183]">
                <ShieldCheck className="w-4 h-4" />
                <span>Civil Defense Approved</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202b39] border border-[#3c494e]/30 text-[#a8e8ff]">
                <Radio className="w-4 h-4 text-[#00d4ff]" />
                <span>Mesh Sync: Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 w-full flex-1 flex flex-col gap-6">
        {/* Route Mode Switcher Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            id="btn-route-elevated"
            type="button"
            onClick={() => handleRouteSelect('elevated')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
              selectedRoute === 'elevated'
                ? 'bg-[#182638] border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.15)] ring-1 ring-[#00d4ff]'
                : 'bg-[#111c2a] border-[#3c494e]/30 hover:border-[#3c494e]/60 hover:bg-[#162232]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  selectedRoute === 'elevated'
                    ? 'bg-[#00d4ff] text-[#003642]'
                    : 'bg-[#202b39] text-[#bbc9cf]'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#d8e3f7]">
                    MG Elevated Corridor
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4ae183]/15 text-[#4ae183] text-[11px] font-bold">
                    Optimal
                  </span>
                </div>
                <p className="text-xs text-[#bbc9cf] mt-0.5">
                  1.4 km • 12 mins walk • Continuous +11.4m elevated dry viaduct
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-[#4ae183] block">100% Dry</span>
              <span className="text-[11px] text-[#859398]">0.0 cm water</span>
            </div>
          </button>

          <button
            id="btn-route-highground"
            type="button"
            onClick={() => handleRouteSelect('highground')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
              selectedRoute === 'highground'
                ? 'bg-[#182638] border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.15)] ring-1 ring-[#00d4ff]'
                : 'bg-[#111c2a] border-[#3c494e]/30 hover:border-[#3c494e]/60 hover:bg-[#162232]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  selectedRoute === 'highground'
                    ? 'bg-[#00d4ff] text-[#003642]'
                    : 'bg-[#202b39] text-[#bbc9cf]'
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#d8e3f7]">
                    North Ridge Alternative
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#202b39] text-[#bbc9cf] text-[11px] font-bold">
                    Secondary
                  </span>
                </div>
                <p className="text-xs text-[#bbc9cf] mt-0.5">
                  2.1 km • 18 mins walk • High-ground ridge line (+6 min extra)
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-[#00d4ff] block">High Ground</span>
              <span className="text-[11px] text-[#859398]">Natural Ridge</span>
            </div>
          </button>
        </div>

        {/* 12-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Framed Compact Map + Elevation Profile (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Framed Interactive Evacuation Map Card */}
            <div className="rounded-2xl bg-[#111c2a] border border-[#3c494e]/30 shadow-xl overflow-hidden flex flex-col">
              {/* Map Header */}
              <div className="px-5 py-3.5 bg-[#16202f] border-b border-[#3c494e]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-ping" />
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7]">
                    Evacuation Path GIS Topography
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#091422] text-[#859398] font-mono hidden sm:inline">
                    CartoDB Dark
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast('Oriented to True North', 'Map calibrated.')}
                    className="p-1.5 rounded-lg bg-[#202b39] hover:bg-[#2f3a49] text-[#bbc9cf] hover:text-[#d8e3f7] transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Reset Orientation"
                  >
                    <Compass className="w-4 h-4 text-[#00d4ff]" />
                    <span className="hidden sm:inline">North</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('GPS Relayed', 'Centered on Benz Circle origin.')}
                    className="p-1.5 rounded-lg bg-[#202b39] hover:bg-[#2f3a49] text-[#bbc9cf] hover:text-[#d8e3f7] transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Center Location"
                  >
                    <Locate className="w-4 h-4 text-[#4ae183]" />
                    <span className="hidden sm:inline">Recenter</span>
                  </button>
                </div>
              </div>

              {/* The Map Surface - Beautifully framed, compact height */}
              <div className="relative w-full h-[360px] sm:h-[400px] bg-[#040f1c]">
                <LeafletEvacMap
                  selectedRoute={selectedRoute}
                  className="w-full h-full"
                  zoomLevel={14}
                  onMarkerClick={(name, desc) => showToast(name, desc)}
                />

                {/* Map Floating Legend at bottom */}
                <div className="absolute bottom-3 left-3 right-3 z-[400] pointer-events-none flex flex-wrap items-center justify-between gap-2">
                  <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-[#091422]/90 backdrop-blur-md border border-[#3c494e]/40 shadow-lg flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 text-[#d8e3f7]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" />
                      Safe Corridor
                    </span>
                    <span className="flex items-center gap-1.5 text-[#ffb4ab]">
                      <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-[#ffb4ab] bg-[#93000a]/40" />
                      Flood Hazard Area
                    </span>
                    <span className="flex items-center gap-1.5 text-[#4ae183]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4ae183]" />
                      Shelter
                    </span>
                  </div>

                  <div className="pointer-events-auto px-2.5 py-1 rounded-lg bg-[#091422]/90 backdrop-blur-md border border-[#3c494e]/30 text-[10px] text-[#859398] hidden sm:block">
                    Click markers for waypoint info
                  </div>
                </div>
              </div>

              {/* Directly integrated under-map telemetry stats strip */}
              <div className="p-4 bg-[#141e2c] border-t border-[#3c494e]/30 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#0d1622] border border-[#3c494e]/20 text-center">
                  <span className="text-[11px] text-[#bbc9cf] block uppercase tracking-wider font-semibold">
                    Water Level
                  </span>
                  <span className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[#4ae183] mt-0.5 block">
                    0.0 cm
                  </span>
                  <span className="text-[10px] text-[#6bfe9c]">100% Dry Deck</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0d1622] border border-[#3c494e]/20 text-center">
                  <span className="text-[11px] text-[#bbc9cf] block uppercase tracking-wider font-semibold">
                    Corridor Elevation
                  </span>
                  <span className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[#00d4ff] mt-0.5 block">
                    +11.4 m
                  </span>
                  <span className="text-[10px] text-[#a8e8ff]">Above Surge Line</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0d1622] border border-[#3c494e]/20 text-center">
                  <span className="text-[11px] text-[#bbc9cf] block uppercase tracking-wider font-semibold">
                    Canal Hazard
                  </span>
                  <span className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[#d8e3f7] mt-0.5 block">
                    Bypassed
                  </span>
                  <span className="text-[10px] text-[#859398]">Upper Viaduct</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0d1622] border border-[#3c494e]/20 text-center">
                  <span className="text-[11px] text-[#bbc9cf] block uppercase tracking-wider font-semibold">
                    Telemetry Relay
                  </span>
                  <span className="text-lg font-['Plus_Jakarta_Sans'] font-bold text-[#4ae183] mt-0.5 block">
                    SN-04 Online
                  </span>
                  <span className="text-[10px] text-[#859398]">Updated 14s ago</span>
                </div>
              </div>
            </div>

            {/* Why This Route is Safe: Elevation Cross-Section Reassurance */}
            <div className="p-5 rounded-2xl bg-[#111c2a] border border-[#3c494e]/30 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#4ae183]" />
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7]">
                    Why MG Elevated Corridor is 100% Safe
                  </span>
                </div>
                <span className="text-xs text-[#00d4ff] font-semibold">Safety Assurance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#091422] border border-[#3c494e]/20 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffb4ab] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
                      Surface Road Level (Avoid)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#93000a]/30 text-[#ffb4ab] font-bold">
                      Submerged
                    </span>
                  </div>
                  <p className="text-xs text-[#bbc9cf]">
                    Eluru Canal overflow has caused 1.4m of standing water on low-lying ground roads. Vehicular and pedestrian traffic is closed.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#091422] border border-[#4ae183]/30 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4ae183] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#4ae183]" />
                      MG Elevated Viaduct (Selected)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#4ae183]/20 text-[#4ae183] font-bold">
                      100% Passable
                    </span>
                  </div>
                  <p className="text-xs text-[#bbc9cf]">
                    The elevated bridge deck is elevated +11.4 meters above ground, completely clear of water, with continuous solar lighting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Evacuation Action Panel & Turn-by-Turn Steps (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Action Card: Journey Summary & Primary CTAs */}
            <div className="p-6 rounded-2xl bg-[#111c2a] border border-[#3c494e]/30 shadow-xl flex flex-col gap-5">
              {/* Route Endpoints Brief */}
              <div className="p-4 rounded-xl bg-[#16202f] border border-[#3c494e]/30 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#859398] font-bold">
                    Evacuation Corridor
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4ae183]/15 text-[#4ae183] text-xs font-bold">
                    Verified Dry
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#00d4ff] ring-4 ring-[#00d4ff]/20 shrink-0" />
                    <div>
                      <span className="font-bold text-[#d8e3f7] block">Start: Benz Circle Flyover</span>
                      <span className="text-xs text-[#859398]">Origin Point • Ascend approach ramp</span>
                    </div>
                  </div>

                  <div className="ml-1.5 pl-3.5 border-l-2 border-dashed border-[#3c494e]/60 py-1 text-xs text-[#00d4ff] flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>via MG Elevated Viaduct Bypass</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#4ae183] ring-4 ring-[#4ae183]/20 shrink-0" />
                    <div>
                      <span className="font-bold text-[#d8e3f7] block">Destination: Municipal Hall Shelter</span>
                      <span className="text-xs text-[#4ae183]">412 Slots Open • Hot meals & medics</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Prominent Stat Metric Chips */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-[#182433] border border-[#3c494e]/25 flex flex-col items-center">
                  <Timer className="w-4 h-4 text-[#00d4ff] mb-1" />
                  <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#d8e3f7]">
                    {selectedRoute === 'elevated' ? '12' : '18'}
                  </span>
                  <span className="text-[10px] text-[#bbc9cf] uppercase font-bold tracking-wider">
                    Mins Walk
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#182433] border border-[#3c494e]/25 flex flex-col items-center">
                  <Ruler className="w-4 h-4 text-[#4ae183] mb-1" />
                  <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#d8e3f7]">
                    {selectedRoute === 'elevated' ? '1.4' : '2.1'}
                  </span>
                  <span className="text-[10px] text-[#bbc9cf] uppercase font-bold tracking-wider">
                    Kilometers
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#182433] border border-[#3c494e]/25 flex flex-col items-center">
                  <Footprints className="w-4 h-4 text-[#6bfe9c] mb-1" />
                  <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#6bfe9c]">
                    100%
                  </span>
                  <span className="text-[10px] text-[#bbc9cf] uppercase font-bold tracking-wider">
                    Dry Path
                  </span>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  id="btn-start-navigation"
                  onClick={startNavigation}
                  className="w-full h-13 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-base flex items-center justify-between px-5 hover:bg-[#3cd7ff] transition-all shadow-lg shadow-[#00d4ff]/25 active:scale-[0.98] cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Navigation className="w-5 h-5" />
                    <span>Start Turn-by-Turn</span>
                  </span>

                  <span
                    onClick={toggleVoice}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#003642]/20 hover:bg-[#003642]/30 text-[#003642] text-xs font-bold cursor-pointer transition-colors"
                    title="Toggle audio speech cues"
                  >
                    {isVoiceActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>{isVoiceActive ? 'Voice ON' : 'Muted'}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={downloadMeshMap}
                  className="w-full h-11 rounded-xl bg-[#202b39] text-[#a8e8ff] hover:bg-[#2f3a49] hover:text-[#d8e3f7] text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#3c494e]/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Offline Vector Map (Mesh Sync)</span>
                </button>
              </div>

              {/* Local Mesh Cache Status */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d1622] text-[#bbc9cf] text-xs border border-[#3c494e]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4ae183]" />
                  <span>Local Mesh Relay #VJA-88</span>
                </div>
                <span className="text-[#4ae183] font-semibold">100% Cached (Works Offline)</span>
              </div>
            </div>

            {/* Turn-by-Turn Direction Sequence Card */}
            <div className="p-6 rounded-2xl bg-[#111c2a] border border-[#3c494e]/30 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#d8e3f7]">
                    Step-by-Step Directions
                  </h2>
                  <p className="text-xs text-[#859398]">3 verified checkpoints to shelter</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#00d4ff]/15 text-[#00d4ff] font-bold">
                  Active Guidance
                </span>
              </div>

              <div className="relative flex flex-col gap-3.5 mt-1">
                {/* Continuous Glowing Vertical Connector */}
                <div className="absolute left-4 top-5 bottom-6 w-0.5 bg-gradient-to-b from-[#00d4ff] via-[#3cd7ff] to-[#4ae183]" />

                {/* Step 1 */}
                <div
                  className={`relative flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer border ${
                    activeWaypoint === 1
                      ? 'bg-[#182638] border-[#00d4ff]'
                      : 'bg-[#16202f] border-[#3c494e]/25 hover:bg-[#1a2636]'
                  }`}
                  onClick={() => {
                    setActiveWaypoint(1);
                    showToast('Step 1: Benz Circle Ramp', 'Ascend ramp to reach elevated dry viaduct.');
                  }}
                >
                  <div className="relative z-10 w-8 h-8 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                    1
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7] truncate">
                        Ascend Benz Circle Ramp
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#4ae183]/15 text-[#4ae183] text-[11px] font-bold shrink-0">
                        Passable
                      </span>
                    </div>
                    <p className="text-xs text-[#bbc9cf]">
                      Head northeast onto MG Elevated corridor. Do not take ground-level service road.
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[#859398] text-xs">
                      <Navigation className="w-3.5 h-3.5 text-[#00d4ff]" />
                      <span>350 meters • Elevated +8m</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  className={`relative flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer border ${
                    activeWaypoint === 2
                      ? 'bg-[#182638] border-[#00d4ff]'
                      : 'bg-[#16202f] border-[#3c494e]/25 hover:bg-[#1a2636]'
                  }`}
                  onClick={() => {
                    setActiveWaypoint(2);
                    showToast('Step 2: Canal Overpass', 'Remain on upper viaduct above Eluru flood line.');
                  }}
                >
                  <div className="relative z-10 w-8 h-8 rounded-full bg-[#202b39] text-[#d8e3f7] border border-[#00d4ff]/40 flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                    2
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7] truncate">
                        Bypass Canal Breach
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#4ae183]/15 text-[#4ae183] text-[11px] font-bold shrink-0">
                        Risk Bypassed
                      </span>
                    </div>
                    <p className="text-xs text-[#bbc9cf]">
                      Remain on elevated viaduct past Eluru Canal crossing. Canal below is submerged 1.4m.
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[#4ae183] text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sensor SN-04: Dry Path Confirmed</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  className={`relative flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer border ${
                    activeWaypoint === 3
                      ? 'bg-[#182638] border-[#4ae183]'
                      : 'bg-[#16202f] border-[#4ae183]/30 hover:bg-[#1a2636]'
                  }`}
                  onClick={() => {
                    setActiveWaypoint(3);
                    showToast('Destination: Municipal Hall', 'Arrival shelter with 412 open slots.');
                  }}
                >
                  <div className="relative z-10 w-8 h-8 rounded-full bg-[#4ae183] text-[#003919] flex items-center justify-center font-bold text-sm shrink-0 shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7] truncate">
                        Arrive: Municipal Shelter
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#06bb63] text-[#00431f] text-[11px] font-bold shrink-0">
                        Open
                      </span>
                    </div>
                    <p className="text-xs text-[#bbc9cf]">
                      Descend Gate 2 Ramp directly into protected municipal relief compound.
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="flex items-center gap-1 text-[#4ae183]">
                        <Hospital className="w-3.5 h-3.5" /> First Aid Station
                      </span>
                      <span className="flex items-center gap-1 text-[#00d4ff]">
                        <Zap className="w-3.5 h-3.5" /> Power Backup
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Civil Defense Field Notice */}
              <div className="p-3.5 rounded-xl bg-[#091422] border border-[#3c494e]/25 text-xs text-[#bbc9cf] flex items-start gap-2.5 mt-1">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <p>
                  Keep footwear on at all times. In case of localized crowding on ramps, follow NDRF marshals stationed at Pillar 14.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Interactive Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-5 py-3 rounded-2xl bg-[#202b39]/95 backdrop-blur-xl shadow-2xl flex items-center gap-3.5 text-[#d8e3f7] border border-[#00d4ff]/40">
            <div className="w-8 h-8 rounded-full bg-[#4ae183]/20 text-[#4ae183] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] font-bold text-sm">{toastMessage.title}</p>
              <p className="text-xs text-[#bbc9cf]">{toastMessage.desc}</p>
            </div>
            <button
              type="button"
              className="text-[#bbc9cf] hover:text-[#d8e3f7] ml-2 cursor-pointer"
              onClick={() => setToastMessage(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
