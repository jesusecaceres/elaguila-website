import type { ResourceRecord } from "./types";

/**
 * High-risk / urgent resource safety gate (Build 02, Gate 8).
 *
 * `help-now` resources must clear a stricter bar before an admin can mark them `verified`.
 * This never invents data (no fabricated "24/7", no assumed emergency messaging) — it only
 * checks that truthful, actionable fields are present.
 */

export type UrgentResourceValidationResult = {
  ok: boolean;
  errors: string[];
};

function trim(v: string | null | undefined): string {
  return String(v ?? "").trim();
}

function hasActionableContact(contact: ResourceRecord["contact"]): boolean {
  return Boolean(
    trim(contact.phone) ||
      trim(contact.crisisPhone) ||
      trim(contact.sms) ||
      trim(contact.whatsapp) ||
      trim(contact.email) ||
      trim(contact.websiteUrl) ||
      trim(contact.applicationUrl),
  );
}

/**
 * Validates whether a resource is safe to mark `verified`. Applies to every record, but is
 * strictest for `urgencyLevel: "help-now"` — those additionally require an official source URL.
 */
export function validateResourceForVerification(record: ResourceRecord): UrgentResourceValidationResult {
  const errors: string[] = [];

  if (!record.verification.active) {
    errors.push("Resource must be active to be marked verified.");
  }

  if (!hasActionableContact(record.contact)) {
    errors.push("At least one actionable contact method (phone, SMS, WhatsApp, email, website, or application URL) is required.");
  }

  if (record.urgencyLevel === "help-now") {
    if (!trim(record.verification.officialSourceUrl)) {
      errors.push("Help-now resources require an official source URL before they can be marked verified.");
    }
    if (!trim(record.contact.phone) && !trim(record.contact.crisisPhone) && !trim(record.contact.sms)) {
      errors.push("Help-now resources require a direct phone, crisis phone, or SMS contact method.");
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * True when a record's urgency/category pairing is at least plausible. This is a soft sanity
 * check only — it never auto-reclassifies a record, and it never treats "offers mental-health
 * services" as automatically emergency (per the locked doctrine: no invented emergency status).
 */
export function urgencyCategoryLooksInconsistent(record: Pick<ResourceRecord, "urgencyLevel" | "primaryCategory">): boolean {
  if (record.urgencyLevel !== "help-now") return false;
  const plausibleHelpNowCategories: ResourceRecord["primaryCategory"][] = [
    "urgent-safety",
    "mental-health-recovery",
    "health-clinics",
    "housing-rent",
    "community-support",
  ];
  return !plausibleHelpNowCategories.includes(record.primaryCategory);
}
