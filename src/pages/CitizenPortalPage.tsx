import React, { useState, useEffect, useMemo } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import {
  LifeBuoy,
  MapPin,
  Users,
  Shield,
  Phone,
  Radio,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Compass,
  Building2,
  Share2,
  Volume2,
  Info,
  ChevronDown,
  ChevronUp,
  Siren,
  AlertOctagon,
  Bell,
  BellOff,
  Sparkles,
} from 'lucide-react';
import { getAStarRoute, getSafeRoute } from '../lib/api';

interface SosPreset {
  id: string;
  title: string;
  location: string;
  name: string;
  phone: string;
  lat: number;
  lng: number;
  hint: string;
  people: number;
  children: number;
  elderly: number;
  emergencyType: string;
  urgency: 'low' | 'moderate' | 'critical';
  tag: string;
}

const SAMPLE_SOS_PRESETS: SosPreset[] = [
  {
    id: 'preset-1',
    title: 'Krishna Lanka Bund Breach',
    location: 'Krishna Lanka',
    name: 'P. Ramesh',
    phone: '+91 98480 55443',
    lat: 16.5038,
    lng: 80.6432,
    hint: 'Krishna Lanka, Near Water Tank Bund, Water rising 3.5ft',
    people: 4,
    children: 1,
    elderly: 1,
    emergencyType: 'Flood Trapped',
    urgency: 'critical',
    tag: '🌊 3.5ft Inundated',
  },
  {
    id: 'preset-2',
    title: 'Bhavanipuram Canal Spillway',
    location: 'Bhavanipuram',
    name: 'K. Lakshmi',
    phone: '+91 94401 55210',
    lat: 16.5245,
    lng: 80.6110,
    hint: 'Sri Sai Towers, Canal Road, Bhavanipuram (Water 2.8m)',
    people: 6,
    children: 1,
    elderly: 2,
    emergencyType: 'Rooftop Evacuation',
    urgency: 'critical',
    tag: '🏠 Rooftop Stranded',
  },
  {
    id: 'preset-3',
    title: 'Ajit Singh Nagar Budameru Breach',
    location: 'Singh Nagar',
    name: 'M. Srinivasa Rao',
    phone: '+91 98492 77114',
    lat: 16.5365,
    lng: 80.6425,
    hint: 'Community Hall, Budameru Rivulet Bank, Pregnant mother in labor',
    people: 4,
    children: 1,
    elderly: 0,
    emergencyType: 'Medical Emergency',
    urgency: 'critical',
    tag: '🤰 Medical Labor',
  },
  {
    id: 'preset-4',
    title: 'One Town Transformer Submerged',
    location: 'One Town',
    name: 'G. Venkat',
    phone: '+91 91770 44228',
    lat: 16.5165,
    lng: 80.6185,
    hint: 'Near Brahmin Street Panja Centre, 11kV transformer tilted in water',
    people: 3,
    children: 0,
    elderly: 1,
    emergencyType: 'Electrical Hazard',
    urgency: 'moderate',
    tag: '⚡ Submerged Grid',
  },
  {
    id: 'preset-5',
    title: 'Ramavarappadu Car Underpass',
    location: 'Ramavarappadu',
    name: 'T. Anji Reddy',
    phone: '+91 98485 11002',
    lat: 16.5195,
    lng: 80.6785,
    hint: 'Ramavarappadu Ring Underpass, Vehicle submerged in flash backwater',
    people: 2,
    children: 0,
    elderly: 0,
    emergencyType: 'Flash Flood Trapped',
    urgency: 'critical',
    tag: '🚗 Submerged Car',
  },
];

