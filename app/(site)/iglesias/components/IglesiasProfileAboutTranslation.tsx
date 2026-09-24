"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";

export function IglesiasProfileAboutTranslation({
  lang,
  listingKey,
  heading,
  text,
}: {
  lang: "es" | "en";
  listingKey: string;
  heading: string;
  text: string;
}) {
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const translatableContent = useMemo<TranslatableAdFields>(
    () => ({ description: text.trim() || undefined }),
    [text],
  );

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const displayText =
    showTranslated && translation?.translated?.description?.trim()
      ? translation.translated.description.trim()
      : text;

  if (!text.trim()) return null;

  return (
    <section
      className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-6 sm:px-7"
      aria-labelledby="iglesias-about-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="iglesias-about-title" className="font-serif text-2xl font-bold text-[#1F241C]">
          {heading}
        </h2>
        <TranslateAdControl
          siteLocale={lang}
          originalLocale="unknown"
          category="iglesias"
          listingKey={listingKey}
          version="iglesias-profile-about-v1"
          translatableContent={translatableContent}
          onTranslated={(result) => {
            onTranslated(result);
          }}
          onShowOriginal={() => setShowTranslated(false)}
          requestTranslation={requestAdTranslation}
        />
      </div>
      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-[#3D3428] sm:text-base">
        {displayText}
      </p>
    </section>
  );
}
