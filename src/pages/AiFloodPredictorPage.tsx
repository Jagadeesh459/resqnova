import React, { useState } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import { TacticalMap } from '../components/TacticalMap';
import {
  Brain,
  Database,
  Cpu,
  Layers,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
  MapPin,
  Anchor,
  HeartPulse,
  Package,
  Radio,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AiFloodPredictionResult, FloodImpactZone, QuantumPrepositionPoint } from '../types';

export const AiFloodPredictorPage: React.FC = () => {
  const { state, saveAiFloodPrediction, navigate } = useResQNova();

  // -------------------------------------------------------------
  // 1. DATASET & MODEL TRAINING STATE
  // -------------------------------------------------------------
  const [selectedDataset, setSelectedDataset] = useState<'krishna_historical' | 'cyclone_michaung' | 'prakasam_surge_2019'>('krishna_historical');
  const [modelArchitecture, setModelArchitecture] = useState<'bilstm_attention' | 'pinn_saint_venant' | 'xgboost_ensemble'>('bilstm_attention');
  const [epochs, setEpochs] = useState<number>(50);
  const [learningRate, setLearningRate] = useState<string>('0.001');
  const [batchSize, setBatchSize] = useState<number>(64);

  // Training state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingEpoch, setTrainingEpoch] = useState<number>(0);
  const [trainingTrained, setTrainingTrained] = useState<boolean>(true);
  const [trainingMetrics, setTrainingMetrics] = useState<{
    accuracy: number;
    loss: number;
    val_loss: number;
    f1_score: number;
    rmse_cusecs: number;
  }>({
    accuracy: 97.4,
    loss: 0.014,
    val_loss: 0.019,
    f1_score: 0.968,
    rmse_cusecs: 4120,
  });

  // Training Loss Curve Data
  const [lossHistory, setLossHistory] = useState<Array<{ epoch: number; train_loss: number; val_loss: number; accuracy: number }>>([
    { epoch: 5, train_loss: 0.42, val_loss: 0.46, accuracy: 78.5 },
    { epoch: 10, train_loss: 0.28, val_loss: 0.31, accuracy: 84.2 },
    { epoch: 20, train_loss: 0.16, val_loss: 0.19, accuracy: 91.0 },
    { epoch: 30, train_loss: 0.08, val_loss: 0.11, accuracy: 94.6 },
    { epoch: 40, train_loss: 0.03, val_loss: 0.05, accuracy: 96.2 },
    { epoch: 50, train_loss: 0.014, val_loss: 0.019, accuracy: 97.4 },
  ]);

  // -------------------------------------------------------------
  // 2. LIVE INFERENCE / TELEMETRY INPUTS
  // -------------------------------------------------------------
  const [inflowCusecs, setInflowCusecs] = useState<number>(510000);
  const [rainfallMm, setRainfallMm] = useState<number>(185);
  const [soilMoisturePct, setSoilMoisturePct] = useState<number>(92);
  const [gatesOpen, setGatesOpen] = useState<number>(68);

  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionSuccessMessage, setPredictionSuccessMessage] = useState<string | null>(null);

  // Handle Model Training Simulation
  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingTrained(false);

    const generatedHistory: Array<{ epoch: number; train_loss: number; val_loss: number; accuracy: number }> = [];
    const totalSteps = 10;

    for (let step = 1; step <= totalSteps; step++) {
      await new Promise((r) => setTimeout(r, 220));
      const currentEpoch = Math.round((step / totalSteps) * epochs);
      const prog = Math.round((step / totalSteps) * 100);
      const trainLoss = Number((0.65 * Math.exp(-step * 0.4) + 0.012).toFixed(3));
      const valLoss = Number((0.72 * Math.exp(-step * 0.38) + 0.018).toFixed(3));
      const acc = Number((72 + (25.8 * step) / totalSteps).toFixed(1));

      generatedHistory.push({
        epoch: currentEpoch,
        train_loss: trainLoss,
        val_loss: valLoss,
        accuracy: acc,
      });

      setTrainingProgress(prog);
      setTrainingEpoch(currentEpoch);
    }

    setLossHistory(generatedHistory);
    setTrainingMetrics({
      accuracy: 97.8,
      loss: 0.012,
      val_loss: 0.018,
      f1_score: 0.972,
      rmse_cusecs: 3890,
    });
    setTrainingTrained(true);
    setIsTraining(false);
  };

  // Run AI Prediction & Trigger Quantum Optimizer Pre-Positioning
  const handleRunAiPrediction = async () => {
    setIsPredicting(true);
    setPredictionSuccessMessage(null);

    await new Promise((r) => setTimeout(r, 600));

    // Dynamic calculations based on barrage inflow and rainfall
    const calculatedProbability = Math.min(
      99.4,
      Math.max(45, (inflowCusecs / 600000) * 70 + (rainfallMm / 250) * 30)
    );
    const predictedPeakHours = Number((6.8 - (inflowCusecs / 1000000) * 3.5).toFixed(1));

    // Define RED AREA (Critical high impact > 3.5m) and YELLOW AREA (Moderate impact 1.5 - 3.5m)
    const impactZones: FloodImpactZone[] = [
      {
        id: 'zone-red-1',
        name: 'Krishna Lanka Riverfront Bund Basin (RED AREA)',
        impact_level: 'red',
        water_level_m: Number((3.6 + (inflowCusecs / 1000000) * 1.5).toFixed(2)),
        population_at_risk: 32400,
        polygon: [
          [16.5015, 80.638],
          [16.505, 80.643],
          [16.5075, 80.6485],
          [16.504, 80.654],
          [16.498, 80.646],
        ],
        quantum_preposition_needed:
          'Pre-position 3x 40HP Zodiac Boat Squads at Riverfront Jetty Alpha prior to 2hr crest; establish Varadhi South high-ground ALS ambulance pickup ramp.',
      },
      {
        id: 'zone-red-2',
        name: 'Ranigari Thota & Tarapet Canal Confluence (RED AREA)',
        impact_level: 'red',
        water_level_m: Number((3.8 + (inflowCusecs / 1000000) * 1.2).toFixed(2)),
        population_at_risk: 18500,
        polygon: [
          [16.509, 80.649],
          [16.5135, 80.655],
          [16.511, 80.661],
          [16.506, 80.657],
        ],
        quantum_preposition_needed:
          'Pre-position inflatable watercraft and emergency drone communications repeater at Auto Nagar Apex High-Ground before canal backflow breaches culvert.',
      },
      {
        id: 'zone-yellow-1',
        name: 'Bhavanipuram Low Catchment & Ferry Ghat (YELLOW AREA)',
        impact_level: 'yellow',
        water_level_m: Number((2.4 + (inflowCusecs / 1200000)).toFixed(2)),
        population_at_risk: 14200,
        polygon: [
          [16.518, 80.598],
          [16.523, 80.608],
          [16.519, 80.618],
          [16.512, 80.612],
        ],
        quantum_preposition_needed:
          'Deploy high-clearance SDRF water tractor & preposition food ration mobile van at Gollapudi Dry High Ground.',
      },
      {
        id: 'zone-yellow-2',
        name: 'Vidyadharapuram & Wynchipet Spillway Reach (YELLOW AREA)',
        impact_level: 'yellow',
        water_level_m: Number((2.1 + (inflowCusecs / 1400000)).toFixed(2)),
        population_at_risk: 9800,
        polygon: [
          [16.525, 80.612],
          [16.531, 80.622],
          [16.526, 80.628],
          [16.52, 80.62],
        ],
        quantum_preposition_needed:
          'Establish dry evacuation perimeter along Tunnel Bypass road toward Bishop Grassi High School shelter.',
      },
    ];

    // Formulate Quantum Pre-Positioning Staging Points (QUBO Solution)
    const quantumPoints: QuantumPrepositionPoint[] = [
      {
        id: 'qubo-prep-1',
        title: 'Quantum Pre-Positioned Boat Squad Alpha (Krishna Jetty)',
        type: 'boat_squad',
        latitude: 16.5028,
        longitude: 80.6405,
        qubo_rank: 1,
        qubo_energy_delta: 24.6,
        staging_reason:
          'Staged at Krishna Riverfront Jetty Alpha BEFORE barrage weir overflow, eliminating 38-minute traversal latency across flooded urban grid.',
        dry_ground_elevation_m: 22.4,
        coverage_sector: 'Krishna Lanka Red Impact Zone',
      },
      {
        id: 'qubo-prep-2',
        title: 'Quantum Pre-Positioned 108 ALS Ambulance (Varadhi South Ramp)',
        type: 'ambulance_als',
        latitude: 16.4985,
        longitude: 80.636,
        qubo_rank: 2,
        qubo_energy_delta: 19.8,
        staging_reason:
          'Pre-positioned on elevated national highway south approach with guaranteed dry tarmac access to Government General Hospital trauma bay.',
        dry_ground_elevation_m: 28.5,
        coverage_sector: 'Varadhi Arterial & Casualty Handoff Corridor',
      },
      {
        id: 'qubo-prep-3',
        title: 'Quantum Pre-Positioned High-Ground Relief Hub (IGMC)',
        type: 'relief_staging',
        latitude: 16.5085,
        longitude: 80.6425,
        qubo_rank: 3,
        qubo_energy_delta: 16.2,
        staging_reason:
          'Dry relief distribution center positioned in upper stadium concourse with emergency diesel power backup & 450 bed reserve.',
        dry_ground_elevation_m: 26.0,
        coverage_sector: 'Central City Shelter Network',
      },
      {
        id: 'qubo-prep-4',
        title: 'Quantum Drone Aerial Telemetry Relay (Gandhi Hill)',
        type: 'drone_relay',
        latitude: 16.516,
        longitude: 80.624,
        qubo_rank: 4,
        qubo_energy_delta: 12.5,
        staging_reason:
          'Elevated line-of-sight RF relay maintaining uninterrupted mesh communication between rescue boats and Collectorate Incident Command.',
        dry_ground_elevation_m: 45.2,
        coverage_sector: 'Entire Vijayawada River Basin',
      },
    ];

    const result: AiFloodPredictionResult = {
      id: `ai-pred-${Date.now()}`,
      timestamp: new Date().toISOString(),
      predicted_barrage_discharge_cusecs: Math.round(inflowCusecs * 1.12),
      flood_probability_percent: Number(calculatedProbability.toFixed(1)),
      predicted_peak_time_hours: predictedPeakHours,
      model_name:
        modelArchitecture === 'bilstm_attention'
          ? 'Bidirectional LSTM + Temporal Attention (Hydro-Net v3.4)'
          : modelArchitecture === 'pinn_saint_venant'
          ? 'Physics-Informed Neural Network (PINN Saint-Venant 2D)'
          : 'XGBoost Hydraulic Ensemble (CWC Benchmark)',
      dataset_used:
        selectedDataset === 'krishna_historical'
          ? 'CWC Krishna Basin Historical Hydrology (2014-2024)'
          : selectedDataset === 'cyclone_michaung'
          ? 'Cyclone Michaung Krishna Inundation Radar'
          : '2019 Record Prakasam Barrage Inundation Telemetry',
      accuracy_score: trainingMetrics.accuracy,
      impact_zones: impactZones,
      quantum_prepositioning_points: quantumPoints,
    };

    await saveAiFloodPrediction(result);
    setIsPredicting(false);
    setPredictionSuccessMessage(
      `AI Flood Prediction completed! Quantum Optimizer successfully generated ${impactZones.length} Impact Zones (Red & Yellow Areas) and ${quantumPoints.length} Strategic Pre-Positioning Nodes on the map.`
    );
  };

  const latestPred = state?.latest_ai_flood_prediction;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ------------------------------------------------------------- */}
      {/* PAGE HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
            <Brain className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300">
                NEURAL FLOOD FORECASTING & QUANTUM STAGING ENGINE
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE AI PIPELINE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Flood Predictor & Quantum Pre-Positioning Optimizer
            </h1>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              Train neural hydrological models on Krishna river catchment telemetry datasets, forecast peak inundation surge, and activate QUBO quantum optimization to stage boats and ambulances across <b>Red and Yellow impact zones</b> prior to disaster cresting.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <span>View Command Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: TRAIN AI MODEL FROM HYDROLOGICAL DATASET */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              1. Train AI Hydrological Model From Dataset
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Status:{' '}
            <b className={trainingTrained ? 'text-emerald-400' : 'text-amber-400'}>
              {trainingTrained ? 'Model Trained & Weights Compiled' : 'Untrained'}
            </b>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Training Configuration Knobs */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
                Select Training Dataset:
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value as any)}
                disabled={isTraining}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              >
                <option value="krishna_historical">
                  CWC Krishna Basin Historical Telemetry (2014-2024, 48,200 records)
                </option>
                <option value="cyclone_michaung">
                  Cyclone Michaung Radar Precipitation & Barrage Flash Runoff (2023)
                </option>
                <option value="prakasam_surge_2019">
                  2019 Record Prakasam Barrage Discharge Surge (8.2 Lakh Cusecs)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                Neural Network Architecture:
              </label>
              <select
                value={modelArchitecture}
                onChange={(e) => setModelArchitecture(e.target.value as any)}
                disabled={isTraining}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              >
                <option value="bilstm_attention">
                  Bidirectional LSTM + Multi-Head Temporal Attention (Recommended)
                </option>
                <option value="pinn_saint_venant">
                  Physics-Informed Neural Network (PINN: 2D Saint-Venant Equations)
                </option>
                <option value="xgboost_ensemble">
                  Extreme Gradient Boosted Hydro-Tree Ensemble (XGBoost)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Epochs</label>
                <input
                  type="number"
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  disabled={isTraining}
                  min={10}
                  max={200}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Learning Rate</label>
                <input
                  type="text"
                  value={learningRate}
                  onChange={(e) => setLearningRate(e.target.value)}
                  disabled={isTraining}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Batch Size</label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={isTraining}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            {/* Train Button */}
            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isTraining
                  ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
              }`}
            >
              <Zap className={`h-4 w-4 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? `Training Neural Model... (${trainingProgress}%)` : 'Train AI Model on Dataset'}</span>
            </button>

            {/* Training Progress bar */}
            {isTraining && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Epoch {trainingEpoch} / {epochs}</span>
                  <span>{trainingProgress}% Completed</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Accuracy</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{trainingMetrics.accuracy}%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Loss (MSE)</span>
                <span className="font-mono text-sm font-bold text-cyan-400">{trainingMetrics.loss}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">F1-Score</span>
                <span className="font-mono text-sm font-bold text-purple-400">{trainingMetrics.f1_score}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">RMSE Error</span>
                <span className="font-mono text-sm font-bold text-amber-400">±{trainingMetrics.rmse_cusecs} cfs</span>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Training Loss & Convergence Curves */}
          <div className="lg:col-span-7 bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Training Loss Convergence & Validation Accuracy Curve
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Model: <b>{modelArchitecture.replace('_', ' ').toUpperCase()}</b>
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 0.5]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="train_loss" name="Training Loss" stroke="#00f0ff" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="val_loss" name="Validation Loss" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              *Loss converges via Adam optimizer with cosine learning rate annealing. Gradients penalize physical mass conservation violations across Krishna reservoir bounds.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: LIVE AI FLOOD PREDICTION & QUANTUM OPTIMIZATION */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white">
              2. Live Flood Prediction & Quantum Optimizer Pre-Positioning
            </h2>
          </div>
          <span className="text-xs text-blue-300 font-mono">
            QUBO Mathematical Combinatorial Formulation Active
          </span>
        </div>

        {/* Telemetry Input Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold">Barrage Inflow Rate</span>
              <span className="font-mono text-cyan-400 font-bold">{(inflowCusecs / 1000).toFixed(0)}k Cusecs</span>
            </div>
            <input
              type="range"
              min={150000}
              max={850000}
              step={10000}
              value={inflowCusecs}
              onChange={(e) => setInflowCusecs(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Upstream Prakasam Barrage discharge inflow</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold">24hr Precipitation</span>
              <span className="font-mono text-blue-400 font-bold">{rainfallMm} mm</span>
            </div>
            <input
              type="range"
              min={20}
              max={350}
              step={5}
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Krishna delta cloudburst accumulation</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold">Soil Saturation</span>
              <span className="font-mono text-amber-400 font-bold">{soilMoisturePct}%</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={soilMoisturePct}
              onChange={(e) => setSoilMoisturePct(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Catchment absorption zero point threshold</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold">Barrage Sluice Gates</span>
              <span className="font-mono text-red-400 font-bold">{gatesOpen} / 70</span>
            </div>
            <input
              type="range"
              min={10}
              max={70}
              step={1}
              value={gatesOpen}
              onChange={(e) => setGatesOpen(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Emergency spillway gates opened full stroke</span>
          </div>
        </div>

        {/* Prediction Trigger Button */}
        <div className="pt-1">
          <button
            onClick={handleRunAiPrediction}
            disabled={isPredicting}
            className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
              isPredicting
                ? 'bg-cyan-600/50 text-cyan-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-cyan-950/50'
            }`}
          >
            <Sparkles className={`h-5 w-5 ${isPredicting ? 'animate-spin' : ''}`} />
            <span>
              {isPredicting
                ? 'Predicting Flood Surge & Solving Quantum Pre-Positioning QUBO...'
                : '⚡ Run AI Flood Prediction & Quantum Optimizer'}
            </span>
          </button>
        </div>

        {predictionSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{predictionSuccessMessage}</span>
          </div>
        )}

        {/* Prediction Output & Impact Zones Breakdown */}
        {latestPred && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1">
                <span className="text-[11px] text-red-300 font-bold uppercase tracking-wider block">
                  Flood Surge Probability
                </span>
                <span className="text-2xl font-black text-white">{latestPred.flood_probability_percent}%</span>
                <span className="text-[11px] text-red-300 block">Critical Hydrological Threat</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-1">
                <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">
                  Predicted Peak Time Window
                </span>
                <span className="text-2xl font-black text-white">{latestPred.predicted_peak_time_hours} Hours</span>
                <span className="text-[11px] text-amber-300 block">Pre-position before crest</span>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-1">
                <span className="text-[11px] text-cyan-300 font-bold uppercase tracking-wider block">
                  Forecast Barrage Discharge
                </span>
                <span className="text-2xl font-black text-white">
                  {(latestPred.predicted_barrage_discharge_cusecs / 1000).toFixed(0)}k Cfs
                </span>
                <span className="text-[11px] text-cyan-300 block">Prakasam Barrage Inundation Level</span>
              </div>
            </div>

            {/* Impact Zones (Red & Yellow Areas) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-red-400" />
                  Calculated Flood Impact Zones (Red Area & Yellow Area):
                </h3>
                <span className="text-xs text-slate-400">
                  {latestPred.impact_zones.length} Zones Identified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {latestPred.impact_zones.map((zone) => {
                  const isRed = zone.impact_level === 'red';
                  return (
                    <div
                      key={zone.id}
                      className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                        isRed
                          ? 'bg-red-950/20 border-red-500/50 hover:border-red-400'
                          : 'bg-amber-950/20 border-amber-500/50 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                            isRed ? 'bg-red-600' : 'bg-amber-600'
                          }`}
                        >
                          {isRed ? '🚨 RED IMPACT AREA' : '⚠️ YELLOW IMPACT AREA'}
                        </span>
                        <span className={`font-mono font-bold ${isRed ? 'text-red-400' : 'text-amber-400'}`}>
                          +{zone.water_level_m}m Inundation
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                      <p className="text-slate-300 text-[11px]">
                        Population at Risk: <b>{zone.population_at_risk.toLocaleString()} citizens</b>
                      </p>

                      <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">
                          Quantum Pre-Positioning Directive:
                        </span>
                        <span>{zone.quantum_preposition_needed}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantum Optimizer Pre-Positioning Staging Points */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Anchor className="h-4 w-4 text-cyan-400" />
                  Quantum Optimizer Pre-Positioning Staging Nodes (Prior to Peak):
                </h3>
                <span className="text-xs text-cyan-400 font-mono">
                  All 4 Nodes Staged on High Ground
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {latestPred.quantum_prepositioning_points.map((point) => (
                  <div
                    key={point.id}
                    className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-cyan-400 font-bold">QUBO RANK #{point.qubo_rank}</span>
                        <span className="text-emerald-400 font-bold">Elev: {point.dry_ground_elevation_m}m</span>
                      </div>
                      <h5 className="font-bold text-white line-clamp-1">{point.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{point.staging_reason}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Covering: <b>{point.coverage_sector}</b></span>
                      <span className="text-cyan-300 font-mono font-bold">ΔE: -{point.qubo_energy_delta}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: TACTICAL MAP WITH AI RED/YELLOW ZONES & QUANTUM NODES */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-400" />
              Tactical Map: AI Flood Inundation Zones & Quantum Pre-Positioning
            </h2>
            <p className="text-xs text-slate-400">
              Visualizing the AI predicted <b>Red Area (Severe)</b>, <b>Yellow Area (Moderate)</b>, and Quantum staged watercraft/ambulance units prior to flood cresting.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-red-400 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Red Area (&gt;3.5m)
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Yellow Area (1.5-3.5m)
            </span>
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Quantum Staging
            </span>
          </div>
        </div>

        <TacticalMap height="520px" />
      </div>
    </div>
  );
};
