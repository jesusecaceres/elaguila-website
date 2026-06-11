"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import { MAGAZINE_JUNE_2026_QR_IMAGE_PATH } from "@/app/lib/magazine/qrBridge";
import { getQrGuideCopy } from "@/app/lib/magazine/qrGuideCopy";
import {
  deviceStepsHash,
  leonixGoogleTranslateWebsiteUrl,
  magazinePrintGuideHref,
  translatorGatewayHref,
} from "@/app/lib/magazine/qrRouteHelpers";
import type { SupportedLang } from "@/app/lib/language";

const btnPrimary =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem] sm:w-auto sm:px-6";
const btnOutline =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/80 bg-[#FFFDF7] px-5 py-3 text-center text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:min-h-[3.125rem] sm:w-auto sm:px-6";

function DecisionCard({
  title,
  children,
  id,
  className,
}: {
  title: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <article
      id={id}
      className={`min-w-0 scroll-mt-28 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 sm:p-5 ${className ?? ""}`}
    >
      <h3 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{children}</div>
    </article>
  );
}

function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="mt-2 list-decimal space-y-2 pl-5">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}

function DeviceExpand({
  title,
  steps,
  id,
}: {
  title: string;
  steps: readonly string[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div id={id} className="min-w-0 scroll-mt-28 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[2.75rem] items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#2A4536]"
        aria-expanded={open}
      >
        {title}
        <span aria-hidden className="text-xs opacity-70">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <div className="border-t border-[#D6C7AD]/50 px-3 pb-3 pt-2">
          <StepList steps={steps} />
        </div>
      ) : null}
    </div>
  );
}

type MagazinePrintVisualGuideProps = {
  lang: SupportedLang;
  backMagazineHref: string;
  afterActions?: ReactNode;
};

/** Device/situation QR translation guide — single selected language. */
export function MagazinePrintVisualGuide({
  lang,
  backMagazineHref,
  afterActions,
}: MagazinePrintVisualGuideProps) {
  const copy = useMemo(() => getQrGuideCopy(lang), [lang]);
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const translatorHref = translatorGatewayHref(lang, {
    sourcePage: "magazine_read",
    sourceCta: "translation_options",
  });
  const websiteTranslateUrl = leonixGoogleTranslateWebsiteUrl(lang, {
    sourcePage: "magazine_read",
    sourceCta: "qr_google_translate",
    returnTo,
  });

  return (
    <div className="mt-4 min-w-0 sm:mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={backMagazineHref}
          className="inline-flex items-center text-sm font-semibold text-[#7A1E2C] hover:underline"
        >
          ← {copy.backToMagazine}
        </Link>
        <LeonixHeaderLanguageSelector variant="full" />
      </div>

      <section
        className="rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-4 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84A]/25 sm:p-6"
        aria-labelledby="print-visual-title"
      >
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
          {copy.eyebrow}
        </p>
        <h1
          id="print-visual-title"
          className="mt-3 font-serif text-xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-2xl lg:text-3xl"
        >
          {copy.heroTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-snug text-[#1F241C] sm:text-base">
          {copy.truthLine}
        </p>
        <p className="mt-3 max-w-2xl rounded-lg border border-[#C9A84A]/35 bg-[#FBF7EF] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
          {copy.trustNote}
        </p>
        <Link href={translatorHref} className={`mt-4 ${btnOutline}`}>
          {copy.translationOptionsCta}
        </Link>
      </section>

      <h2 className="mt-6 font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
        {copy.decisionPrompt}
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        {/* Mobile: on-phone first; Desktop: printed first */}
        <DecisionCard
          title={copy.cards.onPhone.title}
          className="order-1 border-2 border-[#7A1E2C]/30 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] md:order-3"
        >
          <p className="font-medium text-[#1F241C]">{copy.cards.onPhone.intro}</p>
          <StepList steps={copy.cards.onPhone.steps} />
          <div
            className="mt-4 flex min-h-[5rem] items-center justify-center rounded-lg border border-dashed border-[#C9A84A]/55 bg-[#FBF7EF] px-3 py-4 text-center text-xs leading-relaxed text-[#3D3428]/80 sm:text-sm"
            aria-hidden
          >
            {copy.cards.onPhone.screenshotPlaceholder}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#556B3E] sm:text-sm">
            {copy.cards.onPhone.htmlCompanionComing}
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-2 inline-flex min-h-[2.5rem] w-full cursor-not-allowed items-center justify-center rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-4 text-xs font-semibold text-[#3D3428]/60 sm:text-sm"
          >
            {copy.cards.onPhone.openTextVersionLabel}
          </button>
        </DecisionCard>

        <DecisionCard title={copy.cards.desktop.title} className="order-2 md:order-2">
          <StepList steps={copy.cards.desktop.steps} />
          <p className="mt-3 rounded-lg border border-[#C9A84A]/30 bg-[#FBF7EF] px-3 py-2.5 text-xs leading-relaxed sm:text-sm">
            {copy.cards.desktop.captureNote}
          </p>
          <div className="mt-4 hidden min-w-0 flex-col items-center gap-3 sm:flex sm:flex-row sm:items-start md:flex">
            <div className="shrink-0 rounded-lg border border-[#D6C7AD] bg-white p-2 shadow-sm">
              <Image
                src={MAGAZINE_JUNE_2026_QR_IMAGE_PATH}
                alt={copy.cards.desktop.qrLabel}
                width={96}
                height={96}
                className="h-20 w-20 sm:h-24 sm:w-24"
                unoptimized
              />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-sm font-semibold text-[#2A4536]">{copy.cards.desktop.qrLabel}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#3D3428]/80">{copy.cards.desktop.qrNote}</p>
            </div>
          </div>
        </DecisionCard>

        <DecisionCard title={copy.cards.printed.title} className="order-4 md:order-1">
          <StepList steps={copy.cards.printed.steps} />
          <p className="mt-3 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE] px-3 py-2.5 text-xs leading-relaxed text-[#556B3E] md:hidden sm:text-sm">
            {copy.cards.printed.announcement}
          </p>
          <p className="mt-3 hidden text-xs leading-relaxed text-[#3D3428]/85 md:block sm:text-sm">
            {copy.cards.printed.announcement}
          </p>
        </DecisionCard>

        <DecisionCard title={copy.cards.website.title} className="order-3 md:order-4">
          <p>{copy.cards.website.intro}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#3D3428]/90 sm:text-sm">{copy.cards.website.note}</p>
          <a href={websiteTranslateUrl} className={`mt-3 ${btnOutline}`}>
            {copy.cards.website.ctaLabel}
          </a>
        </DecisionCard>
      </div>

      <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
        <DeviceExpand
          id={deviceStepsHash("iphone")}
          title={copy.deviceExpand.apple.title}
          steps={copy.deviceExpand.apple.steps}
        />
        <DeviceExpand
          id={deviceStepsHash("android")}
          title={copy.deviceExpand.android.title}
          steps={copy.deviceExpand.android.steps}
        />
      </div>

      <p className="mt-4 rounded-lg border border-[#D6C7AD]/70 bg-[#FFFDF7] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428]/85 sm:text-sm">
        {copy.websiteLangNote}
      </p>

      {afterActions}
    </div>
  );
}

export function magazineGuideBackHref(lang: SupportedLang): string {
  return `/magazine?lang=${lang}`;
}

export { magazinePrintGuideHref };
