"use client";

import { useId } from "react";
import type { ViajesAccommodationModule } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { ViajesModuleTextField, viajesModuleFieldClass } from "./viajesModuleFieldUi";
import { viajesModL } from "./viajesModuleEditorCopy";

type Props = {
  value: ViajesAccommodationModule;
  onChange: (value: ViajesAccommodationModule) => void;
  lang?: "es" | "en";
};

export function ViajesModuleAccommodationEditor({ value, onChange, lang = "es" }: Props) {
  const id = useId();
  const patch = (partial: Partial<ViajesAccommodationModule>) => onChange({ ...value, ...partial });
  const { CARD } = viajesModuleFieldClass;
  const L = (es: string, en: string) => viajesModL(lang, es, en);

  return (
    <div className={`${CARD} space-y-3`}>
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
        {L("Alojamiento", "Accommodation")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViajesModuleTextField
          id={`${id}-property`}
          label={L("Tipo de propiedad", "Property type")}
          value={value.propertyType}
          onChange={(v) => patch({ propertyType: v })}
        />
        <ViajesModuleTextField
          id={`${id}-room`}
          label={L("Habitación / ocupación", "Room / occupancy")}
          value={value.roomOrOccupancy}
          onChange={(v) => patch({ roomOrOccupancy: v })}
        />
        <ViajesModuleTextField
          id={`${id}-nights`}
          label={L("Noches", "Nights")}
          value={value.nights}
          onChange={(v) => patch({ nights: v })}
        />
        <ViajesModuleTextField
          id={`${id}-image`}
          label={L("ID de imagen (opcional)", "Image ID (optional)")}
          value={value.imageId ?? ""}
          onChange={(v) => patch({ imageId: v || null })}
        />
      </div>
      <ViajesModuleTextField
        id={`${id}-desc`}
        label={L("Descripción", "Description")}
        value={value.description}
        onChange={(v) => patch({ description: v })}
        multiline
      />
    </div>
  );
}
