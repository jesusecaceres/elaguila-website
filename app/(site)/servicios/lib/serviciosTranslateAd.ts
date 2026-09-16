import { pickTranslatableAdFields } from "@/app/lib/translation/helpers";
import type { TranslatableAdFields } from "@/app/lib/translation/types";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { canonicalBusinessTypeLabel, canonicalPresetChip, canonicalPresetLabel } from "./serviciosCanonicalPresetLabels";

// ⚠️38A — the canonical ES ↔ EN preset map now lives in serviciosCanonicalPresetLabels.ts (pure) so
// the discovery adapter and this overlay share ONE source; re-exported for existing callers.
export {
  canonicalBusinessTypeLabel,
  canonicalBusinessTypeLabels,
  canonicalPresetChip,
  canonicalPresetLabel,
  type ServiciosCanonicalChipKind,
} from "./serviciosCanonicalPresetLabels";

/* ==============================================================================================
 * Servicios Final Pre-Payment Closeout ⚠️37 (2026-09-14) — FULL translated-profile coverage.
 *
 * Product rule: "Traducir anuncio" must turn EVERY business-descriptive field into the destination
 * language while static Leonix chrome stays locale-driven. Two mechanisms, one engine:
 *
 *   CANONICAL_PRESET   — chips the owner picked from Leonix catalogs (preset services, "Por qué
 *                        elegirnos" reasons, quick facts, business highlights, language badges, the
 *                        business-type category line). These already carry ES/EN labels, so the
 *                        overlay re-labels them DETERMINISTICALLY from the catalog for the
 *                        destination locale — never sent to the translation API.
 *   CUSTOM_TRANSLATABLE — owner-authored prose (about, tagline, custom services / reasons /
 *                        highlights / quick facts / amenities / payment labels, credentials text,
 *                        coupon title / description / redemption note / CTA, promotion headline /
 *                        footnote, extra-link labels, custom badges) → masked → /api/translate-ad.
 *   LITERAL_PRESERVE   — business name, phones, email, URLs, social handles, coupon codes, prices,
 *                        dates, license numbers / authorities, addresses, service-area place names,
 *                        customer review quotes, payment brand names: never sent, never mutated.
 *   Amenity options and catalog payment methods are ids; their labels are resolved at render time
 *   with the destination locale (`contentLang` seam in the sections).
 *
 * Bundle transport: the shared provider translates in HTML mode, which folds tabs / newlines into
 * spaces — a tab-and-newline line protocol does NOT survive a live round trip. Multi-item fields are
 * therefore encoded as `<div data-lx="KEY">…</div>` records (columns as `<span>`), which the
 * provider preserves verbatim (live-proven 2026-09-14). Decoding is tolerant of inserted whitespace,
 * HTML entities in the translated text, and the legacy tab protocol (cached results, fixtures).
 * ============================================================================================ */

const CUSTOM_SERVICE_ID_PREFIX = "custom_offer_";
const PRESET_SERVICE_ID_PREFIX = "svc_";
const PRESET_REASON_ID_PREFIX = "trust_";
const CUSTOM_REASON_ID = "custom_reason";
const PRESET_HIGHLIGHT_ID_PREFIX = "bh_preset_";
const CUSTOM_HIGHLIGHT_ID_PREFIX = "bh_custom_";
const CUSTOM_QUICK_FACT_KIND = "custom";

/* ----------------------------------------------------------------------------------------------
 * HTML record codec (HTML-mode safe) + legacy tab/newline fallback.
 * -------------------------------------------------------------------------------------------- */
type LxRecord = { key: string; cols: string[] };

