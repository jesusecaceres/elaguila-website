import type { Metadata } from "next";

export { default } from "../resultados/page";

// Package F Build F2, Gate 7 (P1 SEO fix) — this file re-exports only the default component from
// ../resultados/page, which does NOT carry over a `metadata` named export. /results is the
// confirmed real live canonical for Autos (next.config.ts redirects /resultados here, per Gate 4's
// verified live-CTA authority finding), so metadata belongs on this file directly.
export const metadata: Metadata = {
  alternates: { canonical: "/clasificados/autos/results" },
};
