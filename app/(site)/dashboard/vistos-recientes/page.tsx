"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { getRecentlyViewedIds } from "../../../lib/recentlyViewed";
import { SAMPLE_LISTINGS } from "@/app/data/classifieds/sampleListings";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";

type Listing = {
  id: string;
  category: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
};

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

export default function VistosRecientesPage() {
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Vistos recientemente",
            subtitle: "Anuncios que abriste en este dispositivo (hasta 20).",
            back: "Volver al resumen",
            emptyTitle: "Sin historial aún",
            emptyBody: "Cuando abras anuncios en Leonix, aparecerán aquí para que puedas volver rápido.",
            browse: "Explorar clasificados",
            loading: "Cargando…",
          }
        : {
            title: "Recently viewed",
            subtitle: "Listings you opened on this device (up to 20).",
            back: "Back to overview",
            emptyTitle: "No history yet",
            emptyBody: "When you open listings on Leonix, they’ll show up here for quick return.",
            browse: "Browse classifieds",
            loading: "Loading…",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) {
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
      } else {
        setAccountRef(null);
        setName(null);
        setEmail(null);
        setPlan("free");
      }

      const ids = await getRecentlyViewedIds();
      if (!mounted) return;
      if (ids.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }
      const all = SAMPLE_LISTINGS as unknown as Listing[];
      const byId = new Map(all.map((l) => [l.id, l]));
      const found = ids.map((id) => byId.get(id)).filter(Boolean) as Listing[];
      setListings(found);
      setLoading(false);
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, []);

  const listLinkClass =
    "block rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 px-4 py-3 text-left shadow-sm transition hover:border-[#C9B46A]/45 hover:bg-[#FAF7F2]";

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="recent"
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

          {listings.length === 0 ? (
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
              {listings.map((item) => (
                <li key={item.id}>
                  <Link href={`/clasificados/anuncio/${item.id}?${q}`} className={listLinkClass}>
                    <span className="font-semibold text-[#1E1810]">{item.title[lang]}</span>
                    <span className="mt-1 block text-sm text-[#5C5346]">
                      {formatListingPrice(item.priceLabel[lang], { lang })} · {item.city}
                    </span>
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
