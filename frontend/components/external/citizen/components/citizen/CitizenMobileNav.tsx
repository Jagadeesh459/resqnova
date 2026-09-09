import React from 'react';
import { usePathname, Link } from '../../lib/router';
import { Home, Route, House, Bell, Siren } from 'lucide-react';

export const CitizenMobileNav: React.FC = () => {
  const pathname = usePathname();

  const isCurrent = (path: string) => {
    if (path === '/citizen') {
      return pathname === '/citizen' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#16202f]/95 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] border-t border-[#3c494e]/30 flex items-center justify-around h-16 px-1">
      <Link
        href="/citizen"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isCurrent('/citizen') ? 'text-[#00d4ff] font-semibold' : 'text-[#bbc9cf] hover:text-[#d8e3f7]'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[11px] mt-0.5">Home</span>
      </Link>

      <Link
        href="/citizen/safe-route"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isCurrent('/citizen/safe-route') ? 'text-[#00d4ff] font-semibold' : 'text-[#bbc9cf] hover:text-[#d8e3f7]'
        }`}
      >
        <Route className="w-5 h-5" />
        <span className="text-[11px] mt-0.5">Safe Route</span>
      </Link>

      <Link
        href="/citizen/shelters"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isCurrent('/citizen/shelters') ? 'text-[#00d4ff] font-semibold' : 'text-[#bbc9cf] hover:text-[#d8e3f7]'
        }`}
      >
        <House className="w-5 h-5" />
        <span className="text-[11px] mt-0.5">Shelters</span>
      </Link>

      <Link
        href="/citizen/alerts"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isCurrent('/citizen/alerts') ? 'text-[#00d4ff] font-semibold' : 'text-[#bbc9cf] hover:text-[#d8e3f7]'
        }`}
      >
        <Bell className="w-5 h-5" />
        <span className="text-[11px] mt-0.5">Alerts</span>
      </Link>

      <Link
        href="/citizen/sos-emergency"
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isCurrent('/citizen/sos-emergency')
            ? 'text-[#ffb4ab] font-bold'
            : 'text-[#ffb4ab]/80 hover:text-[#ffb4ab]'
        }`}
      >
        <Siren className="w-5 h-5 animate-pulse" />
        <span className="text-[11px] mt-0.5 font-bold">SOS</span>
      </Link>
    </nav>
  );
};
