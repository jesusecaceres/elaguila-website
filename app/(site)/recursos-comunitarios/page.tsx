import type { Metadata } from "next";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { listPublicCommunityResources } from "@/app/lib/recursos/server/communityResourcesPublicQueries";
import type { PrimaryCategorySlug } from "@/app/lib/recursos/types";
import RecursosComunitariosClient from "./RecursosComunitariosClient";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("recursos-comunitarios", normalizeLang(sp.lang));
}

export default async function Page(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const recursosLang = navCopyLang(lang);

  // Gate 1: the ONLY approved public data path — never a direct Supabase query here.
  const { resources } = await listPublicCommunityResources({});

  const helpNowResources = resources.filter((r) => r.urgencyLevel === "help-now");
  const categoryCounts = Object.fromEntries(
    PRIMARY_CATEGORIES.map((c) => [c.slug, resources.filter((r) => r.primaryCategory === c.slug).length]),
  ) as Record<PrimaryCategorySlug, number>;

  return (
    <>
      <PublicPillarJsonLd id="recursos-comunitarios" lang={lang} />
      <RecursosComunitariosClient
        lang={recursosLang}
        resources={resources}
        helpNowResources={helpNowResources}
        categoryCounts={categoryCounts}
      />
    </>
  );
}
