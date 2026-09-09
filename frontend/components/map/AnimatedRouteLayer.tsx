"use client";

import { useEffect, useRef } from "react";
import { Polyline, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type AnimatedRouteLayerProps = {
  positions: LatLngExpression[];
  active?: boolean;
};

export function AnimatedRouteLayer({ positions, active = false }: AnimatedRouteLayerProps) {
  const map = useMap();
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let offset = 0;
    const animate = () => {
      offset = (offset + 0.35) % 20;
      map.getContainer().style.setProperty("--route-dash-offset", `${offset}px`);
      frame.current = window.requestAnimationFrame(animate);
    };
    frame.current = window.requestAnimationFrame(animate);
    return () => { if (frame.current) window.cancelAnimationFrame(frame.current); };
  }, [active, map]);

  return <Polyline positions={positions} pathOptions={{ color: "#00D4FF", weight: 4, opacity: 0.9, dashArray: active ? "10 10" : undefined, className: active ? "resqnova-route--animated" : undefined }} />;
}