const LX_DIV_RE = /<div\s+data-lx="([^"]+)"\s*>([\s\S]*?)<\/div>/gi;
const LX_SPAN_RE = /<span\s*>([\s\S]*?)<\/span>/gi;
const LEGACY_TAGGED_RE = /^(qf|tr|cp|cn|pr|pf|cr|cf|el|pm|am|hb)[\t ]+([^\t ]+)[\t ]+(.*)$/;
const LEGACY_INDEXED_RE = /^(\d+)[\t ]+(.*)$/;
const ENTITY_RE = /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The provider returns HTML-mode text: apostrophes / ampersands come back as entities. */
export function decodeTranslatedEntities(s: string): string {
  return s.replace(ENTITY_RE, (match, code: string) => {
    const c = code.toLowerCase();
    if (c === "amp") return "&";
    if (c === "lt") return "<";
    if (c === "gt") return ">";
    if (c === "quot") return '"';
    if (c === "apos") return "'";
    if (c === "nbsp") return " ";
    const n = c.startsWith("#x") ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
  });
}

function cleanCol(raw: string): string {
  return decodeTranslatedEntities(raw.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function cleanProse(raw: string | undefined): string {
  return raw ? decodeTranslatedEntities(raw).trim() : "";
}

function encodeLxRecords(records: LxRecord[]): string | undefined {
  if (!records.length) return undefined;
  return records
    .map(({ key, cols }) =>
      cols.length === 1
        ? `<div data-lx="${key}">${escapeHtml(cols[0]!)}</div>`
        : `<div data-lx="${key}">${cols.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}</div>`,
    )
    .join("\n");
}

function decodeLxRecords(encoded: string): Map<string, string[]> | null {
  const out = new Map<string, string[]>();
  let found = false;
  LX_DIV_RE.lastIndex = 0;
  for (let m = LX_DIV_RE.exec(encoded); m; m = LX_DIV_RE.exec(encoded)) {
    found = true;
    const key = m[1]!.trim();
    const inner = m[2]!;
    const cols: string[] = [];
    LX_SPAN_RE.lastIndex = 0;
    for (let s = LX_SPAN_RE.exec(inner); s; s = LX_SPAN_RE.exec(inner)) cols.push(cleanCol(s[1]!));
    out.set(key, cols.length ? cols : [cleanCol(inner)]);
  }
  return found ? out : null;
}

/** Legacy `i<TAB>col…` lines (pre-HTML bundles / cached results / fixtures). */
function decodeLegacyIndexed(encoded: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const line of encoded.split("\n")) {
    const m = LEGACY_INDEXED_RE.exec(line.trimEnd());
    if (!m) continue;
    out.set(m[1]!, m[2]!.split("\t").map(cleanCol));
  }
  return out;
}

/** Legacy `tag<TAB>key<TAB>col…` lines. */
function decodeLegacyTagged(encoded: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const line of encoded.split("\n")) {
    const m = LEGACY_TAGGED_RE.exec(line.trimEnd());
    if (!m) continue;
    out.set(`${m[1]}:${m[2]}`, m[3]!.split("\t").map(cleanCol));
  }
  return out;
}

/* ----------------------------------------------------------------------------------------------
 * Services (`details`) — only owner-typed services ride the API; presets re-label from the catalog.
 * -------------------------------------------------------------------------------------------- */
/**
 * Owner-authored iff the catalog does not actually vouch for it — never by id prefix alone. An
 * empty id or a `custom_offer_*` id is always owner text. An id shaped like the preset prefix
 * (`svc_*`) that does not resolve to a real `BUSINESS_TYPE_PRESETS` entry (stale/malformed id,
 * e.g. from an older publish path) is owner text too, so it still rides the translation bundle
 * instead of silently falling through both the canonical relabel and the translation paths.
 */
export function isOwnerAuthoredService(service: ServiciosProfileResolved["services"][number]): boolean {
  const id = service.id ?? "";
  if (!id) return true;
  if (id.startsWith(CUSTOM_SERVICE_ID_PREFIX)) return true;
  const presetId = id.startsWith(PRESET_SERVICE_ID_PREFIX) ? id.slice(PRESET_SERVICE_ID_PREFIX.length) : id;
  return !canonicalPresetChip("service", { id: presetId, label: service.title });
}

