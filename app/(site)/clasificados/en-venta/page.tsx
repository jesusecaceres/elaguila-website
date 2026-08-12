import { Suspense } from "react";
import type { Metadata } from "next";
import { getMergedEnVentaHubLanding } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { EnVentaHubPageClient } from "./EnVentaHubPageClient";
import { buildEnVentaHubMetadata } from "./seo/enVentaMetadata";

export const dynamic = "force-dynamic";

// Package F Build F2, Gate 7 (P1 SEO fix) — this hub previously exported no metadata at all, so
// it inherited the parent /clasificados layout's canonical ("/clasificados") instead of its own.
// Reuses the existing, previously-unwired buildEnVentaHubMetadata() helper — no new SEO framework.
export async function generateMetadata(props: { searchParams?: Promise<{ lang?: string }> }): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  return buildEnVentaHubMetadata(lang === "en" ? "en" : "es");
}

export default async function EnVentaHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);
  const copyLang = navCopyLang(routeLang);
  const hub = await getMergedEnVentaHubLanding(copyLang);
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <EnVentaHubPageClient hub={hub} />
    </Suspense>
  );
}
