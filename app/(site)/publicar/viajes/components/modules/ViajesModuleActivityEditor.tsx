"use client";

import { useId } from "react";
import type { ViajesActivityModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesActivityModule;
  onChange: (value: ViajesActivityModule) => void;
};

export function ViajesModuleActivityEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesActivityModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Actividad</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-name`} label="Nombre" value={value.activityName} onChange={(v) => patch({ activityName: v })} />
        <ViajesModuleTextField id={`${id}-venue`} label="Lugar / venue" value={value.venue} onChange={(v) => patch({ venue: v })} />
        <ViajesModuleTextField id={`${id}-duration`} label="Duración" value={value.duration} onChange={(v) => patch({ duration: v })} />
        <ViajesModuleTextField id={`${id}-dt`} label="Fecha / hora" value={value.dateTime} onChange={(v) => patch({ dateTime: v })} />
        <ViajesModuleTextField id={`${id}-loc`} label="Ubicación" value={value.locationLabel} onChange={(v) => patch({ locationLabel: v })} />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
