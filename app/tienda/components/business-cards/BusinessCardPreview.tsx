"use client";

import { useRef, type CSSProperties } from "react";
import type { Lang } from "../../types/tienda";
import type {
  BusinessCardDesignerV2NativeObject,
  BusinessCardDocument,
  BusinessCardLogoGeom,
  BusinessCardSide,
  BusinessCardTextBlock,
  TextFieldRole,
} from "../../product-configurators/business-cards/types";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import {
  presetToLogoStyle,
  presetToTextAnchorStyle,
  scaleToLogoPercent,
  scaleToTextRem,
} from "../../product-configurators/business-cards/layoutPresets";
import { BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD, clampPreviewDragPct } from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";
import type { SnapGuideState } from "../../product-configurators/business-cards/preview/alignmentSnap";
import { snapTrimPosition } from "../../product-configurators/business-cards/preview/alignmentSnap";
import { BusinessCardSnapGuidesOverlay } from "./BusinessCardSnapGuidesOverlay";
import { trimSurfaceStyle, trimTextColor } from "../../product-configurators/business-cards/preview/businessCardPreviewSurface";
import { mergeTransform } from "../../product-configurators/business-cards/preview/businessCardPreviewTransforms";
import { blockModeTextScaleMultiplierFromGroupScale } from "../../product-configurators/business-cards/preview/businessCardPreviewBlockScale";
import { BUSINESS_CARD_PREVIEW_LEGACY_LINE_ORDER } from "../../product-configurators/business-cards/preview/businessCardPreviewLineOrder";
import {
  textBlockInnerSpanStyle,
  textBlockOuterStyle,
} from "../../product-configurators/business-cards/preview/textBlockPreviewStyles";
import { BusinessCardNativeV2PreviewLayer } from "./BusinessCardNativeV2PreviewLayer";
import { BusinessCardLogoWidthHandle, BusinessCardTextBlockWidthHandle } from "./BusinessCardPreviewTextLogoHandles";

/**
 * Trim-accurate preview for builder + export root (`data-tienda-bc-export-root`).
 * Two render paths: block mode (`textBlocks.length > 0`) vs legacy stacked fields.
 * In block mode, text blocks, logo, and V2 native objects are siblings in one stacking context;
 * paint order follows each layer’s numeric `zIndex` (see `BusinessCardNativeV2PreviewLayer`).
 */

export type BusinessCardPreviewEditApi = {
  selectedTextBlockId: string | null;
  logoSelected: boolean;
  /** Studio-only layers (not template text / logo) */
  selectedV2NativeId?: string | null;
  onSelectTextBlock: (id: string | null) => void;
  onDeselectCanvas: () => void;
  onFocusLogo: () => void;
  onSelectV2Native?: (id: string | null) => void;
  onMoveV2Native?: (id: string, xPct: number, yPct: number) => void;
  /** Canvas transform (resize/rotate); requires `transformInteraction` */
  onPatchV2Native?: (
    id: string,
    patch: Partial<Pick<BusinessCardDesignerV2NativeObject, "xPct" | "yPct" | "widthPct" | "heightPct" | "rotationDeg">>
  ) => void;
  /** When true, on-canvas resize/rotate handles are active */
  transformInteraction?: boolean;
  onMoveTextBlock: (id: string, xPct: number, yPct: number) => void;
  /** Optional canvas width handle for text blocks (inspector parity). */
  onPatchTextBlock?: (id: string, patch: Partial<BusinessCardTextBlock>) => void;
  onMoveLogo: (xPct: number, yPct: number) => void;
  /** Optional canvas resize for logo width (inspector parity). */
  onPatchLogoGeom?: (patch: Partial<BusinessCardLogoGeom>) => void;
  /** Live alignment guides while dragging (snap). */
  onSnapGuidesChange?: (guides: SnapGuideState | null) => void;
};

