import React from 'react';
import { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const styles: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
    admin: {
      label: 'Authority Admin (Collectorate)',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
    citizen: {
      label: 'Citizen Resident',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    rescue: {
      label: 'NDRF / SDRF Rescue Squad',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    ambulance: {
      label: '108 Ambulance Unit',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    shelter: {
      label: 'Shelter Coordinator',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    hospital: {
      label: 'Hospital Chief',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
    },
  };

  const current = styles[role] || styles.citizen;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      id={`role-badge-${role}`}
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${padding}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      {current.label}
    </span>
  );
};
