import React, { useState, useEffect } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import {
  Building2,
  Users,
  Zap,
  Droplets,
  CheckCircle2,
  Save,
  Navigation,
  Utensils,
  Plus,
  Minus,
  AlertTriangle,
  XCircle,
  Stethoscope,
  BatteryCharging,
  ShieldCheck,
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
    return <div className="p-8 text-center text-slate-400 font-bold">Loading Shelter Terminal...</div>;
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
    const nextOcc = Math.max(0, occupancy + count);
    const nextAvail = Math.max(0, shelter.capacity - nextOcc);
    setOccupancy(nextOcc);
    setAvailableCapacity(nextAvail);
    await updateShelter(shelter.id, {
      occupancy: nextOcc,
      available_capacity: nextAvail,
    });
  };

  const occupancyPercent = Math.min(100, Math.round((occupancy / shelter.capacity) * 100));

  // Determine traffic-light color and status
  const isRed = occupancyPercent >= 95 || availableCapacity <= 5;
  const isYellow = !isRed && occupancyPercent >= 70;
  const isGreen = !isRed && !isYellow;

  // Donut chart data for current shelter
  const donutData = [
    { name: 'Available Beds (ఖాళీ)', value: availableCapacity, color: '#10b981' },
    { name: 'Occupied Beds (నిండిన)', value: occupancy, color: isRed ? '#ef4444' : isYellow ? '#f59e0b' : '#6366f1' },
  ];

  // District comparison data for bar chart
  const districtChartData = (state?.shelters || []).map((s) => ({
    name: s.shelter_name.replace(' Relief Camp', '').replace(' Community Hall', ''),
    'Free Beds': s.id === shelter.id ? availableCapacity : s.available_capacity,
    'Occupied': s.id === shelter.id ? occupancy : s.occupancy,
  }));

  // Visual supply level indicators (illiterate-friendly)
  const getFoodDots = () => {
    if (foodStock === 'Abundant') return { level: 3, label: 'PLENTY FOOD (ఆహారం పుష్కలం)', color: 'bg-emerald-500 text-emerald-300' };
    if (foodStock === 'Adequate') return { level: 2, label: 'SUFFICIENT (ఆహారం ఉంది)', color: 'bg-amber-500 text-amber-300' };
    return { level: 1, label: 'LOW FOOD (తక్కువ ఆహారం)', color: 'bg-red-500 text-red-300' };
  };

  const getWaterDots = () => {
    if (waterStock === 'Abundant') return { level: 3, label: 'PLENTY WATER (మంచి నీరు పుష్కలం)', color: 'bg-emerald-500 text-emerald-300' };
    if (waterStock === 'Adequate') return { level: 2, label: 'SUFFICIENT (నీరు ఉంది)', color: 'bg-amber-500 text-amber-300' };
    return { level: 1, label: 'LOW WATER (తక్కువ నీరు)', color: 'bg-red-500 text-red-300' };
  };

  const foodInfo = getFoodDots();
  const waterInfo = getWaterDots();

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* 1. UNIVERSAL ILLITERATE-FRIENDLY TRAFFIC LIGHT STATUS BANNER */}
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
                  VISUAL CAMP STATUS • లైవ్ క్యాంప్ స్థితి
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isGreen && '🟢 SAFE TO ENTER • BEDS AVAILABLE (ప్రవేశం ఉంది)'}
                {isYellow && '🟡 CAUTION • LIMITED BEDS (పరిమిత ఖాళీ)'}
                {isRed && '🔴 FULL • PLEASE GO TO NEXT CAMP (క్యాంప్ నిండింది)'}
              </h1>
              <p className="text-sm font-semibold text-slate-300 mt-1">
                {shelter.shelter_name} • {availableCapacity} Free Beds Available / {occupancy} Citizens Sheltered
              </p>
            </div>
          </div>

          {/* Shelter Selection Dropdown */}
          <div className="shrink-0 bg-slate-900/90 border border-slate-700 rounded-xl p-2">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">Switch Relief Camp:</span>
            <select
              value={shelter.id}
              onChange={(e) => setSelectedShelterId(e.target.value)}
              className="bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none"
            >
              {state?.shelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shelter_name} ({s.available_capacity} free beds)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PICTORIAL ICONS & UNIVERSAL LIFE SUPPORT METERS (FOR ILLITERATES) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* BED CAPACITY CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">🛏️</div>
          <span className="text-xs font-bold text-slate-400 uppercase">Available Beds</span>
          <span className="text-3xl font-black text-emerald-400 font-mono my-1">{availableCapacity}</span>
          <span className="text-[11px] text-slate-400 font-semibold">Total: {shelter.capacity} Beds</span>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${isGreen ? 'bg-emerald-500' : isYellow ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${(availableCapacity / shelter.capacity) * 100}%` }}
            />
          </div>
        </div>

        {/* FOOD PACKETS CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">🍲</div>
          <span className="text-xs font-bold text-slate-400 uppercase">Meals & Food</span>
          <div className="flex gap-1.5 my-2">
            <span className={`h-4 w-4 rounded-full ${foodInfo.level >= 1 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            <span className={`h-4 w-4 rounded-full ${foodInfo.level >= 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            <span className={`h-4 w-4 rounded-full ${foodInfo.level >= 3 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          </div>
          <span className="text-xs font-black text-emerald-400">{foodInfo.label}</span>
          <span className="text-[10px] text-slate-400 mt-1">2,500 Fresh Rations Staged</span>
        </div>

        {/* CLEAN WATER CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">💧</div>
          <span className="text-xs font-bold text-slate-400 uppercase">Drinking Water</span>
          <div className="flex gap-1.5 my-2">
            <span className={`h-4 w-4 rounded-full ${waterInfo.level >= 1 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            <span className={`h-4 w-4 rounded-full ${waterInfo.level >= 2 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
            <span className={`h-4 w-4 rounded-full ${waterInfo.level >= 3 ? 'bg-cyan-400' : 'bg-slate-700'}`} />
          </div>
          <span className="text-xs font-black text-cyan-400">{waterInfo.label}</span>
          <span className="text-[10px] text-slate-400 mt-1">10,000L Safe RO Tank</span>
        </div>

        {/* GENERATOR POWER CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-2">⚡</div>
          <span className="text-xs font-bold text-slate-400 uppercase">Electricity & Power</span>
          <div className="my-2">
            {powerBackup ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> POWER ON (కరెంట్ ఉంది)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> POWER OFF (కరెంట్ లేదు)
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">125 kVA Silent Genset</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. VISUAL CHARTS SECTION (DONUT & BAR CHART) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Donut Chart for Current Shelter */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-lg">📊</span> Camp Bed Capacity Chart (మంచాల చార్ట్)
            </h3>
            <span className="text-xs font-mono font-bold text-purple-400">{occupancyPercent}% Filled</span>
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
              <span className="text-2xl font-black text-white font-mono mt-0.5">{availableCapacity}</span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Free Beds</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
              <span className="font-bold text-emerald-400 block text-base font-mono">{availableCapacity}</span>
              <span className="text-[11px] text-slate-300">🟢 Available (ఖాళీ)</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/60">
              <span className="font-bold text-purple-300 block text-base font-mono">{occupancy}</span>
              <span className="text-[11px] text-slate-300">🟣 Occupied (ఉన్నవారు)</span>
            </div>
          </div>

          {/* Quick Intake Counter Buttons */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase block">
              ⚡ Rapid Gate Check-In (త్వరిత నమోదు):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickIntake(1)}
                disabled={availableCapacity < 1}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span className="text-sm">👤 +1</span>
                <span>Admit 1</span>
              </button>
              <button
                onClick={() => handleQuickIntake(4)}
                disabled={availableCapacity < 4}
                className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg disabled:opacity-50"
              >
                <span className="text-sm">👨‍👩‍👧‍👦 +4</span>
                <span>Family (+4)</span>
              </button>
              <button
                onClick={() => handleQuickIntake(-1)}
                disabled={occupancy <= 0}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer disabled:opacity-50"
              >
                <span className="text-sm">🚶 -1</span>
                <span>Depart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: District Relief Camps Comparative Bar Chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-lg">📈</span> NTR District Relief Camps Comparison (అన్ని క్యాంప్‌లు)
              </h3>
              <p className="text-[11px] text-slate-400">Green = Available Free Beds (ఎక్కువ ఆకుపచ్చ ఉన్న చోటుకు వెళ్లండి)</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
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
                <Bar dataKey="Occupied" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Provisions Form Controls */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">🍲 Food Stock</label>
              <select
                value={foodStock}
                onChange={(e) => setFoodStock(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
              >
                <option value="Abundant">Abundant (3+ Days)</option>
                <option value="Adequate">Adequate (24-48 hrs)</option>
                <option value="Low">Low (&lt; 12 hrs - Request Supply)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">💧 Clean Water</label>
              <select
                value={waterStock}
                onChange={(e) => setWaterStock(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-semibold"
              >
                <option value="Abundant">Abundant Tankers</option>
                <option value="Adequate">Adequate Filtration</option>
                <option value="Low">Low - Urgent Supply</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">⚡ Backup Power</label>
              <button
                type="button"
                onClick={() => setPowerBackup(!powerBackup)}
                className={`w-full py-1.5 px-2 rounded-lg font-bold border text-center transition-all cursor-pointer ${
                  powerBackup
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                    : 'bg-red-950/60 border-red-600 text-red-300'
                }`}
              >
                {powerBackup ? '⚡ Generator ACTIVE' : '❌ Generator OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
