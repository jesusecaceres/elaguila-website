"use client";

import type { Lang } from "../../../types/tienda";
import type { BusinessCardSide, BusinessCardSideState } from "../../../product-configurators/business-cards/types";
import type { BusinessCardBuilderAction } from "../../../product-configurators/business-cards/businessCardBuilderReducer";
import { bcpPick, businessCardProductCopy } from "../../../data/businessCardProductCopy";

export function BusinessCardLogoGeomInspector(props: {
  lang: Lang;
  side: BusinessCardSide;
  state: BusinessCardSideState;
  dispatch: (a: BusinessCardBuilderAction) => void;
}) {
  const { lang, side, state, dispatch } = props;

  return (
    <div className="rounded-2xl border border-[rgba(201,168,74,0.55)] bg-[rgba(201,168,74,0.08)] p-4 ring-2 ring-[rgba(201,168,74,0.25)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-2">
      <p className="text-xs font-semibold text-[color:var(--lx-text)]">{bcpPick(businessCardProductCopy.logoOnCanvasTitle, lang)}</p>
      <p className="text-[11px] text-[color:rgba(61,52,40,0.65)]">{bcpPick(businessCardProductCopy.adjustLogoHint, lang)}</p>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
          X %
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-black/10 px-1 py-1.5 text-xs"
            value={Math.round(state.logoGeom.xPct)}
            onChange={(e) =>
              dispatch({
                type: "SET_LOGO_GEOM",
                side,
                patch: { xPct: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
          Y %
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-black/10 px-1 py-1.5 text-xs"
            value={Math.round(state.logoGeom.yPct)}
            onChange={(e) =>
              dispatch({
                type: "SET_LOGO_GEOM",
                side,
                patch: { yPct: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
          W %
          <input
            type="number"
            className="mt-1 w-full rounded-lg border border-black/10 px-1 py-1.5 text-xs"
            value={Math.round(state.logoGeom.widthPct)}
            min={8}
            max={70}
            onChange={(e) =>
              dispatch({
                type: "SET_LOGO_GEOM",
                side,
                patch: { widthPct: Number(e.target.value) },
              })
            }
          />
        </label>
      </div>
    </div>
  );
}
