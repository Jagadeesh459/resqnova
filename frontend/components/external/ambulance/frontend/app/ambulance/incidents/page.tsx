'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Hospital,
  ShieldCheck,
  Radio,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  Ambulance,
  Zap,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { mockAmbulanceData, AmbulanceData } from '../../../data/mockData';

interface IncidentsPageProps {
  data?: AmbulanceData;
  onNavigateToDashboard?: () => void;
  onNavigateToAssignment?: () => void;
}

export default function AmbulanceIncidentsPage({
  data = mockAmbulanceData,
  onNavigateToDashboard,
  onNavigateToAssignment,
}: IncidentsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'URGENT' | 'HIGH'>('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const completedTasks = data.completedTasks || [];

  const filteredTasks = completedTasks.filter((task) => {
    const matchesFilter = selectedFilter === 'ALL' || task.priority === selectedFilter;
    const matchesSearch =
      task.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.callType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.receivingDoctor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedTask = completedTasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-7 max-w-[1440px] mx-auto w-full space-y-6">
      {/* Top Breadcrumb & Return Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="incidents-back-btn"
            onClick={onNavigateToDashboard}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B1F36] hover:bg-[#00D4FF]/20 border border-[#00B8E6]/30 text-xs font-bold font-display text-[#00D4FF] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>DASHBOARD</span>
          </button>
          <div className="h-4 w-[1px] bg-[#00B8E6]/25 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] shadow-[0_0_8px_#2ECC71]" />
            <span className="text-[11px] font-bold text-[#8EADC7] tracking-wider uppercase font-display">
              CAD AUDIT ARCHIVE • UNIT {data.vehicleCode}
            </span>
          </div>
        </div>

        {/* Quick Action to Active Assignment */}
        {onNavigateToAssignment && (
          <button
            type="button"
            id="incidents-goto-assignment-btn"
            onClick={onNavigateToAssignment}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/40 text-xs font-bold text-[#00D4FF] font-display tracking-wider transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>VIEW ACTIVE ASSIGNMENT</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Title & Shift Completed Metrics Banner */}
      <div
        id="incident-log-header-card"
        className="p-5 sm:p-6 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase font-display bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/30">
              DISPATCHED TASKS ARCHIVE
            </span>
            <span className="text-xs text-[#8EADC7] font-mono">
              SHIFT: {data.shiftElapsed} ELAPSED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
            Incident Log & Completed Tasks
          </h1>
          <p className="text-xs sm:text-sm text-[#8EADC7] mt-1">
            Official NTR District emergency medical response records, green corridor timestamps, and hospital receiving sign-offs.
          </p>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#081321] border border-[#00B8E6]/20">
            <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
              COMPLETED
            </div>
            <div className="text-2xl font-bold text-white font-display mt-0.5">
              {completedTasks.length}
            </div>
            <div className="text-[10px] text-[#2ECC71] font-semibold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> 100% Handed Off
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#081321] border border-[#00B8E6]/20">
            <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
              AVG TRANSIT
            </div>
            <div className="text-2xl font-bold text-[#00D4FF] font-display mt-0.5">
              08m
            </div>
            <div className="text-[10px] text-[#8EADC7]">Green Corridor</div>
          </div>

          <div className="p-3 rounded-lg bg-[#081321] border border-[#00B8E6]/20">
            <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
              V2X PREEMPTION
            </div>
            <div className="text-2xl font-bold text-[#2ECC71] font-display mt-0.5">
              99.2%
            </div>
            <div className="text-[10px] text-[#8EADC7]">26 Signals Cleared</div>
          </div>

          <div className="p-3 rounded-lg bg-[#081321] border border-[#00B8E6]/20">
            <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
              TOTAL RUNS
            </div>
            <div className="text-2xl font-bold text-white font-display mt-0.5">
              28.7
            </div>
            <div className="text-[10px] text-[#8EADC7]">Kilometers Covered</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8EADC7] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="search-completed-tasks-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by incident #, call type, or hospital..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0B1F36]/80 border border-[#00B8E6]/30 text-xs text-white placeholder-[#8EADC7]/60 focus:outline-none focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] transition-all font-sans"
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'CRITICAL', 'URGENT', 'HIGH'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              id={`filter-task-${filter.toLowerCase()}`}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-display tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === filter
                  ? 'bg-[#00D4FF] text-[#081321] shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                  : 'bg-[#0B1F36]/80 text-[#8EADC7] hover:text-white border border-[#00B8E6]/25'
              }`}
            >
              {filter === 'ALL' ? `ALL TASKS (${completedTasks.length})` : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-[#0B1F36]/60 border border-[#00B8E6]/20 text-[#8EADC7]">
            <FileCheck className="w-8 h-8 text-[#8EADC7]/50 mx-auto mb-2" />
            <div className="text-sm font-bold text-white font-display">No completed tasks match your criteria</div>
            <div className="text-xs mt-1">Try clearing your search query or switching filters.</div>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              id={`completed-task-${task.id}`}
              className="p-5 sm:p-6 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 hover:border-[#00D4FF]/60 shadow-lg transition-all"
            >
              {/* Task Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#00B8E6]/20">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-base font-bold text-white font-display tracking-wide">
                    {task.taskNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-display ${
                      task.priority === 'CRITICAL'
                        ? 'bg-[#FF4D4D]/20 text-[#FF8080] border border-[#FF4D4D]/40'
                        : task.priority === 'URGENT'
                        ? 'bg-[#FFA500]/20 text-[#FFA500] border border-[#FFA500]/40'
                        : 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40'
                    }`}
                  >
                    {task.priority} PRIORITY
                  </span>
                  <span className="text-xs text-white font-semibold font-display">
                    {task.callType}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2ECC71]/15 border border-[#2ECC71]/30 text-[#2ECC71] text-xs font-bold font-display">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>COMPLETED & HANDED OFF</span>
                  </div>
                  <span className="text-xs font-mono text-[#8EADC7]">
                    {task.completedTime}
                  </span>
                </div>
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 text-xs">
                {/* Column 1: Transit Locations */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#081321] border border-[#00B8E6]/30 flex items-center justify-center text-[#8EADC7] shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
                        ORIGIN INCIDENT LOCATION
                      </div>
                      <div className="font-bold text-white text-xs mt-0.5">
                        {task.origin}
                      </div>
                      <div className="text-[11px] text-[#8EADC7] mt-0.5">
                        {task.originDetail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#081321] border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF] shrink-0 mt-0.5 shadow-[0_0_6px_rgba(0,212,255,0.3)]">
                      <Hospital className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#00D4FF] uppercase font-display">
                        RECEIVING HOSPITAL FACILITY
                      </div>
                      <div className="font-bold text-white text-xs mt-0.5">
                        {task.destination}
                      </div>
                      <div className="text-[11px] text-[#8EADC7] mt-0.5">
                        {task.destinationFacility}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Telemetry & Corridor Speed */}
                <div className="space-y-2.5 p-3 rounded-lg bg-[#081321]/70 border border-[#00B8E6]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8EADC7] font-semibold">Total Transit Time:</span>
                    <span className="text-white font-mono font-bold">{task.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8EADC7] font-semibold">Route Distance:</span>
                    <span className="text-[#00D4FF] font-mono font-bold">{task.distance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8EADC7] font-semibold">Preemption Status:</span>
                    <span className="text-[#2ECC71] font-display font-bold">{task.preemptionScore}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8EADC7] font-semibold">Traffic Signals Armed:</span>
                    <span className="text-white font-mono font-bold">{task.junctionsCleared} Intersections</span>
                  </div>
                </div>

                {/* Column 3: Clinical Receiving & Signoff */}
                <div className="space-y-2.5 p-3 rounded-lg bg-[#081321]/70 border border-[#00B8E6]/20">
                  <div>
                    <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
                      RECEIVING PHYSICIAN / SIGN-OFF
                    </div>
                    <div className="text-white font-bold mt-0.5">
                      {task.receivingDoctor}
                    </div>
                    <div className="text-[10px] font-mono text-[#00D4FF] mt-0.5">
                      HANDOVER ID: {task.handoverId}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#00B8E6]/15">
                    <div className="text-[10px] font-bold text-[#8EADC7] uppercase font-display">
                      DISPATCH LEAD SIGN-OFF
                    </div>
                    <div className="text-white font-medium mt-0.5">
                      {task.crewSignoff}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Handover & Mission Outcome Note */}
              <div className="mt-2 p-3 rounded-md bg-[#081321]/90 border border-[#00B8E6]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-[#2ECC71] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white font-display">Outcome Summary: </span>
                    <span className="text-[#8EADC7]">{task.outcomeSummary}</span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`view-handover-report-btn-${task.id}`}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="shrink-0 px-3 py-1 rounded bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 border border-[#00D4FF]/40 text-[#00D4FF] hover:text-white text-[11px] font-bold font-display tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5 self-end sm:self-center"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>VIEW AUDIT RECORD</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Detail / Audit Modal */}
      {selectedTask && (
        <div
          id="task-audit-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedTaskId(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#081321] border border-[#00D4FF]/50 rounded-xl p-6 shadow-[0_0_40px_rgba(0,212,255,0.25)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#00B8E6]/25">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B1F36] border border-[#00D4FF]/40 flex items-center justify-center text-[#00D4FF]">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    CAD Incident Audit Record
                  </h3>
                  <div className="text-xs text-[#8EADC7] font-mono">
                    {selectedTask.taskNumber} • NTR District Metro CAD
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="close-audit-modal-btn"
                onClick={() => setSelectedTaskId(null)}
                className="w-7 h-7 rounded bg-[#0B1F36] border border-[#00B8E6]/30 text-[#8EADC7] hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded bg-[#0B1F36] border border-[#00B8E6]/20">
                  <div className="text-[10px] text-[#8EADC7] font-display uppercase font-bold">Call Type</div>
                  <div className="text-white font-bold text-xs mt-0.5">{selectedTask.callType}</div>
                </div>
                <div className="p-2.5 rounded bg-[#0B1F36] border border-[#00B8E6]/20">
                  <div className="text-[10px] text-[#8EADC7] font-display uppercase font-bold">Priority Tier</div>
                  <div className="text-[#FF8080] font-bold text-xs mt-0.5">{selectedTask.priority} PRIORITY</div>
                </div>
                <div className="p-2.5 rounded bg-[#0B1F36] border border-[#00B8E6]/20">
                  <div className="text-[10px] text-[#8EADC7] font-display uppercase font-bold">Handover ID</div>
                  <div className="text-[#00D4FF] font-mono font-bold text-xs mt-0.5">{selectedTask.handoverId}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0B1F36]/80 border border-[#00B8E6]/20 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#00B8E6]/15">
                  <span className="text-[#8EADC7]">Dispatch Time:</span>
                  <span className="text-white font-mono font-semibold">{selectedTask.dispatchedTime}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#00B8E6]/15">
                  <span className="text-[#8EADC7]">Hospital Dock Arrival:</span>
                  <span className="text-[#2ECC71] font-mono font-bold">{selectedTask.completedTime}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#00B8E6]/15">
                  <span className="text-[#8EADC7]">Origin:</span>
                  <span className="text-white font-semibold">{selectedTask.origin} ({selectedTask.originDetail})</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#00B8E6]/15">
                  <span className="text-[#8EADC7]">Destination Facility:</span>
                  <span className="text-[#00D4FF] font-semibold">{selectedTask.destination} - {selectedTask.destinationFacility}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#00B8E6]/15">
                  <span className="text-[#8EADC7]">Receiving Physician:</span>
                  <span className="text-white font-bold">{selectedTask.receivingDoctor}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8EADC7]">Attending Paramedic:</span>
                  <span className="text-white font-bold">{selectedTask.crewSignoff}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#081321] border border-[#2ECC71]/30">
                <div className="text-[10px] font-bold text-[#2ECC71] tracking-wider uppercase font-display mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED CLINICAL & TELEMETRY HANDOVER
                </div>
                <p className="text-xs text-[#d8e3f7] leading-relaxed">
                  {selectedTask.outcomeSummary}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#00B8E6]/25">
              <button
                type="button"
                id="close-modal-confirm-btn"
                onClick={() => setSelectedTaskId(null)}
                className="px-4 py-2 rounded-md bg-[#00D4FF] text-[#081321] text-xs font-bold font-display tracking-wider uppercase hover:bg-white transition-all cursor-pointer shadow-[0_0_15px_rgba(0,212,255,0.4)]"
              >
                CLOSE AUDIT RECORD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
