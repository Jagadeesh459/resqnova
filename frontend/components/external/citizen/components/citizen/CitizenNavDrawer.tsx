import React, { useEffect } from 'react';
import { usePathname, Link } from '../../lib/router';
import {
  X,
  Shield,
  Home,
  Route,
  House,
  Bell,
  Siren,
  Phone,
  Headphones,
  Ambulance,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CitizenNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CitizenNavDrawer: React.FC<CitizenNavDrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCurrent = (path: string) => {
    if (path === '/citizen') {
      return pathname === '/citizen' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in" id="menu-drawer-container">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#040f1c]/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        id="menu-drawer-backdrop"
      />

      {/* Drawer Panel */}
      <aside
        className="relative w-full max-w-md bg-[#111c2a] shadow-2xl p-6 flex flex-col justify-between border-r border-[#3c494e]/30 z-50 overflow-y-auto"
        id="menu-drawer-panel"
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#202b39]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/20 flex items-center justify-center text-[#00d4ff]">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#00d4ff] tracking-tight">
                  ResQNova Portal
                </span>
                <span className="text-[11px] text-[#bbc9cf] font-medium">
                  Citizen Evacuation Network
                </span>
              </div>
            </div>
            <button
              aria-label="Close menu drawer"
              className="w-10 h-10 rounded-lg bg-[#202b39] flex items-center justify-center text-[#d8e3f7] hover:bg-[#2f3a49] transition-colors cursor-pointer"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {/* 1. Home */}
            <Link
              href="/citizen"
              onClick={onClose}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isCurrent('/citizen')
                  ? 'bg-[#2b3545] border border-[#00d4ff]/30 text-[#3cd7ff]'
                  : 'hover:bg-[#202b39] text-[#d8e3f7]'
              }`}
            >
              <Home className="w-6 h-6 text-[#00d4ff] mt-0.5 shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#00d4ff]">
                    Citizen Portal Home
                  </span>
                  {isCurrent('/citizen') && (
                    <span className="px-2 py-0.5 rounded-full bg-[#00d4ff]/20 text-[#a8e8ff] text-[10px] uppercase font-bold">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#bbc9cf] mt-0.5">
                  Overview, live alerts, and rapid guidance
                </span>
              </div>
            </Link>

            {/* 2. Safe Route */}
            <Link
              href="/citizen/safe-route"
              onClick={onClose}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isCurrent('/citizen/safe-route')
                  ? 'bg-[#2b3545] border border-[#4ae183]/30 text-[#4ae183]'
                  : 'hover:bg-[#202b39] text-[#d8e3f7]'
              }`}
            >
              <Route className="w-6 h-6 text-[#4ae183] mt-0.5 shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-semibold text-[#d8e3f7]">
                    Evacuation Corridors
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#4ae183]/15 text-[#4ae183] text-[10px] uppercase font-bold">
                    Safe Routes
                  </span>
                </div>
                <span className="text-xs text-[#bbc9cf] mt-0.5">
                  Elevated dry navigation to safe shelter
                </span>
              </div>
            </Link>

            {/* 3. Shelters */}
            <Link
              href="/citizen/shelters"
              onClick={onClose}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isCurrent('/citizen/shelters')
                  ? 'bg-[#2b3545] border border-[#00d4ff]/30 text-[#3cd7ff]'
                  : 'hover:bg-[#202b39] text-[#d8e3f7]'
              }`}
            >
              <House className="w-6 h-6 text-[#00d4ff] mt-0.5 shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-semibold text-[#d8e3f7]">
                    Emergency Shelters
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2b3545] text-[#bbc9cf] text-[10px] uppercase font-bold">
                    14 Live
                  </span>
                </div>
                <span className="text-xs text-[#bbc9cf] mt-0.5">
                  Real-time bed availability &amp; amenities
                </span>
              </div>
            </Link>

            {/* 4. Alerts */}
            <Link
              href="/citizen/alerts"
              onClick={onClose}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isCurrent('/citizen/alerts')
                  ? 'bg-[#2b3545] border border-[#ffb4ab]/30 text-[#ffb4ab]'
                  : 'hover:bg-[#202b39] text-[#d8e3f7]'
              }`}
            >
              <Bell className="w-6 h-6 text-[#ffb4ab] mt-0.5 shrink-0" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-semibold text-[#d8e3f7]">
                    Disaster Bulletins
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] uppercase font-bold">
                    Level 3
                  </span>
                </div>
                <span className="text-xs text-[#bbc9cf] mt-0.5">
                  Meteorological &amp; flood advisories
                </span>
              </div>
            </Link>

            {/* 5. SOS Emergency */}
            <Link
              href="/citizen/sos-emergency"
              onClick={onClose}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffdad7] hover:bg-[#93000a]/40 transition-colors mt-1"
            >
              <Siren className="w-6 h-6 text-[#ffb4ab] mt-0.5 shrink-0 animate-pulse" />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-['Plus_Jakarta_Sans'] text-[15px] font-bold text-[#ffb4ab]">
                    Distress Beacon &amp; War Room
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffb4ab] text-[#690005] text-[10px] uppercase font-bold animate-pulse">
                    Priority 01
                  </span>
                </div>
                <span className="text-xs text-[#bbc9cf] mt-0.5">
                  24/7 priority emergency dispatch
                </span>
              </div>
            </Link>
          </nav>

          <button type="button" onClick={handleSignOut} className="flex items-center gap-3 rounded-xl border border-[#ffb4ab]/25 bg-[#93000a]/15 p-3 text-sm font-bold text-[#ffb4ab] transition hover:bg-[#93000a]/30">
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>

        {/* Direct Emergency Lines */}
        <div className="flex flex-col gap-3 pt-6 border-t border-[#202b39] mt-6">
          <span className="text-[11px] uppercase tracking-wider text-[#bbc9cf] font-bold">
            Direct Emergency Lines
          </span>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:112"
              className="flex flex-col p-2.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors"
            >
              <span className="text-[11px] text-[#4ae183] font-bold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> 112
              </span>
              <span className="text-[11px] text-[#bbc9cf]">National Emergency</span>
            </a>
            <a
              href="tel:08662424100"
              className="flex flex-col p-2.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors"
            >
              <span className="text-[11px] text-[#a8e8ff] font-bold flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" /> 0866-2424100
              </span>
              <span className="text-[11px] text-[#bbc9cf]">War Room Helpline</span>
            </a>
            <a
              href="tel:1070"
              className="flex flex-col p-2.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors"
            >
              <span className="text-[11px] text-[#d8e3f7] font-bold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 1070
              </span>
              <span className="text-[11px] text-[#bbc9cf]">NDRF Disaster line</span>
            </a>
            <a
              href="tel:108"
              className="flex flex-col p-2.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors"
            >
              <span className="text-[11px] text-[#ffb4ab] font-bold flex items-center gap-1">
                <Ambulance className="w-3.5 h-3.5" /> 108
              </span>
              <span className="text-[11px] text-[#bbc9cf]">Paramedic / Medical</span>
            </a>
          </div>
          <div className="text-[11px] text-[#bbc9cf] text-center pt-2">
            NTR District Vijayawada Civil Defense Network
          </div>
        </div>
      </aside>
    </div>
  );
};
