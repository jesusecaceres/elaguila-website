"use client";

import { useId } from "react";
import type { ViajesFoodModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesFoodModule;
  onChange: (value: ViajesFoodModule) => void;
};

export function ViajesModuleFoodEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesFoodModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Comida</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-meal`} label="Plan / nombre" value={value.mealPlanOrName} onChange={(v) => patch({ mealPlanOrName: v })} />
        <ViajesModuleTextField id={`${id}-qty`} label="Cantidad / frecuencia" value={value.quantityOrFrequency} onChange={(v) => patch({ quantityOrFrequency: v })} />
        <ViajesModuleTextField id={`${id}-diet`} label="Nota dietética" value={value.dietaryNote} onChange={(v) => patch({ dietaryNote: v })} />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
