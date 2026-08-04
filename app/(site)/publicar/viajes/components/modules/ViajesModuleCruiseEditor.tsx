"use client";

import { useId } from "react";
import type { ViajesCruiseModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesCruiseModule;
  onChange: (value: ViajesCruiseModule) => void;
};

export function ViajesModuleCruiseEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesCruiseModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Crucero</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-ship`} label="Barco" value={value.ship} onChange={(v) => patch({ ship: v })} />
        <ViajesModuleTextField id={`${id}-dep`} label="Puerto de salida" value={value.departurePort} onChange={(v) => patch({ departurePort: v })} />
        <ViajesModuleTextField id={`${id}-ret`} label="Puerto de regreso" value={value.returnPort} onChange={(v) => patch({ returnPort: v })} />
        <ViajesModuleTextField id={`${id}-nights`} label="Noches" value={value.nights} onChange={(v) => patch({ nights: v })} />
        <ViajesModuleTextField id={`${id}-cabin`} label="Nota de camarote" value={value.cabinNote} onChange={(v) => patch({ cabinNote: v })} />
        <ViajesModuleTextField id={`${id}-ports`} label="Puertos / escalas" value={value.portsStops} onChange={(v) => patch({ portsStops: v })} />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
