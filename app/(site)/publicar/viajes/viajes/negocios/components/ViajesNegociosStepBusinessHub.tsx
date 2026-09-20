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

function phoneBlur(
  displayKey: "phone" | "phoneOffice" | "whatsapp",
  rawKey: "phoneRaw" | "phoneOfficeRaw" | "whatsappRaw",
  currentDisplay: string,
  currentRaw: string,
): { display: string; raw: string } {
  const source = currentRaw || currentDisplay;
  const display = formatViajesPhoneDisplay(source);
  return { display, raw: String(source ?? "").trim() };
}

export function ViajesNegociosStepBusinessHub({ offer, onChange, lang = "es" }: Props) {
  const es = lang !== "en";
  const patchProvider = (partial: Partial<ViajesOfferModelV2["provider"]>) =>
    onChange({ ...offer, provider: { ...offer.provider, ...partial } });
  const patchContact = (partial: Partial<ViajesOfferModelV2["contact"]>) =>
    onChange({ ...offer, contact: { ...offer.contact, ...partial } });
  const patchLocation = (
    key: keyof ViajesOfferModelV2["locations"],
    value: ViajesOfferModelV2["locations"][typeof key],
  ) => onChange({ ...offer, locations: { ...offer.locations, [key]: value } });

  return (
    <div className="space-y-5">
      <section className={`${CARD} space-y-4`}>
        <p className={LABEL}>{es ? "Proveedor / negocio" : "Provider / business"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="vx-biz-pname">
              {es ? "Nombre del negocio" : "Business name"}
            </label>
            <input
              id="vx-biz-pname"
              className={`${INPUT} mt-1`}
              value={offer.provider.name}
              onChange={(e) => {
                const name = e.target.value;
                onChange({
                  ...offer,
                  provider: { ...offer.provider, name },
                  contact: { ...offer.contact, displayName: name || offer.contact.displayName },
                });
              }}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-ptype">
              {es ? "Tipo" : "Type"}
            </label>
            <input
              id="vx-biz-ptype"
              className={`${INPUT} mt-1`}
              value={offer.provider.type}
              onChange={(e) => patchProvider({ type: e.target.value })}
              placeholder={es ? "Agencia, tour operator…" : "Agency, tour operator…"}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-logo">
              {es ? "Logo URL" : "Logo URL"}
            </label>
            <input
              id="vx-biz-logo"
              className={`${INPUT} mt-1`}
              value={offer.provider.logoUrl}
              onChange={(e) => patchProvider({ logoUrl: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className={LABEL} htmlFor="vx-biz-pdesc">
            {es ? "Descripción del proveedor" : "Provider description"}
          </label>
          <textarea
            id="vx-biz-pdesc"
            className={`${INPUT} mt-1 min-h-[80px] resize-y`}
            rows={3}
            value={offer.provider.description}
            onChange={(e) => patchProvider({ description: e.target.value })}
          />
        </div>
      </section>

      <section className={`${CARD} space-y-4`}>
        <p className={LABEL}>{es ? "Contacto (Inquiry Hub)" : "Contact (Inquiry Hub)"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="vx-biz-cta">
              {es ? "CTA principal" : "Primary CTA"}
            </label>
            <select
              id="vx-biz-cta"
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
              <option value="website">{es ? "Sitio web" : "Website"}</option>
              <option value="booking">{es ? "Reservar" : "Booking"}</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-email">
              Email
            </label>
            <input
              id="vx-biz-email"
              type="email"
              className={`${INPUT} mt-1`}
              value={offer.contact.email}
              onChange={(e) => {
                const email = e.target.value;
                onChange({
                  ...offer,
                  contact: { ...offer.contact, email },
                  provider: { ...offer.provider, email },
                });
              }}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-phone">
              {es ? "Teléfono" : "Phone"}
            </label>
            <input
              id="vx-biz-phone"
              className={`${INPUT} mt-1`}
              value={offer.contact.phone}
              onChange={(e) => {
                const phone = e.target.value;
                onChange({
                  ...offer,
                  contact: { ...offer.contact, phone, phoneRaw: phone },
                  provider: { ...offer.provider, phone, phoneRaw: phone },
                });
              }}
              onBlur={() => {
                const { display, raw } = phoneBlur(
                  "phone",
                  "phoneRaw",
                  offer.contact.phone,
                  offer.contact.phoneRaw,
                );
                onChange({
                  ...offer,
                  contact: { ...offer.contact, phone: display, phoneRaw: raw },
                  provider: { ...offer.provider, phone: display, phoneRaw: raw },
                });
              }}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-phone-office">
              {es ? "Teléfono oficina" : "Office phone"}
            </label>
            <input
              id="vx-biz-phone-office"
              className={`${INPUT} mt-1`}
              value={offer.contact.phoneOffice}
              onChange={(e) => {
                const phoneOffice = e.target.value;
                patchContact({ phoneOffice, phoneOfficeRaw: phoneOffice });
              }}
              onBlur={() => {
                const { display, raw } = phoneBlur(
                  "phoneOffice",
                  "phoneOfficeRaw",
                  offer.contact.phoneOffice,
                  offer.contact.phoneOfficeRaw,
                );
                patchContact({ phoneOffice: display, phoneOfficeRaw: raw });
              }}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-wa">
              WhatsApp
            </label>
            <input
              id="vx-biz-wa"
              className={`${INPUT} mt-1`}
              value={offer.contact.whatsapp}
              onChange={(e) => {
                const whatsapp = e.target.value;
                onChange({
                  ...offer,
                  contact: { ...offer.contact, whatsapp, whatsappRaw: whatsapp },
                  provider: { ...offer.provider, whatsapp, whatsappRaw: whatsapp },
                });
              }}
              onBlur={() => {
                const { display, raw } = phoneBlur(
                  "whatsapp",
                  "whatsappRaw",
                  offer.contact.whatsapp,
                  offer.contact.whatsappRaw,
                );
                onChange({
                  ...offer,
                  contact: { ...offer.contact, whatsapp: display, whatsappRaw: raw },
                  provider: { ...offer.provider, whatsapp: display, whatsappRaw: raw },
                });
              }}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="vx-biz-web">
              Website
            </label>
            <input
              id="vx-biz-web"
              className={`${INPUT} mt-1`}
              value={offer.contact.website}
              onChange={(e) => {
                const website = e.target.value;
                onChange({
                  ...offer,
                  contact: { ...offer.contact, website },
                  provider: { ...offer.provider, website },
                });
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL} htmlFor="vx-biz-booking">
              {es ? "URL de reserva" : "Booking URL"}
            </label>
            <input
              id="vx-biz-booking"
              className={`${INPUT} mt-1`}
              value={offer.provider.bookingUrl}
              onChange={(e) => patchProvider({ bookingUrl: e.target.value })}
            />
          </div>
        </div>
      </section>

      <ViajesLocationFields
        title={es ? "Destino" : "Destination"}
        value={offer.locations.destination}
        onChange={(destination) => patchLocation("destination", destination)}
      />
      <ViajesLocationFields
        title={es ? "Salida / meeting / puerto" : "Departure / meeting / port"}
        value={offer.locations.departureMeetingPort}
        onChange={(departureMeetingPort) => patchLocation("departureMeetingPort", departureMeetingPort)}
      />
      <ViajesLocationFields
        title={es ? "Oficina del proveedor" : "Provider office"}
        value={offer.locations.providerOffice}
        onChange={(providerOffice) => patchLocation("providerOffice", providerOffice)}
        privacyHint={
          es
            ? "Puedes ocultar la dirección exacta del público si lo prefieres."
            : "You can hide the exact address from the public listing."
        }
      />

      <section className={`${CARD} space-y-4`}>
        <p className={LABEL}>{es ? "Redes sociales" : "Social links"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["socialFacebook", "Facebook"],
              ["socialInstagram", "Instagram"],
              ["socialTiktok", "TikTok"],
              ["socialYoutube", "YouTube"],
              ["socialX", "X / Twitter"],
              ["socialLinkedin", "LinkedIn"],
              ["socialSnapchat", "Snapchat"],
              ["socialPinterest", "Pinterest"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className={LABEL} htmlFor={`vx-biz-${key}`}>
                {label}
              </label>
              <input
                id={`vx-biz-${key}`}
                className={`${INPUT} mt-1`}
                value={offer.provider[key]}
                onChange={(e) => patchProvider({ [key]: e.target.value })}
                placeholder="https://"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
