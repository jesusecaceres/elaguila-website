export type EmpleosAnalyticsTrackMeta = {
  sourceId?: string | null;
  slug?: string | null;
  leonixAdId?: string | null;
  source?: string;
  [key: string]: unknown;
};

export type EmpleosPublicListingAnalyticsProps = {
  listingSourceId?: string;
  slug?: string | null;
  leonixAdId?: string | null;
};

export function empleosAnalyticsTrackMeta(args: {
  sourceId: string;
  slug?: string | null;
  leonixAdId?: string | null;
  source: string;
  extra?: Record<string, unknown>;
}): EmpleosAnalyticsTrackMeta {
  return {
    sourceId: args.sourceId.trim(),
    slug: args.slug?.trim() || undefined,
    leonixAdId: args.leonixAdId?.trim() || undefined,
    source: args.source,
    ...(args.extra ?? {}),
  };
}

export function empleosPublicAnalyticsProps(
  props?: EmpleosPublicListingAnalyticsProps,
): EmpleosPublicListingAnalyticsProps | undefined {
  const id = props?.listingSourceId?.trim();
  if (!id) return undefined;
  return {
    listingSourceId: id,
    slug: props?.slug,
    leonixAdId: props?.leonixAdId,
  };
}
