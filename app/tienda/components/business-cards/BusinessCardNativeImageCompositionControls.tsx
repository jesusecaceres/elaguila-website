"use client";

import type {
  BusinessCardDesignerV2NativeImage,
  BusinessCardDesignerV2NativeObject,
} from "../../product-configurators/business-cards/types";
import {
  clampNativeCornerRadiusPx,
  clampNativeImageOpacity,
  clampNativeObjectPositionPct,
} from "../../product-configurators/business-cards/designer-v2/studio/geometryClamp";
import type { NativeInspectorChrome } from "./nativeInspectorChrome";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function BusinessCardNativeImageCompositionControls(props: {
  lang: "en" | "es";
  locked: boolean;
  image: BusinessCardDesignerV2NativeImage;
  patch: (p: Partial<BusinessCardDesignerV2NativeObject>) => void;
  cx: NativeInspectorChrome;
  /** When true (e.g. contextual column + top toolbar), only focal X/Y fine tuning — no fit/opacity/mask */
  framingOnly?: boolean;
}) {
  const { lang, locked, image, patch, cx, framingOnly } = props;
  const lg = lang;

  const fit = image.objectFit ?? "contain";
  const posX = image.objectPositionXPct ?? 50;
  const posY = image.objectPositionYPct ?? 50;
  const op = image.imageOpacity ?? 1;
  const radius = image.cornerRadiusPx ?? 0;
  const clip = image.imageClip ?? "roundRect";

  return (
    <>
      {!framingOnly ? (
      <div className={cx.sectionTop}>
        <p className={cx.sectionTitle}>{bcPick(businessCardBuilderCopy.nativeImageFitSectionTitle, lg)}</p>
        <p className={cx.sectionHelp}>{bcPick(businessCardBuilderCopy.nativeImageFitSectionHelp, lg)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(
            [
              ["contain", businessCardBuilderCopy.nativeImageFitContain],
              ["cover", businessCardBuilderCopy.nativeImageFitCover],
              ["fill", businessCardBuilderCopy.nativeImageFitFill],
            ] as const
          ).map(([key, copy]) => (
            <button
              key={key}
              type="button"
              disabled={locked}
              onClick={() => patch({ objectFit: key })}
              className={[
                cx.btn,
                "flex-1 min-w-[4.5rem]",
                fit === key ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.18)]" : "",
              ].join(" ")}
            >
              {bcPick(copy, lg)}
            </button>
          ))}
        </div>
      </div>
      ) : null}

      <div className={cx.sectionTop}>
        <p className={cx.sectionTitle}>{bcPick(businessCardBuilderCopy.nativeImageFramingSectionTitle, lg)}</p>
        <p className={cx.sectionHelp}>{bcPick(businessCardBuilderCopy.nativeImageFramingSectionHelp, lg)}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={locked}
            className={cx.btn}
            onClick={() => patch({ objectPositionXPct: 50, objectPositionYPct: 50 })}
          >
            {bcPick(businessCardBuilderCopy.nativeImageFramingCenter, lg)}
          </button>
          <label className={cx.labelGrid}>
            X %
            <input
              type="number"
              disabled={locked}
              min={0}
              max={100}
              className={cx.input}
              value={Math.round(posX)}
              onChange={(e) => patch({ objectPositionXPct: clampNativeObjectPositionPct(num(e.target.value)) })}
            />
          </label>
          <label className={cx.labelGrid}>
            Y %
            <input
              type="number"
              disabled={locked}
              min={0}
              max={100}
              className={cx.input}
              value={Math.round(posY)}
              onChange={(e) => patch({ objectPositionYPct: clampNativeObjectPositionPct(num(e.target.value)) })}
            />
          </label>
        </div>
        <label className={`${cx.labelBlock} mt-2`}>
          {bcPick(businessCardBuilderCopy.nativeImageFramingFineX, lg)}
          <input
            type="range"
            min={0}
            max={100}
            disabled={locked}
            className={cx.range}
            value={Math.round(posX)}
            onChange={(e) => patch({ objectPositionXPct: clampNativeObjectPositionPct(num(e.target.value)) })}
          />
        </label>
        <label className={cx.labelBlock}>
          {bcPick(businessCardBuilderCopy.nativeImageFramingFineY, lg)}
          <input
            type="range"
            min={0}
            max={100}
            disabled={locked}
            className={cx.range}
            value={Math.round(posY)}
            onChange={(e) => patch({ objectPositionYPct: clampNativeObjectPositionPct(num(e.target.value)) })}
          />
        </label>
      </div>

      {!framingOnly ? (
      <div className={cx.sectionTop}>
        <p className={cx.sectionTitle}>{bcPick(businessCardBuilderCopy.nativeImageAppearanceSectionTitle, lg)}</p>
        <label className={cx.labelBlock}>
          {bcPick(businessCardBuilderCopy.nativeImageOpacityLabel, lg)}
          <input
            type="range"
            min={0}
            max={100}
            disabled={locked}
            className={cx.range}
            value={Math.round(op * 100)}
            onChange={(e) => patch({ imageOpacity: clampNativeImageOpacity(num(e.target.value) / 100) })}
          />
        </label>
        <p className={`${cx.sectionTitle} mt-3`}>{bcPick(businessCardBuilderCopy.nativeImageMaskSectionTitle, lg)}</p>
        <p className={cx.sectionHelp}>{bcPick(businessCardBuilderCopy.nativeImageMaskSectionHelp, lg)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(
            [
              ["rect", businessCardBuilderCopy.nativeImageMaskRect],
              ["roundRect", businessCardBuilderCopy.nativeImageMaskRoundRect],
              ["circle", businessCardBuilderCopy.nativeImageMaskCircle],
            ] as const
          ).map(([key, copy]) => (
            <button
              key={key}
              type="button"
              disabled={locked}
              onClick={() => patch({ imageClip: key })}
              className={[
                cx.btn,
                "flex-1 min-w-[5rem]",
                clip === key ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.18)]" : "",
              ].join(" ")}
            >
              {bcPick(copy, lg)}
            </button>
          ))}
        </div>
        {clip === "roundRect" ? (
          <label className={`${cx.labelBlock} mt-2`}>
            {bcPick(businessCardBuilderCopy.nativeImageCornerRadiusLabel, lg)}
            <input
              type="range"
              min={0}
              max={48}
              disabled={locked}
              className={cx.range}
              value={Math.round(radius)}
              onChange={(e) => patch({ cornerRadiusPx: clampNativeCornerRadiusPx(num(e.target.value)) })}
            />
          </label>
        ) : null}
      </div>
      ) : null}
    </>
  );
}
