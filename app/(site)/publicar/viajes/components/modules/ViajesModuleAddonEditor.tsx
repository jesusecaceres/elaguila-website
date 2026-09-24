"use client";

import { useId } from "react";
import type { ViajesAddonModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesAddonModule;
  onChange: (value: ViajesAddonModule) => void;
};

export function ViajesModuleAddonEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesAddonModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Complemento</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-name`} label="Nombre" value={value.name} onChange={(v) => patch({ name: v })} />
        <ViajesModuleTextField
          id={`${id}-price`}
          label="Precio / incluido"
          value={value.priceOrIncluded}
          onChange={(v) => patch({ priceOrIncluded: v })}
        />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
