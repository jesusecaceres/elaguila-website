/**
 * Gate QB-MEDIA-03 — semantic media contract for Quick Business, enforced on the SERVER.
 *
 * THE PROBLEM THIS SOLVES: the Quick copy has always *said* "a real photo of the vehicle you are
 * listing (not of the business)" and "a real photo of the property (not of your office)", but
 * nothing enforced it. `QuickMediaItem` carried no semantic role, so a dealer could satisfy the
 * photo requirement with a dealership logo and an agent could satisfy it with a headshot.
 *
 * WHAT THE 2026-09-21 AUDIT FOUND, AND WHAT THIS REVISION REPAIRS
 * --------------------------------------------------------------
 * The first version of this module declared the rule but was operationally inert:
 *
 *   1. no producer emitted roles, so every real submission arrived unroled;
 *   2. `effectiveRole` UPGRADED a missing role to the family's required subject role, so an
 *      unroled logo silently became a "vehicle photo" — the exact misclassification the rule
 *      exists to prevent;
 *   3. only the two staff-assisted routes called the validator; the four customer self-service
 *      publish paths were unprotected server-side.
 *
 * This revision fixes all three:
 *
 *   1. the Quick Business intake now collects an EXPLICIT role per image
 *      (`QuickBusinessMediaItem.role`) and every adapter stamps it onto the canonical draft;
 *   2. a missing role resolves to `"unspecified"`, which can NEVER satisfy a subject requirement.
 *      No implicit upgrade happens anywhere in this file. A family whose subject media lives in
 *      a structurally single-purpose field (Servicios / Restaurantes business galleries) gets its
 *      role by EXPLICIT PER-FAMILY ATTRIBUTION during extraction — a decision this module makes
 *      and documents per field, never a silent default applied to whatever arrives;
 *   3. `enforceQuickBusinessPublishMedia` is the single canonical entry point, and all six server
 *      seams (four self-service + two staff-assisted) call it.
 *
 * NO IMAGE RECOGNITION IS ADDED. The customer declares what each photo is; the server refuses a
 * submission whose declared roles cannot satisfy the listing. This mirrors a distinction the
 * codebase already makes structurally: `ProposedFinalMediaSet` keeps `logoUrl` separate from
 * `images` and documents that a logo is "never counted in images".
 *
 * Pure and IO-free: the server routes, the intake and the verifiers all share it.
 */

/**
 * What an uploaded image depicts. `logo` and `headshot` are IDENTITY assets: they are legitimate
 * uploads, but they can never satisfy a listing's subject-photo requirement.
 */
export const QUICK_MEDIA_ROLES = ["vehicle", "property", "business", "logo", "headshot"] as const;
export type QuickMediaRole = (typeof QUICK_MEDIA_ROLES)[number];

/** Roles that depict the thing being listed. Identity assets are deliberately excluded. */
export const SUBJECT_ROLES: readonly QuickMediaRole[] = ["vehicle", "property", "business"];

/** Roles that are identity assets and never count toward the image minimum. */
export const IDENTITY_ROLES: readonly QuickMediaRole[] = ["logo", "headshot"];

/**
 * The resolved role of a single item.
 *  - a `QuickMediaRole` — the item declared it, or this module attributed it explicitly;
 *  - `"unspecified"` — nothing declared or attributed a role. NEVER satisfies a subject minimum;
 *  - `"invalid"`      — a role string that is not in `QUICK_MEDIA_ROLES` (a typo must not pass).
 */
export type ResolvedMediaRole = QuickMediaRole | "unspecified" | "invalid";

export function isQuickMediaRole(value: unknown): value is QuickMediaRole {
  return typeof value === "string" && (QUICK_MEDIA_ROLES as readonly string[]).includes(value);
}

export function isIdentityRole(value: unknown): value is QuickMediaRole {
  return isQuickMediaRole(value) && IDENTITY_ROLES.includes(value);
}

export const QUICK_BUSINESS_MEDIA_CATEGORIES = ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"] as const;
export type QuickBusinessMediaCategory = (typeof QUICK_BUSINESS_MEDIA_CATEGORIES)[number];

