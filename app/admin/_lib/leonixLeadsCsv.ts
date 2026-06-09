import "server-only";

import type { LeonixLeadRow, MediaKitLeadRow, NewsletterSubscriberRow } from "./leonixLeadsData";

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(",");
}

export function newsletterSubscribersToCsv(rows: NewsletterSubscriberRow[]): string {
  const header = csvRow([
    "id",
    "created_at",
    "updated_at",
    "consent_timestamp",
    "email",
    "name",
    "city",
    "zip_code",
    "preferred_language",
    "interests",
    "source",
    "lang",
    "status",
  ]);
  const body = rows.map((r) =>
    csvRow([
      r.id,
      r.created_at,
      r.updated_at,
      r.consent_timestamp,
      r.email,
      r.name,
      r.city,
      r.zip_code,
      r.preferred_language,
      r.interests,
      r.source,
      r.lang,
      r.status,
    ])
  );
  return [header, ...body].join("\r\n");
}

export function leonixLeadsToCsv(rows: LeonixLeadRow[]): string {
  const header = csvRow([
    "created_at",
    "status",
    "full_name",
    "email",
    "phone",
    "business_name",
    "inquiry_type",
    "preferred_contact_method",
    "city_area",
    "website_or_social",
    "business_category",
    "wants_launch_updates",
    "source_page",
    "source_cta",
    "message",
    "internal_notes",
    "lang",
    "consent_to_contact",
    "id",
    "updated_at",
  ]);
  const body = rows.map((r) =>
    csvRow([
      r.created_at,
      r.status,
      r.full_name,
      r.email,
      r.phone,
      r.business_name,
      r.inquiry_type,
      r.preferred_contact_method,
      r.city_area,
      r.website_or_social,
      r.business_category,
      r.wants_launch_updates ? "yes" : "no",
      r.source_page,
      r.source_cta,
      r.message,
      r.internal_notes,
      r.lang,
      r.consent_to_contact ? "yes" : "no",
      r.id,
      r.updated_at,
    ])
  );
  return [header, ...body].join("\r\n");
}

/** Newsletter-ready export: email + name only. */
export function newsletterReadyEmailsCsv(rows: NewsletterSubscriberRow[]): string {
  const header = csvRow(["email", "name"]);
  const body = rows
    .filter((r) => r.status === "subscribed" && r.email.trim())
    .map((r) => csvRow([r.email, r.name]));
  return [header, ...body].join("\r\n");
}

export function mediaKitLeadsToCsv(rows: MediaKitLeadRow[]): string {
  const header = csvRow([
    "id",
    "created_at",
    "updated_at",
    "name",
    "email",
    "phone",
    "business",
    "message",
    "lang",
    "source",
    "status",
  ]);
  const body = rows.map((r) =>
    csvRow([
      r.id,
      r.created_at,
      r.updated_at,
      r.name,
      r.email,
      r.phone,
      r.business,
      r.message,
      r.lang,
      r.source,
      r.status,
    ])
  );
  return [header, ...body].join("\r\n");
}
