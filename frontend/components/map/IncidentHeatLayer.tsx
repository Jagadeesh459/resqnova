"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import type { IncidentRecord } from "@/lib/map/data";

type HeatFactory = typeof L & {
  heatLayer: (points: [number, number, number][], options: Record<string, unknown>) => L.Layer;
};

export function IncidentHeatLayer({ incidents }: { incidents: IncidentRecord[] }) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    layerRef.current?.removeFrom(map);

    if (!incidents.length) {
      layerRef.current = null;
      return;
    }

    const heatPoints = incidents.map((incident) => [
      incident.latitude,
      incident.longitude,
      Math.max(0.15, Math.min(1, incident.priority / 100)),
    ] as [number, number, number]);
    const heatLayer = (L as HeatFactory).heatLayer(heatPoints, {
      radius: 30,
      blur: 24,
      maxZoom: 13,
      minOpacity: 0.3,
      gradient: { 0.25: "#00D4FF", 0.5: "#FACC15", 0.75: "#F97316", 1: "#EF4444" },
    });

    heatLayer.addTo(map);
    layerRef.current = heatLayer;
    return () => {
      heatLayer.removeFrom(map);
      layerRef.current = null;
    };
  }, [incidents, map]);

  return null;
}
