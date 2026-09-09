import React, { useState } from 'react';
import { Ambulance, Radio, Clock, ShieldCheck, ChevronRight, Stethoscope, Users, CheckCircle2 } from 'lucide-react';
import { mockAmbulanceData } from '../../data/mockData';

interface HistoryCardProps {
  shiftElapsed?: string;
  activeCrew?: string;
  priorityChannel?: string;
  completedTasksCount?: number;
  onViewEquipment?: () => void;
  onViewIncidentLog?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  shiftElapsed = mockAmbulanceData.shiftElapsed,
  activeCrew = mockAmbulanceData.activeCrew,
  priorityChannel = mockAmbulanceData.priorityChannel,
  completedTasksCount = mockAmbulanceData.completedTasks.length,
  onViewEquipment,
  onViewIncidentLog,
}) => {
  const [showRoster, setShowRoster] = useState(false);

  return (
    <div
      id="shift-summary-card"
      className="p-5 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 shadow-lg flex flex-col justify-between"
    >
      <div>
        <div className="text-[11px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase font-display mb-1.5">
          SHIFT & TELEMETRY COMMS
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight font-display mb-4">
          Shift Summary
        </h2>

        <div className="space-y-3.5">
          {/* Active Crew */}
          <div
            className="flex items-center justify-between pb-3 border-b border-[#00B8E6]/15 hover:bg-white/[0.02] p-1.5 rounded transition-colors cursor-pointer"
            onClick={() => setShowRoster(!showRoster)}
            title="Click to view full crew roster"
          >
            <div className="flex items-center gap-2.5 text-[#8EADC7]">
              <Ambulance className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-xs font-semibold tracking-wide">Active Crew</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white font-display">
              <span>{activeCrew}</span>
              <ChevronRight className={`w-3.5 h-3.5 text-[#8EADC7] transition-transform ${showRoster ? 'rotate-90 text-[#00D4FF]' : ''}`} />
            </div>
          </div>

          {showRoster && (
            <div className="p-3 rounded-md bg-[#081321]/90 border border-[#00B8E6]/30 text-xs space-y-1.5 animate-fadeIn">
              <div className="text-[10px] uppercase font-bold text-[#00D4FF] tracking-wider mb-1">Assigned NTR Unit Crew</div>
              {mockAmbulanceData.crewMembers.map((member, i) => (
                <div key={i} className="text-[#8EADC7] flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#00D4FF]" />
                  {member}
                </div>
              ))}
            </div>
          )}

          {/* Priority Channel */}
          <div className="flex items-center justify-between pb-3 border-b border-[#00B8E6]/15 p-1.5">
            <div className="flex items-center gap-2.5 text-[#8EADC7]">
              <Radio className="w-4 h-4 text-[#00D4FF]" />
              <span className="text-xs font-semibold tracking-wide">Priority Channel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ECC71] shadow-[0_0_8px_#2ECC71] animate-pulse" />
              <span className="text-xs font-bold text-[#2ECC71] font-display tracking-wider">
                {priorityChannel}
              </span>
            </div>
          </div>

          {/* Shift Elapsed */}
          <div className="flex items-center justify-between pb-3 border-b border-[#00B8E6]/15 p-1.5">
            <div className="flex items-center gap-2.5 text-[#8EADC7]">
              <Clock className="w-4 h-4 text-[#8EADC7]" />
              <span className="text-xs font-semibold tracking-wide">Shift Elapsed</span>
            </div>
            <span className="text-xs font-bold text-white font-mono tabular-nums tracking-widest">
              {shiftElapsed}
            </span>
          </div>

          {/* Completed Incident Tasks Log Link */}
          {onViewIncidentLog && (
            <div
              id="shift-summary-incident-log-btn"
              className="flex items-center justify-between pb-2 border-b border-[#00B8E6]/15 hover:bg-[#00D4FF]/5 p-1.5 rounded transition-colors cursor-pointer group"
              onClick={onViewIncidentLog}
              title="Click to view all completed tasks in incident log"
            >
              <div className="flex items-center gap-2.5 text-[#8EADC7] group-hover:text-[#00D4FF] transition-colors">
                <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                <span className="text-xs font-semibold tracking-wide">Incident Log</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2ECC71] font-display group-hover:text-white transition-colors">
                <span>{completedTasksCount} Completed</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#00D4FF] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Protocol Banner */}
      <div className="mt-4 pt-3 flex items-start gap-2.5 text-xs text-[#8EADC7]">
        <ShieldCheck className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5" />
        <span className="leading-snug">
          CAD auto-routing protocol active • V2X priority armed
        </span>
      </div>
    </div>
  );
};
