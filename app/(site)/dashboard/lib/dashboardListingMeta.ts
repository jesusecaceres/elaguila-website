/** Parse listing row fields used for dashboard free/pro and boost UI. */

export function listingPlanFromDetailPairs(detailPairs: unknown): "free" | "pro" {
  if (!Array.isArray(detailPairs)) return "free";
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    if (o.label === "Leonix:plan") {
      const v = (o.value ?? "").trim().toLowerCase();
      if (v === "pro") return "pro";
      return "free";
    }
  }
  return "free";
}

export function isListingBoosted(boostExpires: unknown): boolean {
  if (boostExpires == null) return false;
  const t = new Date(typeof boostExpires === "string" ? boostExpires : String(boostExpires)).getTime();
  return Number.isFinite(t) && t > Date.now();
}
