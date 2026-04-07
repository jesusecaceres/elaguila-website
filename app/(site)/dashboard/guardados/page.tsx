"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function normalizePlanFromMembershipTier(raw: unknown): Plan {
  const v = (typeof raw === "string" ? raw : "").toLowerCase().trim();
  if (v === "pro" || v === "business_lite" || v === "business_premium") return "pro";
  return "free";
}

export default function GuardadosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Anuncios guardados",
            subtitle: "Los anuncios que guardaste desde Leonix aparecen aquí.",
            back: "Volver al resumen",
            emptyTitle: "Aún no hay guardados",
            emptyBody: "Abre un anuncio y pulsa «Guardar» para verlo en esta lista.",
            browse: "Explorar clasificados",
            view: "Ver anuncio",
            loading: "Cargando…",
          }
        : {
            title: "Saved listings",
            subtitle: "Listings you saved on Leonix show up here.",
            back: "Back to overview",
            emptyTitle: "Nothing saved yet",
            emptyBody: "Open a listing and tap Save to see it in this list.",
            browse: "Browse classifieds",
            view: "View listing",
            loading: "Loading…",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<Array<{ listing_id: string; title?: string | null }>>([]);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/guardados?${q}`)}`);
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
      const pr = profile as { display_name?: string | null; email?: string | null; membership_tier?: string | null } | null;
      if (pr?.display_name?.trim()) setName(pr.display_name.trim());
      if (pr?.email?.trim()) setEmail(pr.email.trim());
      setPlan(normalizePlanFromMembershipTier(pr?.membership_tier));
    } catch {
      /* ignore */
    }

    const { data: rows } = await supabase
      .from("user_saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const ids = (rows ?? []).map((r: { listing_id: string }) => r.listing_id);
    if (ids.length === 0) {
      setSaved([]);
      setLoading(false);
      return;
    }
    const { data: listings } = await supabase.from("listings").select("id, title").in("id", ids);
    const byId = new Map((listings ?? []).map((l: { id: string; title?: string | null }) => [l.id, l.title]));
    setSaved(ids.map((id) => ({ listing_id: id, title: byId.get(id) ?? null })));
    setLoading(false);
  }, [router, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const listLinkClass =
    "block rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 px-4 py-3 text-left shadow-sm transition hover:border-[#C9B46A]/45 hover:bg-[#FAF7F2]";

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="saved"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
          </header>

          {saved.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FBF7EF] p-8 text-center shadow-[0_10px_36px_-14px_rgba(42,36,22,0.12)] sm:p-10">
              <p className="text-lg font-bold text-[#6B5B2E]">{t.emptyTitle}</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C5346]">{t.emptyBody}</p>
              <Link
                href={`/clasificados?${q}`}
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-[1.03]"
              >
                {t.browse}
              </Link>
            </div>
          ) : (
            <ul className="mt-8 space-y-3">
              {saved.map(({ listing_id, title }) => (
                <li key={listing_id}>
                  <Link href={`/clasificados/anuncio/${listing_id}?${q}`} className={listLinkClass}>
                    <span className="font-semibold text-[#1E1810]">{title || listing_id}</span>
                    <span className="mt-1 block text-xs font-medium text-[#6B5B2E]">{t.view} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/dashboard?${q}`}
            className="mt-8 inline-flex rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-2.5 text-sm font-semibold text-[#3D3428] transition hover:bg-[#FAF7F2]"
          >
            {t.back}
          </Link>
        </>
      )}
    </LeonixDashboardShell>
  );
}
