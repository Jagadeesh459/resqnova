import React, { useState, useEffect } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import {
  Stethoscope,
  HeartPulse,
  Save,
  CheckCircle2,
  Users,
  Activity,
  Bed,
  Navigation,
  Compass,
  ArrowRight,
  ShieldAlert,
  Hospital,
  Droplet,
  Plus,
} from 'lucide-react';

export const HospitalPortalPage: React.FC = () => {
  const { state, updateHospital } = useResQNova();

  const [selectedHospId, setSelectedHospId] = useState<string>(
    state?.hospitals[0]?.id || 'hosp-1'
  );

  const hosp = state?.hospitals.find((h) => h.id === selectedHospId) || state?.hospitals[0];

  const [availableBeds, setAvailableBeds] = useState<number>(hosp?.available_beds ?? 45);
  const [emergencyCapacity, setEmergencyCapacity] = useState<number>(hosp?.emergency_capacity ?? 20);
  const [icuBeds, setIcuBeds] = useState<number>(hosp?.icu_beds ?? 8);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hosp) {
      setAvailableBeds(hosp.available_beds);
      setEmergencyCapacity(hosp.emergency_capacity);
      setIcuBeds(hosp.icu_beds);
    }
  }, [hosp?.id]);

  if (!hosp) {
    return <div className="p-8 text-center text-slate-400">Loading Hospital Terminal...</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateHospital(hosp.id, {
        available_beds: availableBeds,
        emergency_capacity: emergencyCapacity,
        icu_beds: icuBeds,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCasualtyIntake = async (change: number) => {
    const nextBeds = Math.max(0, Math.min(hosp.total_beds, availableBeds + change));
    setAvailableBeds(nextBeds);
    await updateHospital(hosp.id, {
      available_beds: nextBeds,
    });
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. PRIOR HIGHLIGHT: INBOUND AMBULANCE ROUTING & PRE-STAGED TRAUMA BEDS */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-blue-950/80 border-2 border-sky-500/40 p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-sky-900/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-300">
                  TRAUMA SURGE & EMERGENCY INTAKE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  MASS CASUALTY PROTOCOL ACTIVE
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Inbound 108 Fleet Corridors & Pre-Staged Trauma Resources
              </h2>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-sky-950 border border-sky-600 text-sky-200">
            ER Surge Status: Level-1 Green Corridor
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-sky-900/40 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Navigation className="h-3.5 w-3.5 text-sky-400" /> Inbound Green Corridor
              </span>
              <span className="text-emerald-400 font-mono font-bold">CLEARED</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Ambulances transit via elevated flyover direct to GGH trauma ramp, completely clear of waterlogging.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-sky-900/40 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Bed className="h-3.5 w-3.5 text-emerald-400" /> Pre-Staged Trauma Beds
              </span>
              <span className="text-emerald-400 font-mono font-bold">{availableBeds} Available</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              {icuBeds} Ventilator ICU beds and {emergencyCapacity} Emergency Ward triage beds reserved for flood casualties.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-sky-900/40 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Droplet className="h-3.5 w-3.5 text-red-400" /> Blood & Oxygen Bank
              </span>
              <span className="text-emerald-400 font-mono font-bold">100% SECURE</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Liquid Medical Oxygen (LMO) tank at 98% capacity with 450 units of O+ and B+ blood staged.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. HOSPITAL SELECTOR & FACILITY HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Hospital className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{hosp.hospital_name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Government Apex Trauma Hospital
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Address: {hosp.address} • Trauma Direct: {hosp.contact_number}
            </p>
          </div>
        </div>

        {/* Hospital Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={hosp.id}
            onChange={(e) => setSelectedHospId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none font-medium"
          >
            {state?.hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.hospital_name} ({h.available_beds} beds free)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN CLINICAL GRID: BED MANAGEMENT & TRAUMA NETWORK */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Bed & Emergency Capacity Management */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Bed className="h-4 w-4 text-sky-400" />
                Trauma Surge & Critical Care Allocation
              </h3>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Updating...' : 'Sync to Command'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-medium mb-1 text-[11px]">General Beds</label>
                <input
                  type="number"
                  min="0"
                  max={hosp.total_beds}
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Total: {hosp.total_beds}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-medium mb-1 text-[11px]">Emergency Ward</label>
                <input
                  type="number"
                  min="0"
                  value={emergencyCapacity}
                  onChange={(e) => setEmergencyCapacity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Trauma Triage</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-slate-300 font-medium mb-1 text-[11px]">ICU Ventilators</label>
                <input
                  type="number"
                  min="0"
                  value={icuBeds}
                  onChange={(e) => setIcuBeds(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-sm"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Critical Care</span>
              </div>
            </div>

            {/* Quick Casualty Admission Buttons */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                Emergency Ambulance Casualty Admission:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCasualtyIntake(-1)}
                  disabled={availableBeds <= 0}
                  className="flex-1 p-2 rounded-lg bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 font-bold transition-all text-center cursor-pointer"
                >
                  Admit Critical Casualty (-1 Bed)
                </button>
                <button
                  onClick={() => handleCasualtyIntake(1)}
                  disabled={availableBeds >= hosp.total_beds}
                  className="flex-1 p-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 font-bold transition-all text-center cursor-pointer"
                >
                  Discharge Stabilized (+1 Bed)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: District Trauma Network */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              NTR District Hospital Trauma Network
            </h3>

            <div className="space-y-2.5">
              {state?.hospitals.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospId(h.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                    h.id === hosp.id
                      ? 'bg-sky-600/15 border-sky-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{h.hospital_name}</span>
                    <span className="font-mono text-sky-300 font-bold">
                      {h.available_beds} of {h.total_beds} beds free
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                    <span>Emergency Ward: {h.emergency_capacity}</span>
                    <span>ICU Units: {h.icu_beds}</span>
                    <span>Ambulances: {h.ambulances_available}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
