export type RouteStatus = "open" | "partial" | "blocked";

export type RouteGraphEdge = {
  source: string;
  destination: string;
  distance: number;
  travel_time: number;
  road_status: RouteStatus;
  flood_risk: number;
};

export type RouteGraph = {
  district: "NTR";
  nodes: string[];
  edges: RouteGraphEdge[];
};
