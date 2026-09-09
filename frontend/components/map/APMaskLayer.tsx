"use client";

import { GeoJSON, LayerGroup, Polygon } from "react-leaflet";
import type { FeatureCollection, Geometry } from "geojson";

const apSouth = 12.6;
const apNorth = 19.3;
const apWest = 76.7;
const apEast = 84.9;
export function APMaskLayer({ districts }: { districts: FeatureCollection<Geometry> | null }) {
  const outside = [
    [[-85, -180], [apSouth, -180], [apSouth, 180], [-85, 180]],
    [[apNorth, -180], [85, -180], [85, 180], [apNorth, 180]],
    [[apSouth, -180], [apNorth, -180], [apNorth, apWest], [apSouth, apWest]],
    [[apSouth, apEast], [apNorth, apEast], [apNorth, 180], [apSouth, 180]],
  ] as [number, number][][];
  return <LayerGroup>{outside.map((shape, index) => <Polygon key={index} positions={shape} pathOptions={{ stroke: false, fillColor: "#020711", fillOpacity: 0.78, interactive: false }} />)}{districts && <GeoJSON data={districts} style={(feature) => ({ stroke: false, fillColor: feature?.properties?.district_name === "NTR" || feature?.properties?.NEW_DIST === "NTR" ? "#00D4FF" : "#07111F", fillOpacity: feature?.properties?.district_name === "NTR" || feature?.properties?.NEW_DIST === "NTR" ? 0.08 : 0 })} />}</LayerGroup>;
}
