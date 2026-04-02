"use client";

import { useEffect, useRef } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import type { BusinessCardDocument } from "../../product-configurators/business-cards/types";
import { LOGO_MAX_MB } from "../../product-configurators/business-cards/constants";
import { compressStudioImageDataUrl } from "../../product-configurators/business-cards/designer-v2/utils/compressStudioImage";
import { createRefreshSeedNativeImage } from "../../product-configurators/business-cards/designer-v2/factories/nativeObjectDefaults";
import { clampNativeImageOpacity } from "../../product-configurators/business-cards/designer-v2/studio/geometryClamp";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";

/** Shell wires Studio tab, text/shape adds, side switch, and lock (vaulting-safe). */
export type BusinessCardRebuildShortcutAction =
  | "open-studio-tab"
  | "add-text-line"
  | "add-shape"
  | "toggle-lock"
  | "side-front"
  | "side-back";

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/**
 * Refresh flow: optional upload that seeds a native image, plus light post-import helpers (opacity).
 */
export function BusinessCardRefreshDesignPanel(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onSelectV2Native: (id: string | null) => void;
  onClearTemplateSelection: () => void;
  onSkipToCustomBuilder: () => void;
  refreshSeedId: string | null;
  onRefreshSeedPlaced: (id: string | null) => void;
  onRebuildShortcut?: (action: BusinessCardRebuildShortcutAction) => void;
}) {
  const {
    lang,
    doc,
    dispatch,
    onSelectV2Native,
    onClearTemplateSelection,
    onSkipToCustomBuilder,
    refreshSeedId,
    onRefreshSeedPlaced,
    onRebuildShortcut,
  } = props;
  const lg = lang === "en" ? "en" : "es";
  const fileRef = useRef<HTMLInputElement>(null);
  const side = doc.activeSide;

  const totalNatives =
    (doc.front.designerV2NativeObjects?.length ?? 0) + (doc.back.designerV2NativeObjects?.length ?? 0);
  const showUploadCard = doc.designIntake === "refresh" && totalNatives === 0;

  const seedObject =
    refreshSeedId != null
      ? (doc.front.designerV2NativeObjects ?? []).find((o) => o.id === refreshSeedId) ??
        (doc.back.designerV2NativeObjects ?? []).find((o) => o.id === refreshSeedId) ??
        null
      : null;

  useEffect(() => {
    if (refreshSeedId && !seedObject) {
      onRefreshSeedPlaced(null);
    }
  }, [refreshSeedId, seedObject, onRefreshSeedPlaced]);

  const showSeedHelpers =
    Boolean(refreshSeedId && seedObject && seedObject.kind === "native-image" && doc.designIntake === "refresh");

  const onPick = async (file: File | null) => {
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
    const obj = createRefreshSeedNativeImage({
      id,
      previewUrl: raw,
      naturalWidth: img.naturalWidth || null,
      naturalHeight: img.naturalHeight || null,
    });
    dispatch({ type: "V2_ADD_NATIVE_IMAGE", side, object: obj });
    onClearTemplateSelection();
    onSelectV2Native(id);
    onRefreshSeedPlaced(id);
  };

  const patchSeedOpacity = (opacity: number) => {
    if (!refreshSeedId || !seedObject || seedObject.kind !== "native-image") return;
    if (seedObject.locked) return;
    const patchSide: "front" | "back" = (doc.front.designerV2NativeObjects ?? []).some((o) => o.id === refreshSeedId)
      ? "front"
      : "back";
    dispatch({
      type: "V2_PATCH_NATIVE_OBJECT",
      side: patchSide,
      id: refreshSeedId,
      patch: { imageOpacity: clampNativeImageOpacity(opacity) },
    });
  };

  if (!showUploadCard && !showSeedHelpers) return null;

  return (
    <div className="mb-4 space-y-3">
      {showUploadCard ? (
        <section
          className="rounded-2xl border border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.08)] px-4 py-4 sm:px-5 sm:py-5"
          aria-labelledby="bc-refresh-panel-title"
        >
          <h2 id="bc-refresh-panel-title" className="text-sm font-semibold text-[rgba(255,247,226,0.95)]">
            {bcpPick(businessCardProductCopy.refreshPanelTitle, lang)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.72)]">
            {bcpPick(businessCardProductCopy.refreshPanelBody, lang)}
          </p>
          <p className="mt-2 text-xs leading-snug text-[rgba(255,255,255,0.48)]">
            {bcpPick(businessCardProductCopy.refreshPanelSideNote, lang)}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[color:var(--lx-gold)] px-5 py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-[0_12px_34px_rgba(201,168,74,0.22)] transition hover:brightness-95"
            >
              {bcpPick(businessCardProductCopy.refreshPanelCta, lang)}
            </button>
            <button
              type="button"
              onClick={onSkipToCustomBuilder}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] px-5 py-3 text-sm font-medium text-[rgba(255,247,226,0.85)] hover:bg-[rgba(255,255,255,0.06)]"
            >
              {bcpPick(businessCardProductCopy.refreshPanelSkip, lang)}
            </button>
          </div>
        </section>
      ) : null}

      {showSeedHelpers && seedObject && seedObject.kind === "native-image" ? (
        <section className="rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.2)] px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
            {bcpPick(businessCardProductCopy.refreshSeedHelperTitle, lang)}
          </p>
          <p className="mt-1 text-sm text-[rgba(255,255,255,0.75)]">{bcpPick(businessCardProductCopy.refreshSeedNextHint, lang)}</p>
          {seedObject.locked ? (
            <p className="mt-2 text-[11px] leading-snug text-[rgba(255,200,120,0.75)]">
              {bcpPick(businessCardProductCopy.refreshOpacityDisabledLocked, lang)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(seedObject.locked)}
              onClick={() => patchSeedOpacity(0.42)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
                (seedObject.imageOpacity ?? 1) <= 0.5
                  ? "border-[rgba(201,168,74,0.55)] bg-[rgba(201,168,74,0.15)] text-[rgba(255,247,226,0.95)]"
                  : "border-[rgba(255,255,255,0.18)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.06)]",
              ].join(" ")}
            >
              {bcpPick(businessCardProductCopy.refreshOpacityFaint, lang)}
            </button>
            <button
              type="button"
              disabled={Boolean(seedObject.locked)}
              onClick={() => patchSeedOpacity(1)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
                (seedObject.imageOpacity ?? 1) >= 0.95
                  ? "border-[rgba(201,168,74,0.55)] bg-[rgba(201,168,74,0.15)] text-[rgba(255,247,226,0.95)]"
                  : "border-[rgba(255,255,255,0.18)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.06)]",
              ].join(" ")}
            >
              {bcpPick(businessCardProductCopy.refreshOpacityFull, lang)}
            </button>
          </div>
          {onRebuildShortcut ? (
            <>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.75)]">
                {bcpPick(businessCardProductCopy.refreshRebuildShortcutsTitle, lang)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRebuildShortcut("open-studio-tab")}
                  className="rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)]"
                >
                  {bcpPick(businessCardProductCopy.refreshOpenStudioTab, lang)}
                </button>
                <button
                  type="button"
                  onClick={() => onRebuildShortcut("add-text-line")}
                  className="rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)]"
                >
                  {bcpPick(businessCardProductCopy.refreshAddTextLine, lang)}
                </button>
                <button
                  type="button"
                  onClick={() => onRebuildShortcut("add-shape")}
                  className="rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)]"
                >
                  {bcpPick(businessCardProductCopy.refreshAddShape, lang)}
                </button>
                <button
                  type="button"
                  onClick={() => onRebuildShortcut("toggle-lock")}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    seedObject.locked
                      ? "border-[rgba(201,168,74,0.55)] bg-[rgba(201,168,74,0.15)] text-[rgba(255,247,226,0.95)]"
                      : "border-[rgba(255,255,255,0.2)] text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)]",
                  ].join(" ")}
                >
                  {seedObject.locked
                    ? bcpPick(businessCardProductCopy.refreshUnlockReference, lang)
                    : bcpPick(businessCardProductCopy.refreshLockReference, lang)}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onRebuildShortcut("side-front")}
                  disabled={doc.activeSide === "front"}
                  className="rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-default disabled:opacity-40"
                >
                  {bcpPick(businessCardProductCopy.refreshWorkOnFront, lang)}
                </button>
                <button
                  type="button"
                  onClick={() => onRebuildShortcut("side-back")}
                  disabled={doc.activeSide === "back"}
                  className="rounded-full border border-[rgba(255,255,255,0.2)] px-3 py-1.5 text-xs font-semibold text-[rgba(255,247,226,0.9)] hover:bg-[rgba(255,255,255,0.06)] disabled:cursor-default disabled:opacity-40"
                >
                  {bcpPick(businessCardProductCopy.refreshWorkOnBack, lang)}
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
