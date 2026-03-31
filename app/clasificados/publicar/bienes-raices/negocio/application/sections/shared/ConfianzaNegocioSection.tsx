"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrPreviewHint, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

export function ConfianzaNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const t = state.trust;
  const rows: Array<{
    key: keyof BienesRaicesNegocioFormState["trust"];
    label: string;
    hint?: string;
  }> = [
    { key: "mostrarLicencia", label: "Mostrar licencia en el anuncio" },
    { key: "mostrarBrokerage", label: "Mostrar brokerage / marca" },
    { key: "mostrarSitioWeb", label: "Mostrar sitio web" },
    { key: "mostrarRedes", label: "Mostrar redes sociales" },
    {
      key: "confirmarInformacion",
      label: "Confirmo que la información es correcta",
      hint: "Requerido antes de publicar en producción.",
    },
    { key: "confirmarFotos", label: "Confirmo que las fotos representan el inmueble" },
    { key: "confirmarReglas", label: "Acepto las reglas de la plataforma" },
    { key: "confirmarAutorizacion", label: "Confirmo que estoy autorizado para anunciar esta propiedad" },
  ];

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Confianza y cumplimiento</h2>
      <p className={brSubTitleClass}>
        Estas preferencias afectan qué datos profesionales se muestran en la vista previa. Las confirmaciones ayudan a mantener
        calidad en Leonix.
      </p>
      <BrPreviewHint>
        “Mostrar licencia / brokerage / web / redes” filtra lo visible en la tarjeta profesional del preview.
      </BrPreviewHint>
      <div className="mt-5 flex flex-col gap-3">
        {rows.map((r) => (
          <label
            key={r.key}
            className="flex cursor-pointer flex-col gap-1 rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 sm:flex-row sm:items-start sm:gap-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
                checked={t[r.key]}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    trust: { ...s.trust, [r.key]: e.target.checked },
                  }))
                }
              />
              <span className="text-sm font-medium text-[#2C2416]">{r.label}</span>
            </div>
            {r.hint ? <p className="text-xs text-[#5C5346]/75 sm:ml-6">{r.hint}</p> : null}
          </label>
        ))}
      </div>
    </section>
  );
}