export function isQuickBusinessMediaCategory(value: unknown): value is QuickBusinessMediaCategory {
  return typeof value === "string" && (QUICK_BUSINESS_MEDIA_CATEGORIES as readonly string[]).includes(value);
}

/**
 * How a family's subject role may be established.
 *
 *  - `"declared"`   — ONLY an explicit `role` on the item counts. Used by Autos Dealer and Bienes
 *    Negocio, whose canonical media arrays are genuinely mixed-use: a dealer legitimately stores
 *    dealership/logo imagery next to vehicle photos, and an agent stores headshot/brokerage
 *    imagery next to property photos. An unroled item there is ambiguous, so it is refused with a
 *    correction message rather than guessed at.
 *
 *  - `"structural"` — the family's gallery field carries ONLY subject media by construction, so
 *    this module attributes the subject role to items drawn from it. Used by Servicios and
 *    Restaurantes, whose canonical shape already separates identity media into its own
 *    non-gallery field (`ProposedFinalMediaSet.logoUrl`, `logoAllowed: false` on both publish
 *    routes). The attribution is per-field and stated here; it is never a fallback applied to
 *    unknown input, and an item in those galleries that EXPLICITLY declares an identity role is
 *    still excluded.
 *
 * Note the asymmetry is exactly the mission's rule: a missing role never becomes `vehicle` or
 * `property`. `SUBJECT_ATTRIBUTION` is asserted in the behavioral verifier so it cannot drift.
 */
export const SUBJECT_ATTRIBUTION: Readonly<Record<QuickBusinessMediaCategory, "declared" | "structural">> = {
  servicios: "structural",
  restaurantes: "structural",
  "autos-dealer": "declared",
  "bienes-negocio": "declared",
};

/** The subject role each Quick Business family requires at least one of. */
export const REQUIRED_SUBJECT_ROLE_BY_CATEGORY: Readonly<Record<QuickBusinessMediaCategory, QuickMediaRole>> = {
  servicios: "business",
  restaurantes: "business",
  "autos-dealer": "vehicle",
  "bienes-negocio": "property",
};

export function requiredSubjectRoleForCategory(category: string): QuickMediaRole | null {
  return isQuickBusinessMediaCategory(category) ? REQUIRED_SUBJECT_ROLE_BY_CATEGORY[category] : null;
}

/** The minimal shape this validator needs. Compatible with QuickBusinessMediaItem. */
export type SemanticMediaItem = {
  role?: string | null;
  /** Declared MIME type, when known. Used to reject video at the contract layer. */
  mime?: string | null;
};

export type QuickMediaIssueCode =
  | "too_few_subject_images"
  | "too_many_images"
  | "video_not_allowed"
  | "missing_subject_role"
  | "role_declaration_required"
  | "invalid_role";

export type QuickMediaIssue = { code: QuickMediaIssueCode; messageEs: string; messageEn: string };

export type QuickMediaSemanticLimits = {
  /** Minimum images in the family's SUBJECT role. Identity assets never count toward this. */
  minSubjectImages: number;
  /** Maximum countable images (identity assets and video excluded). `null` = the family's own cap applies. */
  maxImages: number | null;
  /** Quick Business allows no video in any family. */
  videoAllowed: boolean;
  requiredSubjectRole: QuickMediaRole;
  /** Whether an unroled item in this family's gallery may be attributed the subject role. */
  subjectAttribution: "declared" | "structural";
};

/** The Quick INTAKE contract: one to three photos, no video. */
export const QUICK_BUSINESS_SEMANTIC_LIMITS = { minSubjectImages: 1, maxImages: 3, videoAllowed: false } as const;

/**
 * The PUBLISH-SEAM contract.
 *
 * The subject-role requirement is the security claim and is identical everywhere. The COUNT CAP is
 * deliberately NOT the Quick 1–3 cap here: Servicios and Restaurantes publish routes are shared
 * with those categories' full applications, whose truthful gallery caps are 24, and the Autos /
 * Bienes canonical lanes are uncapped. Imposing Quick's cap on a shared publish route would be a
 * false requirement. Each family's own cap keeps being enforced by its own existing validator
 * (`validateProposedFinalMediaSet`), which this guard sits beside rather than replaces.
 */
