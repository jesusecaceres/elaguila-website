"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BienesRaicesResultsShell } from "@/app/clasificados/bienes-raices/results/components/BienesRaicesResultsShell";
import { RENTAS_LANDING } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

/** Category-owned results shell for `/clasificados/rentas/results` (data layer TBD — not preview/detail). */
export function RentasResultsClient() {
  const sp = useSearchParams();
  const q = sp?.toString();

  return (
    <BienesRaicesResultsShell>
      <div className="mx-auto max-w-3xl px-2 py-10 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Rentas · Resultados</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-[#1E1810]">Cuadrícula de rentas</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">
          Capa de descubrimiento separada de{" "}
          <Link href="/clasificados/rentas/preview/privado" className="font-semibold text-[#B8954A] underline">
            vista previa Privado
          </Link>{" "}
          y{" "}
          <Link href="/clasificados/rentas/preview/negocio" className="font-semibold text-[#B8954A] underline">
            vista previa Negocio
          </Link>
          . Aquí conectarán filtros, cards y datos publicados.
        </p>
        {q ? (
          <p className="mt-4 rounded-lg border border-[#E8DFD0] bg-white/80 px-3 py-2 text-left text-xs text-[#5C5346]">
            Query actual: <code className="font-mono text-[11px]">{q}</code>
          </p>
        ) : null}
        <div className="mt-8">
          <Link
            href={RENTAS_LANDING}
            className="inline-flex rounded-full border border-[#C9B46A]/50 bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1E1810]"
          >
            Volver al hub Rentas
          </Link>
        </div>
      </div>
    </BienesRaicesResultsShell>
  );
}
