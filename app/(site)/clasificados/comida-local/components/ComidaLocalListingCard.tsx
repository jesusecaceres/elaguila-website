"use client";

import Link from "next/link";
import type { ComidaLocalPublicListingCardVm } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import { trackComidaLocalListingEvent } from "@/app/lib/clasificados/comida-local/comidaLocalAnalytics";

const CHIP =
  "inline-flex rounded-md border border-[#D4C4A8] bg-[#FDF8F0] px-2 py-0.5 text-[11px] font-medium text-[#1E1814]/85";

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
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#D4C4A8]/85 bg-[#FFFCF7] shadow-sm">
      <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-[#FDF8F0] to-[#FFFCF7]">
        {card.mainImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.mainImageSrc}
            alt={card.mainImageAlt}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center px-4 text-center text-xs text-[#1E1814]/45"
            aria-hidden
          >
            Sin foto
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-[#1E1814]">{card.businessName}</h2>
          <p className="mt-1 text-xs font-medium text-[#7A1E2C]">{card.foodTypeLabel}</p>
          {card.locationLine ? (
            <p className="mt-1 truncate text-xs text-[#1E1814]/65">{card.locationLine}</p>
          ) : null}
        </div>

        {card.excerpt ? (
          <p className="line-clamp-2 text-sm leading-snug text-[#1E1814]/80">{card.excerpt}</p>
        ) : null}

        {card.chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {card.chips.map((c) => (
              <span key={c.key} className={CHIP}>
                {c.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Link
            href={card.detailHref}
            onClick={() => trackCardEvent("result_card_click")}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFCF7] hover:bg-[#6a1a26] sm:flex-none"
          >
            Ver ficha
          </Link>
          {card.telHref ? (
            <a
              href={card.telHref}
              onClick={() => trackCardEvent("call_click")}
              className="inline-flex rounded-xl border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-semibold text-[#1E1814] hover:border-[#7A1E2C]/35"
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
              className="inline-flex rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/15"
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
