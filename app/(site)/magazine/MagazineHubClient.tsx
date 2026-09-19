"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  magazineEditionMonthLabel,
  magazineEditionTitle,
  resolveCurrentMagazineEdition,
  type MagazineEdition,
} from "@/app/lib/magazine/currentEdition";
import { getMagazineHubPageCopy, type MagazineHubPageCopy } from "@/app/lib/magazine/magazineHubPageCopy";
import { resolveEditionActions, resolveMagazineArchive, magazineEditionKey } from "@/app/lib/magazine/magazineHubModel";
import type { PublicMagazineManifest } from "@/app/lib/magazine/magazineManifestTypes";
import type { MagazineSponsor } from "@/app/lib/magazine/magazineSponsors";
import { magazineJune2026ReaderHref } from "@/app/lib/magazine/qrBridge";
import { resolveMagazineLang, type MagazineLang } from "@/app/(site)/magazine/2026/june/issueContent";
import { MagazineCover } from "@/app/(site)/magazine/components/MagazineCover";

/**
 * /magazine — the compact Revista hub. Three sections and nothing else:
 *   1. the current magazine  2. its sponsors  3. previous editions
 * The full reader, its translation tools and the issue pages live on their own routes; this page only
 * points at them. Current edition and archive are both derived from the ONE public manifest.
 */

