import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DigitalContactJsonLd } from "@/app/components/digitalContact/DigitalContactJsonLd";
import { DigitalContactPageClient } from "@/app/components/digitalContact/DigitalContactPageClient";
import { resolveDigitalContactLang } from "@/app/lib/digitalContact/digitalContactCopy";
import {
  getPublishedExecutiveContactProfile,
  listPublishedExecutiveContactSlugs,
} from "@/app/lib/digitalContact/digitalContactExecutiveHubProfile";
import { buildDigitalContactMetadata } from "@/app/lib/digitalContact/digitalContactSeo";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Executive contact cards are lightweight and slug-driven — static generation keeps them instant. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await listPublishedExecutiveContactSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const profile = await getPublishedExecutiveContactProfile(slug);
  if (!profile) {
    return { title: "Contact · Leonix Media", robots: { index: false, follow: false } };
  }
  return buildDigitalContactMetadata(profile);
}

/**
 * Leonix Digital Contact Platform — `/contact/[slug]`.
 * Rendered outside the `(site)` marketing shell (no header/footer mega-nav) so every
 * profile stays a focused, premium, single-purpose executive contact card.
 */
export default async function DigitalContactPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const profile = await getPublishedExecutiveContactProfile(slug);
  if (!profile) notFound();

  const lang = resolveDigitalContactLang(sp);

  return (
    <>
      <DigitalContactJsonLd profile={profile} />
      <DigitalContactPageClient profile={profile} initialLang={lang} />
    </>
  );
}
