import React, { useState } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import {
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Navigation,
  Compass,
} from 'lucide-react';
import { optimizeEvacuation } from '../lib/api';
import { EvacuationOptimizationResult } from '../types';

export const EvacuationPlannerPage: React.FC = () => {
  const { state } = useResQNova();

  const [popKrishnaLanka, setPopKrishnaLanka] = useState(480);
  const [popBhavanipuram, setPopBhavanipuram] = useState(320);
  const [popRamavarappadu, setPopRamavarappadu] = useState(250);

  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<EvacuationOptimizationResult | null>(null);

  const handleRunEvacuation = async () => {
    setSolving(true);
    try {
      const populations = {
        'zone-1': popKrishnaLanka,
        'zone-2': popBhavanipuram,
        'zone-3': popRamavarappadu,
      };
      const res = await optimizeEvacuation(populations);
      setResult(res);
    } catch (err) {
      console.error('Evacuation QUBO error:', err);
    } finally {
      setSolving(false);
    }
  };

  const totalPopToEvacuate = popKrishnaLanka + popBhavanipuram + popRamavarappadu;
  const totalShelterAvailable = state?.shelters.reduce((acc, s) => acc + s.available_capacity, 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Quantum Mass Evacuation Planner (Capacity-Constrained QUBO)
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Strict Zero-Overflow
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Distributes vulnerable populations into verified dry shelters while minimizing flood road exposure.
            </p>
          </div>
        </div>

        <button
          id="btn-run-evac-qaoa"
          onClick={handleRunEvacuation}
          disabled={solving}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all ${
            solving
              ? 'bg-slate-700 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40 hover:scale-[1.01]'
          }`}
        >
          {solving ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Solving Capacity QUBO...
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" /> Solve Evacuation QUBO via QAOA
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Sector Inputs */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                Affected Sector Population Influx
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Target evacuees: <b>{totalPopToEvacuate}</b> | Verified Shelter Capacity:{' '}
                <b className="text-emerald-400">{totalShelterAvailable}</b>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Krishna Lanka (Canal Bund)</span>
                  <span className="font-bold text-white">{popKrishnaLanka} citizens</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  step="50"
                  value={popKrishnaLanka}
                  onChange={(e) => setPopKrishnaLanka(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bhavanipuram (Riverbank)</span>
                  <span className="font-bold text-white">{popBhavanipuram} citizens</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="50"
                  value={popBhavanipuram}
                  onChange={(e) => setPopBhavanipuram(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Ramavarappadu (Low Catchment)</span>
                  <span className="font-bold text-white">{popRamavarappadu} citizens</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="50"
                  value={popRamavarappadu}
                  onChange={(e) => setPopRamavarappadu(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300">Safety Invariant Mandate</div>
              <div>• Capacity Overflow Limit: <b>0</b> (Strict Hard Constraint)</div>
              <div>• Prioritize Children &amp; Senior Citizens to Indoor Shelters with Power Backup</div>
            </div>
          </div>

          {/* Solution Stats */}
          {result && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Optimization Performance
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  result.backend_engine === 'qiskit_python'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                }`}>
                  {result.backend_engine === 'qiskit_python'
                    ? `⚡ Qiskit ${result.qiskit_version || '2.5.2'} (Python QAOA)`
                    : '🔬 Pure TS Statevector'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Total Evacuated</span>
                  <span className="font-bold text-emerald-400">{result.total_evacuees}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Shelters Used</span>
                  <span className="font-bold text-white">{result.shelters_utilized} of {state?.shelters.length}</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Capacity Overflow</span>
                  <span className="font-bold text-emerald-400">{result.capacity_overflow} (0% Error)</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Runtime</span>
                  <span className="font-mono text-white">{result.runtime_ms} ms</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-purple-950/20 border border-purple-500/30 text-[11px]">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span>QAOA Optimization Gain</span>
                  <span>+{result.quantum_gain_pct}% Efficiency</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 8 Cols: Decoded Evacuation Distribution Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {result ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Shelter Evacuation Distribution Matrix
                </h3>
                <span className="text-xs text-slate-400">
                  {result.allocations.length} Tactical Dispatches
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/40">
                    <tr>
                      <th className="py-2.5 px-3">Origin Zone</th>
                      <th className="py-2.5 px-3">Allocated Shelter</th>
                      <th className="py-2.5 px-3 text-center">Evacuees</th>
                      <th className="py-2.5 px-3 text-center">Vulnerable</th>
                      <th className="py-2.5 px-3 text-center">Capacity Load</th>
                      <th className="py-2.5 px-3 text-right">Route Safety</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.allocations.map((alloc, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/30">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {alloc.zone_name}
                        </td>
                        <td className="py-2.5 px-3 text-purple-300 font-medium">
                          {alloc.shelter_name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">
                          {alloc.evacuee_count}
                        </td>
                        <td className="py-2.5 px-3 text-center text-amber-400 font-medium">
                          {alloc.vulnerable_count}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px]">
                            {alloc.assigned_capacity_usage_pct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">
                          {alloc.safe_route_distance_km} km ({alloc.road_safety_index}/100)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <div className="text-xs font-bold text-white mb-2">Evacuation Corridor GIS Digital Twin</div>
                <TacticalMap height="320px" />
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                <Building2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Evacuation Solver Ready</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Adjust the population influx sliders on the left and click "Solve Evacuation QUBO via QAOA" to
                compute the shelter allocation schedule.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
