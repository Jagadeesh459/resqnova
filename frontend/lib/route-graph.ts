import type { RouteGraph } from "@/types/route-graph";

export const NTR_ROUTE_GRAPH: RouteGraph = {
  district: "NTR",
  nodes: ["Vijayawada", "Benz Circle", "Governorpet", "Railway Station", "Bus Stand", "GGH", "Kanaka Durga Bridge", "MG Road", "Eluru Road", "Bhavanipuram", "Auto Nagar"],
  edges: [
    { source: "Benz Circle", destination: "Governorpet", distance: 4.2, travel_time: 14, road_status: "open", flood_risk: 22 },
    { source: "Governorpet", destination: "Kanaka Durga Bridge", distance: 3.6, travel_time: 12, road_status: "partial", flood_risk: 61 },
    { source: "Railway Station", destination: "Bus Stand", distance: 1.2, travel_time: 5, road_status: "open", flood_risk: 18 },
    { source: "Bus Stand", destination: "GGH", distance: 2.1, travel_time: 7, road_status: "open", flood_risk: 24 },
    { source: "GGH", destination: "Kanaka Durga Bridge", distance: 3.5, travel_time: 12, road_status: "partial", flood_risk: 63 },
    { source: "Benz Circle", destination: "MG Road", distance: 2.0, travel_time: 6, road_status: "open", flood_risk: 21 },
    { source: "MG Road", destination: "Eluru Road", distance: 3.2, travel_time: 10, road_status: "open", flood_risk: 29 },
    { source: "Eluru Road", destination: "Bhavanipuram", distance: 4.7, travel_time: 14, road_status: "partial", flood_risk: 49 },
    { source: "Kanaka Durga Bridge", destination: "Auto Nagar", distance: 5.8, travel_time: 16, road_status: "open", flood_risk: 34 },
  ],
};
