/**
 * Package C Build 1 (C2, decision 4) — stable server-enforced purchase-attempt identity
 * (pure; behaviorally testable). One UNRESOLVED attempt may exist per key (partial unique
 * index on leonix_payment_records); a duplicate click, browser retry, or second tab reuses
 * the existing OPEN Stripe session instead of minting another payable one. The key is
 * deterministic over the purchase identity, never a per-click row id.
 */

import { createHash } from "node:crypto";

export function computeCheckoutAttemptKey(input: {
  ownerUserId: string | null | undefined;
  listingSource: string | null | undefined;
  listingId: string | null | undefined;
  packageKey: string;
  addOns?: ReadonlyArray<{ key: string; quantity?: number }>;
  billingMode: string;
  operation?: string | null;
}): string {
  const addOnsNormalized = [...(input.addOns ?? [])]
    .map((a) => `${String(a.key).trim().toLowerCase()}x${Math.max(1, a.quantity ?? 1)}`)
    .sort()
    .join(",");
  const raw = [
    String(input.ownerUserId ?? "").trim().toLowerCase(),
    String(input.listingSource ?? "").trim().toLowerCase(),
    String(input.listingId ?? "").trim().toLowerCase(),
    String(input.packageKey ?? "").trim().toLowerCase(),
    addOnsNormalized,
    String(input.billingMode ?? "").trim().toLowerCase(),
    String(input.operation ?? "").trim().toLowerCase(),
  ].join("|");
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
