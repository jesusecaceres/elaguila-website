"use client";

import type { FormEventHandler } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { writeServiciosDiscoveryPrefs } from "./lib/serviciosLocalPreferences";
import {
  serviciosResultsHasActiveFilters,
  type ServiciosResultsFilterQuery,
} from "./lib/serviciosResultsFilter";
import { normalizeServiciosDiscoveryLocationInput } from "./lib/serviciosLocationNormalize";
import { ServiciosResultsAdvancedFilterFields } from "./resultados/ServiciosResultsAdvancedFilterFields";
import { CAT_STD_PER_PAGE_OPTIONS } from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";
import {
  LeonixLocalBusinessCompactSearchCanvas,
  LX_LB_BTN_PRIMARY,
  LX_LB_BTN_SECONDARY,
  LX_LB_SEARCH_CANVAS,
} from "@/app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  isLeonixLbUsCountry,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import {
  buildServiciosResultsBrowseHref,
  parseServiciosFilterFormData,
} from "./lib/serviciosBrowseParams";

const RESULTS_PATH = "/clasificados/servicios/results";

const RESULTS_FORM_ID_MOBILE = "servicios-results-filter-form-mobile";

const CONTROL_SELECT =
  "min-h-[2.625rem] rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#3D3428]";

const sortSelectDefault = (current: ServiciosResultsFilterQuery) =>
  current.sort === "name"
    ? "name"
    : current.sort === "rating"
      ? "rating"
      : current.sort === "most_liked"
        ? "most_liked"
        : current.sort === "most_saved"
          ? "most_saved"
          : current.sort === "open_now"
            ? "open_now"
            : "newest";

/** Drawer-only refinements (excludes q, city, sort) — badge when advanced filters URL params are active. */
function serviciosResultsHasAdvancedDrawerFilters(current: ServiciosResultsFilterQuery): boolean {
  return Boolean(
    current.state?.trim() ||
      current.zip?.trim() ||
      (current.country?.trim() && current.country.trim() !== LEONIX_LB_DEFAULT_COUNTRY) ||
    current.group?.trim() ||
      (current.seller && current.seller !== "all") ||
      current.whatsapp === "1" ||
      current.promo === "1" ||
      current.call === "1" ||
      current.verified === "1" ||
      current.web === "1" ||
      current.bilingual === "1" ||
      current.email === "1" ||
      current.emergency === "1" ||
      current.mobileSvc === "1" ||
      current.msg === "1" ||
      current.phys === "1" ||
      current.svcMulti === "1" ||
      current.offer === "1" ||
      current.legal === "1" ||
      current.langEs === "1" ||
      current.langEn === "1" ||
      current.langOt === "1" ||
      current.vint === "1" ||
      current.wknd === "1" ||
      current.openNow === "1" ||
      current.licensed === "1" ||
      current.insured === "1" ||
      current.sameDay === "1" ||
      current.appointment === "1" ||
      current.freeEstimate === "1" ||
      current.freeConsultation === "1" ||
      current.hasPhotos === "1" ||
      current.hasVideos === "1" ||
      current.hasOffers === "1",
  );
}

function createServiciosResultsFormSubmitCapture(): FormEventHandler<HTMLFormElement> {
  return (e) => {
    const form = e.currentTarget;
    const cityInput = form.querySelector<HTMLInputElement>('input[name="city"]');
    if (cityInput) {
      const raw = cityInput.value.trim();
      const norm = normalizeServiciosDiscoveryLocationInput(raw);
      if (norm !== raw) cityInput.value = norm;
    }
    const fd = new FormData(form);
    writeServiciosDiscoveryPrefs({
      lastQ: String(fd.get("q") ?? "").trim() || undefined,
      lastCity: String(fd.get("city") ?? "").trim() || undefined,
      lastGroup: String(fd.get("group") ?? "").trim() || undefined,
    });
    const snap: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string" && v.trim()) snap[String(k)] = v.trim().slice(0, 240);
    }
    void fetch("/api/clasificados/servicios/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingSlug: null,
        eventType: "filter_change",
        meta: { path: "/clasificados/servicios/resultados", form: snap },
      }),
    }).catch(() => {});
  };
}

