"use client";

import { useRef, type CSSProperties } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardDocument, BusinessCardSide, TextFieldRole } from "../../product-configurators/business-cards/types";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import {
  presetToLogoStyle,
  presetToTextAnchorStyle,
  scaleToLogoPercent,
  scaleToTextRem,
} from "../../product-configurators/business-cards/layoutPresets";

const LINE_ORDER: TextFieldRole[] = [
  "company",
  "personName",
  "title",
  "tagline",
  "phone",
  "email",
  "website",
  "address",
];

function mergeTransform(base: string | undefined, nudgeX: number, nudgeY: number): string {
  const nx = nudgeX * 3;
  const ny = nudgeY * 3;
  const b = base ?? "translate(-50%, -50%)";
  return `${b} translate(${nx}%, ${ny}%)`;
}

function trimSurfaceStyle(doc: BusinessCardDocument): CSSProperties {
  const bg = doc.canvasBackground;
  if (bg.kind === "solid") {
    return { backgroundColor: bg.color };
  }
  const gradients: Record<(typeof bg)["id"], string> = {
    linen: "linear-gradient(145deg,#fbf9f4 0%,#ebe4d8 100%)",
    pearl: "linear-gradient(160deg,#fffef9 0%,#f2ebe4 100%)",
    graphite: "linear-gradient(145deg,#2a2a2e 0%,#1a1a1d 100%)",
    sand: "linear-gradient(145deg,#f6efe6 0%,#e2d6ca 100%)",
  };
  return { background: gradients[bg.id] };
}

function trimTextColor(doc: BusinessCardDocument): string {
  if (doc.canvasBackground.kind === "preset" && doc.canvasBackground.id === "graphite") {
    return "rgba(255,252,247,0.94)";
  }
  return "var(--lx-text)";
}

function clampPct(v: number, min = 8, max = 92): number {
  return Math.min(max, Math.max(min, v));
}

export type BusinessCardPreviewEditApi = {
  selectedTextBlockId: string | null;
  onSelectTextBlock: (id: string | null) => void;
  onMoveTextBlock: (id: string, xPct: number, yPct: number) => void;
  onMoveLogo: (xPct: number, yPct: number) => void;
};

