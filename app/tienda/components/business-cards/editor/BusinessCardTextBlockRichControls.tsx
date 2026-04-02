"use client";

import type { Lang } from "../../../types/tienda";
import type { BusinessCardSide, BusinessCardTextBlock } from "../../../product-configurators/business-cards/types";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import {
  clampTextBackdropOpacity,
  clampTextLetterSpacingEm,
  clampTextLineHeight,
} from "../../../product-configurators/business-cards/preview/textBlockPreviewStyles";
import { businessCardTextColorToHex } from "../../../product-configurators/business-cards/textColorForPicker";
import { bcPick, businessCardBuilderCopy } from "../../../data/businessCardBuilderCopy";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:rgba(61,52,40,0.5)]">{children}</p>
  );
}

const TONE_PATCH: Record<
  "headline" | "support" | "caption",
  Pick<
    BusinessCardTextBlock,
    "fontWeight" | "lineHeight" | "letterSpacingEm" | "textTransform" | "textTone"
  >
> = {
  headline: {
    textTone: "headline",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacingEm: 0.015,
    textTransform: "none",
  },
  support: {
    textTone: "support",
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacingEm: 0,
    textTransform: "none",
  },
  caption: {
    textTone: "caption",
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacingEm: 0.04,
    textTransform: "uppercase",
  },
};

export function BusinessCardTextBlockRichControls(props: {
  lang: Lang;
  side: BusinessCardSide;
  selectedBlock: BusinessCardTextBlock;
  dispatch: (a: BusinessCardBuilderAction) => void;
}) {
  const { lang, side, selectedBlock: b, dispatch } = props;
  const patch = (p: Partial<BusinessCardTextBlock>) =>
    dispatch({ type: "SET_TEXT_BLOCK", side, id: b.id, patch: p });

  const ls = b.letterSpacingEm ?? 0;
  const lh = b.lineHeight ?? 1.2;
  const tt = b.textTransform === "uppercase" ? "uppercase" : "none";
  const backdropOn = (b.textBackdrop ?? "none") === "soft";
  const backdropHex = businessCardTextColorToHex(b.textBackdropColor ?? "#0c0a08");
  const backdropOp = clampTextBackdropOpacity(b.textBackdropOpacity ?? 0.55);
  const tone = b.textTone;

  return (
    <>
      <div className="mt-3 space-y-3 border-t border-black/[0.06] pt-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.textRichSpacingSectionTitle, lang)}</SectionTitle>
        <label className="block text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
          {bcPick(businessCardBuilderCopy.textRichLetterSpacingLabel, lang)}
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            className="mt-1 w-full accent-[#c9a84a]"
            value={Math.round(ls * 1000)}
            onChange={(e) =>
              patch({
                letterSpacingEm: clampTextLetterSpacingEm(Number(e.target.value) / 1000),
                textTone: undefined,
              })
            }
          />
          <span className="text-[10px] text-[color:rgba(61,52,40,0.45)]">
            {ls.toFixed(3)} em
          </span>
        </label>
        <label className="block text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
          {bcPick(businessCardBuilderCopy.textRichLineHeightLabel, lang)}
          <input
            type="range"
            min={100}
            max={220}
            step={1}
            className="mt-1 w-full accent-[#c9a84a]"
            value={Math.round(lh * 100)}
            onChange={(e) =>
              patch({
                lineHeight: clampTextLineHeight(Number(e.target.value) / 100),
                textTone: undefined,
              })
            }
          />
          <span className="text-[10px] text-[color:rgba(61,52,40,0.45)]">{lh.toFixed(2)}</span>
        </label>
        <div>
          <p className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            {bcPick(businessCardBuilderCopy.textRichCaseTitle, lang)}
          </p>
          <div className="mt-1 flex gap-1">
            {(["none", "uppercase"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  patch({
                    textTransform: c === "none" ? undefined : "uppercase",
                    textTone: undefined,
                  })
                }
                className={[
                  "flex-1 rounded-lg py-1.5 text-[10px] font-bold border touch-manipulation",
                  tt === (c === "none" ? "none" : "uppercase")
                    ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)]"
                    : "border-black/10 bg-white",
                ].join(" ")}
              >
                {c === "none"
                  ? bcPick(businessCardBuilderCopy.textRichCaseNormal, lang)
                  : bcPick(businessCardBuilderCopy.textRichCaseUpper, lang)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            {bcPick(businessCardBuilderCopy.textRichToneTitle, lang)}
          </p>
          <p className="mt-0.5 text-[10px] text-[color:rgba(61,52,40,0.48)] leading-snug">
            {bcPick(businessCardBuilderCopy.textRichToneHelp, lang)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["headline", "support", "caption"] as const).map((key) => {
              const label =
                key === "headline"
                  ? businessCardBuilderCopy.textRichToneHeadline
                  : key === "support"
                    ? businessCardBuilderCopy.textRichToneSupport
                    : businessCardBuilderCopy.textRichToneCaption;
              return (
              <button
                key={key}
                type="button"
                onClick={() => patch({ ...TONE_PATCH[key] })}
                className={[
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold touch-manipulation",
                  tone === key
                    ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)] text-[color:#3d3428]"
                    : "border-black/10 bg-white text-[color:#3d3428]",
                ].join(" ")}
              >
                {bcPick(label, lang)}
              </button>
            );
            })}
            <button
              type="button"
              onClick={() => patch({ textTone: undefined })}
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[color:rgba(61,52,40,0.65)] touch-manipulation"
            >
              {bcPick(businessCardBuilderCopy.textRichToneClear, lang)}
            </button>
          </div>
        </div>
      </div>

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
