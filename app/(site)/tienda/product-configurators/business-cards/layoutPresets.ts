/**
 * Public entry for layout + scale helpers. Split implementation:
 * - `layout/layoutLegacyCss.ts` — CSS for legacy stacked fields
 * - `layout/layoutGeomAndScale.ts` — trim %, rem scales, block-mode logo center
 *
 * Designer V2 may replace preset grids with layer transforms; keep imports via this file
 * so call sites stay stable during refactors.
 */
export { presetToLogoStyle, presetToTextAnchorStyle } from "./layout/layoutLegacyCss";
export {
  scaleToLogoPercent,
  scaleToTextRem,
  layoutPresetToLogoGeomCenter,
  widthPctToNearestLogoScale,
} from "./layout/layoutGeomAndScale";
