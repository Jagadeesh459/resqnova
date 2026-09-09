import { Suspense } from "react";
import { LoginView } from "@/components/auth/LoginView";

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><LoginView /></Suspense>;
}
