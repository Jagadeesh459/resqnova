"use client";

import dynamic from "next/dynamic";

const CitizenApp = dynamic(() => import("@/components/external/citizen/App"), { ssr: false });

export function CitizenPortal() {
  return <CitizenApp />;
}