function encodeServicesForTranslation(services: ServiciosProfileResolved["services"]): string | undefined {
  const records: LxRecord[] = [];
  services.forEach((s, i) => {
    if (!isOwnerAuthoredService(s)) return;
    const title = s.title.trim();
    const secondary = s.secondaryLine.trim();
    if (!title && !secondary) return;
    records.push({ key: String(i), cols: [title, secondary] });
  });
  return encodeLxRecords(records);
}

function decodeServicesFromTranslation(
  encoded: string,
  original: ServiciosProfileResolved["services"],
): ServiciosProfileResolved["services"] {
  const byIndex = decodeLxRecords(encoded) ?? decodeLegacyIndexed(encoded);
  return original.map((service, index) => {
    const cols = byIndex.get(String(index));
    if (!cols || !isOwnerAuthoredService(service)) return service;
    const title = cols[0] || service.title;
    const secondaryLine = cols[1] || service.secondaryLine;
    return {
      ...service,
      title,
      secondaryLine,
      imageAlt: service.imageAlt === service.title ? title : service.imageAlt,
    };
  });
}

/* ----------------------------------------------------------------------------------------------
 * Highlights (`highlights`) — custom `bh_custom_*` only.
 * -------------------------------------------------------------------------------------------- */
export function isOwnerAuthoredHighlight(item: ServiciosProfileResolved["highlights"][number]): boolean {
  return item.id.startsWith(CUSTOM_HIGHLIGHT_ID_PREFIX);
}

function encodeHighlightsForTranslation(highlights: ServiciosProfileResolved["highlights"]): string | undefined {
  const records: LxRecord[] = [];
  highlights.forEach((h, i) => {
    if (isOwnerAuthoredHighlight(h) && h.label.trim()) records.push({ key: String(i), cols: [h.label.trim()] });
  });
  return encodeLxRecords(records);
}

function decodeHighlightsFromTranslation(
  encoded: string,
  original: ServiciosProfileResolved["highlights"],
): ServiciosProfileResolved["highlights"] {
  const byIndex = decodeLxRecords(encoded) ?? decodeLegacyIndexed(encoded);
  return original.map((item, index) => {
    const label = byIndex.get(String(index))?.[0];
    return label && isOwnerAuthoredHighlight(item) ? { ...item, label } : item;
  });
}

/* ==============================================================================================
 * Canonical preset re-labelling (deterministic, no API) — catalog map in serviciosCanonicalPresetLabels.
 * ============================================================================================ */
/** Re-labels every CANONICAL_PRESET field for the destination locale. Pure; never touches literals. */
export function relabelServiciosCanonicalPresets(
  profile: ServiciosProfileResolved,
  target: ServiciosLang,
): ServiciosProfileResolved {
  const services = (profile.services ?? []).map((s) => {
    if (!(s.id ?? "").startsWith(PRESET_SERVICE_ID_PREFIX)) return s;
    const label = canonicalPresetLabel("service", { id: s.id.slice(PRESET_SERVICE_ID_PREFIX.length), label: s.title }, target);
    if (!label || label === s.title) return s;
    return { ...s, title: label, imageAlt: s.imageAlt === s.title ? label : s.imageAlt };
  });
  const trust = (profile.trust ?? []).map((t) => {
    if (!(t.id ?? "").startsWith(PRESET_REASON_ID_PREFIX)) return t;
    const label = canonicalPresetLabel("reason", { id: t.id.slice(PRESET_REASON_ID_PREFIX.length), label: t.label }, target);
    return label && label !== t.label ? { ...t, label } : t;
  });
  const highlights = (profile.highlights ?? []).map((h) => {
    if (!(h.id ?? "").startsWith(PRESET_HIGHLIGHT_ID_PREFIX)) return h;
    const label = canonicalPresetLabel("highlight", { id: h.id.slice(PRESET_HIGHLIGHT_ID_PREFIX.length), label: h.label }, target);
    return label && label !== h.label ? { ...h, label } : h;
  });
  const quickFacts = (profile.quickFacts ?? []).map((f) => {
    if (f.kind === CUSTOM_QUICK_FACT_KIND) return f;
    const label = canonicalPresetLabel("quickFact", { label: f.label }, target);
    return label && label !== f.label ? { ...f, label } : f;
  });
  const badges = (profile.hero?.badges ?? []).map((b) => {
    if (b.kind === "verified") return b; // resolver-owned Leonix copy, already in page locale
    const label = canonicalPresetLabel("language", { label: b.label }, target);
    return label && label !== b.label ? { ...b, label } : b;
  });
  const categoryLine = profile.hero?.categoryLine
    ? canonicalBusinessTypeLabel(profile.hero.categoryLine, target) ?? profile.hero.categoryLine
    : profile.hero?.categoryLine;
  return {
    ...profile,
    hero: { ...profile.hero, badges, categoryLine },
    services,
    trust,
    highlights,
    quickFacts,
  };
}

