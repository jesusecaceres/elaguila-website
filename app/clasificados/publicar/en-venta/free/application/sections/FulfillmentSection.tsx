"use client";

import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Entrega y envío",
    desc: "Si ofreces recogida, encuentro, entrega local o envío, dilo desde el principio. Evita malentendidos después.",
    pickup: "Recogida local",
    pickupH: "Opcional: dónde o cómo coordinan la recogida.",
    meetup: "Punto de encuentro",
    meetupH: "Opcional: zona o referencia (no pongas tu dirección exacta si no quieres).",
    delivery: "Entrega local",
    deliveryH: "Opcional: radio, costo aproximado o ventanas de tiempo.",
    ship: "Envío disponible",
    shipH: "Si envías, explica empaque, tiempos o restricciones.",
    notesShip: "Notas de envío",
  },
  en: {
    title: "Fulfillment",
    desc: "State pickup, meetup, local delivery, or shipping up front — fewer surprises later.",
    pickup: "Local pickup",
    pickupH: "Optional: how buyers pick up.",
    meetup: "Meetup",
    meetupH: "Optional: area or landmark (skip exact address if you prefer).",
    delivery: "Local delivery",
    deliveryH: "Optional: radius, fee, or time windows.",
    ship: "Shipping available",
    shipH: "If you ship, note packaging, timing, or limits.",
    notesShip: "Shipping notes",
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

      {state.pickup ? (
        <div>
          <label className={labelClass}>{t.pickup}</label>
          <p className="mt-1 text-xs text-[#111111]/60">{t.pickupH}</p>
          <textarea
            className={`${inputClass} mt-2 min-h-[64px]`}
            value={state.pickupDetailNotes}
            onChange={(e) => setState((s) => ({ ...s, pickupDetailNotes: e.target.value }))}
          />
        </div>
      ) : null}

      {state.meetup ? (
        <div>
          <label className={labelClass}>{t.meetup}</label>
          <p className="mt-1 text-xs text-[#111111]/60">{t.meetupH}</p>
          <textarea
            className={`${inputClass} mt-2 min-h-[64px]`}
            value={state.meetupDetailNotes}
            onChange={(e) => setState((s) => ({ ...s, meetupDetailNotes: e.target.value }))}
          />
        </div>
      ) : null}

      {state.localDelivery ? (
        <div>
          <label className={labelClass}>{t.delivery}</label>
          <p className="mt-1 text-xs text-[#111111]/60">{t.deliveryH}</p>
          <textarea
            className={`${inputClass} mt-2 min-h-[64px]`}
            value={state.localDeliveryDetailNotes}
            onChange={(e) => setState((s) => ({ ...s, localDeliveryDetailNotes: e.target.value }))}
          />
        </div>
      ) : null}

      {state.shipping ? (
        <div>
          <label className={labelClass}>{t.notesShip}</label>
          <p className="mt-1 text-xs text-[#111111]/60">{t.shipH}</p>
          <textarea
            className={`${inputClass} mt-2 min-h-[72px]`}
            value={state.shippingNotes}
            onChange={(e) => setState((s) => ({ ...s, shippingNotes: e.target.value }))}
          />
        </div>
      ) : null}
    </SectionShell>
  );
}
