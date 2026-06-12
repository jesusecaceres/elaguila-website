"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import {
  ANDROID_LENS_APP_INTENT,
  IOS_GOOGLE_LENS_SCHEME,
  LENS_WEB_URL,
} from "@/app/lib/magazine/translatorGateway";
import { getTranslatorPageCopy } from "@/app/lib/magazine/qrGuideCopy";
import {
  getGoogleTranslateWebsitesPasteHint,
  googleTranslateWebsitesPasteHintClass,
  leonixHomeGoogleTranslateUrl,
} from "@/app/lib/googleTranslateWebsite";
import { magazinePrintGuideHref } from "@/app/lib/magazine/qrRouteHelpers";
import { resolveRouteLang } from "@/app/lib/language";

const btnExternal =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const btnGold =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const btnPrimary =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem]";
const btnChoice =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-2xl border-2 border-[#2A4536]/25 bg-[#FFFDF7] px-4 py-3 text-center text-sm font-bold text-[#2A4536] transition hover:border-[#7A1E2C]/45 hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const sectionShell =
  "scroll-mt-28 rounded-2xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 sm:p-5";
const fallbackLinkClass =
  "text-xs font-semibold text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-2 hover:text-[#5e1721] sm:text-sm";

function IPhoneLensButton({ label }: { label: string }) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const openedAt = Date.now();
      window.location.href = IOS_GOOGLE_LENS_SCHEME;
      window.setTimeout(() => {
        if (document.visibilityState === "visible" && Date.now() - openedAt >= 1400) {
          window.open(LENS_WEB_URL, "_blank", "noopener,noreferrer");
        }
      }, 1500);
    },
    [],
  );

  return (
    <a href={IOS_GOOGLE_LENS_SCHEME} onClick={handleClick} className={btnExternal}>
      {label}
    </a>
  );
}

function DeviceSectionSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function TranslatorGatewayContent() {
  const params = useSearchParams();
  const lang = resolveRouteLang(params?.get("lang"));
  const copy = useMemo(() => getTranslatorPageCopy(lang), [lang]);
  const leonixTranslateHref = leonixHomeGoogleTranslateUrl(lang);
  const websitesPasteHint = getGoogleTranslateWebsitesPasteHint(lang);
  const guideHref = magazinePrintGuideHref(lang, {
    sourcePage: "qr_translator",
    sourceCta: "qr_guide",
  });

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <div className="relative mx-auto max-w-lg min-w-0 px-4 pt-24 sm:px-6">
        <div className="mb-4 flex justify-end">
          <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/qr/translator" />
        </div>

        <section
          className="rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-5 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84C]/25 sm:p-7"
          aria-labelledby="translator-gateway-title"
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
            {copy.eyebrow}
          </p>

          <h1
            id="translator-gateway-title"
            className="mt-3 font-serif text-xl font-bold leading-tight text-[#2A4536] sm:text-2xl"
          >
            {copy.title}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {copy.intro}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-[#3D3428]/85 sm:text-sm">
            {copy.honestNote}
          </p>

          <div className="mt-5 grid min-w-0 gap-2.5">
            <a href="#android-google-lens" className={btnChoice}>
              {copy.deviceChoiceAndroid}
            </a>
            <a href="#iphone-google-lens" className={btnChoice}>
              {copy.deviceChoiceIphone}
            </a>
            <a href="#web-google-translate" className={btnChoice}>
              {copy.deviceChoiceWeb}
            </a>
          </div>
        </section>

        <section id="android-google-lens" className={`${sectionShell} mt-5`}>
          <h2 className="font-serif text-lg font-bold text-[#2A4536]">{copy.android.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{copy.android.bestFor}</p>
          <DeviceSectionSteps steps={copy.android.steps} />
          <div className="mt-4 grid min-w-0 gap-2.5">
            <a href={ANDROID_LENS_APP_INTENT} className={btnExternal}>
              {copy.android.openLensCta}
            </a>
            <a
              href={LENS_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={fallbackLinkClass}
            >
              {copy.lensWebFallback}
            </a>
            <a
              href={leonixTranslateHref}
              target="_blank"
              rel="noopener noreferrer"
              className={btnGold}
            >
              {copy.android.translateCta}
            </a>
            <p className={googleTranslateWebsitesPasteHintClass}>{websitesPasteHint}</p>
          </div>
        </section>

        <section id="iphone-google-lens" className={`${sectionShell} mt-5`}>
          <h2 className="font-serif text-lg font-bold text-[#2A4536]">{copy.iphone.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{copy.iphone.bestFor}</p>
          <DeviceSectionSteps steps={copy.iphone.steps} />
          <div className="mt-4 grid min-w-0 gap-2.5">
            <IPhoneLensButton label={copy.iphone.openLensCta} />
            <a
              href={LENS_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={fallbackLinkClass}
            >
              {copy.lensWebFallback}
            </a>
            <a
              href={leonixTranslateHref}
              target="_blank"
              rel="noopener noreferrer"
              className={btnGold}
            >
              {copy.iphone.translateCta}
            </a>
            <p className={googleTranslateWebsitesPasteHintClass}>{websitesPasteHint}</p>
          </div>
        </section>

        <section id="web-google-translate" className={`${sectionShell} mt-5`}>
          <h2 className="font-serif text-lg font-bold text-[#2A4536]">{copy.web.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{copy.web.bestFor}</p>
          <DeviceSectionSteps steps={copy.web.steps} />
          <div className="mt-4 grid min-w-0 gap-2.5">
            <a
              href={leonixTranslateHref}
              target="_blank"
              rel="noopener noreferrer"
              className={btnPrimary}
            >
              {copy.web.translateCta}
            </a>
            <p className={googleTranslateWebsitesPasteHintClass}>{websitesPasteHint}</p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#3D3428]/85 sm:text-sm">
            {copy.nativeFormsNote}
          </p>
        </section>

        <div className="mt-5">
          <Link href={guideHref} className={btnGold}>
            {copy.fullQrGuideCta}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function TranslatorGatewayPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#FAF6EE] text-[#3D3428]"
          aria-busy="true"
        />
      }
    >
      <TranslatorGatewayContent />
    </Suspense>
  );
}
