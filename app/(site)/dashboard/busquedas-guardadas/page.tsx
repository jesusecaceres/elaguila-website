"use client";

/**
 * Saved Search 03/06 — owner "Búsquedas guardadas / Saved searches" management surface.
 * Autos, Bienes Raíces, and Rentas as of Saved Search 06. Reuses the existing dashboard shell
 * (`LeonixDashboardShell`) and the Saved Search 02 Bearer-token API (`app/api/saved-search/**`) —
 * never a direct Supabase table query, since that table's application-layer contract is the API,
 * not RLS-only browser access (see `savedSearchServerCrud.ts`'s header comment on why this table
 * follows a different convention than `saved_listings`).
 *
 * Saved Search 06 — one dashboard, not one per category (Gate 20): `CATEGORY_REGISTRY` is the
 * single place a category plugs in its label/facet-summary/results-URL builder.
 */
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { LeonixDashboardShell } from "../components/LeonixDashboardShell";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import {
  deleteSavedSearchClient,
  listSavedSearchesClient,
  setSavedSearchActiveClient,
} from "@/app/lib/saved-search/savedSearchClient";
import { describeAutosSavedSearchFacets } from "@/app/lib/saved-search/autos/savedSearchAutosAdapter";
import { buildAutosSavedSearchResultsUrl } from "@/app/lib/saved-search/autos/autosSavedSearchResultsUrl";
import { describeBienesRaicesSavedSearchFacets } from "@/app/lib/saved-search/bienes-raices/savedSearchBienesRaicesAdapter";
import { buildBienesRaicesSavedSearchResultsUrl } from "@/app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchResultsUrl";
import { describeRentasSavedSearchFacets } from "@/app/lib/saved-search/rentas/savedSearchRentasAdapter";
import { buildRentasSavedSearchResultsUrl } from "@/app/lib/saved-search/rentas/rentasSavedSearchResultsUrl";
import type { SavedSearchNormalizedInput, SavedSearchRow } from "@/app/lib/saved-search/savedSearchTypes";

type SavedSearchCategoryEntry = {
  label: { es: string; en: string };
  browsePath: string;
  describeFacets: (saved: SavedSearchNormalizedInput, lang: "es" | "en") => string[];
  buildResultsUrl: (saved: SavedSearchNormalizedInput, routeLang: "es" | "en") => string;
};

const CATEGORY_REGISTRY: Record<string, SavedSearchCategoryEntry> = {
  autos: {
    label: { es: "Autos", en: "Autos" },
    browsePath: "/clasificados/autos/resultados",
    describeFacets: describeAutosSavedSearchFacets,
    buildResultsUrl: buildAutosSavedSearchResultsUrl,
  },
  "bienes-raices": {
    label: { es: "Bienes Raíces", en: "Real Estate" },
    browsePath: "/clasificados/bienes-raices/resultados",
    describeFacets: describeBienesRaicesSavedSearchFacets,
    buildResultsUrl: buildBienesRaicesSavedSearchResultsUrl,
  },
  rentas: {
    label: { es: "Rentas", en: "Rentals" },
    browsePath: "/clasificados/rentas/results",
    describeFacets: describeRentasSavedSearchFacets,
    buildResultsUrl: buildRentasSavedSearchResultsUrl,
  },
};

type Lang = "es" | "en";
type Plan = "free" | "pro";

function accountRefFromId(id: string): string {
  const s = (id ?? "").replace(/-/g, "").trim();
  if (s.length < 8) return "—";
  return `${s.slice(0, 4).toUpperCase()}-${s.slice(-4).toUpperCase()}`;
}

function BusquedasGuardadasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang: Lang = (searchParams?.get("lang") || "es") === "en" ? "en" : "es";
  const q = `lang=${lang}`;

  const t = useMemo(
    () =>
      lang === "es"
        ? {
            title: "Búsquedas guardadas",
            subtitle: "Vuelve fácilmente a tus búsquedas guardadas de Autos, Bienes Raíces y Rentas.",
            back: "Volver al resumen",
            browse: "Explorar Autos",
            browseBr: "Explorar Bienes Raíces",
            browseRentas: "Explorar Rentas",
            loading: "Cargando…",
            empty: "No tienes búsquedas guardadas todavía.",
            emptyHint: "Guarda una búsqueda desde cualquier página de resultados para verla aquí.",
            active: "Activa",
            paused: "Pausada",
            pause: "Pausar",
            reactivate: "Reactivar",
            delete: "Eliminar",
            working: "Procesando…",
            viewResults: "Ver resultados",
            confirmDelete: "¿Eliminar esta búsqueda guardada? Esta acción no se puede deshacer.",
            anyCity: "Cualquier ciudad",
            error: "No se pudieron cargar tus búsquedas guardadas.",
            actionError: "No se pudo completar la acción. Intenta de nuevo.",
          }
        : {
            title: "Saved searches",
            subtitle: "Quickly return to your saved Autos, Real Estate, and Rentals searches.",
            back: "Back to overview",
            browse: "Browse Autos",
            browseBr: "Browse Real Estate",
            browseRentas: "Browse Rentals",
            loading: "Loading…",
            empty: "You don't have any saved searches yet.",
            emptyHint: "Save a search from any results page to see it here.",
            active: "Active",
            paused: "Paused",
            pause: "Pause",
            reactivate: "Reactivate",
            delete: "Delete",
            working: "Working…",
            viewResults: "View results",
            confirmDelete: "Delete this saved search? This cannot be undone.",
            anyCity: "Any city",
            error: "We couldn't load your saved searches.",
            actionError: "That action didn't go through. Please try again.",
          },
    [lang],
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [plan] = useState<Plan>("free");
  const [accountRef, setAccountRef] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<SavedSearchRow[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState(false);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/busquedas-guardadas?${q}`)}`);
      return;
    }
    setOwnerId(user.id);
    setAccountRef(accountRefFromId(user.id));
    setEmail(user.email ?? null);
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    setName(
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.name === "string" && meta.name.trim()) ||
        null,
    );

    const res = await listSavedSearchesClient();
    if (!res.ok) {
      setRows([]);
      setLoadError(true);
    } else {
      setRows(res.data.savedSearches);
      setLoadError(false);
    }
    setLoading(false);
  }, [router, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleToggleActive = useCallback(async (row: SavedSearchRow) => {
    setBusyId(row.id);
    setActionError(false);
    const res = await setSavedSearchActiveClient(row.id, !row.isActive);
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? res.data.savedSearch : r)));
    } else {
      setActionError(true);
    }
    setBusyId(null);
  }, []);

  const handleDelete = useCallback(
    async (row: SavedSearchRow) => {
      if (!confirm(t.confirmDelete)) return;
      setBusyId(row.id);
      setActionError(false);
      const res = await deleteSavedSearchClient(row.id);
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      } else {
        setActionError(true);
      }
      setBusyId(null);
    },
    [t.confirmDelete],
  );

  return (
    <LeonixDashboardShell
      lang={lang}
      activeNav="savedSearches"
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
            <p className={LX_DASH.contextLabel}>{lang === "es" ? "Tus búsquedas" : "Your searches"}</p>
            <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{t.title}</h1>
            <p className={`mt-2 ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
          </header>

          {loadError ? (
            <p className={`mt-6 ${LX_DASH.notice}`} role="status">
              {t.error}
            </p>
          ) : actionError ? (
            <p className={`mt-6 ${LX_DASH.notice}`} role="alert">
              {t.actionError}
            </p>
          ) : null}

          {!loadError && rows.length === 0 ? (
            <div className={`mt-8 ${LX_DASH.disabledPanel}`} role="status">
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-[#3D3428]">{t.empty}</p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#5C5346]">{t.emptyHint}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href={`/clasificados/autos/resultados?${q}`} className={LX_DASH.btnPrimary}>
                  {t.browse}
                </Link>
                <Link href={`/clasificados/bienes-raices/resultados?${q}`} className={LX_DASH.btnSecondary}>
                  {t.browseBr}
                </Link>
                <Link href={`/clasificados/rentas/results?${q}`} className={LX_DASH.btnSecondary}>
                  {t.browseRentas}
                </Link>
                <Link href={`/dashboard?${q}`} className={LX_DASH.btnSecondary}>
                  {t.back}
                </Link>
              </div>
            </div>
          ) : !loadError ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.flatMap((row) => {
                const entry = CATEGORY_REGISTRY[row.category];
                if (!entry) return [];
                const normalized: SavedSearchNormalizedInput = {
                  category: row.category,
                  city: row.city,
                  minPrice: row.minPrice,
                  maxPrice: row.maxPrice,
                  filterPayload: row.filterPayload,
                };
                const facets = entry.describeFacets(normalized, lang);
                const priceRange =
                  row.minPrice != null || row.maxPrice != null
                    ? `${row.minPrice != null ? formatListingPrice(row.minPrice, { lang }) : "—"} – ${
                        row.maxPrice != null ? formatListingPrice(row.maxPrice, { lang }) : "—"
                      }`
                    : null;
                const resultsHref = entry.buildResultsUrl(normalized, lang);
                const busy = busyId === row.id;
                return [(
                  <li key={row.id} className={`${LX_DASH.panelCompact} flex min-w-0 flex-col gap-3`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex rounded-full border border-[#C9A84A]/35 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F]">
                        {entry.label[lang]}
                      </span>
                      <span
                        className={
                          row.isActive
                            ? "inline-flex rounded-full bg-[#2A4536]/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]"
                            : "inline-flex rounded-full bg-[#7A7164]/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]"
                        }
                      >
                        {row.isActive ? t.active : t.paused}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F241C]">{row.city.trim() || t.anyCity}</p>
                      {priceRange ? <p className="mt-0.5 text-xs text-[#5C5346]">{priceRange}</p> : null}
                      {facets.length ? <p className="mt-1 text-xs text-[#5C5346]">{facets.join(" · ")}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-[#E8DFD0] pt-3">
                      <Link href={resultsHref} className="text-xs font-semibold text-[#7A1E2C] hover:underline">
                        {t.viewResults}
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(row)}
                        disabled={busy}
                        className="ml-auto rounded-lg border border-[#D6C7AD]/70 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#5C5346] transition hover:border-[#7A1E2C]/40 hover:text-[#7A1E2C] disabled:opacity-60"
                      >
                        {busy ? t.working : row.isActive ? t.pause : t.reactivate}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        disabled={busy}
                        className="rounded-lg border border-[#D6C7AD]/70 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#5C5346] transition hover:border-[#7A1E2C]/40 hover:text-[#7A1E2C] disabled:opacity-60"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </li>
                )];
              })}
            </ul>
          ) : null}
        </>
      )}
    </LeonixDashboardShell>
  );
}

export default function BusquedasGuardadasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <BusquedasGuardadasPageContent />
    </Suspense>
  );
}
