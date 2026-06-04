"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import {
  COMIDA_LOCAL_FOOD_TYPE_OPTIONS,
  COMIDA_LOCAL_PRICE_LEVEL_OPTIONS,
  COMIDA_LOCAL_SERVICE_OPTIONS,
} from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import type { ComidaLocalFilterOptions } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";

const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";

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

  const current = useMemo(
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
    (next: Partial<typeof current>) => {
      const params = new URLSearchParams();
      const merged = { ...current, ...next };
      if (merged.q) params.set("q", merged.q);
      if (merged.city) params.set("city", merged.city);
      if (merged.foodType) params.set("foodType", merged.foodType);
      if (merged.service) params.set("service", merged.service);
      if (merged.priceLevel) params.set("priceLevel", merged.priceLevel);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/clasificados/comida-local?${qs}` : "/clasificados/comida-local");
      });
    },
    [current, router]
  );

  const clearAll = () => {
    startTransition(() => router.push("/clasificados/comida-local"));
  };

  const hasActive = Boolean(
    current.q || current.city || current.foodType || current.service || current.priceLevel
  );

  return (
    <form
      className="rounded-2xl border border-[#D4C4A8]/80 bg-[#FDF8F0] p-4 shadow-sm"
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/65">
            Buscar
          </span>
          <input
            name="q"
            type="search"
            defaultValue={current.q}
            placeholder="Nombre, comida, ciudad…"
            className={INPUT}
            disabled={pending}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/65">
            Ciudad
          </span>
          <input
            name="city"
            list="comida-local-cities"
            defaultValue={current.city}
            placeholder="Ciudad o zona"
            className={INPUT}
            disabled={pending}
          />
          <datalist id="comida-local-cities">
            {options.cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/65">
            Tipo de comida
          </span>
          <select name="foodType" defaultValue={current.foodType} className={INPUT} disabled={pending}>
            <option value="">Todos</option>
            {COMIDA_LOCAL_FOOD_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/65">
            Servicio
          </span>
          <select name="service" defaultValue={current.service} className={INPUT} disabled={pending}>
            <option value="">Todos</option>
            {COMIDA_LOCAL_SERVICE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/65">
            Precio
          </span>
          <select name="priceLevel" defaultValue={current.priceLevel} className={INPUT} disabled={pending}>
            <option value="">Todos</option>
            {COMIDA_LOCAL_PRICE_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26] disabled:opacity-60"
        >
          {pending ? "Buscando…" : "Aplicar filtros"}
        </button>
        {hasActive ? (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="text-sm font-medium text-[#7A1E2C] hover:underline"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
    </form>
  );
}
