import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { whatsAppHrefFromDisplayWithText } from "@/app/clasificados/autos/negocios/lib/dealerWhatsappHref";
import { LEONIX_GLOBAL_CONTACT_PATH } from "@/app/data/leonixGlobalContact";
import { buildVehicleTitle } from "@/app/publicar/autos/negocios/lib/autoDealerTitle";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

const PREFILL_MSG_MAX = 3500;

export function resolvePrivadoListingTitle(data: AutoDealerListing): string {
  const custom = data.vehicleTitle?.trim();
  if (custom) return custom;
  const built = buildVehicleTitle(data.year, data.make, data.model, data.trim);
  return built?.trim() || (data.make?.trim() && data.model?.trim() ? `${data.make} ${data.model}`.trim() : "");
}

function interestWhatsappText(lang: AutosNegociosLang, vehicleTitle: string): string {
  const ref = vehicleTitle.trim();
  if (lang === "es") {
    return ref ? `Hola, me interesa este vehículo: ${ref}` : "Hola, me interesa este vehículo";
  }
  return ref ? `Hi, I'm interested in this vehicle: ${ref}` : "Hi, I'm interested in this vehicle";
}

function siteContactPrefillBody(lang: AutosNegociosLang, vehicleTitle: string): string {
  const ref = vehicleTitle.trim();
  if (lang === "es") {
    return ref
      ? `Hola Leonix,\n\nMe interesa el siguiente vehículo en Clasificados Autos (Privado):\n${ref}\n\n`
      : "Hola Leonix,\n\nMe interesa un vehículo en Clasificados Autos (Privado).\n\n";
  }
  return ref
    ? `Hello Leonix,\n\nI'm interested in this vehicle on Autos classifieds (Private):\n${ref}\n\n`
    : "Hello Leonix,\n\nI'm interested in a vehicle on Autos classifieds (Private).\n\n";
}

function mailtoInterestSubject(lang: AutosNegociosLang, vehicleTitle: string): string {
  const ref = vehicleTitle.trim();
  if (lang === "es") {
    return ref ? `Interés en vehículo: ${ref}` : "Interés en vehículo (Clasificados Autos)";
  }
  return ref ? `Interest in vehicle: ${ref}` : "Interest in vehicle (Autos classifieds)";
}

function mailtoInterestBody(lang: AutosNegociosLang, vehicleTitle: string): string {
  const ref = vehicleTitle.trim();
  if (lang === "es") {
    return ref
      ? `Hola,\n\nMe interesa el vehículo: ${ref}.\n\n`
      : "Hola,\n\nMe interesa el vehículo que vi en Leonix Clasificados Autos.\n\n";
  }
  return ref
    ? `Hello,\n\nI'm interested in the vehicle: ${ref}.\n\n`
    : "Hello,\n\nI'm interested in the vehicle I saw on Leonix Autos classifieds.\n\n";
}

export function isPlausibleSellerEmail(raw: string | undefined | null): boolean {
  const t = (raw ?? "").trim();
  if (t.length < 5 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export function buildPrivadoWhatsappInterestHref(data: AutoDealerListing, lang: AutosNegociosLang): string | null {
  const title = resolvePrivadoListingTitle(data);
  return whatsAppHrefFromDisplayWithText(data.dealerWhatsapp ?? undefined, interestWhatsappText(lang, title));
}

export function buildPrivadoSiteMessageHref(lang: AutosNegociosLang, data: AutoDealerListing): string {
  const title = resolvePrivadoListingTitle(data);
  const body = siteContactPrefillBody(lang, title).slice(0, PREFILL_MSG_MAX);
  const params = new URLSearchParams();
  params.set("lang", lang);
  params.set("prefillMessage", body);
  return `${LEONIX_GLOBAL_CONTACT_PATH}?${params.toString()}`;
}

export function buildPrivadoSellerMailtoHref(data: AutoDealerListing, lang: AutosNegociosLang): string | null {
  const email = data.dealerEmail?.trim();
  if (!email || !isPlausibleSellerEmail(email)) return null;
  const title = resolvePrivadoListingTitle(data);
  const subject = mailtoInterestSubject(lang, title);
  const body = mailtoInterestBody(lang, title);
  const q = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${email}?${q.toString()}`;
}
