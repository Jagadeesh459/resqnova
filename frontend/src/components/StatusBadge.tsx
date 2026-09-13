import React from 'react';
import { PriorityLevel, RequestStatus } from '../types';

interface StatusBadgeProps {
  status?: RequestStatus | 'available' | 'deployed' | 'maintenance' | 'open' | 'flooded' | 'blocked';
  priority?: PriorityLevel;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, className = '' }) => {
  if (priority) {
    const priorityStyles: Record<PriorityLevel, { bg: string; text: string; border: string }> = {
      Critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/40' },
      High: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' },
      Moderate: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' },
      Low: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    };

    const style = priorityStyles[priority] || priorityStyles.Moderate;
    return (
      <span
        id={`priority-badge-${priority.toLowerCase()}`}
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border} ${className}`}
      >
        {priority} Priority
      </span>
    );
  }

  if (status) {
    const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
      pending: { label: 'SOS Pending', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
      triaged: { label: 'AI Triaged', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
      assigned: { label: 'Resource Assigned', bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
      en_route: { label: 'En Route', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
      on_scene: { label: 'On Scene', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      completed: { label: 'Resolved / Evacuated', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      available: { label: 'Available', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      deployed: { label: 'Deployed', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
      open: { label: 'Road Open', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      flooded: { label: 'Flooded', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
      blocked: { label: 'Blocked', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    };

    const s = statusMap[status] || {
      label: status,
      bg: 'bg-slate-700/40',
      text: 'text-slate-300',
      border: 'border-slate-600',
    };

    return (
      <span
        id={`status-badge-${status}`}
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.bg} ${s.text} ${s.border} ${className}`}
      >
        {s.label}
      </span>
    );
  }

  return null;
};
