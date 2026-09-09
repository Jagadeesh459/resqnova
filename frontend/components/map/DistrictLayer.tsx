"use client";

import { GeoJSON } from "react-leaflet";
import { memo } from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer } from "leaflet";

type DistrictLayerProps = {
  data: FeatureCollection<Geometry>;
};

export const DistrictLayer = memo(function DistrictLayer({ data }: DistrictLayerProps) {
  return (
    <>
      <GeoJSON
        data={data}
        style={() => ({
          color: "#67E8F9",
          weight: 0.7,
          opacity: 0.38,
          fillColor: "#0D1726",
          fillOpacity: 0.015,
          className: "district-boundary",
        })}
      onEachFeature={(feature: Feature<Geometry>, layer: Layer) => {
        const district = String(feature.properties?.district_name ?? feature.properties?.NEW_DIST ?? "Andhra Pradesh district");
        layer.on({
          mouseover: () => {
            const target = layer as Layer & { setStyle?: (style: object) => void; bringToFront?: () => void };
            target.setStyle?.({ color: "#E6F1FF", weight: 1.2, opacity: 0.75, fillColor: "#00D4FF", fillOpacity: 0.045 });
            target.bringToFront?.();
          },
          mouseout: () => {
            const target = layer as Layer & { setStyle?: (style: object) => void };
            target.setStyle?.({ color: "#67E8F9", weight: 0.7, opacity: 0.38, fillColor: "#0D1726", fillOpacity: 0.015 });
          },
        });
      }}
      />
    </>
  );
});
