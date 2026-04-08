"use client";

import { RentasNegocioPublishShell } from "@/app/clasificados/rentas/negocio/publish/RentasNegocioPublishShell";
import { RentasNegocioForm } from "./RentasNegocioForm";

/** Rentas Negocio — formulario en sesión; vista previa con shell BR Negocio. */
export default function RentasNegocioApplication() {
  return (
    <RentasNegocioPublishShell>
      <RentasNegocioForm />
    </RentasNegocioPublishShell>
  );
}
