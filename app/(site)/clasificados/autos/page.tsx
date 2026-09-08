import { Suspense } from "react";
import type { Metadata } from "next";
import { AutosLandingPage } from "./landing/AutosLandingPage";

// Package F Build F2, Gate 7 (P1 SEO fix) — this hub previously exported no metadata at all, so it
// inherited the parent /clasificados layout's canonical ("/clasificados") instead of its own.
export const metadata: Metadata = {
  alternates: { canonical: "/clasificados/autos" },
};

export default function ClasificadosAutosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosLandingPage market="private" />
    </Suspense>
  );
}
