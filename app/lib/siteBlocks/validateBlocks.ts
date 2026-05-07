import type { CardGroupCard, NormalizedPageBlockForSave, SiteBlockLocale, SiteBlockType } from "./blockTypes";
import { SITE_BLOCK_LOCALES, SITE_BLOCK_TYPES } from "./blockTypes";

const MAX_BLOCKS_PER_PAGE = 50;
const MAX_CARDS_IN_CARD_GROUP = 24;
const MAX_SPACER_REM = 40;

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function bool(v: unknown, defaultTrue: boolean): boolean {
  if (v === true || v === "true" || v === "1" || v === 1) return true;
  if (v === false || v === "false" || v === "0" || v === 0) return false;
  return defaultTrue;
}

export function isSiteBlockLocale(s: string): s is SiteBlockLocale {
  return (SITE_BLOCK_LOCALES as readonly string[]).includes(s);
}

export function isSiteBlockType(s: string): s is SiteBlockType {
  return (SITE_BLOCK_TYPES as readonly string[]).includes(s);
}

function normalizeCardGroupCard(raw: unknown): CardGroupCard {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { title: "", body: "", imageUrl: "", ctaLabel: "", ctaHref: "" };
  }
  const o = raw as Record<string, unknown>;
  return {
    title: str(o.title),
    body: str(o.body),
    imageUrl: str(o.imageUrl),
    ctaLabel: str(o.ctaLabel),
    ctaHref: str(o.ctaHref),
  };
}

function normalizePayloadForType(blockType: SiteBlockType, raw: unknown): Record<string, unknown> {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  switch (blockType) {
    case "hero":
      return {
        headlineEs: str(src.headlineEs),
        headlineEn: str(src.headlineEn),
        subheadlineEs: str(src.subheadlineEs),
        subheadlineEn: str(src.subheadlineEn),
        primaryCtaLabelEs: str(src.primaryCtaLabelEs),
        primaryCtaLabelEn: str(src.primaryCtaLabelEn),
        primaryCtaHref: str(src.primaryCtaHref),
        secondaryCtaLabelEs: str(src.secondaryCtaLabelEs),
        secondaryCtaLabelEn: str(src.secondaryCtaLabelEn),
        secondaryCtaHref: str(src.secondaryCtaHref),
        imageUrl: str(src.imageUrl),
        imageAltEs: str(src.imageAltEs),
        imageAltEn: str(src.imageAltEn),
      };
    case "rich_text":
      return {
        bodyEs: str(src.bodyEs),
        bodyEn: str(src.bodyEn),
      };
    case "image_text":
      return {
        imageUrl: str(src.imageUrl),
        imageAltEs: str(src.imageAltEs),
        imageAltEn: str(src.imageAltEn),
        titleEs: str(src.titleEs),
        titleEn: str(src.titleEn),
        bodyEs: str(src.bodyEs),
        bodyEn: str(src.bodyEn),
        ctaLabelEs: str(src.ctaLabelEs),
        ctaLabelEn: str(src.ctaLabelEn),
        ctaHref: str(src.ctaHref),
      };
    case "cta_strip":
      return {
        primaryLabelEs: str(src.primaryLabelEs),
        primaryLabelEn: str(src.primaryLabelEn),
        primaryHref: str(src.primaryHref),
        secondaryLabelEs: str(src.secondaryLabelEs),
        secondaryLabelEn: str(src.secondaryLabelEn),
        secondaryHref: str(src.secondaryHref),
      };
    case "card_group": {
      const cardsRaw = Array.isArray(src.cards) ? src.cards : [];
      const cards = cardsRaw.slice(0, MAX_CARDS_IN_CARD_GROUP).map(normalizeCardGroupCard);
      return {
        sectionTitleEs: str(src.sectionTitleEs),
        sectionTitleEn: str(src.sectionTitleEn),
        cards,
      };
    }
    case "announcement":
      return {
        messageEs: str(src.messageEs),
        messageEn: str(src.messageEn),
        variant: str(src.variant),
      };
    case "spacer": {
      const h = src.heightRem;
      let heightRem = 1;
      if (typeof h === "number" && Number.isFinite(h)) {
        heightRem = Math.min(MAX_SPACER_REM, Math.max(0, Math.floor(h)));
      } else if (typeof h === "string" && h.trim() && Number.isFinite(Number(h))) {
        heightRem = Math.min(MAX_SPACER_REM, Math.max(0, Math.floor(Number(h))));
      }
      return { heightRem };
    }
    default:
      return {};
  }
}

/**
 * Normalize a single loose block input (e.g. future form JSON).
 */
export function normalizePageBlockInput(
  input: unknown,
): { ok: true; block: NormalizedPageBlockForSave } | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "block_must_be_object" };
  }
  const o = input as Record<string, unknown>;
  const typeRaw = str(o.block_type);
  if (!typeRaw) {
    return { ok: false, error: "block_type_required" };
  }
  if (!isSiteBlockType(typeRaw)) {
    return { ok: false, error: `unknown_block_type:${typeRaw}` };
  }
  const visible = bool(o.visible, true);
  const payload = normalizePayloadForType(typeRaw, o.payload);
  return {
    ok: true,
    block: { block_type: typeRaw, visible, payload },
  };
}

export type ValidatePageBlocksResult =
  | { ok: true; pageKey: string; locale: SiteBlockLocale; blocks: NormalizedPageBlockForSave[] }
  | { ok: false; error: string };

/**
 * Validate `page_key`, `locale`, and an array of blocks for a replace/save operation.
 * Enforces max blocks per page and allowlisted block types.
 */
export function validatePageBlocksForSave(
  pageKey: string,
  locale: string,
  blocks: unknown[],
): ValidatePageBlocksResult {
  const pk = str(pageKey);
  if (!pk) {
    return { ok: false, error: "page_key_required" };
  }
  const loc = str(locale) || "es";
  if (!isSiteBlockLocale(loc)) {
    return { ok: false, error: `invalid_locale:${loc}` };
  }
  if (!Array.isArray(blocks)) {
    return { ok: false, error: "blocks_must_be_array" };
  }
  if (blocks.length > MAX_BLOCKS_PER_PAGE) {
    return { ok: false, error: `too_many_blocks:max_${MAX_BLOCKS_PER_PAGE}` };
  }

  const out: NormalizedPageBlockForSave[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const r = normalizePageBlockInput(blocks[i]);
    if (!r.ok) {
      return { ok: false, error: `block_${i}:${r.error}` };
    }
    out.push(r.block);
  }
  return { ok: true, pageKey: pk, locale: loc, blocks: out };
}

export { MAX_BLOCKS_PER_PAGE, MAX_CARDS_IN_CARD_GROUP };
