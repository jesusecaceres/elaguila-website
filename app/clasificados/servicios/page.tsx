import type { Metadata } from "next";
import Link from "next/link";
import { ServiciosDirectoryLocalSection } from "./ServiciosDirectoryLocalSection";
import { listServiciosPublicListingsFromDb } from "./lib/serviciosPublicListingsServer";

export const metadata: Metadata = {
  title: "Servicios · Leonix Clasificados",
  description: "Directorio de servicios locales (fundación de listados públicos).",
};

type PageProps = { searchParams?: Promise<{ lang?: string }> };

export default async function ClasificadosServiciosDirectoryPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const rows = await listServiciosPublicListingsFromDb();
  const dbSlugList = rows.map((r) => r.slug);

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#3B66AD]">
              Leonix Clasificados
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {lang === "en" ? "Services" : "Servicios"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
              {lang === "en"
                ? "Foundation for public discovery — filters and richer results will layer in next."
                : "Base para descubrimiento público: filtros y resultados más ricos vendrán después."}
            </p>
          </div>
          <Link
            href={`/clasificados/publicar/servicios?lang=${lang}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-[#3D2C12] shadow-sm transition hover:border-[#3B66AD]/35"
          >
            {lang === "en" ? "Create listing" : "Crear anuncio"}
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            {lang === "en" ? "Recent listings" : "Anuncios recientes"}
          </h2>
          {rows.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-white/80 px-4 py-8 text-center text-sm text-neutral-600">
              {lang === "en"
                ? "No public listings yet — publish from the Servicios application when you’re ready."
                : "Aún no hay anuncios públicos: publica desde la aplicación de Servicios cuando estés listo."}
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {rows.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/clasificados/servicios/${encodeURIComponent(r.slug)}?lang=${lang}`}
                    className="flex flex-col rounded-2xl border border-neutral-200/90 bg-white px-4 py-4 shadow-sm transition hover:border-[#3B66AD]/35"
                  >
                    <span className="font-semibold text-neutral-900">{r.business_name}</span>
                    <span className="text-sm text-neutral-600">{r.city}</span>
                    <span className="mt-1 text-xs text-neutral-400">{r.slug}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <ServiciosDirectoryLocalSection lang={lang} dbSlugs={dbSlugList} />
      </div>
    </div>
  );
}
