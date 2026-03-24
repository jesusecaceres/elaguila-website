"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const COPY = {
  es: {
    title: "Vista previa de tu anuncio",
    planLabel: (p: "free" | "pro") => (p === "pro" ? "Plan: Pro" : "Plan: Gratis"),
    back: "Volver a editar",
  },
  en: {
    title: "Preview your listing",
    planLabel: (p: "free" | "pro") => (p === "pro" ? "Plan: Pro" : "Plan: Free"),
    back: "Back to edit",
  },
} as const;

function EnVentaPreviewContent() {
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";
  const planRaw = sp?.get("plan");
  const plan: "free" | "pro" = planRaw === "pro" ? "pro" : "free";
  const t = COPY[lang];
  const editHref = `/clasificados/publicar/en-venta?lang=${lang}`;

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="mx-auto max-w-lg px-6">
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 shadow-sm ring-1 ring-[#C9B46A]/18">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#111111]/50">Leonix · En Venta</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#111111]">{t.title}</h1>
          <p className="mt-3 text-sm font-medium text-[#A98C2A]">{t.planLabel(plan)}</p>
          <div className="mt-8">
            <Link
              href={editHref}
              className="inline-flex rounded-xl border border-black/15 bg-[#111111] px-5 py-2.5 text-sm font-semibold text-[#F5F5F5] hover:bg-black/90"
            >
              {t.back}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function EnVentaPreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#D9D9D9] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando…
        </main>
      }
    >
      <EnVentaPreviewContent />
    </Suspense>
  );
}
