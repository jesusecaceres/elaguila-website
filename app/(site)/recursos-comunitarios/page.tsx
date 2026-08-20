import type { Metadata } from "next";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import RecursosComunitariosPage from "./RecursosComunitariosClient";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("recursos-comunitarios", normalizeLang(sp.lang));
}

export default async function Page(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  return (
    <>
      <PublicPillarJsonLd id="recursos-comunitarios" lang={lang} />
      <RecursosComunitariosPage />
    </>
  );
}
