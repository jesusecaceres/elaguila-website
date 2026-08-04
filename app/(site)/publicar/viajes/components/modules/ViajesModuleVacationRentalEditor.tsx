"use client";

import { useId } from "react";
import type { ViajesVacationRentalModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesVacationRentalModule;
  onChange: (value: ViajesVacationRentalModule) => void;
};

export function ViajesModuleVacationRentalEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesVacationRentalModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Renta vacacional</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-type`} label="Tipo de propiedad" value={value.propertyType} onChange={(v) => patch({ propertyType: v })} />
        <ViajesModuleTextField id={`${id}-cap`} label="Capacidad" value={value.capacity} onChange={(v) => patch({ capacity: v })} />
        <ViajesModuleTextField id={`${id}-bed`} label="Recámaras" value={value.bedrooms} onChange={(v) => patch({ bedrooms: v })} />
        <ViajesModuleTextField id={`${id}-bath`} label="Baños" value={value.baths} onChange={(v) => patch({ baths: v })} />
        <ViajesModuleTextField id={`${id}-amen`} label="Amenidades" value={value.amenitiesNote} onChange={(v) => patch({ amenitiesNote: v })} />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