export const QUICK_BUSINESS_PUBLISH_MAX_IMAGES: Readonly<Record<QuickBusinessMediaCategory, number | null>> = {
  servicios: null,
  restaurantes: null,
  "autos-dealer": null,
  "bienes-negocio": null,
};

/** Limits for the Quick INTAKE (browser step + review). */
export function buildQuickMediaLimits(category: string): QuickMediaSemanticLimits | null {
  if (!isQuickBusinessMediaCategory(category)) return null;
  return {
    ...QUICK_BUSINESS_SEMANTIC_LIMITS,
    requiredSubjectRole: REQUIRED_SUBJECT_ROLE_BY_CATEGORY[category],
    subjectAttribution: SUBJECT_ATTRIBUTION[category],
  };
}

/** Limits for a SERVER publish seam. Same subject rule, each family's own count truth. */
export function buildQuickPublishMediaLimits(category: string): QuickMediaSemanticLimits | null {
  if (!isQuickBusinessMediaCategory(category)) return null;
  return {
    minSubjectImages: 1,
    maxImages: QUICK_BUSINESS_PUBLISH_MAX_IMAGES[category],
    videoAllowed: false,
    requiredSubjectRole: REQUIRED_SUBJECT_ROLE_BY_CATEGORY[category],
    subjectAttribution: SUBJECT_ATTRIBUTION[category],
  };
}

function isVideoMime(mime: string | null | undefined): boolean {
  return typeof mime === "string" && mime.trim().toLowerCase().startsWith("video/");
}

function hasDeclaredRole(item: SemanticMediaItem): boolean {
  return item.role != null && String(item.role).trim() !== "";
}

/**
 * Resolve an item's effective role.
 *
 * THERE IS NO IMPLICIT UPGRADE. A missing role is `"unspecified"` and can never satisfy a
 * subject minimum. When the family's gallery is structurally single-purpose (see
 * `SUBJECT_ATTRIBUTION`), the caller passes `subjectAttribution: "structural"` and this function
 * ATTRIBUTES the subject role — an explicit, per-family decision, never a silent default. An item
 * declaring an UNKNOWN role is `"invalid"` rather than a silent subject, so a typo can never
 * quietly satisfy the requirement.
 */
export function effectiveRole(
  item: SemanticMediaItem,
  requiredSubjectRole: QuickMediaRole,
  subjectAttribution: "declared" | "structural" = "declared",
): ResolvedMediaRole {
  if (!hasDeclaredRole(item)) {
    return subjectAttribution === "structural" ? requiredSubjectRole : "unspecified";
  }
  const raw = String(item.role).trim();
  if (!isQuickMediaRole(raw)) return "invalid";
  return raw;
}

function subjectWords(role: QuickMediaRole): { es: string; en: string } {
  if (role === "vehicle") return { es: "del vehículo", en: "of the vehicle" };
  if (role === "property") return { es: "de la propiedad", en: "of the property" };
  return { es: "de tu negocio", en: "of your business" };
}

/**
 * Validate a Quick Business media set against its family's semantic contract.
 * Returns [] when valid. Every branch is reachable from the behavioral tests.
 */
