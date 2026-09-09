import React from 'react';
import { SlidersHorizontal, CheckCircle2, RotateCcw } from 'lucide-react';

interface StatusToggleProps {
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY';
  onStatusChange?: (newStatus: 'AVAILABLE' | 'EN_ROUTE' | 'ARRIVED' | 'STANDBY') => void;
  variant?: 'panel' | 'bar';
}

export const StatusToggle: React.FC<StatusToggleProps> = ({
  status,
  onStatusChange,
  variant = 'panel',
}) => {
  const isAvailable = status === 'AVAILABLE' || status === 'STANDBY';

  const handleToggle = () => {
    if (!onStatusChange) return;
    if (status === 'AVAILABLE') {
      onStatusChange('EN_ROUTE');
    } else if (status === 'EN_ROUTE') {
      onStatusChange('ARRIVED');
    } else if (status === 'ARRIVED') {
      onStatusChange('STANDBY');
    } else {
      onStatusChange('AVAILABLE');
    }
  };

  if (variant === 'bar') {
    return (
      <button
        type="button"
        id="status-toggle-bar"
        onClick={handleToggle}
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0B1F36]/80 border border-[#00B8E6]/25 hover:border-[#00D4FF]/60 transition-all text-left group w-full"
      >
        <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-[#2ECC71] shadow-[0_0_10px_#2ECC71]' : 'bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]'} animate-pulse`} />
        <div className="flex-1">
          <div className="text-xs text-[#8EADC7] font-semibold tracking-wider uppercase">CURRENT STATUS</div>
          <div className="text-sm font-bold text-white tracking-wide">{status}</div>
        </div>
        <span className="text-[11px] font-mono text-[#00D4FF] opacity-80 group-hover:opacity-100 uppercase tracking-wider">TAP TO CHANGE</span>
      </button>
    );
  }

  return (
    <div
      id="unit-posture-card"
      className="p-5 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 shadow-lg relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase font-display">
          UNIT POSTURE
        </span>
        <button
          type="button"
          id="posture-settings-btn"
          aria-label="Posture settings"
          className="text-[#8EADC7] hover:text-[#00D4FF] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h2 className="text-xl font-bold text-white tracking-tight font-display mb-1.5">
        Ambulance Status
      </h2>
      <p className="text-sm text-[#8EADC7] leading-relaxed mb-4">
        {status === 'AVAILABLE'
          ? 'Vehicle online and cleared for priority emergency dispatch.'
          : status === 'EN_ROUTE'
          ? 'Active code-red transit. Signal preemption priority engaged.'
          : status === 'ARRIVED'
          ? 'Unit safely docked at Govt General Hospital trauma ramp.'
          : 'Standby posture. Ready for incoming dispatch tasking.'}
      </p>

      {/* Interactive Toggle Pill Button */}
      <button
        type="button"
        id="ambulance-status-toggle-btn"
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3.5 rounded-lg bg-[#081321]/90 border border-[#00B8E6]/30 hover:border-[#00D4FF]/70 hover:shadow-[0_0_15px_rgba(0,212,255,0.15)] transition-all text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                status === 'AVAILABLE'
                  ? 'bg-[#2ECC71] shadow-[0_0_10px_#2ECC71]'
                  : status === 'EN_ROUTE'
                  ? 'bg-[#00D4FF] shadow-[0_0_10px_#00D4FF]'
                  : 'bg-[#FFD43B] shadow-[0_0_10px_#FFD43B]'
              }`}
            />
            <span
              className={`absolute w-3.5 h-3.5 rounded-full animate-ping opacity-50 ${
                status === 'AVAILABLE'
                  ? 'bg-[#2ECC71]'
                  : status === 'EN_ROUTE'
                  ? 'bg-[#00D4FF]'
                  : 'bg-[#FFD43B]'
              }`}
            />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide font-display">
              {status === 'AVAILABLE'
                ? 'AVAILABLE'
                : status === 'EN_ROUTE'
                ? 'EN ROUTE'
                : status === 'ARRIVED'
                ? 'ARRIVED AT GGH'
                : 'STANDBY'}
            </div>
            <div className="text-xs text-[#8EADC7]">
              {status === 'AVAILABLE'
                ? 'Immediate Assignment Ready'
                : status === 'EN_ROUTE'
                ? 'Corridor Transit Active'
                : status === 'ARRIVED'
                ? 'Trauma Bay Docked'
                : 'Standby Unit Staged'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-[#8EADC7] group-hover:text-[#00D4FF] transition-colors tracking-wider font-display">
            TAP TO
            <br />
            CHANGE
          </span>
        </div>
      </button>
    </div>
  );
};