function ServiciosResultsFiltersCompact({
  lang,
  current,
  perPage,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
  perPage: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [stateTouched, setStateTouched] = useState(false);
  const [countryTouched, setCountryTouched] = useState(false);
  const resetHref = `${RESULTS_PATH}?lang=${lang}`;
  const hasFilters = serviciosResultsHasActiveFilters(current);
  const hasAdvancedFilters = serviciosResultsHasAdvancedDrawerFilters(current);
  const urlHadState = Boolean(current.state?.trim());
  const urlHadCountry = Boolean(current.country?.trim() && !isLeonixLbUsCountry(current.country));

  useEffect(() => {
    setStateTouched(false);
    setCountryTouched(false);
  }, [current.q, current.city, current.state, current.zip, current.country, current.group]);

  const onSubmitCapture = createServiciosResultsFormSubmitCapture();

  const onFormSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSubmitCapture(e);
    const fd = new FormData(e.currentTarget);
    const parsed = parseServiciosFilterFormData(fd);
    const perPageVal = String(fd.get("perPage") ?? perPage).trim();
    router.push(
      buildServiciosResultsBrowseHref(
        lang,
        {
          q: parsed.q ?? "",
          city: parsed.city ?? "",
          state: parsed.state ?? LEONIX_LB_DEFAULT_STATE,
          zip: parsed.zip ?? "",
          country: parsed.country ?? LEONIX_LB_DEFAULT_COUNTRY,
        },
        parsed,
        { urlHadState, urlHadCountry, stateTouched, countryTouched },
        perPageVal && perPageVal !== "12" ? { perPage: perPageVal } : undefined,
      ),
    );
  };

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    if (drawerOpen) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  const inputClass =
    "min-h-[2.625rem] w-full rounded-lg border border-[#D6C7AD]/90 bg-white px-3 py-2 text-sm text-[#1F241C] outline-none focus:border-[#C9A84A]/70 focus:ring-2 focus:ring-[#C9A84A]/20";

  return (
    <div className="mb-3 border-b border-[#D6C7AD]/50 pb-3">
      <div className="space-y-2.5">
        <LeonixLocalBusinessCompactSearchCanvas
          lang={lang}
          routeLang={lang}
          action={RESULTS_PATH}
          method="get"
          formId={RESULTS_FORM_ID_MOBILE}
          onSubmit={onFormSubmit}
          onSubmitCapture={onSubmitCapture}
          defaultQ={current.q ?? ""}
          defaultCity={current.city ?? ""}
          defaultState={current.state ?? LEONIX_LB_DEFAULT_STATE}
          defaultZip={current.zip ?? ""}
          defaultCountry={current.country ?? LEONIX_LB_DEFAULT_COUNTRY}
          keywordPlaceholder={lang === "en" ? "Service, trade, business…" : "Servicio, giro, negocio…"}
          searchButtonLabel={lang === "en" ? "Search" : "Buscar"}
          showFiltersButton={false}
          cityDatalistId="servicios-results-city-presets"
          onStateChange={() => setStateTouched(true)}
          onCountryChange={() => setCountryTouched(true)}
          secondRow={
            <button
              type="button"
              data-testid="servicios-open-filters-drawer"
              onClick={() => setDrawerOpen(true)}
              className={`${LX_LB_BTN_SECONDARY} relative min-w-[5rem]`}
            >
              {lang === "en" ? "Filters" : "Filtros"}
              {hasAdvancedFilters ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-sm bg-[#7A1E2C]" aria-hidden />
              ) : null}
            </button>
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">
            {lang === "en" ? "Show" : "Mostrar"}
          </span>
          <label className="min-w-0">
            <span className="sr-only">{lang === "en" ? "Sort" : "Ordenar"}</span>
            <select name="sort" form={RESULTS_FORM_ID_MOBILE} defaultValue={sortSelectDefault(current)} className={CONTROL_SELECT}>
              <option value="newest">{lang === "en" ? "Newest" : "Más recientes"}</option>
              <option value="most_liked">{lang === "en" ? "Most liked" : "Más gustados"}</option>
              <option value="most_saved">{lang === "en" ? "Most saved" : "Más guardados"}</option>
              <option value="open_now">{lang === "en" ? "Open now" : "Abiertos ahora"}</option>
              <option value="name">{lang === "en" ? "Name (A–Z)" : "Nombre (A–Z)"}</option>
              <option value="rating">{lang === "en" ? "Highest rated" : "Mejor calificados"}</option>
            </select>
          </label>
          <label className="min-w-0">
            <span className="sr-only">{lang === "en" ? "Per page" : "Por página"}</span>
            <select name="perPage" form={RESULTS_FORM_ID_MOBILE} defaultValue={String(perPage)} className={CONTROL_SELECT}>
              {CAT_STD_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <Link href={resetHref} className={LX_LB_BTN_SECONDARY}>
              {lang === "en" ? "Clear filters" : "Limpiar filtros"}
            </Link>
          ) : null}
        </div>

        <div
          className={`fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4 ${drawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!drawerOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-[#142a42]/45 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setDrawerOpen(false)}
            aria-label={lang === "en" ? "Close filters" : "Cerrar filtros"}
          />
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={lang === "en" ? "Filters" : "Filtros"}
            className={`relative z-[61] flex max-h-[min(92vh,760px)] w-full flex-col rounded-t-[22px] border border-[#e5ddd2] bg-[#FFFCF7] shadow-[0_-12px_40px_-8px_rgba(20,38,58,0.35)] transition-transform duration-300 ease-out sm:max-w-xl sm:rounded-2xl ${drawerOpen ? "translate-y-0 sm:scale-100 sm:opacity-100" : "translate-y-[calc(100%+12px)] sm:translate-y-0 sm:scale-95 sm:opacity-0"}`}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#ebe4d9] px-4 py-3">
              <p className="text-base font-bold text-[#142a42]">{lang === "en" ? "Filters" : "Filtros"}</p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className={`${LX_LB_BTN_SECONDARY} min-w-[4.5rem]`}
              >
                {lang === "en" ? "Close" : "Cerrar"}
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              {hasFilters ? (
                <div className="border-b border-[#D6C7AD]/60 pb-3">
                  <Link
                    href={resetHref}
                    onClick={() => setDrawerOpen(false)}
                    className="text-xs font-semibold text-[#7A1E2C] underline underline-offset-2"
                  >
                    {lang === "en" ? "Clear all filters" : "Quitar todos los filtros"}
                  </Link>
                </div>
              ) : null}

              <ServiciosResultsAdvancedFilterFields lang={lang} current={current} formId={RESULTS_FORM_ID_MOBILE} />
            </div>

            <div className="shrink-0 flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] px-4 py-3">
              {hasFilters ? (
                <Link href={resetHref} onClick={() => setDrawerOpen(false)} className={`${LX_LB_BTN_SECONDARY} flex-1 text-center`}>
                  {lang === "en" ? "Clear" : "Limpiar"}
                </Link>
              ) : null}
              <button
                type="submit"
                form={RESULTS_FORM_ID_MOBILE}
                onClick={() => setDrawerOpen(false)}
                className={`${LX_LB_BTN_PRIMARY} ${hasFilters ? "flex-[1.2]" : "w-full"}`}
              >
                {lang === "en" ? "Apply" : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiciosResultsFilters({
  lang,
  current,
  perPage = 12,
}: {
  lang: ServiciosLang;
  current: ServiciosResultsFilterQuery;
  perPage?: number;
}) {
  return <ServiciosResultsFiltersCompact lang={lang} current={current} perPage={perPage} />;
}
