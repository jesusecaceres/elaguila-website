import type { Metadata } from "next";
import { listActiveDigitalContactProfiles } from "@/app/lib/digitalContact/digitalContactRegistry";
import { LEONIX_MEDIA_SITE_NAME, LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import {
  getVisitanosCopy,
  resolveVisitanosLang,
  resolveVisitanosSource,
} from "@/app/lib/visitanos/visitanosCopy";
import { VisitanosPageClient } from "./VisitanosPageClient";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const CANONICAL = `${LEONIX_SITE_ORIGIN}/visitanos`;

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = resolveVisitanosLang(sp);
  const copy = getVisitanosCopy(lang);
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: CANONICAL },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${copy.metaTitle} | ${LEONIX_MEDIA_SITE_NAME}`,
      description: copy.metaDescription,
      url: CANONICAL,
      siteName: LEONIX_MEDIA_SITE_NAME,
      type: "website",
      images: [
        {
          url: `${LEONIX_SITE_ORIGIN}/logo-clean.png`,
          width: 512,
          height: 512,
          alt: LEONIX_MEDIA_SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${copy.metaTitle} | ${LEONIX_MEDIA_SITE_NAME}`,
      description: copy.metaDescription,
      images: [`${LEONIX_SITE_ORIGIN}/logo-clean.png`],
    },
  };
}

/**
 * Leonix Virtual Front Desk — `/visitanos`
 *
 * Physical office window QR destination. Consumes Executive Contact Platform identity;
 * does not own staff, availability, calendars, or CRM records.
 * Rendered outside the `(site)` marketing shell for a focused mobile reception experience.
 */
export default async function VisitanosPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = resolveVisitanosLang(sp);
  const source = resolveVisitanosSource(sp);
  const profiles = listActiveDigitalContactProfiles();

  return <VisitanosPageClient profiles={profiles} initialLang={lang} source={source} />;
}
