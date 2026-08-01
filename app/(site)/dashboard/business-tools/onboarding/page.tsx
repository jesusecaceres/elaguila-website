"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../../components/LeonixDashboardShell";
import { OnboardingWizard } from "./OnboardingWizard";

type Lang = "es" | "en";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/business-tools/onboarding";
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    let mounted = true;
    async function run() {
      const { data } = await sb.auth.getUser();
      if (!mounted) return;
      if (!data.user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      setName((data.user.user_metadata?.full_name as string | undefined) || null);
      setCheckedAuth(true);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, pathname]);

  // Stable per-attempt intent key: read from the URL if present (supports resume links and
  // hard refresh), otherwise generate one and reflect it into the URL immediately so a refresh
  // right after starting a new draft still resumes the same intent, not a fresh one.
  const intentKeyFromUrl = searchParams?.get("intent") ?? null;
  const [generatedIntentKey] = useState(() => crypto.randomUUID());
  const intentKey = intentKeyFromUrl ?? generatedIntentKey;

  useEffect(() => {
    if (!intentKeyFromUrl && checkedAuth) {
      const q = new URLSearchParams({ lang, intent: intentKey });
      router.replace(`${pathname}?${q.toString()}`);
    }
  }, [checkedAuth, intentKeyFromUrl]);

  const accountRef = useMemo(() => {
    if (!userId) return null;
    const s = userId.replace(/-/g, "");
    return s.length < 8 ? "—" : `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
  }, [userId]);

  if (!checkedAuth) {
    return (
      <LeonixDashboardShell lang={lang} activeNav="business" plan="free" userName={null} email={null} accountRef={null} ownerId={null} compact>
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">
          {lang === "es" ? "Cargando…" : "Loading…"}
        </div>
      </LeonixDashboardShell>
    );
  }

  return (
    <LeonixDashboardShell lang={lang} activeNav="business" plan="free" userName={name} email={email} accountRef={accountRef} ownerId={userId} compact>
      <OnboardingWizard lang={lang} intentKey={intentKey} />
    </LeonixDashboardShell>
  );
}