/* ==============================================================================================
 * Owner-authored extras — records in the `body` field, key = `tag:ref`:
 *   qf:<i>            custom quick fact
 *   tr:<i>            custom "Por qué elegirnos" reason
 *   cp:<i>            coupon [title, description]
 *   cn:<i>            coupon [redemption note, CTA label]
 *   pr:<i>            promotion headline (i ≥ 1; index 0 rides `shareText`)
 *   pf:<i>            promotion footnote
 *   cr:<field>        credentials licenseType | insuranceType
 *   cf:<i>            certification label
 *   el:<i>            extra-link label (URL stays literal)
 *   pm:<i>            custom payment label
 *   am:<group>:<i>    custom amenity label per group
 *   hb:<i>            custom hero badge (not a catalog language)
 * ============================================================================================ */
/**
 * Owner-typed quick facts are usually kind `custom`, but the mapper infers `emergency` /
 * `mobile_service` / `bilingual` from the owner's own words — so anything whose label is not a
 * Leonix preset chip is owner prose and translates; catalog labels re-label canonically.
 */
export function isOwnerAuthoredQuickFact(fact: ServiciosProfileResolved["quickFacts"][number]): boolean {
  if (fact.kind === CUSTOM_QUICK_FACT_KIND) return true;
  return canonicalPresetLabel("quickFact", { label: fact.label }, "es") == null;
}

export function isOwnerAuthoredTrustItem(item: ServiciosProfileResolved["trust"][number]): boolean {
  return item.id === CUSTOM_REASON_ID;
}

export function isOwnerAuthoredHeroBadge(badge: ServiciosProfileResolved["hero"]["badges"][number]): boolean {
  if (badge.kind === "verified") return false;
  return canonicalPresetLabel("language", { label: badge.label }, "es") == null;
}

function encodeOwnerExtrasForTranslation(profile: ServiciosProfileResolved): string | undefined {
  const records: LxRecord[] = [];
  const push = (tag: string, ref: string | number, ...cols: string[]) => {
    records.push({ key: `${tag}:${ref}`, cols });
  };
  // Resolved profiles always carry these arrays; partial/legacy inputs are tolerated.
  (profile.quickFacts ?? []).forEach((fact, i) => {
    const label = fact.label.trim();
    if (isOwnerAuthoredQuickFact(fact) && label) push("qf", i, label);
  });
  (profile.trust ?? []).forEach((item, i) => {
    const label = item.label.trim();
    if (isOwnerAuthoredTrustItem(item) && label) push("tr", i, label);
  });
  (profile.coupons ?? []).forEach((coupon, i) => {
    const title = coupon.title.trim();
    const description = coupon.description?.trim() ?? "";
    if (title || description) push("cp", i, title, description);
    const note = coupon.redemptionNote?.trim() ?? "";
    const cta = coupon.ctaLabel?.trim() ?? "";
    if (note || cta) push("cn", i, note, cta);
  });
  (profile.promotions ?? []).forEach((promo, i) => {
    if (i > 0 && promo.headline.trim()) push("pr", i, promo.headline.trim());
    const footnote = promo.footnote?.trim() ?? "";
    if (footnote) push("pf", i, footnote);
  });
  const c = profile.credentials;
  if (c) {
    if (c.licenseType?.trim()) push("cr", "licenseType", c.licenseType.trim());
    if (c.insuranceType?.trim()) push("cr", "insuranceType", c.insuranceType.trim());
    (c.certifications ?? []).forEach((cert, i) => {
      if (cert.trim()) push("cf", i, cert.trim());
    });
  }
  (profile.contact?.extraLinks ?? []).forEach((link, i) => {
    if (link.label.trim()) push("el", i, link.label.trim());
  });
  (profile.customPaymentMethods ?? []).forEach((label, i) => {
    if (label.trim()) push("pm", i, label.trim());
  });
  for (const [group, labels] of Object.entries(profile.customAmenityOptionsByGroup ?? {})) {
    (labels ?? []).forEach((label, i) => {
      if (label.trim()) push("am", `${group}:${i}`, label.trim());
    });
  }
  (profile.hero?.badges ?? []).forEach((badge, i) => {
    if (isOwnerAuthoredHeroBadge(badge) && badge.label.trim()) push("hb", i, badge.label.trim());
  });
  return encodeLxRecords(records);
}

