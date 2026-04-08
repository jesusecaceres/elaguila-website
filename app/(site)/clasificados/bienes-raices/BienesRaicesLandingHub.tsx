"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";
import { BienesRaicesResultsShell } from "./results/components/BienesRaicesResultsShell";
import { BienesRaicesSearchBar } from "./results/components/BienesRaicesSearchBar";

type QuickItem = { label: string; params: Record<string, string> };

const QUICK_BROWSE: QuickItem[] = [
  { label: "Venta", params: { primary: "venta" } },
  { label: "Renta", params: { primary: "renta" } },
  { label: "Casas", params: { primary: "casas" } },
  { label: "Departamentos", params: { primary: "departamentos" } },
  { label: "Terrenos", params: { primary: "terrenos" } },
  { label: "Comerciales", params: { primary: "comerciales" } },
  { label: "Residencial (estructural)", params: { [BR_NEGOCIO_Q_PROPIEDAD]: "residencial" } },
  { label: "Comercial (estructural)", params: { [BR_NEGOCIO_Q_PROPIEDAD]: "comercial" } },
  { label: "Terreno / lote", params: { [BR_NEGOCIO_Q_PROPIEDAD]: "terreno_lote" } },
  { label: "Nuevo desarrollo", params: { secondary: "nuevo_desarrollo" } },
  { label: "Open House", params: { secondary: "open_house" } },
];

export function BienesRaicesLandingHub() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");

  const runSearch = useCallback(() => {
    const extra: Record<string, string | undefined> = {};
    if (query.trim()) extra.q = query.trim();
    if (propertyType) extra.tipo = propertyType;
    if (priceBand) extra.precio = priceBand;
    if (beds) extra.recs = beds;
    router.push(buildBrResultsUrl(extra));
  }, [beds, priceBand, propertyType, query, router]);

  return (
    <BienesRaicesResultsShell>
      <header className="mb-8 flex flex-col gap-4 border-b border-[#E8DFD0]/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/clasificados"
            className="shrink-0 rounded-full ring-2 ring-[#E8DFD0]/80 ring-offset-2 ring-offset-[#F4EFE6]"
          >
            <Image
              src="/logo.png"
              alt="Leonix"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              priority
            />
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5C5346]">
            <Link href="/clasificados" className="hover:text-[#B8954A]">
              Clasificados
            </Link>
            <span className="text-[#C9B46A]" aria-hidden>
              ›
            </span>
            <span className="text-[#1E1810]">Bienes raíces</span>
          </nav>
        </div>
        <Link
          href={BR_PUBLICAR_HUB}
          className="rounded-full border border-[#C9B46A]/50 bg-[#2A2620] px-4 py-2 text-center text-sm font-semibold text-[#FAF7F2] shadow-sm hover:bg-[#1E1810]"
        >
          Publicar anuncio
        </Link>
      </header>

      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1E1810] sm:text-[2.75rem] sm:leading-tight">
          Bienes Raíces
        </h1>
        <p className="mt-3 text-base text-[#5C5346]/90 sm:text-lg">
          Encuentra casas, departamentos, terrenos y espacios comerciales con claridad y confianza.
        </p>
      </div>

      <div className="mt-8 max-w-5xl">
        <BienesRaicesSearchBar
          query={query}
          onQuery={setQuery}
          propertyType={propertyType}
          onPropertyType={setPropertyType}
          priceBand={priceBand}
          onPriceBand={setPriceBand}
          beds={beds}
          onBeds={setBeds}
          onSearch={runSearch}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={BR_RESULTS}
          className="rounded-xl border border-[#C9B46A]/55 bg-[#2A2620] px-5 py-2.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810]"
        >
          Ver propiedades
        </Link>
        <Link
          href={BR_PUBLICAR_HUB}
          className="rounded-xl border border-[#E8DFD0] bg-[#FDFBF7] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-sm hover:border-[#C9B46A]/45"
        >
          Publicar anuncio
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="br-quick-heading">
        <h2 id="br-quick-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
          Explorar rápido
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#5C5346]/88">
          Entra a resultados filtrados; ajusta después con la barra de búsqueda y fichas.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {QUICK_BROWSE.map((item) => (
            <Link
              key={item.label}
              href={buildBrResultsUrl(item.params)}
              className="rounded-full border border-[#E8DFD0] bg-white/80 px-4 py-2 text-sm font-semibold text-[#3D3630] shadow-sm transition hover:border-[#C9B46A]/55 hover:bg-[#FFFCF7]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-14 text-center text-sm text-[#5C5346]/85">
        Comunidad Leonix · Anuncios moderados ·{" "}
        <Link href="/clasificados" className="font-semibold text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4">
          Volver a Clasificados
        </Link>
      </p>
    </BienesRaicesResultsShell>
  );
}
