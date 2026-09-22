/**
 * LEONIX QUICK — PURE crypto for the expiring, read-only PROSPECT PREVIEW link.
 *
 * WHAT THIS IS FOR
 * ----------------
 * A staff member prepares a Quick ad for a prospect before any payment exists, and needs to show
 * it to them — in person or over WhatsApp — without publishing it and without handing the prospect
 * any staff permission. That link is this token.
 *
 * WHAT IT DELIBERATELY IS NOT
 * ---------------------------
 * It carries NO authority: not staff authority, not owner authority, not payment or entitlement
 * authority, and no mutation capability of any kind. It names one listing in one category and says
 * "you may LOOK at this until this timestamp". Every consumer must treat it as exactly that — the
 * preview route reads a row and renders safe public fields; nothing else may accept this token.
 *
 * WHY IT LIVES HERE, NEXT TO ITS SIBLING
 * --------------------------------------
 * `assistedPublishingToken.ts` is `server-only`-free for one reason: a security claim that is only
 * asserted in prose is not a security property. Its forgery, tampering, truncation and expiry
 * behaviour is proven by a test that actually attacks the real code. This module follows that
 * pattern exactly — same HMAC-SHA256 construction, same constant-time comparison, same fail-closed
 * posture, same injectable clock and injected secret — so the same class of attack can be run
 * against it rather than described.
 *
 * FAIL CLOSED, WITH NO DEVELOPMENT FALLBACK.
 *
 * A missing secret returns null on BOTH sign and verify. There is deliberately no "if we're not in
 * production, skip the signature" branch: that is the single most common way a preview link
 * becomes a public one, and a link that works without a secret is a link anyone can mint.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 72 hours, and not a minute more — the sales cycle this exists for is "show the prospect today,
 * follow up tomorrow". A link that outlives the conversation is a link nobody remembers sharing.
 */
export const PROSPECT_PREVIEW_MAX_AGE_SEC = 72 * 60 * 60;

/** The eight staff-gateway families a prospect preview token may name. */
export const PROSPECT_PREVIEW_CATEGORIES = [
  "rentas",
  "empleos",
  "autos-privado",
  "servicios",
  "restaurantes",
  "comida-local",
  "autos",
  "bienes-raices",
] as const;

export type ProspectPreviewCategory = (typeof PROSPECT_PREVIEW_CATEGORIES)[number];

export function isProspectPreviewCategory(value: unknown): value is ProspectPreviewCategory {
  return typeof value === "string" && (PROSPECT_PREVIEW_CATEGORIES as readonly string[]).includes(value);
}

/** The listing tables an assisted Quick draft can live in. Mirrors `AssistedListingSource`. */
export const PROSPECT_PREVIEW_SOURCES = [
  "servicios_public_listings",
  "restaurantes_public_listings",
  "autos_classifieds_listings",
  "listings",
  "empleos_public_listings",
  "comida_local_public_listings",
] as const;

export type ProspectPreviewSource = (typeof PROSPECT_PREVIEW_SOURCES)[number];

export function isProspectPreviewSource(value: unknown): value is ProspectPreviewSource {
  return typeof value === "string" && (PROSPECT_PREVIEW_SOURCES as readonly string[]).includes(value);
}

export type ProspectPreviewContext = {
  /** The category this token was minted for. A token for one category can never open another. */
  category: ProspectPreviewCategory;
  /** Which table the row lives in — so the reader cannot be pointed at a different one. */
  listingSource: ProspectPreviewSource;
  /** The canonical listing / draft row this token may display, and only this one. */
  listingId: string;
  /**
   * The business the draft was prepared for.
   *
   * Carried so the reader can re-verify CUSTODY at redemption — that this business still holds
   * this listing — rather than trusting a signature minted at some earlier moment. A signature
   * proves the token was issued by us; it cannot prove the relationship it describes still holds.
   */
  businessId: string;
  /** Attribution only — which staff roster member issued it. Never authority. */
  issuedByRosterId: string;
  issuedAtMs: number;
  expiresAtMs: number;
};

