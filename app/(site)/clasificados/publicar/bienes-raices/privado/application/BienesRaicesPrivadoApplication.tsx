"use client";

import { useCallback } from "react";
import {
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_PRIVADO,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { useLeonixPublishFlowExitClear } from "@/app/clasificados/lib/leonixApplicationStandard/useLeonixPublishFlowExitClear";
import { clearBienesRaicesPrivadoDraft } from "./utils/bienesRaicesPrivadoDraft";
import { BienesRaicesPrivadoForm } from "./BienesRaicesPrivadoForm";

/** BR Privado — formulario + borrador local; la vista previa lee el mismo borrador. */
export default function BienesRaicesPrivadoApplication() {
  const isPathInsideFlow = useCallback((p: string) => {
    return (
      p.startsWith(BR_PUBLICAR_PRIVADO) ||
      p.startsWith(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY) ||
      p.startsWith(BR_PREVIEW_PRIVADO)
    );
  }, []);

  const onClear = useCallback(() => {
    clearBienesRaicesPrivadoDraft();
  }, []);

  useLeonixPublishFlowExitClear({
    getSuspend: () => false,
    isPathInsideFlow,
    onClear,
  });

  return <BienesRaicesPrivadoForm />;
}
