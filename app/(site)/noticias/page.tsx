import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { mergeNoticiasPagePayload } from "@/app/lib/siteSectionContent/noticiasPageMerge";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { NoticiasPageClient } from "./NoticiasPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("noticias", normalizeLang(sp.lang));
}

export default async function NoticiasPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const { payload } = await getSiteSectionPayload("noticias_page");
  const shell = mergeNoticiasPagePayload(payload);

  return (
    <>
      <PublicPillarJsonLd id="noticias" lang={lang} />
      <Suspense fallback={null}>
        <NoticiasPageClient shell={shell} />
      </Suspense>
    </>
  );
}
