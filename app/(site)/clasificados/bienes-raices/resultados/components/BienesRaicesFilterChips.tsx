"use client";

import type { BrPrimaryChipId, BrSecondaryChipId } from "../search/filterTypes";

const PRIMARY: { id: BrPrimaryChipId; label: string }[] = [
  { id: "casas", label: "Casas" },
  { id: "departamentos", label: "Departamentos" },
  { id: "venta", label: "Venta" },
  { id: "renta", label: "Renta" },
  { id: "comerciales", label: "Comerciales" },
  { id: "terrenos", label: "Terrenos" },
];

const SECONDARY: { id: BrSecondaryChipId; label: string }[] = [
  { id: "piscina", label: "Con piscina" },
  { id: "mascotas", label: "Aceptan mascotas" },
  { id: "nuevo_desarrollo", label: "Nuevo desarrollo" },
  { id: "open_house", label: "Open House" },
  { id: "reducida", label: "Reducida" },
  { id: "tour_virtual", label: "Tour virtual" },
  { id: "planos", label: "Planos disponibles" },
  { id: "financiamiento", label: "Financiamiento" },
  { id: "segundo_agente", label: "Segundo agente" },
];

type Props = {
  primary: Set<BrPrimaryChipId>;
  secondary: Set<BrSecondaryChipId>;
  onTogglePrimary: (id: BrPrimaryChipId) => void;
  onToggleSecondary: (id: BrSecondaryChipId) => void;
};

function chipClass(on: boolean) {
  return (
    "rounded-full border px-3 py-1.5 text-xs font-semibold transition " +
    (on
      ? "border-[#C9B46A]/70 bg-[#FFF6E7] text-[#6E5418] shadow-[0_2px_8px_rgba(184,149,74,0.15)]"
      : "border-[#E8DFD0] bg-[#FDFBF7]/90 text-[#5C5346] hover:border-[#D4C4A8]")
  );
}

export function BienesRaicesFilterChips({ primary, secondary, onTogglePrimary, onToggleSecondary }: Props) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRIMARY.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onTogglePrimary(c.id)}
            className={chipClass(primary.has(c.id))}
          >
            {c.label}
          </button>
        ))}
        <button type="button" className={chipClass(false) + " border-dashed"}>
          Más filtros
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {SECONDARY.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggleSecondary(c.id)}
            className={chipClass(secondary.has(c.id)) + " py-1 text-[11px]"}
          >
            {c.label}
          </button>
        ))}
        <span className="ml-1 rounded-full border border-[#E8DFD0] bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#5C5346]">
          519
        </span>
      </div>
    </div>
  );
}