export function BusinessCardPreview(props: {
  document: BusinessCardDocument;
  side: BusinessCardSide;
  lang: Lang;
  editInteraction?: BusinessCardPreviewEditApi | null;
}) {
  const { document: doc, side, lang, editInteraction } = props;
  const state = side === "front" ? doc.front : doc.back;
  const logoStyle = presetToLogoStyle(state.logo.position);
  const textAnchor = presetToTextAnchorStyle(state.textLayout.groupPosition);
  const logoPct = scaleToLogoPercent(state.logo.scale);
  const baseRem = scaleToTextRem(state.textLayout.groupScale);
  const showLogo = state.logo.visible && Boolean(state.logo.previewUrl);
  const textColor = trimTextColor(doc);
  const useBlocks = state.textBlocks.length > 0;
  const trimRef = useRef<HTMLDivElement>(null);

  const bindBlockDrag = (id: string, startX: number, startY: number) => {
    if (!editInteraction || !trimRef.current) return;
    const trim = trimRef.current;
    let lastX = startX;
    let lastY = startY;

    const onMove = (ev: PointerEvent) => {
      const r = trim.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clampPct(((ev.clientX - r.left) / r.width) * 100);
      const y = clampPct(((ev.clientY - r.top) / r.height) * 100);
      if (Math.hypot(x - lastX, y - lastY) < 0.35) return;
      lastX = x;
      lastY = y;
      editInteraction.onMoveTextBlock(id, x, y);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const bindLogoDrag = (startX: number, startY: number) => {
    if (!editInteraction || !trimRef.current) return;
    const trim = trimRef.current;
    let lastX = startX;
    let lastY = startY;

    const onMove = (ev: PointerEvent) => {
      const r = trim.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clampPct(((ev.clientX - r.left) / r.width) * 100);
      const y = clampPct(((ev.clientY - r.top) / r.height) * 100);
      if (Math.hypot(x - lastX, y - lastY) < 0.35) return;
      lastX = x;
      lastY = y;
      editInteraction.onMoveLogo(x, y);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div
        data-tienda-bc-export-root
        className="relative w-full rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] border border-[rgba(255,255,255,0.08)]"
        style={{ aspectRatio: "3.5 / 2" }}
      >
        <div className="absolute inset-0 bg-[#232326]" aria-hidden>
          <div
            ref={trimRef}
            className="absolute inset-[2.8%] rounded-[6px] shadow-inner relative"
            style={{
              ...trimSurfaceStyle(doc),
              ["--lx-text" as string]: textColor,
            }}
            onPointerDown={
              editInteraction
                ? () => {
                    editInteraction.onSelectTextBlock(null);
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
                    return (
                      <div
                        key={b.id}
                        className={[
                          "absolute",
                          editInteraction ? "cursor-grab active:cursor-grabbing touch-none z-[8]" : "pointer-events-none",
                          selected ? "ring-2 ring-[rgba(201,168,74,0.65)] rounded-sm" : "",
                        ].join(" ")}
                        style={{
                          left: `${b.xPct}%`,
                          top: `${b.yPct}%`,
                          transform: "translate(-50%, -50%)",
                          width: `${b.widthPct}%`,
                          zIndex: b.zIndex,
                          fontSize: `clamp(7px, ${b.fontSize * 0.092}rem, 22px)`,
                          fontWeight: b.fontWeight,
                          color: b.color?.startsWith("var(") ? b.color : b.color || textColor,
                          textAlign: b.textAlign,
                          lineHeight: 1.2,
                          wordBreak: "break-word",
                        }}
                        onPointerDown={
                          editInteraction
                            ? (e) => {
                                e.stopPropagation();
                                editInteraction.onSelectTextBlock(b.id);
                                if (!trimRef.current) return;
                                const r = trimRef.current.getBoundingClientRect();
                                const x = clampPct(((e.clientX - r.left) / r.width) * 100);
                                const y = clampPct(((e.clientY - r.top) / r.height) * 100);
                                bindBlockDrag(b.id, x, y);
                              }
                            : undefined
                        }
                      >
                        {t}
                      </div>
                    );
                  })}
                {showLogo ? (
                  <div
                    className={[
                      "absolute",
                      editInteraction ? "cursor-grab active:cursor-grabbing touch-none" : "pointer-events-none",
                    ].join(" ")}
                    style={{
                      left: `${state.logoGeom.xPct}%`,
                      top: `${state.logoGeom.yPct}%`,
                      transform: "translate(-50%, -50%)",
                      width: `${state.logoGeom.widthPct}%`,
                      zIndex: state.logoGeom.zIndex,
                    }}
                    onPointerDown={
                      editInteraction
                        ? (e) => {
                            e.stopPropagation();
                            editInteraction.onSelectTextBlock(null);
                            if (!trimRef.current) return;
                            const r = trimRef.current.getBoundingClientRect();
                            const x = clampPct(((e.clientX - r.left) / r.width) * 100);
                            const y = clampPct(((e.clientY - r.top) / r.height) * 100);
                            bindLogoDrag(x, y);
                          }
                        : undefined
                    }
                  >
                    <div className="relative aspect-square w-full pointer-events-none">
                      <img src={state.logo.previewUrl!} alt="" className="h-full w-full object-contain" />
                    </div>
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
                    {LINE_ORDER.map((role) => {
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
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-[rgba(255,255,255,0.45)]">
        3.5″ × 2″ • {side === "front" ? bcPick(businessCardBuilderCopy.sideFront, lang) : bcPick(businessCardBuilderCopy.sideBack, lang)}
      </p>
    </div>
  );
}
