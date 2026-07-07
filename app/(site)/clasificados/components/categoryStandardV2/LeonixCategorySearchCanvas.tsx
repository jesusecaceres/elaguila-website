"use client";

import Link from "next/link";
import { FiSliders } from "react-icons/fi";
import {
  LEONIX_HERO_SEARCH_SHELL,
  LEONIX_HERO_SEARCH_GLOW,
  LEONIX_SEARCH_FIELD_LANDING,
  LEONIX_SEARCH_INPUT_LANDING,
  LEONIX_SEARCH_GRID_GAP,
} from "./constants";
import { LeonixCategoryCta } from "./LeonixCategoryCta";

type Props = {
  /** Language */
  lang: "es" | "en";
  /** Query field value */
  q: string;
  /** City field value */
  city: string;
  /** State field value */
  state: string;
  /** ZIP field value */
  zip: string;
  /** Country field value */
  country: string;
  /** Query field onChange */
  onQ: (v: string) => void;
  /** City field onChange */
  onCity: (v: string) => void;
  /** State field onChange */
  onState: (v: string) => void;
  /** ZIP field onChange */
  onZip: (v: string) => void;
  /** Country field onChange */
  onCountry: (v: string) => void;
  /** Search onSubmit */
  onSearch: () => void;
  /** Open filters handler */
  onOpenFilters: () => void;
  /** Browse all href */
  browseAllHref?: string;
  /** Browse all label */
  browseAllLabel?: string;
  /** Search button label */
  searchButtonLabel: string;
  /** Filters button label */
  filtersButtonLabel: string;
  /** Layout variant */
  layout?: "default" | "landing" | "results";
  /** Publish href (landing only) */
  publishHref?: string;
  /** Publish label (landing only) */
  publishLabel?: string;
  /** Extra second row slot */
  extraSecondRowSlot?: React.ReactNode;
  /** Show browse all button */
  showBrowseAll?: boolean;
  /** Show publish button */
  showPublish?: boolean;
  /** Form ID */
  formId?: string;
  /** Form action */
  action?: string;
  /** Form method */
  method?: "get" | "post";
};

/**
 * Leonix Category Search Canvas
 *
 * Extracted from Rentas/Bienes Raíces visual system.
 * Provides the compact search interface with exact layout and classes.
 *
 * Visual contract:
 * - Rounded shell with border, background, glow
 * - Grid layout: keyword (5), city (2), state (2), zip (1), search (2)
 * - Second row: country (3/4), filters (2/3), browse (3/4/5), publish (4)
 * - Input heights: min-h-[3rem] sm:min-h-[3.125rem]
 * - Button heights: match inputs
 * - Exact border, background, focus styles
 */
