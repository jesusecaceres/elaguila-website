"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BienesRaicesPrivadoPreviewView } from "@/app/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView";
import {
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasPrivadoTemplateVm } from "../model/buildRentasPrivadoTemplateVm";

const PREVIEW_CATEGORIAS = ["residencial", "comercial", "terreno_lote"] as const;

export default function RentasPrivadoTemplatePreviewClient() {
  const searchParams = useSearchParams();
  const categoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const vm = useMemo(() => buildRentasPrivadoTemplateVm(categoria), [categoria]);

  return (
    <>
      <div
        className="border-b px-4 py-2 text-center text-[11px] text-[#5C5346]"
        style={{ background: "rgba(253, 251, 247, 0.96)", borderColor: "rgba(61, 54, 48, 0.12)" }}
      >
        <span className="font-semibold text-[#2C2416]">Plantilla Rentas Privado</span>
        <span className="mx-2 opacity-40">·</span>
        <span className="opacity-90">Categoría:</span>{" "}
        {PREVIEW_CATEGORIAS.map((key, i) => (
          <span key={key}>
            {i > 0 ? <span className="opacity-40"> · </span> : null}
            <Link
              href={`${RENTAS_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(key)}`}
              className={key === categoria ? "font-bold underline" : "underline opacity-80 hover:opacity-100"}
              prefetch={false}
            >
              {key.replace("_", " ")}
            </Link>
          </span>
        ))}
      </div>
      <BienesRaicesPrivadoPreviewView
        vm={vm}
        editHref={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}
        previewNavHubLabel="Rentas"
      />
    </>
  );
}
