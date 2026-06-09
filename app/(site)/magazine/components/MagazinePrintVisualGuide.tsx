"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  MAGAZINE_JUNE_2026_QR_IMAGE_PATH,
} from "@/app/lib/magazine/qrBridge";
import {
  PRINT_ALREADY_ON_PHONE,
  PRINT_APP_LAUNCHERS,
  PRINT_DESKTOP_HELPER,
  PRINT_DEVICE_STEPS,
  PRINT_FORMAT_GUIDE,
  PRINT_HERO,
  PRINT_QUICK_HELP,
  PRINT_VISUAL_STEPS,
} from "@/app/lib/magazine/printVisualInstructions";
import { MagazineTranslatorOpenBlock } from "@/app/(site)/magazine/components/MagazineTranslatorOpenBlock";

const btnExternal =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:min-h-[3.125rem] sm:flex-1 sm:px-5";
const btnScroll =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:min-h-[3.125rem] sm:flex-1 sm:px-5";

function BilingualBlock({
  headingEn,
  headingEs,
  stepsEn,
  stepsEs,
  id,
  highlight,
}: {
  headingEn: string;
  headingEs: string;
  stepsEn: readonly string[];
  stepsEs: readonly string[];
  id?: string;
  highlight?: boolean;
}) {
  return (
    <div
      id={id}
      className={`min-w-0 scroll-mt-28 rounded-xl border p-4 sm:p-5 ${
        highlight
          ? "border-[#7A1E2C]/35 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] ring-1 ring-[#C9A84A]/30"
          : "border-[#D6C7AD]/70 bg-[#FFFDF7]"
      }`}
    >
      <h3 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
        {headingEn}
        <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">{headingEs}</span>
      </h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {stepsEn.map((stepEn, i) => (
          <li key={i} className="mt-2">
            <span lang="en">{stepEn}</span>
            <span className="mt-1 block text-[#3D3428]/85" lang="es">
              {stepsEs[i]}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type MagazinePrintVisualGuideProps = {
  /** Rendered after app launcher buttons (e.g. primary CTAs). */
  afterAppLaunchers?: ReactNode;
};

/** Universal QR print landing — presentation-ready camera translation guide. */
export function MagazinePrintVisualGuide({ afterAppLaunchers }: MagazinePrintVisualGuideProps) {
  return (
    <div className="mt-4 min-w-0 sm:mt-6">
      {/* Hero */}
      <section
        className="rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-4 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84A]/25 sm:p-6"
        aria-labelledby="print-visual-title"
      >
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
          <span lang="en">TRANSLATION HELP · QR</span>
          <span className="mx-1.5 text-[#C9A84A]" aria-hidden>
            ·
          </span>
          <span lang="es">AYUDA DE TRADUCCIÓN · QR</span>
        </p>

        <h1
          id="print-visual-title"
          className="mt-3 font-serif text-xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-2xl lg:text-3xl"
        >
          <span lang="en">{PRINT_HERO.title.en}</span>
          <span className="mt-1 block text-lg text-[#556B3E] sm:text-xl lg:text-2xl" lang="es">
            {PRINT_HERO.title.es}
          </span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-semibold leading-snug text-[#1F241C] sm:text-base">
          <span lang="en">{PRINT_HERO.explanation.en}</span>
          <span className="mt-2 block font-normal text-[#3D3428]" lang="es">
            {PRINT_HERO.explanation.es}
          </span>
        </p>

        <p className="mt-3 max-w-2xl rounded-lg border border-[#C9A84A]/35 bg-[#FBF7EF] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
          <span lang="en">{PRINT_HERO.trustNote.en}</span>
          <span className="mt-1 block" lang="es">
            {PRINT_HERO.trustNote.es}
          </span>
        </p>
      </section>

      <MagazineTranslatorOpenBlock />

      {/* App launchers */}
      <section
        className="mt-4 rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-4 sm:p-5"
        aria-labelledby="print-app-launchers-title"
      >
        <h2
          id="print-app-launchers-title"
          className="font-serif text-base font-bold text-[#2A4536] sm:text-lg"
        >
          {PRINT_APP_LAUNCHERS.heading.en}
          <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">
            {PRINT_APP_LAUNCHERS.heading.es}
          </span>
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
          <span lang="en">{PRINT_APP_LAUNCHERS.helper.en}</span>
          <span className="mt-1 block" lang="es">
            {PRINT_APP_LAUNCHERS.helper.es}
          </span>
        </p>
        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
          <a
            href={PRINT_APP_LAUNCHERS.googleLens.href}
            target="_blank"
            rel="noopener noreferrer"
            className={btnExternal}
          >
            {PRINT_APP_LAUNCHERS.googleLens.label.en}
            <span className="sr-only"> / {PRINT_APP_LAUNCHERS.googleLens.label.es}</span>
          </a>
          <a
            href={PRINT_APP_LAUNCHERS.googleTranslate.href}
            target="_blank"
            rel="noopener noreferrer"
            className={btnExternal}
          >
            {PRINT_APP_LAUNCHERS.googleTranslate.label.en}
            <span className="sr-only"> / {PRINT_APP_LAUNCHERS.googleTranslate.label.es}</span>
          </a>
          <a href={`#${PRINT_APP_LAUNCHERS.iphoneSteps.hash}`} className={btnScroll}>
            {PRINT_APP_LAUNCHERS.iphoneSteps.label.en}
            <span className="sr-only"> / {PRINT_APP_LAUNCHERS.iphoneSteps.label.es}</span>
          </a>
          <a href={`#${PRINT_APP_LAUNCHERS.androidSteps.hash}`} className={btnScroll}>
            {PRINT_APP_LAUNCHERS.androidSteps.label.en}
            <span className="sr-only"> / {PRINT_APP_LAUNCHERS.androidSteps.label.es}</span>
          </a>
        </div>
        <p className="mt-3 text-[0.6875rem] leading-relaxed text-[#3D3428]/75 sm:text-xs">
          <span lang="en">{PRINT_APP_LAUNCHERS.disclaimer.en}</span>
          <span className="mt-1 block" lang="es">
            {PRINT_APP_LAUNCHERS.disclaimer.es}
          </span>
        </p>
      </section>

      {afterAppLaunchers}

      {/* Already on phone — prominent */}
      <section
        className="mt-4 rounded-2xl border-2 border-[#7A1E2C]/30 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-4 shadow-sm ring-1 ring-[#C9A84A]/25 sm:p-5"
        aria-labelledby="print-already-on-phone-title"
      >
        <h2
          id="print-already-on-phone-title"
          className="font-serif text-base font-bold text-[#7A1E2C] sm:text-lg"
        >
          {PRINT_ALREADY_ON_PHONE.heading.en}
          <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">
            {PRINT_ALREADY_ON_PHONE.heading.es}
          </span>
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-[#1F241C] sm:text-[0.9375rem]">
          <span lang="en">{PRINT_ALREADY_ON_PHONE.intro.en}</span>
          <span className="mt-1 block font-normal text-[#3D3428]" lang="es">
            {PRINT_ALREADY_ON_PHONE.intro.es}
          </span>
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#3D3428]">
          {PRINT_ALREADY_ON_PHONE.steps.en.map((stepEn, i) => (
            <li key={i}>
              <span lang="en">{stepEn}</span>
              <span className="mt-0.5 block text-[#3D3428]/85" lang="es">
                {PRINT_ALREADY_ON_PHONE.steps.es[i]}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Compact visual steps */}
      <section className="mt-4 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">
          <span lang="en">Simple steps</span>
          <span className="mx-1.5" aria-hidden>
            /
          </span>
          <span lang="es">Pasos simples</span>
        </p>
        <ol className="mt-2 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {PRINT_VISUAL_STEPS.en.map((stepEn, index) => (
            <li
              key={index}
              className="flex min-w-0 items-start gap-2 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE] px-3 py-2.5"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] text-xs font-bold text-[#FFFDF7]"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 text-xs leading-snug sm:text-sm">
                <span lang="en" className="font-semibold text-[#1F241C]">
                  {stepEn}
                </span>
                <span className="mt-0.5 block text-[#3D3428]/85" lang="es">
                  {PRINT_VISUAL_STEPS.es[index]}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Desktop / another device */}
      <section className="mt-4 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 sm:p-5">
        <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
          {PRINT_DESKTOP_HELPER.heading.en}
          <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">
            {PRINT_DESKTOP_HELPER.heading.es}
          </span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">
          <span lang="en">{PRINT_DESKTOP_HELPER.copy.en}</span>
          <span className="mt-1 block" lang="es">
            {PRINT_DESKTOP_HELPER.copy.es}
          </span>
        </p>
        <div className="mt-4 flex min-w-0 flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
          <div className="shrink-0 rounded-lg border border-[#D6C7AD] bg-white p-2 shadow-sm">
            <Image
              src={MAGAZINE_JUNE_2026_QR_IMAGE_PATH}
              alt={PRINT_DESKTOP_HELPER.qrLabel.en}
              width={96}
              height={96}
              className="h-20 w-20 sm:h-24 sm:w-24"
              unoptimized
            />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-sm font-semibold text-[#2A4536]">
              {PRINT_DESKTOP_HELPER.qrLabel.en}
              <span className="mt-0.5 block text-xs font-medium text-[#556B3E]">
                {PRINT_DESKTOP_HELPER.qrLabel.es}
              </span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#3D3428]/80">
              {PRINT_DESKTOP_HELPER.qrNote.en}
              <span className="mt-1 block" lang="es">
                {PRINT_DESKTOP_HELPER.qrNote.es}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* iPhone + Android device steps */}
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <BilingualBlock
          id={PRINT_DEVICE_STEPS.iphone.id}
          headingEn={PRINT_DEVICE_STEPS.iphone.heading.en}
          headingEs={PRINT_DEVICE_STEPS.iphone.heading.es}
          stepsEn={PRINT_DEVICE_STEPS.iphone.steps.en}
          stepsEs={PRINT_DEVICE_STEPS.iphone.steps.es}
        />
        <BilingualBlock
          id={PRINT_DEVICE_STEPS.android.id}
          headingEn={PRINT_DEVICE_STEPS.android.heading.en}
          headingEs={PRINT_DEVICE_STEPS.android.heading.es}
          stepsEn={PRINT_DEVICE_STEPS.android.steps.en}
          stepsEs={PRINT_DEVICE_STEPS.android.steps.es}
        />
      </div>

      {/* Printed + digital */}
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <BilingualBlock
          headingEn={PRINT_FORMAT_GUIDE.printed.heading.en}
          headingEs={PRINT_FORMAT_GUIDE.printed.heading.es}
          stepsEn={PRINT_FORMAT_GUIDE.printed.steps.en}
          stepsEs={PRINT_FORMAT_GUIDE.printed.steps.es}
        />
        <div className="min-w-0">
          <BilingualBlock
            headingEn={PRINT_FORMAT_GUIDE.digital.heading.en}
            headingEs={PRINT_FORMAT_GUIDE.digital.heading.es}
            stepsEn={PRINT_FORMAT_GUIDE.digital.steps.en}
            stepsEs={PRINT_FORMAT_GUIDE.digital.steps.es}
          />
          <p className="mt-2 rounded-lg border border-[#C9A84A]/35 bg-[#FBF7EF] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
            <span lang="en">{PRINT_FORMAT_GUIDE.digital.browserNote.en}</span>
            <span className="mt-1 block" lang="es">
              {PRINT_FORMAT_GUIDE.digital.browserNote.es}
            </span>
          </p>
        </div>
      </div>

      {/* Multilingual quick help */}
      <section className="mt-4 rounded-xl border border-[#C9A84A]/40 bg-[#FBF7EF] p-4 sm:p-5">
        <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
          {PRINT_QUICK_HELP.heading.en}
          <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">
            {PRINT_QUICK_HELP.heading.es}
          </span>
        </h2>
        <p className="mt-2 text-xs text-[#3D3428]/80">
          {PRINT_QUICK_HELP.disclaimer.en}
          <span className="mt-1 block" lang="es">
            {PRINT_QUICK_HELP.disclaimer.es}
          </span>
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(
            [
              ["Español", "es", PRINT_QUICK_HELP.lines.es],
              ["English", "en", PRINT_QUICK_HELP.lines.en],
              ["Tiếng Việt", "vi", PRINT_QUICK_HELP.lines.vi],
              ["Tagalog", "tl", PRINT_QUICK_HELP.lines.tl],
              ["中文", "zh", PRINT_QUICK_HELP.lines.zh],
            ] as const
          ).map(([label, lang, text]) => (
            <li
              key={lang}
              lang={lang}
              className="rounded-lg bg-[#FFFDF7] px-3 py-2.5 text-sm leading-snug text-[#3D3428] ring-1 ring-[#D6C7AD]/60"
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#556B3E]">
                {label}
              </span>
              <p className="mt-1">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
