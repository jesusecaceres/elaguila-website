"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
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

type RestRow = {
  id: string;
  slug: string;
  status: string;
  promoted: boolean;
  leonix_verified: boolean;
  package_tier: string | null;
  published_at: string;
  updated_at: string;
  business_name: string;
  draft_listing_id: string | null;
};

function fmt(ts: string, lang: Lang) {
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ts));
  } catch {
    return ts;
  }
}

export default function DashboardRestaurantesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Mis restaurantes (Clasificados)",
            subtitle:
              "Listados en `restaurantes_public_listings` para tu cuenta. Usa «Cargar en formulario» para traer el `listing_json` publicado al borrador de esta sesión y republicar (mismo `draft_listing_id` = actualización sin duplicar).",
            loading: "Cargando…",
            empty: "Aún no hay restaurantes publicados con esta cuenta.",
            publishCta: "Publicar un restaurante",
            previewCta: "Vista previa (misma sesión)",
            colBusiness: "Negocio",
            colStatus: "Estado",
            colSlug: "Slug",
            colPromo: "Destacado",
            colPlan: "Plan",
            colPub: "Publicado",
            colUpd: "Actualizado",
            linkPublic: "Ficha pública",
            linkResults: "Buscar en resultados",
            linkForm: "Formulario publicar",
            hydrate: "Cargar en formulario",
            hydrateBusy: "Cargando borrador…",
            colVerified: "Verificado",
            errRl: "No se pudieron cargar los listados (revisa sesión y políticas RLS en Supabase).",
            errHydrate: "No se pudo cargar el borrador publicado.",
          }
        : {
            title: "My restaurants (Classifieds)",
            subtitle:
              "Rows in `restaurantes_public_listings` for your account. Use “Load into form” to copy published `listing_json` into this session’s draft and republish (same `draft_listing_id` updates without duplicates).",
            loading: "Loading…",
            empty: "No restaurant listings are published for this account yet.",
            publishCta: "Publish a restaurant",
            previewCta: "Preview (this session)",
            colBusiness: "Business",
            colStatus: "Status",
            colSlug: "Slug",
            colPromo: "Promoted",
            colPlan: "Plan",
            colPub: "Published",
            colUpd: "Updated",
            linkPublic: "Public page",
            linkResults: "Open in results",
            linkForm: "Publish form",
            hydrate: "Load into form",
            hydrateBusy: "Loading draft…",
            colVerified: "Verified",
            errRl: "Could not load listings (check sign-in and Supabase RLS policies).",
            errHydrate: "Could not load published draft.",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RestRow[]>([]);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [hydrateId, setHydrateId] = useState<string | null>(null);
  const [hydrateErr, setHydrateErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/restaurantes?${q}`)}`);
      return;
    }
    setAccountRef(accountRefFromId(user.id));
    setEmail(user.email ?? null);
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    setName(
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        null,
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

    setFetchErr(null);
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select("id, slug, status, promoted, leonix_verified, package_tier, published_at, updated_at, business_name, draft_listing_id")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      setFetchErr(t.errRl);
      setRows([]);
    } else {
      setRows((data ?? []) as RestRow[]);
    }
    setLoading(false);
  }, [q, router, t.errRl]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadIntoForm = useCallback(
    async (listingId: string) => {
      setHydrateErr(null);
      setHydrateId(listingId);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("restaurantes_public_listings")
          .select("listing_json, draft_listing_id")
          .eq("id", listingId)
          .maybeSingle();
        if (error || !data?.listing_json) {
          setHydrateErr(t.errHydrate);
          setHydrateId(null);
          return;
        }
        const merged = mergeRestauranteDraft(data.listing_json);
        const stableDraftId =
          typeof data.draft_listing_id === "string" && data.draft_listing_id.trim()
            ? data.draft_listing_id.trim()
            : merged.draftListingId;
        merged.draftListingId = stableDraftId;
        const ok = await saveRestauranteDraftToStorageResolved(merged);
        if (!ok) {
          setHydrateErr(t.errHydrate);
          setHydrateId(null);
          return;
        }
        router.push(appendLangToPath("/publicar/restaurantes", lang));
      } catch {
        setHydrateErr(t.errHydrate);
        setHydrateId(null);
      }
    },
    [lang, router, t.errHydrate],
  );

  const previewHref = appendLangToPath("/clasificados/restaurantes/preview", lang);
  const publishHref = appendLangToPath("/publicar/restaurantes", lang);

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="restaurantes"
      plan={plan}
      userName={name}
      email={email}
      accountRef={accountRef}
    >
      <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_14px_44px_-16px_rgba(42,36,22,0.14)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#1E1810]">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{t.subtitle}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={publishHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 text-sm font-bold text-[#1E1810] shadow-md"
            >
              {t.publishCta}
            </Link>
            <Link
              href={previewHref}
              className="inline-flex min-h-[40px] items-center justify-center rounded-2xl border border-[#C9B46A]/50 px-4 text-xs font-semibold text-[#5C4E2E] hover:bg-[#FFFCF7]"
            >
              {t.previewCta}
            </Link>
          </div>
        </div>

        {fetchErr ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{fetchErr}</p>
        ) : null}
        {hydrateErr ? (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{hydrateErr}</p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-[#5C5346]">{t.loading}</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-sm text-[#5C5346]">{t.empty}</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-white/70">
            <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
              <thead className="bg-[#F3EBDD] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
                <tr>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colBusiness}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colStatus}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colSlug}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colPromo}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colVerified}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colPlan}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colPub}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2">{t.colUpd}</th>
                  <th className="border-b border-[#E8DFD0] px-3 py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const publicHref = appendLangToPath(`/clasificados/restaurantes/${encodeURIComponent(r.slug)}`, lang);
                  const resultsHref = `/clasificados/restaurantes/resultados?lang=${lang}&q=${encodeURIComponent(r.business_name)}`;
                  return (
                    <tr key={r.id} className="border-b border-[#F0E8DA]">
                      <td className="max-w-[200px] px-3 py-2 font-semibold">{r.business_name}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2 font-mono text-[10px]">{r.slug}</td>
                      <td className="px-3 py-2">{r.promoted ? (lang === "es" ? "sí" : "yes") : "—"}</td>
                      <td className="px-3 py-2">{r.leonix_verified ? (lang === "es" ? "sí" : "yes") : "—"}</td>
                      <td className="px-3 py-2">{r.package_tier ?? "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2">{fmt(r.published_at, lang)}</td>
                      <td className="whitespace-nowrap px-3 py-2">{fmt(r.updated_at, lang)}</td>
                      <td className="space-y-1 px-3 py-2">
                        <Link href={publicHref} className="block font-semibold text-[#6B5B2E] underline">
                          {t.linkPublic}
                        </Link>
                        <Link href={resultsHref} className="block text-[#6B5B2E] underline">
                          {t.linkResults}
                        </Link>
                        <Link href={publishHref} className="block text-[11px] text-[#5C5346] underline">
                          {t.linkForm}
                        </Link>
                        <button
                          type="button"
                          disabled={hydrateId === r.id}
                          onClick={() => void loadIntoForm(r.id)}
                          className="mt-1 block w-full text-left text-[11px] font-bold text-[#92400E] underline disabled:opacity-50"
                        >
                          {hydrateId === r.id ? t.hydrateBusy : t.hydrate}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LeonixDashboardShell>
  );
}
