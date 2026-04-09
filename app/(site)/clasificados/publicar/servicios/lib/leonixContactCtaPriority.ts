import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { digitsOnly } from "./serviciosPhoneUi";
import { isProbablyValidWebUrl } from "./socialAndUrlHelpers";

export function isValidEmail(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 5 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * Fixed Leonix CTA emphasis (no advertiser "primary button" selection):
 * WhatsApp → Call → Email → Website → Message — first match becomes primary label, rest secondary.
 */
export function buildLeonixContactCtaLabels(
  state: ClasificadosServiciosApplicationState,
  lang: ServiciosLang,
): { primaryCtaLabel?: string; secondaryCtaLabels: string[] } {
  const L =
    lang === "en"
      ? {
          wa: "WhatsApp",
          call: "Call",
          email: "Email",
          web: "Website",
          msg: "Message",
        }
      : {
          wa: "WhatsApp",
          call: "Llamar",
          email: "Correo",
          web: "Sitio web",
          msg: "Mensaje",
        };

  type Slot = "wa" | "call" | "email" | "web" | "msg";
  const slots: { id: Slot; on: boolean }[] = [
    {
      id: "wa",
      on:
        state.enableWhatsapp &&
        (digitsOnly(state.whatsapp).length >= 8 ||
          (state.whatsappBusinessUrl.trim().length > 0 && isProbablyValidWebUrl(state.whatsappBusinessUrl))),
    },
    {
      id: "call",
      on: state.enableCall && digitsOnly(state.phone).length >= 8,
    },
    {
      id: "email",
      on: state.enableEmail && isValidEmail(state.email),
    },
    {
      id: "web",
      on: state.enableWebsite && state.website.trim().length > 0 && isProbablyValidWebUrl(state.website),
    },
    { id: "msg", on: state.enableMessage === true },
  ];

  const order: Slot[] = ["wa", "call", "email", "web", "msg"];
  const labels: Record<Slot, string> = {
    wa: L.wa,
    call: L.call,
    email: L.email,
    web: L.web,
    msg: L.msg,
  };

  const picked: string[] = [];
  for (const id of order) {
    const row = slots.find((s) => s.id === id);
    if (row?.on) picked.push(labels[id]);
  }

  if (picked.length === 0) return { secondaryCtaLabels: [] };
  return {
    primaryCtaLabel: picked[0],
    secondaryCtaLabels: picked.slice(1),
  };
}
