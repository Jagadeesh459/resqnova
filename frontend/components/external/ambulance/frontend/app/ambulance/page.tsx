'use client';

import React, { useState } from 'react';
import {
  Ambulance,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  ChevronRight,
  Stethoscope,
  Wrench,
  AlertCircle,
} from 'lucide-react';
import { AssignmentCard } from '../../components/ambulance/AssignmentCard';
import { StatusToggle } from '../../components/ambulance/StatusToggle';
import { HistoryCard } from '../../components/ambulance/HistoryCard';
import { mockAmbulanceData, AmbulanceData } from '../../data/mockData';

interface AmbulanceDashboardPageProps {
  data?: AmbulanceData;
  onNavigateToAssignment?: () => void;
  onNavigateToIncidents?: () => void;
  onStatusChange?: (status: 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY') => void;
}

export default function AmbulanceDashboardPage({
  data = mockAmbulanceData,
  onNavigateToAssignment,
  onNavigateToIncidents,
  onStatusChange,
}: AmbulanceDashboardPageProps) {
  const [currentStatus, setCurrentStatus] = useState<
    'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY'
  >(data.status === 'READY' ? 'AVAILABLE' : data.status);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  const handleStatusChange = (
    newStatus: 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY'
  ) => {
    setCurrentStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 max-w-[1440px] mx-auto w-full">
      {/* Top Hero Vehicle Header Card */}
      <div
        id="vehicle-header-card"
        className="p-5 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#081321] border border-[#00B8E6]/30 flex items-center justify-center text-[#00D4FF] shrink-0 shadow-[0_0_12px_rgba(0,212,255,0.2)]">
            <Ambulance className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
                {data.vehicleCode}
              </h1>
              <span className="px-2.5 py-0.5 rounded-sm bg-[#16202F] border border-[#00B8E6]/30 text-[#00D4FF] text-[11px] font-bold tracking-wider uppercase font-display">
                {data.vehicleType}
              </span>
            </div>
            <div className="text-xs text-[#8EADC7] mt-1 flex items-center gap-1.5 font-medium">
              <span className="text-[#00D4FF]">◎</span>
              <span>Station Base: {data.stationBase}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Status & Telemetry Sync Right Section */}
        <div className="flex items-center sm:items-end flex-col gap-1.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ECC71]/15 border border-[#2ECC71]/40 text-[#2ECC71] text-xs font-bold font-display shadow-[0_0_10px_rgba(46,204,113,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            <span>{currentStatus === 'AVAILABLE' ? 'UNIT READY' : currentStatus}</span>
          </div>
          <div className="text-[11px] font-bold text-[#8EADC7] tracking-wider uppercase font-display">
            GPS SYNC <span className="text-white">{data.gpsSync}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Current Assignment (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <AssignmentCard
            data={data.currentAssignment}
            onNavigate={onNavigateToAssignment}
            variant="dashboard"
          />

          {/* Quick Equipment Checklist Drawer Trigger */}
          <div className="p-4 rounded-lg bg-[#0B1F36]/60 border border-[#00B8E6]/20 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[#8EADC7]">
              <Wrench className="w-4 h-4 text-[#00D4FF]" />
              <span>Required Equipment Verified (6 / 6 Modules Online)</span>
            </div>
            <button
              type="button"
              id="view-equipment-btn"
              onClick={() => setShowEquipmentModal(true)}
              className="text-xs font-bold text-[#00D4FF] hover:underline uppercase tracking-wider font-display cursor-pointer"
            >
              View Roster & Gear
            </button>
          </div>
        </div>

        {/* Right Column: Unit Posture & Shift Comms (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Unit Posture Card */}
          <StatusToggle status={currentStatus} onStatusChange={handleStatusChange} />

          {/* Shift & Telemetry Comms Card */}
          <HistoryCard
            shiftElapsed={data.shiftElapsed}
            activeCrew={data.activeCrew}
            priorityChannel={data.priorityChannel}
            completedTasksCount={data.completedTasks?.length || 0}
            onViewEquipment={() => setShowEquipmentModal(true)}
            onViewIncidentLog={onNavigateToIncidents}
          />
        </div>
      </div>

      {/* Equipment & Crew Modal */}
      {showEquipmentModal && (
        <div
          id="equipment-modal"
          className="fixed inset-0 z-50 bg-[#040F1C]/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowEquipmentModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-[#0B1F36] border border-[#00B8E6]/40 p-6 shadow-2xl space-y-5 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#00B8E6]/20 pb-3">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-5 h-5 text-[#00D4FF]" />
                <h3 className="text-lg font-bold text-white font-display">
                  Required Equipment & Crew Specification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEquipmentModal(false)}
                className="text-[#8EADC7] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#00D4FF] uppercase tracking-wider mb-2 font-display">
                M-ICU Assigned Onboard Equipment
              </h4>
              <div className="space-y-2">
                {data.requiredEquipment.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-[#081321] border border-[#00B8E6]/20 flex items-center justify-between text-xs"
                  >
                    <span className="text-white font-medium">{item}</span>
                    <span className="text-[#2ECC71] text-[11px] font-bold font-mono">PASS / READY</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#00D4FF] uppercase tracking-wider mb-2 font-display">
                Assigned NTR District Crew Roster
              </h4>
              <div className="space-y-1.5 text-xs text-[#8EADC7]">
                {data.crewMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF]" />
                    <span>{member}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEquipmentModal(false)}
              className="w-full py-2.5 rounded-lg bg-[#00D4FF] text-[#081321] font-bold text-xs uppercase tracking-wider font-display hover:bg-[#3cd7ff]"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
