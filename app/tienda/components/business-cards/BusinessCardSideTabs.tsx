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
    <div className="flex rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.25)] p-1 w-fit">
      <button
        type="button"
        onClick={() => onChange("front")}
        className={[
          "px-4 py-2 rounded-full text-sm font-semibold transition",
          active === "front"
            ? "bg-[rgba(201,168,74,0.22)] text-[rgba(255,247,226,0.95)]"
            : "text-[rgba(255,255,255,0.65)] hover:text-white",
        ].join(" ")}
      >
        {bcPick(businessCardBuilderCopy.sideFront, lang)}
      </button>
      {two ? (
        <button
          type="button"
          onClick={() => onChange("back")}
          className={[
            "px-4 py-2 rounded-full text-sm font-semibold transition",
            active === "back"
              ? "bg-[rgba(201,168,74,0.22)] text-[rgba(255,247,226,0.95)]"
              : "text-[rgba(255,255,255,0.65)] hover:text-white",
          ].join(" ")}
        >
          {bcPick(businessCardBuilderCopy.sideBack, lang)}
        </button>
      ) : null}
    </div>
  );
}
