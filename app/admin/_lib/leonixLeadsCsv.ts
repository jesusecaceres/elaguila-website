import "server-only";

import type { MediaKitLeadRow, NewsletterSubscriberRow } from "./leonixLeadsData";

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
