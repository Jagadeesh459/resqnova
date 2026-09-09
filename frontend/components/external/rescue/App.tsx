import React, { useState } from 'react';
import { Header } from './components/Header';
import { DashboardScreen } from './components/DashboardScreen';
import { NavigationScreen } from './components/NavigationScreen';
import { createClient } from '@/lib/supabase/client';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'navigation'>('dashboard');
  const [liveMissionCount, setLiveMissionCount] = useState<number | null>(null);

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: team } = await supabase.from('rescue_teams').select('id').eq('manager_auth_id', authData.user.id).maybeSingle();
      if (!team) return;
      const { count } = await supabase.from('rescue_missions').select('id', { count: 'exact', head: true }).eq('rescue_team_id', team.id).neq('mission_status', 'completed');
      if (active) setLiveMissionCount(count ?? 0);
    };
    void load();
    const channel = supabase.channel('rescue-portal').on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_missions' }, () => { void load(); });
    channel.subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  const handleOpenMission = (missionId: string) => {
    setCurrentTab('navigation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMissions = () => {
    setCurrentTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#081321] text-[#E6F4FA] flex flex-col font-sans selection:bg-[#00D4FF]/30 selection:text-white">
      {/* Universal Tactical Header */}
      <Header currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main View Container */}
      <main className="flex-1 w-full">
        {liveMissionCount !== null && <div className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-[1720px] rounded-xl border border-[#00D4FF]/25 bg-[#0a1b2d]/90 px-4 py-2 text-xs font-mono text-[#7ce2fe]">SUPABASE MISSION LINK <span className="ml-2 text-white">{liveMissionCount} active mission{liveMissionCount === 1 ? '' : 's'}</span></div>}
        {currentTab === 'dashboard' ? (
          <DashboardScreen onOpenMission={handleOpenMission} />
        ) : (
          <NavigationScreen onBackToMissions={handleBackToMissions} />
        )}
      </main>
    </div>
  );
}
