"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { createEmptyEnVentaFreeState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { loadEnVentaPreviewDraft } from "./enVentaPreviewDraft";
import { buildEnVentaPreviewModel } from "./buildEnVentaPreviewModel";
import { EnVentaPreviewGallery } from "./EnVentaPreviewGallery";
import { EnVentaPreviewSellerCard } from "./EnVentaPreviewSellerCard";

const TOP = {
  es: {
    back: "← Volver a editar",
    share: "Compartir",
    save: "Guardar",
    report: "Reportar",
  },
  en: {
    back: "← Back to edit",
    share: "Share",
    save: "Save",
    report: "Report",
  },
} as const;

const EMPTY = {
  es: {
    title: "Sin borrador para mostrar",
    body: "Completa tu anuncio en Publicar y vuelve a abrir la vista previa desde allí.",
    edit: "Ir a editar",
  },
  en: {
    title: "No draft to preview",
    body: "Fill in your listing in Publish, then open preview again from there.",
    edit: "Go to editor",
  },
} as const;

function chipClass(tone: "success" | "neutral" | "muted") {
  if (tone === "success") {
    return "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800";
  }
  if (tone === "neutral") {
    return "inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#F5F5F5] px-2.5 py-1 text-xs font-semibold text-[#111111]/85";
  }
  return "inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-[#111111]/65";
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EnVentaPreviewPage() {
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";
  const plan = sp?.get("plan") === "pro" ? "pro" : "free";
  const tTop = TOP[lang];
  const tEmpty = EMPTY[lang];

  const editHubHref = `/clasificados/publicar/en-venta?lang=${lang}`;

  const [draft, setDraft] = useState<EnVentaFreeApplicationState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraft(loadEnVentaPreviewDraft(plan));
    setHydrated(true);
  }, [plan]);

  const state = draft ?? createEmptyEnVentaFreeState();
  const hasDraft = draft !== null;

  const vm = useMemo(() => buildEnVentaPreviewModel(state, lang, plan), [state, lang, plan]);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-[#111111]/50">
          {lang === "es" ? "Cargando vista previa…" : "Loading preview…"}
        </div>
      </main>
    );
  }

  if (!hasDraft) {
    return (
      <main className="min-h-screen bg-white text-[#111111]">
        <div className="mx-auto max-w-lg px-4 pb-16 pt-24">
          <h1 className="text-xl font-bold">{tEmpty.title}</h1>
          <p className="mt-2 text-sm text-[#111111]/70">{tEmpty.body}</p>
          <Link
            href={editHubHref}
            className="mt-6 inline-flex rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
          >
            {tEmpty.edit}
          </Link>
        </div>
      </main>
    );
  }

  const mainTop = (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#111111] sm:text-[26px]">{vm.title}</h1>
        <p className="mt-2 text-3xl font-extrabold text-emerald-600 sm:text-4xl">{vm.priceLine}</p>
        <p className="mt-2 text-xs font-medium text-[#111111]/50">{vm.previewBadge}</p>
        <p className="mt-1 text-xs text-[#111111]/45">{vm.postedLine}</p>
      </div>

      {vm.chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {vm.chips.map((c) => (
            <span key={c.key} className={chipClass(c.tone)}>
              {c.key === "condition" ? <span aria-hidden>✓ </span> : null}
              {c.text}
            </span>
          ))}
        </div>
      ) : null}

      {vm.locationLine ? <p className="text-sm font-medium text-[#111111]/70">{vm.locationLine}</p> : null}
    </div>
  );

  const mainBody = (
    <div className="flex flex-col gap-5">
      {vm.description ? (
        <div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111111]/85">{vm.description}</p>
        </div>
      ) : null}

      {vm.specRows.length > 0 ? (
        <div className="rounded-xl border border-black/[0.08] bg-[#FAFAFA] px-4 py-3">
          <dl className="space-y-2">
            {vm.specRows.map((row, idx) => (
              <div key={`${row.label}-${idx}`} className="grid grid-cols-[minmax(0,38%)_1fr] gap-3 text-sm">
                <dt className="font-semibold text-[#111111]/65">{row.label}</dt>
                <dd className="text-[#111111]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {vm.extraParagraphs.map((block) => (
        <div key={block.title}>
          <h3 className="text-sm font-bold text-[#111111]">{block.title}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#111111]/80">{block.body}</p>
        </div>
      ))}

      <div>
        <h3 className="text-base font-bold text-[#111111]">{vm.deliveryHeading}</h3>
        {vm.deliveryLines.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-sm text-[#111111]/80">
            {vm.deliveryLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#111111]/50">
            {lang === "es" ? "Sin opciones de entrega indicadas." : "No delivery options specified."}
          </p>
        )}
      </div>
    </div>
  );

  const mainCta = (
    <div>
      {vm.primaryCtaHref !== "#" ? (
        <a
          href={vm.primaryCtaHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        >
          <ContactIcon className="h-5 w-5 shrink-0 text-white" />
          {vm.primaryCtaLabel}
        </a>
      ) : (
        <div className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#2563EB]/35 px-4 py-3.5 text-sm font-bold text-white">
          <ContactIcon className="h-5 w-5 shrink-0 text-white/90" />
          {vm.primaryCtaLabel}
        </div>
      )}
      <p className="mt-2 text-center text-[11px] leading-relaxed text-[#111111]/50">{vm.trustNote}</p>
    </div>
  );

  const seller = (
    <EnVentaPreviewSellerCard
      initials={vm.sellerInitials}
      name={vm.sellerName}
      subline={vm.sellerSubline}
      viewProfileLabel={vm.viewProfileLabel}
    />
  );

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <div className="border-b border-black/[0.08] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={editHubHref} className="text-sm font-semibold text-[#111111] hover:underline">
            {tTop.back}
          </Link>
          <div className="hidden items-center gap-4 text-xs font-medium text-[#111111]/45 sm:flex">
            <span className="cursor-default">{tTop.share}</span>
            <span className="cursor-default">{tTop.save}</span>
            <span className="cursor-default">{tTop.report}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {/*
          Mobile order: gallery → title/price/chips/location → seller → CTA → description/specs/delivery
          Desktop: 12-col grid — gallery (5) | stack (4) | seller (3), CTA last in center column
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
          <div className="order-1 lg:col-span-5 lg:row-span-3 lg:row-start-1">
            <EnVentaPreviewGallery
              orderedImages={vm.gallery.orderedImages}
              videoUrl={vm.gallery.videoUrl}
              showVideo={vm.gallery.showVideo}
              lang={lang}
            />
          </div>

          <div className="order-2 lg:col-span-4 lg:col-start-6 lg:row-start-1">{mainTop}</div>

          <div className="order-3 lg:col-span-3 lg:col-start-10 lg:row-span-3 lg:row-start-1">
            <div className="lg:sticky lg:top-24">{seller}</div>
          </div>

          {/* Mobile: CTA before body; Desktop: CTA row 3 under body */}
          <div className="order-4 lg:order-5 lg:col-span-4 lg:col-start-6 lg:row-start-3">{mainCta}</div>

          <div className="order-5 lg:order-4 lg:col-span-4 lg:col-start-6 lg:row-start-2">{mainBody}</div>
        </div>
      </div>
    </main>
  );
}
