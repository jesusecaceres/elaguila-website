"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, Locale, TranslatableAdFields } from "@/app/lib/translation/types";

/**
 * Private prospect preview Translate Ad — same shared control + `/api/translate-ad` as public
 * detail. Never auto-fires. Legal/display names stay out of the provider payload.
 */
export function ProspectPreviewTranslateAd(props: {
  category: string;
  listingId: string;
  title: string | null;
  content: Record<string, unknown> | null;
  siteLocale?: Locale;
  children: (display: { title: string | null; description: string | null }) => React.ReactNode;
}) {
  const siteLocale = props.siteLocale === "en" ? "en" : "es";
  const [showTranslated, setShowTranslated] = useState(false);
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);

  const translatableContent = useMemo((): TranslatableAdFields => {
    const content = props.content ?? {};
    const businessName = firstString(content.businessName, content.name, content.dealerName, content.company_name);
    const authoredTitle = props.title?.trim() || firstString(content.title, content.titulo);
    const description = firstString(
      content.aboutText,
      content.description,
      content.longDescription,
      content.descripcion,
      content.queVendes,
      content.blurb,
    );
    const out: TranslatableAdFields = {};
    if (authoredTitle && authoredTitle !== businessName) out.title = authoredTitle;
    if (description) out.description = description;
    const locationNote = firstString(content.locationNote);
    if (locationNote) out.locationNote = locationNote;
    return out;
  }, [props.content, props.title]);

  const displayTitle = useMemo(() => {
    if (showTranslated && translation?.translated.title) return translation.translated.title;
    return props.title;
  }, [props.title, showTranslated, translation]);

  const displayDescription = useMemo(() => {
    if (showTranslated && translation?.translated.description) return translation.translated.description;
    return firstString(
      props.content?.aboutText,
      props.content?.description,
      props.content?.longDescription,
      props.content?.descripcion,
      props.content?.queVendes,
      props.content?.blurb,
    );
  }, [props.content, showTranslated, translation]);

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);
  const onShowOriginal = useCallback(() => setShowTranslated(false), []);

  return (
    <>
      <div className="mb-3" data-prospect-preview-translate-ad="1">
        <TranslateAdControl
          siteLocale={siteLocale}
          originalLocale="unknown"
          category={props.category}
          listingKey={props.listingId}
          version="prospect-preview-t1-v1"
          translatableContent={translatableContent}
          onTranslated={onTranslated}
          onShowOriginal={onShowOriginal}
          requestTranslation={requestAdTranslation}
        />
      </div>
      {props.children({ title: displayTitle, description: displayDescription })}
    </>
  );
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
