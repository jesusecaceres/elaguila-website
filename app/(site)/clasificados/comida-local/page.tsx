import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES,
  COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors";
import {
  getComidaLocalFilterOptions,
  listPublishedComidaLocalListings,
  parseComidaLocalResultsSearchParams,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import { mapComidaLocalRowToCardVm } from "@/app/lib/clasificados/comida-local/mapComidaLocalPublicListing";
import { ComidaLocalListingCard } from "./components/ComidaLocalListingCard";
import { ComidaLocalResultsFilters } from "./components/ComidaLocalResultsFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Comida Local | Leonix",
  description:
    "Encuentra puestos, pop-ups y vendedores locales de comida en el norte de California.",
  alternates: { canonical: "/clasificados/comida-local" },
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComidaLocalResultsPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const filters = parseComidaLocalResultsSearchParams(sp);
  const [inventory, filterOptions] = await Promise.all([
    listPublishedComidaLocalListings(filters),
    getComidaLocalFilterOptions(),
  ]);

  const cards = inventory.rows.map((row) => mapComidaLocalRowToCardVm(row));
  const count = cards.length;
  const hasActiveFilters = !!(
    filters.q ||
    filters.city ||
    filters.foodType ||
    filters.service ||
    filters.priceLevel
  );
  const inventoryBlocked =
    inventory.source === "inventory_table_missing" ||
    inventory.source === "inventory_unavailable" ||
    inventory.source === "inventory_query_failed";

  return (
    <div className="min-h-screen bg-[#FFFCF7] pb-16">
      <header className="border-b border-[#D4C4A8]/70 bg-[#FDF8F0]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7A1E2C]">
            Leonix Clasificados
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1E1814] sm:text-3xl">Comida Local</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#1E1814]/75">
            Puestos, pop-ups y vendedores locales de comida en NorCal — contacto directo, sin
            comisiones de pedidos.
          </p>
          <Link
            href="/publicar/comida-local"
            className="mt-4 inline-flex rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26]"
          >
            Publicar tu puesto
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="h-32 rounded-2xl bg-[#FDF8F0] animate-pulse" aria-hidden />}>
          <ComidaLocalResultsFilters options={filterOptions} initial={filters} />
        </Suspense>

        {inventory.bannerNote ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {inventory.bannerNote}
          </p>
        ) : null}

        <p className="text-sm text-[#1E1814]/65">
          {inventory.source === "published"
            ? count === 0
              ? hasActiveFilters
                ? COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES
                : COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES
              : `${count} ${count === 1 ? "ficha" : "fichas"}`
            : inventory.bannerNote ?? "Resultados no disponibles"}
        </p>

        {count > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <li key={card.id} className="min-w-0">
                <ComidaLocalListingCard card={card} />
              </li>
            ))}
          </ul>
        ) : inventory.source === "published" && !hasActiveFilters ? (
          <div className="rounded-2xl border border-[#D4C4A8]/80 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#1E1814]">
              {COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES}
            </h2>
            <p className="mt-2 text-sm text-[#1E1814]/70">
              Cuando alguien publique su ficha de Comida Local, aparecerá aquí. ¿Tienes un puesto o
              pop-up?
            </p>
            <Link
              href="/publicar/comida-local"
              className="mt-5 inline-flex rounded-xl border border-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/5"
            >
              Crear mi ficha
            </Link>
          </div>
        ) : inventory.source === "published" && hasActiveFilters ? (
          <div className="rounded-2xl border border-[#D4C4A8]/80 bg-white px-6 py-10 text-center shadow-sm">
            <p className="text-sm text-[#1E1814]/70">
              {COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES}
            </p>
          </div>
        ) : inventoryBlocked ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-6 py-10 text-center shadow-sm">
            <p className="text-sm font-medium text-amber-950">
              {inventory.bannerNote ?? "Resultados temporalmente no disponibles."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
