import type { ClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationTypes";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { syncServiciosContactEnables } from "./serviciosContactVisibility";

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

  const enables = syncServiciosContactEnables(state);
  type Slot = "wa" | "call" | "email" | "web" | "msg";
  const slots: { id: Slot; on: boolean }[] = [
    { id: "wa", on: enables.enableWhatsapp },
    { id: "call", on: enables.enableCall },
    { id: "email", on: enables.enableEmail },
    { id: "web", on: enables.enableWebsite },
    { id: "msg", on: enables.enableMessage === true },
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
