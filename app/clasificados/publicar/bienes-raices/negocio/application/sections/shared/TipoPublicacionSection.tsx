"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import type { BienesRaicesPublicationType } from "../../schema/bienesRaicesNegocioFormState";
import { BrPreviewHint, brCardClass, brHintClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

const OPTIONS: Array<{ id: BienesRaicesPublicationType; label: string; hint: string }> = [
  { id: "residencial_venta", label: "Residencial en venta", hint: "Casas, condos, townhomes en venta." },
  { id: "residencial_renta", label: "Residencial en renta", hint: "Rentas residenciales." },
  { id: "comercial", label: "Comercial", hint: "Locales, oficinas, naves, edificios." },
  { id: "terreno", label: "Terreno", hint: "Lotes y terrenos." },
  { id: "proyecto_nuevo", label: "Proyecto nuevo", hint: "Desarrollos y preventa." },
  { id: "multifamiliar_inversion", label: "Multifamiliar / inversión", hint: "Rentas, ocupación y métricas de inversión." },
];

export function TipoPublicacionSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>¿Qué deseas publicar?</h2>
      <p className={brSubTitleClass}>Define qué campos extra verás más adelante (por ejemplo proyecto nuevo o inversión).</p>
      <BrPreviewHint>
        Ajusta las filas de datos clave y los extras del listado (proyecto, multifamiliar) en la zona de hechos del preview.
      </BrPreviewHint>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const on = state.publicationType === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setState((s) => ({ ...s, publicationType: o.id }))}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                on
                  ? "border-[#C9B46A] bg-[#FBF7EF] ring-2 ring-[#C9B46A]/35"
                  : "border-[#E8DFD0] bg-white hover:border-[#D4C4A8]"
              }`}
            >
              <span className="font-bold text-[#1E1810]">{o.label}</span>
              <p className={brHintClass}>{o.hint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
