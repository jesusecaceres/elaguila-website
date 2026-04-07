"use client";

import Link from "next/link";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_HUB,
  BR_PUBLICAR_PRIVADO,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { PrivadoApplicationNotice } from "./sections/PrivadoApplicationNotice";

const PREVIEW_BASE = `${BR_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=`;

/**
 * Fase 1 — rama BR Privado: entrada de publicación y documentación de rutas.
 * El formulario y el borrador → preview se conectan en fases posteriores.
 */
export default function BienesRaicesPrivadoApplication() {
  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Leonix · Bienes Raíces · Privado</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#1E1810]">Publicar — Particular</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">
          Misma vitrina premium que Negocio, con contacto simplificado para dueños directos (sin segunda ficha, broker ni bloque
          de marca). Esta página es la entrada del flujo; la plantilla de salida vive en la vista previa pública.
        </p>
        <PrivadoApplicationNotice />
        <div className="mt-5 space-y-2 rounded-xl border border-[#E8DFD0] bg-white/60 px-4 py-3 text-xs text-[#5C5346]">
          <p className="font-bold text-[#1E1810]">Rutas</p>
          <p>
            <span className="font-semibold">Publicar (mismo contenido):</span>{" "}
            <code className="rounded bg-[#F9F6F1] px-1 py-0.5 text-[11px]">{BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}</code> ·{" "}
            <code className="rounded bg-[#F9F6F1] px-1 py-0.5 text-[11px]">{BR_PUBLICAR_PRIVADO}</code>
          </p>
          <p>
            <span className="font-semibold">Plantilla de preview:</span>{" "}
            <code className="rounded bg-[#F9F6F1] px-1 py-0.5 text-[11px]">{BR_PREVIEW_PRIVADO}</code> +{" "}
            <code className="rounded bg-[#F9F6F1] px-1 py-0.5 text-[11px]">{BR_NEGOCIO_Q_PROPIEDAD}</code>
          </p>
        </div>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/80">Ver plantilla por categoría</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={`${PREVIEW_BASE}residencial`}
              className="inline-flex justify-center rounded-xl border border-[#C9B46A]/45 bg-[#FFF6E7] px-3 py-2 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
            >
              Residencial
            </Link>
            <Link
              href={`${PREVIEW_BASE}comercial`}
              className="inline-flex justify-center rounded-xl border border-[#C9B46A]/45 bg-[#FFF6E7] px-3 py-2 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
            >
              Comercial
            </Link>
            <Link
              href={`${PREVIEW_BASE}terreno_lote`}
              className="inline-flex justify-center rounded-xl border border-[#C9B46A]/45 bg-[#FFF6E7] px-3 py-2 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
            >
              Terreno / lote
            </Link>
          </div>
        </div>
        <Link
          href={BR_PUBLICAR_HUB}
          className="mt-6 inline-flex rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-2.5 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
        >
          Volver al hub BR
        </Link>
      </div>
    </main>
  );
}
