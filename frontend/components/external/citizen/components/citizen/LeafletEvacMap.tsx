import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LeafletEvacMapProps {
  interactive?: boolean;
  selectedRoute?: 'elevated' | 'highground';
  onMarkerClick?: (name: string, description: string) => void;
  className?: string;
  zoomLevel?: number;
  center?: [number, number];
}

export const LeafletEvacMap: React.FC<LeafletEvacMapProps> = ({
  selectedRoute = 'elevated',
  onMarkerClick,
  className = 'w-full h-full min-h-[340px]',
  zoomLevel = 14,
  center = [16.5085, 80.6380],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const altRouteLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if previous instance exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: center as [number, number],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Dark Mode CartoDB Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Hazard Area (Eluru Canal Inundation Polygon)
    const hazardPolygon = L.polygon(
      [
        [16.5120, 80.6360],
        [16.5160, 80.6410],
        [16.5140, 80.6470],
        [16.5080, 80.6450],
        [16.5070, 80.6390],
      ],
      {
        color: '#ffb4ab',
        weight: 2,
        fillColor: '#93000a',
        fillOpacity: 0.35,
        dashArray: '6, 6',
      }
    ).addTo(map);

    hazardPolygon.bindPopup(`
      <div style="font-family: Inter, sans-serif; padding: 4px;">
        <div style="color: #ffb4ab; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          ⚠️ CANAL SURGE HAZARD
        </div>
        <div style="color: #d8e3f7; font-size: 12px; margin-top: 4px;">
          Eluru Canal spillover. Water depth 1.4m. Surface roads submerged.
        </div>
      </div>
    `);

    // Primary Safe Route Coordinates (Benz Circle to Municipal Hall via MG Elevated Flyover)
    const primaryRouteCoords: [number, number][] = [
      [16.5015, 80.6495], // Benz Circle
      [16.5042, 80.6445], // MG Flyover Entry
      [16.5080, 80.6385], // Elevated Overpass Sensor SN-04
      [16.5115, 80.6320], // Governorpet link
      [16.5145, 80.6275], // Municipal Hall Safe Shelter
    ];

    // Alternate High Ground Route
    const altRouteCoords: [number, number][] = [
      [16.5015, 80.6495],
      [16.5085, 80.6520],
      [16.5170, 80.6450],
      [16.5190, 80.6350],
      [16.5145, 80.6275],
    ];

    const altRoute = L.polyline(altRouteCoords, {
      color: '#859398',
      weight: 4,
      dashArray: '8, 8',
      opacity: selectedRoute === 'highground' ? 0.9 : 0.4,
    }).addTo(map);
    altRouteLayerRef.current = altRoute;

    const primaryRoute = L.polyline(primaryRouteCoords, {
      color: '#00d4ff',
      weight: 6,
      opacity: selectedRoute === 'elevated' ? 0.95 : 0.4,
    }).addTo(map);
    routeLayerRef.current = primaryRoute;

    // Custom HTML Icons
    const createPin = (label: string, bg: string, text: string, ping = false) =>
      L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            ${ping ? `<span style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: ${bg}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
            <div style="background-color: ${bg}; color: ${text}; width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid #091422; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
              ${label}
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

    // 1. Origin: Benz Circle
    const benzMarker = L.marker([16.5015, 80.6495], {
      icon: createPin('●', '#00d4ff', '#003642', true),
    }).addTo(map);
    benzMarker.bindPopup(`
      <div style="padding: 2px;">
        <strong style="color: #00d4ff; font-size: 13px;">Start: Benz Circle Flyover</strong>
        <p style="color: #4ae183; font-size: 11px; margin: 2px 0 0;">Elevation: +14.2m AMSL (Dry & Passable)</p>
      </div>
    `);
    benzMarker.on('click', () => {
      onMarkerClick?.('Benz Circle', 'Origin Point • Flyover approach is free from blockages.');
    });

    // 2. Waypoint 1: MG Elevated Entry
    const wp1 = L.marker([16.5042, 80.6445], {
      icon: createPin('1', '#202b39', '#d8e3f7'),
    }).addTo(map);
    wp1.bindPopup('<strong style="color: #d8e3f7; font-size: 12px;">Waypoint 1: MG Elevated Flyover Entry</strong>');
    wp1.on('click', () => {
      onMarkerClick?.('MG Elevated Ramp', 'Ascend ramp directly to bypass ground inundation.');
    });

    // 3. Sensor SN-04
    const sensorMarker = L.marker([16.5080, 80.6385], {
      icon: createPin('✓', '#06bb63', '#00431f'),
    }).addTo(map);
    sensorMarker.bindPopup(`
      <div style="padding: 2px;">
        <span style="color: #4ae183; font-weight: 600; font-size: 12px;">Sensor SN-04: 0cm Water</span>
        <p style="color: #bbc9cf; font-size: 11px; margin: 2px 0 0;">Deck Status: Clear & 100% Dry</p>
      </div>
    `);
    sensorMarker.on('click', () => {
      onMarkerClick?.('Sensor SN-04', 'Continuous sensor relay confirms 0cm water on elevated corridor.');
    });

    // 4. Waypoint 2: Governorpet Overpass
    const wp2 = L.marker([16.5115, 80.6320], {
      icon: createPin('2', '#202b39', '#d8e3f7'),
    }).addTo(map);
    wp2.bindPopup('<strong style="color: #d8e3f7; font-size: 12px;">Waypoint 2: Governorpet Overpass Link</strong>');
    wp2.on('click', () => {
      onMarkerClick?.('Governorpet Overpass', 'Remain on elevated deck past Eluru Canal crossing.');
    });

    // 5. Destination: Municipal Community Hall
    const destMarker = L.marker([16.5145, 80.6275], {
      icon: createPin('★', '#4ae183', '#003919', true),
    }).addTo(map);
    destMarker.bindPopup(`
      <div style="padding: 2px;">
        <strong style="color: #4ae183; font-size: 13px;">Municipal Community Hall Shelter</strong>
        <p style="color: #d8e3f7; font-size: 11px; margin: 2px 0 0;">Capacity: 412 Slots Open • Medical Station Active</p>
      </div>
    `);
    destMarker.on('click', () => {
      onMarkerClick?.('Municipal Shelter', 'Primary verified haven station with hot meals and power backup.');
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center, zoomLevel]);

  // Update opacities on route change
  useEffect(() => {
    if (routeLayerRef.current && altRouteLayerRef.current) {
      if (selectedRoute === 'elevated') {
        routeLayerRef.current.setStyle({ opacity: 0.95, weight: 6 });
        altRouteLayerRef.current.setStyle({ opacity: 0.35, weight: 3 });
      } else {
        routeLayerRef.current.setStyle({ opacity: 0.35, weight: 3 });
        altRouteLayerRef.current.setStyle({ opacity: 0.95, weight: 6 });
      }
    }
  }, [selectedRoute]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full rounded-inherit z-0" />
    </div>
  );
};
