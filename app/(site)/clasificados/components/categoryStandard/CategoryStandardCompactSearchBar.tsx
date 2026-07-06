"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import { LEONIX_LB_CITY_PRESETS } from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessCityPresets";
import {
  LX_LB_BTN_PRIMARY,
  LX_LB_BTN_SECONDARY,
  LX_LB_SEARCH_CANVAS,
  LX_LB_SEARCH_CELL,
  LX_LB_SEARCH_INPUT,
} from "@/app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas";
import { categoryStandardUi } from "./categoryStandardTheme";
import { CategoryStandardFiltersDrawerShell } from "./CategoryStandardFiltersDrawerShell";

export type CompactSearchValues = {
  q: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type Props = {
  lang: Lang;
  routeLang: string;
  keywordPlaceholder: string;
  action?: string;
  defaultValues?: Partial<CompactSearchValues>;
  browseAllHref?: string;
  browseAllLabel?: string;
  drawerContent?: ReactNode;
  onSearch?: (values: CompactSearchValues) => void;
  onClear?: () => void;
  extraFields?: Record<string, string>;
  secondRow?: ReactNode;
  showFiltersButton?: boolean;
  showBrowseAll?: boolean;
  initialDrawerOpen?: boolean;
  /** Tighter mobile spacing for results surfaces. */
  density?: "default" | "compact";
};

export function CategoryStandardCompactSearchBar({
  lang,
  routeLang,
  keywordPlaceholder,
  action,
  defaultValues,
  browseAllHref,
  browseAllLabel,
  drawerContent,
  onSearch,
  onClear,
  extraFields,
  secondRow,
  showFiltersButton = true,
  showBrowseAll = true,
  initialDrawerOpen = false,
  density = "default",
}: Props) {
  const ui = categoryStandardUi(lang);
  const router = useRouter();
  const compact = density === "compact";
  const rowGap = compact ? "gap-1 p-1 sm:gap-1.5 sm:p-1.5" : "gap-1.5 p-1.5";
  const [drawerOpen, setDrawerOpen] = useState(initialDrawerOpen);
  const [q, setQ] = useState(defaultValues?.q ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [state, setState] = useState(defaultValues?.state ?? LEONIX_LB_DEFAULT_STATE);
  const [zip, setZip] = useState(defaultValues?.zip ?? "");
  const [country, setCountry] = useState(defaultValues?.country ?? LEONIX_LB_DEFAULT_COUNTRY);

  const cityPh = lang === "es" ? "Ciudad" : "City";
  const statePh = lang === "es" ? "Estado" : "State";
  const zipPh = "ZIP";
  const countryPh = lang === "es" ? "País" : "Country";
  const browseText = browseAllLabel ?? ui.viewAll;

  const currentValues = (): CompactSearchValues => ({
    q: q.trim(),
    city: city.trim(),
    state: state.trim(),
    zip: zip.trim(),
    country: country.trim(),
  });

  const submitValues = useCallback(
    (values: CompactSearchValues) => {
      if (onSearch) {
        onSearch(values);
        return;
      }
      if (!action) return;
      const sp = new URLSearchParams();
      sp.set("lang", routeLang);
      if (values.q) sp.set("q", values.q);
      if (values.city) sp.set("city", values.city);
      if (values.state) sp.set("state", values.state);
      if (values.zip) sp.set("zip", values.zip);
      if (values.country) sp.set("country", values.country);
      if (extraFields) {
        for (const [k, v] of Object.entries(extraFields)) {
          if (v.trim()) sp.set(k, v.trim());
        }
      }
      router.push(`${action}?${sp.toString()}`);
    },
    [action, extraFields, onSearch, routeLang, router],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitValues(currentValues());
  };

  const handleApplyDrawer = () => {
    setDrawerOpen(false);
    submitValues(currentValues());
  };

  const handleClearDrawer = () => {
    setDrawerOpen(false);
    if (onClear) {
      onClear();
      return;
    }
    if (action) {
      router.push(`${action}?lang=${encodeURIComponent(routeLang)}`);
    }
  };

  return (
    <div className="w-full min-w-0">
      <form action={action} method="get" role="search" onSubmit={onSubmit} className={LX_LB_SEARCH_CANVAS}>
        <input type="hidden" name="lang" value={routeLang} />
        {extraFields
          ? Object.entries(extraFields).map(([k, v]) =>
              v.trim() ? <input key={k} type="hidden" name={k} value={v} /> : null,
            )
          : null}
        <div className="flex flex-col border-b border-[#D6C7AD]/80 sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-4`}>
            <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              name="q"
              type="search"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={keywordPlaceholder}
              aria-label={keywordPlaceholder}
              className={`${LX_LB_SEARCH_INPUT} px-2`}
            />
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <input
              name="city"
              type="text"
              list="leonix-cat-std-city-presets"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={cityPh}
              aria-label={cityPh}
              autoComplete="address-level2"
              className={LX_LB_SEARCH_INPUT}
            />
            <datalist id="leonix-cat-std-city-presets">
              {LEONIX_LB_CITY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <select
              name="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              aria-label={statePh}
              className={`${LX_LB_SEARCH_INPUT} appearance-none`}
            >
              {US_STATE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </select>
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <input
              name="zip"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder={zipPh}
              aria-label={zipPh}
              autoComplete="postal-code"
              className={LX_LB_SEARCH_INPUT}
            />
          </label>
          <div className="hidden p-1.5 sm:col-span-2 sm:block">
            <button type="submit" className={`${LX_LB_BTN_PRIMARY} w-full`}>
              {ui.search}
            </button>
          </div>
        </div>
        <div className={`flex flex-col ${rowGap} sm:grid sm:grid-cols-12 sm:items-center`}>
          <label className={`${LX_LB_SEARCH_CELL} order-1 border-b-0 sm:order-none sm:col-span-3 sm:border-r-0`}>
            <input
              name="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={countryPh}
              aria-label={countryPh}
              autoComplete="country-name"
              className={LX_LB_SEARCH_INPUT}
            />
          </label>
          <div className="order-2 flex flex-wrap items-center gap-1.5 sm:order-none sm:col-span-4">
            {showFiltersButton && drawerContent ? (
              <button type="button" onClick={() => setDrawerOpen(true)} className={`${LX_LB_BTN_SECONDARY} min-w-[5rem]`}>
                {ui.filters}
              </button>
            ) : null}
            {secondRow}
          </div>
          {showBrowseAll && browseAllHref ? (
            <Link
              href={browseAllHref}
              className={`${LX_LB_BTN_SECONDARY} order-4 inline-flex w-full items-center justify-center sm:order-none sm:col-span-3 sm:w-auto`}
            >
              {browseText}
            </Link>
          ) : null}
          <button type="submit" className={`${LX_LB_BTN_PRIMARY} order-3 w-full sm:hidden`}>
            {ui.search}
          </button>
        </div>
      </form>

      {drawerContent ? (
        <CategoryStandardFiltersDrawerShell
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onApply={handleApplyDrawer}
          onClear={handleClearDrawer}
          lang={lang}
        >
          {drawerContent}
        </CategoryStandardFiltersDrawerShell>
      ) : null}
    </div>
  );
}
