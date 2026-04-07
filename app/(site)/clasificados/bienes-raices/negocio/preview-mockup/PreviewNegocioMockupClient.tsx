"use client";

import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { buildBrNegocioDesignerDemoVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioDesignerDemoState";

/** Diseño estático para revisión visual; datos demo → mismo componente que la vista previa real. */
export default function PreviewNegocioMockupClient() {
  const vm = buildBrNegocioDesignerDemoVm();
  return <BienesRaicesNegocioPreviewView vm={vm} />;
}
