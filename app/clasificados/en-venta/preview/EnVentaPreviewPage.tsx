"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { createEmptyEnVentaFreeState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { loadEnVentaPreviewDraft } from "./enVentaPreviewDraft";
import { buildEnVentaPreviewModel } from "./buildEnVentaPreviewModel";
import { EnVentaPreviewGallery } from "./EnVentaPreviewGallery";
import { EnVentaPreviewSellerCard } from "./EnVentaPreviewSellerCard";
import { publishEnVentaFromDraft } from "../publish/enVentaPublishFromDraft";

const PAGE_BG_STYLE: CSSProperties = {
  backgroundColor: "#F3EBDD",
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
    radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
  `,
};

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

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function chipClass(tone: "success" | "neutral" | "muted") {
  if (tone === "success") {
    return "inline-flex items-center gap-1 rounded-full border border-[#C9B46A]/45 bg-[#FBF7EF] px-2.5 py-1 text-xs font-semibold text-[#3D3428]";
  }
  if (tone === "neutral") {
    return "inline-flex items-center gap-1 rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-2.5 py-1 text-xs font-semibold text-[#3D3428]/90";
  }
  return "inline-flex items-center gap-1 rounded-full border border-[#E8DFD0]/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#5C5346]/85";
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EnVentaPreviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp?.get("lang") === "en" ? "en" : "es";
  const plan = sp?.get("plan") === "pro" ? "pro" : "free";
  const tTop = TOP[lang];
  const tEmpty = EMPTY[lang];

  const editHubHref = `/clasificados/publicar/en-venta?lang=${lang}`;

  const [draft, setDraft] = useState<EnVentaFreeApplicationState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(loadEnVentaPreviewDraft(plan));
    setHydrated(true);
  }, [plan]);

  const state = draft ?? createEmptyEnVentaFreeState();
  const hasDraft = draft !== null;

  const vm = useMemo(() => buildEnVentaPreviewModel(state, lang, plan), [state, lang, plan]);

  async function onPublish() {
    setPublishErr(null);
    const latest = loadEnVentaPreviewDraft(plan) ?? draft;
    if (!latest) {
      setPublishErr(lang === "es" ? "No hay borrador." : "No draft.");
      return;
    }
    setPublishing(true);
    try {
      const result = await publishEnVentaFromDraft(latest, lang, plan);
      if (!result.ok) {
        setPublishErr(result.error);
        return;
      }
      router.push(`/clasificados/anuncio/${result.listingId}?lang=${lang}`);
    } finally {
      setPublishing(false);
    }
  }

  const shell = (children: ReactNode) => (
    <div className="relative min-h-screen text-[#2C2416]" style={PAGE_BG_STYLE}>
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      {children}
    </div>
  );

  if (!hydrated) {
    return shell(
      <main className="relative">
        <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-[#5C5346]/80">
          {lang === "es" ? "Cargando vista previa…" : "Loading preview…"}
        </div>
      </main>
    );
  }

  if (!hasDraft) {
    return shell(
      <main className="relative">
        <div className="mx-auto max-w-lg px-4 pb-16 pt-24">
          <h1 className="text-xl font-bold text-[#1E1810]">{tEmpty.title}</h1>
          <p className="mt-2 text-sm text-[#5C5346]/90">{tEmpty.body}</p>
          <Link
            href={editHubHref}
            className="mt-6 inline-flex rounded-2xl bg-[#2A2620] px-5 py-2.5 text-sm font-semibold text-[#FAF7F2] shadow-md transition hover:bg-[#1a1814]"
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
        <h1 className="text-[1.65rem] font-bold tracking-tight text-[#1E1810] sm:text-[1.85rem]">{vm.title}</h1>
        <p className="mt-3 text-3xl font-bold tracking-tight text-[#1E1810] sm:text-[2.15rem]">{vm.priceLine}</p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A7164]">{vm.previewBadge}</p>
        <p className="mt-1 text-xs text-[#7A7164]/90">{vm.postedLine}</p>
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

      {vm.classificationLine ? (
        <p className="text-sm font-medium leading-snug text-[#5C5346]">{vm.classificationLine}</p>
      ) : null}

      {vm.locationLine ? (
        <p className="flex items-start gap-2 text-sm font-medium text-[#3D3428]/90">
          <MapPinIcon className="mt-0.5 shrink-0 text-[#8A8070]" />
          <span>{vm.locationLine}</span>
        </p>
      ) : null}
    </div>
  );

  const mainBody = (
    <div className="flex flex-col gap-6">
      {vm.description ? (
        <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 p-5 shadow-[0_8px_28px_-10px_rgba(42,36,22,0.1)]">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2C2416]/90">{vm.description}</p>
        </div>
      ) : null}

      {vm.specRows.length > 0 ? (
        <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/90 p-5 shadow-inner">
          <dl className="space-y-3">
            {vm.specRows.map((row, idx) => (
              <div
                key={`${row.label}-${idx}`}
                className="grid grid-cols-1 gap-1 border-b border-[#E8DFD0]/60 pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,38%)_1fr] sm:gap-4"
              >
                <dt className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{row.label}</dt>
                <dd className="text-sm font-medium text-[#1E1810]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {vm.extraParagraphs.map((block) => (
        <div key={block.title} className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/70 p-5">
          <h3 className="text-sm font-bold text-[#1E1810]">{block.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#2C2416]/88">{block.body}</p>
        </div>
      ))}

      <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/80 p-5">
        <h3 className="text-sm font-bold text-[#1E1810]">{vm.deliveryHeading}</h3>
        {vm.deliveryLines.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-[#2C2416]/88">
            {vm.deliveryLines.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#C9B46A]/80" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#7A7164]/90">
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
          className={cx(
            "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md transition",
            "bg-[#2A2620] hover:bg-[#1a1814] active:scale-[0.99]"
          )}
        >
          <ContactIcon className="h-5 w-5 shrink-0 text-[#FAF7F2]" />
          {vm.primaryCtaLabel}
        </a>
      ) : (
        <div
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-[#2A2620]/35 px-4 py-3.5 text-sm font-bold text-[#FAF7F2]/90"
          aria-disabled
        >
          <ContactIcon className="h-5 w-5 shrink-0 text-[#FAF7F2]/90" />
          {vm.primaryCtaLabel}
        </div>
      )}
      <p className="mt-3 text-center text-[11px] leading-relaxed text-[#7A7164]/95">{vm.trustNote}</p>
    </div>
  );

  const seller = (
    <EnVentaPreviewSellerCard
      initials={vm.sellerInitials}
      name={vm.sellerName}
      subline={vm.sellerSubline}
      sellerKindLabel={vm.sellerKindLabel}
      viewProfileLabel={vm.viewProfileLabel}
    />
  );

  return shell(
    <main className="relative text-[#2C2416]">
      <header className="border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/75 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link
            href={editHubHref}
            className="text-sm font-semibold text-[#3D3428] transition hover:text-[#1E1810] hover:underline"
          >
            {tTop.back}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={publishing}
              onClick={() => void onPublish()}
              className={cx(
                "rounded-2xl px-5 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md transition disabled:cursor-not-allowed disabled:opacity-50",
                "bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A]",
                "shadow-[0_8px_28px_-4px_rgba(201,164,74,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
                "hover:brightness-[1.03] active:scale-[0.99]"
              )}
            >
              {publishing
                ? lang === "es"
                  ? "Publicando…"
                  : "Publishing…"
                : lang === "es"
                  ? "Publicar"
                  : "Publish"}
            </button>
            <div className="hidden items-center gap-5 text-[11px] font-semibold uppercase tracking-wide text-[#7A7164] sm:flex">
              <span className="cursor-default opacity-80">{tTop.share}</span>
              <span className="cursor-default opacity-80">{tTop.save}</span>
              <span className="cursor-default opacity-80">{tTop.report}</span>
            </div>
          </div>
        </div>
        {publishErr ? (
          <div className="mx-auto max-w-6xl px-4 pb-3 text-sm text-red-700 sm:px-6">{publishErr}</div>
        ) : null}
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/*
          Mobile: gallery → title/meta → seller + CTA → details
          Desktop: gallery spans 2 rows (5) | title row1 + details row2 (4) | seller+CTA spans 2 rows (3)
        */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-8">
          <div className="order-1 lg:col-span-5 lg:row-span-2 lg:row-start-1">
            <EnVentaPreviewGallery
              orderedImages={vm.gallery.orderedImages}
              videoUrl={vm.gallery.videoUrl}
              showVideo={vm.gallery.showVideo}
              lang={lang}
              plan={plan}
            />
          </div>

          <div className="order-2 lg:col-span-4 lg:col-start-6 lg:row-start-1">{mainTop}</div>

          <div className="order-3 lg:col-span-3 lg:col-start-10 lg:row-span-2 lg:row-start-1">
            <div className="flex flex-col gap-4 lg:sticky lg:top-24">
              {seller}
              {mainCta}
            </div>
          </div>

          <div className="order-4 lg:col-span-4 lg:col-start-6 lg:row-start-2">{mainBody}</div>
        </div>
      </div>
    </main>
  );
}
