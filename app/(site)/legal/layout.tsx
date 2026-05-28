import type { Metadata } from "next";
import { LEONIX_GLOBAL_LLC, LEONIX_MEDIA_SITE_NAME, leonixPageTitle } from "@/app/lib/leonixBrand";

export const metadata: Metadata = {
  title: leonixPageTitle("Legal"),
  description: `Legal information, policies, and community guidelines for ${LEONIX_MEDIA_SITE_NAME} (${LEONIX_GLOBAL_LLC}).`,
  openGraph: {
    title: leonixPageTitle("Legal"),
    description: `Policies and legal information for ${LEONIX_MEDIA_SITE_NAME}.`,
    siteName: LEONIX_MEDIA_SITE_NAME,
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
