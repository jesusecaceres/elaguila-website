"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdvertiseDropdown } from "@/app/components/AdvertiseDropdown";
import type { AdvertiseLang } from "@/app/lib/advertiseDropdownConfig";
import {
  JUNE_2026,
  MAGAZINE_UI,
  resolveMagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";
import { MagazineLanguageSelector } from "@/app/(site)/magazine/components/MagazineLanguageSelector";
import { MagazineTranslatedReader } from "@/app/(site)/magazine/components/MagazineTranslatedReader";

function FlipbookModal({
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
    <div className="fixed inset-0 z-[100] bg-black/90">
      <div className="absolute top-0 left-0 right-0 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur sm:px-6">
        <div className="truncate text-sm font-semibold text-gray-200 md:text-base">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-[#C9A84A]/60 px-4 py-2 text-sm font-semibold text-[#C9A84A] transition hover:bg-[#C9A84A]/10"
        >
          {closeLabel}
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 top-16">
        <iframe
          src={src}
          title={title}
          className="h-full w-full border-0"
          scrolling="no"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function JuneReaderContent() {
  const params = useSearchParams()!;
  const lang = resolveMagazineLang(params.get("lang"));
  const ui = MAGAZINE_UI[lang];
  const advertiseLang: AdvertiseLang = lang === "en" ? "en" : "es";
  const [flipOpen, setFlipOpen] = useState(false);
  const openFlipbook = useCallback(() => setFlipOpen(true), []);
  const closeFlipbook = useCallback(() => setFlipOpen(false), []);

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <FlipbookModal
        open={flipOpen}
        onClose={closeFlipbook}
        src={JUNE_2026.flipbookUrl}
        title={JUNE_2026.title[lang]}
        closeLabel={ui.closeFlipbook}
      />

      <div className="relative mx-auto max-w-4xl px-4 pt-24 sm:px-6 lg:px-8">
        <Link
          href={`/magazine?lang=${lang}`}
          className="inline-flex items-center text-sm font-semibold text-[#7A1E2C] hover:underline"
        >
          ← {ui.backToMagazine}
        </Link>

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
        </header>

        <section className="mt-10 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <MagazineLanguageSelector basePath="/magazine/2026/june/read" />
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 sm:p-8">
          <h2 className="font-serif text-xl font-bold text-[#2A4536]">{ui.originalEditionTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{ui.originalEditionNote}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,10rem)_1fr] sm:items-center">
            <div className="mx-auto w-full max-w-[10rem] overflow-hidden rounded-lg border border-[#D6C7AD] bg-[#FAF6EE] p-1">
              <Image
                src={JUNE_2026.coverImage}
                alt={JUNE_2026.title[lang]}
                width={320}
                height={420}
                className="h-auto w-full object-contain"
                sizes="160px"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={openFlipbook}
                className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-7 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
              >
                {ui.viewFlipbookSpanish}
              </button>
              <a
                href={JUNE_2026.pdfUrl}
                download
                className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-7 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF]"
              >
                PDF
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <MagazineTranslatedReader lang={lang} variant="full" />
        </section>

        <section className="mt-10 rounded-2xl border border-[#2A4536]/20 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 sm:p-8">
          <AdvertiseDropdown lang={advertiseLang} variant="primary" className="mt-2" />
        </section>
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
