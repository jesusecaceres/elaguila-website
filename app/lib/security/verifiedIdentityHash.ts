/**
 * Package C Build 2 (C4) — server-generated keyed-hash identities for anti-repeat enforcement.
 *
 * The verified-intro-15% discount's anti-repeat uniqueness indexes must never be built on raw
 * normalized email/phone (owner-mandated correction). This module derives a deterministic,
 * keyed HMAC-SHA256 identity from a server-proven verified value (never a client-submitted raw
 * value). The key (`LEONIX_IDENTITY_HASH_KEY`) is never logged or exposed — only its presence is
 * checked. Absence fails closed: the entire verified-15 feature (both email and phone paths) is
 * unavailable without it, since anti-repeat enforcement structurally depends on this hash.
 */

import "server-only";
import { createHmac } from "node:crypto";

function getIdentityHashKey(): string | null {
  const key = process.env.LEONIX_IDENTITY_HASH_KEY?.trim();
  return key ? key : null;
}

export function isIdentityHashConfigured(): boolean {
  return getIdentityHashKey() != null;
}

/**
 * Deterministic keyed hash of a server-verified identity value (confirmed email or E.164 phone).
 * Normalizes (trim + lowercase) before hashing so case/whitespace variants collide correctly.
 * Returns null (fail closed) when `LEONIX_IDENTITY_HASH_KEY` is not configured.
 */
export function hashVerifiedIdentity(rawValue: string): string | null {
  const key = getIdentityHashKey();
  if (!key) return null;
  const normalized = String(rawValue ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return createHmac("sha256", key).update(normalized, "utf8").digest("hex");
}

/** Masked display value for admin/audit surfaces — never the hash, never the full raw value. */
export function maskVerifiedEmail(rawEmail: string): string {
  const value = String(rawEmail ?? "").trim();
  const at = value.indexOf("@");
  if (at <= 0) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, local.length - 1))}@${domain}`;
}

/** Masked display value for admin/audit surfaces — keeps only the last 4 digits visible. */
export function maskVerifiedPhone(rawPhoneE164: string): string {
  const digits = String(rawPhoneE164 ?? "").trim();
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  return `${digits.slice(0, digits.length - 4).replace(/\d/g, "*")}${last4}`;
}
