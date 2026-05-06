"use client";

import { useEffect } from "react";
import { RentasNegocioPublishShell } from "@/app/clasificados/rentas/negocio/publish/RentasNegocioPublishShell";
import { RentasNegocioForm } from "./RentasNegocioForm";

/** Rentas Negocio — formulario en sesión; vista previa con shell BR Negocio. */
export default function RentasNegocioApplication() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <RentasNegocioPublishShell>
      <RentasNegocioForm />
    </RentasNegocioPublishShell>
  );
}
