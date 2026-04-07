"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingSaved, onSavedListingsChange, toggleListingSaved } from "@/app/clasificados/components/savedListings";
import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import { EN_VENTA_SUBCATEGORY_ROWS } from "../taxonomy/subcategories";
import { mapDbRowToEnVentaAnuncioDTO } from "../mapping/mapDbRowToEnVentaListingData";
import { buildEnVentaResultsCardModel } from "./buildEnVentaResultsCardModel";
import { inferEnVentaDeptFromSubKey } from "../mapping/enVentaInferDeptFromSub";
import {
  EN_VENTA_SORT_OPTIONS,
  enVentaConditionFilterOptions,
  enVentaDepartmentFilterOptions,
} from "../filters/enVentaFilterGroups";
import { buildEnVentaResultsUrl, EN_VENTA_RESULTS_PATH } from "../shared/constants/enVentaResultsRoutes";
import newLogo from "../../../../../public/logo.png";
import { EnVentaResultListingCard } from "./EnVentaResultListingCard";
import { EnVentaResultsEmpty } from "./EnVentaResultsEmpty";
import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";

type Lang = "es" | "en";
type SortId = "newest" | "price-asc" | "price-desc";

const PAGE_SIZE = 24;
const PROMO_CAP = 2;

type RowPack = {
  row: Record<string, unknown>;
  dto: EnVentaAnuncioDTO;
  priceNum: number;
  boosted: boolean;
  effectiveDept: string | null;
};

function priceNumFromRow(row: Record<string, unknown>): number {
  const raw = row.price;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return Number(String(raw ?? "").replace(/[^0-9.]/g, "")) || 0;
}

function isRowBoosted(row: Record<string, unknown>): boolean {
  const b = row.boost_expires;
  if (b == null) return false;
  const t = new Date(typeof b === "string" ? b : String(b)).getTime();
  return Number.isFinite(t) && t > Date.now();
}

function resolveEffectiveDept(dto: EnVentaAnuncioDTO): string | null {
  const dk = (dto.departmentKey ?? "").trim();
  if (dk) {
    if (EN_VENTA_DEPARTMENTS.some((d) => d.key === dk)) return dk;
    const byLabel = EN_VENTA_DEPARTMENTS.find((d) => d.label.es === dk || d.label.en === dk);
    if (byLabel) return byLabel.key;
  }
  return inferEnVentaDeptFromSubKey(dto.subKey);
}

function textMatch(q: string, dto: EnVentaAnuncioDTO): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const blob = `${dto.title.es} ${dto.description} ${dto.city}`.toLowerCase();
  return blob.includes(needle);
}

