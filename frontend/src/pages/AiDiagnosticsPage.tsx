import React, { useState } from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const AiDiagnosticsPage: React.FC = () => {
  const { state } = useResQNova();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const logs = state?.ai_execution_logs || [];

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.request_id.toLowerCase().includes(q) ||
      log.step.toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q)
    );
  });

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                AI Autonomous Triage & Dispatch Audit Ledger
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Immutable Ledger
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit trail of every prompt context, Gemini 3.8 Flash response, suitability score, and resource allocation.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SOS Code or Step..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Logs List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Logged Decision Checkpoints ({filteredLogs.length})</span>
            <span>Chronological</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const isSelected = log.id === (selectedLog?.id || selectedLogId);
              const isSuccess = log.status === 'success';
              const isWarning = log.status === 'warning';

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLogId(log.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {isSuccess ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : isWarning ? (
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-400 animate-spin" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">{log.step}</div>
                        <div className="font-mono text-[11px] text-blue-400 mt-0.5">
                          Req: {log.request_id}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isSuccess
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {log.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Log Detail & JSON Payload */}
        <div className="lg:col-span-7 space-y-4">
          {selectedLog ? (
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-400" />
                    {selectedLog.step}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Incident Target: <span className="font-mono text-white">{selectedLog.request_id}</span>
                  </p>
                </div>

                <span className="font-mono text-xs text-slate-400">
                  {new Date(selectedLog.created_at).toISOString()}
                </span>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Execution Outcome:</span>{' '}
                  <b
                    className={
                      selectedLog.status === 'success'
                        ? 'text-emerald-400'
                        : selectedLog.status === 'warning'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }
                  >
                    {selectedLog.status.toUpperCase()}
                  </b>
                </div>
                <div className="text-[11px] text-slate-400">
                  Target: Vijayawada Emergency District Engine
                </div>
              </div>

              {/* Payload Viewer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Code className="h-3.5 w-3.5 text-blue-400" /> Telemetry & Evaluation Payload
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">application/json</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[400px]">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2 text-slate-400">
              <ShieldAlert className="h-8 w-8 mx-auto text-slate-500" />
              <div className="font-bold text-white text-sm">No Audit Checkpoint Selected</div>
              <p className="text-xs">
                Select an entry from the ledger on the left to inspect its parameters and decision output.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
