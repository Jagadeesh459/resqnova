import React, { useState } from 'react';
import { RouterProvider, usePathname } from './lib/router';
import { CitizenHeader } from './components/citizen/CitizenHeader';
import { CitizenNavDrawer } from './components/citizen/CitizenNavDrawer';
import { CitizenMobileNav } from './components/citizen/CitizenMobileNav';
import { LiveRequestStatus } from './components/citizen/LiveRequestStatus';
import { CitizenFooter } from './components/citizen/CitizenFooter';

// Pages
import { CitizenHome } from './components/citizen/CitizenHome';
import { SafeRoutePage } from './components/citizen/SafeRoutePage';
import { SheltersPage } from './components/citizen/SheltersPage';
import { AlertsPage } from './components/citizen/AlertsPage';
import { SosPage } from './components/citizen/SosPage';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const renderActivePage = () => {
    if (pathname.startsWith('/citizen/safe-route')) {
      return <SafeRoutePage />;
    }
    if (pathname.startsWith('/citizen/shelters')) {
      return <SheltersPage />;
    }
    if (pathname.startsWith('/citizen/alerts')) {
      return <AlertsPage />;
    }
    if (pathname.startsWith('/citizen/sos-emergency') || pathname.startsWith('/citizen/sos')) {
      return <SosPage />;
    }
    // Default to Citizen Home
    return <CitizenHome />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#091422] text-[#d8e3f7] font-sans antialiased selection:bg-[#00d4ff] selection:text-[#003642]">
      {/* Shared Fixed Header */}
      <CitizenHeader onOpenMenu={() => setIsMenuOpen(true)} />

      {/* Shared Sliding Navigation Drawer */}
      <CitizenNavDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <LiveRequestStatus />

      {/* Main Routed Page Content */}
      <div className="flex-1 flex flex-col">{renderActivePage()}</div>

      {/* Shared Global Footer */}
      <CitizenFooter />

      {/* Shared Mobile Navigation Bar */}
      <CitizenMobileNav />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
