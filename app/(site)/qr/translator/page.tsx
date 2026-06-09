"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ANDROID_LENS_INTENT,
  LENS_WEB_URL,
  MAGAZINE_PRINT_HELP_PATH,
  TRANSLATE_WEB_URL,
  TRANSLATOR_GATEWAY_COPY,
  detectTranslatorDevice,
  getTranslatorAutoOpenUrl,
} from "@/app/lib/magazine/translatorGateway";

const btnExternal =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const btnGold =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-4 py-2.5 text-center text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]";
const btnPrimary =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem]";

function TranslatorGatewayContent() {
  const device = useMemo(
    () => (typeof navigator !== "undefined" ? detectTranslatorDevice(navigator.userAgent) : "desktop"),
    [],
  );
  const isDesktop = device === "desktop";
  const [showOpening, setShowOpening] = useState(!isDesktop);

  useEffect(() => {
    if (isDesktop) return;

    const autoUrl = getTranslatorAutoOpenUrl(device);
    if (!autoUrl) return;

    const timer = window.setTimeout(() => setShowOpening(false), 3500);

    try {
      window.location.assign(autoUrl);
    } catch {
      setShowOpening(false);
    }

    return () => window.clearTimeout(timer);
  }, [device, isDesktop]);

  const iphoneStepsHref = `${MAGAZINE_PRINT_HELP_PATH}#iphone-translation-steps`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <div className="relative mx-auto max-w-lg min-w-0 px-4 pt-24 sm:px-6">
        <section
          className="rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-5 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84C]/25 sm:p-7"
          aria-labelledby="translator-gateway-title"
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
            <span lang="en">LEONIX · TRANSLATOR</span>
            <span className="mx-1.5 text-[#C9A84A]" aria-hidden>
              ·
            </span>
            <span lang="es">LEONIX · TRADUCTOR</span>
          </p>

          <h1
            id="translator-gateway-title"
            className="mt-3 font-serif text-xl font-bold leading-tight text-[#2A4536] sm:text-2xl"
          >
            {TRANSLATOR_GATEWAY_COPY.title.en}
            <span className="mt-1 block text-lg text-[#556B3E]" lang="es">
              {TRANSLATOR_GATEWAY_COPY.title.es}
            </span>
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            <span lang="en">{TRANSLATOR_GATEWAY_COPY.subtitle.en}</span>
            <span className="mt-1 block" lang="es">
              {TRANSLATOR_GATEWAY_COPY.subtitle.es}
            </span>
          </p>

          {isDesktop ? (
            <p className="mt-4 rounded-lg border border-[#C9A84A]/40 bg-[#FBF7EF] px-3 py-3 text-sm font-semibold leading-relaxed text-[#2A4536]">
              <span lang="en">{TRANSLATOR_GATEWAY_COPY.desktopMessage.en}</span>
              <span className="mt-1 block font-normal text-[#3D3428]" lang="es">
                {TRANSLATOR_GATEWAY_COPY.desktopMessage.es}
              </span>
            </p>
          ) : showOpening ? (
            <p
              className="mt-4 rounded-lg border border-[#7A1E2C]/25 bg-[#FFFDF7] px-3 py-3 text-sm font-semibold text-[#7A1E2C]"
              role="status"
              aria-live="polite"
            >
              {TRANSLATOR_GATEWAY_COPY.opening.en}
              <span className="mt-0.5 block text-[#556B3E]" lang="es">
                {TRANSLATOR_GATEWAY_COPY.opening.es}
              </span>
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-[#3D3428]/85 sm:text-sm">
            <span lang="en">{TRANSLATOR_GATEWAY_COPY.honestNote.en}</span>
            <span className="mt-1 block" lang="es">
              {TRANSLATOR_GATEWAY_COPY.honestNote.es}
            </span>
          </p>

          <div className="mt-5 grid min-w-0 gap-2.5">
            {device === "android" ? (
              <a href={ANDROID_LENS_INTENT} className={btnExternal}>
                {TRANSLATOR_GATEWAY_COPY.googleLens.en}
                <span className="sr-only"> / {TRANSLATOR_GATEWAY_COPY.googleLens.es}</span>
              </a>
            ) : (
              <a
                href={LENS_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={btnExternal}
              >
                {TRANSLATOR_GATEWAY_COPY.googleLens.en}
                <span className="sr-only"> / {TRANSLATOR_GATEWAY_COPY.googleLens.es}</span>
              </a>
            )}
            <a
              href={TRANSLATE_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={btnExternal}
            >
              {TRANSLATOR_GATEWAY_COPY.googleTranslate.en}
              <span className="sr-only"> / {TRANSLATOR_GATEWAY_COPY.googleTranslate.es}</span>
            </a>
            <a href={iphoneStepsHref} className={btnGold}>
              {TRANSLATOR_GATEWAY_COPY.iphoneSteps.en}
              <span className="sr-only"> / {TRANSLATOR_GATEWAY_COPY.iphoneSteps.es}</span>
            </a>
            <Link href={MAGAZINE_PRINT_HELP_PATH} className={btnPrimary}>
              {TRANSLATOR_GATEWAY_COPY.backToGuide.en}
              <span className="sr-only"> / {TRANSLATOR_GATEWAY_COPY.backToGuide.es}</span>
            </Link>
          </div>
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
