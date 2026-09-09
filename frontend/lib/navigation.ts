import { Boxes, Gauge, Settings, Waypoints } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const sidebarNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Resource Planner", href: "/resource-planner", icon: Boxes },
  { label: "Evacuation Planner", href: "/evacuation-planner", icon: Waypoints },
  { label: "Settings", href: "/settings", icon: Settings },
];
