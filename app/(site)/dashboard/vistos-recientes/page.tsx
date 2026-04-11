"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { getRecentlyViewedIds } from "../../../lib/recentlyViewed";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";

type Lang = "es" | "en";
type Plan = "free" | "pro";

type DbListing = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  category?: string | null;
  images?: unknown;
  status?: string | null;
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

function firstImage(images: unknown): string | null {
  if (images == null) return null;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first === "object") {
      const u = (first as Record<string, unknown>).url ?? (first as Record<string, unknown>).src;
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  }
  return null;
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
            subtitle: "Anuncios que abriste en Leonix en este dispositivo o cuenta (hasta 10).",
            back: "Volver al resumen",
            emptyTitle: "Sin historial aún",
            emptyBody: "Cuando abras anuncios en Leonix, aparecerán aquí para que puedas volver rápido.",
            browse: "Explorar clasificados",
            loading: "Cargando…",
            missing: "Ya no está disponible o fue eliminado.",
            category: "Categoría",
          }
        : {
            title: "Recently viewed",
            subtitle: "Listings you opened on Leonix on this device or account (up to 10).",
            back: "Back to overview",
            emptyTitle: "No history yet",
            emptyBody: "When you open listings on Leonix, they will show up here for quick return.",
            browse: "Browse classifieds",
            loading: "Loading…",
            missing: "No longer available or was removed.",
            category: "Category",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [ordered, setOrdered] = useState<Array<{ id: string; row: DbListing | null }>>([]);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [membershipTier, setMembershipTier] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
            .select("display_name, email, membership_tier, account_type")
            .eq("id", user.id)
            .maybeSingle();
          const pr = profile as {
            display_name?: string | null;
            email?: string | null;
            membership_tier?: string | null;
            account_type?: string | null;
          } | null;
          if (pr?.display_name?.trim()) setName(pr.display_name.trim());
          if (pr?.email?.trim()) setEmail(pr.email.trim());
          setPlan(normalizePlanFromMembershipTier(pr?.membership_tier));
          setMembershipTier(typeof pr?.membership_tier === "string" ? pr.membership_tier : null);
          setAccountType(typeof pr?.account_type === "string" ? pr.account_type : null);
        } catch {
          /* ignore */
        }
      } else {
        setAccountRef(null);
        setName(null);
        setEmail(null);
        setPlan("free");
        setMembershipTier(null);
        setAccountType(null);
      }

      const ids = await getRecentlyViewedIds();
      if (!mounted) return;
      if (ids.length === 0) {
        setOrdered([]);
        setLoading(false);
        return;
      }

      const uuidIds = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
      let rows: DbListing[] = [];
      if (uuidIds.length > 0) {
        const { data } = await supabase
          .from("listings")
          .select("id, title, price, city, category, images, status")
          .in("id", uuidIds);
        rows = (data ?? []) as DbListing[];
      }
      const byId = new Map(rows.map((r) => [r.id, r]));
      const sequence = ids.map((id) => ({ id, row: byId.get(id) ?? null }));
      setOrdered(sequence);
      setLoading(false);
    }

    void boot();
    return () => {
      mounted = false;
    };
  }, []);

  const listLinkClass =
    "flex gap-4 rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-3 text-left shadow-sm transition hover:border-[#C9B46A]/45 hover:bg-[#FAF7F2]";

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="recent"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
      membershipTier={membershipTier}
      accountType={accountType}
    >
      {loading ? (
        <div className="rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-10 text-center text-sm text-[#5C5346]">{t.loading}</div>
      ) : (
        <>
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-[#5C5346]/95">{t.subtitle}</p>
          </header>

          {ordered.length === 0 ? (
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
              {ordered.map((item) => {
                const row = item.row;
                const thumb = row ? firstImage(row.images) : null;
                const title = (row?.title ?? "").trim() || "—";
                const priceLabel = formatListingPrice(row?.price ?? null, { lang });
                const city = (row?.city ?? "").trim() || "—";
                const cat = (row?.category ?? "").trim();

                if (!row) {
                  return (
                    <li key={item.id}>
                      <div className={`${listLinkClass} cursor-default opacity-80`}>
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-[#E8DFD0] bg-[#FAF7F2] text-xs text-[#7A7164]">
                          —
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[11px] text-[#7A7164]">{item.id}</span>
                          <p className="mt-1 text-sm text-[#5C5346]">{t.missing}</p>
                        </div>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <Link href={`/clasificados/anuncio/${row.id}?${q}`} className={listLinkClass}>
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]">
                        {thumb ? (
                          <Image src={thumb} alt="" fill className="object-cover" sizes="64px" unoptimized={thumb.startsWith("http")} />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[10px] text-[#7A7164]">LX</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-semibold text-[#1E1810]">{title}</span>
                        <span className="mt-1 block text-sm text-[#5C5346]">
                          {priceLabel} · {city}
                        </span>
                        {cat ? (
                          <span className="mt-1 block text-[11px] font-medium uppercase tracking-wide text-[#7A7164]">
                            {t.category}: {cat}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
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
