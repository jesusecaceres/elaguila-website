"use client";

import { useId } from "react";
import type { ViajesCarRentalModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";

type Props = {
  value: ViajesCarRentalModule;
  onChange: (value: ViajesCarRentalModule) => void;
};

export function ViajesModuleCarRentalEditor({ value, onChange }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesCarRentalModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">Renta de auto</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField id={`${id}-pickup`} label="Recogida" value={value.pickupLocation} onChange={(v) => patch({ pickupLocation: v })} />
        <ViajesModuleTextField id={`${id}-drop`} label="Devolución" value={value.dropoffLocation} onChange={(v) => patch({ dropoffLocation: v })} />
        <ViajesModuleTextField id={`${id}-window`} label="Ventana de fechas" value={value.dateWindow} onChange={(v) => patch({ dateWindow: v })} />
        <ViajesModuleTextField id={`${id}-class`} label="Clase de vehículo" value={value.vehicleClass} onChange={(v) => patch({ vehicleClass: v })} />
        <ViajesModuleTextField id={`${id}-cap`} label="Capacidad" value={value.capacity} onChange={(v) => patch({ capacity: v })} />
        <ViajesModuleTextField id={`${id}-provider`} label="Proveedor" value={value.provider} onChange={(v) => patch({ provider: v })} />
        <ViajesModuleTextField id={`${id}-price`} label="Precio desde" value={value.startingPrice} onChange={(v) => patch({ startingPrice: v })} />
        <ViajesModuleTextField id={`${id}-miles`} label="Millaje" value={value.mileageSummary} onChange={(v) => patch({ mileageSummary: v })} />
        <ViajesModuleTextField id={`${id}-fuel`} label="Combustible" value={value.fuelSummary} onChange={(v) => patch({ fuelSummary: v })} />
        <ViajesModuleTextField id={`${id}-age`} label="Edad mínima" value={value.ageRequirement} onChange={(v) => patch({ ageRequirement: v })} />
        <ViajesModuleTextField id={`${id}-dep`} label="Depósito" value={value.depositSummary} onChange={(v) => patch({ depositSummary: v })} />
        <ViajesModuleTextField id={`${id}-cta`} label="URL CTA proveedor" value={value.providerCtaUrl} onChange={(v) => patch({ providerCtaUrl: v })} />
        <ViajesModuleTextField id={`${id}-image`} label="ID de imagen (opcional)" value={value.imageId ?? ""} onChange={(v) => patch({ imageId: v || null })} />
      </div>
      <ViajesModuleTextField id={`${id}-desc`} label="Descripción" value={value.description} onChange={(v) => patch({ description: v })} multiline />
    </div>
  );
}
