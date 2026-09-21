import "server-only";

import {
  PROSPECT_PREVIEW_MAX_AGE_SEC,
  type ProspectPreviewCategory,
  type ProspectPreviewContext,
  type ProspectPreviewSource,
  createProspectPreviewTokenWithSecret,
  verifyProspectPreviewTokenWithSecret,
} from "./prospectPreviewToken";

export type { ProspectPreviewContext, ProspectPreviewCategory, ProspectPreviewSource } from "./prospectPreviewToken";
export { PROSPECT_PREVIEW_MAX_AGE_SEC } from "./prospectPreviewToken";

/**
 * LEONIX QUICK — server-only wrapper for the prospect preview link.
 *
 * This module is the ONLY thing that knows where the preview signing secret comes from, exactly as
 * `assistedPublishingSession.ts` is the only thing that knows where the assisted-publishing secret
 * comes from. It follows that file's doctrine deliberately and to the letter:
 *
 *   - Its own dedicated secret (PROSPECT_PREVIEW_SESSION_SECRET), never shared with
 *     ASSISTED_PUBLISHING_SESSION_SECRET or ADMIN_PASSWORD, so a leak of one secret cannot mint
 *     the other kind of token. The two token types can never be cross-validated: different
 *     secrets, different payload shapes, different verifiers.
 *   - Fail closed with NO development fallback. A missing secret returns null on both mint and
 *     read. There is no environment in which an unsigned or unverified preview link is honoured.
 *
 * It is carried in the URL, not in a cookie, because the recipient is a PROSPECT on their own
 * phone — someone who has no session here and must never be given one. A URL-borne token is
 * exactly as much authority as "you may look at this until it expires", which is all this is.
 */

/** The query parameter the preview link carries. Deliberately distinct from every cookie name. */
export const PROSPECT_PREVIEW_TOKEN_PARAM = "pv";

function getProspectPreviewSecret(): string | null {
  const key = process.env.PROSPECT_PREVIEW_SESSION_SECRET?.trim();
  return key ? key : null;
}

/** True when this deployment is able to issue preview links at all. Used to refuse honestly. */
export function isProspectPreviewConfigured(): boolean {
  return !!getProspectPreviewSecret();
}

/**
 * Mint a preview token for one canonical draft. Returns null — never a usable fallback — when the
 * secret is absent or the binding is incomplete.
 */
export function createProspectPreviewToken(input: {
  category: ProspectPreviewCategory;
  listingSource: ProspectPreviewSource;
  listingId: string;
  businessId: string;
  issuedByRosterId: string;
  ttlSec?: number;
}): string | null {
  const secret = getProspectPreviewSecret();
  if (!secret) return null;
  return createProspectPreviewTokenWithSecret(input, secret);
}

/**
 * Verify a preview token for the category the reader is actually serving.
 *
 * `expectedCategory` is required, so a Servicios token can never open the Restaurantes renderer.
 * Signature, tampering, expiry and the 72-hour ceiling are all enforced by the pure module; this
 * wrapper adds only the secret.
 */
export function readProspectPreviewContext(
  rawToken: string | null | undefined,
  expectedCategory: string,
): ProspectPreviewContext | null {
  const secret = getProspectPreviewSecret();
  if (!secret) return null;
  return verifyProspectPreviewTokenWithSecret(rawToken, expectedCategory, secret);
}

/** Absolute link a staff member can copy and send. Relative when no site origin is configured. */
export function buildProspectPreviewPath(category: ProspectPreviewCategory, token: string): string {
  return `/vista-previa/${encodeURIComponent(category)}?${PROSPECT_PREVIEW_TOKEN_PARAM}=${encodeURIComponent(token)}`;
}

/** Seconds remaining before a context dies — shown to staff so they know what they are sending. */
export function prospectPreviewSecondsRemaining(ctx: ProspectPreviewContext, nowMs: number = Date.now()): number {
  return Math.max(0, Math.floor((ctx.expiresAtMs - nowMs) / 1000));
}

export const PROSPECT_PREVIEW_DEFAULT_TTL_SEC = PROSPECT_PREVIEW_MAX_AGE_SEC;
