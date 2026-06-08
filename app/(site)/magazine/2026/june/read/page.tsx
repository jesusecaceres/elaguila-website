"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdvertiseDropdown } from "@/app/components/AdvertiseDropdown";
import type { AdvertiseLang } from "@/app/lib/advertiseDropdownConfig";
import {
  JUNE_2026,
  MAGAZINE_UI,
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
import { MagazineTranslatedReader } from "@/app/(site)/magazine/components/MagazineTranslatedReader";

function JuneReaderContent() {
  const params = useSearchParams()!;
  const lang = resolveMagazineLang(params.get("lang"));
  const ui = MAGAZINE_UI[lang];
  const visual = useMemo(
    () => getMagazineVisualAsset(MAGAZINE_ISSUE_IDS.june2026, lang),
    [lang],
  );
  const advertiseLang: AdvertiseLang = lang === "en" ? "en" : "es";
  const issueHref = `/magazine/2026/june?lang=${lang}`;
  const [flipOpen, setFlipOpen] = useState(false);
  const openFlipbook = useCallback(() => setFlipOpen(true), []);
  const closeFlipbook = useCallback(() => setFlipOpen(false), []);

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <MagazineFlipbookModal
        open={flipOpen}
        onClose={closeFlipbook}
        src={visual.flipbookUrl}
        title={JUNE_2026.title[lang]}
        closeLabel={ui.closeFlipbook}
      />

      <div className="relative mx-auto max-w-4xl min-w-0 px-4 pt-24 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href={`/magazine?lang=${lang}`}
            className="inline-flex items-center text-sm font-semibold text-[#7A1E2C] hover:underline"
          >
            ← {ui.backToMagazine}
          </Link>
          <Link
            href={issueHref}
            className="inline-flex items-center text-sm font-semibold text-[#556B3E] hover:underline"
          >
            {JUNE_2026.title[lang]}
          </Link>
        </div>

        <header className="mt-6 max-w-3xl">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">
            {ui.readerPreviewBadge}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#2A4536] sm:text-4xl">
            {ui.readPageTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {ui.readPageSubtitle}
          </p>
          <p className="mt-3 rounded-lg border border-[#C9A84A]/35 bg-[#FFFDF7] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
            {ui.futureFlipbookNote}
          </p>
        </header>

        <section className="mt-10 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <MagazineLanguageSelector basePath="/magazine/2026/june/read" />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold text-[#2A4536]">{ui.originalEditionTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{ui.originalEditionNote}</p>
          <div className="mt-6 grid min-w-0 gap-6 sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-start">
            <div className="mx-auto w-full max-w-[10rem] overflow-hidden rounded-lg border border-[#D6C7AD] bg-[#FAF6EE] p-1 sm:mx-0">
              <Image
                src={visual.coverUrl}
                alt={JUNE_2026.title[lang]}
                width={320}
                height={420}
                className="h-auto w-full object-contain"
                sizes="160px"
              />
            </div>
            <MagazineReaderActionBar lang={lang} onOpenFlipbook={openFlipbook} />
          </div>
        </section>

        <section className="mt-8 min-w-0">
          <MagazineTranslatedReader lang={lang} variant="full" />
        </section>

        <section className="mt-10 rounded-2xl border border-[#2A4536]/20 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 sm:p-8">
          <AdvertiseDropdown lang={advertiseLang} variant="primary" className="mt-2" />
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
