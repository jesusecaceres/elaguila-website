"use client";

import Link from "next/link";
import { useState } from "react";
import { createEmptyLeonixBrPrivadoFormState } from "./schema/leonixBrPrivadoFormState";
import { AnuncianteSection } from "./sections/AnuncianteSection";
import { CaracteristicasPrincipalesSection } from "./sections/CaracteristicasPrincipalesSection";
import { ContactoSection } from "./sections/ContactoSection";
import { DescripcionSection } from "./sections/DescripcionSection";
import { FotosYMediosSection } from "./sections/FotosYMediosSection";
import { InformacionPrincipalSection } from "./sections/InformacionPrincipalSection";
import { PresenciaOpcionalSection } from "./sections/PresenciaOpcionalSection";
import { UbicacionSection } from "./sections/UbicacionSection";

/**
 * Vendedor particular — dueño visible del formulario BR privado.
 */
export default function LeonixBRPrivadoApplication() {
  const [state, setState] = useState(createEmptyLeonixBrPrivadoFormState);
  const api = { state, setState };

  return (
    <main className="min-h-screen bg-[#F2F2F2] text-[#111111] pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A98C2A]">Leonix · Bienes Raíces</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Publicar inmueble — particular</h1>
            <p className="mt-2 text-sm text-[#111111]/75">
              Flujo más rápido y limpio para dueños y familias. Sin formulario de inmobiliaria.
            </p>
          </div>
          <Link
            href="/clasificados/publicar"
            className="shrink-0 rounded-xl border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#FAFAFA]"
          >
            Volver a categorías
          </Link>
        </header>

        <div className="space-y-6">
          <InformacionPrincipalSection {...api} />
          <UbicacionSection {...api} />
          <CaracteristicasPrincipalesSection {...api} />
          <FotosYMediosSection {...api} />
          <DescripcionSection {...api} />
          <AnuncianteSection {...api} />
          <ContactoSection {...api} />
          <PresenciaOpcionalSection {...api} />
        </div>

        <p className="mt-10 text-center text-xs text-[#111111]/50">
          Borrador local. La publicación oficial se conecta después.
        </p>
      </div>
    </main>
  );
}
