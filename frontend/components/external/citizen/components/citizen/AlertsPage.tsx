import React, { useState } from 'react';
import { useRouter } from '../../lib/router';
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  Navigation,
  Droplets,
  ShieldAlert,
  Phone,
  ArrowRight,
  Waves,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

type FilterType = 'all' | 'evac' | 'flood' | 'road' | 'water';

interface AlertItem {
  id: string;
  category: FilterType[];
  urgency: 'high' | 'medium' | 'info';
  badge: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  timeAgo: string;
  affectedAreas: string;
  whatHappened: string;
  whatToDo: string;
  audioText: string;
  actionText?: string;
  actionRoute?: string;
}

export const AlertsPage: React.FC = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handleToggleAudio = (id: string, text: string) => {
    if (playingAudioId === id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingAudioId(null);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      }
      setPlayingAudioId(id);
    }
  };

  const alerts: AlertItem[] = [
    {
      id: 'alert-prakasam',
      category: ['all', 'evac'],
      urgency: 'high',
      badge: 'Immediate Evacuation',
      badgeBg: 'bg-[#93000a] border border-[#ffb4ab]/40',
      badgeText: 'text-[#ffdad7]',
      title: 'Prakasam Barrage Water Released — Low-Lying Areas Must Move Now',
      timeAgo: '15 mins ago',
      affectedAreas: 'Ranigarithota, Tarapet, and Krishnalanka (Sector B)',
      whatHappened:
        'All 70 gates of Prakasam Barrage have been opened to release excess Krishna river water. Water levels are rising fast along the riverbanks.',
      whatToDo:
        'Leave riverbank homes immediately. Walk or drive toward high ground or the Municipal Community Hall shelter. Avoid low underpasses.',
      audioText:
        'Immediate Evacuation Alert. Prakasam Barrage gates are fully opened. Residents in Ranigarithota, Tarapet, and Krishnalanka Sector B must evacuate immediately to the nearest high ground shelter.',
      actionText: 'View Evacuation Route to Shelter',
      actionRoute: '/citizen/safe-route',
    },
    {
      id: 'alert-budameru',
      category: ['all', 'flood'],
      urgency: 'medium',
      badge: 'Flash Flood Warning',
      badgeBg: 'bg-[#78350f] border border-[#f59e0b]/40',
      badgeText: 'text-[#fef3c7]',
      title: 'Budameru Canal Overflow Warning',
      timeAgo: '30 mins ago',
      affectedAreas: 'Ajit Singh Nagar, Ambapuram, and adjoining low areas',
      whatHappened:
        'Heavy upstream rainfall has caused the Budameru stream to rise close to bank levels. Water may enter street level within 2 to 3 hours.',
      whatToDo:
        'Move valuable items, documents, and appliances to upper floors. Keep vehicles parked on higher ground and be prepared to evacuate if instructed.',
      audioText:
        'Flash Flood Warning for Budameru Canal. Water levels are rising near Ajit Singh Nagar and Ambapuram. Move valuables to higher floors and stay alert for evacuation notices.',
      actionText: 'Find Nearest Safe Shelter',
      actionRoute: '/citizen/shelters',
    },
    {
      id: 'alert-bridge',
      category: ['all', 'road'],
      urgency: 'medium',
      badge: 'Road Closed',
      badgeBg: 'bg-[#1e293b] border border-[#00d4ff]/40',
      badgeText: 'text-[#00d4ff]',
      title: 'Eluru Canal Old Bridge Closed to All Traffic',
      timeAgo: '45 mins ago',
      affectedAreas: 'Old Police Station Road & Canal Bank East',
      whatHappened:
        'The old bridge across Eluru Canal is temporarily closed for safety checks due to high water current.',
      whatToDo:
        'Do not attempt to cross this bridge by foot or vehicle. Use the Benz Circle Elevated Flyover instead — it is completely clear and open.',
      audioText:
        'Traffic advisory: Eluru Canal Old Bridge is closed for safety. Please use Benz Circle elevated flyover as a safe diversion.',
      actionText: 'Check Safe Road Map',
      actionRoute: '/citizen/safe-route',
    },
    {
      id: 'alert-water',
      category: ['all', 'water'],
      urgency: 'info',
      badge: 'Clean Water Notice',
      badgeBg: 'bg-[#064e3b] border border-[#4ae183]/40',
      badgeText: 'text-[#dcfce7]',
      title: 'Free Clean Drinking Water Tankers Deployed',
      timeAgo: '1 hour ago',
      affectedAreas: 'Wards 11, 12, 13, 14, 15 & 16',
      whatHappened:
        'Tap water pipelines in 6 flooded wards have been paused as a safety precaution to avoid contamination. 40 fresh drinking water tankers are stationed across these wards.',
      whatToDo:
        'Collect free purified drinking water from tankers parked at local government school grounds and ward secretariats. Boil all drinking water before use.',
      audioText:
        'Drinking water update: Municipal tap water is paused in wards 11 through 16 to ensure safety. Free clean water tankers are stationed at government schools.',
    },
  ];

  const filteredAlerts = alerts.filter((alert) => alert.category.includes(activeFilter));

  return (
    <main className="w-full pt-20 bg-[#091422] min-h-[calc(100vh-80px)] text-[#d8e3f7]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Page Title & Emergency Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#3c494e]/30">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab] animate-ping" />
              <span className="text-xs font-bold text-[#ffb4ab] uppercase tracking-wider">
                Official Live Notices
              </span>
              <span className="text-xs text-[#859398]">•</span>
              <span className="text-xs text-[#bbc9cf]">NTR District Disaster Management</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-[#d8e3f7]">
              Flood Alerts &amp; Safety Notices
            </h1>
            <p className="text-xs sm:text-sm text-[#bbc9cf]">
              Clear, verified updates so you know exactly what is happening and what action to take.
            </p>
          </div>

          <a
            href="tel:08662577777"
            className="self-start md:self-center px-4 py-2.5 rounded-xl bg-[#202b39] text-[#4ae183] text-xs font-bold flex items-center gap-2 hover:bg-[#2f3a49] border border-[#4ae183]/30 transition-colors shadow-sm"
          >
            <Phone className="w-4 h-4" />
            <span>Control Room: 0866-2577777</span>
          </a>
        </div>

        {/* Big At-A-Glance Threat Summary Card */}
        <div className="rounded-2xl bg-gradient-to-b from-[#93000a]/25 via-[#16202f] to-[#16202f] p-5 sm:p-6 border border-[#ffb4ab]/40 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#ffb4ab] text-[#690005] flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#ffb4ab] uppercase tracking-wide block">
                  Current Status Summary
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#d8e3f7]">
                  Red Alert: Floodwater rising in low-lying riverside areas
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/citizen/safe-route')}
              className="px-4 py-2 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-xs hover:bg-[#3cd7ff] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Safe Evacuation Map</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[#091422] border border-[#ffb4ab]/30 flex flex-col gap-1">
              <span className="text-[#ffb4ab] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
                Evacuate Immediately
              </span>
              <p className="text-[#d8e3f7] font-semibold">
                Ranigarithota, Tarapet, Krishnalanka
              </p>
              <span className="text-[11px] text-[#bbc9cf]">Move to Municipal Community Hall</span>
            </div>

            <div className="p-3 rounded-xl bg-[#091422] border border-[#f59e0b]/30 flex flex-col gap-1">
              <span className="text-[#f59e0b] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                Be on High Alert
              </span>
              <p className="text-[#d8e3f7] font-semibold">
                Ajit Singh Nagar &amp; Ambapuram
              </p>
              <span className="text-[11px] text-[#bbc9cf]">Shift valuables to upper floors</span>
            </div>

            <div className="p-3 rounded-xl bg-[#091422] border border-[#4ae183]/30 flex flex-col gap-1">
              <span className="text-[#4ae183] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4ae183]" />
                Safe Open Route
              </span>
              <p className="text-[#d8e3f7] font-semibold">
                Benz Circle Elevated Flyover
              </p>
              <span className="text-[11px] text-[#bbc9cf]">100% dry and open for traffic</span>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#00d4ff] text-[#003642] shadow-md'
                : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            All Notices ({alerts.length})
          </button>
          <button
            onClick={() => setActiveFilter('evac')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'evac'
                ? 'bg-[#93000a] text-[#ffdad7] shadow-md'
                : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Evacuation Orders (1)
          </button>
          <button
            onClick={() => setActiveFilter('flood')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'flood'
                ? 'bg-[#f59e0b] text-[#1c1917] shadow-md'
                : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Flood Warnings (1)
          </button>
          <button
            onClick={() => setActiveFilter('road')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'road'
                ? 'bg-[#00d4ff] text-[#003642] shadow-md'
                : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Road Closures (1)
          </button>
          <button
            onClick={() => setActiveFilter('water')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === 'water'
                ? 'bg-[#4ae183] text-[#00431f] shadow-md'
                : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
            }`}
          >
            Drinking Water (1)
          </button>
        </div>

        {/* Clear Alerts List */}
        <div className="flex flex-col gap-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-2xl bg-[#16202f] p-5 sm:p-6 border border-[#3c494e]/30 shadow-lg flex flex-col gap-4 hover:border-[#00d4ff]/40 transition-colors"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${alert.badgeBg} ${alert.badgeText}`}
                  >
                    {alert.badge}
                  </span>
                  <span className="text-xs text-[#859398] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {alert.timeAgo}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl font-bold text-[#d8e3f7] leading-snug">
                {alert.title}
              </h2>

              {/* 3 Simple Question-Answer Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#091422] border border-[#3c494e]/20 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[#859398] font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#00d4ff]" />
                    Where
                  </span>
                  <span className="text-[#d8e3f7] font-bold leading-relaxed">
                    {alert.affectedAreas}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[#859398] font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-[#f59e0b]" />
                    What Happened
                  </span>
                  <span className="text-[#bbc9cf] leading-relaxed">
                    {alert.whatHappened}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[#859398] font-semibold uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#4ae183]" />
                    What You Should Do
                  </span>
                  <span className="text-[#4ae183] font-semibold leading-relaxed">
                    {alert.whatToDo}
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#202b39]">
                <button
                  onClick={() => handleToggleAudio(alert.id, alert.audioText)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#202b39] text-[#d8e3f7] hover:bg-[#2f3a49] text-xs font-semibold transition-colors cursor-pointer border border-[#3c494e]/30"
                >
                  {playingAudioId === alert.id ? (
                    <>
                      <VolumeX className="w-4 h-4 text-[#ffb4ab]" />
                      <span className="text-[#ffb4ab] font-bold">Stop Voice Alert</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-[#00d4ff]" />
                      <span>Listen to Voice Notice</span>
                    </>
                  )}
                </button>

                {alert.actionRoute && alert.actionText && (
                  <button
                    onClick={() => router.push(alert.actionRoute!)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-xs hover:bg-[#3cd7ff] transition-all shadow-md cursor-pointer ml-auto"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{alert.actionText}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Simple Rules for Citizen Safety */}
        <div className="rounded-2xl bg-[#16202f] p-6 border border-[#3c494e]/30 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4ae183]" />
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#d8e3f7]">
              Simple Flood Safety Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex gap-3 items-start p-3 rounded-xl bg-[#091422] border border-[#3c494e]/20">
              <span className="w-6 h-6 rounded-full bg-[#93000a]/50 text-[#ffb4ab] flex items-center justify-center font-bold shrink-0">
                1
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[#d8e3f7]">Never Walk in Moving Water</span>
                <p className="text-[#bbc9cf] leading-relaxed">
                  Just 6 inches of rapid water can knock an adult off their feet. Always seek higher ground.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-[#091422] border border-[#3c494e]/20">
              <span className="w-6 h-6 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] flex items-center justify-center font-bold shrink-0">
                2
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[#d8e3f7]">Head to Official Shelters</span>
                <p className="text-[#bbc9cf] leading-relaxed">
                  Designated relief centers provide warm dry beds, hot meals, drinking water, and doctors for free.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-3 rounded-xl bg-[#091422] border border-[#3c494e]/20">
              <span className="w-6 h-6 rounded-full bg-[#4ae183]/20 text-[#4ae183] flex items-center justify-center font-bold shrink-0">
                3
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[#d8e3f7]">Dial 112 for Boat Rescue</span>
                <p className="text-[#bbc9cf] leading-relaxed">
                  If floodwater enters your home or you cannot leave safely, call 112 for NDRF raft teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Emergency Telephone Directory */}
        <div className="rounded-2xl bg-[#16202f] p-6 border border-[#3c494e]/30 shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#d8e3f7]">
              Emergency Helplines (Tap to Call)
            </span>
            <span className="text-xs text-[#4ae183] font-semibold">Toll-Free • 24/7 Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <a
              href="tel:112"
              className="p-3.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#ffb4ab]/30 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-[#ffb4ab] font-['Plus_Jakarta_Sans']">
                  112
                </span>
                <Phone className="w-4 h-4 text-[#ffb4ab]" />
              </div>
              <span className="text-xs font-semibold text-[#d8e3f7]">Disaster &amp; Police Rescue</span>
              <span className="text-[11px] text-[#bbc9cf]">NDRF / SDRF Boat Teams</span>
            </a>

            <a
              href="tel:108"
              className="p-3.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#00d4ff]/30 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-[#00d4ff] font-['Plus_Jakarta_Sans']">
                  108
                </span>
                <Phone className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <span className="text-xs font-semibold text-[#d8e3f7]">Free Medical Ambulance</span>
              <span className="text-[11px] text-[#bbc9cf]">Emergency medical intake</span>
            </a>

            <a
              href="tel:1070"
              className="p-3.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#4ae183]/30 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-[#4ae183] font-['Plus_Jakarta_Sans']">
                  1070
                </span>
                <Phone className="w-4 h-4 text-[#4ae183]" />
              </div>
              <span className="text-xs font-semibold text-[#d8e3f7]">State Disaster Authority</span>
              <span className="text-[11px] text-[#bbc9cf]">APSDMA Command Center</span>
            </a>

            <a
              href="tel:08662577777"
              className="p-3.5 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#3c494e]/40 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[#d8e3f7] font-['Plus_Jakarta_Sans']">
                  0866-2577777
                </span>
                <Phone className="w-4 h-4 text-[#00d4ff]" />
              </div>
              <span className="text-xs font-semibold text-[#d8e3f7]">NTR District Control Room</span>
              <span className="text-[11px] text-[#bbc9cf]">Vijayawada Collectorate EOC</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};
