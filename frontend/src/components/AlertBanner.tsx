import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface AlertBannerProps {
  type?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  message: string;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'info',
  title,
  message,
  className = '',
  action,
}) => {
  const styles = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
      icon: <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
    },
    danger: {
      bg: 'bg-red-500/10 border-red-500/30 text-red-200',
      icon: <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />,
    },
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div
      id="alert-banner"
      className={`flex items-start justify-between gap-3 p-3.5 rounded-lg border ${current.bg} ${className}`}
    >
      <div className="flex items-start gap-3">
        {current.icon}
        <div className="text-sm">
          {title && <h5 className="font-semibold text-white mb-0.5">{title}</h5>}
          <p className="leading-relaxed opacity-95">{message}</p>
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
