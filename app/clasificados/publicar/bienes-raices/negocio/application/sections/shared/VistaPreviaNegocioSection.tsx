"use client";

import { BR_PREVIEW_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

export function VistaPreviaNegocioSection({ onOpenPreview }: { onOpenPreview: () => void }) {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Vista previa</h2>
      <p className={brSubTitleClass}>
        Guardamos tu borrador en esta sesión y abrimos el mismo diseño aprobado que verán los compradores. Desde el preview
        vuelves aquí con un solo clic para seguir editando.
      </p>
      <p className="mt-2 text-xs text-[#5C5346]/75">
        Ruta del preview: <span className="font-mono text-[#6E5418]">{BR_PREVIEW_NEGOCIO}</span>
      </p>
      <button
        type="button"
        onClick={onOpenPreview}
        className="mt-5 w-full rounded-xl bg-[#B8954A] px-4 py-3.5 text-sm font-bold text-[#1E1810] shadow-[0_8px_24px_-8px_rgba(184,149,74,0.45)] hover:bg-[#C5A059] sm:w-auto sm:min-w-[220px]"
      >
        Ver vista previa
      </button>
    </section>
  );
}
