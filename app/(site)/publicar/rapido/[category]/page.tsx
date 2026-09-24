import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getQuickClassifiedDefinition } from "@/app/lib/quickClassifieds/quickClassifiedRegistry";
import { isQuickClassifiedCategoryKey } from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import { QuickIntakeClient } from "../_components/QuickIntakeClient";

type Params = { category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  if (!isQuickClassifiedCategoryKey(category)) return { title: "Publicación rápida — LEONIX" };
  const def = getQuickClassifiedDefinition(category);
  return {
    title: `${def.label.es} — Publicación rápida — LEONIX`,
    description: def.tagline.es,
    robots: { index: false, follow: true },
    alternates: { canonical: `/publicar/rapido/${category}` },
  };
}

/** Quick Classifieds — ESSENTIAL QUESTIONS → ≥1 IMAGE → REVIEW → existing preview. */
export default async function PublicarRapidoCategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  if (!isQuickClassifiedCategoryKey(category)) notFound();
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <QuickIntakeClient category={category} />
    </Suspense>
  );
}
