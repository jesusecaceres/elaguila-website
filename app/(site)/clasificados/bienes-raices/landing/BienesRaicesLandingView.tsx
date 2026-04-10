"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
  BR_RESULTS,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";
import { BienesRaicesNegocioCard } from "@/app/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard";
import { BienesRaicesNegocioFeaturedCard } from "@/app/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioFeaturedCard";
import { BienesRaicesMapPreview } from "@/app/clasificados/bienes-raices/resultados/map/BienesRaicesMapPreview";
import { BienesRaicesResultsShell } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell";
import {
  BR_LANDING_QUICK_CHIPS,
  brLandingDestacadas,
  brLandingFeaturedHero,
  brLandingNegocios,
  brLandingPrivado,
  brLandingRecientes,
} from "./bienesRaicesLandingSample";

const CTA_ORANGE =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#C2542D] px-5 py-3 text-center text-sm font-bold text-[#FFFCF7] shadow-[0_10px_28px_-12px_rgba(194,84,45,0.55)] transition hover:bg-[#A84724] active:scale-[0.99] sm:w-auto";
const CTA_ORANGE_SOFT =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-5 py-3 text-center text-sm font-bold text-[#1E1810] shadow-sm transition hover:border-[#C9B46A]/55 sm:w-auto";

function BandHeader({ id, title, subtitle }: { id?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <h2 id={id} className="font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.65rem]">
        {title}
      </h2>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/90">{subtitle}</p> : null}
    </div>
  );
}

function LandingSearchForm({ withLang }: { withLang: (path: string) => string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [operationType, setOperationType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const path = buildBrResultsUrl({
      q: q.trim() || undefined,
      operationType: operationType || undefined,
      city: city.trim() || undefined,
      propertyType: propertyType || undefined,
    });
    router.push(withLang(path));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] p-4 shadow-[0_14px_44px_-24px_rgba(42,36,22,0.28)] sm:p-5"
    >
      <div className="flex flex-col gap-4">
        <label className="min-w-0">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]/75">
            Ubicación o palabras clave
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B8954A]" aria-hidden>
              ⌕
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. Cumbres, San Pedro, centro…"
              autoComplete="off"
              className="w-full rounded-xl border border-[#E8DFD0] bg-white py-3 pl-10 pr-3 text-sm text-[#1E1810] outline-none placeholder:text-[#5C5346]/42 focus:border-[#C9B46A]/65"
            />
          </div>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]/75">
              Operación
            </span>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              <option value="">Venta o renta</option>
              <option value="venta">Venta</option>
              <option value="renta">Renta</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]/75">
              Tipo de propiedad
            </span>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65"
            >
              <option value="">Seleccionar</option>
              <option value="casa">Casa</option>
              <option value="departamento">Departamento</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
            </select>
          </label>
          <label className="sm:col-span-2 lg:col-span-1">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]/75">
              Ciudad o zona
            </span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Monterrey"
              autoComplete="address-level2"
              className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-sm text-[#1E1810] outline-none placeholder:text-[#5C5346]/42 focus:border-[#C9B46A]/65"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-1">
            <button type="submit" className={CTA_ORANGE + " w-full"}>
              Buscar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function ListingBand({
  id,
  title,
  subtitle,
  listings,
  withLang,
}: {
  id: string;
  title: string;
  subtitle?: string;
  listings: typeof brLandingRecientes;
  withLang: (path: string) => string;
}) {
  return (
    <section className="mt-14 sm:mt-16" aria-labelledby={id}>
      <BandHeader title={title} subtitle={subtitle} id={id} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {listings.map((listing) => (
          <BienesRaicesNegocioCard key={listing.id} listing={listing} />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={withLang(BR_RESULTS)} className={CTA_ORANGE_SOFT}>
          Ver más en resultados
        </Link>
      </div>
    </section>
  );
}

export function BienesRaicesLandingView() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") === "en" ? "en" : "es") as Lang;

  const withLang = useMemo(() => {
    return (path: string) => appendLangToPath(path, lang);
  }, [lang]);

  return (
    <BienesRaicesResultsShell>
      <div className="min-w-0 overflow-x-hidden">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">
          <Link href={withLang("/clasificados")} className="hover:text-[#B8954A]">
            Clasificados
          </Link>
          <span className="text-[#C9B46A]" aria-hidden>
            /
          </span>
          <span className="text-[#1E1810]">Bienes Raíces</span>
        </nav>

        <header className="relative border-b border-[#E8DFD0]/70 pb-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6F3A]">Leonix Clasificados</p>
              <h1 className="mt-3 font-serif text-[2.1rem] font-semibold leading-[1.12] tracking-tight text-[#1E1810] sm:text-5xl">
                Bienes Raíces
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[#3D3630]/92 sm:text-lg">
                Encuentra propiedades en venta o renta con claridad y confianza. Un solo lugar para particulares y
                profesionales.
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-md lg:w-auto lg:shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C5346]/75">Publicar</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)} className={CTA_ORANGE_SOFT}>
                  Publicar como Privado
                </Link>
                <Link href={withLang(BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY)} className={CTA_ORANGE}>
                  Publicar como Negocio
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <LandingSearchForm withLang={withLang} />
          </div>
        </header>

        <section className="mt-10" aria-labelledby="br-quick-chips">
          <h2 id="br-quick-chips" className="sr-only">
            Filtros rápidos
          </h2>
          <div className="flex flex-wrap gap-2">
            {BR_LANDING_QUICK_CHIPS.map((chip) => (
              <Link
                key={chip.label}
                href={withLang(buildBrResultsUrl(chip.params))}
                className="rounded-full border border-[#E8DFD0] bg-[#FFFCF7]/95 px-3.5 py-2 text-[13px] font-semibold text-[#3D3630] shadow-sm transition hover:border-[#C9B46A]/55 hover:bg-white"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 sm:mt-16" aria-labelledby="br-featured-hero">
          <BandHeader
            id="br-featured-hero"
            title="Propiedad destacada"
            subtitle="Ejemplo editorial de inventario premium — misma estructura que usarán las fichas publicadas."
          />
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <div className="min-w-0 lg:col-span-7 xl:col-span-8">
              <BienesRaicesNegocioFeaturedCard listing={brLandingFeaturedHero} titleAsLink={false} />
            </div>
            <div className="hidden min-h-0 lg:col-span-5 lg:block xl:col-span-4">
              <BienesRaicesMapPreview />
            </div>
          </div>
          <div className="mt-5 lg:hidden">
            <BienesRaicesMapPreview />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={withLang(buildBrResultsUrl({ operationType: "venta", city: "Monterrey" }))} className={CTA_ORANGE}>
              Ver propiedades
            </Link>
            <Link href={withLang(BR_RESULTS)} className={CTA_ORANGE_SOFT}>
              Explorar resultados
            </Link>
          </div>
        </section>

        <ListingBand
          id="br-band-destacadas"
          title="Destacadas"
          subtitle="Mayor vitrina para anuncios con señales de confianza — sin ocultar el ecosistema completo."
          listings={brLandingDestacadas}
          withLang={withLang}
        />

        <ListingBand
          id="br-band-recientes"
          title="Recientes"
          subtitle="Mezcla representativa de lo que llega al marketplace (demo)."
          listings={brLandingRecientes}
          withLang={withLang}
        />

        <ListingBand
          id="br-band-privado"
          title="Privado"
          subtitle="Particulares con visibilidad clara y trato directo."
          listings={brLandingPrivado}
          withLang={withLang}
        />

        <ListingBand
          id="br-band-negocios"
          title="Negocios"
          subtitle="Inmobiliarias, agentes y desarrolladores — merchandising premium dentro del mismo sitio."
          listings={brLandingNegocios}
          withLang={withLang}
        />

        <section className="mt-16 rounded-2xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#F4EFE6] p-6 shadow-[0_16px_48px_-28px_rgba(42,36,22,0.22)] sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-2xl font-semibold text-[#1E1810] sm:text-3xl">¿Listo para el siguiente paso?</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5C5346]/88">
              Explora todo el inventario con filtros claros, o publica con el flujo que mejor se adapte a ti — particular o
              negocio — sin salir de Leonix.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={withLang(BR_RESULTS)} className={CTA_ORANGE}>
                Explorar todas las propiedades
              </Link>
              <Link href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)} className={CTA_ORANGE_SOFT}>
                Publicar tu propiedad
              </Link>
            </div>
            <p className="mt-8 text-xs text-[#5C5346]/75">
              Leonix Clasificados · Anuncios moderados · Contacto directo entre partes
            </p>
          </div>
        </section>
      </div>
    </BienesRaicesResultsShell>
  );
}
