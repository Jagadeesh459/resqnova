import React from 'react';
import {
  Box,
  AlertTriangle,
  Users,
  Clock,
  ArrowDownRight,
  Radio,
  Navigation,
  Timer,
  Accessibility,
  ArrowRight,
  MapPin,
  Waves,
  Wrench,
  Package,
  Network,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  SYSTEM_TELEMETRY,
  ACTIVE_STATS,
  FEATURED_MISSION,
  AVAILABLE_MISSIONS,
} from '../data/mockData';
import { Mission } from '../types';

interface DashboardScreenProps {
  onOpenMission: (missionId: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onOpenMission }) => {
  return (
    <div className="w-full flex flex-col gap-6 py-4 px-4 sm:px-6 max-w-[1720px] mx-auto">
      {/* Subheader Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono py-1">
        <div className="flex items-center gap-2 text-[#7ce2fe] tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF] animate-pulse"></span>
          <span className="font-semibold">NTR FLOOD CRISIS MATRIX</span>
          <span className="text-[#3c5674]">•</span>
          <span className="text-[#8AA3BC]">{SYSTEM_TELEMETRY.gridSector}</span>
        </div>

        <div className="flex items-center gap-3 text-[#8AA3BC]">
          <span className="hidden sm:inline">
            SYNC: <span className="text-white font-semibold">{SYSTEM_TELEMETRY.syncRate}</span>
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a1b2d] border border-[#163857] text-[#7ce2fe] shadow-sm">
            <Radio className="w-3.5 h-3.5 text-[#00D4FF] animate-pulse" />
            <span className="tracking-wider text-[11px] font-semibold">{SYSTEM_TELEMETRY.channel}</span>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Missions */}
        <div className="tactical-panel rounded-2xl p-5 flex flex-col justify-between border border-[#00d4ff]/20 relative overflow-hidden group hover:border-[#00d4ff]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#8AA3BC]">
              Active Missions
            </span>
            <Box className="w-4 h-4 text-[#00D4FF]" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-white tracking-tight">
              {ACTIVE_STATS.activeMissions.count}
            </span>
            <span className="text-xs font-mono text-[#7A9BB8] font-medium tracking-wider">
              {ACTIVE_STATS.activeMissions.label}
            </span>
          </div>
          {/* Progress Indicator */}
          <div className="w-full bg-[#0a192a] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00D4FF] rounded-full shadow-[0_0_8px_#00D4FF]"
              style={{ width: `${ACTIVE_STATS.activeMissions.fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 2: High Priority */}
        <div className="tactical-panel rounded-2xl p-5 flex flex-col justify-between border border-[#ff4d4d]/25 relative overflow-hidden group hover:border-[#ff4d4d]/45 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#ff7d7d]">
              High Priority
            </span>
            <AlertTriangle className="w-4 h-4 text-[#FF4D4D]" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-white tracking-tight">
              {ACTIVE_STATS.highPriority.count}
            </span>
            <span className="text-xs font-mono text-[#FF4D4D] font-bold tracking-wider">
              {ACTIVE_STATS.highPriority.label}
            </span>
          </div>
          {/* Progress Indicator */}
          <div className="w-full bg-[#0a192a] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF4D4D] rounded-full shadow-[0_0_8px_#FF4D4D]"
              style={{ width: `${ACTIVE_STATS.highPriority.fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 3: Rescuers Active */}
        <div className="tactical-panel rounded-2xl p-5 flex flex-col justify-between border border-[#ffd43b]/25 relative overflow-hidden group hover:border-[#ffd43b]/45 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#ffe082]">
              Rescuers Active
            </span>
            <Users className="w-4 h-4 text-[#FFD43B]" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-white tracking-tight">
              {ACTIVE_STATS.rescuersActive.count}
            </span>
            <span className="text-xs font-mono text-[#FFD43B] font-bold tracking-wider">
              {ACTIVE_STATS.rescuersActive.label}
            </span>
          </div>
          {/* Progress Indicator */}
          <div className="w-full bg-[#0a192a] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD43B] rounded-full shadow-[0_0_8px_#FFD43B]"
              style={{ width: `${ACTIVE_STATS.rescuersActive.fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 4: Avg Response */}
        <div className="tactical-panel rounded-2xl p-5 flex flex-col justify-between border border-[#00b8e6]/18 relative overflow-hidden group hover:border-[#00d4ff]/35 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#8AA3BC]">
              Avg Response
            </span>
            <Clock className="w-4 h-4 text-[#8AA3BC]" />
          </div>
          <div className="my-3 flex items-baseline gap-1.5">
            <span className="text-4xl font-bold font-mono text-white tracking-tight">
              {ACTIVE_STATS.avgResponse.value}
            </span>
            <span className="text-sm font-mono text-[#7A9BB8]">
              {ACTIVE_STATS.avgResponse.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#8AA3BC]">{ACTIVE_STATS.avgResponse.comparison}</span>
            <ArrowDownRight className="w-4 h-4 text-[#00D4FF]" />
          </div>
        </div>
      </div>

      {/* Hero Active Incident Card */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#0a1c30]/95 via-[#0c223c]/90 to-[#081729]/95 border border-[#00d4ff]/30 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative overflow-hidden">
        {/* Background glow accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left Incident Information */}
          <div className="flex-1">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] text-xs font-mono font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse"></span>
                ACTIVE OPERATION
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4D4D]/15 border border-[#FF4D4D]/40 text-[#FF4D4D] text-xs font-mono font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]"></span>
                PRIORITY: HIGH
              </span>
              <span className="text-xs font-mono text-[#7A9BB8] tracking-widest pl-1">
                {FEATURED_MISSION.code}
              </span>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              {FEATURED_MISSION.title}
            </h2>
            <p className="text-sm text-[#a4bed8] leading-relaxed max-w-3xl mb-6">
              {FEATURED_MISSION.description}
            </p>

            {/* 4 Meta Items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#06111f]/90 border border-[#163654] rounded-xl px-4 py-2.5 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[#0F294A] text-[#00D4FF]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                    Affected
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {FEATURED_MISSION.affected} Civilians
                  </div>
                </div>
              </div>

              <div className="bg-[#06111f]/90 border border-[#163654] rounded-xl px-4 py-2.5 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[#0F294A] text-[#00D4FF]">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                    Distance
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {FEATURED_MISSION.distance}
                  </div>
                </div>
              </div>

              <div className="bg-[#06111f]/90 border border-[#163654] rounded-xl px-4 py-2.5 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[#0F294A] text-[#FFD43B]">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                    Eta Vector
                  </div>
                  <div className="text-xs font-semibold text-[#FFD43B] font-mono">
                    {FEATURED_MISSION.eta}
                  </div>
                </div>
              </div>

              <div className="bg-[#06111f]/90 border border-[#163654] rounded-xl px-4 py-2.5 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-[#0F294A] text-[#00D4FF]">
                  <Accessibility className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-wider text-[#7A9BB8] uppercase">
                    Access
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {FEATURED_MISSION.accessReq}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="flex flex-col items-center justify-center lg:pl-6">
            <button
              id="hero-open-mission-btn"
              onClick={() => onOpenMission(FEATURED_MISSION.id)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00D4FF] hover:bg-[#5ce1ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.85)] hover:ring-2 hover:ring-white/40 hover:scale-[1.03] text-[#081321] font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.45)] transition-all duration-200 transform active:scale-98 cursor-pointer group"
            >
              <span>OPEN MISSION</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <span className="text-[10px] font-mono tracking-wider text-[#7A9BB8] mt-2.5 text-center">
              FLIGHT PATH AUTHORIZED • HUD READY
            </span>
          </div>
        </div>
      </div>

      {/* Available Missions Section */}
      <div className="flex flex-col gap-3">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold uppercase tracking-wider text-white">
              Available Missions
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0d2136] border border-[#183a5e] text-xs font-mono text-[#8AA3BC]">
              3 OPEN QUEUE
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8AA3BC]">
            <span className="w-2 h-2 rounded-full bg-[#FFD43B] shadow-[0_0_6px_#FFD43B]"></span>
            <span>AUTOMATIC TRIAGE PRIORITY ROUTING</span>
          </div>
        </div>

        {/* Mission Feed Cards */}
        <div className="flex flex-col gap-3">
          {AVAILABLE_MISSIONS.map((mission) => {
            const isHigh = mission.priority === 'high';
            const isMedium = mission.priority === 'medium';
            const isLow = mission.priority === 'low';

            const borderAccent = isHigh
              ? 'border-l-4 border-l-[#FF4D4D]'
              : isMedium
              ? 'border-l-4 border-l-[#FFD43B]'
              : 'border-l-4 border-l-[#3a6080]';

            const priorityBadge = isHigh ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FF4D4D]/15 border border-[#FF4D4D]/35 text-[#FF4D4D] text-[10px] font-mono font-bold">
                HIGH PRIORITY
              </span>
            ) : isMedium ? (
              <span className="px-2 py-0.5 rounded-md bg-[#FFD43B]/15 border border-[#FFD43B]/35 text-[#FFD43B] text-[10px] font-mono font-bold">
                MEDIUM PRIORITY
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#3a6080]/20 border border-[#3a6080]/40 text-[#8AA3BC] text-[10px] font-mono font-bold">
                LOW PRIORITY
              </span>
            );

            return (
              <div
                key={mission.id}
                id={`mission-card-${mission.id}`}
                className={`tactical-panel rounded-2xl p-5 ${borderAccent} flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#0c223a] transition-all`}
              >
                {/* Information */}
                <div className="flex-1">
                  {/* Priority and Sector Tags */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {priorityBadge}
                    <span className="text-[11px] font-mono text-[#7A9BB8]">
                      {mission.sector} • {mission.incidentType}
                    </span>
                    {mission.tag && (
                      <span className="text-[10px] font-mono font-bold text-[#FFD43B] tracking-wider">
                        {mission.tag}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-base font-bold text-white mb-1">
                    {mission.title}
                  </h4>
                  <p className="text-xs text-[#8AA3BC] mb-3">
                    {mission.description}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#8AA3BC]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00D4FF]" />
                      <span>{mission.distance}</span>
                    </div>
                    <span className="text-[#204060]">•</span>
                    <div className="flex items-center gap-1 text-[#FFD43B] font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{mission.eta}</span>
                    </div>
                    <span className="text-[#204060]">•</span>
                    <div className="flex items-center gap-1">
                      {isHigh ? (
                        <>
                          <Waves className="w-3.5 h-3.5 text-[#00D4FF]" />
                          <span>{mission.hazardDetail}</span>
                        </>
                      ) : isMedium ? (
                        <>
                          <Wrench className="w-3.5 h-3.5 text-[#FFD43B]" />
                          <span>{mission.accessReq}</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-3.5 h-3.5 text-[#8AA3BC]" />
                          <span>{mission.accessReq}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Open Button */}
                <div className="flex items-center md:self-center">
                  <button
                    id={`open-btn-${mission.id}`}
                    onClick={() => onOpenMission(mission.id)}
                    className="w-full md:w-auto px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer group hover:scale-105 active:scale-95 bg-[#0e253e] hover:bg-[#00D4FF] text-[#d8e3f7] hover:text-[#081321] border border-[#1b436c] hover:border-[#00D4FF] hover:shadow-[0_0_22px_rgba(0,212,255,0.6)]"
                  >
                    <span>OPEN</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="mt-4 pt-4 border-t border-[#132c47] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#8AA3BC]">
          <Network className="w-4 h-4 text-[#00D4FF]" />
          <span className="tracking-widest uppercase text-[11px] font-semibold">Rescue Network</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] shadow-[0_0_6px_#2ECC71]"></span>
            <span className="text-[#7A9BB8]">COMMUNICATION:</span>
            <span className="text-[#2ECC71] font-semibold">{SYSTEM_TELEMETRY.commsStatus}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] shadow-[0_0_6px_#2ECC71]"></span>
            <span className="text-[#7A9BB8]">GPS:</span>
            <span className="text-[#2ECC71] font-semibold">{SYSTEM_TELEMETRY.gpsStatus}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00D4FF] shadow-[0_0_6px_#00D4FF]"></span>
            <span className="text-[#7A9BB8]">NAVIGATION:</span>
            <span className="text-[#00D4FF] font-semibold">{SYSTEM_TELEMETRY.navStatus}</span>
          </div>
        </div>
      </div>

      {/* Copyright & Encryption Stream */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-6 text-[10px] font-mono text-[#547391]">
        <span>© RESQNOVA TACTICAL FLIGHT COMMAND</span>
        <span>SEC-LEVEL 4 ENCRYPTED STREAM</span>
      </div>
    </div>
  );
};