function decodeOwnerExtrasFromTranslation(
  encoded: string,
  profile: ServiciosProfileResolved,
): ServiciosProfileResolved {
  const records = decodeLxRecords(encoded) ?? decodeLegacyTagged(encoded);

  const quickFacts = new Map<number, string>();
  const trust = new Map<number, string>();
  const coupons = new Map<number, { title: string; description: string }>();
  const couponNotes = new Map<number, { note: string; cta: string }>();
  const promotions = new Map<number, string>();
  const footnotes = new Map<number, string>();
  const credentials = new Map<string, string>();
  const certifications = new Map<number, string>();
  const links = new Map<number, string>();
  const payments = new Map<number, string>();
  const amenities = new Map<string, Map<number, string>>();
  const badges = new Map<number, string>();

  for (const [key, cols] of records) {
    const at = key.indexOf(":");
    if (at < 0) continue;
    const tag = key.slice(0, at);
    const ref = key.slice(at + 1);
    const index = Number(ref);
    const p = cols[0] ?? "";
    const s = cols[1] ?? "";
    switch (tag) {
      case "qf": if (Number.isFinite(index)) quickFacts.set(index, p); break;
      case "tr": if (Number.isFinite(index)) trust.set(index, p); break;
      case "cp": if (Number.isFinite(index)) coupons.set(index, { title: p, description: s }); break;
      case "cn": if (Number.isFinite(index)) couponNotes.set(index, { note: p, cta: s }); break;
      case "pr": if (Number.isFinite(index)) promotions.set(index, p); break;
      case "pf": if (Number.isFinite(index)) footnotes.set(index, p); break;
      case "cr": credentials.set(ref, p); break;
      case "cf": if (Number.isFinite(index)) certifications.set(index, p); break;
      case "el": if (Number.isFinite(index)) links.set(index, p); break;
      case "pm": if (Number.isFinite(index)) payments.set(index, p); break;
      case "am": {
        const sep = ref.lastIndexOf(":");
        const group = sep > 0 ? ref.slice(0, sep) : "";
        const gi = Number(sep > 0 ? ref.slice(sep + 1) : NaN);
        if (group && Number.isFinite(gi)) {
          const m = amenities.get(group) ?? new Map<number, string>();
          m.set(gi, p);
          amenities.set(group, m);
        }
        break;
      }
      case "hb": if (Number.isFinite(index)) badges.set(index, p); break;
    }
  }

  let next = profile;
  if (quickFacts.size) {
    next = { ...next, quickFacts: next.quickFacts.map((fact, i) => {
      const label = quickFacts.get(i);
      return label && isOwnerAuthoredQuickFact(fact) ? { ...fact, label } : fact;
    }) };
  }
  if (trust.size) {
    next = { ...next, trust: next.trust.map((item, i) => {
      const label = trust.get(i);
      return label && isOwnerAuthoredTrustItem(item) ? { ...item, label } : item;
    }) };
  }
  if (coupons.size || couponNotes.size) {
    next = { ...next, coupons: next.coupons.map((coupon, i) => {
      const t = coupons.get(i);
      const n = couponNotes.get(i);
      if (!t && !n) return coupon;
      return {
        ...coupon,
        title: t?.title || coupon.title,
        description: coupon.description ? t?.description || coupon.description : coupon.description,
        redemptionNote: coupon.redemptionNote ? n?.note || coupon.redemptionNote : coupon.redemptionNote,
        ctaLabel: coupon.ctaLabel ? n?.cta || coupon.ctaLabel : coupon.ctaLabel,
      };
    }) };
  }
  if (promotions.size || footnotes.size) {
    next = { ...next, promotions: next.promotions.map((promo, i) => {
      const headline = i > 0 ? promotions.get(i) : undefined;
      const footnote = footnotes.get(i);
      if (!headline && !footnote) return promo;
      return {
        ...promo,
        headline: headline || promo.headline,
        footnote: promo.footnote ? footnote || promo.footnote : promo.footnote,
      };
    }) };
  }
  if (next.credentials && (credentials.size || certifications.size)) {
    const c = next.credentials;
    next = { ...next, credentials: {
      ...c,
      licenseType: c.licenseType ? credentials.get("licenseType") || c.licenseType : c.licenseType,
      insuranceType: c.insuranceType ? credentials.get("insuranceType") || c.insuranceType : c.insuranceType,
      certifications: (c.certifications ?? []).map((cert, i) => certifications.get(i) || cert),
    } };
  }
  if (links.size && next.contact?.extraLinks?.length) {
    next = { ...next, contact: { ...next.contact, extraLinks: next.contact.extraLinks.map((link, i) => {
      const label = links.get(i);
      return label ? { ...link, label } : link;
    }) } };
  }
  if (payments.size && next.customPaymentMethods?.length) {
    next = { ...next, customPaymentMethods: next.customPaymentMethods.map((label, i) => payments.get(i) || label) };
  }
  if (amenities.size) {
    const byGroup: Record<string, string[]> = {};
    for (const [group, labels] of Object.entries(next.customAmenityOptionsByGroup ?? {})) {
      const m = amenities.get(group);
      byGroup[group] = (labels ?? []).map((label, i) => m?.get(i) || label);
    }
    next = { ...next, customAmenityOptionsByGroup: byGroup, customAmenityOptions: Object.values(byGroup).flat() };
  }
  if (badges.size && next.hero?.badges?.length) {
    next = { ...next, hero: { ...next.hero, badges: next.hero.badges.map((badge, i) => {
      const label = badges.get(i);
      return label && isOwnerAuthoredHeroBadge(badge) ? { ...badge, label } : badge;
    }) } };
  }
  return next;
}

