"use client";

import { useState } from "react";
import type { BienesRaicesNegocioFormState, DeepDetailGroupKey } from "../../schema/bienesRaicesNegocioFormState";
import { BR_DEEP_FIELD_LABELS, BR_DEEP_HEADINGS } from "../../schema/brDeepDetailMeta";
import { BrField, BrPreviewHint, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

const GROUP_ORDER = Object.keys(BR_DEEP_HEADINGS) as DeepDetailGroupKey[];

export function DetallesCompletosNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const [open, setOpen] = useState<Record<DeepDetailGroupKey, boolean>>(() => {
    const o = {} as Record<DeepDetailGroupKey, boolean>;
    for (const k of GROUP_ORDER) o[k] = k === "tipoYEstilo";
    return o;
  });

  function setDeep(group: DeepDetailGroupKey, key: string, value: string) {
    setState((s) => ({
      ...s,
      deepDetails: {
        ...s.deepDetails,
        [group]: { ...s.deepDetails[group], [key]: value },
      },
    }));
  }

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Detalles completos del inmueble</h2>
      <p className={brSubTitleClass}>
        Cada bloque se traduce a la zona inferior “Detalles completos” de la vista previa. Solo llena lo que tengas a la mano;
        puedes ampliar después.
      </p>
      <BrPreviewHint>
        Esta información se muestra en la sección de detalles completos del preview, agrupada por acordeones.
      </BrPreviewHint>
      <div className="mt-5 space-y-3">
        {GROUP_ORDER.map((group) => {
          const fields = BR_DEEP_FIELD_LABELS[group];
          const expanded = open[group];
          return (
            <div
              key={group}
              className="overflow-hidden rounded-xl border border-[#E8DFD0] bg-white/90 shadow-[0_4px_18px_-8px_rgba(42,36,22,0.12)]"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-bold text-[#1E1810] hover:bg-[#FFFCF7]"
                onClick={() => setOpen((prev) => ({ ...prev, [group]: !prev[group] }))}
                aria-expanded={expanded}
              >
                <span>{BR_DEEP_HEADINGS[group]}</span>
                <span className="text-[#B8954A]" aria-hidden>
                  {expanded ? "−" : "+"}
                </span>
              </button>
              {expanded ? (
                <div className="border-t border-[#E8DFD0]/80 px-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(fields).map(([key, label]) => (
                      <BrField key={key} label={label} hint="Aparece en detalle solo si escribes algo.">
                        <input
                          className={brInputClass}
                          value={state.deepDetails[group][key] ?? ""}
                          onChange={(e) => setDeep(group, key, e.target.value)}
                        />
                      </BrField>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
