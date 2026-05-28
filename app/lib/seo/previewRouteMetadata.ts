import type { Metadata } from "next";

/** Shared robots guard for session/preview/shell routes that must not rank in search. */
export const PREVIEW_NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
