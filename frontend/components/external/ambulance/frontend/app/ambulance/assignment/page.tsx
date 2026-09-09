'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Ambulance,
  AlertTriangle,
  CornerUpRight,
  Radio,
  Share2,
  Navigation,
  Compass,
  Satellite,
  Flag,
  CheckCircle2,
  CircleDot,
  Check,
  Zap,
  SlidersHorizontal,
} from 'lucide-react';
import { AssignmentCard } from '../../../components/ambulance/AssignmentCard';
import { mockAmbulanceData, AmbulanceData } from '../../../data/mockData';

interface AssignmentPageProps {
  data?: AmbulanceData;
  onNavigateToDashboard?: () => void;
  onStatusChange?: (status: 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY') => void;
}

export default function AmbulanceAssignmentPage({
  data = mockAmbulanceData,
  onNavigateToDashboard,
  onStatusChange,
}: AssignmentPageProps) {
  const [isNavigating, setIsNavigating] = useState(true);
  const [isArrived, setIsArrived] = useState(data.status === 'ARRIVED');
  const [speed, setSpeed] = useState(data.currentAssignment.telemetry.currentSpeed);
  const [corridorActive, setCorridorActive] = useState(true);

  const handleStartCorridor = () => {
    setIsNavigating(true);
    setIsArrived(false);
    if (onStatusChange) onStatusChange('EN_ROUTE');
  };

  const handleMarkArrived = () => {
    setIsArrived(true);
    setIsNavigating(false);
    setSpeed(0);
    if (onStatusChange) onStatusChange('ARRIVED');
  };

  const handleSetAvailable = () => {
    setIsArrived(false);
    setIsNavigating(false);
    setSpeed(0);
    if (onStatusChange) onStatusChange('AVAILABLE');
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 max-w-[1440px] mx-auto w-full">
      {/* Active Assignment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            id="back-to-dashboard-btn"
            onClick={onNavigateToDashboard}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#0B1F36]/80 hover:bg-[#0B1F36] border border-[#00B8E6]/25 hover:border-[#00D4FF]/60 text-xs font-bold text-white tracking-wider uppercase font-display transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D4FF] group-hover:-translate-x-0.5 transition-transform" />
            <span>DASHBOARD</span>
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-[#00D4FF] uppercase font-display">
              <span>DISPATCH TELEMETRY ACTIVE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              ACTIVE ASSIGNMENT
            </h1>
          </div>
        </div>

        {/* Header Right Badges */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B1F36]/80 border border-[#00B8E6]/25 text-xs font-bold text-white font-display">
            <Ambulance className="w-4 h-4 text-[#00D4FF]" />
            <span>{data.vehicleCode}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#93000A]/35 border border-[#FF4D4D]/50 text-xs font-bold text-[#FFB4AB] font-display shadow-[0_0_12px_rgba(255,77,77,0.2)]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF4D4D]" />
            <span className="tracking-wider uppercase">PRIORITY ALPHA DISPATCH</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards Row */}
      <AssignmentCard data={data.currentAssignment} variant="summary-strip" />

      {/* Main Tactical Map & Navigation Card */}
      <div
        id="tactical-corridor-map-card"
        className="rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 shadow-xl overflow-hidden flex flex-col mb-4 relative"
      >
        {/* Next Maneuver Banner */}
        <div className="p-4 sm:p-5 bg-[#081321]/90 border-b border-[#00B8E6]/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#00D4FF] text-[#081321] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,212,255,0.4)]">
              <CornerUpRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-[0.08em] text-[#00D4FF] uppercase font-display mb-0.5">
                NEXT CORRIDOR MANEUVER • {data.currentAssignment.nextManeuver.distance}
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-display tracking-tight">
                {data.currentAssignment.nextManeuver.instruction}
                <span className="text-[#00D4FF]">{data.currentAssignment.nextManeuver.highlight}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0B1F36] border border-[#00B8E6]/25 text-[11px] font-bold tracking-wider text-white font-display">
              <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
              <span>SIGNAL PREEMPTION: ARMED</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0B1F36] border border-[#00B8E6]/25 text-[11px] font-bold tracking-wider text-[#2ECC71] font-display">
              <Share2 className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span>CORRIDOR GREEN-LOCKED</span>
            </div>
          </div>
        </div>

        {/* Map Vector Stage */}
        <div className="relative w-full h-[380px] sm:h-[450px] bg-[#081321] overflow-hidden select-none">
          {/* Street Grid SVG Stage with responsive viewBox */}
          <svg
            className="w-full h-full"
            viewBox="0 0 1000 440"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="city-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00B8E6" strokeWidth="0.5" strokeOpacity="0.08" />
              </pattern>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="hazard-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF4D4D" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#FF4D4D" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FF4D4D" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid Fill */}
            <rect width="1000" height="440" fill="#081321" />
            <rect width="1000" height="440" fill="url(#city-grid)" />

            {/* Background City Road Networks - Vijayawada MG Road & Arterials */}
            <g stroke="#142438" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              {/* Horizontal / Angled arterials */}
              <line x1="-30" y1="300" x2="1030" y2="300" />
              <line x1="-30" y1="365" x2="1030" y2="365" />
              <line x1="-30" y1="185" x2="1030" y2="185" strokeWidth="10" strokeOpacity="0.6" />
              {/* Vertical Cross Streets */}
              <line x1="160" y1="-20" x2="160" y2="460" />
              <line x1="330" y1="-20" x2="330" y2="460" />
              <line x1="480" y1="-20" x2="480" y2="460" />
              <line x1="680" y1="-20" x2="680" y2="460" />
              <line x1="860" y1="-20" x2="860" y2="460" />
              {/* Diagonal expressways */}
              <line x1="60" y1="460" x2="940" y2="80" strokeWidth="12" strokeOpacity="0.75" />
              <line x1="80" y1="100" x2="880" y2="460" strokeWidth="8" strokeOpacity="0.5" />
            </g>

            {/* Road center dash guides */}
            <g stroke="#223954" strokeWidth="1.5" strokeDasharray="6,8">
              <line x1="-30" y1="300" x2="1030" y2="300" />
              <line x1="-30" y1="365" x2="1030" y2="365" />
              <line x1="330" y1="-20" x2="330" y2="460" />
              <line x1="680" y1="-20" x2="680" y2="460" />
            </g>

            {/* Congestion Hazard Area (Red glow ellipse) */}
            <ellipse
              cx="550"
              cy="300"
              rx="85"
              ry="32"
              fill="url(#hazard-gradient)"
            />

            {/* Active Navigation Corridor Route Path */}
            {/* Benz Circle (330, 365) -> forward (420, 365) -> turns up (460, 205) -> across (760, 195) -> turns down (835, 310) -> GGH ramp (890, 320) */}
            <path
              d="M 320 365 L 415 365 L 460 205 L 765 195 L 835 310 L 890 320"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-cyan)"
            />
            <path
              d="M 320 365 L 415 365 L 460 205 L 765 195 L 835 310 L 890 320"
              fill="none"
              stroke="#E0F7FF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="9,6"
            />

            {/* Congestion Detour Callout Tag (exact replica) */}
            <g transform="translate(550, 300)">
              {/* Outer halo pill */}
              <rect x="-78" y="-14" width="156" height="28" rx="14" fill="#690005" fillOpacity="0.85" stroke="#FF4D4D" strokeWidth="1.2" />
              {/* Hazard triangle symbol */}
              <polygon points="-64,6 -58,-6 -52,6" fill="#FF4D4D" />
              <text x="-44" y="3.5" fill="#FFB4AB" fontSize="10" fontWeight="700" fontFamily="Space Grotesk, sans-serif" letterSpacing="0.08em">
                CONGESTION DETOUR
              </text>
            </g>

            {/* 1. Origin Marker: Benz Circle (YOU) */}
            <g transform="translate(320, 365)">
              <circle cx="0" cy="0" r="22" fill="#00D4FF" fillOpacity="0.15">
                <animate attributeName="r" values="16;28;16" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="0" r="14" fill="#0B1F36" stroke="#00D4FF" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="5" fill="#00D4FF" />
              {/* Label Pill */}
              <rect x="-65" y="18" width="130" height="22" rx="4" fill="#081321" fillOpacity="0.95" stroke="#00B8E6" strokeWidth="0.8" />
              <text x="0" y="33" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700" fontFamily="Space Grotesk, sans-serif" letterSpacing="0.06em">
                BENZ CIRCLE (YOU)
              </text>
            </g>

            {/* 2. Destination Marker: Govt General Hospital */}
            <g transform="translate(890, 320)">
              {/* Label Badge above */}
              <rect x="-82" y="-36" width="164" height="20" rx="4" fill="#003642" fillOpacity="0.95" stroke="#00D4FF" strokeWidth="0.8" />
              <text x="0" y="-22" textAnchor="middle" fill="#A8E8FF" fontSize="9.5" fontWeight="700" fontFamily="Space Grotesk, sans-serif" letterSpacing="0.05em">
                GOVT GENERAL HOSPITAL
              </text>

              {/* Destination Pin Icon */}
              <circle cx="0" cy="0" r="22" fill="#00D4FF" fillOpacity="0.15" />
              <circle cx="0" cy="0" r="15" fill="#0B1F36" stroke="#00D4FF" strokeWidth="2.5" />
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>

          {/* Bottom Left Telemetry Overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2.5 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#081321]/90 backdrop-blur-sm border border-[#00B8E6]/30 text-xs font-bold text-white font-display shadow-md">
              <Compass className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>{data.currentAssignment.telemetry.heading}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#081321]/90 backdrop-blur-sm border border-[#00B8E6]/30 text-xs font-bold text-[#00D4FF] font-display shadow-md">
              <Satellite className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>{data.currentAssignment.telemetry.rtkStatus}</span>
            </div>
          </div>

          {/* Bottom Right Speedometer Overlay */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="flex items-baseline gap-1.5 px-4 py-2 rounded-lg bg-[#081321]/90 backdrop-blur-md border border-[#00B8E6]/30 shadow-lg">
              <span className="text-3xl font-bold text-white tabular-nums font-display leading-none">
                {isArrived ? '00' : speed}
              </span>
              <span className="text-[11px] font-bold text-[#8EADC7] tracking-wider uppercase font-display">
                KM/H
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls Section */}
      <div className="space-y-3">
        {/* Large Primary Action Button */}
        <button
          type="button"
          id="start-navigation-corridor-btn"
          onClick={handleStartCorridor}
          className="w-full py-4 px-6 rounded-lg bg-[#00D4FF] hover:bg-[#3cd7ff] active:scale-[0.99] text-[#081321] font-bold text-base tracking-widest uppercase font-display flex items-center justify-center gap-3 shadow-[0_0_24px_rgba(0,212,255,0.45)] transition-all cursor-pointer"
        >
          <Navigation className="w-5 h-5 fill-current" />
          <span>START NAVIGATION CORRIDOR</span>
          <span className="tracking-tighter font-extrabold text-lg">»</span>
        </button>

        {/* Bottom Two Secondary Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Mark Arrived Card */}
          <button
            type="button"
            id="mark-arrived-action-card"
            onClick={handleMarkArrived}
            className={`p-4 rounded-lg bg-[#0B1F36]/80 hover:bg-[#0B1F36] border ${
              isArrived ? 'border-[#2ECC71] shadow-[0_0_15px_rgba(46,204,113,0.25)]' : 'border-[#00B8E6]/25 hover:border-[#00D4FF]/60'
            } flex items-center justify-between transition-all text-left cursor-pointer group`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-md ${isArrived ? 'bg-[#2ECC71]/20 text-[#2ECC71]' : 'bg-[#081321] text-[#8EADC7]'} border border-[#00B8E6]/25 group-hover:text-[#00D4FF] transition-colors`}>
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-wider uppercase font-display">
                  MARK ARRIVED
                </div>
                <div className="text-[11px] text-[#8EADC7]">
                  AT GGH TRAUMA DOCK
                </div>
              </div>
            </div>

            <div className={`w-5 h-5 rounded-full border ${isArrived ? 'bg-[#2ECC71] border-[#2ECC71] text-[#081321]' : 'border-[#8EADC7]/40'} flex items-center justify-center`}>
              {isArrived && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          {/* Available For Next Card */}
          <button
            type="button"
            id="available-for-next-action-card"
            onClick={handleSetAvailable}
            className={`p-4 rounded-lg bg-[#0B1F36]/80 hover:bg-[#0B1F36] border ${
              !isArrived && !isNavigating ? 'border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.25)]' : 'border-[#00B8E6]/25 hover:border-[#00D4FF]/60'
            } flex items-center justify-between transition-all text-left cursor-pointer group`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-md bg-[#081321] border border-[#00B8E6]/25 text-[#00D4FF] group-hover:shadow-[0_0_8px_#00D4FF] transition-all">
                <CircleDot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-wider uppercase font-display">
                  AVAILABLE FOR NEXT
                </div>
                <div className="text-[11px] text-[#8EADC7]">
                  RETURN FLEET TO STANDBY
                </div>
              </div>
            </div>

            <span className="w-3 h-3 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF] animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
}
