import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    status: "standby",
    engine: "qaoa-placeholder",
    message: "Quantum optimization is reserved for the future route-allocation batch.",
    inputs: ["ambulances", "rescue_teams", "shelters", "roads", "risk_zones"],
  }, { status: 202 });
}
