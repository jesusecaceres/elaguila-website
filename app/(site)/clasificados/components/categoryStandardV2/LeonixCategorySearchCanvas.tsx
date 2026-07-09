"use client";

import Link from "next/link";
import { FiSliders } from "react-icons/fi";
import type { LeonixCategorySearchCanvasProps } from "./types";
import {
  LEONIX_BTN_PRIMARY,
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_BTN_PRIMARY_PLACEHOLDER,
  LEONIX_BTN_SECONDARY,
  LEONIX_BTN_SECONDARY_LANDING,
  LEONIX_HERO_SEARCH_GLOW,
  LEONIX_HERO_SEARCH_SHELL,
  LEONIX_SEARCH_FIELD,
  LEONIX_SEARCH_FIELD_LANDING,
  LEONIX_SEARCH_INPUT,
  LEONIX_SEARCH_INPUT_LANDING,
  LEONIX_SEARCH_SHELL,
  LEONIX_SEARCH_SHELL_GLOW,
  LEONIX_SEARCH_SHELL_GLOW_LANDING,
  LEONIX_SEARCH_SHELL_LANDING,
} from "./constants";

/**
 * Leonix Category Search Canvas
 * 
 * This component provides the compact search interface for category landing and results pages.
 * It uses the exact Rentas/Bienes visual system with grid layout, inputs, and buttons.
 * 
 * Source: app/(site)/clasificados/rentas/components/RentasCompactSearchCanvas.tsx
 * Source: app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx
 * 
 * Grid layout (desktop):
 * - keyword/q: sm:col-span-5 (landing) / sm:col-span-4 (default)
 * - city: sm:col-span-2
 * - state/select: sm:col-span-2
 * - zip: sm:col-span-1
 * - search button: sm:col-span-2
 * Second row:
 * - country: sm:col-span-3 (with publish) / sm:col-span-4 (without)
 * - filters: sm:col-span-2 (with publish) / sm:col-span-3 (without) / sm:col-span-4 (results)
 * - browse all: sm:col-span-3 (with publish) / sm:col-span-5 (without) / sm:col-span-4 (results)
 * - primary action slot: sm:col-span-4 (landing only, always preserved)
 * 
 * @param lang - "es" or "en"
 * @param surface - "landing" or "results"
 * @param query - Search query value
 * @param city - City value
 * @param state - State value
 * @param zip - ZIP value
 * @param country - Country value
 * @param onQuery - Query change handler
 * @param onCity - City change handler
 * @param onState - State change handler
 * @param onZip - ZIP change handler
 * @param onCountry - Country change handler
 * @param onSearch - Search submit handler
 * @param onOpenFilters - Filters drawer open handler
 * @param browseAllHref - Browse all link href
 * @param browseAllLabel - Browse all link label
 * @param searchButtonLabel - Search button label
 * @param filtersButtonLabel - Filters button label
 * @param publishHref - Publish link href (landing only)
 * @param publishLabel - Publish link label (landing only)
 * @param fallbackPrimaryHref - Optional fallback primary action href when publish CTA data is missing
 * @param fallbackPrimaryLabel - Optional fallback primary action label when publish CTA data is missing
 * @param extraSecondRowSlot - Extra slot in second row
 * @param showBrowseAll - Show browse all link
 * @param showPublish - Optional landing override; undefined auto-renders publish CTA when href/label exist
 * @param preservePrimarySlot - Preserve the landing primary action column even when CTA data is missing
 * @param disabledPrimarySlotLabel - Disabled placeholder label when no primary action data exists
 * @param formId - Form ID
 * @param action - Form action
 * @param method - Form method
 */
