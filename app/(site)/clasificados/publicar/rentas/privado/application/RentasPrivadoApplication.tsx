"use client";

import { useEffect } from "react";
import { RentasPrivadoPublishShell } from "@/app/clasificados/rentas/privado/publish/RentasPrivadoPublishShell";
import { RentasPrivadoForm } from "./RentasPrivadoForm";

/** Rentas Privado — formulario + borrador local; la vista previa lee el mismo borrador. */
export default function RentasPrivadoApplication() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <RentasPrivadoPublishShell>
      <RentasPrivadoForm />
    </RentasPrivadoPublishShell>
  );
}
