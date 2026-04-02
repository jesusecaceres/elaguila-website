"use client";

import type { Lang } from "../../../types/tienda";
import type { BusinessCardDocument, BusinessCardSide, BusinessCardSideState } from "../../../product-configurators/business-cards/types";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import { bcPick, businessCardBuilderCopy } from "../../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../../data/businessCardProductCopy";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:rgba(61,52,40,0.5)]">{children}</p>
  );
}

function clampAxis(v: number): number {
  return Math.min(95, Math.max(5, v));
}

function clampWidth(v: number): number {
  return Math.min(70, Math.max(8, v));
}

function clampZ(v: number): number {
  return Math.min(40, Math.max(1, Math.round(v)));
}

export function BusinessCardLogoGeomInspector(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  side: BusinessCardSide;
  state: BusinessCardSideState;
  dispatch: (a: BusinessCardBuilderAction) => void;
}) {
  const { lang, doc, side, state, dispatch } = props;
  const hasAsset = Boolean(state.logo.previewUrl);

  return (
    <div className="space-y-4 rounded-2xl border border-[rgba(201,168,74,0.35)] bg-gradient-to-br from-[rgba(201,168,74,0.1)] to-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-[rgba(201,168,74,0.2)]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(201,168,74,0.9)]">
          {bcpPick(businessCardProductCopy.logoOnCanvasTitle, lang)}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[color:rgba(61,52,40,0.65)]">
          {bcPick(businessCardBuilderCopy.logoInspectorIntro, lang)}
        </p>
        <p className="mt-2 text-[10px] text-[color:rgba(61,52,40,0.52)] leading-snug">
          {bcpPick(businessCardProductCopy.adjustLogoHint, lang)}
        </p>
      </div>

      <div className="rounded-xl border border-black/[0.06] bg-white/90 p-3 shadow-inner">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-[13px] font-semibold text-[color:rgba(61,52,40,0.88)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-black/20 text-[color:var(--lx-gold)] focus:ring-[color:rgba(201,168,74,0.45)]"
            checked={state.logo.visible}
            disabled={!hasAsset}
            onChange={(e) => dispatch({ type: "SET_LOGO_VISIBLE", side, visible: e.target.checked })}
          />
          {bcPick(businessCardBuilderCopy.logoShowOnSide, lang)}
        </label>
        {!hasAsset ? (
          <p className="mt-2 text-[10px] text-[color:rgba(61,52,40,0.5)]">
            {bcPick(businessCardBuilderCopy.logoInspectorUploadHint, lang)}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.logoInspectorPlacementSection, lang)}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            X %
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-1 py-2 text-sm"
              value={Math.round(state.logoGeom.xPct)}
              min={5}
              max={95}
              onChange={(e) =>
                dispatch({
                  type: "SET_LOGO_GEOM",
                  side,
                  patch: { xPct: clampAxis(Number(e.target.value)) },
                })
              }
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            Y %
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-1 py-2 text-sm"
              value={Math.round(state.logoGeom.yPct)}
              min={5}
              max={95}
              onChange={(e) =>
                dispatch({
                  type: "SET_LOGO_GEOM",
                  side,
                  patch: { yPct: clampAxis(Number(e.target.value)) },
                })
              }
            />
          </label>
          <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
            {lang === "en" ? "W %" : "Ancho %"}
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-black/10 px-1 py-2 text-sm"
              value={Math.round(state.logoGeom.widthPct)}
              min={8}
              max={70}
              onChange={(e) =>
                dispatch({
                  type: "SET_LOGO_GEOM",
                  side,
                  patch: { widthPct: clampWidth(Number(e.target.value)) },
                })
              }
            />
          </label>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.logoInspectorStackSection, lang)}</SectionTitle>
        <label className="block text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
          {bcPick(businessCardBuilderCopy.logoInspectorZIndexLabel, lang)}
          <input
            type="number"
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-[color:rgba(201,168,74,0.45)] focus:ring-2 focus:ring-[color:rgba(201,168,74,0.2)]"
            value={state.logoGeom.zIndex}
            min={1}
            max={40}
            onChange={(e) =>
              dispatch({
                type: "SET_LOGO_GEOM",
                side,
                patch: { zIndex: clampZ(Number(e.target.value)) },
              })
            }
          />
        </label>
        <p className="text-[10px] leading-snug text-[color:rgba(61,52,40,0.48)]">
          {bcPick(businessCardBuilderCopy.logoInspectorZIndexHelp, lang)}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3">
        <SectionTitle>{bcPick(businessCardBuilderCopy.logoInspectorNudgeSection, lang)}</SectionTitle>
        <p className="text-[10px] text-[color:rgba(61,52,40,0.52)]">
          {bcPick(businessCardBuilderCopy.logoInspectorNudgeExplain, lang)}
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.5)]">X</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.25}
              value={doc.logoNudgeX}
              onChange={(e) =>
                dispatch({ type: "SET_LOGO_NUDGE", x: Number(e.target.value), y: doc.logoNudgeY })
              }
              className="mt-1 w-full min-h-[44px]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.5)]">Y</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.25}
              value={doc.logoNudgeY}
              onChange={(e) =>
                dispatch({ type: "SET_LOGO_NUDGE", x: doc.logoNudgeX, y: Number(e.target.value) })
              }
              className="mt-1 w-full min-h-[44px]"
            />
          </label>
        </div>
      </div>

      {hasAsset ? (
        <p className="text-[10px] leading-snug text-[color:rgba(61,52,40,0.48)]">
          {bcPick(businessCardBuilderCopy.logoInspectorUploadHint, lang)}
        </p>
      ) : null}
    </div>
  );
}
