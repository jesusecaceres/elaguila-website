import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { HomeMarketingClient } from "./HomeMarketingClient";

export default async function HomePage() {
  const { payload } = await getSiteSectionPayload("home_marketing");
  const content = mergeHomeMarketing(payload as unknown as HomeMarketingPayload);
  return <HomeMarketingClient content={content} />;
}
