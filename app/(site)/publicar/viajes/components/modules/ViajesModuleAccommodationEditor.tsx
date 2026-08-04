"use client";

import { useId } from "react";
import type { ViajesAccommodationModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesAccommodationModule;
  onChange: (value: ViajesAccommodationModule) => void;
};

export function ViajesModuleAccommodationEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesAccommodationModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Alojamiento</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-property`} label="Tipo de propiedad" value={value.propertyType} onChange={(v) => patch({ propertyType: v })} />
        <ViajesModuleTextField id={`${id}-room`} label="Habitación / ocupación" value={value.roomOrOccupancy} onChange={(v) => patch({ roomOrOccupancy: v })} />
        <ViajesModuleTextField id={`${id}-nights`} label="Noches" value={value.nights} onChange={(v) => patch({ nights: v })} />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