export function validateQuickBusinessMediaSemantics(
  items: readonly SemanticMediaItem[],
  limits: QuickMediaSemanticLimits,
): QuickMediaIssue[] {
  const issues: QuickMediaIssue[] = [];
  const words = subjectWords(limits.requiredSubjectRole);

  if (!limits.videoAllowed && items.some((i) => isVideoMime(i.mime))) {
    issues.push({
      code: "video_not_allowed",
      messageEs: "El video no está incluido en este paquete. Sube solo fotos.",
      messageEn: "Video is not included in this package. Upload photos only.",
    });
  }

  const roles = items.map((i) => effectiveRole(i, limits.requiredSubjectRole, limits.subjectAttribution));

  if (roles.includes("invalid")) {
    issues.push({
      code: "invalid_role",
      messageEs: "Una de las fotos tiene un tipo no reconocido. Vuelve a marcar qué muestra cada foto.",
      messageEn: "One of the photos has an unrecognized type. Re-select what each photo shows.",
    });
  }

  // Identity assets (logo, headshot) are excluded from BOTH the count and the subject minimum.
  const countableImages = items.filter((item, idx) => {
    const r = roles[idx];
    return r !== "invalid" && !isVideoMime(item.mime) && !IDENTITY_ROLES.includes(r as QuickMediaRole);
  });

  const subjectImages = items.filter(
    (item, idx) => roles[idx] === limits.requiredSubjectRole && !isVideoMime(item.mime),
  );

  if (subjectImages.length < limits.minSubjectImages) {
    // A submission that carried images but declared NO role at all in a `declared`-attribution
    // family is a CORRECTABLE draft, not a rejected one: it predates roles, or a client dropped
    // them. It gets its own code and a message that says exactly what to do, so an existing valid
    // draft fails safely instead of being silently misclassified as a vehicle/property photo.
    const unroled = items.filter((item, idx) => roles[idx] === "unspecified" && !isVideoMime(item.mime));
    const everythingIsUnroled = items.length > 0 && unroled.length === items.length;

    if (everythingIsUnroled && limits.subjectAttribution === "declared") {
      issues.push({
        code: "role_declaration_required",
        messageEs: `Marca cuál de tus fotos es la foto real ${words.es}. Vuelve al paso de fotos y elige qué muestra cada una; un logotipo o una foto de perfil no cuenta.`,
        messageEn: `Tell us which of your photos is the real photo ${words.en}. Go back to the photo step and mark what each one shows; a logo or profile photo does not count.`,
      });
    } else {
      issues.push({
        code: items.length > 0 ? "missing_subject_role" : "too_few_subject_images",
        messageEs: `Se necesita al menos una foto real ${words.es}. Un logotipo o una foto de perfil no cuenta.`,
        messageEn: `At least one real photo ${words.en} is required. A logo or profile photo does not count.`,
      });
    }
  }

  if (limits.maxImages != null && countableImages.length > limits.maxImages) {
    issues.push({
      code: "too_many_images",
      messageEs: `Máximo ${limits.maxImages} fotos en esta categoría.`,
      messageEn: `Maximum ${limits.maxImages} photos in this category.`,
    });
  }

  return issues;
}

/**
 * Pull the media set out of a category listing payload, whichever of the canonical field names
 * that family happens to use. Returns [] when the payload carries no media at all — which the
 * validator then reports as `too_few_subject_images`, giving the server a real zero-image refusal
 * where previously there was none.
 *
 * A bare string entry (a URL or data URL with no metadata) yields an item with NO declared role.
 * Whether that can satisfy the subject requirement is decided by the family's
 * `subjectAttribution`, never by this extractor.
 *
 * IDENTITY FIELDS ARE NOT READ. `logoUrl`, `profilePhotoUrl` and friends live outside every field
 * name below by construction, so a logo can never enter the gallery set through this door.
 */
const GALLERY_FIELDS = ["mediaImages", "media", "images", "galleryImages", "fotosDataUrls", "photos"] as const;

export function extractSemanticMediaItems(payload: unknown): SemanticMediaItem[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  for (const field of GALLERY_FIELDS) {
    const candidate = p[field];
    if (!Array.isArray(candidate) || candidate.length === 0) continue;
    return candidate.map((entry): SemanticMediaItem => {
      if (typeof entry === "string") return { role: null, mime: null };
      const o = (entry ?? {}) as Record<string, unknown>;
      const mime =
        typeof o.mime === "string" ? o.mime : typeof o.contentType === "string" ? o.contentType : null;
      return { role: typeof o.role === "string" ? o.role : null, mime };
    });
  }
  return [];
}

/** Convenience wrapper: validate by category key with the INTAKE limits. */
export function validateQuickBusinessMediaForCategory(
  category: string,
  items: readonly SemanticMediaItem[],
): QuickMediaIssue[] | null {
  const limits = buildQuickMediaLimits(category);
  if (!limits) return null;
  return validateQuickBusinessMediaSemantics(items, limits);
}

