"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { OfertaLocalPublicSearchItem } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesPublicItemCard } from "./OfertasLocalesPublicItemCard";
import { OfertasLocalesPublicItemDetailDrawer } from "./OfertasLocalesPublicItemDetailDrawer";
import { OfertasLocalesShoppingListPanel } from "./OfertasLocalesShoppingListPanel";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";
import { useOfertasLocalesShoppingList } from "./useOfertasLocalesShoppingList";

const INPUT =
  "w-full rounded-lg border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/20";
const BTN =
  "rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-50";

function parseLang(raw: string | null): OfertasLocalesAppLang {
  return raw === "en" ? "en" : "es";
}

export function OfertasLocalesPublicSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams?.get("lang") ?? null);
  const c = ofertasLocalesPublicSearchCopy(lang);

  const [q, setQ] = useState(() => searchParams?.get("q") ?? "");
  const [city, setCity] = useState(() => searchParams?.get("city") ?? "");
  const [zip, setZip] = useState(() => searchParams?.get("zip") ?? "");
  const [category, setCategory] = useState(() => searchParams?.get("category") ?? "");
  const [marketType, setMarketType] = useState(() => searchParams?.get("marketType") ?? "");
  const [offerType, setOfferType] = useState(() => searchParams?.get("offerType") ?? "");
  const [sort, setSort] = useState(() => searchParams?.get("sort") ?? "newest");

  const [items, setItems] = useState<OfertaLocalPublicSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OfertaLocalPublicSearchItem | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const shoppingList = useOfertasLocalesShoppingList();

  const queryString = useMemo(() => {
    const qs = searchParams?.toString() ?? "";
    return qs || `lang=${lang}`;
  }, [searchParams, lang]);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ofertas-locales/public-search?${queryString}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { ok: boolean; items?: OfertaLocalPublicSearchItem[]; error?: string };
      if (!data.ok) {
        setError(c.loadFailed);
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError(c.loadFailed);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [c.loadFailed, queryString]);

  useEffect(() => {
    setQ(searchParams?.get("q") ?? "");
    setCity(searchParams?.get("city") ?? "");
    setZip(searchParams?.get("zip") ?? "");
    setCategory(searchParams?.get("category") ?? "");
    setMarketType(searchParams?.get("marketType") ?? "");
    setOfferType(searchParams?.get("offerType") ?? "");
    setSort(searchParams?.get("sort") ?? "newest");
  }, [searchParams]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("lang", lang);
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    if (zip.trim()) params.set("zip", zip.trim());
    if (category.trim()) params.set("category", category.trim());
    if (marketType.trim()) params.set("marketType", marketType.trim());
    if (offerType.trim()) params.set("offerType", offerType.trim());
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`/clasificados/ofertas-locales?${params.toString()}`);
  };

  const publishHref = `/publicar/ofertas-locales?lang=${lang}`;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E1814] sm:text-3xl">{c.pageTitle}</h1>
            <p className="mt-2 text-sm text-[#1E1814]/70 sm:text-base">{c.pageSubtitle}</p>
          </div>
          <button
            type="button"
            className="relative rounded-full border border-[#7A1E2C]/35 bg-white px-4 py-2 text-sm font-semibold text-[#7A1E2C] shadow-sm hover:bg-[#7A1E2C]/5"
            onClick={() => setListOpen(true)}
          >
            {c.listButton}
            {shoppingList.counts.itemCount > 0 ? (
              <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#7A1E2C] px-1.5 py-0.5 text-[11px] font-bold text-white">
                {shoppingList.counts.itemCount}
              </span>
            ) : null}
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="mb-8 rounded-2xl border border-[#D4C4A8]/80 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="sm:col-span-2 lg:col-span-3">
              <span className="sr-only">{c.pageTitle}</span>
              <input
                className={INPUT}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={c.searchPlaceholder}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.cityLabel}</span>
              <input className={INPUT} value={city} onChange={(e) => setCity(e.target.value)} placeholder={c.cityPlaceholder} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.zipLabel}</span>
              <input className={INPUT} value={zip} onChange={(e) => setZip(e.target.value)} placeholder={c.zipPlaceholder} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.categoryLabel}</span>
              <input className={INPUT} value={category} onChange={(e) => setCategory(e.target.value)} placeholder={c.categoryPlaceholder} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.marketTypeLabel}</span>
              <input className={INPUT} value={marketType} onChange={(e) => setMarketType(e.target.value)} placeholder={c.marketTypePlaceholder} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.offerTypeLabel}</span>
              <input className={INPUT} value={offerType} onChange={(e) => setOfferType(e.target.value)} placeholder={c.offerTypePlaceholder} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[#1E1814]/70">{c.sortLabel}</span>
              <select className={INPUT} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">{c.sortNewest}</option>
                <option value="price_low">{c.sortPriceLow}</option>
                <option value="expiring_soon">{c.sortExpiringSoon}</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className={BTN} disabled={loading}>
              {loading ? c.searching : c.searchButton}
            </button>
            {!loading && items.length > 0 ? (
              <p className="text-sm text-[#1E1814]/65">{c.resultsCount(items.length)}</p>
            ) : null}
          </div>
        </form>

        {error ? (
          <p className="mb-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#1E1814]/65">{c.searching}</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#D4C4A8]/70 bg-white px-6 py-10 text-center">
            <p className="text-base font-medium text-[#1E1814]">{c.emptyTitle}</p>
            <p className="mt-2 text-sm text-[#1E1814]/65">{c.emptyHint}</p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <OfertasLocalesPublicItemCard
                  lang={lang}
                  item={item}
                  isAdded={shoppingList.isAdded(item.id)}
                  onSelect={setSelected}
                  onAdd={shoppingList.addFromPublicItem}
                  onRemove={shoppingList.removeItem}
                  onOpenList={() => setListOpen(true)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-4">
          <p className="text-sm font-medium text-[#1E1814]">{c.publishCtaHint}</p>
          <Link href={publishHref} className="mt-2 inline-block text-sm font-semibold text-[#7A1E2C] underline">
            {c.publishCta}
          </Link>
        </div>
      </div>

      {selected ? (
        <OfertasLocalesPublicItemDetailDrawer lang={lang} item={selected} onClose={() => setSelected(null)} />
      ) : null}

      {listOpen ? (
        <OfertasLocalesShoppingListPanel
          lang={lang}
          list={shoppingList.list}
          storeCount={shoppingList.counts.storeCount}
          itemCount={shoppingList.counts.itemCount}
          onClose={() => setListOpen(false)}
          onRemove={shoppingList.removeItem}
          onUpdateQuantity={shoppingList.updateQuantity}
          onUpdateNote={shoppingList.updateNote}
          onClear={shoppingList.clearList}
        />
      ) : null}
    </div>
  );
}
