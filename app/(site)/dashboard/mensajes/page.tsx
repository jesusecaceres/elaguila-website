"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { dashboardInboxComingSoonCopy } from "../lib/dashboardProductTruth";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  void raw;
  return "free";
}

export default function MensajesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mensajes",
            subtitle: "Bandeja interna del vendedor (en preparación).",
            back: "Volver al resumen",
            loading: "Cargando…",
          }
        : {
            title: "Messages",
            subtitle: "Seller inbox (in preparation).",
            back: "Back to overview",
            loading: "Loading…",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/mensajes?${q}`)}`);
        return;
      }
      setAccountRef(accountRefFromId(user.id));
      setEmail(user.email ?? null);
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      setName(
        (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
          (typeof meta?.name === "string" && meta.name.trim()) ||
          null
      );
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, email, membership_tier")
          .eq("id", user.id)
          .maybeSingle();
        const pr = profile as {
          display_name?: string | null;
          email?: string | null;
          membership_tier?: string | null;
        } | null;
        if (pr?.display_name?.trim()) setName(pr.display_name.trim());
        if (pr?.email?.trim()) setEmail(pr.email.trim());
        setPlan(normalizePlanFromMembershipTier(pr?.membership_tier));
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    void run();
    return () => {
      mounted = false;
    };
  }, [router, q]);

  return (
    <LeonixDashboardShell lang={lang} activeNav="messages" plan={plan} userName={name} email={email} accountRef={accountRef}>
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
          </header>

          <div
            className="mt-8 rounded-3xl border border-[#D6C7AD]/85 bg-gradient-to-br from-[#FFFCF7] to-[#FBF7EF] p-8 text-center shadow-[0_10px_36px_-14px_rgba(42,36,22,0.12)] sm:p-10"
            role="status"
          >
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#3D3428]">{dashboardInboxComingSoonCopy(lang)}</p>
            <Link
              href={`/dashboard?${q}`}
              className="mt-6 inline-flex rounded-2xl border border-[#C9A84A]/45 bg-[#FFFDF7] px-5 py-2.5 text-sm font-semibold text-[#3D3428] transition hover:bg-[#FBF7EF]"
            >
              {t.back}
            </Link>
          </div>
        </>
      )}
    </LeonixDashboardShell>
  );
}
