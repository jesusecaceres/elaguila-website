/**
 * Autos Negocios only: allowlisted owners may complete QA publish (no Stripe) on production
 * when `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST` is set (comma-separated user UUIDs or emails).
 * Does not fake Stripe payment IDs or unlock Inventory Boost entitlements.
 */
export function parseAutosNegociosQaPublishAllowlist(): string[] {
  const raw = process.env.AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAutosNegociosQaPublishAllowlisted(userId: string, email?: string | null): boolean {
  const allowed = parseAutosNegociosQaPublishAllowlist();
  if (allowed.length === 0) return false;
  if (allowed.includes(userId.trim().toLowerCase())) return true;
  const em = email?.trim().toLowerCase();
  return Boolean(em && allowed.includes(em));
}
