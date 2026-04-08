"use client";

import { RentasPrivadoPublishShell } from "@/app/clasificados/rentas/privado/publish/RentasPrivadoPublishShell";
import { RentasPrivadoForm } from "./RentasPrivadoForm";

/** Rentas Privado — formulario + borrador local; la vista previa lee el mismo borrador. */
export default function RentasPrivadoApplication() {
  return (
    <RentasPrivadoPublishShell>
      <RentasPrivadoForm />
    </RentasPrivadoPublishShell>
  );
}
