"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  JUNE_2026,
  getJune2026MonthLabel,
  getJune2026Title,
  getMagazineUi,
  resolveMagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";
import {
  getMagazineVisualAsset,
  MAGAZINE_ISSUE_IDS,
} from "@/app/lib/magazine/languageAssets";
import { MagazineFlipbookModal } from "@/app/(site)/magazine/components/MagazineFlipbookModal";
import { MagazineLanguageSelector } from "@/app/(site)/magazine/components/MagazineLanguageSelector";
import {
  MagazineReaderActionBar,
  MagazineReaderFooterNav,
} from "@/app/(site)/magazine/components/MagazineReaderActionBar";

function JuneIssueLandingContent() {
  const params = useSearchParams()!;
  const lang = resolveMagazineLang(params.get("lang"));
  const ui = getMagazineUi(lang);
  const visual = useMemo(
    () => getMagazineVisualAsset(MAGAZINE_ISSUE_IDS.june2026, lang),
    [lang],
  );
  const readHref = `/magazine/2026/june/read?lang=${lang}`;
  const hubHref = `/magazine?lang=${lang}`;
  const [flipOpen, setFlipOpen] = useState(false);
  const openFlipbook = useCallback(() => setFlipOpen(true), []);
  const closeFlipbook = useCallback(() => setFlipOpen(false), []);

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <MagazineFlipbookModal
        open={flipOpen}
        onClose={closeFlipbook}
        src={visual.flipbookUrl}
        title={getJune2026Title(lang)}
        closeLabel={ui.closeFlipbook}
      />

      <div className="relative mx-auto max-w-4xl min-w-0 px-4 pt-24 sm:px-6 lg:px-8">
        <Link
          href={hubHref}
          className="inline-flex items-center text-sm font-semibold text-[#7A1E2C] hover:underline"
        >
          ← {ui.backToMagazine}
        </Link>

        <header className="mt-6 max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">
            LEONIX MEDIA · {getJune2026MonthLabel(lang)} {JUNE_2026.year}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-4xl">
            {ui.issuePageTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {ui.issuePageIntro}
          </p>
          <p className="mt-3 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
            {ui.originalEditionNote}
          </p>
        </header>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <div className="grid min-w-0 gap-8 sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-start">
            <div className="mx-auto w-full max-w-[10rem] overflow-hidden rounded-lg border border-[#D6C7AD] bg-[#FAF6EE] p-1 sm:mx-0">
              <Image
                src={visual.coverUrl}
                alt={getJune2026Title(lang)}
                width={320}
                height={420}
                className="h-auto w-full object-contain"
                sizes="160px"
                priority
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-bold text-[#2A4536]">{getJune2026Title(lang)}</h2>
              <p className="mt-2 text-sm text-[#3D3428]/80">{ui.futureFlipbookNote}</p>
              <div className="mt-5">
                <MagazineReaderActionBar lang={lang} onOpenFlipbook={openFlipbook} layout="stack" />
              </div>
              <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={readHref}
                  className="inline-flex min-h-[2.875rem] w-full min-w-0 items-center justify-center rounded-full bg-[#2A4536] px-7 py-2.5 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#223528] sm:w-auto"
                >
                  {ui.issuePageReaderCta}
                </Link>
                <Link
                  href={hubHref}
                  className="inline-flex min-h-[2.875rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/75 bg-[#FFFDF7] px-7 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:w-auto"
                >
                  {ui.issuePageHubCta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <MagazineLanguageSelector basePath="/magazine/2026/june" />
        </section>

        <MagazineReaderFooterNav lang={lang} />
      </div>
    </main>
  );
}

export default function June2026IssuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF6EE] text-[#3D3428]" aria-busy="true" />
      }
    >
      <JuneIssueLandingContent />
    </Suspense>
  );
}
