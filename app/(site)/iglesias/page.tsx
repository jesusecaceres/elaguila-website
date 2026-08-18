import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeIglesiasPagePayload } from "@/app/lib/siteSectionContent/iglesiasPageMerge";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { IglesiasPageClient } from "./IglesiasPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("iglesias", normalizeLang(sp.lang));
}

export default async function Page(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const { payload } = await getSiteSectionPayload("iglesias_page");
  const shell = mergeIglesiasPagePayload(payload);

  return (
    <>
      <PublicPillarJsonLd id="iglesias" lang={lang} />
      <Suspense fallback={null}>
        <IglesiasPageClient shell={shell} />
      </Suspense>
    </>
  );
}
