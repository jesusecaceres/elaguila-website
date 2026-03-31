/**
 * Pro-only manual visibility renewal: 48h boost window on trigger, 48h cooldown between triggers.
 * State: `listings.boost_expires` + `detail_pairs` label `Leonix:visibility_last_renewed_at` (ISO).
 */

export const EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL = "Leonix:visibility_last_renewed_at" as const;

/** Visibility / ranking treatment window after each successful renewal. */
export const EN_VENTA_VISIBILITY_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Minimum time between manual renewals. */
export const EN_VENTA_VISIBILITY_RENEW_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export function parseDetailPairValue(pairs: unknown, label: string): string | null {
  if (!Array.isArray(pairs)) return null;
  for (const p of pairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    if (o.label === label) return (o.value ?? "").trim() || null;
  }
  return null;
}

export function mergeDetailPairValue(
  pairs: unknown,
  label: string,
  value: string
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  if (Array.isArray(pairs)) {
    for (const p of pairs) {
      if (!p || typeof p !== "object") continue;
      const o = p as { label?: string; value?: string };
      const l = typeof o.label === "string" ? o.label : "";
      const v = typeof o.value === "string" ? o.value : "";
      if (!l || l === label) continue;
      out.push({ label: l, value: v });
    }
  }
  out.push({ label, value });
  return out;
}

function parseIsoMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function parseBoostExpiresMs(boostExpires: unknown): number | null {
  if (boostExpires == null) return null;
  const t = new Date(typeof boostExpires === "string" ? boostExpires : String(boostExpires)).getTime();
  return Number.isFinite(t) ? t : null;
}

export type EnVentaVisibilityRenewalVm = {
  boostActive: boolean;
  boostExpiresAt: number | null;
  canRenewNow: boolean;
  /** Timestamp when the seller may renew again (<= now means eligible). */
  nextRenewEligibleAt: number;
};

/** Dashboard / admin: renewal rules apply only when `plan === "pro"`. */
export function computeEnVentaVisibilityRenewalVm(args: {
  plan: "free" | "pro";
  boostExpires: unknown;
  detailPairs: unknown;
  nowMs: number;
}): EnVentaVisibilityRenewalVm | null {
  if (args.plan !== "pro") return null;

  const boostExpiresAt = parseBoostExpiresMs(args.boostExpires);
  const boostActive = boostExpiresAt != null && boostExpiresAt > args.nowMs;

  const lastIso = parseDetailPairValue(args.detailPairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL);
  const lastMs = parseIsoMs(lastIso);
  const nextRenewEligibleAt =
    lastMs == null ? args.nowMs : lastMs + EN_VENTA_VISIBILITY_RENEW_COOLDOWN_MS;
  const canRenewNow = args.nowMs >= nextRenewEligibleAt;

  return { boostActive, boostExpiresAt, canRenewNow, nextRenewEligibleAt };
}
