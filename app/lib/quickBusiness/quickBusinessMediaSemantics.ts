/**
 * Gate QB-MEDIA-02 — semantic media contract for Quick Business, enforceable on the SERVER.
 *
 * THE PROBLEM THIS SOLVES: the Quick copy has always *said* "a real photo of the vehicle you are
 * listing (not of the business)" and "a real photo of the property (not of your office)", but
 * nothing enforced it. `QuickMediaItem` and `MediaImageEntry` carry no semantic role at all, so a
 * dealer could satisfy the photo requirement with a dealership logo and an agent could satisfy it
 * with a headshot. Copy is not a contract.
 *
 * HOW IT IS ENFORCED WITHOUT IMAGE RECOGNITION: by requiring an explicit ROLE on each uploaded
 * image and demanding at least one image in the family's SUBJECT role. No external
 * image-recognition dependency is added — the customer declares what each photo is, and the
 * server refuses a submission whose declared roles cannot satisfy the listing.
 *
 * This mirrors a distinction the codebase already makes structurally: `ProposedFinalMediaSet`
 * keeps `logoUrl` separate from `images` and documents that a logo is "never counted in images",
 * and `LANE_MEDIA_REGISTRY.logoSupported` already treats logos as identity fields rather than
 * gallery items. This module makes that doctrine checkable per image.
 *
 * Pure and IO-free: the server routes and `scripts/verify-quick-media-semantics-01.ts` share it.
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

export function isQuickMediaRole(value: unknown): value is QuickMediaRole {
  return typeof value === "string" && (QUICK_MEDIA_ROLES as readonly string[]).includes(value);
}

/** The subject role each Quick Business family requires at least one of. */
export const REQUIRED_SUBJECT_ROLE_BY_CATEGORY: Readonly<Record<string, QuickMediaRole>> = {
  servicios: "business",
  restaurantes: "business",
  "autos-dealer": "vehicle",
  "bienes-negocio": "property",
};

export function requiredSubjectRoleForCategory(category: string): QuickMediaRole | null {
  return REQUIRED_SUBJECT_ROLE_BY_CATEGORY[category] ?? null;
}

/** The minimal shape this validator needs. Compatible with QuickMediaItem plus an optional role. */
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
  | "invalid_role";

export type QuickMediaIssue = { code: QuickMediaIssueCode; messageEs: string; messageEn: string };

export type QuickMediaSemanticLimits = {
  /** Minimum images in the family's SUBJECT role. Identity assets never count toward this. */
  minSubjectImages: number;
  /** Maximum total images, identity assets excluded. */
  maxImages: number;
  /** Quick Business allows no video in any family. */
  videoAllowed: boolean;
  requiredSubjectRole: QuickMediaRole;
};

export const QUICK_BUSINESS_SEMANTIC_LIMITS = { minSubjectImages: 1, maxImages: 3, videoAllowed: false } as const;

export function buildQuickMediaLimits(category: string): QuickMediaSemanticLimits | null {
  const requiredSubjectRole = requiredSubjectRoleForCategory(category);
  if (!requiredSubjectRole) return null;
  return { ...QUICK_BUSINESS_SEMANTIC_LIMITS, requiredSubjectRole };
}

function isVideoMime(mime: string | null | undefined): boolean {
  return typeof mime === "string" && mime.trim().toLowerCase().startsWith("video/");
}

/**
 * Resolve an item's effective role.
 *
 * BACKWARD COMPATIBILITY: an item with NO declared role is treated as the family's subject role.
 * Media stored before roles existed therefore remains valid and readable — the contract only
 * tightens for submissions that declare roles, and the Quick intake always declares them. An item
 * that declares an UNKNOWN role is an error rather than a silent subject, so a typo can never
 * quietly satisfy the requirement.
 */
export function effectiveRole(
  item: SemanticMediaItem,
  requiredSubjectRole: QuickMediaRole,
): QuickMediaRole | "invalid" {
  const raw = item.role;
  if (raw == null || String(raw).trim() === "") return requiredSubjectRole;
  if (!isQuickMediaRole(raw)) return "invalid";
  return raw;
}

/**
 * Validate a Quick Business media set against its family's semantic contract.
 * Returns [] when valid. Every branch is reachable from the negative tests.
 */