/** User-authored prose only — contact, business name, URLs, prices, codes and dates stay out. */
export function buildServiciosTranslatableContent(
  profile: ServiciosProfileResolved,
): TranslatableAdFields {
  const about = profile.about;
  const firstPromo = profile.promotions?.[0];
  const categoryLine = profile.hero?.categoryLine?.trim();

  return {
    // The category line is a catalog label for preset business types (re-labelled canonically);
    // only a custom "other" category line is owner prose.
    title: categoryLine && canonicalBusinessTypeLabel(categoryLine, "es") == null ? categoryLine : undefined,
    description: about?.text?.trim() || undefined,
    customServiceText: about?.specialtiesLine?.trim() || undefined,
    highlights: encodeHighlightsForTranslation(profile.highlights ?? []),
    details: encodeServicesForTranslation(profile.services ?? []),
    shareText: firstPromo?.headline?.trim() || undefined,
    body: encodeOwnerExtrasForTranslation(profile),
  };
}

export function hasServiciosTranslatableProse(content: unknown): boolean {
  const picked = pickTranslatableAdFields(content);
  return Object.keys(picked).length > 0;
}

/**
 * Overlay: canonical preset re-labelling for `targetLocale` (when known) + the machine-translated
 * owner prose. Pure — the caller keeps the untouched `profile` for "Ver original".
 */