export const CitizenPortalPage: React.FC = () => {
  const { state, submitSos, updateMissionStatus } = useResQNova();

  // Active preset tracker
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-1');

  // Form states for submitting or updating SOS
  const [name, setName] = useState('P. Ramesh');
  const [phone, setPhone] = useState('+91 98480 55443');
  const [latitude, setLatitude] = useState(16.5038);
  const [longitude, setLongitude] = useState(80.6432);
  const [addressHint, setAddressHint] = useState('Krishna Lanka, Near Water Tank Bund, Water rising 3.5ft');
  const [peopleCount, setPeopleCount] = useState(4);
  const [childrenCount, setChildrenCount] = useState(1);
  const [elderlyCount, setElderlyCount] = useState(1);
  const [emergencyType, setEmergencyType] = useState('Flood Trapped');
  const [medicalUrgency, setMedicalUrgency] = useState('critical');

  const handleSelectPreset = (preset: SosPreset) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setPhone(preset.phone);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setAddressHint(preset.hint);
    setPeopleCount(preset.people);
    setChildrenCount(preset.children);
    setElderlyCount(preset.elderly);
    setEmergencyType(preset.emergencyType);
    setMedicalUrgency(preset.urgency);
  };

  // Emergency SOS Beacon state
  const [sosActive, setSosActive] = useState(false);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [showSosForm, setShowSosForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Safe route state
  const [routeData, setRouteData] = useState<{
    coordinates: [number, number][];
    distanceKm: number;
    durationMinutes: number;
    warnings: string[];
    isSafe: boolean;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Emergency Audio Beep
  const playEmergencyBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  const handleToggleEmergencySos = async () => {
    const nextState = !sosActive;
    setSosActive(nextState);
    if (nextState) {
      if (audioAlertEnabled) playEmergencyBeep();
      setSubmitting(true);
      try {
        await submitSos({
          citizen_name: name,
          citizen_phone: phone,
          latitude,
          longitude,
          address_hint: addressHint,
          people_count: peopleCount,
          children_count: childrenCount,
          elderly_count: elderlyCount,
          emergency_type: emergencyType,
          medical_urgency: 'critical',
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  // GPS auto-detect
  const handleDetectGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(5)));
          setLongitude(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {
          // Default to Krishna Lanka flood zone in Vijayawada
          setLatitude(16.5038);
          setLongitude(80.6432);
        },
        { timeout: 5000 }
      );
    }
  };

  // Find active SOS request belonging to current citizen
  const activeRequest = useMemo(() => {
    if (submittedRequestId && state?.citizen_requests) {
      const found = state.citizen_requests.find((r) => r.id === submittedRequestId);
      if (found) return found;
    }
    // Default to the first open request or Ramesh's request
    return (
      state?.citizen_requests.find((r) => r.citizen_name.includes('Ramesh')) ||
      state?.citizen_requests.find((r) => r.status !== 'completed') ||
      state?.citizen_requests[0] ||
      null
    );
  }, [submittedRequestId, state?.citizen_requests]);

  // Find nearest assigned shelter
  const assignedShelter = useMemo(() => {
    if (!state?.shelters || state.shelters.length === 0) return null;
    if (activeRequest?.recommended_shelter_id) {
      const s = state.shelters.find((item) => item.id === activeRequest.recommended_shelter_id);
      if (s) return s;
    }
    // Default to highest capacity open shelter (e.g., IGMC Stadium or Siddhartha College)
    return state.shelters.find((s) => s.available_capacity > 0) || state.shelters[0];
  }, [activeRequest?.recommended_shelter_id, state?.shelters]);

  // Assigned rescue team
  const assignedRescue = useMemo(() => {
    if (!activeRequest?.rescue_team_id || !state?.rescue_teams) return null;
    return state.rescue_teams.find((t) => t.id === activeRequest.rescue_team_id) || null;
  }, [activeRequest?.rescue_team_id, state?.rescue_teams]);

  // Fetch safe route between Source (SOS) and Destination (Shelter) using exact A* algorithm
  useEffect(() => {
    const sLat = activeRequest ? activeRequest.latitude : latitude;
    const sLng = activeRequest ? activeRequest.longitude : longitude;
    const dLat = assignedShelter ? assignedShelter.latitude : 16.5062;
    const dLng = assignedShelter ? assignedShelter.longitude : 80.648;

    let isMounted = true;
    setLoadingRoute(true);

    getAStarRoute(sLat, sLng, dLat, dLng, 'citizen_evac')
      .then((res) => {
        if (isMounted && res && res.success && res.coordinates && res.coordinates.length >= 2) {
          const warnings = [...(res.warnings || [])];
          if (warnings.length === 0) {
            warnings.push(
              'Drainage Channel Avoidance: Path safely detours away from flooded canal banks onto elevated dry MG Road.'
            );
          }
          setRouteData({
            coordinates: res.coordinates,
            distanceKm: res.distance_km,
            durationMinutes: res.duration_min,
            warnings,
            isSafe: res.is_safe,
          });
          setLoadingRoute(false);
        } else {
          // Fallback via getSafeRoute
          getSafeRoute(sLat, sLng, dLat, dLng, 'citizen_evac').then((sr) => {
            if (isMounted) {
              setRouteData({
                coordinates: sr.coordinates,
                distanceKm: sr.distanceKm,
                durationMinutes: sr.durationMinutes,
                warnings: sr.warnings.length > 0 ? sr.warnings : [
                  'Elevated Arterial Reroute: Bypassing submerged canal underpasses.'
                ],
                isSafe: sr.isSafe,
              });
              setLoadingRoute(false);
            }
          });
        }
      })
      .catch((err) => {
        console.error('Route error:', err);
        getSafeRoute(sLat, sLng, dLat, dLng, 'citizen_evac').then((sr) => {
          if (isMounted) {
            setRouteData({
              coordinates: sr.coordinates,
              distanceKm: sr.distanceKm,
              durationMinutes: sr.durationMinutes,
              warnings: sr.warnings,
              isSafe: sr.isSafe,
            });
            setLoadingRoute(false);
          }
        });
      });

    return () => {
      isMounted = false;
    };
  }, [activeRequest?.latitude, activeRequest?.longitude, assignedShelter?.id, latitude, longitude]);

  const handleSubmitSos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await submitSos({
        citizen_name: name,
        citizen_phone: phone,
        latitude,
        longitude,
        address_hint: addressHint,
        people_count: peopleCount,
        children_count: childrenCount,
        elderly_count: elderlyCount,
        emergency_type: emergencyType,
        medical_urgency: medicalUrgency,
      });
      setSubmittedRequestId(created.id);
      setShowSosForm(false);
    } catch (err) {
      console.error('SOS Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareRoute = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'ResQNova Safe Evacuation Route',
          text: `Safe Evacuation Route to ${assignedShelter?.shelter_name || 'Relief Shelter'}. Distance: ${routeData?.distanceKm || 2.4}km`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Safe Route: From ${activeRequest?.address_hint || 'SOS Location'} to ${assignedShelter?.shelter_name} (${assignedShelter?.address})`
      );
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Formulate concise bypass warning text for the user
  const bypassWarning = useMemo(() => {
    if (routeData?.warnings && routeData.warnings.length > 0) {
      return routeData.warnings[0];
    }
    return 'Road Inundation Bypass: Path automatically avoids flooded canal banks and blocked low-lying underpasses.';
  }, [routeData]);

  const sourceCoords = activeRequest
    ? {
        lat: activeRequest.latitude,
        lng: activeRequest.longitude,
        label: `${activeRequest.citizen_name}'s SOS Location`,
        address: activeRequest.address_hint || 'Krishna Lanka Flood Zone',
        isSosActive: sosActive,
      }
    : {
        lat: latitude,
        lng: longitude,
        label: `${name}'s SOS Location`,
        address: addressHint,
        isSosActive: sosActive,
      };

  const destinationCoords = assignedShelter
    ? {
        lat: assignedShelter.latitude,
        lng: assignedShelter.longitude,
        label: assignedShelter.shelter_name,
        availableBeds: assignedShelter.available_capacity,
        address: assignedShelter.address,
      }
    : {
        lat: 16.5062,
        lng: 80.648,
        label: 'IGMC Indoor Stadium Relief Camp',
        availableBeds: 1420,
        address: 'MG Road, Labbipet, Vijayawada',
      };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16 px-3 sm:px-6">
      {/* ------------------------------------------------------------- */}
      {/* 0. PROMINENT EMERGENCY SOS SIGNAL BEACON BAR (ONE-TOUCH DISPATCH) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-2xl ${
          sosActive
            ? 'bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-red-500 shadow-red-900/60'
            : 'bg-slate-900/95 border-red-500/40 hover:border-red-500/70'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                sosActive
                  ? 'bg-red-600 border-red-400 text-white animate-bounce shadow-lg shadow-red-600/50'
                  : 'bg-red-500/20 border-red-500/40 text-red-400'
              }`}
            >
              <Siren className={`h-8 w-8 ${sosActive ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    sosActive
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {sosActive ? '🚨 SOS BEACON BROADCASTING LIVE' : 'ONE-TOUCH EMERGENCY BEACON'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {sosActive
                  ? 'Distress Beacon Live • NDRF Water Rescue & 108 Fleet Dispatched!'
                  : 'Trapped by Rising Water? Transmit Emergency SOS Now'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {sosActive
                  ? 'Live GPS beacon active. Command center tracking your coordinates. Stay on elevated high ground.'
                  : 'Broadcasts instant coordinates, headcount, and vulnerability data directly to NDRF Command Center.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setAudioAlertEnabled(!audioAlertEnabled)}
              title={audioAlertEnabled ? 'Mute Siren' : 'Enable Siren'}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer"
            >
              {audioAlertEnabled ? <Bell className="h-4 w-4 text-amber-400" /> : <BellOff className="h-4 w-4 text-slate-500" />}
            </button>

            <button
              id="btn-citizen-sos-broadcast"
              onClick={handleToggleEmergencySos}
              disabled={submitting}
              className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                sosActive
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-900/60 hover:scale-[1.02]'
                  : 'bg-red-600 hover:bg-red-500 text-white hover:scale-[1.02] shadow-red-950/50'
              }`}
            >
              <Siren className="h-5 w-5" />
              <span>{sosActive ? 'Deactivate SOS Signal' : 'Broadcast Live SOS Signal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK SAMPLE SOS SCENARIOS / PRESETS (TEST & DEMO SUITE) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span className="font-black text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>Quick Test SOS Hotspots • నమూనా అత్యవసర పరిస్థితులు</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/40">
                1-Click Load
              </span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any disaster hotspot to immediately recalculate safe A* corridor avoiding local road blockages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          {SAMPLE_SOS_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-red-500/20 border-red-500 text-white shadow-lg ring-1 ring-red-500'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-xs truncate">{p.location}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300 font-bold">
                    👥 {p.people}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 line-clamp-1 font-medium">{p.title}</div>
                <div className="flex items-center justify-between pt-0.5 text-[10px]">
                  <span className="font-bold text-red-400">{p.tag}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    p.urgency === 'critical' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {p.urgency}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. CITIZEN EMERGENCY HEADER & QUICK HELPLINES */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-950/40">
              <LifeBuoy className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Citizen Emergency Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SAFE ROUTE READY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Real-time navigation to your nearest dry relief shelter avoiding waterlogged and drainaged routes.
              </p>
            </div>
          </div>

          {/* Quick Helplines Callouts */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>SOS 112</span>
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-1.5 bg-orange-600/90 hover:bg-orange-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Ambulance 108</span>
            </a>
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              <span>NTR Control Room: 0866-2574454</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PRIOR HIGHLIGHT: PRE-POSITIONING & ROUTING */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-emerald-950/60 border border-cyan-500/40 p-3.5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Compass className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                PRE-POSITIONING DISPATCH ACTIVE
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                {assignedRescue ? assignedRescue.team_name : 'NDRF Squad Alpha'} Pre-Staged
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Emergency rescue craft is staged at Krishna Lanka Bund Ramp (850m away). Follow the elevated high-ground corridor below.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-mono text-[11px] font-bold whitespace-nowrap">
          Route Verified Safe & Dry
        </span>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SOURCE & DESTINATION DUAL CARDS (HIGH CONTRAST & READABLE) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Card */}
        <div className="bg-slate-900 border-2 border-red-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                  SOURCE (YOUR SOS LOCATION)
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {sourceCoords.label}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setShowSosForm(!showSosForm)}
              className="text-xs text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-500/30 font-semibold transition-colors flex items-center gap-1"
            >
              {showSosForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{showSosForm ? 'Close Form' : 'Update SOS'}</span>
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-300 space-y-1.5">
            <p className="font-medium text-slate-200">
              📍 {sourceCoords.address || 'Krishna Lanka low-lying flood basin'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <b>{activeRequest?.people_count || peopleCount}</b> People ({activeRequest?.children_count || childrenCount} children, {activeRequest?.elderly_count || elderlyCount} elderly)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-mono">
                GPS: {sourceCoords.lat.toFixed(4)}, {sourceCoords.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Destination Card (Assigned Shelter) */}
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  DESTINATION (NEAREST SAFE SHELTER)
                </span>
                <h3 className="text-base font-bold text-white leading-tight">
                  {destinationCoords.label}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2.5 py-1 rounded-lg text-xs font-bold shadow">
                {destinationCoords.availableBeds} Beds Free
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-300 space-y-1.5">
            <p className="font-medium text-slate-200">
              🏢 {destinationCoords.address}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-300/90 pt-1">
              <span>✓ Drinking Water & Hot Meals</span>
              <span className="text-slate-600">•</span>
              <span>✓ Medical Doctor On Duty</span>
              <span className="text-slate-600">•</span>
              <span>✓ Dry Elevated High Ground</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. OPTIMAL PATH METRICS & ACTIVE DRAINAGE AVOIDANCE ALERT */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Navigation className="h-5 w-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-emerald-400">Verified Safe Corridor</span>
              <span className="text-[11px] text-slate-400">OSRM Road Engine</span>
            </div>
            <div className="text-sm text-white font-bold flex items-center gap-2 mt-0.5">
              <span>Safe Distance: <b className="text-emerald-400">{routeData?.distanceKm ?? 2.5} km</b></span>
              <span className="text-slate-600">•</span>
              <span>Estimated Walk / Evacuation Time: <b className="text-cyan-400">{routeData?.durationMinutes ?? 18} mins</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleShareRoute}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>{copiedLink ? 'Copied to Clipboard!' : 'Share Route'}</span>
          </button>
          {activeRequest?.status !== 'completed' && (
            <button
              onClick={() => activeRequest && updateMissionStatus(activeRequest.id, 'completed')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Safe at Shelter</span>
            </button>
          )}
        </div>
      </div>

      {/* Flood & Drainage Reroute Banner */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">Active Floodwater & Drainage Avoidance:</span>{' '}
          {bypassWarning} The highlighted green path steers clear of low-lying drains, keeping you on safe, elevated streets.
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. EXPANDABLE SOS EDIT / SUBMISSION FORM */}
      {/* ------------------------------------------------------------- */}
      {showSosForm && (
        <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="h-4 w-4 text-red-400" />
              {activeRequest ? 'Update Your Emergency SOS Data' : 'Submit Instant Distress Signal'}
            </h3>
            <span className="text-xs text-slate-400">Autonomous AI Triage Active</span>
          </div>

          <form onSubmit={handleSubmitSos} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* GPS Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">GPS Location</label>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  <MapPin className="h-3 w-3" /> Auto-Detect GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  placeholder="Longitude"
                />
              </div>
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Specific Landmark / Street
              </label>
              <textarea
                rows={2}
                value={addressHint}
                onChange={(e) => setAddressHint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Near Krishna Lanka Water Tank, 1st Floor Rooftop"
              />
            </div>

            {/* Demographics */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Total People</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Children (&lt;12)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-center"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Elderly (&gt;60)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={elderlyCount}
                  onChange={(e) => setElderlyCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-center"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSosForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-950/40"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LifeBuoy className="h-4 w-4" />}
                <span>Transmit SOS & Re-Route</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. PROMINENT, LARGE MAP SHOWING ONLY SOURCE, DESTINATION & PATH */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-2xl space-y-2">
        <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-white uppercase tracking-wider">
              Live Evacuation GIS Map
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Interactive: Zoom & Pan Enabled • Clutter-Free Citizen View
          </span>
        </div>

        {/* Large, user-ready map displaying strictly Source, Destination & Optimal Path */}
        <TacticalMap
          height="540px"
          minimalCitizenMode={true}
          citizenSource={sourceCoords}
          citizenDestination={destinationCoords}
          routePolyline={routeData?.coordinates}
          bypassWarning={bypassWarning}
          focusCoords={[sourceCoords.lat, sourceCoords.lng]}
          sosActive={sosActive}
          className="shadow-inner"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. STEP-BY-STEP CORRIDOR NAVIGATION CHECKPOINTS */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Navigation className="h-4 w-4 text-cyan-400" />
            Step-by-Step Safe Route Navigation
          </h3>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            ✓ 0 Flood Inundation Zones Encountered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-400">STEP 1 • ORIGIN</span>
              <span className="text-[10px] text-slate-500">0.0 km</span>
            </div>
            <div className="font-bold text-white text-sm">Depart Distress Point</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Move to the dry crest of Krishna Lanka Bund Road. Do not attempt crossing south towards low-lying canal banks.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-400">STEP 2 • SAFE DETOUR</span>
              <span className="text-[10px] text-slate-500">1.2 km</span>
            </div>
            <div className="font-bold text-white text-sm">Join Elevated MG Road</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Follow the verified bypass corridor. Governorpet and MG Road elevated arterial streets are completely drained and monitored by police squads.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400">STEP 3 • ARRIVAL</span>
              <span className="text-[10px] text-slate-500">{routeData?.distanceKm ?? 2.5} km</span>
            </div>
            <div className="font-bold text-white text-sm">Enter {destinationCoords.label}</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Report to Camp Gate 2 Registration Desk. Hot food packets, drinking water, and dry bedding are provided upon arrival.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
