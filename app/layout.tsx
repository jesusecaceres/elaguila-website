import "./globals.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LeonixRootJsonLd } from "./components/LeonixRootJsonLd";
import {
  LEONIX_MEDIA_SITE_NAME,
  LEONIX_MEDIA_SLOGAN,
  LEONIX_ROOT_BROWSER_TITLE,
  LEONIX_ROOT_META_DESCRIPTION_EN,
  LEONIX_SITE_ORIGIN,
} from "./lib/leonixBrand";

export const metadata: Metadata = {
  metadataBase: new URL(LEONIX_SITE_ORIGIN),
  title: {
    default: LEONIX_ROOT_BROWSER_TITLE,
    template: `%s | ${LEONIX_MEDIA_SITE_NAME}`,
  },
  description: LEONIX_ROOT_META_DESCRIPTION_EN,
  keywords: [
    "Leonix Media",
    "Leonix Global LLC",
    "clasificados",
    "business visibility",
    "local discovery",
    "bilingual",
    "San Francisco Bay Area",
    "Northern California",
    "community",
    "classifieds",
    "small business",
  ],
  robots: { index: true, follow: true },
  alternates: {
    canonical: LEONIX_SITE_ORIGIN,
  },
  openGraph: {
    title: `${LEONIX_MEDIA_SITE_NAME} — ${LEONIX_MEDIA_SLOGAN}`,
    description: LEONIX_ROOT_META_DESCRIPTION_EN,
    url: LEONIX_SITE_ORIGIN,
    siteName: LEONIX_MEDIA_SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${LEONIX_MEDIA_SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${LEONIX_MEDIA_SITE_NAME} — ${LEONIX_MEDIA_SLOGAN}`,
    description: LEONIX_ROOT_META_DESCRIPTION_EN,
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)] antialiased">
        <LeonixRootJsonLd />
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </body>
    </html>
  );
}
