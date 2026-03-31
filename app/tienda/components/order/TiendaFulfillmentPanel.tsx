"use client";

import type { Lang } from "../../types/tienda";
import type { TiendaFulfillmentPreference } from "../../types/orderHandoff";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";

const OPTIONS: { id: TiendaFulfillmentPreference; title: (typeof orderHandoffCopy)["fulfillmentLocalPickup"]["title"]; body: (typeof orderHandoffCopy)["fulfillmentLocalPickup"]["body"] }[] = [
  { id: "local-pickup", title: orderHandoffCopy.fulfillmentLocalPickup.title, body: orderHandoffCopy.fulfillmentLocalPickup.body },
  { id: "local-delivery-discuss", title: orderHandoffCopy.fulfillmentLocalDelivery.title, body: orderHandoffCopy.fulfillmentLocalDelivery.body },
  { id: "shipping-discuss", title: orderHandoffCopy.fulfillmentShipping.title, body: orderHandoffCopy.fulfillmentShipping.body },
];

export function TiendaFulfillmentPanel(props: {
  lang: Lang;
  value: TiendaFulfillmentPreference | "";
  onChange: (v: TiendaFulfillmentPreference) => void;
  showError?: boolean;
}) {
  const { lang, value, onChange, showError } = props;

  return (
    <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
          {ohPick(orderHandoffCopy.fulfillmentTitle, lang)}
        </h2>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.62)]">{ohPick(orderHandoffCopy.fulfillmentIntro, lang)}</p>
      </div>

      {showError && !value ? (
        <p className="text-sm text-[rgba(220,140,100,0.95)]">{ohPick(orderHandoffCopy.fulfillmentRequired, lang)}</p>
      ) : null}

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className={[
              "flex gap-3 rounded-xl border p-4 cursor-pointer transition",
              value === opt.id
                ? "border-[rgba(201,168,74,0.55)] bg-[rgba(201,168,74,0.08)]"
                : "border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.2)] hover:border-[rgba(255,255,255,0.16)]",
            ].join(" ")}
          >
            <input
              type="radio"
              name="tiendaFulfillment"
              className="mt-1 accent-[color:var(--lx-gold)]"
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
            />
            <span>
              <span className="block text-sm font-medium text-[rgba(255,247,226,0.92)]">
                {ohPick(opt.title, lang)}
              </span>
              <span className="mt-1 block text-xs text-[rgba(255,255,255,0.58)]">{ohPick(opt.body, lang)}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
