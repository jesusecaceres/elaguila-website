"use client";

import Link from "next/link";
import { useState } from "react";
import { createEmptyLeonixBrNegocioFormState } from "./schema/leonixBrNegocioFormState";
import { AgentePrincipalSection } from "./sections/AgentePrincipalSection";
import { CaracteristicasPrincipalesSection } from "./sections/CaracteristicasPrincipalesSection";
import { ContactoCTASection } from "./sections/ContactoCTASection";
import { DescripcionMarketingSection } from "./sections/DescripcionMarketingSection";
import { EquipoAdicionalSection } from "./sections/EquipoAdicionalSection";
import { ExteriorSection } from "./sections/ExteriorSection";
import { FotosYMediosSection } from "./sections/FotosYMediosSection";
import { InformacionPrincipalSection } from "./sections/InformacionPrincipalSection";
import { InteriorSection } from "./sections/InteriorSection";
import { NegocioSection } from "./sections/NegocioSection";
import { RedesYEnlacesSection } from "./sections/RedesYEnlacesSection";
import { ServiciosComunidadSection } from "./sections/ServiciosComunidadSection";
import { TipoPublicacionSection } from "./sections/TipoPublicacionSection";
import { UbicacionSection } from "./sections/UbicacionSection";

/**
 * Propiedad (inmueble) + negocio / agente / rail — dueño visible del formulario BR negocio.
 */
export default function LeonixBRNegocioApplication() {
  const [state, setState] = useState(createEmptyLeonixBrNegocioFormState);
  const api = { state, setState };

  return (
    <main className="min-h-screen bg-[#E8E8E8] text-[#111111] pt-24 pb-20">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A98C2A]">Leonix · Bienes Raíces</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Publicar inmueble — negocio</h1>
            <p className="mt-2 max-w-xl text-sm text-[#111111]/75">
              Formulario completo para inmobiliarias y equipos comerciales. La vista previa y la publicación se conectan después; aquí capturamos todo con claridad.
            </p>
          </div>
          <Link
            href="/clasificados/publicar"
            className="shrink-0 rounded-xl border border-black/12 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5]"
          >
            Volver a categorías
          </Link>
        </header>

        <div className="space-y-6">
          <TipoPublicacionSection {...api} />
          <InformacionPrincipalSection {...api} />
          <UbicacionSection {...api} />
          <CaracteristicasPrincipalesSection {...api} />
          <InteriorSection {...api} />
          <ExteriorSection {...api} />
          <ServiciosComunidadSection {...api} />
          <FotosYMediosSection {...api} />
          <DescripcionMarketingSection {...api} />
          <NegocioSection {...api} />
          <AgentePrincipalSection {...api} />
          <EquipoAdicionalSection {...api} />
          <RedesYEnlacesSection {...api} />
          <ContactoCTASection {...api} />
        </div>

        <p className="mt-10 text-center text-xs text-[#111111]/50">
          Borrador local en el navegador. La publicación oficial se conectará en la siguiente capa del producto.
        </p>
      </div>
    </main>
  );
}
