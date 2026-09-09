import React, { useState } from 'react';
import {
  ArrowLeft,
  CornerUpRight,
  AlertTriangle,
  CheckCircle,
  Flag,
  Phone,
  ShieldCheck,
  AlertCircle,
  PlusSquare,
  Radio,
  Clock,
  Compass,
  UserCheck,
  Building2,
  X,
  PhoneCall,
  Ambulance,
} from 'lucide-react';
import { TacticalMap } from './TacticalMap';
import {
  FEATURED_MISSION,
  MISSION_ROUTE_STEPS,
  SHELTER_MANIFEST,
  SYSTEM_TELEMETRY,
} from '../data/mockData';

interface NavigationScreenProps {
  onBackToMissions: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({ onBackToMissions }) => {
  const [arrived, setArrived] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'ambulance' | 'issue' | 'call' | 'arrived' | null>(null);
  const [issueText, setIssueText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleArrived = () => {
    setArrived(true);
    setActiveModal('arrived');
  };

  const handleRequestAmbulance = () => {
    setActiveModal('ambulance');
  };

  const handleReportIssue = () => {
    setActiveModal('issue');
  };

  const handleCallCoordinator = () => {
    setActiveModal('call');
  };

  return (
    <div className="w-full flex flex-col gap-5 py-4 px-4 sm:px-6 max-w-[1720px] mx-auto pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-[#0B1F36]/95 border border-[#00D4FF] text-[#E6F4FA] px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.3)] flex items-center gap-2 text-xs font-mono animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Incident Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Back button, Badges, Title */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="back-to-missions-btn"
              onClick={onBackToMissions}
              className="px-3 py-1.5 rounded-lg bg-[#0c1f34] hover:bg-[#122e4d] border border-[#16385a] hover:border-[#00D4FF]/40 text-xs font-semibold text-[#d8e3f7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Missions</span>
            </button>

            <span className="px-2.5 py-1 rounded-md bg-[#FF4D4D]/15 border border-[#FF4D4D]/40 text-[#FF4D4D] text-[10px] font-mono font-bold tracking-wider">
              HIGH PRIORITY
            </span>

            <span className="px-2.5 py-1 rounded-md bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] text-[10px] font-mono font-bold tracking-wider">
              ACTIVE ROUTE
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {FEATURED_MISSION.title}
            </h1>
            <span className="text-xs font-mono text-[#7A9BB8]">
              {FEATURED_MISSION.locationDetails}
            </span>
          </div>
        </div>

        {/* Right Side Stats */}
        <div className="flex items-center gap-6 bg-[#081729]/80 border border-[#14324f] px-5 py-2.5 rounded-xl self-start lg:self-center">
          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
              Impact
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {FEATURED_MISSION.affected} Civilians
            </div>
          </div>

          <div className="w-px h-7 bg-[#14324f]" />

          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
              Distance
            </div>
            <div className="text-sm font-bold text-white font-mono">
              {FEATURED_MISSION.distance}
            </div>
          </div>

          <div className="w-px h-7 bg-[#14324f]" />

          <div>
            <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
              Eta
            </div>
            <div className="text-sm font-bold text-[#00D4FF] font-mono">
              {FEATURED_MISSION.eta}
            </div>
          </div>
        </div>
      </div>

      {/* Next Turn Instruction Banner */}
      <div className="w-full rounded-2xl bg-[#08182b] border border-[#00b8e6]/25 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        {/* Left: Maneuver Icon & Street Name */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00D4FF] flex items-center justify-center text-[#081321] shrink-0 shadow-[0_0_16px_rgba(0,212,255,0.4)]">
            <CornerUpRight className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-semibold tracking-wider text-[#00D4FF] uppercase flex items-center gap-1.5">
              <span>Next Turn</span>
              <span className="text-[#3c5674]">•</span>
              <span>In 350 Meters</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white">
              Turn Right onto River Road
            </div>
          </div>
        </div>

        {/* Right: Distance, Time, Guidance Status */}
        <div className="flex items-center gap-5 sm:gap-6 text-xs font-mono self-start sm:self-center">
          <div>
            <div className="text-[10px] text-[#7A9BB8] uppercase tracking-wider">Distance</div>
            <div className="text-sm font-bold text-white">350 m</div>
          </div>

          <div className="w-px h-6 bg-[#173757]" />

          <div>
            <div className="text-[10px] text-[#7A9BB8] uppercase tracking-wider">Est Time</div>
            <div className="text-sm font-bold text-white">01 min</div>
          </div>

          <div className="w-px h-6 bg-[#173757]" />

          <div className="flex items-center gap-1.5 text-[#00D4FF] font-semibold text-xs tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>GUIDANCE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Map + Alert, Right Route Steps & Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Tactical Map (8 Cols on Desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Tactical Map Container */}
          <div className="h-[460px] sm:h-[500px] w-full">
            <TacticalMap
              heading={SYSTEM_TELEMETRY.heading}
              speed={SYSTEM_TELEMETRY.speed}
              onWaypointClick={() => showToast('Selected Waypoint: Riverside High Gym')}
            />
          </div>

          {/* Route Warning Active Box */}
          <div className="rounded-xl bg-[#1d1807]/90 border border-[#ffd43b]/40 p-4 flex items-start gap-3 shadow-md">
            <AlertTriangle className="w-5 h-5 text-[#FFD43B] shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-mono font-bold text-[#FFD43B] tracking-wider mb-1 flex items-center gap-2">
                <span>ROUTE WARNING ACTIVE</span>
                <span className="text-[#88701e]">•</span>
                <span className="text-[#ffe680]">SURFACE WATER RISK</span>
              </div>
              <p className="text-[#e2ce80] leading-relaxed">
                Water accumulation reported near canal crossing on 4th Avenue. Route recalculated: proceed via <span className="font-semibold text-white">Elevated Service Road</span> to bypass flash backflow.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Route Progress & Shelter Manifest (4 Cols on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* Mission Route Progress Card */}
          <div className="tactical-panel rounded-2xl p-5 border border-[#00b8e6]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Mission Route Progress
              </h3>
              <span className="text-[11px] font-mono text-[#8AA3BC]">
                STEP 2 OF 3
              </span>
            </div>

            <div className="flex flex-col gap-4 relative">
              {/* Step 1: Departed */}
              <div className="flex items-start gap-3 relative">
                <div className="w-7 h-7 rounded-full bg-[#0d2238] border border-[#1d436b] flex items-center justify-center text-[#3cd7ff] shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-[#00D4FF]" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#8AA3BC] line-through">
                    {MISSION_ROUTE_STEPS[0].title}
                  </div>
                  <div className="text-[11px] font-mono text-[#547391]">
                    {MISSION_ROUTE_STEPS[0].subtitle}
                  </div>
                </div>
              </div>

              {/* Vertical connector line */}
              <div className="w-0.5 h-6 bg-[#00D4FF]/40 ml-3.5 -my-2" />

              {/* Step 2: Current Maneuver */}
              <div className="flex items-start gap-3 relative">
                <div className="w-7 h-7 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF] flex items-center justify-center text-[#00D4FF] shrink-0 mt-0.5 shadow-[0_0_8px_#00D4FF]">
                  <CornerUpRight className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block px-2 py-0.5 rounded bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] text-[9px] font-mono font-bold tracking-wider mb-1">
                    CURRENT MANEUVER {MISSION_ROUTE_STEPS[1].maneuverDistance}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {MISSION_ROUTE_STEPS[1].title}
                  </div>
                  <div className="text-xs text-[#8AA3BC]">
                    {MISSION_ROUTE_STEPS[1].subtitle}
                  </div>
                </div>
              </div>

              {/* Vertical connector line */}
              <div className="w-0.5 h-6 bg-[#163654] ml-3.5 -my-2" />

              {/* Step 3: Destination */}
              <div className="flex items-start gap-3 relative">
                <div className="w-7 h-7 rounded-full bg-[#0d2238] border border-[#163654] flex items-center justify-center text-[#8AA3BC] shrink-0 mt-0.5">
                  <Flag className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white">
                    {MISSION_ROUTE_STEPS[2].title}
                  </div>
                  <div className="text-[11px] font-mono text-[#7A9BB8]">
                    {MISSION_ROUTE_STEPS[2].subtitle}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shelter Manifest Details Card */}
          <div className="tactical-panel rounded-2xl p-5 border border-[#00b8e6]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Shelter Manifest Details
              </h3>
              <span className="text-[11px] font-mono text-[#8AA3BC]">
                TRIAGE L-1
              </span>
            </div>

            {/* 4 Stat Boxes */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#06121f] border border-[#163654] rounded-xl p-3">
                <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                  Civilians Trapped
                </div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {SHELTER_MANIFEST.civiliansTrapped} Total
                </div>
              </div>

              <div className="bg-[#06121f] border border-[#ff4d4d]/30 rounded-xl p-3">
                <div className="text-[10px] font-mono tracking-wider text-[#ff8080] uppercase">
                  Critical Medical
                </div>
                <div className="text-base font-bold text-[#FF4D4D] font-mono mt-0.5">
                  {SHELTER_MANIFEST.criticalMedical} Urgent
                </div>
              </div>

              <div className="bg-[#06121f] border border-[#163654] rounded-xl p-3">
                <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                  Mobility Assist
                </div>
                <div className="text-base font-bold text-white font-mono mt-0.5">
                  {SHELTER_MANIFEST.mobilityAssist} Wheelchair
                </div>
              </div>

              <div className="bg-[#06121f] border border-[#2ecc71]/30 rounded-xl p-3">
                <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                  Shelter Structural
                </div>
                <div className="text-sm font-bold text-[#2ECC71] font-mono mt-0.5">
                  {SHELTER_MANIFEST.shelterStructural}
                </div>
              </div>
            </div>

            {/* Rescue Coordinator Contact */}
            <div className="bg-[#06121f] border border-[#163654] rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0c233c] border border-[#1c4672] flex items-center justify-center text-[#00D4FF]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                    Rescue Coordinator
                  </div>
                  <div className="text-xs font-bold text-white">
                    {SHELTER_MANIFEST.rescueCoordinator.name}
                  </div>
                </div>
              </div>

              <button
                id="call-coordinator-btn"
                onClick={handleCallCoordinator}
                className="px-3 py-1.5 rounded-lg bg-[#0d2238] hover:bg-[#15385c] border border-[#1b446e] text-xs font-mono font-bold text-[#00D4FF] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Phone className="w-3 h-3" />
                <span>{SHELTER_MANIFEST.rescueCoordinator.phone}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Dock (Matching reference design) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#06121f]/95 backdrop-blur-xl border-t border-[#00b8e6]/25 py-3 px-4 sm:px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Status */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-[#0b2440] border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF] shrink-0">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{arrived ? 'Vehicle Arrived at Incident LZ' : 'En Route to Incident Site'}</span>
                <span className={`w-2 h-2 rounded-full ${arrived ? 'bg-[#2ECC71]' : 'bg-[#00D4FF]'} animate-ping`} />
              </div>
              <div className="text-[11px] text-[#7A9BB8]">
                Tap button when emergency vehicle brings wheels to a stop at destination gates.
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button
              id="report-issue-btn"
              onClick={handleReportIssue}
              className="px-4 py-2.5 rounded-xl bg-[#091a2d] hover:bg-[#112d4d] border border-[#183d63] hover:border-[#00D4FF]/40 text-xs font-semibold text-[#d8e3f7] flex items-center gap-2 transition-all duration-150 cursor-pointer hover:shadow-[0_0_12px_rgba(0,212,255,0.2)]"
            >
              <AlertCircle className="w-4 h-4 text-[#8AA3BC]" />
              <span>Report Route Issue</span>
            </button>

            <button
              id="request-ambulance-btn"
              onClick={handleRequestAmbulance}
              className="px-4 py-2.5 rounded-xl bg-[#68000b]/90 hover:bg-[#850312] border border-[#ff4d4d]/60 hover:border-[#ff4d4d] text-xs font-bold text-[#ffdad7] flex items-center gap-2 shadow-[0_0_12px_rgba(255,77,77,0.25)] hover:shadow-[0_0_20px_rgba(255,77,77,0.6)] transition-all duration-150 cursor-pointer hover:scale-[1.02]"
            >
              <PlusSquare className="w-4 h-4 text-[#FF4D4D]" />
              <span>Request Ambulance</span>
            </button>

            <button
              id="arrived-at-location-btn"
              onClick={handleArrived}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-98 ${
                arrived
                  ? 'bg-[#2ECC71] hover:bg-[#34d97b] text-[#081321] shadow-[0_0_20px_rgba(46,204,113,0.5)] hover:shadow-[0_0_28px_rgba(46,204,113,0.8)]'
                  : 'bg-[#00D4FF] hover:bg-[#5ce1ff] text-[#081321] shadow-[0_0_20px_rgba(0,212,255,0.45)] hover:shadow-[0_0_28px_rgba(0,212,255,0.85)] hover:ring-2 hover:ring-white/40'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{arrived ? 'ARRIVED & SECURED' : 'ARRIVED AT LOCATION'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Report Route Issue */}
      {activeModal === 'issue' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1F36] border border-[#00d4ff]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#FFD43B]" />
                <h3 className="text-base font-bold text-white">Report Tactical Obstruction</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#7A9BB8] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#8AA3BC] mb-3">
              Transmit live telemetry alert to district dispatch regarding road blockage, flash surges, or debris.
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {['Downed Power Lines on River Rd', 'Water depth > 1.2m at Bridge', 'Debris blocking vehicle gate'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setIssueText(preset)}
                  className="text-left text-xs bg-[#06121f] border border-[#163654] hover:border-[#00D4FF] text-[#E6F4FA] p-2.5 rounded-lg transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="Or type tactical hazard detail..."
              rows={3}
              className="w-full bg-[#06101C] border border-[#152E4D] focus:border-[#00D4FF] rounded-lg p-2.5 text-xs text-white font-mono placeholder:text-[#4A6785] outline-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg text-xs text-[#8AA3BC] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Route issue transmitted to Tactical Command');
                  setActiveModal(null);
                  setIssueText('');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#00D4FF] text-[#081321]"
              >
                Broadcast Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Ambulance */}
      {activeModal === 'ambulance' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1F36] border border-[#FF4D4D]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-[#FF4D4D]" />
                <h3 className="text-base font-bold text-white">Request Emergency Medical Units</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#7A9BB8] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#68000b]/20 border border-[#ff4d4d]/40 rounded-xl p-3 mb-4 text-xs text-[#ffdad7]">
              <span className="font-bold">TRIAGE ALERT:</span> 3 Critical Medical patients identified in Shelter Alpha. Immediate ALS evacuation required.
            </div>
            <p className="text-xs text-[#8AA3BC] mb-4">
              Unit <span className="text-white font-bold">MED-04 & ALS-09</span> will be dispatched to Riverside High School LZ Alpha.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-lg text-xs text-[#8AA3BC] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Ambulance Units MED-04 & ALS-09 Dispatched. ETA 6 min.');
                  setActiveModal(null);
                }}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#FF4D4D] text-white shadow-[0_0_14px_rgba(255,77,77,0.4)]"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Call Coordinator */}
      {activeModal === 'call' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1F36] border border-[#00D4FF]/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF] flex items-center justify-center text-[#00D4FF] mx-auto mb-3 animate-pulse">
              <PhoneCall className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Connecting Tactical Radio</h3>
            <p className="text-xs text-[#00D4FF] font-mono mb-2">CH-08 TACTICAL SECURE STREAM</p>
            <p className="text-xs text-[#8AA3BC] mb-5">
              Rescue Coordinator <span className="text-white font-semibold">{SHELTER_MANIFEST.rescueCoordinator.name}</span> ({SHELTER_MANIFEST.rescueCoordinator.phone})
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#68000b] border border-[#ff4d4d]/60 text-xs font-bold text-white hover:bg-[#850312]"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Modal: Arrived Confirmation */}
      {activeModal === 'arrived' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1F36] border border-[#2ECC71]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#2ECC71]/20 border border-[#2ECC71] flex items-center justify-center text-[#2ECC71] mx-auto mb-3 shadow-[0_0_16px_rgba(46,204,113,0.4)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">On-Site LZ Reached</h3>
            <p className="text-xs font-mono text-[#2ECC71] mb-3">VEHICLE STOP CONFIRMED AT DESTINATION</p>
            <p className="text-xs text-[#8AA3BC] mb-5 leading-relaxed">
              Riverside High School Gym perimeter secured. 42 Civilians ready for triage and staging to LZ Alpha.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#00D4FF] text-[#081321] text-xs font-bold shadow-[0_0_12px_rgba(0,212,255,0.4)]"
              >
                Proceed to Triage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
