"use client";

import { brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

export function VistaPreviaNegocioSection({ onOpenPreview }: { onOpenPreview: () => void }) {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Vista previa</h2>
      <p className={brSubTitleClass}>
        Guardamos tu borrador en esta sesión y abrimos la vista previa aprobada. Desde ahí puedes volver a editar sin perder el
        flujo.
      </p>
      <button
        type="button"
        onClick={onOpenPreview}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-4 py-3.5 text-sm font-bold text-[#1E1810] shadow-[0_8px_24px_-8px_rgba(184,149,74,0.55)] hover:opacity-95 sm:w-auto sm:min-w-[220px]"
      >
        Ver vista previa
      </button>
    </section>
  );
}
