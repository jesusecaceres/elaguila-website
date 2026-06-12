"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import {
  buildGoogleTranslateWebsitesModeUrl,
  getTranslateSitePageCopy,
  LEONIX_TRANSLATE_SITE_ORIGIN,
  resolveTranslateSiteLang,
  sanitizeTranslateReturnTo,
} from "@/app/lib/googleTranslateWebsite";

const WEBSITE_HOST = "leonixmedia.com";

function TranslateSiteContent() {
  const searchParams = useSearchParams();
  const lang = resolveTranslateSiteLang(
    searchParams?.get("lang"),
    searchParams?.get("target"),
  );
  const copy = useMemo(() => getTranslateSitePageCopy(lang), [lang]);
  const googleUrl = buildGoogleTranslateWebsitesModeUrl(lang);
  const safeReturnTo = sanitizeTranslateReturnTo(searchParams?.get("returnTo"));
  const backHref = safeReturnTo ?? `/coming-soon-v2?lang=${lang}`;
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(WEBSITE_HOST);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — selectable text remains */
    }
  }, []);

  return (
    <main lang={lang} className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-16 text-[#1F241C]">
      <div className="mx-auto max-w-lg min-w-0 px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-6 flex justify-end">
          <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/translate-site" />
        </div>

        <section className="rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-5 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84A]/25 sm:p-7">
          <h1 className="font-serif text-xl font-bold leading-tight text-[#2A4536] sm:text-2xl">
            {copy.title}
          </h1>

          <div className="mt-5 rounded-xl border border-[#C9A84A]/45 bg-[#FFFDF7] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {copy.websiteLabel}
            </p>
            <p
              className="mt-2 select-all break-all font-mono text-lg font-bold text-[#7A1E2C] sm:text-xl"
              aria-label={WEBSITE_HOST}
            >
              {WEBSITE_HOST}
            </p>
            <button
              type="button"
              onClick={onCopy}
              className="mt-3 inline-flex min-h-[2.5rem] items-center justify-center rounded-full border-2 border-[#2A4536]/35 bg-[#2A4536] px-4 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#223528]"
            >
              {copied ? copy.copiedButton : copy.copyButton}
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
            {copy.pasteInstruction}
          </p>

          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem]"
          >
            {copy.openGoogleCta}
          </a>

          <p className="mt-3 text-xs leading-relaxed text-[#3D3428]/85 sm:text-sm">
            {copy.nativeFormsWarning}
          </p>
        </section>

        <p className="mt-6 text-center">
          <Link
            href={backHref}
            className="text-sm font-semibold text-[#556B3E] underline underline-offset-2 hover:text-[#2A4536]"
          >
            {copy.backLink}
          </Link>
        </p>

        <p className="mt-3 text-center text-[0.65rem] leading-snug text-[#3D3428]/70 sm:text-xs">
          {copy.googleLangNote.replace("{origin}", LEONIX_TRANSLATE_SITE_ORIGIN)}
        </p>
      </div>
    </main>
  );
}

export default function TranslateSitePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#FAF6EE] text-[#3D3428]"
          aria-busy="true"
        />
      }
    >
      <TranslateSiteContent />
    </Suspense>
  );
}
