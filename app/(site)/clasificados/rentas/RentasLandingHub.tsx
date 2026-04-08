"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BienesRaicesResultsShell } from "@/app/clasificados/bienes-raices/results/components/BienesRaicesResultsShell";
import { BienesRaicesSearchBar } from "@/app/clasificados/bienes-raices/results/components/BienesRaicesSearchBar";
import {
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
  RENTAS_RESULTS,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

const QUICK = [
  { label: "Residencial", params: { tipo: "residencial" } },
  { label: "Comercial", params: { tipo: "comercial" } },
  { label: "Terreno", params: { tipo: "terreno" } },
];

export function RentasLandingHub() {
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
    router.push(buildRentasResultsUrl(extra));
  }, [beds, priceBand, propertyType, query, router]);

  return (
    <BienesRaicesResultsShell>
      <header className="mb-8 flex flex-col gap-4 border-b border-[#E8DFD0]/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            href="/clasificados"
            className="shrink-0 rounded-full ring-2 ring-[#E8DFD0]/80 ring-offset-2 ring-offset-[#F4EFE6]"
          >
            <Image src="/logo.png" alt="Leonix" width={40} height={40} className="h-10 w-10 rounded-full object-cover" priority />
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5C5346]">
            <Link href="/clasificados" className="hover:text-[#B8954A]">
              Clasificados
            </Link>
            <span className="text-[#C9B46A]" aria-hidden>
              ›
            </span>
            <span className="text-[#1E1810]">Rentas</span>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={RENTAS_PUBLICAR_PRIVADO}
            className="rounded-full border border-[#C9B46A]/50 bg-[#2A2620] px-4 py-2 text-center text-sm font-semibold text-[#FAF7F2] shadow-sm hover:bg-[#1E1810]"
          >
            Publicar — Privado
          </Link>
          <Link
            href={RENTAS_PUBLICAR_NEGOCIO}
            className="rounded-full border border-[#E8DFD0] bg-[#FDFBF7] px-4 py-2 text-center text-sm font-bold text-[#1E1810] shadow-sm hover:border-[#C9B46A]/45"
          >
            Publicar — Negocio
          </Link>
        </div>
      </header>

      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1E1810] sm:text-[2.75rem] sm:leading-tight">
          Rentas
        </h1>
        <p className="mt-3 text-base text-[#5C5346]/90 sm:text-lg">
          Explora rentas residenciales, comerciales y terrenos. Los resultados viven en una ruta aparte de la vista previa de publicación.
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
          href={RENTAS_RESULTS}
          className="rounded-xl border border-[#C9B46A]/55 bg-[#2A2620] px-5 py-2.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810]"
        >
          Ver resultados
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="rentas-quick-heading">
        <h2 id="rentas-quick-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
          Explorar rápido
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#5C5346]/88">Atajos a la cuadrícula de resultados (filtros propios de Rentas en evolución).</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {QUICK.map((item) => (
            <Link
              key={item.label}
              href={buildRentasResultsUrl(item.params)}
              className="rounded-full border border-[#E8DFD0] bg-white/80 px-4 py-2 text-sm font-semibold text-[#3D3630] shadow-sm transition hover:border-[#C9B46A]/55 hover:bg-[#FFFCF7]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-14 text-center text-sm text-[#5C5346]/85">
        Comunidad Leonix ·{" "}
        <Link href="/clasificados" className="font-semibold text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4">
          Volver a Clasificados
        </Link>
      </p>
    </BienesRaicesResultsShell>
  );
}