const PRIMARY_BTN =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[#7A1E2C] px-7 text-base font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2";
const SECONDARY_BTN =
  "inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-6 text-base font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2";
const TEXT_LINK =
  "inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-[0.25em] hover:text-[#5e1721] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]";
const EYEBROW = "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]";

function FullscreenFlipbookModal({
  open,
  onClose,
  src,
  title,
  closeLabel,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  closeLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute left-0 right-0 top-0 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur sm:px-6">
        <div className="truncate text-sm font-semibold text-gray-200 md:text-base">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 shrink-0 rounded-full border border-[#C9A84A]/60 px-4 text-sm font-semibold text-[#C9A84A] transition hover:bg-[#C9A84A]/10"
        >
          {closeLabel}
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 top-16">
        <iframe src={src} title={title} className="h-full w-full border-0" scrolling="no" allow="fullscreen" allowFullScreen />
      </div>
    </div>
  );
}

function SponsorsSection({ sponsors, copy, mediaKitHref }: { sponsors: MagazineSponsor[]; copy: MagazineHubPageCopy; mediaKitHref: string }) {
  return (
    <section aria-labelledby="magazine-sponsors-title" className="rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="magazine-sponsors-title" className="font-serif text-lg font-bold leading-snug text-[#2A4536] sm:text-xl">
            {copy.sponsorsTitle}
          </h2>
          {sponsors.length === 0 ? <p className="mt-1 text-sm text-[#3D3428]">{copy.sponsorsEmpty}</p> : null}
        </div>
        {sponsors.length === 0 ? (
          <Link href={mediaKitHref} className={`${TEXT_LINK} shrink-0`}>
            {copy.sponsorsCta} →
          </Link>
        ) : null}
      </div>
      {sponsors.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sponsors.map((s) => {
            const body = s.logoUrl ? (
              <img src={s.logoUrl} alt={s.name} loading="lazy" className="h-14 w-full object-contain" />
            ) : (
              <span className="text-center text-sm font-semibold text-[#2A4536]">{s.name}</span>
            );
            return (
              <li key={s.id} className="flex min-h-20 items-center justify-center rounded-xl border border-[#E8DFD0] bg-white p-3">
                {s.href ? (
                  <a href={s.href} target="_blank" rel="sponsored noopener noreferrer" className="flex w-full items-center justify-center" aria-label={s.name}>
                    {body}
                  </a>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function MagazineHubPageContent({ manifest, sponsors }: { manifest: PublicMagazineManifest | null; sponsors: MagazineSponsor[] }) {
  const params = useSearchParams();
  const lang: MagazineLang = resolveMagazineLang(params?.get("lang"));
  const t = getMagazineHubPageCopy(lang);

  const current = useMemo(() => resolveCurrentMagazineEdition(manifest), [manifest]);
  const archive = useMemo(() => resolveMagazineArchive(manifest, current), [manifest, current]);
  const actions = useMemo(() => resolveEditionActions(current, lang), [current, lang]);

  const [flipSrc, setFlipSrc] = useState<string | null>(null);
  const openFlipbook = useCallback((url: string) => setFlipSrc(url), []);
  const closeFlipbook = useCallback(() => setFlipSrc(null), []);

  const monthYear = (e: MagazineEdition) => `${magazineEditionMonthLabel(e, lang)} ${e.year}`;
  const translateHref = magazineJune2026ReaderHref(lang, { source: "print" });
  const mediaKitHref = `/media-kit?lang=${lang}`;

  return (
    <main lang={lang} className="min-h-screen overflow-x-clip bg-[#FAF6EE] pb-16 text-[#1F241C]">
      <FullscreenFlipbookModal open={flipSrc !== null} onClose={closeFlipbook} src={flipSrc ?? ""} title={t.flipModalTitle} closeLabel={t.closeFlipbook} />

      <div className="mx-auto max-w-5xl px-4 pt-24 sm:px-6 lg:px-8">
        {/* 1 — CURRENT MAGAZINE */}
        <section aria-labelledby="magazine-hero-title" data-magazine-section="current">
          <p className={EYEBROW}>{t.eyebrow}</p>
          <h1 id="magazine-hero-title" className="mt-2 font-serif text-4xl font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-snug text-[#3D3428] sm:text-lg">{t.subtitle}</p>

          <div className="mt-6 grid gap-6 overflow-hidden rounded-3xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_20px_48px_-22px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15 sm:p-8 lg:grid-cols-[minmax(0,21rem)_1fr] lg:items-center lg:gap-12">
            <div className="mx-auto w-full max-w-[20rem] sm:max-w-[19rem] lg:max-w-none">
              <div className="overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] p-1 shadow-[0_16px_40px_-18px_rgba(31,36,28,0.3)]">
                <MagazineCover
                  src={current.coverImage}
                  alt={magazineEditionTitle(current, lang)}
                  label={monthYear(current)}
                  priority
                  sizes="(max-width: 1024px) 304px, 336px"
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className={EYEBROW}>{t.currentEyebrow}</p>
              <h2 id="magazine-current-title" className="mt-1 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-4xl">
                {monthYear(current)}
              </h2>

              {actions.primary ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {actions.primary.kind === "reader" ? (
                    <Link href={actions.primary.href} className={PRIMARY_BTN}>
                      {t.readMagazine}
                    </Link>
                  ) : actions.primary.kind === "flipbook" ? (
                    <button type="button" onClick={() => openFlipbook((actions.primary as { url: string }).url)} className={PRIMARY_BTN}>
                      {t.readMagazine}
                    </button>
                  ) : (
                    <a href={actions.primary.href} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN}>
                      {t.readMagazine}
                    </a>
                  )}
                  {actions.flipbookUrl ? (
                    <button type="button" onClick={() => openFlipbook(actions.flipbookUrl as string)} className={SECONDARY_BTN}>
                      {t.viewFlipbook}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                {actions.pdfUrl ? (
                  <a href={actions.pdfUrl} download className={TEXT_LINK}>
                    {t.downloadPdf}
                  </a>
                ) : null}
                <Link href={translateHref} className={TEXT_LINK}>
                  {t.translateHelp}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2 — SPONSORS */}
        <div className="mt-8 sm:mt-10" data-magazine-section="sponsors">
          <SponsorsSection sponsors={sponsors} copy={t} mediaKitHref={mediaKitHref} />
        </div>

        {/* 3 — PREVIOUS EDITIONS (manifest-derived; hidden while nothing has been archived) */}
        {archive.length > 0 ? (
          <section aria-labelledby="magazine-archive-title" className="mt-10 sm:mt-12" data-magazine-section="archive">
            <h2 id="magazine-archive-title" className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]">
              {t.archiveTitle}
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {archive.map((edition) => {
                const a = resolveEditionActions(edition, lang);
                return (
                  <li key={magazineEditionKey(edition)} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_12px_32px_-20px_rgba(31,36,28,0.2)]" data-archive-card={magazineEditionKey(edition)}>
                    <div className="border-b border-[#D6C7AD]/70 bg-[#FAF6EE] p-2">
                      <div className="overflow-hidden rounded-md border border-[#D6C7AD] bg-white">
                        <MagazineCover src={edition.coverImage} alt={magazineEditionTitle(edition, lang)} label={monthYear(edition)} sizes="(max-width: 640px) 45vw, 240px" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="text-sm font-bold leading-snug text-[#1F241C]">{monthYear(edition)}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1">
                        {a.primary?.kind === "reader" ? (
                          <Link href={a.primary.href} className={TEXT_LINK}>
                            {t.archiveRead}
                          </Link>
                        ) : a.primary?.kind === "flipbook" ? (
                          <button type="button" onClick={() => openFlipbook((a.primary as { url: string }).url)} className={TEXT_LINK}>
                            {t.archiveRead}
                          </button>
                        ) : a.primary?.kind === "pdf" ? (
                          <a href={a.primary.href} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
                            {t.archiveRead}
                          </a>
                        ) : null}
                        {a.pdfUrl ? (
                          <a href={a.pdfUrl} download className={TEXT_LINK}>
                            {t.archivePdf}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}

/**
 * `manifest` and `sponsors` are both resolved on the server (see page.tsx). `sponsors` comes from the canonical
 * issue↔sponsor source — an empty list until one exists, which renders the truthful empty state.
 */
export default function MagazineHubPage({ manifest, sponsors }: { manifest: PublicMagazineManifest | null; sponsors: MagazineSponsor[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <MagazineHubPageContent manifest={manifest} sponsors={sponsors} />
    </Suspense>
  );
}
