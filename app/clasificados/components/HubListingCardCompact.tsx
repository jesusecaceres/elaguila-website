import type { HubListing, Lang } from "../config/clasificadosHub";
import { cx } from "../lib/cx";

export function HubListingCardCompact({ item, lang }: { item: HubListing; lang: Lang }) {
  const href = `/clasificados/anuncio/${item.id}?lang=${lang}`;
  const isBusiness = item.sellerType === "business";

  return (
    <a
      href={href}
      className={cx(
        "block rounded-2xl border bg-[#F5F5F5] backdrop-blur transition hover:bg-[#F5F5F5]",
        isBusiness ? "border-yellow-500/25" : "border-black/10"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-bold text-[#111111] leading-snug line-clamp-2">
              {item.title[lang]}
            </div>
            <div className="mt-1 text-sm text-[#111111] font-semibold">
              {item.priceLabel[lang]}
            </div>
            <div className="mt-1 text-xs text-[#111111]">
              {item.city} · {item.postedAgo[lang]}
            </div>
          </div>

          <span
            className={cx(
              "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border",
              isBusiness
                ? "border-[#C9B46A]/55 text-[#111111] bg-[#111111]/10"
                : "border-black/10 text-[#111111] bg-[#F5F5F5]"
            )}
          >
            {isBusiness
              ? lang === "es"
                ? "Negocio"
                : "Business"
              : lang === "es"
                ? "Personal"
                : "Personal"}
          </span>
        </div>

        <div className="mt-3 text-sm text-[#111111] line-clamp-2">
          {item.blurb[lang]}
        </div>
      </div>
    </a>
  );
}
