"use client";

import type { Lang } from "../../types/tienda";
import type { BusinessCardDocument, BusinessCardSide } from "../../product-configurators/business-cards/types";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";

export function BusinessCardSideTabs(props: {
  doc: BusinessCardDocument;
  lang: Lang;
  active: BusinessCardSide;
  onChange: (s: BusinessCardSide) => void;
}) {
  const { doc, lang, active, onChange } = props;
  const two = doc.sidedness === "two-sided";

  return (
    <div
      className="flex rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.35)] p-1 w-fit shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      role="tablist"
      aria-label={lang === "en" ? "Card side" : "Cara de la tarjeta"}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === "front"}
        onClick={() => onChange("front")}
        className={[
          "min-h-[48px] min-w-[5.5rem] px-5 py-2.5 rounded-full text-sm font-semibold transition touch-manipulation",
          active === "front"
            ? "bg-[rgba(201,168,74,0.28)] text-[rgba(255,247,226,0.98)] shadow-[0_4px_20px_rgba(201,168,74,0.18)]"
            : "text-[rgba(255,255,255,0.62)] hover:text-white active:scale-[0.98]",
        ].join(" ")}
      >
        {bcPick(businessCardBuilderCopy.sideFront, lang)}
      </button>
      {two ? (
        <button
          type="button"
          role="tab"
          aria-selected={active === "back"}
          onClick={() => onChange("back")}
          className={[
            "min-h-[48px] min-w-[5.5rem] px-5 py-2.5 rounded-full text-sm font-semibold transition touch-manipulation",
            active === "back"
              ? "bg-[rgba(201,168,74,0.28)] text-[rgba(255,247,226,0.98)] shadow-[0_4px_20px_rgba(201,168,74,0.18)]"
              : "text-[rgba(255,255,255,0.62)] hover:text-white active:scale-[0.98]",
          ].join(" ")}
        >
          {bcPick(businessCardBuilderCopy.sideBack, lang)}
        </button>
      ) : null}
    </div>
  );
}
