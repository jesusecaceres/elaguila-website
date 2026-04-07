/**
 * Boost eligibility: free private Autos never boosts; Pro private + dealer eligible when entitlements allow.
 */

export type AutosBoostLane = "free_private" | "pro_private" | "dealer";

export type AutosBoostKind =
  | "featured"
  | "top_of_results"
  | "urgent_sale"
  | "price_drop_highlight"
  | "financing_badge"
  | "certified_badge"
  | "dealer_spotlight";

export function resolveAutosBoostLane(options: {
  sellerType: "personal" | "business" | string | undefined;
  isProPrivate: boolean;
}): AutosBoostLane {
  const st = (options.sellerType ?? "personal").toLowerCase();
  if (st === "business") return "dealer";
  return options.isProPrivate ? "pro_private" : "free_private";
}

export function autosBoostAllowed(lane: AutosBoostLane): boolean {
  return lane === "pro_private" || lane === "dealer";
}
