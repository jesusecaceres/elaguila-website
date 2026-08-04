"use client";

import type { ViajesItineraryItem } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { createEmptyViajesItineraryItem } from "./viajesModuleFactories";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesItineraryItem[];
  onChange: (value: ViajesItineraryItem[]) => void;
};

const BTN =
  "inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-2.5 text-[11px] font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-40";
const BTN_PRIMARY =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-3 text-xs font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]";

function moveItem(items: ViajesItineraryItem[], index: number, dir: -1 | 1): ViajesItineraryItem[] {
  const j = index + dir;
  if (j < 0 || j >= items.length) return items;
  const next = [...items];
  const tmp = next[index]!;
  next[index] = next[j]!;
  next[j] = tmp;
  return next;
}

export function ViajesModuleItineraryEditor({ value, onChange }: Props) {
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[color:var(--lx-text)]">Itinerario</h3>
        <button type="button" className={BTN_PRIMARY} onClick={() => onChange([...value, createEmptyViajesItineraryItem()])}>
          Agregar día
        </button>
      </div>
      {!value.length ? <p className="text-xs text-[color:var(--lx-muted)]">Agrega días o segmentos del itinerario.</p> : null}
      <ul className="space-y-3">
        {value.map((item, index) => {
          const patch = (partial: Partial<ViajesItineraryItem>) => {
            onChange(value.map((x) => (x.id === item.id ? { ...x, ...partial } : x)));
          };
          return (
            <li key={item.id} className={CARD}>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <button type="button" className={BTN} disabled={index === 0} onClick={() => onChange(moveItem(value, index, -1))}>
                  ↑
                </button>
                <button
                  type="button"
                  className={BTN}
                  disabled={index >= value.length - 1}
                  onClick={() => onChange(moveItem(value, index, 1))}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${BTN} border-red-300/70 text-red-800`}
                  onClick={() => onChange(value.filter((x) => x.id !== item.id))}
                >
                  Quitar
                </button>
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ViajesModuleTextField
                    id={`itin-${item.id}-day`}
                    label="Día / etiqueta"
                    value={item.dayLabel}
                    onChange={(v) => patch({ dayLabel: v })}
                    placeholder={`Día ${index + 1}`}
                  />
                  <ViajesModuleTextField
                    id={`itin-${item.id}-title`}
                    label="Título"
                    value={item.title}
                    onChange={(v) => patch({ title: v })}
                  />
                  <ViajesModuleTextField
                    id={`itin-${item.id}-loc`}
                    label="Ubicación"
                    value={item.locationLabel}
                    onChange={(v) => patch({ locationLabel: v })}
                  />
                  <ViajesModuleTextField
                    id={`itin-${item.id}-image`}
                    label="ID de imagen (opcional)"
                    value={item.imageId ?? ""}
                    onChange={(v) => patch({ imageId: v || null })}
                  />
                </div>
                <ViajesModuleTextField
                  id={`itin-${item.id}-desc`}
                  label="Descripción"
                  value={item.description}
                  onChange={(v) => patch({ description: v })}
                  multiline
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
