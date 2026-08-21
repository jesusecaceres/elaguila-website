/**
 * Package A — Leonix Creative Doctrine v1 rule set.
 *
 * Encodes the canonical Leonix creative rules as structured, taggable DoctrineRule records
 * instead of one flat document. compiler.ts selects only the rules relevant to a given job.
 *
 * These rules govern AI PROVIDER GENERATION (Gemini/OpenAI copy, headlines, briefs). They do not
 * replace CREATIVE_DOCTRINE_RULES in ../types.ts, which remains the Canva production-handoff
 * doctrine text consumed by canvaPromptCompiler.ts.
 */
import type { DoctrineRule } from "./types";

// ─── A. Creative philosophy — universal ───────────────────────────────────
export const PHILOSOPHY_RULES: readonly DoctrineRule[] = [
  {
    id: "philosophy_different_content_one_taste",
    category: "PHILOSOPHY",
    text: "DIFFERENT CONTENT. DIFFERENT ENERGY. ONE LEONIX TASTE. Every creative family should feel distinct in content and energy while remaining recognizably Leonix in craft and quality.",
  },
  {
    id: "philosophy_qualities",
    category: "PHILOSOPHY",
    text: "Leonix creative should feel intentional, premium, useful, local, human, culturally aware, action-oriented, polished, memorable, worth keeping, and worth paying for. Never produce a generic template-looking AI advertisement.",
  },
];

// ─── B. Creative hierarchy — universal ────────────────────────────────────
export const HIERARCHY_RULES: readonly DoctrineRule[] = [
  {
    id: "hierarchy_stop_understand_value_proof_action",
    category: "HIERARCHY",
    text: "Every strong creative should normally communicate, in order: 1) STOP, 2) UNDERSTAND, 3) VALUE, 4) PROOF/USEFULNESS, 5) ACTION.",
  },
  {
    id: "hierarchy_one_pop_rule",
    category: "HIERARCHY",
    text: "Use the ONE-POP rule: one dominant visual/message moment. Do not create many competing focal points.",
  },
];

// ─── C. Truth lock — universal, highest priority ──────────────────────────
export const TRUTH_LOCK_RULES: readonly DoctrineRule[] = [
  {
    id: "truth_lock_never_invent",
    category: "TRUTH_LOCK",
    text: "Never silently invent or alter: business name, price, offer, address, phone, date, promotion terms, credentials, ratings, testimonials, reviews, years in business, certifications, business claims, sponsorship relationships, client identity, official logo, QR destination, or partnership status.",
  },
  {
    id: "truth_lock_snapshot_outranks_suggestion",
    category: "TRUTH_LOCK",
    text: "Truth from the verified input snapshot always outranks any creative suggestion. UNKNOWN means UNKNOWN. STALE means STALE. CONTRADICTED means CONTRADICTED. An UNAPPROVED_INFERENCE must never be promoted into a customer-facing fact.",
  },
];

// ─── D. Real asset priority — universal ───────────────────────────────────
export const ASSET_PRIORITY_RULES: readonly DoctrineRule[] = [
  {
    id: "asset_priority_order",
    category: "ASSET_PRIORITY",
    text: "Prefer real assets in this order: 1) client official logo, 2) client real photography, 3) Leonix-owned real photography, 4) official/licensed event assets, 5) permitted public business imagery, 6) stock/editorial photography, 7) AI support imagery, 8) AI full concept where appropriate.",
  },
  {
    id: "asset_priority_ai_fills_gaps",
    category: "ASSET_PRIORITY",
    text: "AI fills gaps in real business identity. AI never erases or replaces real business identity when real assets are available.",
  },
];

// ─── E. Anti-AI standard — universal ──────────────────────────────────────
export const ANTI_AI_RULES: readonly DoctrineRule[] = [
  {
    id: "anti_ai_avoid_list",
    category: "ANTI_AI",
    text: "Avoid: plastic skin, impossible anatomy, fake storefronts, fake signage, fake logos, fake QR codes, excessive glow, excessive sparks, arbitrary confetti, visual clutter, impossible food, and synthetic stock-looking humans.",
  },
  {
    id: "anti_ai_realism_targets",
    category: "ANTI_AI",
    text: "Realism targets: editorial ~70% believable editorial reality / 30% stylization; sports/entertainment may allow more stylization; food/beauty/professional services generally favor high realism; resources/legal/finance favor clarity and trust over spectacle.",
    appliesToFamilies: ["EVENTS_LOCAL_DISCOVERY", "SPORTS_FAN_ENERGY", "FOOD_RECIPES", "HEALTH_WELLNESS", "RESOURCES_PUBLIC_INFORMATION", "FINANCE_BUSINESS"],
  },
  {
    id: "anti_ai_disclosure_flag",
    category: "ANTI_AI",
    text: "If generated imagery could reasonably be mistaken for documentary photography, flag that an AI disclosure may be needed.",
  },
];