export function LeonixCategorySearchCanvas({
  lang,
  surface,
  query,
  city,
  state,
  zip,
  country,
  onQuery,
  onCity,
  onState,
  onZip,
  onCountry,
  onSearch,
  onOpenFilters,
  browseAllHref,
  browseAllLabel,
  queryPlaceholder,
  searchButtonLabel,
  filtersButtonLabel,
  publishHref,
  publishLabel,
  fallbackPrimaryHref,
  fallbackPrimaryLabel,
  preservePrimarySlot = true,
  disabledPrimarySlotLabel,
  extraSecondRowSlot,
  showBrowseAll = true,
  showPublish,
  formId,
  action,
  method = "get",
}: LeonixCategorySearchCanvasProps) {
  const isLanding = surface === "landing";
  const isResults = surface === "results";
  const isSharedAnchor = isLanding || isResults;
  const shouldShowPublish = isLanding && showPublish !== false && !!publishHref && !!publishLabel;
  const hasFallbackPrimary = isLanding && !!fallbackPrimaryHref && !!fallbackPrimaryLabel;
  const hasPrimarySlot = isLanding && (shouldShowPublish || hasFallbackPrimary || preservePrimarySlot);

  // Select appropriate classes based on surface
  const shellClass = isSharedAnchor ? LEONIX_HERO_SEARCH_SHELL : LEONIX_SEARCH_SHELL;
  const glowClass = isSharedAnchor ? LEONIX_HERO_SEARCH_GLOW : isLanding ? LEONIX_SEARCH_SHELL_GLOW_LANDING : LEONIX_SEARCH_SHELL_GLOW;
  const fieldClass = isSharedAnchor ? LEONIX_SEARCH_FIELD_LANDING : LEONIX_SEARCH_FIELD;
  const inputClass = isSharedAnchor ? LEONIX_SEARCH_INPUT_LANDING : LEONIX_SEARCH_INPUT;
  const btnPrimary = isSharedAnchor ? LEONIX_BTN_PRIMARY_LANDING : LEONIX_BTN_PRIMARY;
  const btnSecondary = isSharedAnchor ? LEONIX_BTN_SECONDARY_LANDING : LEONIX_BTN_SECONDARY;

  const gridGap = "gap-2.5 sm:gap-3";

  // Keep the landing second row locked: country | filters | browse all | primary slot.
  const browseCol = hasPrimarySlot ? "sm:col-span-3" : isResults ? "sm:col-span-4" : "sm:col-span-5";
  const countryCol = hasPrimarySlot ? "sm:col-span-3" : isResults ? "sm:col-span-4" : "sm:col-span-4";
  const filtersCol = hasPrimarySlot ? "sm:col-span-2" : isResults ? "sm:col-span-4" : "sm:col-span-3";
  const keywordCol = isSharedAnchor ? "sm:col-span-5" : "sm:col-span-4";

  const cityPh = lang === "es" ? "Ciudad" : "City";
  const statePh = lang === "es" ? "Estado" : "State";
  const zipPh = "ZIP";
  const countryPh = lang === "es" ? "País" : "Country";

  const refineHint =
    lang === "es" ? "Afina por filtros en Filtros." : "Refine by filters in Filters.";
  const disabledPrimaryLabel =
    disabledPrimarySlotLabel || (lang === "es" ? "Accion pendiente" : "Action pending");

  const primaryAction =
    shouldShowPublish && publishHref && publishLabel
      ? { href: publishHref, label: publishLabel }
      : hasFallbackPrimary && fallbackPrimaryHref && fallbackPrimaryLabel
        ? { href: fallbackPrimaryHref, label: fallbackPrimaryLabel }
        : null;

  const SearchIcon = () => (
    <span className={`shrink-0 text-[#556B3E] ${isSharedAnchor ? "pl-3.5" : "pl-3"}`} aria-hidden>
      <svg width={isSharedAnchor ? 18 : 16} height={isSharedAnchor ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx={11} cy={11} r={7} />
        <path d="M20 20l-3-3" strokeLinecap="round" />
      </svg>
    </span>
  );

  return (
    <div className={shellClass}>
      <div className={glowClass} aria-hidden />

      <div className={`relative grid grid-cols-1 ${gridGap} sm:grid-cols-12 sm:items-stretch`}>
        {/* First row: keyword, city, state, zip, search button */}
        <label className={`${fieldClass} ${keywordCol}`}>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={queryPlaceholder || (lang === "es" ? "Buscar..." : "Search...")}
            aria-label={queryPlaceholder || (lang === "es" ? "Buscar" : "Search")}
            className={`${inputClass} ${isSharedAnchor ? "font-medium" : ""}`}
            autoComplete="off"
          />
        </label>

        <label className={`${fieldClass} sm:col-span-2`}>
          <input
            type="text"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            placeholder={cityPh}
            aria-label={cityPh}
            className={inputClass}
            autoComplete="address-level2"
          />
        </label>

        <label className={`${fieldClass} sm:col-span-2`}>
          <select
            value={state}
            onChange={(e) => onState(e.target.value)}
            aria-label={statePh}
            className={`${inputClass} appearance-none`}
          >
            <option value="CA">CA</option>
            <option value="TX">TX</option>
            <option value="FL">FL</option>
            <option value="NY">NY</option>
            <option value="IL">IL</option>
            <option value="AZ">AZ</option>
            <option value="GA">GA</option>
            <option value="NC">NC</option>
            <option value="WA">WA</option>
            <option value="CO">CO</option>
          </select>
        </label>

        <label className={`${fieldClass} sm:col-span-1`}>
          <input
            type="text"
            value={zip}
            onChange={(e) => onZip(e.target.value)}
            placeholder={zipPh}
            aria-label={zipPh}
            inputMode="numeric"
            maxLength={5}
            className={`${inputClass} px-2 text-center`}
            autoComplete="postal-code"
          />
        </label>

        <div className="hidden sm:col-span-2 sm:block">
          <button type="button" className={`${btnPrimary} w-full`} onClick={onSearch}>
            {searchButtonLabel}
          </button>
        </div>
      </div>

      {/* Second row: country, filters, browse all, publish */}
      <div className={`relative mt-3 grid grid-cols-1 ${gridGap} sm:grid-cols-12 sm:items-stretch`}>
        <label className={`${fieldClass} ${countryCol}`}>
          <span className="sr-only">{countryPh}</span>
          <span className="hidden shrink-0 pl-3 text-[10px] font-bold uppercase tracking-wide text-[#556B3E]/80 sm:inline" aria-hidden>
            {countryPh}
          </span>
          <input
            type="text"
            value={country}
            onChange={(e) => onCountry(e.target.value)}
            placeholder={countryPh}
            aria-label={countryPh}
            className={inputClass}
            autoComplete="country-name"
          />
        </label>

        <div className={filtersCol}>
          <button type="button" className={`${btnSecondary} w-full`} onClick={onOpenFilters}>
            <FiSliders className="h-4 w-4 shrink-0 text-[#556B3E]" aria-hidden />
            {filtersButtonLabel}
          </button>
        </div>

        {showBrowseAll && browseAllHref ? (
          <Link href={browseAllHref} className={`${btnSecondary} ${browseCol} inline-flex w-full items-center justify-center`}>
            {browseAllLabel || (lang === "es" ? "Ver todos" : "View all")}
          </Link>
        ) : isResults ? (
          <p className={`hidden ${browseCol} items-center text-xs leading-snug text-[#5C5346] sm:flex`}>{refineHint}</p>
        ) : (
          <div className={`hidden ${browseCol} sm:block`} aria-hidden />
        )}

        {primaryAction ? (
          <Link href={primaryAction.href} className={`${btnPrimary} sm:col-span-4 inline-flex w-full items-center justify-center`}>
            {primaryAction.label}
          </Link>
        ) : hasPrimarySlot ? (
          <span
            className={`${LEONIX_BTN_PRIMARY_PLACEHOLDER} hidden w-full cursor-not-allowed sm:col-span-4 sm:inline-flex`}
            aria-disabled="true"
          >
            {disabledPrimaryLabel}
          </span>
        ) : null}

        {extraSecondRowSlot}

        {/* Mobile search button */}
        <button type="button" className={`${btnPrimary} w-full sm:hidden`} onClick={onSearch}>
          {searchButtonLabel}
        </button>

        {/* Mobile publish button */}
        {primaryAction ? (
          <Link href={primaryAction.href} className={`${btnPrimary} w-full sm:hidden`}>
            {primaryAction.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