export function EnVentaResultsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const q = (sp?.get("q") ?? "").trim();
  const evDept = (sp?.get("evDept") ?? "").trim();
  const evSub = (sp?.get("evSub") ?? "").trim();
  const city = (sp?.get("city") ?? "").trim();
  const cond = (sp?.get("cond") ?? "").trim();
  const priceMin = sp?.get("priceMin") ?? "";
  const priceMax = sp?.get("priceMax") ?? "";
  const pickup = sp?.get("pickup") === "1";
  const ship = sp?.get("ship") === "1";
  const delivery = sp?.get("delivery") === "1";
  const seller = (sp?.get("seller") ?? "").trim();
  const sort = (sp?.get("sort") ?? "newest") as SortId;
  const view = sp?.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(sp?.get("page") ?? "1") || 1);

  const [rows, setRows] = useState<RowPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [favTick, setFavTick] = useState(0);

  useEffect(() => {
    return onSavedListingsChange(() => setFavTick((t) => t + 1));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("listings")
          .select(
            "id, owner_id, title, description, city, category, price, is_free, detail_pairs, seller_type, business_name, status, is_published, created_at, images, boost_expires, views, rentas_tier"
          )
          .eq("category", "en-venta")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(800);

        if (cancelled) return;
        if (error) {
          setLoadErr(error.message);
          setRows([]);
          setLoading(false);
          return;
        }

        const packs: RowPack[] = [];
        for (const raw of data ?? []) {
          const row = raw as Record<string, unknown>;
          if (row.is_published === false) continue;
          try {
            const dto = mapDbRowToEnVentaAnuncioDTO(row);
            if (!dto.id) continue;
            const effectiveDept = resolveEffectiveDept(dto);
            packs.push({
              row,
              dto,
              priceNum: priceNumFromRow(row),
              boosted: isRowBoosted(row),
              effectiveDept,
            });
          } catch {
            /* skip bad row */
          }
        }
        setRows(packs);
      } catch (e: unknown) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = rows.filter(({ dto, effectiveDept, priceNum }) => {
      if (!textMatch(q, dto)) return false;
      if (evDept && effectiveDept !== evDept) return false;
      if (evSub && (dto.subKey ?? "").trim() !== evSub) return false;
      if (city && !dto.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (cond && (dto.conditionKey ?? "").trim().toLowerCase() !== cond.toLowerCase()) return false;
      if (pickup && !dto.fulfillment.pickup) return false;
      if (ship && !dto.fulfillment.shipping) return false;
      if (delivery && !dto.fulfillment.delivery) return false;
      if (seller === "business" && dto.sellerKind !== "business") return false;
      if (seller === "individual" && dto.sellerKind !== "individual") return false;

      const pMin = priceMin.trim() ? Number(priceMin.replace(/[^0-9.]/g, "")) : null;
      const pMax = priceMax.trim() ? Number(priceMax.replace(/[^0-9.]/g, "")) : null;
      if (pMin != null && Number.isFinite(pMin) && priceNum < pMin) return false;
      if (pMax != null && Number.isFinite(pMax) && priceNum > pMax) return false;

      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.priceNum - b.priceNum;
      if (sort === "price-desc") return b.priceNum - a.priceNum;
      const ta = new Date(String(a.row.created_at ?? 0)).getTime();
      const tb = new Date(String(b.row.created_at ?? 0)).getTime();
      return tb - ta;
    });

    return list;
  }, [rows, q, evDept, evSub, city, cond, pickup, ship, delivery, seller, priceMin, priceMax, sort]);

  const promotedPool = useMemo(() => filtered.filter((p) => p.boosted).slice(0, PROMO_CAP), [filtered]);
  const promotedIds = useMemo(() => new Set(promotedPool.map((p) => p.dto.id)), [promotedPool]);

  const restFiltered = useMemo(
    () => filtered.filter((p) => !promotedIds.has(p.dto.id)),
    [filtered, promotedIds]
  );

  const total = filtered.length;
  const totalRest = restFiltered.length;
  const pageCount = Math.max(1, Math.ceil(totalRest / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const standardSlice = restFiltered.slice(startIdx, startIdx + PAGE_SIZE);

  const t = {
    es: {
      title: "En Venta",
      count: (a: number, b: number, tot: number) => `Mostrando ${a} – ${b} de ${tot} resultados`,
      searchPh: "Buscar en En Venta…",
      cityPh: "Ciudad",
      sort: "Ordenar",
      go: "Buscar",
      grid: "Cuadrícula",
      list: "Lista",
      latest: "Últimos",
      promoted: "Destacado Pro",
      loading: "Cargando…",
      err: "No se pudieron cargar los anuncios.",
      page: (p: number, pc: number) => `Página ${p} de ${pc}`,
      radius: "Distancia",
      km: "km",
      filters: "Filtros",
      priceMin: "Precio mín",
      priceMax: "Precio máx",
      dept: "Departamento",
      sub: "Subcategoría",
      seller: "Vendedor",
      all: "Todos",
      ind: "Particular",
      biz: "Negocio",
      trust: "Comunidad Leonix · anuncios moderados · contacto directo",
    },
    en: {
      title: "For Sale",
      count: (a: number, b: number, tot: number) => `Showing ${a} – ${b} of ${tot} results`,
      searchPh: "Search For Sale…",
      cityPh: "City",
      sort: "Sort",
      go: "Search",
      grid: "Grid",
      list: "List",
      latest: "Latest",
      promoted: "Pro Featured",
      loading: "Loading…",
      err: "Could not load listings.",
      page: (p: number, pc: number) => `Page ${p} of ${pc}`,
      radius: "Distance",
      km: "km",
      filters: "Filters",
      priceMin: "Min price",
      priceMax: "Max price",
      dept: "Department",
      sub: "Subcategory",
      seller: "Seller",
      all: "All",
      ind: "Individual",
      biz: "Business",
      trust: "Leonix community · moderated listings · direct contact",
    },
  }[lang];

  const pushParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const sp2 = new URLSearchParams();
      sp2.set("lang", lang);
      const merged: Record<string, string | undefined> = {
        q: q || undefined,
        evDept: evDept || undefined,
        evSub: evSub || undefined,
        city: city || undefined,
        cond: cond || undefined,
        priceMin: priceMin || undefined,
        priceMax: priceMax || undefined,
        pickup: pickup ? "1" : undefined,
        ship: ship ? "1" : undefined,
        delivery: delivery ? "1" : undefined,
        seller: seller || undefined,
        sort,
        view,
        page: String(safePage),
        ...next,
      };
      for (const [k, v] of Object.entries(merged)) {
        if (v != null && v !== "") sp2.set(k, v);
      }
      router.push(`${EN_VENTA_RESULTS_PATH}?${sp2.toString()}`);
    },
    [router, lang, q, evDept, evSub, city, cond, priceMin, priceMax, pickup, ship, delivery, seller, sort, view, safePage]
  );

  const onSubmitSearch = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const el = formEvent.currentTarget;
    const fd = new FormData(el);
    const pickupOn = (el.elements.namedItem("pickup") as HTMLInputElement | null)?.checked ?? false;
    const shipOn = (el.elements.namedItem("ship") as HTMLInputElement | null)?.checked ?? false;
    const deliveryOn = (el.elements.namedItem("delivery") as HTMLInputElement | null)?.checked ?? false;
    pushParams({
      q: String(fd.get("q") ?? "").trim() || undefined,
      city: String(fd.get("city") ?? "").trim() || undefined,
      sort: String(fd.get("sort") ?? "newest"),
      view: String(fd.get("view") ?? view),
      evDept: String(fd.get("evDept") ?? "").trim() || undefined,
      evSub: String(fd.get("evSub") ?? "").trim() || undefined,
      cond: String(fd.get("cond") ?? "").trim() || undefined,
      priceMin: String(fd.get("priceMin") ?? "").trim() || undefined,
      priceMax: String(fd.get("priceMax") ?? "").trim() || undefined,
      pickup: pickupOn ? "1" : undefined,
      ship: shipOn ? "1" : undefined,
      delivery: deliveryOn ? "1" : undefined,
      seller: String(fd.get("seller") ?? "").trim() || undefined,
      page: "1",
    });
  };

  const resetFilters = () => {
    router.push(buildEnVentaResultsUrl(lang));
  };

  const deptOptions = enVentaDepartmentFilterOptions(lang);
  const condOptions = enVentaConditionFilterOptions(lang);
  const subOptions = EN_VENTA_SUBCATEGORY_ROWS.filter((r) => !evDept || r.dept === evDept);

  const countLine =
    total === 0
      ? lang === "es"
        ? "Sin resultados"
        : "No results"
      : t.count(startIdx + 1, Math.min(startIdx + standardSlice.length, totalRest), totalRest) +
        (promotedPool.length ? (lang === "es" ? ` · ${promotedPool.length} destacado(s)` : ` · ${promotedPool.length} featured`) : "");

  const isFav = (id: string) => isListingSaved(id);
  const onFav = (id: string) => {
    toggleListingSaved(id);
    setFavTick((x) => x + 1);
  };

  return (
    <div
      className="relative min-h-screen text-[#2C2416]"
      style={{
        backgroundColor: "#F3EBDD",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
        `,
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="flex flex-col items-center text-center">
          <Image src={newLogo} alt="Leonix" width={120} height={120} className="h-auto w-[min(120px,36vw)]" priority />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1E1810] sm:text-4xl">{t.title}</h1>
          <p className="mt-2 text-sm font-medium text-[#5C5346]">{loading ? t.loading : countLine}</p>
        </div>

        <form
          onSubmit={onSubmitSearch}
          className="mx-auto mt-8 max-w-5xl rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7]/90 p-4 shadow-[0_12px_48px_-16px_rgba(42,36,22,0.15)] backdrop-blur-sm sm:p-6"
        >
          <input type="hidden" name="lang" value={lang} />
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#E8DFD0] bg-white/95 px-3 py-2 shadow-inner">
              <span className="text-[#5C5346]" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                name="q"
                defaultValue={q}
                placeholder={t.searchPh}
                className="min-w-0 flex-1 bg-transparent py-1 text-sm text-[#1E1810] outline-none"
              />
            </div>
            <div className="flex min-w-[140px] flex-1 items-center gap-2 rounded-full border border-[#E8DFD0] bg-white/95 px-3 py-2 shadow-inner">
              <span aria-hidden>📍</span>
              <input
                name="city"
                defaultValue={city}
                placeholder={t.cityPh}
                className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
              />
            </div>
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-full border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-medium text-[#2C2416]"
            >
              {EN_VENTA_SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label[lang]}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] p-1">
              <button
                type="button"
                onClick={() => pushParams({ view: "grid", page: "1" })}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${view === "grid" ? "bg-white shadow-sm" : "text-[#5C5346]"}`}
              >
                {t.grid}
              </button>
              <button
                type="button"
                onClick={() => pushParams({ view: "list", page: "1" })}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${view === "list" ? "bg-white shadow-sm" : "text-[#5C5346]"}`}
              >
                {t.list}
              </button>
            </div>
            <input type="hidden" name="view" value={view} readOnly />
            <button
              type="submit"
              className="rounded-full bg-[#2A2620] px-6 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md hover:bg-[#1a1814]"
            >
              {t.go}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.dept}
              <select
                name="evDept"
                defaultValue={evDept}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              >
                <option value="">{t.all}</option>
                {deptOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.sub}
              <select
                name="evSub"
                defaultValue={evSub}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              >
                <option value="">{t.all}</option>
                {subOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {lang === "es" ? "Condición" : "Condition"}
              <select name="cond" defaultValue={cond} className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
                <option value="">{t.all}</option>
                {condOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.seller}
              <select name="seller" defaultValue={seller} className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
                <option value="">{t.all}</option>
                <option value="individual">{t.ind}</option>
                <option value="business">{t.biz}</option>
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.priceMin}
              <input
                name="priceMin"
                defaultValue={priceMin}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.priceMax}
              <input
                name="priceMax"
                defaultValue={priceMax}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-[#E8DFD0]/80 pt-4 text-sm text-[#3D3428]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="pickup" defaultChecked={pickup} className="rounded border-[#C9B46A]" />
              {lang === "es" ? "Recogida" : "Pickup"}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="ship" defaultChecked={ship} className="rounded border-[#C9B46A]" />
              {lang === "es" ? "Envío" : "Shipping"}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="delivery" defaultChecked={delivery} className="rounded border-[#C9B46A]" />
              {lang === "es" ? "Entrega local" : "Local delivery"}
            </label>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              <span>{t.radius}</span>
              <span>200 {t.km}</span>
            </div>
            <input type="range" min={5} max={200} defaultValue={200} className="mt-2 w-full accent-[#C9B46A]" disabled readOnly title="Próximamente" />
            <p className="mt-1 text-[11px] text-[#7A7164]/90">{lang === "es" ? "El radio refinado llegará con ubicación en mapa." : "Radius filtering will use map location in a future update."}</p>
          </div>
        </form>

        {loadErr ? <p className="mt-8 text-center text-sm text-red-700">{t.err}</p> : null}

        {!loading && !loadErr && total === 0 ? (
          <div className="mt-12">
            <EnVentaResultsEmpty lang={lang} onReset={resetFilters} />
          </div>
        ) : null}

        {!loading && !loadErr && total > 0 ? (
          <>
            {promotedPool.length > 0 ? (
              <section className="mt-10">
                <h2 className="mb-4 text-left text-sm font-bold uppercase tracking-wide text-[#5C5346]">{t.promoted}</h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {promotedPool.map((p) => (
                    <EnVentaResultListingCard
                      key={p.dto.id}
                      model={buildEnVentaResultsCardModel(p.dto, {
                        lang,
                        effectiveDeptKey: p.effectiveDept,
                        boosted: p.boosted,
                      })}
                      lang={lang}
                      isFav={isFav(p.dto.id)}
                      onToggleFav={onFav}
                      href={`/clasificados/anuncio/${p.dto.id}?lang=${lang}`}
                      layout="grid"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-left text-sm font-bold uppercase tracking-wide text-[#5C5346]">{t.latest}</h2>
                <div className="flex items-center gap-2 text-xs font-medium text-[#5C5346]">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => pushParams({ page: String(Math.max(1, safePage - 1)) })}
                    className="rounded-full border border-[#E8DFD0] bg-white px-2 py-1 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span>{t.page(safePage, pageCount)}</span>
                  <button
                    type="button"
                    disabled={safePage >= pageCount}
                    onClick={() => pushParams({ page: String(Math.min(pageCount, safePage + 1)) })}
                    className="rounded-full border border-[#E8DFD0] bg-white px-2 py-1 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
              <div className={view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
                {standardSlice.map((p) => (
                  <EnVentaResultListingCard
                    key={p.dto.id}
                    model={buildEnVentaResultsCardModel(p.dto, {
                      lang,
                      effectiveDeptKey: p.effectiveDept,
                      boosted: false,
                    })}
                    lang={lang}
                    isFav={isFav(p.dto.id)}
                    onToggleFav={onFav}
                    href={`/clasificados/anuncio/${p.dto.id}?lang=${lang}`}
                    layout={view}
                  />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {loading ? (
          <div className="mt-16 text-center text-sm text-[#5C5346]">{t.loading}</div>
        ) : null}

        <p className="mt-16 text-center text-[12px] font-medium tracking-wide text-[#7A7164]">{t.trust}</p>

        <div className="mt-8 text-center">
          <Link href={`/clasificados/en-venta?lang=${lang}`} className="text-sm font-semibold text-[#2A2620] underline">
            {lang === "es" ? "← Volver al inicio En Venta" : "← Back to For Sale home"}
          </Link>
        </div>
      </main>
    </div>
  );
}