export function signProspectPreviewPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Constant-time compare — never a plain `===` on attacker-controlled input. */
export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Mint a signed, expiring preview token.
 *
 * `ttlSec` may only ever SHORTEN the lifetime: a caller asking for longer than the 72-hour maximum
 * gets 72 hours, because the ceiling is a property of the token and not of whoever is asking.
 */
export function createProspectPreviewTokenWithSecret(
  input: {
    category: ProspectPreviewCategory;
    listingSource: ProspectPreviewSource;
    listingId: string;
    businessId: string;
    issuedByRosterId: string;
    ttlSec?: number;
  },
  secret: string,
  nowMs: number = Date.now(),
): string | null {
  if (!secret) return null;
  if (!isProspectPreviewCategory(input.category)) return null;
  if (!isProspectPreviewSource(input.listingSource)) return null;
  if (!input.listingId.trim()) return null;
  if (!input.businessId.trim()) return null;

  const requested = Number.isFinite(input.ttlSec) ? Math.floor(input.ttlSec as number) : PROSPECT_PREVIEW_MAX_AGE_SEC;
  const ttlSec = Math.max(60, Math.min(PROSPECT_PREVIEW_MAX_AGE_SEC, requested));

  const issuedAtMs = nowMs;
  const payloadObj: ProspectPreviewContext = {
    category: input.category,
    listingSource: input.listingSource,
    listingId: input.listingId.trim(),
    businessId: input.businessId.trim(),
    issuedByRosterId: input.issuedByRosterId,
    issuedAtMs,
    expiresAtMs: issuedAtMs + ttlSec * 1000,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  return `${payload}.${signProspectPreviewPayload(payload, secret)}`;
}

/**
 * Verify signature AND expiry AND the category the caller is asking about.
 *
 * `expectedCategory` is required rather than optional on purpose. A token is scoped to one
 * category, and the only way that scope means anything is if the reader states which category it
 * is serving and the token is checked against it — otherwise a Servicios token opens the
 * Restaurantes renderer and the scope is decoration.
 *
 * Fails closed on: a missing secret, a malformed token, a bad signature, a tampered payload (the
 * signature covers the exact base64url bytes), an unknown category, a category mismatch, a
 * not-yet-valid timestamp, and an expired one.
 */
export function verifyProspectPreviewTokenWithSecret(
  raw: string | null | undefined,
  expectedCategory: string,
  secret: string,
  nowMs: number = Date.now(),
): ProspectPreviewContext | null {
  if (!secret) return null;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!safeEqualHex(signature, signProspectPreviewPayload(payload, secret))) return null;

  let parsed: Partial<ProspectPreviewContext>;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !isProspectPreviewCategory(parsed.category) ||
    !isProspectPreviewSource(parsed.listingSource) ||
    typeof parsed.listingId !== "string" ||
    !parsed.listingId ||
    typeof parsed.businessId !== "string" ||
    !parsed.businessId ||
    typeof parsed.issuedByRosterId !== "string" ||
    typeof parsed.issuedAtMs !== "number" ||
    typeof parsed.expiresAtMs !== "number"
  ) {
    return null;
  }
  if (parsed.category !== expectedCategory) return null;
  if (parsed.issuedAtMs > nowMs) return null;
  if (parsed.expiresAtMs <= nowMs) return null;
  // The ceiling is re-checked on READ, not only on mint: a token whose payload claims a longer
  // life than the maximum was not minted by this code, and a signature that somehow validated it
  // must still not buy more than 72 hours.
  if (parsed.expiresAtMs - parsed.issuedAtMs > PROSPECT_PREVIEW_MAX_AGE_SEC * 1000) return null;

  return {
    category: parsed.category,
    listingSource: parsed.listingSource,
    listingId: parsed.listingId,
    businessId: parsed.businessId,
    issuedByRosterId: parsed.issuedByRosterId,
    issuedAtMs: parsed.issuedAtMs,
    expiresAtMs: parsed.expiresAtMs,
  };
}
