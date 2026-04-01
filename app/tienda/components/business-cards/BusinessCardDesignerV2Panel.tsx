"use client";

import { useMemo, useRef } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import type { BusinessCardDocument, BusinessCardSide } from "../../product-configurators/business-cards/types";
import { LOGO_MAX_MB } from "../../product-configurators/business-cards/constants";
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
  } = props;
  const lg = lang === "en" ? "en" : "es";
  const fileRef = useRef<HTMLInputElement>(null);
  const state = side === "front" ? doc.front : doc.back;

  const rows = useMemo(() => buildUnifiedLayerRows(doc, side, lg), [doc, side, lg]);
  const templateRows = useMemo(() => rows.filter((r) => r.layerSource === "template"), [rows]);
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

  const renderRow = (row: ReturnType<typeof buildUnifiedLayerRows>[number]) => {
    const canSelectText = row.canSelectForTemplateEdit;
    const isLogoRow = row.isTemplateLogo;
    const isStudio = row.isStudioObject;
    const selected =
      (canSelectText && selectedTextBlockId === row.id) ||
      (isLogoRow && logoInspectorActive) ||
      (isStudio && selectedV2NativeId === row.id);

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
            "w-full rounded-lg px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors",
            !canSelectText && !isLogoRow && !isStudio ? "opacity-40 cursor-not-allowed" : "hover:bg-[rgba(255,255,255,0.06)]",
            selected ? "bg-[rgba(201,168,74,0.15)] ring-1 ring-[rgba(201,168,74,0.35)]" : "bg-[rgba(0,0,0,0.15)]",
          ].join(" ")}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={[
                "shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                row.layerSource === "template" ? "bg-[rgba(255,255,255,0.08)] text-[rgba(255,247,226,0.65)]" : "bg-[rgba(201,168,74,0.2)] text-[rgba(201,168,74,0.95)]",
              ].join(" ")}
            >
              {row.layerSource === "template" ? (lg === "en" ? "Tpl" : "Plt") : lg === "en" ? "Studio" : "Estudio"}
            </span>
            <span className="truncate text-[rgba(255,247,226,0.92)]">{row.displayLabel}</span>
          </span>
          <span className="shrink-0 text-[10px] text-[rgba(255,255,255,0.38)]">z{row.stackOrder}</span>
        </button>
      </li>
    );
  };

  return (
    <section className="mt-6 rounded-2xl border border-[rgba(201,168,74,0.22)] bg-[rgba(201,168,74,0.06)] p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-[rgba(255,247,226,0.95)]">
          {lg === "en" ? "Design layers" : "Capas del diseño"}
        </h3>
        <span className="text-[11px] text-[rgba(255,255,255,0.45)]">
          {lg === "en"
            ? "One stack: z-order matches the preview. Studio reorder moves only studio items."
            : "Una pila: el z-order coincide con la vista. Reordenar en estudio solo mueve objetos de estudio."}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPickStudioImage(e.target.files?.[0] ?? null)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,255,255,0.1)]"
        >
          {lg === "en" ? "+ Studio image" : "+ Imagen estudio"}
        </button>
        <button
          type="button"
          onClick={addRect}
          className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,255,255,0.1)]"
        >
          {lg === "en" ? "+ Rectangle" : "+ Rectángulo"}
        </button>
        <button
          type="button"
          onClick={addEllipse}
          className="rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs font-medium hover:bg-[rgba(255,255,255,0.1)]"
        >
          {lg === "en" ? "+ Ellipse" : "+ Elipse"}
        </button>
      </div>

      <div className="mt-4 space-y-4 max-h-[min(52vh,420px)] overflow-y-auto pr-1">
        {templateRows.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.42)]">
              {lg === "en" ? "Leonix template" : "Plantilla Leonix"}
            </p>
            <p className="mb-2 text-[10px] text-[rgba(255,255,255,0.35)]">
              {lg === "en"
                ? "Text blocks: click to edit on canvas. Logo: use logo section. Order vs studio layers is by z (see numbers)."
                : "Bloques de texto: clic para editar en la vista. Logo: sección de logo. El orden frente a estudio es por z."}
            </p>
            <ul className="space-y-1.5">{templateRows.map((r) => renderRow(r))}</ul>
          </div>
        ) : null}

        {studioRows.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.55)]">
              {lg === "en" ? "Studio (your additions)" : "Estudio (tus añadidos)"}
            </p>
            <ul className="space-y-1.5">{studioRows.map((r) => renderRow(r))}</ul>
          </div>
        ) : (
          <p className="text-[11px] text-[rgba(255,255,255,0.35)]">
            {lg === "en" ? "No studio layers yet — add an image or shape above." : "Aún no hay capas de estudio — añade imagen o forma arriba."}
          </p>
        )}
      </div>

      {selectedNative ? (
        <BusinessCardDesignerV2NativeInspector
          lang={lg}
          side={side}
          selected={selectedNative}
          dispatch={dispatch}
          onDeleted={() => onSelectV2Native(null)}
        />
      ) : null}
    </section>
  );
}
