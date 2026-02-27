"use client";

import { useEffect, useState } from "react";

import { ClassifiedItem } from "../../data/classifieds";
import { isVerifiedSeller } from "./verifiedSeller";
import ProBadge from "./ProBadge";
import { isProListing } from "./planHelpers";
import { isListingSaved, onSavedListingsChange, toggleListingSaved } from "./savedListings";

type Lang = "es" | "en";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ListingCard({
  item,
  lang,
}: {
  item: ClassifiedItem;
  lang: Lang;
}) {
  const verified = isVerifiedSeller(item as any);
  const isPro = isProListing(item as any);

  const postedLabel = lang === "es" ? "Publicado" : "Posted";

  const [saved, setSaved] = useState<boolean>(() => isListingSaved(item.id));

  useEffect(() => {
    // Keep in sync if user saves/unsaves in another card/tab
    return onSavedListingsChange(() => setSaved(isListingSaved(item.id)));
  }, [item.id]);

  const saveText = saved ? (lang === "es" ? "Guardado" : "Saved") : (lang === "es" ? "Guardar" : "Save");


  return (
    <div
      className={cx(
        "relative rounded-2xl border",
        // Warmer, premium card tone (no harsh white panels)
        "border-yellow-500/45 bg-white/8",
        "p-4 sm:p-5",
        "shadow-sm transition",
        "hover:-translate-y-[1px] hover:bg-white/10 hover:border-yellow-500/45"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSaved(toggleListingSaved(item.id));
        }}
        className={cx(
          "absolute right-3 top-3 z-10 rounded-full border px-3 py-1 text-xs font-semibold transition",
          "border-white/10 bg-white/12 text-white hover:bg-white/16"
        )}
        aria-label={saveText}
        title={saveText}
      >
        {saved ? "★" : "☆"} {saveText}
      </button>

      <h3 className="mb-1 text-base sm:text-lg font-semibold text-white leading-snug">
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

      <p className="mb-2 text-sm text-white line-clamp-2">
        {item.description}
      </p>

      <span className="text-[11px] sm:text-xs text-white">{`${postedLabel}: ${item.createdAt}`}</span>
    </div>
  );
}
