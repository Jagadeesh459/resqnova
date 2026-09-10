import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const engineUrl = process.env.QUANTUM_ENGINE_URL?.trim();
  if (!engineUrl) return NextResponse.json({ error: "Quantum engine is not configured. Add QUANTUM_ENGINE_URL to the server environment." }, { status: 503 });
  try {
    const body = await request.json().catch(() => ({}));
    const response = await fetch(`${engineUrl.replace(/\/$/, "")}/api/quantum/reoptimize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quantum engine unavailable." }, { status: 503 });
  }
}
