import React from "react";
import { PortalCommandMap } from "@/components/map/PortalCommandMap";

interface LeafletEvacMapProps {
  interactive?: boolean;
  selectedRoute?: "elevated" | "highground";
  onMarkerClick?: (name: string, description: string) => void;
  className?: string;
  zoomLevel?: number;
  center?: [number, number];
}

// Citizen screens use the same live operational map as Authority. Route selection
// remains part of the portal API for the future routing service, but no fake route
// geometry is rendered here.
export const LeafletEvacMap: React.FC<LeafletEvacMapProps> = ({ className = "w-full min-h-[340px]" }) => {
  return <PortalCommandMap className={className} />;
};