export function validateQuickBusinessMediaSemantics(
  items: readonly SemanticMediaItem[],
  limits: QuickMediaSemanticLimits,
): QuickMediaIssue[] {
  const issues: QuickMediaIssue[] = [];

  if (!limits.videoAllowed && items.some((i) => isVideoMime(i.mime))) {
    issues.push({
      code: "video_not_allowed",
      messageEs: "El video no está incluido en este paquete. Sube solo fotos.",
      messageEn: "Video is not included in this package. Upload photos only.",
    });
  }

  const roles = items.map((i) => effectiveRole(i, limits.requiredSubjectRole));

  if (roles.includes("invalid")) {
    issues.push({
      code: "invalid_role",
      messageEs: "Una de las fotos tiene un tipo no reconocido.",
      messageEn: "One of the photos has an unrecognized type.",
    });
  }

  // Identity assets (logo, headshot) are excluded from BOTH the count and the subject minimum.
  const countableImages = items.filter((item, idx) => {
    const r = roles[idx];
    return r !== "invalid" && !isVideoMime(item.mime) && !IDENTITY_ROLES.includes(r as QuickMediaRole);
  });

  const subjectImages = items.filter((item, idx) => roles[idx] === limits.requiredSubjectRole && !isVideoMime(item.mime));

  if (subjectImages.length < limits.minSubjectImages) {
    // This is the branch that rejects a logo-only or headshot-only submission.
    const subjectWordEs =
      limits.requiredSubjectRole === "vehicle" ? "del vehículo" : limits.requiredSubjectRole === "property" ? "de la propiedad" : "de tu negocio";
    const subjectWordEn =
      limits.requiredSubjectRole === "vehicle" ? "of the vehicle" : limits.requiredSubjectRole === "property" ? "of the property" : "of your business";
    issues.push({
      code: items.length > 0 ? "missing_subject_role" : "too_few_subject_images",
      messageEs: `Se necesita al menos una foto real ${subjectWordEs}. Un logotipo o una foto de perfil no cuenta.`,
      messageEn: `At least one real photo ${subjectWordEn} is required. A logo or profile photo does not count.`,
    });
  }

  if (countableImages.length > limits.maxImages) {
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
 * A bare string entry (a URL or data URL with no metadata) yields an item with no declared role,
 * which `effectiveRole` treats as the family's subject role for backward compatibility.
 */
export function extractSemanticMediaItems(payload: unknown): SemanticMediaItem[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  const candidateFields = [p.mediaImages, p.media, p.images, p.galleryImages, p.fotosDataUrls, p.photos];
  for (const candidate of candidateFields) {
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

/** Convenience wrapper: validate by category key. Returns null for a non-Quick-Business category. */
export function validateQuickBusinessMediaForCategory(
  category: string,
  items: readonly SemanticMediaItem[],
): QuickMediaIssue[] | null {
  const limits = buildQuickMediaLimits(category);
  if (!limits) return null;
  return validateQuickBusinessMediaSemantics(items, limits);
}

/**
 * Intake-side validation for Quick Business, returning localized strings so it can stand in for
 * the Quick Classifieds `validateQuickMedia` at the Quick Business intake.
 *
 * WHY A SEPARATE FUNCTION: `QuickClassifiedMediaContract` declares `videoOptional: true` as a
 * LITERAL, because every Quick Classifieds lane allows optional video. Quick Business allows
 * none. Quick Business therefore carries its own contract type and its own validator rather than
 * misreporting `videoOptional: true` to reuse the Classifieds one — which is also what removes a
 * long-standing type error where the registry returned `false` for a field typed `true`.
 *
 * This is strictly stronger than the function it replaces at this call site: it enforces the same
 * count bounds AND rejects video, and identity assets (logo/headshot) do not count toward the
 * minimum.
 */
export function validateQuickBusinessIntakeMedia(
  media: readonly SemanticMediaItem[],
  contract: { minImages: number; maxImages: number | null; videoOptional: boolean },
  lang: "es" | "en",
): string[] {
  const issues: string[] = [];
  const en = lang === "en";

  if (!contract.videoOptional && media.some((m) => isVideoMime(m.mime))) {
    issues.push(en ? "Video is not included in this package. Upload photos only." : "El video no está incluido en este paquete. Sube solo fotos.");
  }

  // Identity assets never satisfy the photo minimum, so a logo-only upload still reads as empty.
  const countable = media.filter(
    (m) => !isVideoMime(m.mime) && !(isQuickMediaRole(m.role) && IDENTITY_ROLES.includes(m.role)),
  );

  if (countable.length < contract.minImages) {
    issues.push(en ? "Add at least one photo to continue." : "Sube al menos una foto para continuar.");
  }
  if (contract.maxImages != null && countable.length > contract.maxImages) {
    issues.push(
      en ? `Maximum ${contract.maxImages} photos in this category.` : `Máximo ${contract.maxImages} fotos en esta categoría.`,
    );
  }
  return issues;
}
