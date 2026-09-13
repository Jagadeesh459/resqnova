import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ResQNovaState,
  UserRole,
  UserProfile,
  CitizenRequest,
  AiFloodPredictionResult,
} from '../types';
import * as api from '../lib/api';

interface ResQNovaContextType {
  state: ResQNovaState | null;
  loading: boolean;
  error: string | null;
  currentUser: UserProfile;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  activePath: string;
  navigate: (path: string) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;

  // Actions
  submitSos: (data: Parameters<typeof api.submitCitizenSos>[0]) => Promise<CitizenRequest>;
  triggerAiDispatch: (requestId: string) => Promise<void>;
  updateMissionStatus: (requestId: string, status: 'assigned' | 'en_route' | 'on_scene' | 'completed') => Promise<void>;
  requestAmbulanceForSos: (requestId: string, reason?: string) => Promise<void>;
  markAmbulanceReached: (requestId: string) => Promise<void>;
  markRescueDone: (requestId: string, notes?: string) => Promise<void>;
  claimSosForTeam: (requestId: string, teamId: string) => Promise<void>;
  claimSosForAmbulance: (requestId: string, ambulanceId: string) => Promise<void>;
  saveAiFloodPrediction: (prediction: AiFloodPredictionResult) => Promise<void>;
  updateRescueStatus: (teamId: string, status: 'available' | 'deployed' | 'maintenance') => Promise<void>;
  updateAmbulanceStatus: (ambId: string, status: 'available' | 'deployed' | 'maintenance', fuel?: number) => Promise<void>;
  updateShelter: (shelterId: string, data: Parameters<typeof api.updateShelterData>[1]) => Promise<void>;
  updateHospital: (hospitalId: string, data: Parameters<typeof api.updateHospitalData>[1]) => Promise<void>;
  updateRoad: (roadId: string, status: 'open' | 'flooded' | 'blocked', reason?: string) => Promise<void>;
  refreshState: () => Promise<void>;
  resetScenario: () => Promise<void>;
  isRealtimeConnected: boolean;
}

const ResQNovaContext = createContext<ResQNovaContextType | undefined>(undefined);

