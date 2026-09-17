"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { normalizeLang } from "@/app/lib/language";
import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
} from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import type {
  ComidaLocalFilterOptions,
  ComidaLocalResultsFilters as ComidaLocalResultsFilterState,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { buildComidaLocalResultsHref } from "@/app/lib/clasificados/comida-local/comidaLocalResultsUrl";
import { comidaLocalFiltersToSavedSearch } from "@/app/lib/saved-search/comida-local/savedSearchComidaLocalAdapter";
import { SavedSearchButton } from "@/app/(site)/clasificados/components/savedSearch/SavedSearchButton";
import { CL_BTN_PRIMARY, CL_INPUT, CL_PANEL_SOFT, CL_SECTION_TITLE } from "./comidaLocalCustomerStyles";

type Props = {
  options: ComidaLocalFilterOptions;
  initial: {
    q: string;
    city: string;
    foodType: string;
    service: string;
    priceLevel: string;
  };
};

export function ComidaLocalResultsFilters({ options, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const routeLang = normalizeLang(searchParams?.get("lang")) === "en" ? "en" : "es";

  const current: ComidaLocalResultsFilterState = useMemo(
    () => ({
      q: searchParams?.get("q") ?? initial.q,
      city: searchParams?.get("city") ?? initial.city,
      foodType: searchParams?.get("foodType") ?? initial.foodType,
      service: searchParams?.get("service") ?? initial.service,
      priceLevel: searchParams?.get("priceLevel") ?? initial.priceLevel,
    }),
    [searchParams, initial]
  );

  const pushFilters = useCallback(
    (next: Partial<ComidaLocalResultsFilterState>) => {
      // Gate COMIDA-LOCAL-2 — the query string is now built by the shared
      // `buildComidaLocalResultsHref`, the same function the Saved Search results-URL builder and
      // the owner dashboard use, so a reconstructed saved-search URL cannot drift from the one this
      // form produces. Behavior is unchanged: empty values are still omitted.
      startTransition(() => {
        router.push(buildComidaLocalResultsHref({ ...current, ...next }, routeLang));
      });
    },
    [current, router, routeLang]
  );

  const clearAll = () => {
    startTransition(() =>
      router.push(
        buildComidaLocalResultsHref(
          { q: "", city: "", foodType: "", service: "", priceLevel: "" },
          routeLang,
        ),
      ),
    );
  };

  const hasActive = Boolean(
    current.q || current.city || current.foodType || current.service || current.priceLevel
  );

  return (
    <form
      className={`${CL_PANEL_SOFT} p-3 sm:p-4`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        pushFilters({
          q: String(fd.get("q") ?? "").trim(),
          city: String(fd.get("city") ?? "").trim(),
          foodType: String(fd.get("foodType") ?? "").trim(),
          service: String(fd.get("service") ?? "").trim(),
          priceLevel: String(fd.get("priceLevel") ?? "").trim(),
        });
      }}
    >
      <p className={`${CL_SECTION_TITLE} mb-3`}>Filtrar resultados</p>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block sm:col-span-2 lg:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            Buscar
          </span>
          <input
            name="q"
            type="search"
            defaultValue={current.q}
            placeholder="Nombre, comida, ciudad…"
            className={CL_INPUT}
            disabled={pending}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            Ciudad
          </span>
          <input
            name="city"
            list="comida-local-cities"
            defaultValue={current.city}
            placeholder="Ciudad"
            className={CL_INPUT}
            disabled={pending}
          />
          <datalist id="comida-local-cities">
            {options.cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            Comida
          </span>
          <select name="foodType" defaultValue={current.foodType} className={CL_INPUT} disabled={pending}>
            <option value="">Todos</option>
            {COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.labelEs}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            Servicio
          </span>
          <select name="service" defaultValue={current.service} className={CL_INPUT} disabled={pending}>
            <option value="">Todos</option>
            {COMIDA_LOCAL_SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.labelEs}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            Precio
          </span>
          <select name="priceLevel" defaultValue={current.priceLevel} className={CL_INPUT} disabled={pending}>
            <option value="">Todos</option>
            {COMIDA_LOCAL_PRICE_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button type="submit" disabled={pending} className={`${CL_BTN_PRIMARY} min-h-[38px] px-3.5 py-1.5 text-[13px]`}>
          {pending ? "Buscando…" : "Aplicar"}
        </button>
        {hasActive ? (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="text-[13px] font-medium text-[#7A1E2C] hover:underline"
          >
            Limpiar
          </button>
        ) : null}
        {/* Gate COMIDA-LOCAL-2 — the shared Saved Search CTA, fed the live filter state this
            component is actually browsing with (`current`), translated by the category adapter.
            No category-local Saved Search logic lives here. */}
        <div className="ml-auto">
          <SavedSearchButton
            normalized={comidaLocalFiltersToSavedSearch(current)}
            lang={routeLang}
          />
        </div>
      </div>
    </form>
  );
}
