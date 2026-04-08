import Link from "next/link";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasPrivadoPublishShell } from "@/app/clasificados/rentas/privado/publish/RentasPrivadoPublishShell";
import {
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

const CATEGORIAS = ["residencial", "comercial", "terreno_lote"] as const;

export default function RentasPrivadoPublishEntryContent() {
  return (
    <RentasPrivadoPublishShell>
      <div className="min-h-screen bg-[#D9D9D9] text-[#111111] px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#111111]/10 bg-[#F5F5F5] p-6 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight">Rentas — Privado</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#111111]/80">
            Fase de plantilla: la solicitud completa se conectará después. Por ahora puedes revisar la salida tipo listado y las ranuras para renta.
          </p>
          <p className="mt-3 text-xs text-[#111111]/65">
            URL pública equivalente:{" "}
            <Link href={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY} className="font-medium underline">
              {RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}
            </Link>
          </p>
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#111111]/70">Vista previa (plantilla)</p>
            <ul className="flex flex-col gap-2 text-sm">
              {CATEGORIAS.map((cat) => (
                <li key={cat}>
                  <Link
                    href={`${RENTAS_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(cat)}`}
                    className="font-medium text-[#A98C2A] underline hover:opacity-90"
                  >
                    {cat === "terreno_lote" ? "Terreno / lote" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </RentasPrivadoPublishShell>
  );
}
