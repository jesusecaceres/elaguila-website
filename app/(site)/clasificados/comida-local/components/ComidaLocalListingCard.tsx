"use client";

import Link from "next/link";
import { useState } from "react";
import type { ComidaLocalPublicListingCardVm } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { trackComidaLocalListingEvent } from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import {
  CL_BTN_PRIMARY,
  CL_BTN_SECONDARY,
  CL_CARD_SURFACE,
  CL_CHIP,
  CL_IMAGE_PLACEHOLDER,
} from "./comidaLocalCustomerStyles";
import { LeonixCommunityTrustCardStrip } from "@/app/components/leonixCommunityTrust/LeonixCommunityTrustCardStrip";
import { TranslateAdControl } from "@/app/components/translation/TranslateAdControl";
import { requestComidaLocalAdTranslation } from "@/app/lib/clasificados/comida-local/comidaLocalTranslateAd";

type Props = {
  card: ComidaLocalPublicListingCardVm;
  lang?: "es" | "en";
};

export function ComidaLocalListingCard({ card, lang = "es" }: Props) {
  const [translatedExcerpt, setTranslatedExcerpt] = useState<string | null>(null);
  const listingId = card.id.trim();
  const canTrack = Boolean(listingId);
  const listingKey = card.leonixAdId ?? card.slug ?? card.id;
  const displayExcerpt = translatedExcerpt ?? card.excerpt;

  const trackCardEvent = (eventType: "result_card_click" | "call_click" | "whatsapp_click") => {
    if (!canTrack) return;
    trackComidaLocalListingEvent({
      listingId,
      leonixAdId: card.leonixAdId,
      eventType,
      source: "results_card",
      metadata: card.slug ? { slug: card.slug } : undefined,
    });
  };

  return (
    <article className={`${CL_CARD_SURFACE} flex min-w-0 flex-col overflow-hidden`}>
      <Link
        href={card.detailHref}
        onClick={() => trackCardEvent("result_card_click")}
        className="relative block aspect-[4/3] w-full overflow-hidden border-b border-[#D4C4A8]/50 bg-[#FDF8F0]"
      >
        {card.mainImageSrc ? (
          <img
            src={card.mainImageSrc}
            alt={card.mainImageAlt}
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={CL_IMAGE_PLACEHOLDER} aria-hidden>
            {lang === "en" ? "No main photo" : "Sin foto principal"}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h2 className="truncate text-[15px] font-bold leading-snug text-[#1E1814]">
              {card.businessName}
            </h2>
            {card.excerpt.trim() ? (
              <TranslateAdControl
                siteLocale={lang}
                originalLocale="unknown"
                category="comida-local"
                listingKey={listingKey}
                version="comida-local-card-v1"
                translatableContent={{ description: card.excerpt }}
                onTranslated={(result) =>
                  setTranslatedExcerpt(result.translated.description?.trim() || card.excerpt)
                }
                onShowOriginal={() => setTranslatedExcerpt(null)}
                requestTranslation={requestComidaLocalAdTranslation}
                className="shrink-0"
              />
            ) : null}
          </div>
          <p className="mt-0.5 text-xs font-medium text-[#7A1E2C]">{card.foodTypeLabel}</p>
          {card.locationLine ? (
            <p className="mt-0.5 truncate text-xs text-[#1E1814]/62">{card.locationLine}</p>
          ) : null}
        </div>

        {displayExcerpt ? (
          <p className="line-clamp-2 text-[13px] leading-snug text-[#1E1814]/78">{displayExcerpt}</p>
        ) : null}

        {card.chips.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {card.chips.map((c) => (
              <span key={c.key} className={CL_CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        ) : null}

        <div data-servicios-card-trust-strip="1">
          <LeonixCommunityTrustCardStrip lang={lang} count={card.publicEndorsementCount ?? 0} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Link
            href={card.detailHref}
            onClick={() => trackCardEvent("result_card_click")}
            className={`${CL_BTN_PRIMARY} min-h-[40px] flex-1 sm:flex-none`}
          >
            Ver ficha
          </Link>
          {card.telHref ? (
            <a
              href={card.telHref}
              onClick={() => trackCardEvent("call_click")}
              className={`${CL_BTN_SECONDARY} min-h-[40px]`}
            >
              Llamar
            </a>
          ) : null}
          {card.whatsappHref ? (
            <a
              href={card.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCardEvent("whatsapp_click")}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/15"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
