/** Pro / boost hooks — data-only; no paid flow in free MVP. */

export type EnVentaBoostContract = {
  plan_tier: "free" | "pro" | "business";
  featured_rank: number | null;
  boost_until: string | null;
  promoted_style: "none" | "subtle" | "bold";
  image_limit_override: number | null;
  video_enabled: boolean;
  seller_kind: "individual" | "business";
};
