"use client";

import Image from "next/image";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import {
  listSavedListingIdsForUser,
  deleteSavedListingForUser,
} from "@/app/lib/savedListingsRuntime";
import {
  resolveSavedListingsForDashboard,
  type DashboardSavedResolved,
} from "@/app/lib/savedListingsDashboardResolve";

export const dynamic = "force-dynamic";

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

function isHttpUrl(u: string | null): boolean {
  return !!u && /^https?:\/\//i.test(u);
}

function GuardadosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Anuncios guardados",
            subtitle: "Tus favoritos guardados en Leonix.",
            back: "Volver al resumen",
            browse: "Explorar clasificados",
            loading: "Cargando…",
            empty: "No tienes anuncios guardados todavía.",
            emptyHint: "Guarda anuncios que te interesen desde su página pública para verlos aquí.",
            remove: "Quitar de guardados",
            removing: "Quitando…",
            view: "Ver anuncio",
            savedOn: "Guardado",
          }
        : {
            title: "Saved listings",
            subtitle: "Your saved favorites on Leonix.",
            back: "Back to overview",
            browse: "Browse classifieds",
            loading: "Loading…",
            empty: "You don't have any saved listings yet.",
            emptyHint: "Save listings you like from their public page to see them here.",
            remove: "Remove from saved",
            removing: "Removing…",
            view: "View listing",
            savedOn: "Saved",
          },
    [lang]
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<DashboardSavedResolved[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/guardados?${q}`)}`);
      return;
    }
    setOwnerId(user.id);
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

    // Package E Build E2, Gate 6 — real saved listings: existing resolver, no fabricated data.
    try {
      const ids = await listSavedListingIdsForUser(supabase, user.id);
      const resolved = await resolveSavedListingsForDashboard(supabase, ids, lang);
      setSavedItems(resolved);
      setLoadError(false);
    } catch {
      setSavedItems([]);
      setLoadError(true);
    }

    setLoading(false);
  }, [router, q, lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = useCallback(
    async (listingId: string) => {
      if (!ownerId) return;
      setRemovingId(listingId);
      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await deleteSavedListingForUser(supabase, ownerId, listingId);
        if (!error) {
          setSavedItems((prev) => prev.filter((item) => item.listing_id !== listingId));
        }
      } finally {
        setRemovingId(null);
      }
    },
    [ownerId]
  );

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="saved"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
      ownerId={ownerId}
    >
      {loading ? (
        <div className={`${LX_DASH.panel} p-10 text-center text-sm text-[#5C5346]`}>{t.loading}</div>
      ) : (
        <>
          <header>
            <p className={LX_DASH.contextLabel}>{lang === "es" ? "Tus anuncios" : "Your listings"}</p>
            <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
            <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
          </header>

          {loadError ? (
            <p className={`mt-6 ${LX_DASH.notice}`} role="status">
              {lang === "es" ? "No se pudieron cargar tus anuncios guardados." : "We couldn't load your saved listings."}
            </p>
          ) : savedItems.length === 0 ? (
            <div className={`mt-8 ${LX_DASH.disabledPanel}`} role="status">
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#3D3428]">{t.empty}</p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#5C5346]">{t.emptyHint}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href={`/clasificados?${q}`} className={LX_DASH.btnPrimary}>
                  {t.browse}
                </Link>
                <Link href={`/dashboard?${q}`} className={LX_DASH.btnSecondary}>
                  {t.back}
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {savedItems.map((item) => (
                <li key={item.listing_id} className={`${LX_DASH.panelCompact} flex min-w-0 flex-col gap-3`}>
                  <Link href={`${item.href}?${q}`} className="flex min-w-0 items-center gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-[#FBF7EF]">
                      {isHttpUrl(item.thumb) ? (
                        <Image
                          src={item.thumb as string}
                          alt=""
                          width={64}
                          height={64}
                          unoptimized={item.thumb!.startsWith("http")}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden className="text-lg opacity-60">
                          🏷️
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-[#1F241C]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[#5C5346]">
                        {formatListingPrice(item.price ?? null, { lang })}
                        {item.city ? ` · ${item.city}` : ""}
                      </p>
                      {item.category ? (
                        <span className="mt-1 inline-flex rounded-full border border-[#C9A84A]/35 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]">
                          {item.category}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                  <div className="flex items-center justify-between gap-2 border-t border-[#E8DFD0] pt-3">
                    <Link href={`${item.href}?${q}`} className="text-xs font-semibold text-[#7A1E2C] hover:underline">
                      {t.view}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.listing_id)}
                      disabled={removingId === item.listing_id}
                      className="rounded-lg border border-[#D6C7AD]/70 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#5C5346] transition hover:border-[#7A1E2C]/40 hover:text-[#7A1E2C] disabled:opacity-60"
                    >
                      {removingId === item.listing_id ? t.removing : t.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </LeonixDashboardShell>
  );
}

export default function GuardadosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <GuardadosPageContent />
    </Suspense>
  );
}
