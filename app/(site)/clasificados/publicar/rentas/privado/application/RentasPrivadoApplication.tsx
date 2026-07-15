"use client";

import { useEffect } from "react";
import { RentasPrivadoPublishShell } from "@/app/clasificados/rentas/privado/publish/RentasPrivadoPublishShell";
import type { OfficialLocale } from "@/app/lib/language";
import { RentasPrivadoForm } from "./RentasPrivadoForm";

/** Rentas Privado — formulario + borrador local; la vista previa lee el mismo borrador. */
export default function RentasPrivadoApplication({ initialLocale }: { initialLocale: OfficialLocale }) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  return (
    <RentasPrivadoPublishShell>
      <RentasPrivadoForm initialLocale={initialLocale} />
    </RentasPrivadoPublishShell>
  );
}
