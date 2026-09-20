"use client";

import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { formatViajesPhoneDisplay } from "@/app/(site)/clasificados/viajes/lib/v2/viajesPhoneDisplay";
import { ViajesLocationFields } from "../../components/ViajesLocationFields";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[color:var(--lx-text)]";
const CARD =
  "rounded-[20px] border border-black/10 bg-[color:var(--lx-page)] p-4 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.08)] sm:p-5";

type Props = {
  offer: ViajesOfferModelV2;
  onChange: (offer: ViajesOfferModelV2) => void;
  lang?: "es" | "en";
};

export function ViajesPrivadoStepContact({ offer, onChange, lang = "es" }: Props) {
  const es = lang !== "en";
  const patchContact = (partial: Partial<ViajesOfferModelV2["contact"]>) =>
    onChange({ ...offer, contact: { ...offer.contact, ...partial } });

  const privateExact = {
    ...offer.locations.privateExact,
    showPublicly: false,
    showMap: false,
  };

  return (
    <div className="space-y-5">
      <section className={`${CARD} space-y-4`}>
        <p className={LABEL}>{es ? "Inquiry Hub — contacto" : "Inquiry Hub — contact"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="vx-prv-dname">
              {es ? "Nombre para mostrar" : "Display name"}
            </label>
            <input
              id="vx-prv-dname"
              className={`${INPUT} mt-1`}
              value={offer.contact.displayName}
              onChange={(e) => patchContact({ displayName: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-cta">
              {es ? "CTA principal" : "Primary CTA"}
            </label>
            <select
              id="vx-prv-cta"
              className={`${INPUT} mt-1`}
              value={offer.contact.primaryCtaType}
              onChange={(e) =>
                patchContact({
                  primaryCtaType: e.target.value as ViajesOfferModelV2["contact"]["primaryCtaType"],
                })
              }
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">{es ? "Teléfono" : "Phone"}</option>
              <option value="email">{es ? "Correo" : "Email"}</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-email">
              Email
            </label>
            <input
              id="vx-prv-email"
              type="email"
              className={`${INPUT} mt-1`}
              value={offer.contact.email}
              onChange={(e) => patchContact({ email: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-phone">
              {es ? "Teléfono" : "Phone"}
            </label>
            <input
              id="vx-prv-phone"
              className={`${INPUT} mt-1`}
              value={offer.contact.phone}
              onChange={(e) => {
                const phone = e.target.value;
                patchContact({ phone, phoneRaw: phone });
              }}
              onBlur={() => {
                const source = offer.contact.phoneRaw || offer.contact.phone;
                patchContact({
                  phone: formatViajesPhoneDisplay(source),
                  phoneRaw: String(source ?? "").trim(),
                });
              }}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-prv-wa">
              WhatsApp
            </label>
            <input
              id="vx-prv-wa"
              className={`${INPUT} mt-1`}
              value={offer.contact.whatsapp}
              onChange={(e) => {
                const whatsapp = e.target.value;
                patchContact({ whatsapp, whatsappRaw: whatsapp });
              }}
              onBlur={() => {
                const source = offer.contact.whatsappRaw || offer.contact.whatsapp;
                patchContact({
                  whatsapp: formatViajesPhoneDisplay(source),
                  whatsappRaw: String(source ?? "").trim(),
                });
              }}
            />
          </div>
        </div>
      </section>

      <ViajesLocationFields
        title={es ? "Ubicación exacta (privada)" : "Exact location (private)"}
        value={privateExact}
        privacyLocked
        onChange={(next) =>
          onChange({
            ...offer,
            locations: {
              ...offer.locations,
              privateExact: { ...next, showPublicly: false, showMap: false },
            },
          })
        }
        privacyHint={
          es
            ? "La ubicación exacta nunca se muestra en el listado público. Mostrar públicamente / en mapa permanecen desactivados."
            : "The exact location is never shown on the public listing. Show publicly / on map stay disabled."
        }
      />
    </div>
  );
}
