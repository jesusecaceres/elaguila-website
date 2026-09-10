import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiciosLandingPage } from "./landing/ServiciosLandingPage";

/**
 * Gate SERVICIOS-2 — TRUTHFUL DATA CONTRACT.
 *
 * This route previously declared `export const dynamic = "force-dynamic"` under the comment
 * "Marketplace landing must always reflect current `servicios_public_listings` (+ optional dev
 * file)". That was false: `ServiciosLandingPage` is a `"use client"` component that performs no
 * database read at all. The two components that would have rendered live rows
 * (`landing/FeaturedBusinessSection.tsx`, `landing/RecentServicesSection.tsx`) have zero importers.
 * The route was paying a per-request dynamic render to display nothing dynamic.
 *
 * Its real, current product role is static category navigation: a search panel, "Explora por giro"
 * trade cards, trust shortcuts and publisher marketing — every one of which routes into
 * `/clasificados/servicios/results`, where the real `servicios_public_listings` discovery pipeline
 * lives (filter -> entitlement overlay -> visibility ranking). Live listing data is therefore
 * genuinely one navigation step away by design, not missing.
 *
 * The smallest truthful repair is to drop the false dynamic/data claim rather than add a query the
 * page has no surface to render. Language and search state are read client-side via
 * `useSearchParams()` inside the existing `<Suspense>` boundary below, which is exactly the
 * contract Next.js requires for a statically rendered shell.
 *
 * If a future gate reinstates a live "Featured"/"Recent" rail here, THAT change reintroduces the
 * data dependency — and should reinstate a dynamic contract with it.
 */
export const metadata: Metadata = {
  title: "Servicios · Leonix Clasificados",
  description:
    "Encuentra servicios confiables cerca de ti — vitrinas claras y contacto directo en Leonix.",
  alternates: {
    canonical: "/clasificados/servicios",
  },
  openGraph: {
    title: "Servicios · Leonix Clasificados",
    description:
      "Encuentra servicios confiables cerca de ti — vitrinas claras y contacto directo en Leonix.",
    url: "/clasificados/servicios",
    siteName: "LEONIX",
    type: "website",
  },
};

export default async function ClasificadosServiciosLandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <ServiciosLandingPage />
    </Suspense>
  );
}
