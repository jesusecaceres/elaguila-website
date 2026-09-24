"use client";

import { useCallback, useMemo, useState } from "react";

import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestAdTranslation } from "@/app/lib/translation/requestAdTranslation";
import type { AdTranslationResult, TranslatableAdFields } from "@/app/lib/translation/types";
import type { OfertaLocalPublicOfferCard } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

import { OfertasLocalesPublicOfferCard } from "./OfertasLocalesPublicOfferCard";

export function OfertasLocalesTranslatedOfferCard({
  lang,
  offer,
  surface = "ofertas",
  onSelect,
  onOpen,
}: {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferCard;
  surface?: "ofertas" | "cupones";
  onSelect?: (offer: OfertaLocalPublicOfferCard) => void;
  onOpen?: (offer: OfertaLocalPublicOfferCard) => void;
}) {
  const [translation, setTranslation] = useState<AdTranslationResult | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const title = offer.title.trim();
  const description = offer.description.trim();
  const translatableContent = useMemo<TranslatableAdFields>(
    () => ({
      title: title || undefined,
      description: description || undefined,
    }),
    [title, description],
  );

  const onTranslated = useCallback((result: AdTranslationResult) => {
    setTranslation(result);
    setShowTranslated(true);
  }, []);

  const onShowOriginal = useCallback(() => {
    setShowTranslated(false);
  }, []);

  const displayOffer: OfertaLocalPublicOfferCard =
    showTranslated && translation?.translated
      ? {
          ...offer,
          title: translation.translated.title?.trim() || offer.title,
          description: translation.translated.description?.trim() || offer.description,
        }
      : offer;

  return (
    <div className="min-w-0">
      {title || description ? (
        <div className="mb-2 flex justify-end" data-ofertas-results-translate-ad="1">
          <TranslateAdControl
            siteLocale={lang}
            originalLocale="unknown"
            category="ofertas-locales"
            listingKey={offer.leonixAdId?.trim() || offer.id}
            version="ofertas-results-card-v1"
            translatableContent={translatableContent}
            onTranslated={onTranslated}
            onShowOriginal={onShowOriginal}
            requestTranslation={requestAdTranslation}
          />
        </div>
      ) : null}
      <OfertasLocalesPublicOfferCard
        lang={lang}
        offer={displayOffer}
        surface={surface}
        onSelect={onSelect}
        onOpen={onOpen}
      />
    </div>
  );
}
