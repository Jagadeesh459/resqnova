import React from 'react';
import { ShieldAlert, Radio, Activity, LogOut } from 'lucide-react';
import { RESCUE_LEAD } from '../data/mockData';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  currentTab: 'dashboard' | 'navigation';
  onSelectTab: (tab: 'dashboard' | 'navigation') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const handleSignOut = async () => {
    await createClient().auth.signOut();
    window.location.href = '/login';
  };
  return (
    <header className="w-full bg-[#07111e]/90 backdrop-blur-md border-b border-[#00b8e6]/15 sticky top-0 z-50">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Brand & Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Logo & Callout */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onSelectTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-[#061525] border border-[#00D4FF] flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.35)] group-hover:shadow-[0_0_18px_rgba(0,212,255,0.6)] transition-all">
              <ShieldAlert className="w-4.5 h-4.5 text-[#00D4FF] stroke-[2.2]" />
            </div>
            <div className="leading-tight">
              <div className="text-white font-bold text-sm tracking-[0.14em] flex items-center gap-1.5">
                RESQNOVA
              </div>
              <div className="text-[9px] font-mono tracking-[0.2em] text-[#7A9BB8] uppercase">
                Rescue Operations
              </div>
            </div>
          </div>

          {/* Navigation Pill Buttons */}
          <nav className="flex items-center gap-1 bg-[#050e18]/80 p-1 rounded-lg border border-[#152e4d]/80">
            <button
              id="nav-rescue-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-[#00D4FF] text-[#081321] shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                  : 'text-[#8AA3BC] hover:text-white hover:bg-[#0f243b]/50'
              }`}
            >
              Rescue Dashboard
            </button>
            <button
              id="nav-active-navigation"
              onClick={() => onSelectTab('navigation')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                currentTab === 'navigation'
                  ? 'bg-[#00D4FF] text-[#081321] shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                  : 'text-[#8AA3BC] hover:text-white hover:bg-[#0f243b]/50'
              }`}
            >
              Active Mission & Navigation
            </button>
          </nav>
        </div>

        {/* Right Status Badges & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Status Badges */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B1E34] border border-[#163654] text-[11px] font-mono text-[#7ce2fe]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_6px_#00D4FF] animate-pulse"></span>
              SYSTEM ONLINE
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B1E34] border border-[#163654] text-[11px] font-mono text-[#8AA3BC]">
              NTR DISTRICT • LIVE
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#152e4d]/70">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-[#E6F4FA]">
                {RESCUE_LEAD.name}
              </div>
              <div className="text-[9px] font-mono tracking-wider text-[#7A9BB8]">
                {RESCUE_LEAD.role}
              </div>
            </div>
          <div className="relative">
              <img
                src={RESCUE_LEAD.avatarUrl}
                alt={RESCUE_LEAD.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-[#00D4FF]/40 ring-2 ring-[#0B1F36]"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#00D4FF] border-2 border-[#081321]"></span>
            </div>
          </div>
          <button type="button" onClick={handleSignOut} title="Sign out" className="rounded-lg border border-[#ff4d4d]/30 bg-[#ff4d4d]/10 p-2 text-[#ff8a8a] transition hover:bg-[#ff4d4d]/20">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
