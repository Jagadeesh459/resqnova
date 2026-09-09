import React, { useState } from 'react';
import { useRouter, Link } from '../../lib/router';
import { LeafletEvacMap } from './LeafletEvacMap';
import {
  AlertTriangle,
  Navigation,
  House,
  CheckCircle,
  Phone,
  Droplets,
  Zap,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  ShieldCheck,
  Siren,
  Sparkles,
  Utensils,
  Footprints,
  Activity,
} from 'lucide-react';

export const CitizenHome: React.FC = () => {
  const router = useRouter();

  // Modal states
  const [isEvacModalOpen, setIsEvacModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [silentMode, setSilentMode] = useState(false);

  const handleSosTrigger = () => {
    setIsTransmitting(true);
    setIsSosModalOpen(true);
    if (!silentMode && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('Emergency beacon active. Coordinates transmitted to NDRF dispatch.');
      window.speechSynthesis.speak(msg);
    }
  };

  const toggleVoiceNav = () => {
    setIsVoiceActive((prev) => {
      const next = !prev;
      if (next && 'speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(
          'ResQNova navigation active. Head East along Benz Circle elevated corridor toward Municipal Community Hall. Stay off ground level underpasses.'
        );
        msg.rate = 1.0;
        window.speechSynthesis.speak(msg);
      } else if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  return (
    <main className="w-full pt-20 bg-[#091422] min-h-[calc(100vh-80px)] text-[#d8e3f7]">
      <div className="flex flex-col w-full">
        {/* Interactive Warning Banner */}
        <section className="w-full px-6 lg:px-12 pt-6 pb-4">
          <div className="max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#93000a]/90 via-[#202b39] to-[#111c2a] p-5 lg:p-6 shadow-2xl border border-[#ffb4ab]/30">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#ffb4ab]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#ffb4ab]/20 border border-[#ffb4ab]/30 flex items-center justify-center shrink-0 animate-pulse text-[#ffb4ab]">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffb4ab] text-[#690005] font-['Plus_Jakarta_Sans'] font-bold text-xs tracking-wider uppercase">
                        Flash Threat Level 3
                      </span>
                      <span className="text-xs text-[#bbc9cf] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping" />
                        Prakasam Barrage Inundation Spillover: 280,000 cusecs
                      </span>
                    </div>
                    <h1 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-[#d8e3f7]">
                      NTR District Vijayawada Low-Lying Zone Advisory
                    </h1>
                    <p className="text-xs sm:text-sm text-[#bbc9cf] max-w-2xl leading-relaxed">
                      Immediate evacuation advised for Krishna Canal edge wards. High water ingress in low corridors. Benz Circle to Municipal Hub designated safest elevated bypass.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                  <button
                    id="btn-quick-evac"
                    onClick={() => setIsEvacModalOpen(true)}
                    className="flex-1 sm:flex-initial h-13 px-5 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-[#3cd7ff] transition-all shadow-lg shadow-[#00d4ff]/25 cursor-pointer active:scale-95"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>Safe Evac Route (ETA 12m)</span>
                  </button>
                  <Link
                    href="/citizen/shelters"
                    id="btn-shelters-modal"
                    className="h-13 px-4 rounded-xl bg-[#2f3a49] text-[#d8e3f7] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3c494e] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <House className="w-4 h-4 text-[#00d4ff]" />
                    <span className="hidden sm:inline">14 Shelters Live</span>
                    <span className="sm:hidden">Shelters</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid View */}
        <section className="w-full px-6 lg:px-12 py-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Primary Wayfinding & Corridors (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Wayfinding Master Card */}
              <div className="rounded-xl bg-[#111c2a] p-6 shadow-xl border border-[#3c494e]/30 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#4ae183]/15 flex items-center justify-center text-[#4ae183]">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#4ae183] font-bold uppercase tracking-wider">
                        Confirmed Safe Waypoint
                      </span>
                      <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#d8e3f7]">
                        Dry Elevated Line 01
                      </h2>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#4ae183]/15 text-[#4ae183] text-xs font-semibold flex items-center gap-1.5 border border-[#4ae183]/30">
                    <span className="w-2 h-2 rounded-full bg-[#4ae183]" />
                    100% Dry Elevation
                  </div>
                </div>

                {/* Dynamic Sensor Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-[#16202f]">
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-[#202b39] text-center border border-[#3c494e]/20">
                    <span className="text-xs text-[#bbc9cf]">Road Inundation</span>
                    <span className="text-base sm:text-lg font-bold text-[#4ae183]">0 cm Dry</span>
                    <span className="text-[11px] text-[#4ae183]/80">Sensor #BR-12</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-[#202b39] text-center border border-[#3c494e]/20">
                    <span className="text-xs text-[#bbc9cf]">Distance to Haven</span>
                    <span className="text-base sm:text-lg font-bold text-[#00d4ff]">1.4 km</span>
                    <span className="text-[11px] text-[#bbc9cf]">12 min walk</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-[#202b39] text-center border border-[#3c494e]/20">
                    <span className="text-xs text-[#bbc9cf]">Traffic Load</span>
                    <span className="text-base sm:text-lg font-bold text-[#4ae183]">Light</span>
                    <span className="text-[11px] text-[#4ae183]/80">Patrolled</span>
                  </div>
                </div>

                {/* Interactive Waypoint Map Surface with Leaflet */}
                <div className="relative w-full h-80 rounded-lg overflow-hidden bg-[#040f1c] border border-[#3c494e]/40 shadow-inner">
                  <LeafletEvacMap
                    className="w-full h-full"
                    zoomLevel={14}
                    onMarkerClick={(name) => {
                      if (name.includes('Municipal')) setIsEvacModalOpen(true);
                    }}
                  />

                  {/* Route Nodes Live Banner Overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-[400]">
                    <div className="px-3 py-1.5 rounded-md bg-[#202b39]/95 backdrop-blur-md text-[#d8e3f7] flex items-center gap-2 shadow-lg border border-[#00d4ff]/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] animate-ping" />
                      <span className="text-xs font-semibold">GPS Track: Live Synchronized</span>
                    </div>
                  </div>

                  {/* Hazard Warning Pin */}
                  <div className="absolute bottom-16 right-4 sm:right-6 p-2.5 rounded-lg bg-[#93000a]/95 backdrop-blur text-[#ffdad7] flex items-center gap-2 shadow-lg border border-[#ffb4ab]/40 z-[400]">
                    <Droplets className="w-4 h-4 text-[#ffb4ab] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold leading-tight">Canal Spill Overpass</span>
                      <span className="text-[10px] text-[#ffb4ab] leading-tight">Blocked • 45cm Swell</span>
                    </div>
                  </div>

                  {/* Map Bottom Bar */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-[400] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded bg-[#091422]/95 text-[#a8e8ff] text-xs font-semibold backdrop-blur border border-[#3c494e]/40 truncate max-w-[220px] sm:max-w-none">
                        Benz Circle → High Street → Municipal Hall
                      </span>
                    </div>
                    <button
                      className="px-3.5 py-1.5 rounded bg-[#00d4ff] text-[#003642] text-xs font-bold flex items-center gap-1.5 shadow-lg hover:bg-[#3cd7ff] cursor-pointer transition-all active:scale-95 shrink-0"
                      onClick={() => setIsEvacModalOpen(true)}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Turn-by-Turn</span>
                    </button>
                  </div>
                </div>

                {/* Step Directions List Preview */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[#bbc9cf] text-xs font-bold uppercase tracking-wider px-1">
                    <span>ACTIVE CORRIDOR CHECKPOINTS</span>
                    <span className="text-[#4ae183] flex items-center gap-1.5 normal-case">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4ae183]" />
                      Civil Defense On-Site
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-[#16202f] border border-[#3c494e]/20 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-xs shrink-0">
                        1
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#d8e3f7]">Depart Benz Circle East</span>
                        <span className="text-xs text-[#bbc9cf] mt-0.5">
                          Stay on north elevated service flyover. Avoid storm drainage underpasses.
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#16202f] border border-[#3c494e]/20 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#06bb63] text-[#00431f] flex items-center justify-center font-bold text-xs shrink-0">
                        2
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#d8e3f7]">Municipal Quad Entrance</span>
                        <span className="text-xs text-[#bbc9cf] mt-0.5">
                          Gate 4 opened for citizens. Rapid medical intake &amp; pet accommodation active.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Designated Safe Hub & Instant SOS Action (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* SOS Beacon Instant Action Unit */}
              <div className="rounded-xl bg-gradient-to-b from-[#93000a]/35 via-[#111c2a] to-[#111c2a] p-6 shadow-2xl border border-[#ffb4ab]/30 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#ffb4ab] text-[#690005] flex items-center justify-center font-bold">
                      <Siren className="w-4 h-4" />
                    </div>
                    <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#ffb4ab]">
                      Emergency Distress Dispatch
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#ffb4ab]/20 text-[#ffdad7] uppercase font-bold tracking-wide">
                    Priority 01
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#d8e3f7] leading-relaxed">
                  Are you stranded, injured, or facing fast-rising water? Tap below to broadcast high-precision GPS coordinates directly to SDRF rescue boat teams.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    id="sos-trigger"
                    onClick={handleSosTrigger}
                    className="w-full h-16 rounded-xl bg-[#ffb4ab] text-[#690005] font-['Plus_Jakarta_Sans'] font-extrabold text-xl uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-[#ffdad6] active:scale-[0.98] transition-transform shadow-xl shadow-[#ffb4ab]/30 cursor-pointer"
                  >
                    <Siren className="w-7 h-7" />
                    <span>Transmit SOS Signal</span>
                  </button>

                  <div className="flex items-center justify-between px-2 pt-1 text-xs text-[#bbc9cf]">
                    <span className="flex items-center gap-1.5" id="beacon-status">
                      {isTransmitting ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping" />
                          <span className="text-[#ffb4ab] font-bold">TRANSMITTING CONTINUOUS SIGNAL</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-[#4ae183]" />
                          GPS Ready (Lat 16.5062, Lon 80.6480)
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      className="underline cursor-pointer hover:text-[#00d4ff]"
                      onClick={() => setSilentMode(!silentMode)}
                    >
                      {silentMode ? 'Silent: ON' : 'Silent Mode'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Designated Primary Shelter Card */}
              <div className="rounded-xl bg-[#111c2a] p-6 shadow-xl border border-[#3c494e]/30 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-[#4ae183] font-bold uppercase tracking-wider">
                      Primary Haven Station
                    </span>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#d8e3f7]">
                      Municipal Community Hall
                    </h3>
                    <span className="text-xs text-[#bbc9cf]">
                      Collectorate Compound, Bandar Road
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#06bb63]/20 text-[#6bfe9c] text-xs font-bold flex items-center gap-1 border border-[#06bb63]/30">
                    <ShieldCheck className="w-4 h-4" /> Safe &amp; Verified
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-[#16202f]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#d8e3f7]">Beds &amp; Shelter Space</span>
                    <span className="text-[#4ae183] font-bold">420 Available (of 800)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#2b3545] overflow-hidden">
                    <div className="h-full bg-[#4ae183] rounded-full" style={{ width: '52%' }} />
                  </div>
                  <span className="text-[11px] text-[#bbc9cf]">
                    Last verified by NDRF Liaison 4 minutes ago
                  </span>
                </div>

                {/* Provision Amenities Matrix */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#16202f] border border-[#3c494e]/20 flex items-center gap-2.5">
                    <Utensils className="w-5 h-5 text-[#00d4ff] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#d8e3f7]">Hot Meals</span>
                      <span className="text-[11px] text-[#bbc9cf]">Active dining hall</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#16202f] border border-[#3c494e]/20 flex items-center gap-2.5">
                    <Droplets className="w-5 h-5 text-[#00d4ff] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#d8e3f7]">RO Clean Water</span>
                      <span className="text-[11px] text-[#bbc9cf]">Continuous supply</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#16202f] border border-[#3c494e]/20 flex items-center gap-2.5">
                    <Activity className="w-5 h-5 text-[#00d4ff] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#d8e3f7]">Medical Bay</span>
                      <span className="text-[11px] text-[#bbc9cf]">2 doctors on-site</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#16202f] border border-[#3c494e]/20 flex items-center gap-2.5">
                    <Zap className="w-5 h-5 text-[#00d4ff] shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#d8e3f7]">Diesel Generator</span>
                      <span className="text-[11px] text-[#bbc9cf]">Continuous power</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="tel:08662577777"
                    className="flex-1 h-12 rounded-lg bg-[#2f3a49] text-[#d8e3f7] hover:bg-[#3c494e] flex items-center justify-center gap-2 text-sm font-semibold transition-colors border border-[#3c494e]/40"
                  >
                    <Phone className="w-4 h-4 text-[#00d4ff]" />
                    <span>Hub Helpline</span>
                  </a>

                  <Link
                    href="/citizen/safe-route"
                    className="flex-1 h-12 rounded-lg bg-[#06bb63] text-[#00431f] font-['Plus_Jakarta_Sans'] font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#4ae183] transition-colors shadow-md"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Direct Route</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Evacuation Route Modal */}
        {isEvacModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#040f1c]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-[#111c2a] p-6 shadow-2xl flex flex-col gap-4 border border-[#3c494e]/40 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#202b39]">
                <div className="flex items-center gap-3">
                  <Footprints className="w-7 h-7 text-[#00d4ff]" />
                  <div>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#d8e3f7]">
                      Dry Evacuation Corridor Navigation
                    </h3>
                    <span className="text-xs text-[#4ae183]">
                      Route Verified Clear • Zero Flood Obstacles
                    </span>
                  </div>
                </div>
                <button
                  className="w-9 h-9 rounded-full bg-[#202b39] flex items-center justify-center text-[#d8e3f7] hover:bg-[#2f3a49] cursor-pointer"
                  onClick={() => setIsEvacModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-[#16202f] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#bbc9cf]">Origin</span>
                    <p className="text-sm font-bold text-[#d8e3f7]">Current Geo: Benz Circle Junction</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#bbc9cf]" />
                  <div>
                    <span className="text-xs text-[#bbc9cf]">Target</span>
                    <p className="text-sm font-bold text-[#4ae183]">Municipal Community Hall</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-xs text-[#bbc9cf] font-bold uppercase tracking-wider">
                    Critical Navigation Directives
                  </span>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#16202f]">
                    <span className="w-7 h-7 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#d8e3f7]">
                        Follow Police High-Flyer Signage
                      </span>
                      <p className="text-xs text-[#bbc9cf] mt-0.5">
                        Take the eastern elevated walkway above Ring Road. Do not take the underpass route towards Krishna canal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#16202f]">
                    <span className="w-7 h-7 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#d8e3f7]">
                        Collectorate Checkpoint Cross
                      </span>
                      <p className="text-xs text-[#bbc9cf] mt-0.5">
                        National Disaster Response Force (NDRF) guide personnel are posted with high-lumen floodlights.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[#16202f]">
                    <span className="w-7 h-7 rounded-full bg-[#4ae183] text-[#003919] flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#d8e3f7]">
                        Arrive at Gate 4 Registration
                      </span>
                      <p className="text-xs text-[#bbc9cf] mt-0.5">
                        Present family headcount for immediate bed allocation, dry clothing, and battery recharge kits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#202b39]">
                <button
                  className="flex-1 h-12 rounded-xl bg-[#2f3a49] text-[#d8e3f7] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#3c494e] cursor-pointer"
                  onClick={toggleVoiceNav}
                >
                  {isVoiceActive ? <VolumeX className="w-4 h-4 text-[#ffb4ab]" /> : <Volume2 className="w-4 h-4 text-[#00d4ff]" />}
                  <span>{isVoiceActive ? 'Stop Audio Guidance' : 'Start Audio Guidance'}</span>
                </button>

                <button
                  className="flex-1 h-12 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#3cd7ff] cursor-pointer"
                  onClick={() => {
                    setIsEvacModalOpen(false);
                    router.push('/citizen/safe-route');
                  }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Acknowledge &amp; Navigate</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOS Confirmation Modal */}
        {isSosModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#040f1c]/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#111c2a] p-6 shadow-2xl flex flex-col gap-4 border border-[#ffb4ab]/40 text-center items-center">
              <div className="w-20 h-20 rounded-full bg-[#93000a] text-[#ffdad7] flex items-center justify-center animate-bounce shadow-lg">
                <Siren className="w-11 h-11" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#ffb4ab]">
                  DISPATCH TRANSMITTED
                </h3>
                <p className="text-sm text-[#d8e3f7]">
                  Your distress beacon has been locked by NDRF Zone Command.
                </p>
              </div>
              <div className="w-full p-4 rounded-xl bg-[#16202f] text-left flex flex-col gap-2 font-mono text-xs text-[#bbc9cf] border border-[#3c494e]/30">
                <div>BEACON ID: <span className="text-[#4ae183] font-bold">EM-NTR-9941</span></div>
                <div>COORDINATES: <span className="text-[#00d4ff] font-bold">16.5062° N, 80.6480° E</span></div>
                <div>ESTIMATED BOAT ARRIVAL: <span className="text-[#ffb4ab] font-bold">7 to 9 minutes</span></div>
              </div>
              <p className="text-xs text-[#bbc9cf]">
                Stay on highest dry ground available. Wave a bright cloth or mobile flashlight toward the sky.
              </p>
              <button
                className="w-full h-12 rounded-xl bg-[#2f3a49] text-[#d8e3f7] hover:bg-[#3c494e] text-sm font-semibold transition-colors cursor-pointer"
                onClick={() => setIsSosModalOpen(false)}
              >
                Cancel / I Am Safe Now
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
