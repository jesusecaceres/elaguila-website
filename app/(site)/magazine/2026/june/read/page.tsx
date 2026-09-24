"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MagazineReaderAdvertiseDropdown } from "@/app/(site)/magazine/components/MagazineReaderAdvertiseDropdown";
import {
  getMagazineUi,
  getJune2026Title,
  getJune2026MonthLabel,
} from "@/app/(site)/magazine/2026/june/issueContent";
import {
  getMagazineVisualAsset,
  MAGAZINE_ISSUE_IDS,
} from "@/app/lib/magazine/languageAssets";
import { isMagazinePrintSource } from "@/app/lib/magazine/qrBridge";
import { getQrGuideCopy } from "@/app/lib/magazine/qrGuideCopy";
import { MagazineFlipbookModal } from "@/app/(site)/magazine/components/MagazineFlipbookModal";
import { MagazineCover } from "@/app/(site)/magazine/components/MagazineCover";
import { MagazinePrintPrimaryActions } from "@/app/(site)/magazine/components/MagazinePrintPrimaryActions";
import {
  MagazinePrintVisualGuide,
  magazineGuideBackHref,
} from "@/app/(site)/magazine/components/MagazinePrintVisualGuide";
import {
  MagazineReaderFooterNav,
} from "@/app/(site)/magazine/components/MagazineReaderActionBar";
import { MagazineTranslatedReader } from "@/app/(site)/magazine/components/MagazineTranslatedReader";
import { resolveRouteLang } from "@/app/lib/language";

function JuneReaderContent() {
  const params = useSearchParams()!;
  const lang = resolveRouteLang(params.get("lang"));
  const fromPrint = isMagazinePrintSource(params.get("source"));
  const ui = getMagazineUi(lang);
  const guideCopy = useMemo(() => getQrGuideCopy(lang), [lang]);
  const visual = useMemo(
    () => getMagazineVisualAsset(MAGAZINE_ISSUE_IDS.june2026, lang),
    [lang],
  );
  const issueHref = `/magazine/2026/june?lang=${lang}`;
  const backMagazineHref = magazineGuideBackHref(lang);
  const [flipOpen, setFlipOpen] = useState(false);
  const openFlipbook = useCallback(() => setFlipOpen(true), []);
  const closeFlipbook = useCallback(() => setFlipOpen(false), []);
  // Gate 6: visually present, intentionally non-functional — the archive page.tsx does not exist yet.
  const archiveComingSoonLabel = lang === "es" ? "Ver ediciones anteriores" : "View previous editions";
  const comingSoonBadge = lang === "es" ? "Próximamente" : "Coming soon";

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
        {fromPrint ? (
          <>
            <MagazinePrintVisualGuide
              lang={lang}
              backMagazineHref={backMagazineHref}
              afterActions={
                <>
                  <MagazinePrintPrimaryActions lang={lang} onOpenFlipbook={openFlipbook} />
                  <section
                    id="leonix-quick-summary"
                    className="mt-8 scroll-mt-28 min-w-0 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 sm:p-7"
                  >
                    <h2 className="font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
                      {guideCopy.summaryTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                      {guideCopy.summaryNote}
                    </p>
                    <div className="mt-6 min-w-0">
                      <MagazineTranslatedReader lang={lang} variant="full" />
                    </div>
                  </section>
                </>
              }
            />
          </>
        ) : (
          <>
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href={backMagazineHref}
                className="inline-flex items-center text-sm font-semibold text-[#7A1E2C] hover:underline"
              >
                ← {guideCopy.backToMagazine}
              </Link>
              <Link
                href={issueHref}
                className="inline-flex items-center text-sm font-semibold text-[#556B3E] hover:underline"
              >
                {getJune2026Title(lang)}
              </Link>
            </div>

            <header className="mt-6 max-w-3xl">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">
                LEONIX MEDIA
              </p>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-4xl">
                {getJune2026Title(lang)}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {ui.readPageSubtitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  aria-disabled="true"
                  className="inline-flex min-h-[2.25rem] cursor-not-allowed items-center gap-2 rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-4 text-xs font-semibold text-[#3D3428]/60"
                >
                  {archiveComingSoonLabel}
                  <span className="rounded-full bg-[#D6C7AD]/70 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-[#3D3428]/70">
                    {comingSoonBadge}
                  </span>
                </span>
              </div>
            </header>

            <section
              id="original-edition"
              className="mt-8 scroll-mt-28 overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_20px_48px_-22px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15 sm:p-8"
            >
              <h2 className="font-serif text-xl font-bold text-[#2A4536]">{ui.originalEditionTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{ui.originalEditionNote}</p>
              <div className="mt-6 grid min-w-0 gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-center lg:grid-cols-[minmax(0,18rem)_1fr] lg:gap-10">
                <div className="mx-auto w-full max-w-[15rem] sm:max-w-none">
                  <div className="overflow-hidden rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] p-1 shadow-[0_16px_40px_-18px_rgba(31,36,28,0.3)]">
                    <MagazineCover
                      src={visual.coverUrl}
                      alt={getJune2026Title(lang)}
                      label={getJune2026MonthLabel(lang)}
                      priority
                      sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 288px"
                    />
                  </div>
                </div>
                <MagazinePrintPrimaryActions lang={lang} onOpenFlipbook={openFlipbook} />
              </div>
            </section>

            <section className="mt-8 min-w-0">
              <MagazineTranslatedReader lang={lang} variant="full" />
            </section>
          </>
        )}

        <section className="mt-10 rounded-2xl border border-[#2A4536]/20 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 sm:p-8">
          <MagazineReaderAdvertiseDropdown lang={lang} className="mt-2" />
        </section>

        <MagazineReaderFooterNav lang={lang} showReaderLink={false} />
      </div>
    </main>
  );
}

export default function June2026ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF6EE] text-[#3D3428]" aria-busy="true" />
      }
    >
      <JuneReaderContent />
    </Suspense>
  );
}
