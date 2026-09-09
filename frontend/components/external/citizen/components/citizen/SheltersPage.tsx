import React, { useState } from 'react';
import { useRouter } from '../../lib/router';
import { LeafletEvacMap } from './LeafletEvacMap';
import {
  Search,
  CheckCircle,
  MapPin,
  Utensils,
  Droplets,
  Zap,
  Activity,
  Accessibility,
  HeartHandshake,
  Shield,
  Phone,
  Navigation,
  Baby,
  Package,
  Wifi,
  Truck,
  HelpCircle,
  X,
  Footprints,
  Clock,
  ArrowRight,
  PawPrint,
} from 'lucide-react';

interface ShelterItem {
  id: string;
  name: string;
  subTitle: string;
  location: string;
  distance: string;
  distanceKm: number;
  availableBeds: string;
  occupiedPercent: number;
  openPercent: number;
  walkTime: string;
  phone: string;
  tags: string[];
  amenities: { icon: React.ReactNode; label: string }[];
  category: string[];
}

export const SheltersPage: React.FC = () => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'nearest' | 'medical' | 'pet' | 'accessible'>('all');

  // Route Drawer state
  const [activeDrawer, setActiveDrawer] = useState<{
    name: string;
    distance: string;
    time: string;
  } | null>(null);

  // Special transport van request state
  const [vanRequested, setVanRequested] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [passengerCount, setPassengerCount] = useState('1');

  const shelters: ShelterItem[] = [
    {
      id: 'municipal-hall',
      name: 'Municipal Community Hall',
      subTitle: 'Primary Relief Node',
      location: 'MG Road Sector 4 • 0.8 km from Benz Circle',
      distance: '0.8 km',
      distanceKm: 0.8,
      availableBeds: '420',
      occupiedPercent: 65,
      openPercent: 52,
      walkTime: '12 min brisk walk • Elevation +14m above road',
      phone: '08662459910',
      tags: ['High Ground Safe', 'Primary Relief Node'],
      category: ['nearest', 'medical', 'accessible'],
      amenities: [
        { icon: <Utensils className="w-4 h-4 text-[#4ae183]" />, label: 'Hot Meals' },
        { icon: <Droplets className="w-4 h-4 text-[#00d4ff]" />, label: 'Clean Water' },
        { icon: <Zap className="w-4 h-4 text-[#6bfe9c]" />, label: 'Power & Charging' },
        { icon: <Activity className="w-4 h-4 text-[#ffb4ab]" />, label: 'Paramedic Station' },
        { icon: <Accessibility className="w-4 h-4 text-[#00d4ff]" />, label: 'Ramps Ready' },
      ],
    },
    {
      id: 'high-school',
      name: 'Government High School Multi-Wing',
      subTitle: '3-Storey Facility',
      location: 'Patamata High School Road • 1.9 km away',
      distance: '1.9 km',
      distanceKm: 1.9,
      availableBeds: '310',
      occupiedPercent: 40,
      openPercent: 60,
      walkTime: '24 min walk • Flood barrier wall perimeter',
      phone: '08662478832',
      tags: ['High Ground Safe', '3-Storey Facility'],
      category: ['pet', 'accessible'],
      amenities: [
        { icon: <PawPrint className="w-4 h-4 text-[#4ae183]" />, label: 'Pet-Friendly Wing (Sheltered)' },
        { icon: <Zap className="w-4 h-4 text-[#00d4ff]" />, label: 'Generator Online (24h Fuel)' },
        { icon: <Shield className="w-4 h-4 text-[#6bfe9c]" />, label: 'Sanitation Units (Female/Male)' },
        { icon: <Shield className="w-4 h-4 text-[#859398]" />, label: 'Civil Guard Stationed' },
      ],
    },
    {
      id: 'mylavaram-hall',
      name: 'Mylavaram Community Center',
      subTitle: 'Maternal Care Unit',
      location: 'Ring Road Bypass Junction • 3.4 km away',
      distance: '3.4 km',
      distanceKm: 3.4,
      availableBeds: '220+',
      occupiedPercent: 78,
      openPercent: 22,
      walkTime: '8 min via Elevated Flyover • Roadway dry',
      phone: '08662589012',
      tags: ['Operational', 'Maternal Care Unit'],
      category: ['medical'],
      amenities: [
        { icon: <Baby className="w-4 h-4 text-[#4ae183]" />, label: 'Infant Care & Milk Powder' },
        { icon: <Package className="w-4 h-4 text-[#00d4ff]" />, label: 'Dry Rations Distribution' },
        { icon: <Activity className="w-4 h-4 text-[#ffb4ab]" />, label: 'First-Aid Post' },
        { icon: <Wifi className="w-4 h-4 text-[#00d4ff]" />, label: 'Satellite Mesh Wi-Fi' },
      ],
    },
  ];

  const filteredShelters = shelters.filter((shelter) => {
    const matchesCategory =
      currentFilter === 'all' ||
      (currentFilter === 'nearest' && shelter.distanceKm <= 1.0) ||
      shelter.category.includes(currentFilter);

    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      shelter.name.toLowerCase().includes(term) ||
      shelter.location.toLowerCase().includes(term) ||
      shelter.amenities.some((a) => a.label.toLowerCase().includes(term));

    return matchesCategory && matchesSearch;
  });

  const handleRequestVan = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setVanRequested(true);
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance('Assisted evacuation van dispatched. ETA 7 minutes.');
        window.speechSynthesis.speak(msg);
      }
    }, 1200);
  };

  return (
    <main className="w-full pt-20 bg-[#091422] min-h-[calc(100vh-80px)] text-[#d8e3f7]">
      <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12 py-6">
        {/* Ambient Backdrop Lighting Elements */}
        <div className="absolute top-12 left-1/4 w-96 h-96 rounded-full bg-[#00d4ff]/10 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-10 w-80 h-80 rounded-full bg-[#06bb63]/10 blur-3xl pointer-events-none -z-10" />

        {/* Live Status Top Alert Bar */}
        <div className="w-full mb-6 rounded-xl bg-[#202b39] p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 border border-[#3c494e]/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#4ae183]/15 text-[#4ae183] shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#d8e3f7]">
                  3 Safe Shelters Operational in NTR District
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#06bb63] text-[#00431f] text-[10px] font-bold uppercase tracking-wide">
                  Real-Time Sync
                </span>
              </div>
              <p className="text-xs text-[#bbc9cf] mt-0.5">
                District Emergency Control Room verified 4 minutes ago. Continuous water &amp; generator supply confirmed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#bbc9cf]">My Location:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b3545] text-[#3cd7ff] text-xs font-semibold border border-[#3c494e]/30">
              <MapPin className="w-3.5 h-3.5 text-[#00d4ff]" />
              Benz Circle, Vijayawada
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#859398] w-4 h-4" />
            <input
              type="text"
              id="shelterSearch"
              placeholder="Filter shelters by name, locality, supplies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 h-12 rounded-xl bg-[#111c2a] text-[#d8e3f7] placeholder:text-[#859398] text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff] border border-[#3c494e]/30 shadow-inner"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1" id="filterPillGroup">
            <button
              onClick={() => setCurrentFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentFilter === 'all'
                  ? 'bg-[#a8e8ff] text-[#003642] shadow-md'
                  : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
              }`}
            >
              All Shelters (3)
            </button>
            <button
              onClick={() => setCurrentFilter('nearest')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentFilter === 'nearest'
                  ? 'bg-[#a8e8ff] text-[#003642] shadow-md'
                  : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
              }`}
            >
              Nearest (&lt; 1km)
            </button>
            <button
              onClick={() => setCurrentFilter('medical')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                currentFilter === 'medical'
                  ? 'bg-[#a8e8ff] text-[#003642] shadow-md'
                  : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#ffb4ab]" />
              <span>Medical Support</span>
            </button>
            <button
              onClick={() => setCurrentFilter('pet')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                currentFilter === 'pet'
                  ? 'bg-[#a8e8ff] text-[#003642] shadow-md'
                  : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
              }`}
            >
              <PawPrint className="w-3.5 h-3.5 text-[#4ae183]" />
              <span>Pet Friendly</span>
            </button>
            <button
              onClick={() => setCurrentFilter('accessible')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                currentFilter === 'accessible'
                  ? 'bg-[#a8e8ff] text-[#003642] shadow-md'
                  : 'bg-[#16202f] text-[#bbc9cf] hover:text-[#d8e3f7] hover:bg-[#202b39]'
              }`}
            >
              <Accessibility className="w-3.5 h-3.5 text-[#00d4ff]" />
              <span>Accessible Ramps</span>
            </button>
          </div>
        </div>

        {/* Split View Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Verified Shelters List (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4" id="sheltersFeed">
            {filteredShelters.map((shelter) => (
              <div
                key={shelter.id}
                className="group relative rounded-2xl bg-[#16202f] p-6 shadow-xl hover:bg-[#202b39] transition-all flex flex-col gap-4 border border-[#3c494e]/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#06bb63]/20 text-[#4ae183] text-xs font-bold uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ae183] animate-ping" />
                        {shelter.tags[0]}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#2f3a49] text-[#bbc9cf] text-xs font-semibold">
                        {shelter.tags[1]}
                      </span>
                    </div>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#d8e3f7] group-hover:text-[#00d4ff] transition-colors mt-0.5">
                      {shelter.name}
                    </h2>
                    <p className="text-xs text-[#bbc9cf] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#859398]" />
                      <span>{shelter.location}</span>
                    </p>
                  </div>

                  {/* Capacity Gauge */}
                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#4ae183]">
                      {shelter.availableBeds}
                    </span>
                    <span className="text-[11px] text-[#bbc9cf] font-semibold">Beds Available</span>
                    <span className="text-[10px] text-[#859398]">{shelter.occupiedPercent}% Capacity</span>
                  </div>
                </div>

                {/* Capacity Visual Progress Bar */}
                <div className="w-full bg-[#040f1c] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#4ae183] h-full rounded-full transition-all duration-500"
                    style={{ width: `${shelter.openPercent}%` }}
                  />
                </div>

                {/* Amenities Chip Badges */}
                <div className="flex flex-wrap gap-2">
                  {shelter.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#040f1c] text-[#d8e3f7] text-xs font-semibold border border-[#3c494e]/20"
                    >
                      {amenity.icon}
                      <span>{amenity.label}</span>
                    </div>
                  ))}
                </div>

                {/* Estimated Walk and Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-[#202b39]">
                  <div className="flex items-center gap-2 text-[#bbc9cf] text-xs">
                    <Footprints className="w-4 h-4 text-[#4ae183]" />
                    <span>{shelter.walkTime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${shelter.phone}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl bg-[#2b3545] text-[#d8e3f7] hover:bg-[#2f3a49] transition-colors text-xs font-bold border border-[#3c494e]/30"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#00d4ff]" />
                      <span>Call Desk</span>
                    </a>

                    <button
                      onClick={() =>
                        setActiveDrawer({
                          name: shelter.name,
                          distance: shelter.distance,
                          time: shelter.walkTime.split('•')[0],
                        })
                      }
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-xs shadow-lg hover:bg-[#3cd7ff] active:scale-95 transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Safe Route</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* No Results Fallback */}
            {filteredShelters.length === 0 && (
              <div className="p-8 rounded-2xl bg-[#16202f] text-center flex flex-col items-center justify-center gap-3 border border-[#3c494e]/30">
                <HelpCircle className="w-12 h-12 text-[#859398]" />
                <p className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#d8e3f7]">
                  No shelters match this specific filter.
                </p>
                <p className="text-xs text-[#bbc9cf] max-w-md">
                  Switch filter or contact emergency helpline 112 for direct dispatch assistance.
                </p>
                <button
                  className="px-4 py-2 rounded-lg bg-[#a8e8ff] text-[#003642] text-xs font-bold cursor-pointer hover:bg-[#b4ebff]"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentFilter('all');
                  }}
                >
                  View All Operational Shelters
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Map & Special Assistance Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 sticky top-24">
            {/* Live High Ground Shelters Map View */}
            <div className="rounded-2xl bg-[#16202f] overflow-hidden shadow-2xl border border-[#3c494e]/30 flex flex-col">
              <div className="p-4 bg-[#202b39] flex items-center justify-between border-b border-[#3c494e]/30">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#00d4ff]" />
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7]">
                    Safe Elevation Map
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#4ae183] bg-[#4ae183]/15 px-2.5 py-1 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ae183]" />
                  Water Levels Clear
                </span>
              </div>

              {/* Map Surface */}
              <div className="relative w-full h-72 bg-[#040f1c]">
                <LeafletEvacMap
                  className="w-full h-full"
                  zoomLevel={13}
                  onMarkerClick={(name) => {
                    const found = shelters.find((s) => s.name.includes(name));
                    if (found) {
                      setActiveDrawer({
                        name: found.name,
                        distance: found.distance,
                        time: found.walkTime.split('•')[0],
                      });
                    }
                  }}
                />
              </div>

              {/* Quick Map Key */}
              <div className="p-3 bg-[#111c2a] flex items-center justify-between text-[#bbc9cf] text-xs border-t border-[#3c494e]/20">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" /> My Location
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4ae183]" /> High Ground (&gt; +10m)
                </span>
                <span className="text-[#3cd7ff] font-semibold">Updated Live</span>
              </div>
            </div>

            {/* SPECIAL ASSISTANCE CARD (Elderly / Mobility-Impaired) */}
            <div className="rounded-2xl bg-[#202b39] p-6 shadow-xl relative overflow-hidden flex flex-col gap-4 border border-[#3c494e]/40">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2f3a49] flex items-center justify-center text-[#00d4ff] shrink-0 border border-[#3c494e]/30">
                  <Accessibility className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#d8e3f7]">
                      Special Evacuation Transport
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad7] text-[10px] uppercase font-bold">
                      Priority
                    </span>
                  </div>
                  <p className="text-xs text-[#bbc9cf] leading-relaxed">
                    Wheelchair-equipped civic vans &amp; paramedic escort for elderly, disabled, or bedridden citizens.
                  </p>
                </div>
              </div>

              {/* Transport Quick Booking Form */}
              <div className="flex flex-col gap-3 pt-1">
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-[#040f1c] text-[#d8e3f7] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00d4ff] border border-[#3c494e]/30"
                >
                  <option value="1">1 Person (Wheelchair Needed)</option>
                  <option value="2">2 Persons (Senior Citizen)</option>
                  <option value="group">3+ Persons (Assisted Medical)</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="vanRequestBtn"
                    onClick={handleRequestVan}
                    disabled={isDispatching || vanRequested}
                    className={`h-12 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      vanRequested
                        ? 'bg-[#06bb63] text-[#00431f]'
                        : 'bg-[#00d4ff] text-[#003642] hover:bg-[#3cd7ff]'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {isDispatching
                        ? 'Dispatching Unit...'
                        : vanRequested
                        ? 'Van En Route'
                        : 'Request Evac Van'}
                    </span>
                  </button>

                  <a
                    href="tel:1077"
                    className="h-12 rounded-xl bg-[#2f3a49] hover:bg-[#3c494e] text-[#6bfe9c] font-['Plus_Jakarta_Sans'] font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-[#3c494e]/30 shadow-inner"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Dial 1077 Van Desk</span>
                  </a>
                </div>
              </div>

              {vanRequested && (
                <div className="p-3 rounded-xl bg-[#06bb63]/20 border border-[#06bb63]/40 text-[#4ae183] text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Evacuation Van dispatched! Unit #EV-04 en route to Benz Circle (ETA: 7 mins).
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-[#859398] text-[11px] pt-1">
                <span>Free Public Service by District Disaster Authority</span>
                <span>Response Time: ~10 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROUTING & NAVIGATION SLIDE DRAWER */}
      {activeDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-[#040f1c]/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setActiveDrawer(null)}
          />

          <div className="relative w-full max-w-md h-full bg-[#202b39] shadow-2xl p-6 flex flex-col justify-between overflow-y-auto z-10 border-l border-[#3c494e]/40">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#06bb63]/20 text-[#4ae183] text-xs font-bold uppercase inline-block w-max">
                    Active Live Route
                  </span>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-[#d8e3f7] mt-1">
                    {activeDrawer.name}
                  </h3>
                  <p className="text-xs text-[#3cd7ff]">
                    {activeDrawer.distance} • {activeDrawer.time} • NTR High Elevation Pathway
                  </p>
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-[#2b3545] text-[#d8e3f7] flex items-center justify-center hover:bg-[#3c494e] cursor-pointer"
                  onClick={() => setActiveDrawer(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Safe Elevation Verification */}
              <div className="p-3 rounded-xl bg-[#16202f] flex items-center gap-3 border border-[#3c494e]/30">
                <CheckCircle className="w-6 h-6 text-[#4ae183] shrink-0" />
                <div>
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#d8e3f7]">
                    Route 100% Flood-Clear
                  </span>
                  <p className="text-xs text-[#bbc9cf]">
                    Continuous high-ground sidewalk along MG road.
                  </p>
                </div>
              </div>

              {/* Turn-by-turn Waypoints */}
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-xs font-bold text-[#bbc9cf] uppercase tracking-wider">
                  Turn-by-Turn Waypoints
                </span>

                <div className="relative flex flex-col gap-4 pl-3">
                  <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-[#00d4ff]/40" />

                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#d8e3f7]">Start from Benz Circle</p>
                      <p className="text-xs text-[#bbc9cf]">
                        Head East on Elevated Service Road toward MG Road.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-[#00d4ff] text-[#003642] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#d8e3f7]">
                        Turn Left at High School Junction
                      </p>
                      <p className="text-xs text-[#bbc9cf]">
                        Stay on raised pedestrian pathway. Water diversion barricades active.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-[#4ae183] text-[#003919] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#4ae183]">
                        Arrive at Main Shelter Gate
                      </p>
                      <p className="text-xs text-[#bbc9cf]">
                        Registration volunteers stationed at reception tent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <div className="flex flex-col gap-2 pt-6 border-t border-[#3c494e]/30">
              <button
                className="w-full h-13 rounded-xl bg-[#00d4ff] text-[#003642] font-['Plus_Jakarta_Sans'] font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-[#3cd7ff] cursor-pointer"
                onClick={() => {
                  setActiveDrawer(null);
                  router.push('/citizen/safe-route');
                }}
              >
                <Navigation className="w-4 h-4" />
                <span>Open in Evacuation Route View</span>
              </button>

              <button
                className="w-full h-11 rounded-xl bg-[#16202f] text-[#d8e3f7] hover:bg-[#202b39] text-xs font-semibold cursor-pointer"
                onClick={() => setActiveDrawer(null)}
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
