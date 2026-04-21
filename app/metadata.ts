/**
 * Legacy entry point — root `app/layout.tsx` owns live metadata.
 * Kept aligned so any accidental import stays on-brand.
 */
import type { Metadata } from "next";
import {
  LEONIX_MEDIA_SITE_NAME,
  LEONIX_ROOT_BROWSER_TITLE,
  LEONIX_ROOT_META_DESCRIPTION_EN,
  LEONIX_SITE_ORIGIN,
} from "./lib/leonixBrand";

export const metadata: Metadata = {
  metadataBase: new URL(LEONIX_SITE_ORIGIN),
  title: LEONIX_ROOT_BROWSER_TITLE,
  description: LEONIX_ROOT_META_DESCRIPTION_EN,
  openGraph: {
    title: LEONIX_MEDIA_SITE_NAME,
    description: LEONIX_ROOT_META_DESCRIPTION_EN,
    url: LEONIX_SITE_ORIGIN,
    siteName: LEONIX_MEDIA_SITE_NAME,
  },
};
