"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Entrega y envío",
    desc: "Si ofreces entrega o envío, indícalo desde el inicio.",
    pickup: "Recogida local",
    meetup: "Punto de encuentro",
    delivery: "Entrega local",
    ship: "Envío disponible",
    notes: "Notas de envío / empaque",
  },
  en: {
    title: "Fulfillment",
    desc: "State pickup, meetup, delivery, or shipping up front.",
    pickup: "Local pickup",
    meetup: "Meetup",
    delivery: "Local delivery",
    ship: "Shipping available",
    notes: "Shipping / packaging notes",
  },
} as const;

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function FulfillmentSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label={t.pickup}
          checked={state.pickup}
          onChange={(v) => setState((s) => ({ ...s, pickup: v }))}
        />
        <Toggle
          label={t.meetup}
          checked={state.meetup}
          onChange={(v) => setState((s) => ({ ...s, meetup: v }))}
        />
        <Toggle
          label={t.delivery}
          checked={state.localDelivery}
          onChange={(v) => setState((s) => ({ ...s, localDelivery: v }))}
        />
        <Toggle
          label={t.ship}
          checked={state.shipping}
          onChange={(v) => setState((s) => ({ ...s, shipping: v }))}
        />
      </div>
      <div>
        <label className={labelClass}>{t.notes}</label>
        <textarea
          className={`${inputClass} mt-2 min-h-[72px]`}
          value={state.shippingNotes}
          onChange={(e) => setState((s) => ({ ...s, shippingNotes: e.target.value }))}
        />
      </div>
    </SectionShell>
  );
}
