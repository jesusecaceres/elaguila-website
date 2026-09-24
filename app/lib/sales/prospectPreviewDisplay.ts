/**
 * Pure display mapping for the private prospect preview.
 * Turns the whitelist `content` blob from `readProspectPreviewPayload` into a Leonix-style
 * ad view-model. No DB, no Stripe, no HTML injection.
 */

import {
  isLeonixEndorsementCategory,
  isLeonixEndorsementCategoryLive,
  type LeonixEndorsementCategory,
} from "@/app/lib/leonixCommunityTrust/leonixEndorsementRegistry";
import type { QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";

export type ProspectPreviewImage = {
  src: string;
  alt: string;
  role: "hero" | "support";
};

export type ProspectPreviewContact = {
  kind: "phone" | "sms" | "whatsapp" | "email" | "website";
  value: string;
};

export type ProspectPreviewFact = {
  key: string;
  value: string;
};

export type StaffCommunityTrustDisposition =
  | { status: "TRUE"; category: LeonixEndorsementCategory }
  | { status: "PROVEN_NA"; reason: "registry_ineligible" };

const TRUST_BY_STAFF_FAMILY: Record<QuickSalesCategory, StaffCommunityTrustDisposition> = {
  servicios: { status: "TRUE", category: "servicios" },
  restaurantes: { status: "TRUE", category: "restaurantes" },
  "comida-local": { status: "TRUE", category: "comida-local" },
  "bienes-raices": { status: "TRUE", category: "bienes_raices_negocio" },
  rentas: { status: "PROVEN_NA", reason: "registry_ineligible" },
  empleos: { status: "PROVEN_NA", reason: "registry_ineligible" },
  "autos-privado": { status: "PROVEN_NA", reason: "registry_ineligible" },
  autos: { status: "PROVEN_NA", reason: "registry_ineligible" },
};

export function staffCommunityTrustDisposition(
  category: QuickSalesCategory,
): StaffCommunityTrustDisposition {
  return TRUST_BY_STAFF_FAMILY[category];
}

export function prospectPreviewTrustCategory(
  category: QuickSalesCategory,
): LeonixEndorsementCategory | null {
  const d = TRUST_BY_STAFF_FAMILY[category];
  if (d.status !== "TRUE") return null;
  if (!isLeonixEndorsementCategory(d.category)) return null;
  if (!isLeonixEndorsementCategoryLive(d.category)) return null;
  return d.category;
}

function str(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    const s = str(value);
    if (s) return s;
  }
  return null;
}

function isHttpish(value: string): boolean {
  return /^(https?:\/\/|data:image\/|blob:)/i.test(value) || value.startsWith("/");
}

function pushImage(out: ProspectPreviewImage[], raw: unknown, alt: string): void {
  if (out.length >= 3) return;
  if (typeof raw === "string" && isHttpish(raw.trim())) {
    out.push({ src: raw.trim(), alt, role: out.length === 0 ? "hero" : "support" });
    return;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const rec = raw as Record<string, unknown>;
    const src = firstString(rec.url, rec.src, rec.href, rec.dataUrl, rec.publicUrl, rec.path);
    if (src && isHttpish(src)) {
      out.push({
        src,
        alt: firstString(rec.alt, rec.altText, rec.caption) ?? alt,
        role: out.length === 0 ? "hero" : "support",
      });
    }
  }
}

function walkImageList(out: ProspectPreviewImage[], value: unknown, alt: string): void {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (out.length >= 3) break;
      pushImage(out, item, alt);
    }
    return;
  }
  pushImage(out, value, alt);
}

