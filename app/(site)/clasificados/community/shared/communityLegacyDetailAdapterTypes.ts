/** Shared shape both category-owned legacy detail adapters return — a type only, no logic. */
export type CommunityLegacyDetailAdapter = {
  sectionTitle: string;
  categoryChipLabel: string;
  rows: { label: string; value: string }[];
};
