import type { ChurchRow } from "./types";

/** Public discovery eligibility. Verified and Prayer Network are not part of this gate. */
export function isPublicChurchEligible(row: Pick<ChurchRow, "approval_status" | "is_active" | "published_at">): boolean {
  return row.approval_status === "approved" && row.is_active === true && Boolean(row.published_at);
}

export const PUBLIC_CHURCH_COLUMNS =
  "id, slug, name, short_description, mission, church_type, denomination, approval_status, is_active, city, state, country, zip, address_line1, address_line2, public_location, latitude, longitude, languages, phone, email, website, whatsapp, livestream_url, socials, published_at, created_at, updated_at" as const;

/** Columns that must never be requested on public church reads. */
export const PRIVATE_CHURCH_COLUMN_DENYLIST = [
  "admin_notes",
  "reject_reason",
  "applicant_email",
  "applicant_phone",
  "applicant_name",
  "reviewed_by",
  "reviewed_at",
] as const;
