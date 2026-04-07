import type { Metadata } from "next";
import Link from "next/link";
import { ServiciosDirectoryLocalSection } from "./ServiciosDirectoryLocalSection";
import { formatServiciosInternalGroupForDiscovery } from "./lib/serviciosInternalGroupDisplay";
import { listServiciosPublicListingsFromDb } from "./lib/serviciosPublicListingsServer";

export const metadata: Metadata = {
  title: "Servicios · Leonix Clasificados",
  description: "Descubre servicios locales en Leonix — base de descubrimiento y listados.",
};

type PageProps = { searchParams?: Promise<{ lang?: string }> };

export default async function ClasificadosServiciosDirectoryPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const rows = await listServiciosPublicListingsFromDb();
  const dbSlugList = rows.map((r) => r.slug);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Discovery hero — light, room for future search */}
        <section
          className="relative overflow-hidden rounded-3xl border border-[#D8C79A]/35 bg-gradient-to-br from-[#3B66AD]/10 via-white to-[#F6F0E2]/50 px-5 py-8 shadow-sm sm:px-8 sm:py-10"
          aria-labelledby="servicios-discovery-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3B66AD]">Leonix Clasificados</p>
          <h1
            id="servicios-discovery-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-[#3D2C12] sm:text-3xl"
          >
            {lang === "en" ? "Find local services" : "Encuentra servicios locales"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
            {lang === "en"
              ? "Browse published business profiles. Search, filters, and richer discovery will layer on this foundation."
              : "Explora perfiles publicados. La búsqueda, filtros y un descubrimiento más rico se apoyarán en esta base."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-dashed border-neutral-300 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-500">
              {lang === "en" ? "Search & filters — next" : "Búsqueda y filtros — próximo"}
            </span>
            <span className="text-xs text-neutral-500">
              {lang === "en"
                ? "Internal business-type groups are stored for future filtering."
                : "Los grupos internos por giro ya se guardan para filtrar después."}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/clasificados/publicar/servicios?lang=${lang}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#3B66AD] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#2f5699]"
            >
              {lang === "en" ? "Create a listing" : "Crear anuncio"}
            </Link>
            <Link
              href={`/clasificados/publicar/servicios/preview?lang=${lang}`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#3D2C12]/20 bg-white px-5 text-sm font-semibold text-[#3D2C12] shadow-sm transition hover:border-[#3B66AD]/40"
            >
              {lang === "en" ? "Preview shell" : "Vista previa"}
            </Link>
          </div>
        </section>

        {/* Starter results grid */}
        <section className="mt-10" aria-labelledby="servicios-results-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="servicios-results-heading" className="text-sm font-bold uppercase tracking-wide text-neutral-500">
              {lang === "en" ? "Listings" : "Anuncios"}
            </h2>
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-4 py-10 text-center text-sm text-neutral-600">
              {lang === "en"
                ? "No public listings yet — publish from the Servicios flow when your profile is ready."
                : "Aún no hay anuncios públicos: publica desde Servicios cuando tu perfil esté listo."}
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {rows.map((r) => {
                const groupLabel = formatServiciosInternalGroupForDiscovery(r.internal_group, lang);
                return (
                  <li key={r.slug}>
                    <Link
                      href={`/clasificados/servicios/${encodeURIComponent(r.slug)}?lang=${lang}`}
                      className="flex h-full min-h-[120px] flex-col rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-[#3B66AD]/35 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {groupLabel ? (
                          <span className="rounded-full bg-[#3B66AD]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2d528d]">
                            {groupLabel}
                          </span>
                        ) : null}
                        {r.leonix_verified ? (
                          <span className="rounded-full border border-[#3B66AD]/25 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#2d528d]">
                            {lang === "en" ? "Leonix Verified" : "Leonix Verificado"}
                          </span>
                        ) : null}
                      </div>
                      <span className="mt-2 text-base font-semibold text-neutral-900">{r.business_name}</span>
                      <span className="text-sm text-neutral-600">{r.city}</span>
                      <span className="mt-auto pt-2 text-xs text-neutral-400">{r.slug}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <ServiciosDirectoryLocalSection lang={lang} dbSlugs={dbSlugList} />
      </div>
    </div>
  );
}
