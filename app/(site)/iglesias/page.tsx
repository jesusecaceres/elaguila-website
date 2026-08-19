import type { Metadata } from "next";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { parseIglesiasBrowseState } from "@/app/lib/iglesias/queryParams";
import { listPublicChurches } from "@/app/lib/iglesias/churchQueries";
import { IglesiasLandingView } from "./IglesiasLandingView";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("iglesias", normalizeLang(sp.lang));
}

export default async function Page(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await props.searchParams) ?? {};
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") usp.set(k, v);
    else if (Array.isArray(v) && v[0]) usp.set(k, v[0]);
  }
  const uiLang = normalizeLang(usp.get("lang")) === "en" ? "en" : "es";
  const browse = parseIglesiasBrowseState(usp);
  // Keep CMS fetch so admin saves still revalidate this route. Landing copy is code-owned
  // so stale site_section_content cannot dump unstyled directory text over the page.
  await getSiteSectionPayload("iglesias_page");
  const churches = await listPublicChurches(browse, uiLang);

  return (
    <>
      <PublicPillarJsonLd id="iglesias" lang={uiLang} />
      <IglesiasLandingView lang={uiLang} browse={browse} churches={churches} />
    </>
  );
}
