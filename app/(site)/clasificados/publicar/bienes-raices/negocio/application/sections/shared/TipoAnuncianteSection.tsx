"use client";

import type { BienesRaicesAdvertiserType, BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrPreviewHint, brCardClass, brHintClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

const OPTIONS: Array<{ id: BienesRaicesAdvertiserType; label: string; hint: string }> = [
  { id: "agente_individual", label: "Agente individual", hint: "Un solo agente como rostro del anuncio." },
  { id: "equipo_agentes", label: "Equipo de agentes", hint: "Marca de equipo con contacto principal y secundario." },
  { id: "oficina_brokerage", label: "Oficina / brokerage", hint: "La oficina lidera la presentación; contactos claros." },
  { id: "constructor_desarrollador", label: "Constructor / desarrollador", hint: "Proyecto nuevo, modelos y centro de ventas." },
];

export function TipoAnuncianteSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>
        ¿Qué tipo de anunciante eres? <span className="text-[#B8954A]">*</span>
      </h2>
      <p className={brSubTitleClass}>Esto define cómo se muestra tu identidad profesional en la vista previa y en el anuncio.</p>
      <BrPreviewHint>
        Activa el módulo de identidad correcto (tarjeta con foto o logo, nombre y datos de confianza en el carril).
      </BrPreviewHint>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const on = state.advertiserType === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setState((s) => ({ ...s, advertiserType: o.id }))}
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
