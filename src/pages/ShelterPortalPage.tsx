import React, { useState, useEffect } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import {
  Building2,
  Users,
  Zap,
  Droplets,
  Package,
  CheckCircle2,
  Save,
  Activity,
  Navigation,
  Compass,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Plus,
} from 'lucide-react';

export const ShelterPortalPage: React.FC = () => {
  const { state, updateShelter } = useResQNova();

  const [selectedShelterId, setSelectedShelterId] = useState<string>(
    state?.shelters[0]?.id || 'shelter-1'
  );

  const shelter = state?.shelters.find((s) => s.id === selectedShelterId) || state?.shelters[0];

  const [availableCapacity, setAvailableCapacity] = useState<number>(
    shelter?.available_capacity ?? 180
  );
  const [occupancy, setOccupancy] = useState<number>(shelter?.occupancy ?? 120);
  const [foodStock, setFoodStock] = useState<string>(shelter?.food_stock ?? 'Abundant');
  const [waterStock, setWaterStock] = useState<string>(shelter?.water_stock ?? 'Adequate');
  const [powerBackup, setPowerBackup] = useState<boolean>(shelter?.power_backup ?? true);
  const [saving, setSaving] = useState(false);

  // Sync state when selection changes
  useEffect(() => {
    if (shelter) {
      setAvailableCapacity(shelter.available_capacity);
      setOccupancy(shelter.occupancy);
      setFoodStock(shelter.food_stock);
      setWaterStock(shelter.water_stock);
      setPowerBackup(shelter.power_backup);
    }
  }, [shelter?.id]);

  if (!shelter) {
    return <div className="p-8 text-center text-slate-400">Loading Shelter Terminal...</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateShelter(shelter.id, {
        available_capacity: availableCapacity,
        occupancy,
        food_stock: foodStock,
        water_stock: waterStock,
        power_backup: powerBackup,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickIntake = async (count: number) => {
    const nextOcc = occupancy + count;
    const nextAvail = Math.max(0, availableCapacity - count);
    setOccupancy(nextOcc);
    setAvailableCapacity(nextAvail);
    await updateShelter(shelter.id, {
      occupancy: nextOcc,
      available_capacity: nextAvail,
    });
  };

  const occupancyPercent = Math.min(100, Math.round((occupancy / shelter.capacity) * 100));

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. PRIOR HIGHLIGHT: INFLOW ROUTING & PRE-POSITIONED RELIEF RATIONS */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-2 border-purple-500/40 p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                  RELIEF SHELTER & LOGISTICS TERMINAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ZERO-OVERFLOW QUBO DISPATCH
                </span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Safe Inflow Corridors & Pre-Positioned Food/Water Stocks
              </h2>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-lg bg-purple-950 border border-purple-600 text-purple-200">
            Camp Status: 100% Verified Dry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-900/40 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Navigation className="h-3.5 w-3.5 text-purple-400" /> Influx Route Corridor
              </span>
              <span className="text-emerald-400 font-mono font-bold">MG Road High-Ground</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Evacuees are funneled via the elevated MG Road corridor, completely bypassing the breached Bandar Canal.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-900/40 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Utensils className="h-3.5 w-3.5 text-emerald-400" /> Pre-Positioned Rations
              </span>
              <span className="text-emerald-400 font-mono font-bold">2,500 Meal Packs</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              Pre-staged dry food rations, infant milk formula, and 10,000L clean drinking water tanks on-site.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-900/40 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Zap className="h-3.5 w-3.5 text-amber-400" /> Diesel Generator
              </span>
              <span className="text-emerald-400 font-mono font-bold">ACTIVE (72 hrs fuel)</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              125 kVA backup diesel genset powering lighting, water filtration pumps, and mobile charging banks.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SHELTER SELECTOR & HIGH-LEVEL CAPACITY HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{shelter.shelter_name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Relief Camp
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Address: {shelter.address} • Hotline: {shelter.contact_number}
            </p>
          </div>
        </div>

        {/* Shelter Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={shelter.id}
            onChange={(e) => setSelectedShelterId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none font-medium"
          >
            {state?.shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shelter_name} ({s.available_capacity} free beds)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN LOGISTICS GRID: CAPACITY GAUGE & SUPPLY INVENTORY */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Live Capacity & Fast Evacuee Intake */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                Live Evacuee Capacity & Inflow Check-In
              </h3>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Updating...' : 'Sync to Command'}
              </button>
            </div>

            {/* Visual Capacity Bar */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Occupancy Utilization:</span>
                <span className="font-bold text-white font-mono">
                  {occupancy} / {shelter.capacity} citizens ({occupancyPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    occupancyPercent > 90
                      ? 'bg-red-500'
                      : occupancyPercent > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Free Space: <b className="text-emerald-400 font-mono">{availableCapacity} beds</b></span>
                <span className="text-purple-300">QUBO Enforced Limit: {shelter.capacity} max</span>
              </div>
            </div>

            {/* Quick Intake Counter Buttons */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                Rapid Evacuee Gate Intake:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleQuickIntake(1)}
                  disabled={availableCapacity < 1}
                  className="p-2 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Admit 1 Person
                </button>
                <button
                  onClick={() => handleQuickIntake(4)}
                  disabled={availableCapacity < 4}
                  className="p-2 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/30 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Admit Family (+4)
                </button>
                <button
                  onClick={() => handleQuickIntake(-1)}
                  disabled={occupancy <= 0}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-semibold transition-all cursor-pointer"
                >
                  -1 Departure
                </button>
              </div>
            </div>

            {/* Manual Form Adjustments */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Available Beds</label>
                <input
                  type="number"
                  min="0"
                  max={shelter.capacity}
                  value={availableCapacity}
                  onChange={(e) => setAvailableCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Current Occupancy</label>
                <input
                  type="number"
                  min="0"
                  max={shelter.capacity}
                  value={occupancy}
                  onChange={(e) => setOccupancy(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Provisions & Camps Network */}
        <div className="lg:col-span-6 space-y-4">
          {/* Relief Provisions Management */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Relief Provisions & Life Support Systems
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Food Stock</label>
                <select
                  value={foodStock}
                  onChange={(e) => setFoodStock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="Abundant">Abundant (3+ Days)</option>
                  <option value="Adequate">Adequate (24-48 hrs)</option>
                  <option value="Low">Low (&lt; 12 hrs - Request Supply)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Drinking Water</label>
                <select
                  value={waterStock}
                  onChange={(e) => setWaterStock(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="Abundant">Abundant Tankers</option>
                  <option value="Adequate">Adequate Filtration</option>
                  <option value="Low">Low - Urgent Supply</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Emergency Generator Power</span>
                <span className="text-[11px] text-slate-400">Provides continuous lighting and water pumps</span>
              </div>
              <input
                type="checkbox"
                checked={powerBackup}
                onChange={(e) => setPowerBackup(e.target.checked)}
                className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* District Shelter Network Overview */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              NTR District Relief Camp Network
            </h3>

            <div className="space-y-2">
              {state?.shelters.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedShelterId(s.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    s.id === shelter.id
                      ? 'bg-purple-600/15 border-purple-500 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{s.shelter_name}</span>
                    <span className="font-mono text-purple-300 font-bold">
                      {s.available_capacity} free beds
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Capacity: {s.capacity}</span>
                    <span>Food: {s.food_stock}</span>
                    <span>Generator: {s.power_backup ? 'Active' : 'Offline'}</span>
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
