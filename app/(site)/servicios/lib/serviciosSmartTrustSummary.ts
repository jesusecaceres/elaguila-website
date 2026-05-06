import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosPaymentMethodId } from "./serviciosPaymentMethodCatalog";
import { getServiciosPaymentMethodLabel, isServiciosPaymentMethodId } from "./serviciosPaymentMethodCatalog";
import { getServiciosAmenityOption, isServiciosAmenityOptionId } from "./serviciosAmenitiesCatalog";

export type ServiciosSmartTrustSummaryModel = {
  paragraph: string;
  chips: string[];
};

function trim(s: string | undefined): string {
  return (s ?? "").trim();
}

function normKey(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function dedupeChips(chips: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of chips) {
    const t = c.trim();
    if (!t) continue;
    const k = normKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

function paymentShortLabel(id: ServiciosPaymentMethodId, lang: ServiciosLang): string {
  if (id === "credit_debit_card") return lang === "es" ? "tarjeta" : "card";
  const full = getServiciosPaymentMethodLabel(id, lang);
  const slash = full.split(" / ")[0]?.trim();
  return slash && slash.length < full.length ? slash : full;
}

function joinOfferList(items: string[], lang: ServiciosLang): string {
  const clean = items.map((x) => x.trim()).filter(Boolean).slice(0, 3);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0]!;
  if (lang === "es") {
    if (clean.length === 2) return `${clean[0]} y ${clean[1]}`;
    return `${clean[0]}, ${clean[1]} y ${clean[2]}`;
  }
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean[0]}, ${clean[1]}, and ${clean[2]}`;
}

function credentialsMeaningful(c: ServiciosProfileResolved["credentials"]): boolean {
  if (!c) return false;
  return (
    c.hasLicense ||
    c.isInsured ||
    (c.certifications?.length ?? 0) > 0 ||
    Boolean(c.licenseDocumentHrefSafe) ||
    Boolean(c.insuranceDocumentHrefSafe)
  );
}

/** True when the profile has enough structured data for a useful summary (no generic filler). */
export function hasSmartTrustSummary(profile: ServiciosProfileResolved): boolean {
  const cat = trim(profile.hero.categoryLine);
  const spec = trim(profile.about?.specialtiesLine);
  const svcN = profile.services.length;
  const hiN = profile.highlights.length;
  const pay =
    profile.paymentMethodIds.length > 0 || profile.customPaymentMethods.some((x) => trim(x).length > 0);
  const am =
    profile.amenityOptionIds.length > 0 || profile.customAmenityOptions.some((x) => trim(x).length > 0);
  const cred = credentialsMeaningful(profile.credentials);
  const loc = trim(profile.hero.locationSummary);
  const zoneN = profile.serviceAreas.items.length;
  const hrs = Boolean(trim(profile.contact.hours?.openNowLabel) && trim(profile.contact.hours?.todayHoursLine));
  const msg = profile.contact.messageEnabled === true;

  const hasOfferAnchor = Boolean(cat || spec || svcN > 0);
  const trustSignals = [hiN > 0, pay, am, cred, Boolean(loc), zoneN > 0, hrs, msg].filter(Boolean).length;
  const multiOffer = svcN >= 2 || (Boolean(cat) && svcN >= 1) || (Boolean(cat) && Boolean(spec));

  if (!hasOfferAnchor) return false;
  if (trustSignals >= 1) return true;
  if (multiOffer) return true;
  return false;
}

/**
 * Top supporting chips for the trust summary card (max 3). Deterministic order.
 */
export function getTopTrustSummaryChips(profile: ServiciosProfileResolved, lang: ServiciosLang): string[] {
  const chips: string[] = [];
  const topSvc = trim(profile.services[0]?.title);
  if (topSvc) chips.push(topSvc);
  for (const h of profile.highlights.slice(0, 2)) {
    const t = trim(h.label);
    if (t) chips.push(t);
  }
  for (const id of profile.paymentMethodIds.slice(0, 2)) {
    if (isServiciosPaymentMethodId(id)) chips.push(paymentShortLabel(id, lang));
  }
  for (const raw of profile.customPaymentMethods.slice(0, 1)) {
    const t = trim(raw);
    if (t) chips.push(t);
  }
  for (const id of profile.amenityOptionIds.slice(0, 2)) {
    if (isServiciosAmenityOptionId(id)) chips.push(getServiciosAmenityOption(id).label[lang]);
  }
  for (const raw of profile.customAmenityOptions.slice(0, 1)) {
    const t = trim(raw);
    if (t) chips.push(t);
  }
  const c = profile.credentials;
  if (c?.hasLicense) chips.push(lang === "es" ? "Información de licencia" : "License information");
  else if (c?.isInsured) chips.push(lang === "es" ? "Seguro indicado" : "Insurance indicated");

  const loc = trim(profile.hero.locationSummary);
  if (loc) chips.push(loc);
  else if (profile.serviceAreas.items[0]?.label) chips.push(trim(profile.serviceAreas.items[0]!.label));

  return dedupeChips(chips, 3);
}

function pickSubject(profile: ServiciosProfileResolved, lang: ServiciosLang): string {
  const name = trim(profile.identity.businessName);
  if (name.length > 0 && name.length <= 44) return name;
  return lang === "es" ? "Este negocio" : "This business";
}

/**
 * Builds 1–2 sentence summary + chip hints. Returns null if insufficient data.
 */
export function buildServiciosSmartTrustSummary(
  profile: ServiciosProfileResolved,
  lang: ServiciosLang,
): ServiciosSmartTrustSummaryModel | null {
  if (!hasSmartTrustSummary(profile)) return null;

  const subject = pickSubject(profile, lang);
  const cat = trim(profile.hero.categoryLine);
  const spec = trim(profile.about?.specialtiesLine);
  const svcTitles = profile.services.map((s) => trim(s.title)).filter(Boolean).slice(0, 2);

  const offerParts: string[] = [];
  if (cat) offerParts.push(cat);
  for (const t of svcTitles) {
    const dup = offerParts.some((p) => normKey(p) === normKey(t) || p.toLowerCase().includes(t.toLowerCase()));
    if (!dup) offerParts.push(t);
  }
  if (!cat && !spec && offerParts.length === 0 && svcTitles.length) offerParts.push(...svcTitles);

  let offerPhrase = "";
  if (offerParts.length > 0) {
    offerPhrase = joinOfferList(offerParts, lang);
  } else if (spec) {
    offerPhrase = spec;
  }

  const hiLabels = profile.highlights.map((h) => trim(h.label)).filter(Boolean).slice(0, 2);
  const payLabels: string[] = [];
  for (const id of profile.paymentMethodIds.slice(0, 2)) {
    if (isServiciosPaymentMethodId(id)) payLabels.push(paymentShortLabel(id, lang));
  }
  for (const raw of profile.customPaymentMethods.slice(0, 2)) {
    const t = trim(raw);
    if (t) payLabels.push(t);
  }
  const amLabels: string[] = [];
  for (const id of profile.amenityOptionIds.slice(0, 2)) {
    if (isServiciosAmenityOptionId(id)) amLabels.push(getServiciosAmenityOption(id).label[lang]);
  }
  for (const raw of profile.customAmenityOptions.slice(0, 2)) {
    const t = trim(raw);
    if (t) amLabels.push(t);
  }

  const c = profile.credentials;
  let credPhrase = "";
  if (c) {
    const lic = c.hasLicense;
    const ins = c.isInsured;
    if (lic && ins) {
      credPhrase =
        lang === "es"
          ? "indica que proporcionó información de licencia y seguro"
          : "provides license information and indicates insurance";
    } else if (lic) {
      credPhrase =
        lang === "es" ? "indica que proporcionó información de licencia" : "provides license information";
    } else if (ins) {
      credPhrase = lang === "es" ? "indica seguro disponible" : "indicates insurance coverage";
    }
  }

  const loc = trim(profile.hero.locationSummary);
  const zones = profile.serviceAreas.items.map((i) => trim(i.label)).filter(Boolean).slice(0, 2);
  let wherePhrase = "";
  if (loc && zones.length) {
    wherePhrase =
      lang === "es"
        ? `atiende en ${loc} y zonas como ${joinOfferList(zones, lang)}`
        : `serves ${loc} and areas such as ${joinOfferList(zones, lang)}`;
  } else if (loc) {
    wherePhrase = lang === "es" ? `atiende en ${loc}` : `serves ${loc}`;
  } else if (zones.length) {
    wherePhrase =
      lang === "es" ? `atiende zonas como ${joinOfferList(zones, lang)}` : `serves areas such as ${joinOfferList(zones, lang)}`;
  }

  const hrsLine = trim(profile.contact.hours?.todayHoursLine);
  const hrsLabel = trim(profile.contact.hours?.openNowLabel);
  let hoursFrag = "";
  if (hrsLabel && hrsLine) {
    hoursFrag = lang === "es" ? `Para hoy indica: ${hrsLine}.` : `For today it indicates: ${hrsLine}.`;
  }

  const msgFrag =
    profile.contact.messageEnabled === true
      ? lang === "es"
        ? "permite enviar un mensaje para consultas"
        : "offers messaging for inquiries"
      : "";

  // —— Sentence 1: offer ——
  let s1 = "";
  const offerCore = offerPhrase.replace(/\.\s*$/, "");
  if (offerCore) {
    s1 = lang === "es" ? `${subject} ofrece ${offerCore}.` : `${subject} offers ${offerCore}.`;
  } else if (wherePhrase) {
    const subj = subject.charAt(0).toUpperCase() + subject.slice(1);
    s1 = lang === "es" ? `${subj} ${wherePhrase}.` : `${subj} ${wherePhrase}.`;
  }

  // —— Sentence 2: convenience / trust (max two clauses, readable) ——
  const secondBits: string[] = [];

  const hiJoined = joinOfferList(hiLabels, lang);
  const amJoined = joinOfferList(amLabels, lang);
  const payJoined = joinOfferList(payLabels, lang);

  const convoParts: string[] = [];
  if (hiJoined) convoParts.push(hiJoined);
  if (amJoined) convoParts.push(amJoined);
  const convJoined = joinOfferList(convoParts, lang);

  if (convJoined && payJoined) {
    secondBits.push(
      lang === "es"
        ? `también cuenta con ${convJoined} y acepta pagos como ${payJoined}`
        : `it also offers ${convJoined} and accepts payments such as ${payJoined}`,
    );
  } else if (convJoined) {
    secondBits.push(lang === "es" ? `también cuenta con ${convJoined}` : `it also includes ${convJoined}`);
  } else if (payJoined) {
    secondBits.push(
      lang === "es" ? `también acepta pagos como ${payJoined}` : `it also accepts payments such as ${payJoined}`,
    );
  }

  if (credPhrase) {
    secondBits.push(lang === "es" ? `el negocio ${credPhrase}` : `the business ${credPhrase}`);
  }

  if (wherePhrase && s1 && loc && !s1.includes(loc)) {
    secondBits.push(wherePhrase);
  } else if (wherePhrase && s1 && zones.length && !zones.some((z) => s1.includes(z))) {
    secondBits.push(wherePhrase);
  }

  if (msgFrag) secondBits.push(msgFrag);
  if (hoursFrag) secondBits.push(hoursFrag);

  let s2 = "";
  const picked = secondBits.slice(0, 2);
  if (picked.length === 1) {
    const b = picked[0]!;
    s2 = (b.charAt(0).toUpperCase() + b.slice(1)).trim();
    if (!s2.endsWith(".")) s2 += ".";
  } else if (picked.length === 2) {
    const a = picked[0]!;
    const b = picked[1]!;
    const joiner = lang === "es" ? "; " : "; ";
    s2 = `${a.charAt(0).toUpperCase() + a.slice(1)}${joiner}${b.endsWith(".") ? b : `${b}.`}`;
  }

  let paragraph = [s1, s2].filter(Boolean).join(" ");
  paragraph = paragraph.replace(/\s+/g, " ").trim();

  // Guard: no forbidden verification wording (templates only; belt-and-suspenders)
  const banned = /verificado|verified|garantizado\s+por\s+leonix|leonix\s+verified|best\b|top\s+rated/i;
  if (banned.test(paragraph)) {
    paragraph = paragraph.replace(banned, "");
    paragraph = paragraph.replace(/\s+/g, " ").trim();
  }

  if (!paragraph) return null;

  const chips = getTopTrustSummaryChips(profile, lang);

  return { paragraph, chips };
}
