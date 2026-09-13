import React, { useState } from 'react';
import { ResQNovaProvider, useResQNova } from './context/ResQNovaContext';
import { Sidebar } from './components/Sidebar';
import { EndToEndSimulationModal } from './components/EndToEndSimulationModal';

// Portals
import { DashboardPage } from './pages/DashboardPage';
import { CitizenPortalPage } from './pages/CitizenPortalPage';
import { RescueTeamPortalPage } from './pages/RescueTeamPortalPage';
import { AmbulancePortalPage } from './pages/AmbulancePortalPage';
import { ResourcePlannerPage } from './pages/ResourcePlannerPage';
import { EvacuationPlannerPage } from './pages/EvacuationPlannerPage';
import { AiDiagnosticsPage } from './pages/AiDiagnosticsPage';
import { ResolvedOperationsPage } from './pages/ResolvedOperationsPage';
import { ShelterPortalPage } from './pages/ShelterPortalPage';
import { HospitalPortalPage } from './pages/HospitalPortalPage';
import { RoutingOperationsPage } from './pages/RoutingOperationsPage';
import { AiFloodPredictorPage } from './pages/AiFloodPredictorPage';

const AppContent: React.FC = () => {
  const { activePath } = useResQNova();
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  const renderActivePage = () => {
    switch (activePath) {
      case '/citizen':
        return <CitizenPortalPage />;
      case '/rescue':
        return <RescueTeamPortalPage />;
      case '/ambulance':
        return <AmbulancePortalPage />;
      case '/resource-planner':
        return <ResourcePlannerPage />;
      case '/evacuation-planner':
        return <EvacuationPlannerPage />;
      case '/routing-operations':
        return <RoutingOperationsPage />;
      case '/ai-flood-predictor':
        return <AiFloodPredictorPage />;
      case '/admin/ai-diagnostics':
        return <AiDiagnosticsPage />;
      case '/resolved-operations':
        return <ResolvedOperationsPage />;
      case '/shelter':
        return <ShelterPortalPage />;
      case '/hospital':
        return <HospitalPortalPage />;
      case '/dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white">
      {/* Primary Vertical Left Navigation Sidebar */}
      <Sidebar onOpenSimulationModal={() => setIsSimModalOpen(true)} />

      {/* Main Dynamic View Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          {renderActivePage()}
        </main>

        {/* Persistent Disaster Command Status Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-400">ResQNova Command</span>
              <span>— District Disaster Management Authority, Vijayawada / NTR District, AP</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Prakasam Barrage Inundation Protocol</span>
              <span>•</span>
              <span>Autonomous AI Triage Engine</span>
              <span>•</span>
              <span>Dynamic Graph Routing Engine (A* + D* Lite)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* End-to-End Simulation Lifecycle Modal */}
      <EndToEndSimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ResQNovaProvider>
      <AppContent />
    </ResQNovaProvider>
  );
}
