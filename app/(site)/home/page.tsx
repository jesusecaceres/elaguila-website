import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { isOfficialLaunchLang, normalizeLang } from "@/app/lib/language";
import { HomeMarketingClient } from "./HomeMarketingClient";
import { LEONIX_MEDIA_SITE_NAME, LEONIX_ROOT_META_DESCRIPTION_EN, leonixPageTitle } from "@/app/lib/leonixBrand";

export const metadata: Metadata = {
  title: "Home",
  description: LEONIX_ROOT_META_DESCRIPTION_EN,
  openGraph: {
    title: leonixPageTitle("Home"),
    description: LEONIX_ROOT_META_DESCRIPTION_EN,
    siteName: LEONIX_MEDIA_SITE_NAME,
  },
  twitter: {
    title: leonixPageTitle("Home"),
    description: LEONIX_ROOT_META_DESCRIPTION_EN,
  },
};

export default async function HomePage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  if (!isOfficialLaunchLang(lang)) {
    redirect(`/coming-soon-v2?lang=${lang}`);
  }

  const { payload } = await getSiteSectionPayload("home_marketing");
  const content = mergeHomeMarketing(payload as unknown as HomeMarketingPayload);
  return <HomeMarketingClient content={content} />;
}
