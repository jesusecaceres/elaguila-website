"use client";

import { useMemo, useRef } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import type { BusinessCardDocument, BusinessCardSide } from "../../product-configurators/business-cards/types";
import { LOGO_MAX_MB } from "../../product-configurators/business-cards/constants";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { buildUnifiedLayerRows } from "../../product-configurators/business-cards/designer-v2/layerList/buildUnifiedLayerRows";
import { compressStudioImageDataUrl } from "../../product-configurators/business-cards/designer-v2/utils/compressStudioImage";
import {
  createDefaultNativeImage,
  createDefaultNativeShape,
  createEllipseNativeShape,
  nextDesignerV2NativeZIndex,
} from "../../product-configurators/business-cards/designer-v2/factories/nativeObjectDefaults";
import { BusinessCardDesignerV2NativeInspector } from "./BusinessCardDesignerV2NativeInspector";

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Full design surface list: Leonix template layers vs studio additions, with honest interaction flags.
 */
export function BusinessCardDesignerV2Panel(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  side: BusinessCardSide;
  dispatch: (a: BusinessCardBuilderAction) => void;
  selectedV2NativeId: string | null;
  onSelectV2Native: (id: string | null) => void;
  selectedTextBlockId: string | null;
  logoInspectorActive: boolean;
  onSelectTextBlock: (id: string | null) => void;
  onFocusLogo: () => void;
  onClearTemplateSelection: () => void;
  /** When false, native object tools render in `BusinessCardContextualInspector` instead of here */
  embedNativeInspector?: boolean;
}) {
  const {
    lang,
    doc,
    side,
    dispatch,
    selectedV2NativeId,
    onSelectV2Native,
    selectedTextBlockId,
    logoInspectorActive,
    onSelectTextBlock,
    onFocusLogo,
    onClearTemplateSelection,
    embedNativeInspector = false,
  } = props;
  const lg = lang === "en" ? "en" : "es";
  const fileRef = useRef<HTMLInputElement>(null);
  const state = side === "front" ? doc.front : doc.back;

  const rows = useMemo(() => buildUnifiedLayerRows(doc, side, lg), [doc, side, lg]);
  const studioRows = useMemo(() => rows.filter((r) => r.layerSource === "studio"), [rows]);

  const selectedNative = useMemo(
    () => (state.designerV2NativeObjects ?? []).find((o) => o.id === selectedV2NativeId) ?? null,
    [state.designerV2NativeObjects, selectedV2NativeId]
  );

  const onPickStudioImage = async (file: File | null) => {
    if (!file) return;
    if (file.size > LOGO_MAX_MB * 1024 * 1024) {
      window.alert(lg === "en" ? `Image must be under ${LOGO_MAX_MB} MB.` : `La imagen debe ser menor a ${LOGO_MAX_MB} MB.`);
      return;
    }
    let raw = await readFileAsDataUrl(file);
    raw = await compressStudioImageDataUrl(raw);
    const img = new window.Image();
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("decode"));
        img.src = raw;
      });
    } catch {
      window.alert(lg === "en" ? "Could not read that image." : "No se pudo leer la imagen.");
      return;
    }
    const id = `nv2i-${Date.now().toString(36)}`;
    const z = nextDesignerV2NativeZIndex(state);
    const obj = createDefaultNativeImage({
      id,
      previewUrl: raw,
      naturalWidth: img.naturalWidth || null,
      naturalHeight: img.naturalHeight || null,
      zIndex: z,
    });
    dispatch({ type: "V2_ADD_NATIVE_IMAGE", side, object: obj });
    onClearTemplateSelection();
    onSelectV2Native(id);
  };

  const addRect = () => {
    const id = `nv2s-${Date.now().toString(36)}`;
    const z = nextDesignerV2NativeZIndex(state);
    dispatch({ type: "V2_ADD_NATIVE_SHAPE", side, object: createDefaultNativeShape({ id, zIndex: z }) });
    onClearTemplateSelection();
    onSelectV2Native(id);
  };

  const addEllipse = () => {
    const id = `nv2s-${Date.now().toString(36)}`;
    const z = nextDesignerV2NativeZIndex(state);
    dispatch({ type: "V2_ADD_NATIVE_SHAPE", side, object: createEllipseNativeShape({ id, zIndex: z }) });
    onClearTemplateSelection();
    onSelectV2Native(id);
  };

  const kindBadgeLabel = (row: ReturnType<typeof buildUnifiedLayerRows>[number]) => {
    switch (row.kind) {
      case "template-text":
        return bcPick(businessCardBuilderCopy.layerKindBadgeTemplateText, lang);
      case "template-logo":
        return bcPick(businessCardBuilderCopy.layerKindBadgeLogo, lang);
      case "studio-image":
        return bcPick(businessCardBuilderCopy.layerKindBadgeStudioImage, lang);
      case "studio-shape":
        return bcPick(businessCardBuilderCopy.layerKindBadgeStudioShape, lang);
      default:
        return "";
    }
  };

  const kindBadgeClass = (row: ReturnType<typeof buildUnifiedLayerRows>[number]) => {
    switch (row.kind) {
      case "template-text":
        return "bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,226,0.78)]";
      case "template-logo":
        return "bg-[rgba(201,168,74,0.14)] text-[rgba(255,247,226,0.88)]";
      case "studio-image":
        return "bg-[rgba(201,168,74,0.22)] text-[rgba(201,168,74,0.98)]";
      case "studio-shape":
        return "bg-[rgba(201,168,74,0.16)] text-[rgba(255,247,226,0.82)]";
      default:
        return "";
    }
  };

  const renderRow = (row: ReturnType<typeof buildUnifiedLayerRows>[number]) => {
    const canSelectText = row.canSelectForTemplateEdit;
    const isLogoRow = row.isTemplateLogo;
    const isStudio = row.isStudioObject;
    const selected =
      (canSelectText && selectedTextBlockId === row.id) ||
      (isLogoRow && logoInspectorActive) ||
      (isStudio && selectedV2NativeId === row.id);
    const hidden = !row.visible;

    return (
      <li key={`${row.id}-${row.stackOrder}`}>
        <button
          type="button"
          disabled={!canSelectText && !isLogoRow && !isStudio}
          title={
            row.isInformationalTemplateText
              ? lg === "en"
                ? "Stacked layout — edit copy in the fields section above"
                : "Texto apilado — edita el contenido en los campos de arriba"
              : undefined
          }
          onClick={() => {
            if (canSelectText) {
              onSelectTextBlock(row.id);
              onSelectV2Native(null);
            } else if (isLogoRow) {
              onSelectV2Native(null);
              onFocusLogo();
            } else if (isStudio) {
              onClearTemplateSelection();
              onSelectV2Native(row.id);
            }
          }}
          className={[
            "w-full rounded-lg px-3 py-2.5 text-left text-xs flex items-center justify-between gap-2 transition-colors border-l-[3px]",
            !canSelectText && !isLogoRow && !isStudio ? "opacity-40 cursor-not-allowed" : "hover:bg-[rgba(255,255,255,0.05)]",
            hidden ? "opacity-45" : "",
            selected
              ? "border-[#c9a84a] bg-[rgba(201,168,74,0.16)] ring-1 ring-[rgba(201,168,74,0.42)] shadow-[inset_0_0_0_1px_rgba(201,168,74,0.12)]"
              : "border-transparent bg-[rgba(0,0,0,0.14)]",
          ].join(" ")}
        >
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={["shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", kindBadgeClass(row)].join(" ")}
              >
                {kindBadgeLabel(row)}
              </span>
              <span className="truncate text-[rgba(255,247,226,0.93)]">{row.displayLabel}</span>
              {row.isInformationalTemplateText ? (
                <span className="shrink-0 rounded bg-[rgba(255,255,255,0.06)] px-1 py-0.5 text-[8px] font-medium uppercase tracking-wide text-[rgba(255,255,255,0.42)]">
                  {bcPick(businessCardBuilderCopy.layerRowInfoOnly, lang)}
                </span>
              ) : null}
            </span>
            {row.locked ? (
              <span className="shrink-0 text-amber-400/90" title={lg === "en" ? "Locked" : "Bloqueado"} aria-hidden>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-90">
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" strokeLinecap="round" />
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                </svg>
              </span>
            ) : null}
          </span>
          <span className="shrink-0 tabular-nums text-[10px] text-[rgba(255,255,255,0.42)]">z{row.stackOrder}</span>
        </button>
      </li>
    );
  };

  return (
    <section className="mt-6 rounded-2xl border border-[rgba(201,168,74,0.22)] bg-[rgba(201,168,74,0.06)] p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-[rgba(255,247,226,0.95)]">
          {bcPick(businessCardBuilderCopy.refinementsSectionTitle, lang)}
        </h3>
        <span className="text-[11px] text-[rgba(255,255,255,0.45)]">
          {bcPick(businessCardBuilderCopy.refinementsSectionHint, lang)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPickStudioImage(e.target.files?.[0] ?? null)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,255,255,0.1)]"
        >
          {bcPick(businessCardBuilderCopy.refinementsAddImage, lang)}
        </button>
        <button
          type="button"
          onClick={addRect}
          className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,255,255,0.1)]"
        >
          {bcPick(businessCardBuilderCopy.refinementsAddRect, lang)}
        </button>
        <button
          type="button"
          onClick={addEllipse}
          className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,255,255,0.1)]"
        >
          {bcPick(businessCardBuilderCopy.refinementsAddEllipse, lang)}
        </button>
      </div>

      <div className="mt-4 max-h-[min(52vh,420px)] overflow-y-auto pr-1">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.48)]">
          {bcPick(businessCardBuilderCopy.refinementsCompositionStackTitle, lang)}
        </p>
        <p className="mb-1 text-[10px] leading-snug text-[rgba(255,255,255,0.38)]">
          {bcPick(businessCardBuilderCopy.refinementsStackCaption, lang)}
        </p>
        <p className="mb-3 text-[10px] leading-snug text-[rgba(255,255,255,0.35)]">
          {bcPick(businessCardBuilderCopy.refinementsTemplateHelp, lang)}
        </p>
        {rows.length > 0 ? (
          <ul className="space-y-1.5">{rows.map((r) => renderRow(r))}</ul>
        ) : (
          <p className="text-[11px] text-[rgba(255,255,255,0.35)]">{bcPick(businessCardBuilderCopy.refinementsEmpty, lang)}</p>
        )}
        {studioRows.length === 0 && rows.length > 0 ? (
          <p className="mt-3 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[10px] leading-snug text-[rgba(255,255,255,0.38)]">
            {bcPick(businessCardBuilderCopy.refinementsEmpty, lang)}
          </p>
        ) : null}
      </div>

      {embedNativeInspector && selectedNative ? (
        <BusinessCardDesignerV2NativeInspector
          lang={lg}
          side={side}
          selected={selectedNative}
          dispatch={dispatch}
          onDeleted={() => onSelectV2Native(null)}
          onDuplicated={(newId) => {
            onClearTemplateSelection();
            onSelectV2Native(newId);
          }}
        />
      ) : null}
    </section>
  );
}