/** Quick 1–3 genuine images. Never fabricates stock/placeholder URLs. */
export function extractProspectPreviewImages(
  content: Record<string, unknown> | null,
  title: string | null,
): ProspectPreviewImage[] {
  const out: ProspectPreviewImage[] = [];
  const alt = title?.trim() || "Listing photo";
  if (!content) return out;
  walkImageList(out, content.gallery, alt);
  walkImageList(out, content.images, alt);
  walkImageList(out, content.photos, alt);
  walkImageList(out, content.fotos, alt);
  walkImageList(out, content.media, alt);
  walkImageList(out, content.fotosDataUrls, alt);
  walkImageList(out, content.photoUrls, alt);
  pushImage(out, content.heroImage, alt);
  pushImage(out, content.coverUrl, alt);
  pushImage(out, content.cover_url, alt);
  pushImage(out, content.mainImage, alt);
  pushImage(out, content.main_photo, alt);
  const nested = content.profile;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const rec = nested as Record<string, unknown>;
    walkImageList(out, rec.gallery, alt);
    pushImage(out, rec.coverUrl, alt);
  }
  return out.slice(0, 3);
}

export function extractProspectPreviewContacts(
  content: Record<string, unknown> | null,
): ProspectPreviewContact[] {
  if (!content) return [];
  const out: ProspectPreviewContact[] = [];
  const phone = firstString(content.phone, content.officePhone, content.telefono, content.contactPhone);
  const sms = firstString(content.smsNumber, content.sms, content.smsPhone);
  const whatsapp = firstString(content.whatsapp, content.whatsApp, content.whatsappNumber);
  const email = firstString(content.email, content.contactEmail);
  const website = firstString(content.website, content.web, content.url);
  if (phone) out.push({ kind: "phone", value: phone });
  if (sms && sms !== phone) out.push({ kind: "sms", value: sms });
  if (whatsapp && whatsapp !== phone && whatsapp !== sms) out.push({ kind: "whatsapp", value: whatsapp });
  if (email) out.push({ kind: "email", value: email });
  if (website) out.push({ kind: "website", value: website });
  return out;
}

const FACT_KEYS: { key: string; aliases: string[] }[] = [
  { key: "price", aliases: ["price", "precio", "askingPrice", "monthlyRent"] },
  { key: "city", aliases: ["city", "ciudad", "cityDisplay"] },
  { key: "state", aliases: ["state", "estado", "region"] },
  { key: "cuisine", aliases: ["cuisine", "primaryCuisine", "foodType"] },
  { key: "category", aliases: ["category", "serviceType", "businessType"] },
  { key: "hours", aliases: ["hoursSummary", "availability"] },
];

export function extractProspectPreviewFacts(
  content: Record<string, unknown> | null,
): ProspectPreviewFact[] {
  if (!content) return [];
  const out: ProspectPreviewFact[] = [];
  for (const row of FACT_KEYS) {
    const value = firstString(...row.aliases.map((k) => content[k]));
    if (value) out.push({ key: row.key, value });
  }
  return out;
}

export function extractProspectPreviewDescription(
  content: Record<string, unknown> | null,
): string | null {
  if (!content) return null;
  return firstString(
    content.aboutText,
    content.description,
    content.longDescription,
    content.descripcion,
    content.queVendes,
    content.blurb,
  );
}

export type ProspectLeonixPreviewVm = {
  title: string;
  location: string | null;
  description: string | null;
  images: ProspectPreviewImage[];
  contacts: ProspectPreviewContact[];
  facts: ProspectPreviewFact[];
  trustCategory: LeonixEndorsementCategory | null;
  trustDisposition: StaffCommunityTrustDisposition;
};

export function buildProspectLeonixPreviewVm(input: {
  category: QuickSalesCategory;
  title: string | null;
  city: string | null;
  state: string | null;
  content: Record<string, unknown> | null;
}): ProspectLeonixPreviewVm {
  const title = input.title?.trim() || "Borrador sin título / Untitled draft";
  const location = [input.city, input.state].filter(Boolean).join(", ") || null;
  return {
    title,
    location,
    description: extractProspectPreviewDescription(input.content),
    images: extractProspectPreviewImages(input.content, title),
    contacts: extractProspectPreviewContacts(input.content),
    facts: extractProspectPreviewFacts(input.content),
    trustCategory: prospectPreviewTrustCategory(input.category),
    trustDisposition: staffCommunityTrustDisposition(input.category),
  };
}
