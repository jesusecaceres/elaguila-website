"use client";

import type { ViajesTravelModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleAccommodationEditor } from "./ViajesModuleAccommodationEditor";
import { ViajesModuleTransportationEditor } from "./ViajesModuleTransportationEditor";
import { ViajesModuleFoodEditor } from "./ViajesModuleFoodEditor";
import { ViajesModuleActivityEditor } from "./ViajesModuleActivityEditor";
import { ViajesModuleCruiseEditor } from "./ViajesModuleCruiseEditor";
import { ViajesModuleFlightEditor } from "./ViajesModuleFlightEditor";
import { ViajesModuleVacationRentalEditor } from "./ViajesModuleVacationRentalEditor";
import { ViajesModuleCarRentalEditor } from "./ViajesModuleCarRentalEditor";
import { ViajesModuleAddonEditor } from "./ViajesModuleAddonEditor";
import {
  createEmptyViajesModule,
  viajesModuleKindLabel,
  type ViajesModuleKind,
  VIAJES_MODULE_KINDS,
} from "./viajesModuleFactories";

const BTN =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 text-xs font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-40";
const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

function moveItem<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= items.length) return items;
  const next = [...items];
  const tmp = next[index]!;
  next[index] = next[j]!;
  next[j] = tmp;
  return next;
}

function renderEditor(mod: ViajesTravelModule, onChange: (next: ViajesTravelModule) => void) {
  switch (mod.kind) {
    case "accommodation":
      return <ViajesModuleAccommodationEditor value={mod} onChange={onChange} />;
    case "transportation":
      return <ViajesModuleTransportationEditor value={mod} onChange={onChange} />;
    case "food":
      return <ViajesModuleFoodEditor value={mod} onChange={onChange} />;
    case "activity":
      return <ViajesModuleActivityEditor value={mod} onChange={onChange} />;
    case "cruise":
      return <ViajesModuleCruiseEditor value={mod} onChange={onChange} />;
    case "flight":
      return <ViajesModuleFlightEditor value={mod} onChange={onChange} />;
    case "vacation_rental":
      return <ViajesModuleVacationRentalEditor value={mod} onChange={onChange} />;
    case "car_rental":
      return <ViajesModuleCarRentalEditor value={mod} onChange={onChange} />;
    case "addon":
      return <ViajesModuleAddonEditor value={mod} onChange={onChange} />;
  }
}

export function ViajesModuleListEditor({
  modules,
  onChange,
  lang = "es",
  kinds = VIAJES_MODULE_KINDS,
}: {
  modules: ViajesTravelModule[];
  onChange: (next: ViajesTravelModule[]) => void;
  lang?: "es" | "en";
  /** Subset of kinds shown in the add toggles (privado can pass a smaller list). */
  kinds?: ViajesModuleKind[];
}) {
  const es = lang !== "en";

  const updateAt = (index: number, next: ViajesTravelModule) => {
    onChange(modules.map((m, i) => (i === index ? next : m)));
  };

  const removeAt = (index: number) => {
    onChange(modules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={LABEL}>{es ? "Módulos del viaje" : "Travel modules"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              className={BTN}
              onClick={() => onChange([...modules, createEmptyViajesModule(kind)])}
            >
              + {viajesModuleKindLabel(kind, lang)}
            </button>
          ))}
        </div>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-[color:var(--lx-muted)]">
          {es
            ? "Agrega módulos (hotel, transporte, comidas…) según lo que incluye la oferta."
            : "Add modules (hotel, transport, meals…) for what the offer includes."}
        </p>
      ) : null}

      <ul className="space-y-4">
        {modules.map((mod, index) => (
          <li
            key={mod.id}
            className="space-y-2 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 shadow-[0_6px_20px_-14px_rgba(42,36,22,0.12)] sm:p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[color:var(--lx-text)]">
                {viajesModuleKindLabel(mod.kind, lang)}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={BTN}
                  disabled={index === 0}
                  onClick={() => onChange(moveItem(modules, index, -1))}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={BTN}
                  disabled={index >= modules.length - 1}
                  onClick={() => onChange(moveItem(modules, index, 1))}
                >
                  ↓
                </button>
                <button type="button" className={`${BTN} border-red-300/70 text-red-800`} onClick={() => removeAt(index)}>
                  {es ? "Quitar módulo" : "Remove module"}
                </button>
              </div>
            </div>
            {renderEditor(mod, (next) => updateAt(index, next))}
          </li>
        ))}
      </ul>
    </div>
  );
}
