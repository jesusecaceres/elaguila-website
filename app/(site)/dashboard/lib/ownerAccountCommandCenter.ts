import type { DerivedFeedItem, DerivedFeedKind } from "./derivedDashboardFeed";
import type { DashboardStatusTone } from "./dashboardLeonixTheme";

/** Account-level attention uses the existing derived feed only — no second advisor engine. */
export const ACCOUNT_ATTENTION_KINDS: ReadonlySet<DerivedFeedKind> = new Set<DerivedFeedKind>([
  "expire_visibility",
  "expire_listing",
  "draft",
  "profile_city",
  "inbox",
  "low_views",
  "moderation",
  "payment_attention",
]);

export function derivedFeedTone(kind: DerivedFeedKind): DashboardStatusTone {
  if (kind === "payment_attention" || kind === "moderation") return "danger";
  if (kind === "expire_visibility" || kind === "expire_listing" || kind === "inbox") return "warn";
  return "neutral";
}

export function accountAttentionItems(feed: DerivedFeedItem[]): DerivedFeedItem[] {
  return feed
    .filter((item) => ACCOUNT_ATTENTION_KINDS.has(item.kind))
    .slice()
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 8);
}