// ─── F. Business ad doctrine — business_description / magazine_ad / flyer / social / campaign ──
export const BUSINESS_AD_ASSET_TYPES = [
  "magazine_ad", "business_description", "social_copy", "whatsapp_promo_copy",
  "flyer_copy", "coupon_copy", "campaign_plan_30_day",
] as const;

export const BUSINESS_AD_RULES: readonly DoctrineRule[] = [
  {
    id: "business_ad_prioritize_inputs",
    category: "BUSINESS_AD",
    text: "Before final creative, prioritize in order: business name, category, service area, target customer, business goal, primary CTA, strongest service, differentiator, verified offer, trust proof, real brand colors, official logo, real photography, phone, address, website, social/booking, languages, Leonix profile, QR destination, and unresolved facts.",
    appliesToAssetTypes: [...BUSINESS_AD_ASSET_TYPES],
  },
  {
    id: "business_ad_copy_hierarchy",
    category: "BUSINESS_AD",
    text: "Preferred copy hierarchy: HOOK → BRAND → PROMISE → PROOF → IMPORTANT SERVICES → ACTION. Do not automatically lead with generic copy such as \"Welcome to...\" or \"Call us today!\".",
    appliesToAssetTypes: [...BUSINESS_AD_ASSET_TYPES],
  },
];

// ─── G. Sponsored educational features — sponsored_insert ─────────────────
export const SPONSORED_FEATURE_RULES: readonly DoctrineRule[] = [
  {
    id: "sponsored_feature_value_split",
    category: "SPONSORED_FEATURE",
    text: "Target roughly: 50% reader value, 30% partner authority, 20% branding/action.",
    appliesToAssetTypes: ["sponsored_insert"],
  },
  {
    id: "sponsored_feature_disclosure",
    category: "SPONSORED_FEATURE",
    text: "Sponsorship must be clearly labeled using an approved sponsor-disclosure phrase. Payment never creates false claims and never creates a fake editorial endorsement.",
    appliesToAssetTypes: ["sponsored_insert"],
  },
];

// ─── H. Magazine print standard — universal for print formats ────────────
export const PRINT_GEOMETRY_RULES: readonly DoctrineRule[] = [
  {
    id: "print_geometry_canonical_source",
    category: "PRINT_GEOMETRY",
    text: "Print geometry (trim, bleed, safe inset, PPI) is always sourced from printSpecs.ts at generation/compile time — this doctrine never duplicates hardcoded dimensions. Reserve a QR zone and a CTA zone per the selected format's zones.",
  },
];

// ─── I. QR / brand rule — universal ────────────────────────────────────────
export const QR_BRAND_RULES: readonly DoctrineRule[] = [
  {
    id: "qr_brand_never_fake",
    category: "QR_BRAND",
    text: "Never generate a fake QR code. Never redraw an official Leonix or client logo when a real asset exists. If reliable insertion of exact branding is unavailable, reserve clean space instead — Canva/manual finishing inserts the exact QR, exact logo, final typography, hyperlinks, bleed/export, and other editable final details.",
  },
];

// ─── J. Creative families — informational, tone selection only ───────────
export const CREATIVE_FAMILY_TONE_RULES: readonly DoctrineRule[] = [
  { id: "family_tone_business_concierge", category: "FAMILY_TONE", text: "Leonix House / Business Concierge tone: trustworthy, plain-language, staff-and-owner-facing — never a public sales pitch.", appliesToFamilies: ["LEONIX_HOUSE_BUSINESS_CONCIERGE"] },
  { id: "family_tone_business_ad", category: "FAMILY_TONE", text: "Business ad tone: direct, locally credible, respectful of the business owner's voice.", appliesToFamilies: ["BUSINESS_AD"] },
  { id: "family_tone_sponsored_feature", category: "FAMILY_TONE", text: "Sponsored educational feature tone: reader-first, informative, clearly labeled as sponsored.", appliesToFamilies: ["SPONSORED_EDUCATIONAL_FEATURE"] },
  { id: "family_tone_do_not_force_one_palette", category: "FAMILY_TONE", text: "Do not force one color palette or one template onto all creative families — sports/fan energy, events, family/community, food, health, resources, finance, and culture/heritage each have their own visual register." },
];

/** All rules, flattened. Used by the compiler to filter down to what's relevant for a given job. */
export const ALL_DOCTRINE_RULES: readonly DoctrineRule[] = [
  ...PHILOSOPHY_RULES,
  ...HIERARCHY_RULES,
  ...TRUTH_LOCK_RULES,
  ...ASSET_PRIORITY_RULES,
  ...ANTI_AI_RULES,
  ...BUSINESS_AD_RULES,
  ...SPONSORED_FEATURE_RULES,
  ...PRINT_GEOMETRY_RULES,
  ...QR_BRAND_RULES,
  ...CREATIVE_FAMILY_TONE_RULES,
];