export const ResQNovaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ResQNovaState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // Helper to map pathname to emergency role
  const getRoleFromPath = (path: string): UserRole => {
    if (path.startsWith('/citizen')) return 'citizen';
    if (path.startsWith('/rescue')) return 'rescue';
    if (path.startsWith('/ambulance')) return 'ambulance';
    if (path.startsWith('/shelter')) return 'shelter';
    if (path.startsWith('/hospital')) return 'hospital';
    return 'admin';
  };

  // Active navigation route (synced with window.location.pathname)
  const [activePath, setActivePath] = useState<string>(() => {
    const p = window.location.pathname;
    return p && p !== '/' ? p : '/dashboard';
  });

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Synchronized user role (derived from initial path or defaulted to admin)
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const p = window.location.pathname;
    return getRoleFromPath(p);
  });

  const navigate = useCallback((path: string) => {
    setActivePath(path);
    window.history.pushState({}, '', path);
  }, []);

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      const newPath = p && p !== '/' ? p : '/dashboard';
      setActivePath(newPath);
      setCurrentRole(getRoleFromPath(newPath));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial state fetch
  const refreshState = useCallback(async () => {
    try {
      const data = await api.fetchState();
      setState(data);
      setError(null);
    } catch (err) {
      console.warn('Fetch state error, using resilient local state:', err);
      const fallback = api.getLocalState();
      setState(fallback);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime Server-Sent Events (SSE) subscription
  useEffect(() => {
    refreshState();

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/realtime/stream');

        eventSource.onopen = () => {
          setIsRealtimeConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            if (!event.data || event.data.trim().startsWith('<')) return;
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'INITIAL_STATE' || parsed.type === 'STATE_UPDATE') {
              setState(parsed.payload);
              api.saveLocalState(parsed.payload);
            }
          } catch (e) {
            console.warn('Failed to parse SSE payload:', e);
          }
        };

        eventSource.onerror = () => {
          setIsRealtimeConnected(false);
          eventSource?.close();
          // Quiet exponential or 10s fallback reconnect
          reconnectTimeout = setTimeout(connectSSE, 10000);
        };
      } catch (err) {
        console.warn('SSE initialization error:', err);
        setIsRealtimeConnected(false);
      }
    };

    connectSSE();

    // Secondary periodic poll (every 8 seconds) to ensure 100% sync even through proxy disconnects
    const pollInterval = setInterval(() => {
      refreshState();
    }, 8000);

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [refreshState]);

  // Current user derived from role
  const currentUser: UserProfile = {
    id: `usr-${currentRole}-1`,
    email: `${currentRole}@resqnova.gov.in`,
    full_name:
      currentRole === 'admin'
        ? 'Dr. K. Swaminathan (Collector & DM)'
        : currentRole === 'rescue'
        ? 'Insp. Vikram Singh (NDRF Boat Squad Alpha)'
        : currentRole === 'ambulance'
        ? 'S. Koteswara Rao (108 ALS Unit 101)'
        : currentRole === 'citizen'
        ? 'P. Ramesh (Citizen Resident)'
        : currentRole === 'shelter'
        ? 'M. Anitha (IGMC Stadium Relief Officer)'
        : 'Dr. V. Prasad (GGH Superintendent)',
    role: currentRole,
    district: 'NTR District, Vijayawada',
    created_at: new Date().toISOString(),
  };

  const switchRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    // Auto-route according to Phase 3
    if (role === 'admin') navigate('/dashboard');
    else if (role === 'citizen') navigate('/citizen');
    else if (role === 'rescue') navigate('/rescue');
    else if (role === 'ambulance') navigate('/ambulance');
    else if (role === 'shelter') navigate('/shelter');
    else if (role === 'hospital') navigate('/hospital');
  }, [navigate]);

  // Action implementations
  const submitSos = async (data: Parameters<typeof api.submitCitizenSos>[0]) => {
    const res = await api.submitCitizenSos(data);
    await refreshState();
    return res.request;
  };

  const triggerAiDispatch = async (requestId: string) => {
    await api.triggerAiDispatch(requestId);
    await refreshState();
  };

  const updateMissionStatus = async (
    requestId: string,
    status: 'assigned' | 'en_route' | 'on_scene' | 'completed'
  ) => {
    await api.updateMissionStatus(requestId, status);
    await refreshState();
  };

  const requestAmbulanceForSos = async (requestId: string, reason?: string) => {
    await api.requestAmbulanceForSos(requestId, reason);
    await refreshState();
  };

  const markAmbulanceReached = async (requestId: string) => {
    await api.markAmbulanceReached(requestId);
    await refreshState();
  };

  const markRescueDone = async (requestId: string, notes?: string) => {
    await api.markRescueDone(requestId, notes);
    await refreshState();
  };

  const claimSosForTeam = async (requestId: string, teamId: string) => {
    await api.claimSosForTeam(requestId, teamId);
    await refreshState();
  };

  const claimSosForAmbulance = async (requestId: string, ambulanceId: string) => {
    await api.claimSosForAmbulance(requestId, ambulanceId);
    await refreshState();
  };

  const saveAiFloodPrediction = async (prediction: AiFloodPredictionResult) => {
    await api.saveAiFloodPrediction(prediction);
    await refreshState();
  };

  const updateRescueStatus = async (
    teamId: string,
    status: 'available' | 'deployed' | 'maintenance'
  ) => {
    await api.updateRescueStatus(teamId, status);
    await refreshState();
  };

  const updateAmbulanceStatus = async (
    ambId: string,
    status: 'available' | 'deployed' | 'maintenance',
    fuel?: number
  ) => {
    await api.updateAmbulanceStatus(ambId, status, fuel);
    await refreshState();
  };

  const updateShelter = async (
    shelterId: string,
    data: Parameters<typeof api.updateShelterData>[1]
  ) => {
    await api.updateShelterData(shelterId, data);
    await refreshState();
  };

  const updateHospital = async (
    hospitalId: string,
    data: Parameters<typeof api.updateHospitalData>[1]
  ) => {
    await api.updateHospitalData(hospitalId, data);
    await refreshState();
  };

  const updateRoad = async (
    roadId: string,
    status: 'open' | 'flooded' | 'blocked',
    reason?: string
  ) => {
    await api.updateRoadStatus(roadId, status, reason);
    await refreshState();
  };

  const resetScenario = async () => {
    await api.resetSeedScenario();
    await refreshState();
  };

  return (
    <ResQNovaContext.Provider
      value={{
        state,
        loading,
        error,
        currentUser,
        currentRole,
        switchRole,
        activePath,
        navigate,
        selectedRequestId,
        setSelectedRequestId,
        submitSos,
        triggerAiDispatch,
        updateMissionStatus,
        requestAmbulanceForSos,
        markAmbulanceReached,
        markRescueDone,
        claimSosForTeam,
        claimSosForAmbulance,
        saveAiFloodPrediction,
        updateRescueStatus,
        updateAmbulanceStatus,
        updateShelter,
        updateHospital,
        updateRoad,
        refreshState,
        resetScenario,
        isRealtimeConnected,
      }}
    >
      {children}
    </ResQNovaContext.Provider>
  );
};

export function useResQNova(): ResQNovaContextType {
  const context = useContext(ResQNovaContext);
  if (!context) {
    throw new Error('useResQNova must be used within a ResQNovaProvider');
  }
  return context;
}
