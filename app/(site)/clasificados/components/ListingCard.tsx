"use client";

import { useEffect, useState } from "react";

import { ClassifiedItem } from "../../../data/classifieds";
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
        "border-[#C9B46A]/70 bg-[#F5F5F5]",
        "p-4 sm:p-5",
        "shadow-sm transition-all duration-200 ease-out",
        "hover:scale-[1.03] hover:-translate-y-[1px] hover:bg-[#EFEFEF] hover:border-[#A98C2A] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)]"
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
          "border-white/10 bg-[#EFEFEF] text-[#111111] hover:bg-black/10"
        )}
        aria-label={saveText}
        title={saveText}
      >
        {saved ? "★" : "☆"} {saveText}
      </button>

      <h3 className="mb-1 text-base sm:text-lg font-semibold text-[#111111] leading-snug">
        {item.title}
      </h3>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {isPro ? <ProBadge /> : null}

        {(() => {
          const boostUntil = (item as any)?.boostUntil as string | undefined;
          const isBoosted = boostUntil && new Date(boostUntil).getTime() > Date.now();
          if (!isBoosted) return null;
          return (
            <span className="inline-flex items-center rounded-full border border-[#A98C2A]/40 bg-[#F8F6F0] px-2.5 py-1 text-[11px] font-medium text-[#111111]">
              {lang === "es" ? "Impulso de visibilidad" : "Visibility boost"}
            </span>
          );
        })()}

        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
            <span aria-hidden="true">✓</span>
            Verificado • Verified
          </span>
        ) : null}
      </div>

      <p className="mb-2 text-sm text-[#111111] line-clamp-2">
        {item.description}
      </p>

      
      {(() => {
        const cat = (item as any)?.category as string | undefined;
        if (cat !== "empleos") return null;

        const blob = `${(item as any)?.title ?? ""} ${(item as any)?.description ?? ""}`.toLowerCase();
        const chips: string[] = [];

        const has = (re: RegExp) => re.test(blob);

        if (has(/\bfull[-\s]?time\b|tiempo\s+completo/)) chips.push(lang === "es" ? "Tiempo completo" : "Full-time");
        else if (has(/\bpart[-\s]?time\b|tiempo\s+parcial/)) chips.push(lang === "es" ? "Tiempo parcial" : "Part-time");

        if (has(/\bremote\b|remoto/)) chips.push(lang === "es" ? "Remoto" : "Remote");

        if (!chips.length) return null;

        return (
          <div className="mb-2 flex flex-wrap gap-2">
            {chips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full border border-black/10 bg-[#EFEFEF] px-3 py-1 text-[11px] text-[#2B2B2B]"
              >
                {c}
              </span>
            ))}
          </div>
        );
      })()}

      <span className="text-[11px] sm:text-xs text-[#111111]">{`${postedLabel}: ${item.createdAt}`}</span>
    </div>
  );
}
