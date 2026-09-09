import React from 'react';
import { Clock, Timer, Zap } from 'lucide-react';

interface ETACardProps {
  etaMinutes: string;
  subtext?: string;
  variant?: 'metric' | 'header';
  isCritical?: boolean;
}

export const ETACard: React.FC<ETACardProps> = ({
  etaMinutes,
  subtext = 'Green Corridor Sync',
  variant = 'metric',
  isCritical = false,
}) => {
  if (variant === 'header') {
    return (
      <div
        id="eta-header-card"
        className="p-4 rounded-lg bg-[#0B1F36]/85 backdrop-blur-md border border-[#00B8E6]/25 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase font-display">
            CALCULATED ETA
          </span>
          <Timer className="w-4 h-4 text-[#00D4FF]" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-[#00D4FF] tabular-nums font-display">
            {etaMinutes}
          </span>
          <span className="text-xs font-bold text-[#FF4D4D] tracking-wider uppercase font-display">
            MIN CRITICAL
          </span>
        </div>
      </div>
    );
  }

  return (
    <div id="eta-transit-metric" className="flex flex-col">
      <div className="text-[10px] font-bold tracking-[0.08em] text-[#8EADC7] uppercase mb-1 font-display">
        ESTIMATED TRANSIT
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#00D4FF] tabular-nums font-display">
          {etaMinutes}
        </span>
        <span className="text-sm font-bold text-[#00D4FF] tracking-wider uppercase font-display">
          MIN
        </span>
      </div>
      <div className="text-xs text-[#2ECC71] mt-0.5 flex items-center gap-1 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
        {subtext}
      </div>
    </div>
  );
};