export function LeonixCategorySearchCanvas({
  lang,
  q,
  city,
  state,
  zip,
  country,
  onQ,
  onCity,
  onState,
  onZip,
  onCountry,
  onSearch,
  onOpenFilters,
  browseAllHref,
  browseAllLabel,
  searchButtonLabel,
  filtersButtonLabel,
  layout = "default",
  publishHref,
  publishLabel,
  extraSecondRowSlot,
  showBrowseAll = true,
  showPublish = false,
  formId,
  action,
  method = "get",
}: Props) {
  const isLanding = layout === "landing";
  const isResults = layout === "results";
  const isSharedAnchor = isLanding || isResults;
  const hasPublish = showPublish && !!publishHref && !!publishLabel;

  const cityPh = lang === "es" ? "Ciudad" : "City";
  const statePh = lang === "es" ? "Estado" : "State";
  const zipPh = "ZIP";
  const countryPh = lang === "es" ? "País" : "Country";
  const defaultBrowseLabel = lang === "es" ? "Ver todos los anuncios" : "View all listings";

  // Column spans based on layout and publish presence
  const browseCol = hasPublish ? "sm:col-span-3" : isResults ? "sm:col-span-4" : "sm:col-span-5";
  const countryCol = hasPublish ? "sm:col-span-3" : isResults ? "sm:col-span-4" : "sm:col-span-4";
  const filtersCol = hasPublish ? "sm:col-span-2" : isResults ? "sm:col-span-4" : "sm:col-span-3";
  const keywordCol = isSharedAnchor ? "sm:col-span-5" : "sm:col-span-4";

  const formElement = (
    <div className={LEONIX_HERO_SEARCH_SHELL}>
      <div className={LEONIX_HERO_SEARCH_GLOW} aria-hidden />

      <form
        id={formId}
        action={action}
        method={method}
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className={`relative grid grid-cols-1 ${LEONIX_SEARCH_GRID_GAP} sm:grid-cols-12 sm:items-stretch`}
      >
        {/* First row: keyword, city, state, zip, search */}
        <label className={`${LEONIX_SEARCH_FIELD_LANDING} ${keywordCol}`}>
          <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
            <svg width={isSharedAnchor ? 18 : 16} height={isSharedAnchor ? 18 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder={lang === "es" ? "Buscar..." : "Search..."}
            aria-label={lang === "es" ? "Buscar" : "Search"}
            className={`${LEONIX_SEARCH_INPUT_LANDING} pl-10 ${isSharedAnchor ? "font-medium" : ""}`}
            autoComplete="off"
          />
        </label>

        <label className={`${LEONIX_SEARCH_FIELD_LANDING} sm:col-span-2`}>
          <input
            type="text"
            value={city}
            onChange={(e) => onCity(e.target.value)}
            placeholder={cityPh}
            aria-label={cityPh}
            className={LEONIX_SEARCH_INPUT_LANDING}
            autoComplete="address-level2"
          />
        </label>

        <label className={`${LEONIX_SEARCH_FIELD_LANDING} sm:col-span-2`}>
          <select
            value={state}
            onChange={(e) => onState(e.target.value)}
            aria-label={statePh}
            className={`${LEONIX_SEARCH_INPUT_LANDING} appearance-none`}
          >
            <option value="CA">CA</option>
            <option value="TX">TX</option>
            <option value="FL">FL</option>
            <option value="NY">NY</option>
            <option value="IL">IL</option>
            <option value="AZ">AZ</option>
            <option value="NV">NV</option>
            <option value="WA">WA</option>
            <option value="OR">OR</option>
            <option value="CO">CO</option>
          </select>
        </label>

        <label className={`${LEONIX_SEARCH_FIELD_LANDING} sm:col-span-1`}>
          <input
            type="text"
            value={zip}
            onChange={(e) => onZip(e.target.value)}
            placeholder={zipPh}
            aria-label={zipPh}
            inputMode="numeric"
            maxLength={5}
            className={`${LEONIX_SEARCH_INPUT_LANDING} px-2 text-center`}
            autoComplete="postal-code"
          />
        </label>

        <div className="hidden sm:col-span-2 sm:block">
          <button type="submit" className="w-full">
            <LeonixCategoryCta
              label={searchButtonLabel}
              variant="primary"
              landing={isLanding}
            />
          </button>
        </div>

        {/* Second row: country, filters, browse, publish */}
        <label className={`${LEONIX_SEARCH_FIELD_LANDING} ${countryCol}`}>
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
            className={LEONIX_SEARCH_INPUT_LANDING}
            autoComplete="country-name"
          />
        </label>

        <div className={filtersCol}>
          <button
            type="button"
            onClick={onOpenFilters}
            className="w-full"
          >
            <LeonixCategoryCta
              label={filtersButtonLabel}
              variant="secondary"
              landing={isLanding}
            />
          </button>
        </div>

        {showBrowseAll && browseAllHref ? (
          <Link
            href={browseAllHref}
            className={`${LEONIX_SEARCH_FIELD_LANDING} ${browseCol} inline-flex w-full items-center justify-center no-underline`}
          >
            <span className={LEONIX_SEARCH_INPUT_LANDING}>
              {browseAllLabel || defaultBrowseLabel}
            </span>
          </Link>
        ) : isResults ? (
          <div className={`hidden ${browseCol} items-center text-xs leading-snug text-[#5C5346] sm:flex`}>
            {lang === "es"
              ? "Afina tu búsqueda en Filtros."
              : "Refine your search in Filters."}
          </div>
        ) : null}

        {hasPublish && publishHref ? (
          <Link
            href={publishHref}
            className={`sm:col-span-4 inline-flex w-full items-center justify-center no-underline`}
          >
            <LeonixCategoryCta
              label={publishLabel!}
              variant="primary"
              href={publishHref}
              landing={isLanding}
            />
          </Link>
        ) : null}

        {extraSecondRowSlot ? (
          <div className="sm:col-span-12">{extraSecondRowSlot}</div>
        ) : null}

        {/* Mobile search button */}
        <button type="submit" className="w-full sm:hidden">
          <LeonixCategoryCta
            label={searchButtonLabel}
            variant="primary"
            landing={isLanding}
          />
        </button>

        {hasPublish && publishHref ? (
          <Link
            href={publishHref}
            className="w-full sm:hidden no-underline"
          >
            <LeonixCategoryCta
              label={publishLabel!}
              variant="primary"
              href={publishHref}
              landing={isLanding}
            />
          </Link>
        ) : null}
      </form>
    </div>
  );

  return formElement;
}