export type QuickMediaEnforcementResult =
  | { ok: true; category: QuickBusinessMediaCategory }
  | { ok: false; category: QuickBusinessMediaCategory; issues: QuickMediaIssue[]; body: QuickMediaRefusalBody; status: 422 };

export type QuickMediaRefusalBody = {
  ok: false;
  error: "media_contract_violation";
  issues: QuickMediaIssueCode[];
  message: string;
  messageEs: string;
};

/**
 * THE CANONICAL SERVER ENTRY POINT.
 *
 * Every server seam that can turn a Quick Business submission into a listing calls exactly this
 * function — the four customer self-service publish paths and the two staff-assisted publish
 * routes. It takes the raw request payload so no caller has to re-implement extraction, and it
 * returns the exact 422 body every seam answers with, so the refusal shape cannot drift between
 * paths.
 *
 * `items` may be supplied directly when a caller already holds the media set in a shape the
 * generic extractor cannot see (for example a set assembled from several fields).
 */
export function enforceQuickBusinessPublishMedia(input: {
  category: string;
  payload?: unknown;
  items?: readonly SemanticMediaItem[];
}): QuickMediaEnforcementResult | null {
  if (!isQuickBusinessMediaCategory(input.category)) return null;
  const limits = buildQuickPublishMediaLimits(input.category)!;
  const items = input.items ?? extractSemanticMediaItems(input.payload);
  const issues = validateQuickBusinessMediaSemantics(items, limits);
  if (!issues.length) return { ok: true, category: input.category };
  return {
    ok: false,
    category: input.category,
    issues,
    status: 422,
    body: {
      ok: false,
      error: "media_contract_violation",
      issues: issues.map((i) => i.code),
      message: issues[0]!.messageEn,
      messageEs: issues[0]!.messageEs,
    },
  };
}

/**
 * Intake-side validation for Quick Business, returning localized strings so it can stand in for
 * the Quick Classifieds `validateQuickMedia` at the Quick Business intake.
 *
 * WHY A SEPARATE FUNCTION: `QuickClassifiedMediaContract` declares `videoOptional: true` as a
 * LITERAL, because every Quick Classifieds lane allows optional video. Quick Business allows
 * none. Quick Business therefore carries its own contract type and its own validator rather than
 * misreporting `videoOptional: true` to reuse the Classifieds one.
 *
 * It is strictly stronger than the function it replaces at that call site: same count bounds, plus
 * video refusal, plus the semantic subject rule — so the browser cannot walk a customer into a
 * submission the server will refuse. The browser is NOT the boundary; the server runs the same
 * contract again on the payload it actually receives.
 */
export function validateQuickBusinessIntakeMedia(
  media: readonly SemanticMediaItem[],
  contract: { minImages: number; maxImages: number | null; videoOptional: boolean },
  lang: "es" | "en",
  category?: string,
): string[] {
  const issues: string[] = [];
  const en = lang === "en";

  if (!contract.videoOptional && media.some((m) => isVideoMime(m.mime))) {
    issues.push(en ? "Video is not included in this package. Upload photos only." : "El video no está incluido en este paquete. Sube solo fotos.");
  }

  // Identity assets never satisfy the photo minimum, so a logo-only upload still reads as empty.
  const countable = media.filter((m) => !isVideoMime(m.mime) && !isIdentityRole(m.role));

  if (countable.length < contract.minImages) {
    issues.push(en ? "Add at least one photo to continue." : "Sube al menos una foto para continuar.");
  }
  if (contract.maxImages != null && countable.length > contract.maxImages) {
    issues.push(
      en ? `Maximum ${contract.maxImages} photos in this category.` : `Máximo ${contract.maxImages} fotos en esta categoría.`,
    );
  }

  // The semantic rule, run in the browser too, so the customer is corrected at the photo step
  // instead of at the publish seam. The server repeats it — this is UX, not the boundary.
  const limits = category ? buildQuickMediaLimits(category) : null;
  if (limits) {
    for (const issue of validateQuickBusinessMediaSemantics(media, limits)) {
      if (issue.code === "too_few_subject_images" || issue.code === "too_many_images" || issue.code === "video_not_allowed") continue;
      issues.push(en ? issue.messageEn : issue.messageEs);
    }
  }
  return issues;
}
