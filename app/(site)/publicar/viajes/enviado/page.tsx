"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

function ViajesEnviadoInner() {
  const sp = useSearchParams();
  const qs = sp ?? new URLSearchParams();
  const lang: Lang = qs.get("lang") === "en" ? "en" : "es";
  const slug = qs.get("slug") ?? "";
  const id = qs.get("id") ?? "";
  const lane = qs.get("lane") ?? "";

  const copy = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Request received",
        body: "Your Viajes listing was saved for internal review. It is not publicly visible until an administrator approves it. Leonix does not process travel bookings here.",
        slugLabel: "Reference slug",
        idLabel: "Record id",
        laneLabel: "Lane",
        dashboard: "Open Viajes dashboard",
        results: "Browse public Viajes results",
        home: "Viajes publish hub",
        missing: "Missing submission reference. Return to the publish form and try again.",
      };
    }
    return {
      title: "Solicitud recibida",
      body: "Tu listado de Viajes quedó guardado para revisión interna. No es visible públicamente hasta que un administrador lo apruebe. Leonix no procesa reservas de viaje aquí.",
      slugLabel: "Slug de referencia",
      idLabel: "Id del registro",
      laneLabel: "Vía",
      dashboard: "Abrir panel de Viajes",
      results: "Ver resultados públicos de Viajes",
      home: "Hub de publicación Viajes",
      missing: "Falta la referencia del envío. Vuelve al formulario e inténtalo de nuevo.",
    };
  }, [lang]);

  const q = `lang=${lang}`;
  const dashboardHref = `/dashboard/viajes?${q}`;
  const resultsHref = appendLangToPath("/clasificados/viajes/resultados", lang);
  const hubHref = appendLangToPath("/publicar/viajes", lang);
  const detailHref = slug ? appendLangToPath(`/clasificados/viajes/oferta/${slug}`, lang) : "";

  if (!slug || !id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[color:var(--lx-muted)]">
        <p>{copy.missing}</p>
        <Link href={hubHref} className="mt-6 inline-block font-bold text-[#B45309] underline">
          {copy.home}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-[color:var(--lx-text)]">{copy.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy.body}</p>
      <dl className="mt-6 space-y-2 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[color:var(--lx-muted)]">{copy.slugLabel}</dt>
          <dd className="font-mono text-xs text-[color:var(--lx-text)]">{slug}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[color:var(--lx-muted)]">{copy.idLabel}</dt>
          <dd className="font-mono text-xs text-[color:var(--lx-text)]">{id}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[color:var(--lx-muted)]">{copy.laneLabel}</dt>
          <dd className="text-[color:var(--lx-text)]">{lane || "—"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-[color:var(--lx-muted)]">
        {lang === "en"
          ? "After approval, your offer appears in public results and at the offer URL below."
          : "Tras la aprobación, tu oferta aparece en resultados públicos y en la URL de ficha."}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={dashboardHref}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#D97706] px-4 text-sm font-bold text-white shadow-md"
        >
          {copy.dashboard}
        </Link>
        <Link
          href={resultsHref}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] px-4 text-sm font-bold text-[color:var(--lx-text)]"
        >
          {copy.results}
        </Link>
        {detailHref ? (
          <Link href={detailHref} className="text-center text-sm font-semibold text-[#B45309] underline">
            {lang === "en" ? "Offer page (after approval)" : "Ficha pública (tras aprobación)"}
          </Link>
        ) : null}
        <Link href={hubHref} className="text-center text-sm text-[color:var(--lx-muted)] underline">
          {copy.home}
        </Link>
      </div>
    </div>
  );
}

export default function PublicarViajesEnviadoPage() {
  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-[color:var(--lx-muted)]">…</div>}>
        <ViajesEnviadoInner />
      </Suspense>
    </div>
  );
}