export function applyServiciosTranslation(
  profile: ServiciosProfileResolved,
  translated: Partial<TranslatableAdFields>,
  targetLocale?: ServiciosLang,
): ServiciosProfileResolved {
  let next: ServiciosProfileResolved = targetLocale ? relabelServiciosCanonicalPresets(profile, targetLocale) : profile;

  const title = cleanProse(translated.title);
  if (title) {
    next = { ...next, hero: { ...next.hero, categoryLine: title } };
  }

  const description = cleanProse(translated.description);
  if (description) {
    next = { ...next, about: { ...next.about, text: description } };
  }

  const specialties = cleanProse(translated.customServiceText);
  if (specialties) {
    next = { ...next, about: { ...next.about, specialtiesLine: specialties } };
  }

  if (translated.details?.trim()) {
    next = { ...next, services: decodeServicesFromTranslation(translated.details, next.services) };
  }

  if (translated.highlights?.trim()) {
    next = { ...next, highlights: decodeHighlightsFromTranslation(translated.highlights, next.highlights) };
  }

  const shareText = cleanProse(translated.shareText);
  if (shareText && next.promotions.length > 0) {
    next = {
      ...next,
      promotions: next.promotions.map((promo, index) => (index === 0 ? { ...promo, headline: shareText } : promo)),
    };
  }

  if (translated.body?.trim()) {
    next = decodeOwnerExtrasFromTranslation(translated.body, next);
  }

  return next;
}

/* ==============================================================================================
 * Servicios Final UI Truth Closeout (2026-09-16) — RESULTS-CARD-SCOPED translation.
 *
 * The full-profile translation above (`buildServiciosTranslatableContent`/`applyServiciosTranslation`)
 * covers every owner-authored field on the DETAIL page (about, highlights, coupons, promotions,
 * credentials, …) — most of which a results card never renders. Sending that whole bundle just to
 * translate a card would violate "translate only the fields actually rendered in the card." These
 * card-scoped variants translate ONLY the category chip (when it's owner-authored "otro" text) and
 * the owner-authored service chip titles actually displayed on the card — nothing else. Uses a
 * DIFFERENT `version` string at the call site so its cache entries never collide with the
 * full-profile page's own cache for the same listing.
 * ============================================================================================ */
export type ServiciosCardTranslatableInput = {
  /** Only set when the category line is owner-authored "otro" text (never a catalog preset label). */
  categoryLine?: string;
  /** The exact, already-displayed, owner-authored chip strings on this card (post clean/de-dup). */
  ownerAuthoredChips: string[];
};

export function buildServiciosCardTranslatableContent(
  input: ServiciosCardTranslatableInput,
): TranslatableAdFields {
  return {
    title: input.categoryLine?.trim() || undefined,
    details: encodeLxRecords(
      input.ownerAuthoredChips
        .map((c, i) => ({ key: String(i), cols: [c.trim()] }))
        .filter((r) => r.cols[0]),
    ),
  };
}

export type ServiciosCardTranslationResult = {
  categoryLine?: string;
  /** Original displayed chip text -> translated chip text (only entries that actually changed). */
  chipsByOriginal: Map<string, string>;
};

export function applyServiciosCardTranslation(
  translated: Partial<TranslatableAdFields>,
  input: ServiciosCardTranslatableInput,
): ServiciosCardTranslationResult {
  const categoryLine = cleanProse(translated.title) || undefined;
  const chipsByOriginal = new Map<string, string>();
  if (translated.details?.trim()) {
    const byIndex = decodeLxRecords(translated.details) ?? decodeLegacyIndexed(translated.details);
    input.ownerAuthoredChips.forEach((orig, i) => {
      const value = byIndex.get(String(i))?.[0];
      if (value && value !== orig) chipsByOriginal.set(orig, value);
    });
  }
  return { categoryLine, chipsByOriginal };
}

/** Client-only: POST masked fields to the server translate route (no API keys). */
export { requestAdTranslation as requestServiciosAdTranslation } from "@/app/lib/translation/requestAdTranslation";
