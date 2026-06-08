"use client";

import Link from "next/link";
import type { ComidaLocalPublicListingCardVm } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { trackComidaLocalListingEvent } from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";
import {
  CL_BTN_PRIMARY,
  CL_BTN_SECONDARY,
  CL_CARD_SURFACE,
  CL_CHIP,
  CL_IMAGE_PLACEHOLDER,
} from "./comidaLocalCustomerStyles";

type Props = {
  card: ComidaLocalPublicListingCardVm;
};

export function ComidaLocalListingCard({ card }: Props) {
  const listingId = card.id.trim();
  const canTrack = Boolean(listingId);

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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.mainImageSrc}
            alt={card.mainImageAlt}
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={CL_IMAGE_PLACEHOLDER} aria-hidden>
            Sin foto principal
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-bold leading-snug text-[#1E1814]">
            {card.businessName}
          </h2>
          <p className="mt-0.5 text-xs font-medium text-[#7A1E2C]">{card.foodTypeLabel}</p>
          {card.locationLine ? (
            <p className="mt-0.5 truncate text-xs text-[#1E1814]/62">{card.locationLine}</p>
          ) : null}
        </div>

        {card.excerpt ? (
          <p className="line-clamp-2 text-[13px] leading-snug text-[#1E1814]/78">{card.excerpt}</p>
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
