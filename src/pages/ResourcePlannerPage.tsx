import React, { useState } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import {
  Cpu,
  Zap,
  Shield,
  Layers,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Sliders,
  Compass,
} from 'lucide-react';
import { optimizeResources } from '../lib/api';
import { QuantumOptimizationResult } from '../types';

export const ResourcePlannerPage: React.FC = () => {
  const { state } = useResQNova();

  const [riskWeight, setRiskWeight] = useState(1.5);
  const [travelWeight, setTravelWeight] = useState(0.8);
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState<QuantumOptimizationResult | null>(null);

  const handleRunOptimization = async () => {
    setSolving(true);
    try {
      const res = await optimizeResources(riskWeight, travelWeight);
      setResult(res);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Quantum Resource Pre-Positioning Optimizer (QAOA / QUBO)
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Variational Circuit (p=2)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Formulates quadratic unconstrained binary optimization (QUBO) across Vijayawada flood sectors.
            </p>
          </div>
        </div>

        <button
          id="btn-run-qaoa-optimizer"
          onClick={handleRunOptimization}
          disabled={solving}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all ${
            solving
              ? 'bg-slate-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40 hover:scale-[1.01]'
          }`}
        >
          {solving ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Simulating QAOA Statevector...
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 fill-current" /> Execute Quantum Pre-Positioning Solver
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Mathematical Hyperparameters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-400" />
                Hamiltonian Weights & QUBO Penalty
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Objective: Minimize ∑ C(i,j) · x(i,j) + λ ∑ (∑ x(i,j) - 1)²
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Risk Zone Priority Weight ($\alpha$)</span>
                  <span className="font-mono font-bold text-blue-400">{riskWeight}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={riskWeight}
                  onChange={(e) => setRiskWeight(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Transit Distance Penalty ($\beta$)</span>
                  <span className="font-mono font-bold text-blue-400">{travelWeight}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={travelWeight}
                  onChange={(e) => setTravelWeight(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300">Active Sector Candidates</div>
              <div>• Krishna Lanka Flood Inundation Zone (High Vulnerability)</div>
              <div>• Bhavanipuram Embankment Sector (Severe Risk)</div>
              <div>• Ramavarappadu Low-lying Catchment</div>
            </div>
          </div>

          {/* Quantum Circuit Telemetry */}
          {result && (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-blue-400" />
                  Circuit Telemetry
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
                  <span className="text-slate-500 block">Qubit Count</span>
                  <span className="font-mono font-bold text-white">{result.num_qubits} Qubits</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Circuit Depth</span>
                  <span className="font-mono font-bold text-white">{result.circuit_depth} layers</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Optimal $\gamma$</span>
                  <span className="font-mono font-bold text-blue-400">
                    [{result.optimal_parameters.gamma.map((g) => g.toFixed(2)).join(', ')}]
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">Optimal $\beta$</span>
                  <span className="font-mono font-bold text-blue-400">
                    [{result.optimal_parameters.beta.map((b) => b.toFixed(2)).join(', ')}]
                  </span>
                </div>
              </div>

              {result.pauli_ising_hamiltonian && result.pauli_ising_hamiltonian.length > 0 && (
                <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-400 block">Ising Pauli Operators:</span>
                  <div className="font-mono text-[10px] text-amber-200/80 space-y-0.5 overflow-x-auto max-h-20">
                    {result.pauli_ising_hamiltonian.slice(0, 4).map((p, idx) => (
                      <div key={idx}>{p}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[11px]">
                <div className="flex items-center justify-between font-bold text-emerald-300">
                  <span>QAOA vs Classical Baseline</span>
                  <span>+{result.gap_or_improvement_pct}% Gain</span>
                </div>
                <div className="text-slate-400 mt-1 flex justify-between">
                  <span>Quantum Objective: {result.objective_value}</span>
                  <span>Greedy: {result.classical_baseline_value}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 8 Cols: Solution Matrix & Map */}
        <div className="lg:col-span-8 space-y-4">
          {result ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Pre-Positioning Deployment Plan (QUBO Decoded)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Solved in {result.runtime_ms} ms
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.allocations.map((alloc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{alloc.resource_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {alloc.resource_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      Staged to Target Sector: <b className="text-emerald-400">{alloc.assigned_zone_name}</b>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/80 text-[11px]">
                      <span>Transit Distance: <b>{alloc.travel_distance_km} km</b></span>
                      <span>Mitigation Index: <b className="text-blue-400">{alloc.risk_mitigation_score}/100</b></span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <div className="text-xs font-bold text-white mb-2">Pre-Positioning Geographic Staging</div>
                <TacticalMap height="320px" />
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Cpu className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-white">Quantum Optimizer Ready</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Execute Quantum Pre-Positioning Solver" above to formulate the combinatorial QUBO
                hamiltonian and simulate QAOA parameterized statevectors for Vijayawada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
