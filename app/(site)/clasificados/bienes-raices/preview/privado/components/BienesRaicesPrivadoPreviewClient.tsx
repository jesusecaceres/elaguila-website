"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { BienesRaicesPrivadoPreviewView } from "../BienesRaicesPrivadoPreviewView";
import { buildBienesRaicesPrivadoTemplateVm } from "../model/buildBienesRaicesPrivadoTemplateVm";

export default function BienesRaicesPrivadoPreviewClient() {
  const searchParams = useSearchParams();
  const categoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );
  const vm = useMemo(() => buildBienesRaicesPrivadoTemplateVm(categoria), [categoria]);

  return (
    <BienesRaicesPrivadoPreviewView
      vm={vm}
      editHref={BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}
      footerExtra={`Categoría activa en la URL: ?${BR_NEGOCIO_Q_PROPIEDAD}=${categoria}`}
    />
  );
}
