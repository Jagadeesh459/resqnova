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
  Droplet,
  Plus,
  Minus,
  AlertTriangle,
  XCircle,
  Truck,
  ShieldAlert,
  Hospital,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

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
    return <div className="p-8 text-center text-slate-400 font-bold">Loading Hospital Terminal...</div>;
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

  const occupancy = hosp.total_beds - availableBeds;
  const occupancyPercent = Math.min(100, Math.round((occupancy / hosp.total_beds) * 100));

  // Determine triage traffic-light status
  const isRed = availableBeds <= 3 || occupancyPercent >= 95;
  const isYellow = !isRed && (availableBeds <= 15 || occupancyPercent >= 75);
  const isGreen = !isRed && !isYellow;

  // Donut chart data for current hospital
  const donutData = [
    { name: 'Available Beds (ఖాళీ పడకలు)', value: availableBeds, color: '#10b981' },
    { name: 'Occupied Beds (నిండిన పడకలు)', value: occupancy, color: isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#38bdf8' },
  ];

  // District comparison data for bar chart
  const districtChartData = (state?.hospitals || []).map((h) => ({
    name: h.hospital_name.replace(' Hospital', '').replace(' Apex Trauma', '').replace(' Institute', ''),
    'Free Beds': h.id === hosp.id ? availableBeds : h.available_beds,
    'ICU Units': h.id === hosp.id ? icuBeds : h.icu_beds,
    'Ambulances': h.ambulances_available,
  }));

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. UNIVERSAL ILLITERATE-FRIENDLY TRIAGE STATUS BANNER */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`rounded-2xl border-4 p-4 sm:p-6 shadow-2xl transition-all ${
          isGreen
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-emerald-500'
            : isYellow
            ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-yellow-950 border-amber-500'
            : 'bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 border-red-500'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-4">
            {/* Giant Traffic Light Icon */}
            <div
              className={`h-20 w-20 rounded-2xl flex items-center justify-center text-4xl shadow-xl border-2 shrink-0 ${
                isGreen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400 animate-pulse'
                  : isYellow
                  ? 'bg-amber-500/20 text-amber-400 border-amber-400'
                  : 'bg-red-500/20 text-red-400 border-red-400 animate-bounce'
              }`}
            >
              {isGreen && '🟢'}
              {isYellow && '🟡'}
              {isRed && '🔴'}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-xs font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-200">
                  TRAUMA TRIAGE STATUS • ఎమర్జెన్సీ స్థితి
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isGreen && '🟢 READY FOR INTAKE • BEDS OPEN (రోగులు రావచ్చు - పడకలు ఖాళీ)'}
                {isYellow && '🟡 HIGH SURGE • TRIAGE ACTIVE (రద్దీ ఎక్కువ - ప్రాధాన్యత వైద్యం)'}
                {isRed && '🔴 EMERGENCY FULL • REDIRECT FLEET (పడకలు లేవు - వేరే ఆసుపత్రికి వెళ్లండి)'}
              </h1>
              <p className="text-sm font-semibold text-slate-300 mt-1">
                {hosp.hospital_name} • {availableBeds} Free Trauma Beds • {icuBeds} ICU Ventilators Active
              </p>
            </div>
          </div>

          {/* Hospital Switcher */}
          <div className="shrink-0 bg-slate-900/90 border border-slate-700 rounded-xl p-2">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Switch Hospital:</span>
            <select
              value={hosp.id}
              onChange={(e) => setSelectedHospId(e.target.value)}
              className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none"
            >
              {state?.hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hospital_name} ({h.available_beds} beds free)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PICTORIAL ICONS & UNIVERSAL CLINICAL GAUGES (FOR ILLITERATES) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TRAUMA BEDS CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">🛏️</div>
          <span className="text-xs font-bold text-slate-400 uppercase">Available Beds</span>
          <span className="text-3xl font-black text-emerald-400 font-mono my-1">{availableBeds}</span>
          <span className="text-[11px] text-slate-400 font-semibold">Total: {hosp.total_beds} Beds</span>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${isGreen ? 'bg-emerald-500' : isYellow ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${(availableBeds / hosp.total_beds) * 100}%` }}
            />
          </div>
        </div>

        {/* ICU VENTILATORS CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">🫁</div>
          <span className="text-xs font-bold text-slate-400 uppercase">ICU Ventilators</span>
          <span className="text-3xl font-black text-cyan-400 font-mono my-1">{icuBeds}</span>
          <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-cyan-400" /> Critical Care Ready
          </span>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, icuBeds * 10)}%` }} />
          </div>
        </div>

        {/* BLOOD BANK CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">🩸</div>
          <span className="text-xs font-bold text-slate-400 uppercase">Emergency Blood</span>
          <span className="text-3xl font-black text-red-400 font-mono my-1">450</span>
          <span className="text-[11px] text-red-300 font-semibold">Units O+ / B+ Stocked</span>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: '92%' }} />
          </div>
        </div>

        {/* 108 AMBULANCES CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">🚑</div>
          <span className="text-xs font-bold text-slate-400 uppercase">108 Fleet On Standby</span>
          <span className="text-3xl font-black text-sky-400 font-mono my-1">
            {hosp.ambulances_available ?? 4}
          </span>
          <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Green Corridor Open
          </span>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-sky-400" style={{ width: '85%' }} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. VISUAL CHARTS SECTION (DONUT & BAR CHART) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Donut Chart for Hospital Bed Capacity */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-lg">📊</span> Trauma Bed Chart (పడకల చార్ట్)
            </h3>
            <span className="text-xs font-mono font-bold text-sky-400">{occupancyPercent}% Occupied</span>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Icon & Count in Donut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl">🛏️</span>
              <span className="text-2xl font-black text-white font-mono mt-0.5">{availableBeds}</span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Free Beds</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
              <span className="font-bold text-emerald-400 block text-base font-mono">{availableBeds}</span>
              <span className="text-[11px] text-slate-300">🟢 Available (ఖాళీ)</span>
            </div>
            <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-800/60">
              <span className="font-bold text-sky-300 block text-base font-mono">{occupancy}</span>
              <span className="text-[11px] text-slate-300">🔵 Occupied (రోగులు)</span>
            </div>
          </div>

          {/* Quick Casualty Admission Buttons */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase block">
              ⚡ Rapid Casualty Admission (అంబులెన్స్ అడ్మిషన్):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCasualtyIntake(-1)}
                disabled={availableBeds <= 0}
                className="p-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span className="text-base">🚨 Admit Casualty</span>
                <span className="text-[10px] text-red-200">(-1 Bed / పడక కేటాయింపు)</span>
              </button>
              <button
                onClick={() => handleCasualtyIntake(1)}
                disabled={availableBeds >= hosp.total_beds}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span className="text-base">🩹 Discharge / Stabilized</span>
                <span className="text-[10px] text-emerald-200">(+1 Bed / పడక విడుదల)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: NTR District Trauma Hospitals Comparative Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-lg">📈</span> NTR District Hospitals Availability (అన్ని ఆసుపత్రులు)
              </h3>
              <p className="text-[11px] text-slate-400">Higher Green & Blue Bars = More Capacity (ఎక్కువ పడకలు ఉన్న ఆసుపత్రి)</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Sync Data'}
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Free Beds" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ICU Units" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ambulances" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Beds & ICU Allocation Inputs */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">🛏️ Available Beds</label>
              <input
                type="number"
                min="0"
                max={hosp.total_beds}
                value={availableBeds}
                onChange={(e) => setAvailableBeds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">🏥 Emergency Ward</label>
              <input
                type="number"
                min="0"
                value={emergencyCapacity}
                onChange={(e) => setEmergencyCapacity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">🫁 ICU Ventilators</label>
              <input
                type="number"
                min="0"
                value={icuBeds}
                onChange={(e) => setIcuBeds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
