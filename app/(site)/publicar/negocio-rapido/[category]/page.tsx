import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getQuickBusinessDefinition } from "@/app/lib/quickBusiness/quickBusinessRegistry";
import { isQuickBusinessCategoryKey } from "@/app/lib/quickBusiness/quickBusinessRoutes";
import { QuickBusinessIntakeClient } from "../_components/QuickBusinessIntakeClient";

type Params = { category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { category } = await params;
  if (!isQuickBusinessCategoryKey(category)) return { title: "Negocio rápido — LEONIX" };
  const def = getQuickBusinessDefinition(category);
  return {
    title: `${def.label.es} — Negocio rápido — LEONIX`,
    description: def.tagline.es,
    robots: { index: false, follow: true },
    alternates: { canonical: `/publicar/negocio-rapido/${category}` },
  };
}

/** Quick Business — ESSENTIAL QUESTIONS → ≥ 1 REAL IMAGE → REVIEW → existing preview. */
export default async function PublicarNegocioRapidoCategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  if (!isQuickBusinessCategoryKey(category)) notFound();
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F6F0E2]" aria-busy="true" />}>
      <QuickBusinessIntakeClient category={category} />
    </Suspense>
  );
}
