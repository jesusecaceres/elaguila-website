import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES,
  COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES,
  COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublicInventoryErrors";
import {
  getComidaLocalFilterOptions,
  listPublishedComidaLocalListings,
  parseComidaLocalResultsSearchParams,
} from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import { mapComidaLocalRowToCardVm } from "@/app/lib/clasificados/comida-local/mapComidaLocalPublicListing";
import {
  CL_BTN_PRIMARY,
  CL_CONTAINER,
  CL_EYEBROW,
  CL_HEADER_BAR,
  CL_PAGE,
  CL_PANEL,
  CL_PANEL_SOFT,
} from "./components/comidaLocalCustomerStyles";
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
    <div className={CL_PAGE}>
      <header className={CL_HEADER_BAR}>
        <div className={`${CL_CONTAINER} py-6 sm:py-7`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className={CL_EYEBROW}>Leonix Clasificados · Vendedores locales</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-[#1E1814] sm:text-[1.75rem]">
                Comida Local
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#1E1814]/72">
                Puestos, pop-ups y vendedores de comida en NorCal. Contacto directo — sin comisiones
                de pedidos ni perfil de restaurante.
              </p>
            </div>
            <Link href="/publicar/comida-local" className={`${CL_BTN_PRIMARY} shrink-0 self-start sm:self-auto`}>
              Publicar tu puesto
            </Link>
          </div>
        </div>
      </header>

      <div className={`${CL_CONTAINER} space-y-5 py-6 sm:py-8`}>
        <Suspense
          fallback={<div className={`h-28 ${CL_PANEL_SOFT} animate-pulse`} aria-hidden />}
        >
          <ComidaLocalResultsFilters options={filterOptions} initial={filters} />
        </Suspense>

        {inventoryBlocked && inventory.bannerNote ? (
          <div
            className={`${CL_PANEL} border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950`}
            role="status"
          >
            {inventory.bannerNote}
          </div>
        ) : null}

        {inventory.source === "published" ? (
          <p className="text-sm text-[#1E1814]/60">
            {count === 0 ? (
              hasActiveFilters ? (
                COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES
              ) : (
                COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES
              )
            ) : (
              <span>
                <span className="font-semibold text-[#1E1814]">{count}</span>{" "}
                {count === 1 ? "ficha publicada" : "fichas publicadas"}
              </span>
            )}
          </p>
        ) : inventoryBlocked ? null : (
          <p className="text-sm text-[#1E1814]/60">{COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES}</p>
        )}

        {count > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <li key={card.id} className="min-w-0">
                <ComidaLocalListingCard card={card} />
              </li>
            ))}
          </ul>
        ) : inventory.source === "published" && !hasActiveFilters ? (
          <div className={`${CL_PANEL} px-6 py-10 text-center sm:py-12`}>
            <h2 className="text-lg font-semibold text-[#1E1814]">
              {COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#1E1814]/68">
              Cuando alguien publique su ficha, aparecerá aquí. Si vendes en un puesto o pop-up,
              crea la tuya en minutos.
            </p>
            <Link
              href="/publicar/comida-local"
              className={`${CL_BTN_PRIMARY} mt-5 border-[#7A1E2C] bg-transparent text-[#7A1E2C] hover:bg-[#7A1E2C]/5`}
            >
              Crear mi ficha
            </Link>
          </div>
        ) : inventory.source === "published" && hasActiveFilters ? (
          <div className={`${CL_PANEL} px-6 py-8 text-center`}>
            <p className="text-sm text-[#1E1814]/70">{COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES}</p>
          </div>
        ) : inventoryBlocked ? (
          <div
            className={`${CL_PANEL} border-amber-200/90 bg-amber-50/80 px-6 py-10 text-center`}
            role="status"
          >
            <p className="text-sm font-medium text-amber-950">
              {inventory.bannerNote ?? COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-xs text-amber-900/75">
              Estamos trabajando para restaurar los resultados. Intenta de nuevo en unos minutos.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
