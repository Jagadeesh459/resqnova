"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const roles = ["admin", "citizen", "rescue", "ambulance", "shelter", "hospital"] as const;

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setMessage("Account created. Check your email, confirm the address, then sign in.");
        setMode("signin");
        return;
      }
      router.replace(searchParams.get("next") || (role === "citizen" ? "/citizen" : role === "rescue" ? "/rescue" : role === "ambulance" ? "/ambulance" : "/dashboard"));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect to Supabase Auth.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-text"><div className="pointer-events-none absolute inset-0 hex-grid opacity-40" /><motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md rounded-3xl border border-primary/25 bg-card/85 p-6 shadow-glow backdrop-blur-xl sm:p-8"><div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-neon"><ShieldCheck className="h-6 w-6" /></div><div><p className="font-heading text-xl font-semibold">ResQNova</p><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/70">Vijayawada command network</p></div></div><h1 className="font-heading text-2xl font-semibold">{mode === "signin" ? "Enter the response network" : "Create a response identity"}</h1><p className="mt-2 text-sm leading-6 text-text/60">Shared access for Vijayawada authority and emergency operations.</p><form onSubmit={submit} className="mt-6 space-y-4">{mode === "signup" && <><label className="block text-xs uppercase tracking-[0.18em] text-text/50">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-background/70 px-4 py-3 text-sm outline-none transition focus:border-primary/60" placeholder="Your name" /></label><label className="block text-xs uppercase tracking-[0.18em] text-text/50">Role<select value={role} onChange={(event) => setRole(event.target.value as (typeof roles)[number])} className="mt-2 w-full rounded-xl border border-white/10 bg-background/70 px-4 py-3 text-sm outline-none focus:border-primary/60">{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></>}<label className="block text-xs uppercase tracking-[0.18em] text-text/50"><span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" />Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-background/70 px-4 py-3 text-sm outline-none transition focus:border-primary/60" placeholder="you@example.com" /></label><label className="block text-xs uppercase tracking-[0.18em] text-text/50"><span className="flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5 text-primary" />Password</span><input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/10 bg-background/70 px-4 py-3 text-sm outline-none transition focus:border-primary/60" placeholder="Minimum 6 characters" /></label>{message && <p className="rounded-xl border border-warning/25 bg-warning/10 px-3 py-2 text-sm text-warning">{message}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-background shadow-neon transition hover:shadow-glow disabled:cursor-wait disabled:opacity-60">{busy ? "Connecting..." : mode === "signin" ? "Sign In" : "Create Account"}<ArrowRight className="h-4 w-4" /></button></form><p className="mt-4 text-center text-[11px] leading-5 text-text/45">Authority Admin uses this same sign-in form. Admin accounts are provisioned separately and cannot be created from public signup.</p><button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-text/60 transition hover:text-primary"><UserRound className="h-4 w-4" />{mode === "signin" ? "Create Account" : "Back to Sign In"}</button></motion.section></main>;
}
