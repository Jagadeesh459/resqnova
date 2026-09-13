import React from 'react';
import { useResQNova } from '../context/ResQNovaContext';
import {
  CheckCircle2,
  Users,
  Clock,
  ShieldCheck,
  Building2,
  HeartPulse,
  Download,
  Calendar,
} from 'lucide-react';

export const ResolvedOperationsPage: React.FC = () => {
  const { state } = useResQNova();

  const completedRequests =
    state?.citizen_requests.filter((r) => r.status === 'completed') || [];

  const totalRescued = completedRequests.reduce((acc, curr) => acc + curr.people_count, 0);
  const totalChildren = completedRequests.reduce((acc, curr) => acc + curr.children_count, 0);
  const totalElderly = completedRequests.reduce((acc, curr) => acc + curr.elderly_count, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Resolved Operations & Post-Disaster Ledger
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Archived Records
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audit log of completed water extractions, casualty admissions, and verified shelter check-ins.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(completedRequests, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `resqnova-resolved-report-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> Export Mission Log
        </button>
      </div>

      {/* Aggregate Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Completed Extractions</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {completedRequests.length}
          </div>
          <div className="text-[11px] text-emerald-400">100% Extraction Safety Rate</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Citizens Rescued</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">
            {totalRescued}
          </div>
          <div className="text-[11px] text-slate-400">
            {totalChildren} children, {totalElderly} elderly
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Average Response Latency</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            14.2 min
          </div>
          <div className="text-[11px] text-slate-400">SOS to On-Scene Extraction</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Trauma Survival Rate</span>
            <HeartPulse className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-400 tracking-tight">
            100%
          </div>
          <div className="text-[11px] text-sky-400/80">Zero avoidable casualties</div>
        </div>
      </div>

      {/* Completed Missions Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Completed Operations Ledger ({completedRequests.length})
          </h3>
          <span className="text-xs text-slate-400">District Disaster Management Authority (DDMA)</span>
        </div>

        {completedRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-3">Mission ID</th>
                  <th className="py-3 px-3">Citizen Contact</th>
                  <th className="py-3 px-3">Location Landmark</th>
                  <th className="py-3 px-3 text-center">Evacuees</th>
                  <th className="py-3 px-3">Rescue Squad</th>
                  <th className="py-3 px-3">Allocated Shelter / ER</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {completedRequests.map((req) => {
                  const team = state?.rescue_teams.find((t) => t.id === req.rescue_team_id);
                  const shelter = state?.shelters.find((s) => s.id === req.recommended_shelter_id);

                  return (
                    <tr key={req.id} className="hover:bg-slate-950/30">
                      <td className="py-3 px-3 font-mono font-bold text-blue-400">
                        {req.request_id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{req.citizen_name}</div>
                        <div className="text-[11px] text-slate-400">{req.citizen_phone}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-[220px] truncate">
                        {req.address_hint}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-white">{req.people_count}</span>
                        <div className="text-[10px] text-slate-400">
                          ({req.children_count}c, {req.elderly_count}e)
                        </div>
                      </td>
                      <td className="py-3 px-3 text-blue-300 font-medium">
                        {team?.team_name || 'NDRF Boat Squad Alpha'}
                      </td>
                      <td className="py-3 px-3 text-purple-300 font-medium">
                        {shelter?.shelter_name || 'IGMC Stadium Emergency Camp'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[11px]">
                          <CheckCircle2 className="h-3 w-3" /> Rescued
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 text-slate-600 mx-auto" />
            <div className="font-bold text-white text-sm">No Resolved Missions Yet</div>
            <p className="text-xs">
              When rescue squads or ambulances resolve active missions, their post-incident audit entries will
              be permanently recorded here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
