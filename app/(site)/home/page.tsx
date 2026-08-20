import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { isOfficialLaunchLang, normalizeLang } from "@/app/lib/language";
import { HomeMarketingClient } from "./HomeMarketingClient";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("home", normalizeLang(sp.lang));
}

export default async function HomePage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  if (!isOfficialLaunchLang(lang)) {
    redirect(`/coming-soon-v2?lang=${lang}`);
  }

  const { payload } = await getSiteSectionPayload("home_marketing");
  const content = mergeHomeMarketing(payload as unknown as HomeMarketingPayload);
  return (
    <>
      <PublicPillarJsonLd id="home" lang={lang} />
      <HomeMarketingClient content={content} />
    </>
  );
}
