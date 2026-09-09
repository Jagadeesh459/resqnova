import React from 'react';
import { usePathname, Link } from '../../lib/router';
import { Menu, Phone, Siren, User, ShieldAlert } from 'lucide-react';

interface CitizenHeaderProps {
  onOpenMenu: () => void;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({ onOpenMenu }) => {
  const pathname = usePathname();

  const isCurrent = (path: string) => {
    if (path === '/citizen') {
      return pathname === '/citizen' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#091422]/90 backdrop-blur-xl border-b border-[#3c494e]/30 shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
        {/* Left: Menu toggle & Brand */}
        <div className="flex items-center gap-4">
          <button
            id="btn-menu-drawer"
            aria-label="Open menu drawer"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#202b39] text-[#d8e3f7] hover:bg-[#2f3a49] transition-colors cursor-pointer"
            type="button"
            onClick={onOpenMenu}
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/citizen" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/20 border border-[#00d4ff]/40 flex items-center justify-center text-[#00d4ff] group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#00d4ff] tracking-tight whitespace-nowrap hidden sm:inline">
              RESQNOVA Citizen Portal
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1.5">
          <Link
            href="/citizen"
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              isCurrent('/citizen')
                ? 'bg-[#2b3545] text-[#3cd7ff] shadow-sm'
                : 'text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Home
          </Link>
          <Link
            href="/citizen/safe-route"
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              isCurrent('/citizen/safe-route')
                ? 'bg-[#2b3545] text-[#3cd7ff] shadow-sm'
                : 'text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Safe Route
          </Link>
          <Link
            href="/citizen/shelters"
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              isCurrent('/citizen/shelters')
                ? 'bg-[#2b3545] text-[#3cd7ff] shadow-sm'
                : 'text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Shelters
          </Link>
          <Link
            href="/citizen/alerts"
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              isCurrent('/citizen/alerts')
                ? 'bg-[#2b3545] text-[#3cd7ff] shadow-sm'
                : 'text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Alerts
          </Link>
          <Link
            href="/citizen/sos-emergency"
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              isCurrent('/citizen/sos-emergency')
                ? 'bg-[#93000a] text-[#ffdad7] shadow-sm'
                : 'text-[#ffb4ab] hover:bg-[#93000a]/30'
            }`}
          >
            SOS Emergency
          </Link>
        </nav>

        {/* Right: Helpline, SOS Call & Avatar */}
        <div className="flex items-center gap-3">
          <a
            href="tel:112"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#202b39] text-[#4ae183] hover:bg-[#2f3a49] text-sm font-semibold transition-colors whitespace-nowrap border border-[#4ae183]/20"
          >
            <Phone className="w-4 h-4" />
            <span>112 Helpline</span>
          </a>

          <Link
            href="/citizen/sos-emergency"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#93000a] text-[#ffdad7] font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase tracking-wider hover:bg-[#68000b] transition-all animate-pulse whitespace-nowrap shadow-[0_0_16px_rgba(255,77,77,0.35)]"
          >
            <Siren className="w-4 h-4" />
            <span>* SOS</span>
          </Link>

          <div
            className="w-8 h-8 rounded-full bg-[#a8e8ff] text-[#003642] flex items-center justify-center shrink-0 font-bold shadow-md cursor-pointer hover:opacity-90"
            title="Citizen Profile / Check-in"
          >
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
