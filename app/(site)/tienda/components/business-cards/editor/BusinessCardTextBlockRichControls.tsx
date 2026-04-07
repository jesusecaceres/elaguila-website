"use client";

import type { Lang } from "../../../types/tienda";
import type { BusinessCardSide, BusinessCardTextBlock } from "../../../product-configurators/business-cards/types";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import { clampTextBackdropOpacity } from "../../../product-configurators/business-cards/preview/textBlockPreviewStyles";
import { businessCardTextColorToHex } from "../../../product-configurators/business-cards/textColorForPicker";
import { bcPick, businessCardBuilderCopy } from "../../../data/businessCardBuilderCopy";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:rgba(61,52,40,0.5)]">{children}</p>
  );
}

export function BusinessCardTextBlockRichControls(props: {
  lang: Lang;
  side: BusinessCardSide;
  selectedBlock: BusinessCardTextBlock;
  dispatch: (a: BusinessCardBuilderAction) => void;
}) {
  const { lang, side, selectedBlock: b, dispatch } = props;
  const patch = (p: Partial<BusinessCardTextBlock>) =>
    dispatch({ type: "SET_TEXT_BLOCK", side, id: b.id, patch: p });

  const backdropOn = (b.textBackdrop ?? "none") === "soft";
  const backdropHex = businessCardTextColorToHex(b.textBackdropColor ?? "#0c0a08");
  const backdropOp = clampTextBackdropOpacity(b.textBackdropOpacity ?? 0.55);

  return (
    <>
      <p className="mt-2 text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug">
        {lang === "en"
          ? "Typography shortcuts are in the top toolbar when this line is selected."
          : "Los atajos de tipografía están en la barra superior cuando esta línea está seleccionada."}
      </p>
      <div className="mt-4 space-y-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.textRichReadabilitySectionTitle, lang)}</SectionTitle>
        <p className="text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug">
          {bcPick(businessCardBuilderCopy.textRichReadabilityHelp, lang)}
        </p>
        <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-[12px] font-semibold text-[color:rgba(61,52,40,0.85)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-black/20 text-[color:var(--lx-gold)]"
            checked={backdropOn}
            onChange={(e) =>
              patch({
                textBackdrop: e.target.checked ? "soft" : "none",
                textBackdropOpacity: e.target.checked ? b.textBackdropOpacity ?? 0.55 : undefined,
              })
            }
          />
          {bcPick(businessCardBuilderCopy.textRichBackdropSoft, lang)}
        </label>
        {backdropOn ? (
          <div className="space-y-2 pl-1">
            <label className="block text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.5)]">
              {bcPick(businessCardBuilderCopy.textRichBackdropColor, lang)}
              <input
                type="color"
                className="mt-1 h-9 w-full max-w-[6rem] cursor-pointer rounded-lg border border-black/10"
                value={backdropHex}
                onChange={(e) => patch({ textBackdropColor: e.target.value })}
              />
            </label>
            <label className="block text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
              {bcPick(businessCardBuilderCopy.textRichBackdropOpacity, lang)}
              <input
                type="range"
                min={0}
                max={100}
                className="mt-1 w-full accent-[#c9a84a]"
                value={Math.round(backdropOp * 100)}
                onChange={(e) =>
                  patch({ textBackdropOpacity: clampTextBackdropOpacity(Number(e.target.value) / 100) })
                }
              />
            </label>
          </div>
        ) : null}
        <div>
          <p className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            {bcPick(businessCardBuilderCopy.textRichShadowTitle, lang)}
          </p>
          <div className="mt-1 flex gap-1">
            {(["none", "subtle"] as const).map((s) => {
              const cur = b.textShadow ?? "none";
              const on = s === cur;
              return (
              <button
                key={s}
                type="button"
                onClick={() => patch({ textShadow: s === "none" ? undefined : "subtle" })}
                className={[
                  "flex-1 rounded-lg py-1.5 text-[10px] font-bold border touch-manipulation",
                  on ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)]" : "border-black/10 bg-white",
                ].join(" ")}
              >
                {s === "none"
                  ? bcPick(businessCardBuilderCopy.textRichShadowNone, lang)
                  : bcPick(businessCardBuilderCopy.textRichShadowSubtle, lang)}
              </button>
            );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
