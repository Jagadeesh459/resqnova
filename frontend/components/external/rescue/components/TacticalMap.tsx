import React, { useState, useRef } from 'react';
import { Plus, Minus, Crosshair, RotateCw, Compass, AlertTriangle, Radio } from 'lucide-react';

interface TacticalMapProps {
  heading?: string;
  speed?: string;
  onWaypointClick?: (waypointName: string) => void;
  className?: string;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  heading = '042° NE',
  speed = '38 KM/H',
  onWaypointClick,
  className = '',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeLayer, setActiveLayer] = useState<{ hazard: boolean; grid: boolean; telemetry: boolean }>({
    hazard: true,
    grid: true,
    telemetry: true,
  });

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 1.8));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.7));
  };

  const handleRecenter = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      id="tactical-map-container"
      className={`relative w-full rounded-2xl overflow-hidden bg-[#06101c] border border-[#00b8e6]/25 select-none ${className}`}
      style={{ minHeight: '440px', height: '100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top HUD Telemetry Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-[#081524]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#00d4ff]/20 text-[11px] font-mono text-[#a8e8ff] shadow-lg">
        <Compass className="w-3.5 h-3.5 text-[#00D4FF] animate-spin-slow" />
        <span>HDG {heading}</span>
        <span className="text-[#3c5674]">•</span>
        <span className="text-white font-semibold">{speed}</span>
      </div>

      {/* Top Right Tactical Map Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-[#091726]/90 backdrop-blur-md p-1 rounded-xl border border-[#163654] shadow-xl">
        <button
          id="map-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d8e3f7] hover:text-[#00D4FF] hover:bg-[#0f2845] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          id="map-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d8e3f7] hover:text-[#00D4FF] hover:bg-[#0f2845] transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-[#152e4d]" />
        <button
          id="map-recenter"
          onClick={handleRecenter}
          title="Recenter Map"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d8e3f7] hover:text-[#00D4FF] hover:bg-[#0f2845] transition-colors cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          id="map-reset"
          onClick={handleRecenter}
          title="Reset Orientation"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#d8e3f7] hover:text-[#00D4FF] hover:bg-[#0f2845] transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vector Map Canvas */}
      <div
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-75"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full min-h-[440px] block"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Red Hazard Hatch Pattern */}
            <pattern
              id="hazardStripe"
              width="12"
              height="12"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="12" stroke="#ff4d4d" strokeWidth="1.5" strokeOpacity="0.25" />
            </pattern>

            {/* Glowing Route Filter */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Pin Glow Filter */}
            <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid Lines */}
          {activeLayer.grid && (
            <g opacity="0.25" stroke="#1c3755" strokeWidth="1">
              <line x1="100" y1="0" x2="100" y2="500" />
              <line x1="200" y1="0" x2="200" y2="500" />
              <line x1="300" y1="0" x2="300" y2="500" />
              <line x1="400" y1="0" x2="400" y2="500" />
              <line x1="500" y1="0" x2="500" y2="500" />
              <line x1="600" y1="0" x2="600" y2="500" />
              <line x1="700" y1="0" x2="700" y2="500" />

              <line x1="0" y1="80" x2="800" y2="80" />
              <line x1="0" y1="160" x2="800" y2="160" />
              <line x1="0" y1="240" x2="800" y2="240" />
              <line x1="0" y1="320" x2="800" y2="320" />
              <line x1="0" y1="400" x2="800" y2="400" />
            </g>
          )}

          {/* Water Canal / River Ribbon Flowing Across */}
          <path
            d="M -20 270 C 80 275, 140 285, 230 295 C 320 305, 420 275, 520 280 C 620 285, 720 270, 820 280 L 820 320 C 720 310, 620 325, 520 320 C 420 315, 320 345, 230 335 C 140 325, 80 315, -20 310 Z"
            fill="#0b243b"
            opacity="0.7"
          />
          <path
            d="M -20 270 C 80 275, 140 285, 230 295 C 320 305, 420 275, 520 280 C 620 285, 720 270, 820 280"
            stroke="#164366"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />

          {/* Secondary Road Network Lines */}
          <g stroke="#142c47" strokeWidth="2.5" opacity="0.6">
            <line x1="50" y1="160" x2="750" y2="160" />
            <line x1="50" y1="420" x2="750" y2="420" />
            <line x1="330" y1="50" x2="330" y2="450" />
            <line x1="680" y1="50" x2="680" y2="450" />
          </g>

          {/* Hazard Polygon: Canal Flood Surge Area */}
          {activeLayer.hazard && (
            <g id="hazard-flood-surge">
              {/* Red translucent fill with stripes */}
              <polygon
                points="250,175 350,170 380,245 365,275 270,265 250,220"
                fill="url(#hazardStripe)"
              />
              <polygon
                points="250,175 350,170 380,245 365,275 270,265 250,220"
                fill="#ff4d4d"
                fillOpacity="0.08"
                stroke="#ff4d4d"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Hazard Label Text */}
              <g transform="translate(305, 205)">
                <text
                  x="0"
                  y="0"
                  fill="#ff7575"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                  letterSpacing="0.08em"
                  textAnchor="middle"
                >
                  CANAL FLOOD SURGE
                </text>
                <text
                  x="0"
                  y="12"
                  fill="#ff4d4d"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="600"
                  letterSpacing="0.06em"
                  textAnchor="middle"
                >
                  DEP: +1.4m CRITICAL
                </text>
              </g>
            </g>
          )}

          {/* Route Line Underlay (Dark contrast) */}
          <path
            d="M 140 290 L 205 290 L 205 190 L 440 180"
            fill="none"
            stroke="#07192c"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Active Glowing Route Path */}
          <path
            d="M 140 290 L 205 290 L 205 190 L 440 180"
            fill="none"
            stroke="#00D4FF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#cyanGlow)"
          />

          {/* Road Segment Labels */}
          {/* Overpass tag */}
          <g transform="translate(185, 188)">
            <text
              x="0"
              y="0"
              fill="#7a9bb8"
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              letterSpacing="0.06em"
              textAnchor="end"
            >
              SERVICE OVERPASS
            </text>
          </g>

          {/* Turn tag */}
          <g transform="translate(215, 294)">
            <rect x="0" y="-8" width="68" height="12" rx="2" fill="#06121f" fillOpacity="0.85" />
            <text
              x="4"
              y="1"
              fill="#88b5d3"
              fontSize="7.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              letterSpacing="0.05em"
            >
              TURN: RIVER RD
            </text>
          </g>

          {/* Vehicle Position Marker (Cyan with pulsating ripple ring) */}
          <g id="vehicle-marker" transform="translate(140, 290)">
            {/* Animated Pulse Waves */}
            <circle r="14" fill="none" stroke="#00D4FF" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
            <circle r="10" fill="none" stroke="#00D4FF" strokeWidth="2" opacity="0.8" />
            {/* Vehicle Solid Node */}
            <circle r="5" fill="#00D4FF" />
            <circle r="2" fill="#FFFFFF" />
            {/* Heading vector line */}
            <line x1="0" y1="0" x2="16" y2="0" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Destination Waypoint Marker (Riverside High Gym) */}
          <g
            id="destination-marker"
            transform="translate(440, 180)"
            className="cursor-pointer"
            onClick={() => onWaypointClick?.('Riverside High School Gym')}
          >
            {/* Marker Halo */}
            <circle r="12" fill="#ff4d4d" fillOpacity="0.18" filter="url(#redGlow)" />
            {/* Pin Shape */}
            <path
              d="M 0 -18 C -5 -18 -9 -14 -9 -9 C -9 -3 0 0 0 0 C 0 0 9 -3 9 -9 C 9 -14 5 -18 0 -18 Z"
              fill="#FF4D4D"
              filter="url(#redGlow)"
            />
            <circle cx="0" cy="-9" r="3" fill="#FFFFFF" />

            {/* Destination Name Badge */}
            <g transform="translate(0, -28)">
              <rect
                x="-62"
                y="-11"
                width="124"
                height="20"
                rx="5"
                fill="#0B1F36"
                stroke="#00b8e6"
                strokeWidth="1.2"
                fillOpacity="0.95"
              />
              <text
                x="0"
                y="3"
                fill="#E6F4FA"
                fontSize="9"
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                letterSpacing="0.04em"
                textAnchor="middle"
              >
                Riverside High Gym
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Map Bottom Information Footer */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Attribution & SDK Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#06101c]/85 border border-[#163654] text-[10px] font-mono text-[#8AA3BC] pointer-events-auto shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_6px_#00D4FF]"></span>
          <span>OLA MAPS WEB SDK V2</span>
          <span className="text-[#3c5674]">|</span>
          <span className="text-[#a8e8ff]">TACTICAL HYBRID</span>
        </div>

        {/* Dynamic Route Notice Banner */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#231a00]/90 border border-[#FFD43B]/40 text-[11px] font-medium text-[#FFD43B] pointer-events-auto shadow-[0_0_12px_rgba(255,212,59,0.2)]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FFD43B] shrink-0" />
          <span>Rerouted automatically away from Canal Underpass flooding.</span>
        </div>
      </div>
    </div>
  );
};
