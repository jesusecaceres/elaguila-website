import type { ResourceRecord, VerificationStatus } from "./types";

/**
 * Verification OS — deterministic freshness truth (Build 02, Gate 5).
 *
 * Pure functions only. No dates are invented: a record with no `lastVerifiedAt` can never be
 * reported as `verified` regardless of what an admin typed into `verificationStatus`, and a
 * record whose `nextVerificationAt` has passed is truthfully `stale` even if nobody has touched
 * it in the admin UI yet.
 */

/** Default review cadence when an admin does not set an explicit `nextVerificationAt`. */
export const DEFAULT_VERIFICATION_REVIEW_DAYS = 90;

export function addDaysIso(fromIso: string, days: number): string {
  const d = new Date(fromIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/**
 * Recomputes the truthful verification status from raw facts, overriding whatever an admin may
 * have stored if it no longer holds up. This is what admin list/detail views should display —
 * `verification.verificationStatus` as typed by an admin is a claim, this function is the fact.
 */
export function resolveEffectiveVerificationStatus(
  verification: ResourceRecord["verification"],
  now: Date = new Date(),
): VerificationStatus {
  if (!verification.active) return "inactive";
  if (verification.verificationStatus === "inactive") return "inactive";

  // No verification date on file → can never truthfully be "verified".
  if (!verification.lastVerifiedAt) {
    return verification.verificationStatus === "verified" ? "needs_review" : verification.verificationStatus;
  }

  if (verification.nextVerificationAt) {
    const dueDate = new Date(verification.nextVerificationAt);
    if (!Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now.getTime()) {
      return "stale";
    }
  }

  return verification.verificationStatus === "needs_review" ? "needs_review" : "verified";
}

export function isEffectivelyVerified(verification: ResourceRecord["verification"], now: Date = new Date()): boolean {
  return resolveEffectiveVerificationStatus(verification, now) === "verified";
}

/** True when a `help-now` resource has aged past its review window without being re-checked. */
export function isUrgentResourceOverdue(record: Pick<ResourceRecord, "urgencyLevel" | "verification">, now: Date = new Date()): boolean {
  if (record.urgencyLevel !== "help-now") return false;
  const status = resolveEffectiveVerificationStatus(record.verification, now);
  return status === "stale" || status === "needs_review";
}

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, { es: string; en: string }> = {
  verified: { es: "Verificado", en: "Verified" },
  needs_review: { es: "Necesita revisión", en: "Needs review" },
  stale: { es: "Desactualizado", en: "Stale" },
  inactive: { es: "Inactivo", en: "Inactive" },
};

export function verificationStatusLabel(status: VerificationStatus, lang: "es" | "en" = "es"): string {
  return VERIFICATION_STATUS_LABEL[status][lang];
}
