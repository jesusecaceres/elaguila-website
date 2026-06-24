import "server-only";

const PRODUCTION_SITE = "https://leonixmedia.com";

/** Safe admin deep links for internal notification emails (no secrets). */
export function leonixAdminLeadInboxUrl(): string {
  const base = siteBaseUrl();
  return `${base}/admin/leads/inbox`;
}

export function leonixAdminNewsletterInboxUrl(): string {
  const base = siteBaseUrl();
  return `${base}/admin/leads/newsletter`;
}

export function leonixAdminPromoInboxUrl(): string {
  const base = siteBaseUrl();
  return `${base}/admin/leads/inbox?view=promo`;
}

export function leonixAdminMediaKitInboxUrl(): string {
  const base = siteBaseUrl();
  return `${base}/admin/leads/media-kit`;
}

function siteBaseUrl(): string {
  const explicit = process.env.LEONIX_SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return PRODUCTION_SITE;
}
