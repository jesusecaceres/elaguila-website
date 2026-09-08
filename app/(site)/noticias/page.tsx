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
  // Noticias itself only ships es/en copy (unlike the site-wide normalizeLang() above, which
  // resolves the full multi-locale set for metadata/JSON-LD) -- narrow the same way the client
  // component used to via its own useSearchParams() read, so this server-computed value is a
  // drop-in replacement with identical behavior for every existing ?lang= value.
  const noticiasLang = sp.lang === "en" ? "en" : "es";

  return (
    <>
      <PublicPillarJsonLd id="noticias" lang={lang} />
      <Suspense fallback={null}>
        <NoticiasPageClient shell={shell} lang={noticiasLang} />
      </Suspense>
    </>
  );
}
