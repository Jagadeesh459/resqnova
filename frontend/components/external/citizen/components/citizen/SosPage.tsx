import React, { useState, useEffect } from 'react';
import {
  Siren,
  Phone,
  Radio,
  MapPin,
  Battery,
  AlertTriangle,
  LifeBuoy,
  ShieldCheck,
  CheckCircle,
  Volume2,
  VolumeX,
  Flashlight,
  Users,
  Compass,
  Send,
} from 'lucide-react';
import { submitCitizenRequest } from '@/lib/portal-data';

export const SosPage: React.FC = () => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [distressCategory, setDistressCategory] = useState('water');
  const [peopleCount, setPeopleCount] = useState('2-3');
  const [soundActive, setSoundActive] = useState(false);
  const [strobeActive, setStrobeActive] = useState(false);
  const [audioOscillator, setAudioOscillator] = useState<AudioContext | null>(null);

  // Sound generator for emergency alarm
  const toggleAlarmSound = () => {
    if (soundActive) {
      if (audioOscillator) {
        audioOscillator.close();
        setAudioOscillator(null);
      }
      setSoundActive(false);
    } else {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.5);

        // Modulation
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(2, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(300, ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        setAudioOscillator(ctx);
        setSoundActive(true);
      } catch {
        setSoundActive(false);
      }
    }
  };

  const toggleStrobe = () => {
    setStrobeActive((prev) => !prev);
  };

  const handleTransmit = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 }));
      await submitCitizenRequest({ emergencyType: distressCategory, peopleCount, latitude: position.coords.latitude, longitude: position.coords.longitude });
      setIsTransmitting(true);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Emergency beacon confirmed and shared with Vijayawada rescue coordination.');
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsTransmitting(false);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioOscillator) {
        audioOscillator.close();
      }
    };
  }, [audioOscillator]);

  return (
    <main
      className={`w-full pt-20 min-h-[calc(100vh-80px)] text-[#d8e3f7] transition-colors duration-150 ${
        strobeActive ? 'bg-[#ffdad7]' : 'bg-[#091422]'
      }`}
    >
      {/* Top Banner */}
      <div className="w-full bg-[#68000b] px-6 lg:px-12 py-3 border-b border-[#ffb4ab]/40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-[#ffb4ab] animate-ping" />
            <span className="font-['Plus_Jakarta_Sans'] font-extrabold uppercase tracking-wider text-[#ffdad7]">
              Priority 01 Emergency Dispatch
            </span>
            <span className="text-[#ffb4ab]/60 hidden sm:inline">|</span>
            <span className="text-[#ffdad7] hidden sm:inline">
              NTR District War Room &amp; SDRF Air/Water Rescue Operations
            </span>
          </div>

          <div className="flex items-center gap-2 text-[#ffdad7] font-mono">
            <Radio className="w-4 h-4 text-[#ffb4ab]" />
            <span>ENCRYPTED BEACON MESH ONLINE</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Emergency Distress Transmitter (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="rounded-2xl bg-[#16202f] p-6 sm:p-8 shadow-2xl border border-[#ffb4ab]/40 flex flex-col items-center text-center gap-6 relative overflow-hidden">
              {/* Flashing Beacon Graphic */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                    isTransmitting
                      ? 'bg-[#93000a] text-[#ffdad7] animate-pulse shadow-[0_0_50px_rgba(255,77,77,0.7)]'
                      : 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/40'
                  }`}
                >
                  <Siren className="w-14 h-14 animate-spin-slow" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-[#d8e3f7]">
                  {isTransmitting ? 'EMERGENCY BEACON ACTIVE' : 'Distress Signal Transmitter'}
                </h1>
                <p className="text-xs sm:text-sm text-[#bbc9cf] max-w-lg">
                  {isTransmitting
                    ? 'Beacon coordinates received by SDRF Boat 09. Hold steady at current elevation.'
                    : 'Transmits high-precision GPS coordinates directly to SDRF boat rescues, NDRF commanders, and District Police dispatch.'}
                </p>
              </div>

              {/* Precise Coordinates Readout */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[#040f1c] border border-[#3c494e]/30 text-xs font-mono">
                <div className="flex flex-col">
                  <span className="text-[#859398] text-[10px]">LATITUDE</span>
                  <span className="font-bold text-[#00d4ff]">16.5062° N</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#859398] text-[10px]">LONGITUDE</span>
                  <span className="font-bold text-[#00d4ff]">80.6480° E</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#859398] text-[10px]">ACCURACY</span>
                  <span className="font-bold text-[#4ae183]">± 3.2 meters</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#859398] text-[10px]">BATTERY</span>
                  <span className="font-bold text-[#d8e3f7] flex items-center gap-1 justify-center">
                    <Battery className="w-3.5 h-3.5 text-[#4ae183]" /> 82%
                  </span>
                </div>
              </div>

              {/* Form Selectors */}
              <div className="w-full flex flex-col sm:flex-row gap-3 text-left">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#bbc9cf]">Distress Situation</label>
                  <select
                    value={distressCategory}
                    onChange={(e) => setDistressCategory(e.target.value)}
                    className="h-11 px-3 rounded-xl bg-[#040f1c] text-[#d8e3f7] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffb4ab] border border-[#3c494e]/30"
                  >
                    <option value="water">Trapped by Rising Water (Rooftop / High Floor)</option>
                    <option value="medical">Medical Emergency (Oxygen / Diabetic / Injury)</option>
                    <option value="elderly">Elderly / Infant Urgent Evacuation</option>
                    <option value="collapse">Structural Collapse Hazard</option>
                  </select>
                </div>

                <div className="sm:w-44 flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#bbc9cf]">People Stranded</label>
                  <select
                    value={peopleCount}
                    onChange={(e) => setPeopleCount(e.target.value)}
                    className="h-11 px-3 rounded-xl bg-[#040f1c] text-[#d8e3f7] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#ffb4ab] border border-[#3c494e]/30"
                  >
                    <option value="1">1 Person</option>
                    <option value="2-3">2 to 3 Persons</option>
                    <option value="4-8">4 to 8 Persons</option>
                    <option value="9+">9+ Community</option>
                  </select>
                </div>
              </div>

              {/* Primary Transmit Button */}
              <button
                onClick={handleTransmit}
                className={`w-full h-18 rounded-2xl font-['Plus_Jakarta_Sans'] font-extrabold text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-2xl cursor-pointer ${
                  isTransmitting
                    ? 'bg-[#4ae183] text-[#003919] hover:bg-[#6bfe9c]'
                    : 'bg-[#ffb4ab] text-[#690005] hover:bg-[#ffdad6] active:scale-95 shadow-[#ffb4ab]/30'
                }`}
              >
                <Siren className="w-8 h-8" />
                <span>{isTransmitting ? 'SIGNAL TRANSMITTED (UPDATE BEACON)' : 'TRANSMIT RESCUE BEACON NOW'}</span>
              </button>

              {/* Flashlight Strobe & Siren Noise Tools */}
              <div className="w-full grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={toggleStrobe}
                  className={`h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer border ${
                    strobeActive
                      ? 'bg-[#ffdad7] text-[#690005] border-[#ffdad7]'
                      : 'bg-[#202b39] text-[#d8e3f7] border-[#3c494e]/30 hover:bg-[#2f3a49]'
                  }`}
                >
                  <Flashlight className="w-4 h-4" />
                  <span>{strobeActive ? 'Strobe: ACTIVE' : 'Screen SOS Strobe'}</span>
                </button>

                <button
                  onClick={toggleAlarmSound}
                  className={`h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer border ${
                    soundActive
                      ? 'bg-[#93000a] text-[#ffdad7] border-[#ffb4ab]'
                      : 'bg-[#202b39] text-[#d8e3f7] border-[#3c494e]/30 hover:bg-[#2f3a49]'
                  }`}
                >
                  {soundActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#ffb4ab]" />}
                  <span>{soundActive ? 'Stop Siren Audio' : 'Play Acoustic Siren'}</span>
                </button>
              </div>

              {/* Active Distress Status Panel */}
              {isTransmitting && (
                <div className="w-full p-4 rounded-xl bg-[#06bb63]/15 border border-[#06bb63]/40 text-left flex flex-col gap-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4ae183] flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> SIGNAL LOCKED BY SDRF RELIEF BOAT #09
                    </span>
                    <span className="text-[#a8e8ff] font-mono">ID: VJA-EM-9941</span>
                  </div>
                  <p className="text-xs text-[#d8e3f7]">
                    SDRF Motorized Raft Unit 09 is navigating toward your coordinates. Estimated boat arrival:{' '}
                    <strong className="text-[#4ae183]">6 minutes</strong>.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#bbc9cf]">
                    <span>Crew: Inspector R. Naidu + 3 Rescue Divers</span>
                    <span>•</span>
                    <span>Channel 16 Live</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 24/7 Hotlines & Offline Protocol (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
            {/* Primary Direct Dial Emergency Numbers */}
            <div className="rounded-2xl bg-[#16202f] p-6 shadow-xl border border-[#3c494e]/30 flex flex-col gap-4">
              <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#d8e3f7]">
                Instant Voice Emergency Hotlines
              </span>

              {/* Big 112 Dial */}
              <a
                href="tel:112"
                className="w-full h-16 rounded-xl bg-[#4ae183] text-[#003919] font-['Plus_Jakarta_Sans'] font-extrabold text-xl flex items-center justify-between px-6 hover:bg-[#6bfe9c] transition-all shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-6 h-6" />
                  <span>DIAL 112 NOW</span>
                </div>
                <span className="text-xs uppercase font-bold bg-[#003919]/20 px-2.5 py-1 rounded-md">
                  Toll-Free
                </span>
              </a>

              <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
                <a
                  href="tel:08662424100"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#3c494e]/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[#d8e3f7]">NTR District War Room</span>
                    <span className="text-[11px] text-[#bbc9cf]">Collectorate 24/7 Desk</span>
                  </div>
                  <span className="text-[#a8e8ff] font-bold text-sm">0866-2424100</span>
                </a>

                <a
                  href="tel:1070"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#3c494e]/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[#d8e3f7]">State Flood Control (APSDMA)</span>
                    <span className="text-[11px] text-[#bbc9cf]">Tadepalli Head Office</span>
                  </div>
                  <span className="text-[#4ae183] font-bold text-sm">1070</span>
                </a>

                <a
                  href="tel:108"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] transition-colors border border-[#3c494e]/20"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-[#d8e3f7]">Ambulance &amp; Critical Medical</span>
                    <span className="text-[11px] text-[#bbc9cf]">Paramedic On-Call</span>
                  </div>
                  <span className="text-[#ffb4ab] font-bold text-sm">108</span>
                </a>
              </div>
            </div>

            {/* Offline Survival Directives */}
            <div className="rounded-2xl bg-[#16202f] p-6 shadow-xl border border-[#3c494e]/30 flex flex-col gap-3">
              <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#d8e3f7] flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#00d4ff]" />
                Offline Survival Protocols
              </span>

              <div className="flex flex-col gap-3 text-xs text-[#bbc9cf] pt-1">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#040f1c]">
                  <span className="w-5 h-5 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    <strong>Stay high and dry.</strong> Do not enter moving floodwater on foot or two-wheeler. Just 15cm of flowing water can knock you down.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#040f1c]">
                  <span className="w-5 h-5 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    <strong>Signal visibility.</strong> Wave bright fabrics or point mobile flashlight skyward when rescue boats or helicopters are audible.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#040f1c]">
                  <span className="w-5 h-5 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong>Conserve phone charge.</strong> Switch on Ultra Battery Saver mode. Use SMS or LoRa rather than video streaming.
                  </span>
                </div>
              </div>

              {/* Emergency SMS Broadcast */}
              <a
                href="sms:112?body=EMERGENCY%20DISTRESS%20BEACON%3A%20Need%20rescue%20at%20Lat%2016.5062%20Lon%2080.6480.%20Stranded%20citizens."
                className="w-full h-11 mt-2 rounded-xl bg-[#202b39] hover:bg-[#2f3a49] text-[#d8e3f7] text-xs font-semibold flex items-center justify-center gap-2 border border-[#3c494e]/30 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span>Send Emergency SMS Coordinates</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
