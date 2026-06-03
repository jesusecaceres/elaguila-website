export type AutosAnalyticsTrackMeta = {
  sourceId?: string | null;
  leonixAdId?: string | null;
  lane?: string;
  source?: string;
  [key: string]: unknown;
};

/** Public detail/contact surfaces (AUTO1). */
export type AutosPublicListingAnalyticsProps = {
  listingSourceId?: string;
  leonixAdId?: string | null;
  lane?: string;
};

export function autosSheetCtaAnalyticsProps(props?: AutosPublicListingAnalyticsProps) {
  const id = props?.listingSourceId?.trim();
  if (!id) return {};
  return {
    listingSourceId: id,
    leonixAdId: props?.leonixAdId,
    lane: props?.lane,
  };
}

export function autosAnalyticsTrackMeta(args: {
  sourceId: string;
  leonixAdId?: string | null;
  lane?: string;
  source: string;
  extra?: Record<string, unknown>;
}): AutosAnalyticsTrackMeta {
  return {
    sourceId: args.sourceId.trim(),
    leonixAdId: args.leonixAdId?.trim() || undefined,
    lane: args.lane,
    source: args.source,
    ...(args.extra ?? {}),
  };
}
