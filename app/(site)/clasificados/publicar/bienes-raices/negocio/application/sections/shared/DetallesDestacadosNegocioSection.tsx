"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { isBrNegocioHighlightKeyApplicable } from "../../schema/brNegocioBranching";
import { BR_HIGHLIGHT_PRESET_DEFS } from "../../schema/brHighlightMeta";
import { BrField, BrPreviewHint, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

export function DetallesDestacadosNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Detalles destacados</h2>
      <p className={brSubTitleClass}>
        Marca lo que aplica; se muestra en la tarjeta “Características destacadas” de la vista previa. Puedes agregar líneas
        personalizadas.
      </p>
      <BrPreviewHint>Cada opción marcada y cada línea personalizada se listan en la tarjeta de destacados del preview.</BrPreviewHint>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {BR_HIGHLIGHT_PRESET_DEFS.filter((d) =>
          isBrNegocioHighlightKeyApplicable(d.key, state.publicationType)
        ).map((d) => (
          <label key={d.key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
              checked={!!state.highlightPresets[d.key]}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  highlightPresets: { ...s.highlightPresets, [d.key]: e.target.checked },
                }))
              }
            />
            <span className="text-sm font-medium text-[#2C2416]">{d.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-6">
        <BrField label="Destacados personalizados (uno por línea)" hint="Ej. Bodega climatizada, paneles nuevos, etc.">
          <textarea
            className={brInputClass + " min-h-[88px]"}
            value={state.customHighlightsText}
            onChange={(e) => setState((s) => ({ ...s, customHighlightsText: e.target.value }))}
            placeholder="Una idea por renglón"
          />
        </BrField>
      </div>
    </section>
  );
}
