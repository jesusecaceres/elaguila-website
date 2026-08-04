"use client";

import { useId } from "react";
import type { ViajesFlightModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesFlightModule;
  onChange: (value: ViajesFlightModule) => void;
};

export function ViajesModuleFlightEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesFlightModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Vuelo</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-airline`} label="Aerolínea" value={value.airline} onChange={(v) => patch({ airline: v })} />
        <ViajesModuleTextField id={`${id}-origin`} label="Origen" value={value.origin} onChange={(v) => patch({ origin: v })} />
        <ViajesModuleTextField id={`${id}-dest`} label="Destino" value={value.destination} onChange={(v) => patch({ destination: v })} />
        <ViajesModuleTextField
          id={`${id}-cabin`}
          label="Cabina / equipaje"
          value={value.cabinBaggageNote}
          onChange={(v) => patch({ cabinBaggageNote: v })}
        />
        <ViajesModuleTextField
          id={`${id}-conn`}
          label="Conexiones"
          value={value.connectionNote}
          onChange={(v) => patch({ connectionNote: v })}
        />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
