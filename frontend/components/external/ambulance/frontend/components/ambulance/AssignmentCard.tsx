import React from 'react';
import { MapPin, PlusSquare, ArrowRight, Navigation, CornerUpRight, Send, Route } from 'lucide-react';
import { ETACard } from './ETACard';
import { mockAmbulanceData } from '../../data/mockData';

interface AssignmentCardProps {
  onNavigate?: () => void;
  data?: typeof mockAmbulanceData.currentAssignment;
  variant?: 'dashboard' | 'summary-strip';
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  onNavigate,
  data = mockAmbulanceData.currentAssignment,
  variant = 'dashboard',
}) => {
  if (variant === 'summary-strip') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {/* Staging Origin */}
        <div
          id="summary-staging-origin"
          className="p-4 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase font-display">
              STAGING ORIGIN
            </span>
            <Send className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight font-display mb-0.5">
              {data.stagingOrigin.name}
            </div>
            <div className="text-[11px] font-bold tracking-wider text-[#8EADC7] uppercase font-display">
              {data.stagingOrigin.sector}
            </div>
          </div>
        </div>

        {/* Target Facility */}
        <div
          id="summary-target-facility"
          className="p-4 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase font-display">
              TARGET FACILITY
            </span>
            <PlusSquare className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight font-display mb-0.5">
              {data.destination.name}
            </div>
            <div className="text-[11px] font-bold tracking-wider text-[#8EADC7] uppercase font-display">
              {data.destination.category}
            </div>
          </div>
        </div>

        {/* Remaining Distance */}
        <div
          id="summary-remaining-dist"
          className="p-4 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase font-display">
              REMAINING DIST
            </span>
            <Route className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white tabular-nums font-display">
              2.8
            </span>
            <span className="text-xs font-bold text-[#8EADC7] tracking-wider uppercase font-display">
              KM DIRECT
            </span>
          </div>
        </div>

        {/* Calculated ETA */}
        <ETACard etaMinutes={data.etaMinutes} variant="header" isCritical={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div
        id="current-assignment-card"
        className="p-5 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 shadow-lg relative overflow-hidden"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF] animate-pulse" />
            <h2 className="text-xs font-bold tracking-[0.08em] text-white uppercase font-display">
              {data.title}
            </h2>
          </div>
          <span className="px-3 py-1 rounded-sm bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-[11px] font-bold tracking-wider uppercase font-display">
            {data.badge}
          </span>
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {/* Staging Area */}
          <div className="p-3.5 rounded-lg bg-[#081321]/80 border border-[#00B8E6]/20 flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#0B1F36] border border-[#00B8E6]/30 text-[#00D4FF] shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase mb-1 font-display">
                STAGING AREA
              </div>
              <div className="text-lg font-bold text-white font-display leading-tight">
                {data.stagingOrigin.name}
              </div>
              <div className="text-xs text-[#8EADC7] mt-0.5">
                {data.stagingOrigin.subtext}
              </div>
            </div>
          </div>

          {/* Designated Receiving Facility */}
          <div className="p-3.5 rounded-lg bg-[#081321]/80 border border-[#00B8E6]/20 flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#0B1F36] border border-[#00B8E6]/30 text-[#00D4FF] shrink-0">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase mb-1 font-display">
                DESIGNATED RECEIVING FACILITY
              </div>
              <div className="text-lg font-bold text-white font-display leading-tight">
                {data.destination.name}
              </div>
              <div className="text-xs text-[#2ECC71] mt-0.5 font-medium">
                {data.destination.status}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metrics Row */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#00B8E6]/15">
          {/* Route Distance */}
          <div id="route-dist-metric" className="flex flex-col">
            <div className="text-[10px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase mb-1 font-display">
              ROUTE DISTANCE
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white tabular-nums font-display">
                2.8
              </span>
              <span className="text-sm font-bold text-[#00D4FF] tracking-wider uppercase font-display">
                KM
              </span>
            </div>
            <div className="text-xs text-[#8EADC7] mt-0.5">
              {data.routeVia}
            </div>
          </div>

          {/* Estimated Transit */}
          <ETACard etaMinutes={data.etaMinutes} subtext={data.etaStatus} />

          {/* Dispatched Posture */}
          <div id="dispatched-posture-metric" className="flex flex-col">
            <div className="text-[10px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase mb-1 font-display">
              DISPATCHED POSTURE
            </div>
            <div className="text-2xl font-bold text-white tracking-tight font-display">
              {data.dispatchedPosture}
            </div>
            <div className="text-xs text-[#8EADC7] mt-0.5">
              {data.postureDetail}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Button: View Assignment & Navigation */}
      <button
        type="button"
        id="view-assignment-nav-btn"
        onClick={onNavigate}
        className="w-full py-4 px-6 rounded-lg bg-[#00D4FF] hover:bg-[#3cd7ff] active:scale-[0.99] text-[#081321] font-bold text-sm tracking-widest uppercase font-display flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(0,212,255,0.4)] transition-all cursor-pointer group"
      >
        <span>VIEW ASSIGNMENT & NAVIGATION</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
};
