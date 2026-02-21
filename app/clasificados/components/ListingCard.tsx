"use client";

import { ClassifiedItem } from "../../data/classifieds";
import { isVerifiedSeller } from "./verifiedSeller";
import ProBadge from "./ProBadge";
import { isProListing } from "./planHelpers";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ListingCard({ item }: { item: ClassifiedItem }) {

  const verified = isVerifiedSeller(item as any);
  const isPro = isProListing(item as any);
  return (
    <div
      className={cx(
        "rounded-2xl border",
        "border-white/12 bg-white/6",
        "p-4 sm:p-5",
        "shadow-sm transition",
        "hover:-translate-y-[1px] hover:bg-white/8"
      )}
    >
      <h3 className="mb-1 text-base sm:text-lg font-semibold text-gray-100 leading-snug">
        {item.title}
      </h3>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        
        {isPro ? <ProBadge /> : null}
{verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
            <span aria-hidden="true">✓</span>
            Verificado • Verified
          </span>
        ) : null}
      </div>
      <p className="mb-2 text-sm text-gray-300 line-clamp-2">{item.description}</p>
      <span className="text-[11px] sm:text-xs text-gray-400">{`Publicado: ${item.createdAt}`}</span>
    </div>
  );
}
