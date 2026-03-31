"use client";

import Link from "next/link";
import { BR_PUBLICAR_HUB } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { PrivadoApplicationNotice } from "./sections/PrivadoApplicationNotice";

/** Placeholder del flujo privado — misma arquitectura que negocio; implementación en siguiente entrega. */
export default function BienesRaicesPrivadoApplication() {
  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1E1810]">Bienes Raíces — Privado</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">
          Aquí irá el formulario para particulares, alineado con la vista previa de privado. Por ahora usa el hub para elegir
          canal o abre Negocio si publicas como profesional.
        </p>
        <PrivadoApplicationNotice />
        <Link
          href={BR_PUBLICAR_HUB}
          className="mt-6 inline-flex rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-2.5 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8]"
        >
          Volver al hub BR
        </Link>
      </div>
    </main>
  );
}