export function BusinessCardPreview(props: {
  document: BusinessCardDocument;
  side: BusinessCardSide;
  lang: Lang;
  editInteraction?: BusinessCardPreviewEditApi | null;
  /** Controlled snap overlay (optional; can mirror callback-driven state from parent). */
  snapGuidesOverlay?: SnapGuideState | null;
}) {
  const { document: doc, side, lang, editInteraction, snapGuidesOverlay } = props;
  const state = side === "front" ? doc.front : doc.back;
  const logoStyle = presetToLogoStyle(state.logo.position);
  const textAnchor = presetToTextAnchorStyle(state.textLayout.groupPosition);
  const logoPct = scaleToLogoPercent(state.logo.scale);
  const baseRem = scaleToTextRem(state.textLayout.groupScale);
  const showLogo = state.logo.visible && Boolean(state.logo.previewUrl);
  const textColor = trimTextColor(doc);
  const useBlocks = state.textBlocks.length > 0;
  const blockTextScaleMul = useBlocks ? blockModeTextScaleMultiplierFromGroupScale(state.textLayout.groupScale) : 1;
  const trimRef = useRef<HTMLDivElement>(null);

  const bindBlockDrag = (el: HTMLElement, id: string, startX: number, startY: number, pointerId: number) => {
    if (!editInteraction || !trimRef.current) return;
    const trim = trimRef.current;
    let lastX = startX;
    let lastY = startY;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const r = trim.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clampPreviewDragPct(((ev.clientX - r.left) / r.width) * 100);
      const y = clampPreviewDragPct(((ev.clientY - r.top) / r.height) * 100);
      if (Math.hypot(x - lastX, y - lastY) < BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD) return;
      lastX = x;
      lastY = y;
      const snapped = snapTrimPosition(x, y, { guidesVisible: doc.guidesVisible });
      editInteraction.onSnapGuidesChange?.(snapped.guides.vertical != null || snapped.guides.horizontal != null ? snapped.guides : null);
      editInteraction.onMoveTextBlock(id, snapped.xPct, snapped.yPct);
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      editInteraction.onSnapGuidesChange?.(null);
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };

    try {
      el.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const bindLogoDrag = (el: HTMLElement, startX: number, startY: number, pointerId: number) => {
    if (!editInteraction || !trimRef.current) return;
    const trim = trimRef.current;
    let lastX = startX;
    let lastY = startY;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const r = trim.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clampPreviewDragPct(((ev.clientX - r.left) / r.width) * 100);
      const y = clampPreviewDragPct(((ev.clientY - r.top) / r.height) * 100);
      if (Math.hypot(x - lastX, y - lastY) < BUSINESS_CARD_PREVIEW_DRAG_THRESHOLD) return;
      lastX = x;
      lastY = y;
      const snapped = snapTrimPosition(x, y, { guidesVisible: doc.guidesVisible });
      editInteraction.onSnapGuidesChange?.(snapped.guides.vertical != null || snapped.guides.horizontal != null ? snapped.guides : null);
      editInteraction.onMoveLogo(snapped.xPct, snapped.yPct);
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      editInteraction.onSnapGuidesChange?.(null);
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };

    try {
      el.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div
        data-tienda-bc-export-root
        className="relative w-full rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] border border-[rgba(255,255,255,0.08)]"
        style={{ aspectRatio: "3.5 / 2" }}
      >
        <div className="absolute inset-0 bg-[#232326]" aria-hidden>
          {/* Must stay position:absolute — do not add "relative" here; it overrides absolute and breaks % positioning for blocks */}
          <div
            ref={trimRef}
            className="absolute inset-[2.8%] rounded-[6px] shadow-inner overflow-hidden z-0"
            style={{
              ...trimSurfaceStyle(doc),
              ["--lx-text" as string]: textColor,
            }}
            onPointerDown={
              editInteraction
                ? () => {
                    editInteraction.onDeselectCanvas();
                  }
                : undefined
            }
          >
            {doc.guidesVisible ? (
              <>
                <div
                  className="absolute rounded-[4px] border border-dashed border-[rgba(201,168,74,0.45)] pointer-events-none z-[15]"
                  style={{ inset: "8%" }}
                  title="Safe area"
                />
                <div
                  className="absolute rounded-[4px] border border-[rgba(201,168,74,0.2)] pointer-events-none z-[15]"
                  style={{ inset: "4%" }}
                  title="Trim / edge zone"
                />
              </>
            ) : null}

            {useBlocks ? (
              <>
                {[...state.textBlocks]
                  .sort((a, b) => a.zIndex - b.zIndex)
                  .map((b) => {
                    if (b.role !== "custom" && state.textLayout.lineVisible[b.role as TextFieldRole] === false) {
                      return null;
                    }
                    const t = b.text.trim();
                    if (!t) return null;
                    const selected = editInteraction?.selectedTextBlockId === b.id;
                    const outer = textBlockOuterStyle(b, {
                      blockTextScaleMul: blockTextScaleMul,
                      textColor,
                      transform: mergeTransform("translate(-50%, -50%)", doc.textNudgeX, doc.textNudgeY),
                    });
                    const showBackdrop = (b.textBackdrop ?? "none") === "soft";
                    const showTextWidthHandle = Boolean(selected && editInteraction?.onPatchTextBlock);
                    return (
                      <div
                        key={b.id}
                        role="group"
                        aria-selected={selected}
                        data-bc-text-selected={selected ? "true" : undefined}
                        className={[
                          "absolute rounded-[3px] overflow-visible outline-none",
                          editInteraction ? "cursor-grab active:cursor-grabbing touch-manipulation" : "pointer-events-none",
                          selected
                            ? "ring-[3px] ring-[#c9a84a] ring-offset-[4px] ring-offset-[rgba(0,0,0,0.22)] shadow-[0_0_0_1px_rgba(201,168,74,0.5),0_8px_22px_rgba(201,168,74,0.25)]"
                            : "",
                        ].join(" ")}
                        style={outer}
                        onPointerDown={
                          editInteraction
                            ? (e) => {
                                e.stopPropagation();
                                editInteraction.onSelectTextBlock(b.id);
                                if (!trimRef.current) return;
                                const r = trimRef.current.getBoundingClientRect();
                                const x = clampPreviewDragPct(((e.clientX - r.left) / r.width) * 100);
                                const y = clampPreviewDragPct(((e.clientY - r.top) / r.height) * 100);
                                bindBlockDrag(e.currentTarget, b.id, x, y, e.pointerId);
                              }
                            : undefined
                        }
                      >
                        {showBackdrop ? (
                          <span style={textBlockInnerSpanStyle(b)}>{t}</span>
                        ) : (
                          t
                        )}
                        {showTextWidthHandle && editInteraction ? (
                          <>
                            <BusinessCardTextBlockWidthHandle
                              trimRef={trimRef}
                              edge="left"
                              blockId={b.id}
                              startWidthPct={b.widthPct}
                              onPatchWidth={(id, widthPct) => editInteraction.onPatchTextBlock?.(id, { widthPct })}
                            />
                            <BusinessCardTextBlockWidthHandle
                              trimRef={trimRef}
                              edge="right"
                              blockId={b.id}
                              startWidthPct={b.widthPct}
                              onPatchWidth={(id, widthPct) => editInteraction.onPatchTextBlock?.(id, { widthPct })}
                            />
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                {showLogo ? (
                  <div
                    role="group"
                    aria-selected={editInteraction?.logoSelected}
                    data-bc-logo-selected={editInteraction?.logoSelected ? "true" : undefined}
                    className={[
                      "absolute rounded-md overflow-visible transition-shadow",
                      editInteraction ? "cursor-grab active:cursor-grabbing touch-manipulation" : "pointer-events-none",
                      editInteraction?.logoSelected
                        ? "ring-[3px] ring-[#c9a84a] ring-offset-[4px] ring-offset-[rgba(0,0,0,0.22)] shadow-[0_0_0_1px_rgba(201,168,74,0.5),0_8px_22px_rgba(201,168,74,0.25)]"
                        : "",
                    ].join(" ")}
                    style={{
                      left: `${state.logoGeom.xPct}%`,
                      top: `${state.logoGeom.yPct}%`,
                      transform: mergeTransform("translate(-50%, -50%)", doc.logoNudgeX, doc.logoNudgeY),
                      width: `${state.logoGeom.widthPct}%`,
                      zIndex: state.logoGeom.zIndex,
                    }}
                    onPointerDown={
                      editInteraction
                        ? (e) => {
                            e.stopPropagation();
                            editInteraction.onFocusLogo();
                            if (!trimRef.current) return;
                            const r = trimRef.current.getBoundingClientRect();
                            const x = clampPreviewDragPct(((e.clientX - r.left) / r.width) * 100);
                            const y = clampPreviewDragPct(((e.clientY - r.top) / r.height) * 100);
                            bindLogoDrag(e.currentTarget, x, y, e.pointerId);
                          }
                        : undefined
                    }
                  >
                    <div className="relative aspect-square w-full pointer-events-none">
                      <img src={state.logo.previewUrl!} alt="" className="h-full w-full object-contain" />
                    </div>
                    {editInteraction?.logoSelected && editInteraction.onPatchLogoGeom ? (
                      <BusinessCardLogoWidthHandle
                        trimRef={trimRef}
                        startWidthPct={state.logoGeom.widthPct}
                        onPatchWidth={(widthPct) => editInteraction.onPatchLogoGeom?.({ widthPct })}
                      />
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                {showLogo ? (
                  <div
                    className="absolute z-[5] pointer-events-none"
                    style={{
                      ...logoStyle,
                      width: `${logoPct}%`,
                      transform: mergeTransform(logoStyle.transform as string | undefined, doc.logoNudgeX, doc.logoNudgeY),
                    }}
                  >
                    <div className="relative aspect-square w-full">
                      <img src={state.logo.previewUrl!} alt="" className="h-full w-full object-contain" />
                    </div>
                  </div>
                ) : null}

                <div
                  className="absolute z-[6] max-w-[88%] pointer-events-none"
                  style={{
                    ...textAnchor,
                    transform: mergeTransform(textAnchor.transform as string | undefined, doc.textNudgeX, doc.textNudgeY),
                    color: textColor,
                  }}
                >
                  <div
                    className="flex flex-col gap-[0.12em]"
                    style={{
                      fontSize: `${baseRem}rem`,
                      lineHeight: 1.2,
                    }}
                  >
                    {BUSINESS_CARD_PREVIEW_LEGACY_LINE_ORDER.map((role) => {
                      if (!state.textLayout.lineVisible[role]) return null;
                      const v = state.fields[role].trim();
                      if (!v) return null;
                      const isCompany = role === "company";
                      const isContact =
                        role === "phone" || role === "email" || role === "website" || role === "address";
                      return (
                        <div
                          key={role}
                          className={
                            isCompany
                              ? "font-semibold tracking-tight"
                              : isContact
                                ? "opacity-[0.88] text-[0.9em]"
                                : "font-medium"
                          }
                          style={{ textAlign: (textAnchor.textAlign as CSSProperties["textAlign"]) ?? "center" }}
                        >
                          {v}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            {(state.designerV2NativeObjects ?? []).length > 0 ? (
              <BusinessCardNativeV2PreviewLayer
                trimRef={trimRef}
                objects={state.designerV2NativeObjects ?? []}
                selectedId={editInteraction?.selectedV2NativeId ?? null}
                readOnly={!editInteraction?.onSelectV2Native}
                onSelect={editInteraction?.onSelectV2Native ?? (() => {})}
                onMove={editInteraction?.onMoveV2Native ?? (() => {})}
                onPatchV2Native={editInteraction?.onPatchV2Native}
                transformInteraction={editInteraction?.transformInteraction ?? false}
                guidesVisible={doc.guidesVisible}
                onSnapGuidesChange={editInteraction?.onSnapGuidesChange}
              />
            ) : null}
            {snapGuidesOverlay && (snapGuidesOverlay.vertical != null || snapGuidesOverlay.horizontal != null) ? (
              <BusinessCardSnapGuidesOverlay guides={snapGuidesOverlay} />
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-[rgba(255,255,255,0.45)]">
        3.5″ × 2″ • {side === "front" ? bcPick(businessCardBuilderCopy.sideFront, lang) : bcPick(businessCardBuilderCopy.sideBack, lang)}
      </p>
      {editInteraction ? (
        <p className="mt-1 text-center text-[11px] text-[rgba(255,255,255,0.38)] max-w-[360px] mx-auto leading-snug">
          {bcPick(businessCardBuilderCopy.previewHelp, lang)}
        </p>
      ) : null}
    </div>
  );
}
