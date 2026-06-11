"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import { LENS_WEB_URL } from "@/app/lib/magazine/translatorGateway";
import { getTranslatorPageCopy } from "@/app/lib/magazine/qrGuideCopy";
import { leonixHomeGoogleTranslateUrl } from "@/app/lib/googleTranslateWebsite";
import {
  deviceStepsHash,
  magazinePrintGuideHref,
} from "@/app/lib/magazine/qrRouteHelpers";
import { detectTranslatorDevice } from "@/app/lib/magazine/translatorGateway";
import { resolveRouteLang } from "@/app/lib/language";

const btnExternal =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const btnGold =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const btnPrimary =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem]";

function TranslatorGatewayContent() {
  const params = useSearchParams();
  const lang = resolveRouteLang(params?.get("lang"));
  const copy = useMemo(() => getTranslatorPageCopy(lang), [lang]);

  const device = useMemo(
    () => (typeof navigator !== "undefined" ? detectTranslatorDevice(navigator.userAgent) : "desktop"),
    [],
  );
  const isDesktop = device === "desktop";
  const isMobile = !isDesktop;

  const guideHref = magazinePrintGuideHref(lang, {
    sourcePage: "qr_translator",
    sourceCta: "qr_guide",
  });
  const iphoneStepsHref = `${guideHref}#${deviceStepsHash("iphone")}`;
  const leonixTranslateHref = leonixHomeGoogleTranslateUrl(lang);

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
            {copy.subtitle}
          </p>

          {isDesktop ? (
            <p className="mt-4 rounded-lg border border-[#C9A84A]/40 bg-[#FBF7EF] px-3 py-3 text-sm leading-relaxed text-[#2A4536]">
              {copy.desktopMessage}
            </p>
          ) : null}

          {isMobile ? (
            <p className="mt-4 rounded-lg border border-[#D6C7AD]/70 bg-[#FFFDF7] px-3 py-3 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
              {copy.mobileScreenshotHint}
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-[#3D3428]/85 sm:text-sm">
            {copy.honestNote}
          </p>

          <div className="mt-5 grid min-w-0 gap-2.5">
            <a href={LENS_WEB_URL} target="_blank" rel="noopener noreferrer" className={btnExternal}>
              {copy.tryGoogleLens}
            </a>
            <a
              href={leonixTranslateHref}
              target="_blank"
              rel="noopener noreferrer"
              className={btnGold}
            >
              {copy.translateWebsite}
            </a>
            <Link href={guideHref} className={btnPrimary}>
              {copy.backToGuide}
            </Link>
          </div>

          {device === "ios" ? (
            <div className="mt-5">
              <a href={iphoneStepsHref} className={btnGold}>
                Apple / iPhone steps
              </a>
            </div>
          ) : null}
        </section>
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
