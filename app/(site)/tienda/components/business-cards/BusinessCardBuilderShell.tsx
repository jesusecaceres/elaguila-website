"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getLeoAlternateTemplateId } from "../../product-configurators/business-cards/businessCardLeoScoring";
import type { Lang } from "../../types/tienda";
import type {
  BusinessCardDesignIntake,
  BusinessCardDocument,
  BusinessCardProductSlug,
  BusinessCardSide,
} from "../../product-configurators/business-cards/types";
import { createInitialBusinessCardDocument } from "../../product-configurators/business-cards/documentFactory";
import {
  businessCardBuilderReducer,
  type BusinessCardBuilderAction,
} from "../../product-configurators/business-cards/businessCardBuilderReducer";
import { validateBusinessCardDocument } from "../../product-configurators/business-cards/validation";
import { LOGO_MAX_MB } from "../../product-configurators/business-cards/constants";
import { businessCardConfigurePath, tiendaOrderPath, tiendaPublicContactPath, withLang } from "../../utils/tiendaRouting";
import {
  BC_UPLOAD_DRAFT_PREFIX,
  isBusinessCardSessionDesign,
  readBusinessCardSessionRaw,
} from "../../order/mappers/businessCardDocumentToReview";
import {
  buildSessionPayloadWithLogos,
  mergeVaultedLogosIntoDocument,
  mergeVaultedStudioImagesIntoDocument,
  writeSessionDesignDraft,
} from "../../product-configurators/business-cards/businessCardDraftPersistence";
import { hydrateBusinessCardDocumentFromSession } from "../../order/hydrateBusinessCardDocumentFromSession";
import {
  createDefaultNativeShape,
  nextDesignerV2NativeZIndex,
} from "../../product-configurators/business-cards/designer-v2/factories/nativeObjectDefaults";
import { cloneBusinessCardDocument } from "../../product-configurators/business-cards/businessCardDocumentClone";
import { businessCardActionIsPositionOnly } from "../../product-configurators/business-cards/businessCardHistoryPolicy";
import type { SnapGuideState } from "../../product-configurators/business-cards/preview/alignmentSnap";
import { clampPreviewDragPct } from "../../product-configurators/business-cards/preview/businessCardPreviewConstants";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";
import { BusinessCardPreview } from "./BusinessCardPreview";
import { BusinessCardEditorPanel } from "./BusinessCardEditorPanel";
import { BusinessCardContextualInspector } from "./editor/BusinessCardContextualInspector";
import { BusinessCardDesignerV2Panel } from "./BusinessCardDesignerV2Panel";
import { BusinessCardRefreshDesignPanel, type BusinessCardRebuildShortcutAction } from "./BusinessCardRefreshDesignPanel";
import { BusinessCardStudioToolbar } from "./BusinessCardStudioToolbar";
import { BusinessCardStudioSelectionToolbar } from "./BusinessCardStudioSelectionToolbar";
import { BusinessCardValidationPanel } from "./BusinessCardValidationPanel";
import { BusinessCardApprovalPanel } from "./BusinessCardApprovalPanel";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function BusinessCardBuilderShell(props: {
  productSlug: BusinessCardProductSlug;
  lang: Lang;
  designEntry: BusinessCardDesignIntake;
}) {
  const { productSlug, lang, designEntry } = props;
  const router = useRouter();
  const [doc, baseDispatch] = useReducer(businessCardBuilderReducer, undefined, () => {
    if (typeof window !== "undefined") {
      const raw = readBusinessCardSessionRaw(productSlug);
      const hydrated = raw ? hydrateBusinessCardDocumentFromSession(productSlug, raw, lang) : null;
      if (hydrated) return hydrated;
    }
    return createInitialBusinessCardDocument(productSlug, lang, { designIntake: designEntry });
  });
  const [selectedTextBlockId, setSelectedTextBlockId] = useState<string | null>(null);
  const [logoInspectorActive, setLogoInspectorActive] = useState(false);
  /** Studio layer selection — cleared on side switch, delete, template apply (see handlers), logo pick, LEO/custom CTAs. */
  const [selectedV2NativeId, setSelectedV2NativeId] = useState<string | null>(null);
  /** Native image id from the refresh flow (for quick opacity helpers). */
  const [refreshSeedId, setRefreshSeedId] = useState<string | null>(null);
  const [sessionDraftError, setSessionDraftError] = useState<string | null>(null);
  /** Card = templates + fields + logo; Studio = native layers stack */
  const [workspaceTab, setWorkspaceTab] = useState<"card" | "studio">("card");
  const [snapGuides, setSnapGuides] = useState<SnapGuideState | null>(null);
  const pastRef = useRef<BusinessCardDocument[]>([]);
  const futureRef = useRef<BusinessCardDocument[]>([]);
  const lastHistoryPosAtRef = useRef(0);
  const HISTORY_MAX = 60;
  const HISTORY_POS_THROTTLE_MS = 280;
  const [historyRevision, setHistoryRevision] = useState(0);

  const docRef = useRef(doc);
  docRef.current = doc;

  const dispatchWithHistory = useCallback(
    (action: BusinessCardBuilderAction) => {
      if (action.type === "RESET") {
        pastRef.current = [];
        futureRef.current = [];
        baseDispatch(action);
        setHistoryRevision((r) => r + 1);
        return;
      }
      const now = Date.now();
      const posOnly = businessCardActionIsPositionOnly(action);
      const shouldPush =
        !posOnly || now - lastHistoryPosAtRef.current >= HISTORY_POS_THROTTLE_MS;
      if (shouldPush) {
        if (posOnly) lastHistoryPosAtRef.current = now;
        pastRef.current.push(cloneBusinessCardDocument(docRef.current));
        if (pastRef.current.length > HISTORY_MAX) pastRef.current.shift();
        futureRef.current = [];
        setHistoryRevision((r) => r + 1);
      }
      baseDispatch(action);
    },
    [baseDispatch]
  );

  const clearCanvasSelection = useCallback(() => {
    setSelectedTextBlockId(null);
    setLogoInspectorActive(false);
    setSelectedV2NativeId(null);
  }, []);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(cloneBusinessCardDocument(docRef.current));
    if (futureRef.current.length > HISTORY_MAX) futureRef.current.shift();
    clearCanvasSelection();
    setSnapGuides(null);
    baseDispatch({ type: "RESET", document: prev });
    setHistoryRevision((r) => r + 1);
  }, [clearCanvasSelection]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(cloneBusinessCardDocument(docRef.current));
    if (pastRef.current.length > HISTORY_MAX) pastRef.current.shift();
    clearCanvasSelection();
    setSnapGuides(null);
    baseDispatch({ type: "RESET", document: next });
    setHistoryRevision((r) => r + 1);
  }, [clearCanvasSelection]);

  const canUndo = useMemo(() => pastRef.current.length > 0, [historyRevision, doc]);
  const canRedo = useMemo(() => futureRef.current.length > 0, [historyRevision, doc]);
  useEffect(() => {
    return () => {
      const d = docRef.current;
      [d.front.logo.previewUrl, d.back.logo.previewUrl].forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = readBusinessCardSessionRaw(productSlug);
      if (!raw) return;
      const base = hydrateBusinessCardDocumentFromSession(productSlug, raw, lang);
      if (!base) return;
      let next = base;
      if (isBusinessCardSessionDesign(raw) && raw.draftLogoVault) {
        next = await mergeVaultedLogosIntoDocument(productSlug, base, raw.draftLogoVault);
      }
      if (isBusinessCardSessionDesign(raw) && raw.draftStudioVault) {
        next = await mergeVaultedStudioImagesIntoDocument(productSlug, next, raw.draftStudioVault);
      }
      if (!cancelled) {
        pastRef.current = [];
        futureRef.current = [];
        baseDispatch({ type: "RESET", document: next });
        setHistoryRevision((r) => r + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productSlug, lang]);

  useEffect(() => {
    const sideState = doc.activeSide === "front" ? doc.front : doc.back;
    if (selectedTextBlockId && !sideState.textBlocks.some((b) => b.id === selectedTextBlockId)) {
      setSelectedTextBlockId(null);
    }
  }, [doc.activeSide, doc.front.textBlocks, doc.back.textBlocks, selectedTextBlockId]);

  useEffect(() => {
    const native = (doc.activeSide === "front" ? doc.front : doc.back).designerV2NativeObjects ?? [];
    if (selectedV2NativeId && !native.some((o) => o.id === selectedV2NativeId)) {
      setSelectedV2NativeId(null);
    }
  }, [doc.activeSide, doc.front.designerV2NativeObjects, doc.back.designerV2NativeObjects, selectedV2NativeId]);

  useEffect(() => {
    if (selectedV2NativeId) setWorkspaceTab("studio");
    else if (selectedTextBlockId || logoInspectorActive) setWorkspaceTab("card");
  }, [selectedTextBlockId, logoInspectorActive, selectedV2NativeId]);

  const validation = useMemo(() => validateBusinessCardDocument(doc), [doc]);

  const leoAlternateTemplateId = useMemo(
    () => (doc.designIntake === "leo" ? getLeoAlternateTemplateId(doc) : null),
    [doc]
  );

  const sideState = doc.activeSide === "front" ? doc.front : doc.back;
  const selectedBlock = useMemo(() => {
    if (!selectedTextBlockId) return null;
    return sideState.textBlocks.find((b) => b.id === selectedTextBlockId) ?? null;
  }, [sideState.textBlocks, selectedTextBlockId]);
  const selectedNative = useMemo(() => {
    if (!selectedV2NativeId) return null;
    const list = sideState.designerV2NativeObjects ?? [];
    return list.find((o) => o.id === selectedV2NativeId) ?? null;
  }, [sideState.designerV2NativeObjects, selectedV2NativeId]);

  const applyLogo = useCallback(
    (file: File | null) => {
      setSelectedV2NativeId(null);
      const side = doc.activeSide;
      const cur = side === "front" ? doc.front.logo : doc.back.logo;
      if (cur.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cur.previewUrl);
      }
      if (!file) {
        dispatchWithHistory({ type: "CLEAR_LOGO", side });
        return;
      }
      if (file.size > LOGO_MAX_MB * 1024 * 1024) {
        window.alert(
          lang === "en"
            ? `Logo must be under ${LOGO_MAX_MB} MB.`
            : `El logo debe ser menor a ${LOGO_MAX_MB} MB.`
        );
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        dispatchWithHistory({
          type: "SET_LOGO",
          side,
          payload: {
            file,
            previewUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          },
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        dispatchWithHistory({ type: "CLEAR_LOGO", side });
      };
      img.src = previewUrl;
    },
    [doc.activeSide, doc.front.logo, doc.back.logo, dispatchWithHistory]
  );

  const persistDraftToSession = useCallback(async (): Promise<boolean> => {
    try {
      const frontLogo = doc.front.logo.file ? await readAsDataUrl(doc.front.logo.file) : doc.front.logo.previewUrl;
      const backLogo = doc.back.logo.file ? await readAsDataUrl(doc.back.logo.file) : doc.back.logo.previewUrl;
      const payload = await buildSessionPayloadWithLogos(
        doc,
        { front: frontLogo, back: backLogo },
        {
          frontFileName: doc.front.logo.file?.name,
          backFileName: doc.back.logo.file?.name,
        }
      );
      const w = writeSessionDesignDraft(doc.productSlug, payload);
      if (!w.ok) return false;
      sessionStorage.removeItem(`${BC_UPLOAD_DRAFT_PREFIX}${doc.productSlug}`);
      return true;
    } catch {
      return false;
    }
  }, [doc]);

  const continueToOrderDetails = useCallback(async () => {
    setSessionDraftError(null);
    const ok = await persistDraftToSession();
    if (!ok) {
      setSessionDraftError(
        lang === "en"
          ? "Could not save draft. Storage may be full or the logo is too large. Try a smaller logo, clear site data for this origin, or remove the logo and add it again after checkout notes."
          : "No se pudo guardar el borrador. El almacenamiento puede estar lleno o el logo es muy grande. Prueba un logo más pequeño, borra datos del sitio, o quita el logo y vuelve a subirlo después."
      );
      return;
    }
    router.push(withLang(tiendaOrderPath("business-cards", productSlug), lang));
  }, [persistDraftToSession, lang, router, productSlug]);

  const dispatchTyped = dispatchWithHistory as (a: BusinessCardBuilderAction) => void;

  const onStudioSideChange = useCallback((s: BusinessCardSide) => {
    setSelectedTextBlockId(null);
    setLogoInspectorActive(false);
    setSelectedV2NativeId(null);
    dispatchWithHistory({ type: "SET_ACTIVE_SIDE", side: s });
  }, [dispatchWithHistory]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target;
      if (el instanceof HTMLElement && el.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearCanvasSelection();
        setSnapGuides(null);
        return;
      }
      const step = e.shiftKey ? 2 : 0.5;
      const side = doc.activeSide;
      const nudge = (dx: number, dy: number) => {
        if (selectedV2NativeId && selectedNative && !selectedNative.locked) {
          e.preventDefault();
          dispatchTyped({
            type: "V2_PATCH_NATIVE_OBJECT",
            side,
            id: selectedV2NativeId,
            patch: {
              xPct: clampPreviewDragPct(selectedNative.xPct + dx),
              yPct: clampPreviewDragPct(selectedNative.yPct + dy),
            },
          });
          return true;
        }
        if (logoInspectorActive && sideState.logo.previewUrl) {
          e.preventDefault();
          dispatchTyped({
            type: "SET_LOGO_GEOM",
            side,
            patch: {
              xPct: clampPreviewDragPct(sideState.logoGeom.xPct + dx),
              yPct: clampPreviewDragPct(sideState.logoGeom.yPct + dy),
            },
          });
          return true;
        }
        if (selectedTextBlockId && selectedBlock) {
          e.preventDefault();
          dispatchTyped({
            type: "SET_TEXT_BLOCK",
            side,
            id: selectedTextBlockId,
            patch: {
              xPct: clampPreviewDragPct(selectedBlock.xPct + dx),
              yPct: clampPreviewDragPct(selectedBlock.yPct + dy),
            },
          });
          return true;
        }
        return false;
      };
      if (e.key === "ArrowLeft") {
        nudge(-step, 0);
        return;
      }
      if (e.key === "ArrowRight") {
        nudge(step, 0);
        return;
      }
      if (e.key === "ArrowUp") {
        nudge(0, -step);
        return;
      }
      if (e.key === "ArrowDown") {
        nudge(0, step);
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        if (selectedV2NativeId && selectedNative) {
          e.preventDefault();
          const newId = `nv2d-${Date.now().toString(36)}`;
          dispatchTyped({ type: "V2_DUPLICATE_NATIVE_OBJECT", side, id: selectedV2NativeId, newId });
          setSelectedV2NativeId(newId);
        } else if (selectedTextBlockId && selectedBlock?.role === "custom") {
          e.preventDefault();
          const newId = `c-${Date.now().toString(36)}`;
          dispatchTyped({
            type: "DUPLICATE_CUSTOM_TEXT_BLOCK",
            side,
            sourceId: selectedTextBlockId,
            newId,
            lang,
          });
          setSelectedTextBlockId(newId);
          setLogoInspectorActive(false);
          setSelectedV2NativeId(null);
        }
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedV2NativeId) {
          e.preventDefault();
          dispatchTyped({ type: "V2_DELETE_NATIVE_OBJECT", side, id: selectedV2NativeId });
          setSelectedV2NativeId(null);
          return;
        }
        if (selectedTextBlockId && selectedBlock?.role === "custom") {
          e.preventDefault();
          dispatchTyped({ type: "REMOVE_TEXT_BLOCK", side, id: selectedTextBlockId });
          setSelectedTextBlockId(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    undo,
    redo,
    clearCanvasSelection,
    selectedV2NativeId,
    selectedNative,
    logoInspectorActive,
    selectedTextBlockId,
    selectedBlock,
    doc.activeSide,
    sideState.logoGeom,
    sideState.logo.previewUrl,
    dispatchTyped,
    lang,
  ]);

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="mb-6">
          <Link
            href={withLang(`/tienda/p/${productSlug}`, lang)}
            className="text-sm font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)]"
          >
            {bcPick(businessCardBuilderCopy.backToProduct, lang)}
          </Link>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
            {bcPick(businessCardBuilderCopy.pageTitle, lang)}
          </h1>
          <p className="mt-1 text-sm text-[rgba(255,255,255,0.62)]">
            {lang === "en"
              ? "Premium 3.5″×2″ cards — Studio submits a reference render; print-ready upload is the separate final-file path."
              : "Tarjetas 3.5″×2″ premium — Studio envía un render de referencia; la subida lista para imprenta es otro camino de archivo final."}
          </p>
        </div>

        <div className="mb-4">
          <BusinessCardStudioToolbar
            lang={lang}
            doc={doc}
            activeSide={doc.activeSide}
            guidesVisible={doc.guidesVisible}
            onSideChange={onStudioSideChange}
            onToggleGuides={() => dispatchWithHistory({ type: "TOGGLE_GUIDES" })}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            selectionChrome={
              <BusinessCardStudioSelectionToolbar
                lang={lang}
                side={doc.activeSide}
                sideState={sideState}
                dispatch={dispatchTyped}
                selectedTextBlockId={selectedTextBlockId}
                selectedBlock={selectedBlock}
                logoInspectorActive={logoInspectorActive}
                selectedV2NativeId={selectedV2NativeId}
                selectedNative={selectedNative}
              />
            }
          />
        </div>

        <p className="mb-4 text-[11px] leading-relaxed text-[rgba(255,255,255,0.48)] max-w-3xl">
          {bcPick(businessCardBuilderCopy.builderSessionTrustLine, lang)}
        </p>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-3 sm:px-5 sm:py-4 mb-2">
          <p className="text-sm text-[rgba(255,255,255,0.75)]">
            {doc.designIntake === "custom"
              ? bcpPick(businessCardProductCopy.designIntakeCustomHint, lang)
              : doc.designIntake === "leo"
                ? bcpPick(businessCardProductCopy.designIntakeLeoHint, lang)
                : doc.designIntake === "refresh"
                  ? bcpPick(businessCardProductCopy.designIntakeRefreshHint, lang)
                  : bcpPick(businessCardProductCopy.designIntakeTemplateHint, lang)}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {doc.designIntake === "leo" && leoAlternateTemplateId ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTextBlockId(null);
                  setLogoInspectorActive(false);
                  setSelectedV2NativeId(null);
                  dispatchTyped({ type: "APPLY_TEMPLATE", templateId: leoAlternateTemplateId, lang });
                }}
                className="text-left text-sm font-semibold rounded-full border border-[rgba(201,168,74,0.35)] px-4 py-2 text-[rgba(255,247,226,0.92)] hover:bg-[rgba(201,168,74,0.12)] transition-colors"
              >
                {bcPick(businessCardBuilderCopy.tryAnotherLook, lang)}
              </button>
            ) : null}
            {doc.designIntake === "template" || doc.designIntake === "leo" || doc.designIntake === "refresh" ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedTextBlockId(null);
                  setLogoInspectorActive(false);
                  setSelectedV2NativeId(null);
                  dispatchWithHistory({ type: "SET_DESIGN_INTAKE", designIntake: "custom" });
                }}
                className="text-sm font-semibold text-[rgba(201,168,74,0.95)] underline-offset-4 hover:underline"
              >
                {bcpPick(businessCardProductCopy.switchToCustomCta, lang)}
              </button>
            ) : null}
          </div>
        </div>

        <BusinessCardRefreshDesignPanel
          lang={lang}
          doc={doc}
          dispatch={dispatchTyped}
          onSelectV2Native={setSelectedV2NativeId}
          onClearTemplateSelection={() => {
            setSelectedTextBlockId(null);
            setLogoInspectorActive(false);
          }}
          onSkipToCustomBuilder={() => {
            setSelectedV2NativeId(null);
            setRefreshSeedId(null);
            dispatchTyped({ type: "SET_DESIGN_INTAKE", designIntake: "custom" });
          }}
          refreshSeedId={refreshSeedId}
          onRefreshSeedPlaced={setRefreshSeedId}
          onRebuildShortcut={(action: BusinessCardRebuildShortcutAction) => {
            const side = doc.activeSide;
            const sideState = side === "front" ? doc.front : doc.back;
            if (action === "open-studio-tab") {
              setWorkspaceTab("studio");
              return;
            }
            if (action === "side-front") {
              dispatchTyped({ type: "SET_ACTIVE_SIDE", side: "front" });
              return;
            }
            if (action === "side-back") {
              dispatchTyped({ type: "SET_ACTIVE_SIDE", side: "back" });
              return;
            }
            if (action === "add-text-line") {
              const id = `c-${Date.now().toString(36)}`;
              dispatchTyped({ type: "ADD_CUSTOM_TEXT_BLOCK", side, lang, blockId: id });
              setWorkspaceTab("card");
              setSelectedTextBlockId(id);
              setLogoInspectorActive(false);
              setSelectedV2NativeId(null);
              return;
            }
            if (action === "add-shape") {
              const id = `nv2s-${Date.now().toString(36)}`;
              const z = nextDesignerV2NativeZIndex(sideState);
              dispatchTyped({
                type: "V2_ADD_NATIVE_SHAPE",
                side,
                object: createDefaultNativeShape({ id, zIndex: z }),
              });
              setWorkspaceTab("studio");
              setSelectedV2NativeId(id);
              setSelectedTextBlockId(null);
              setLogoInspectorActive(false);
              return;
            }
            if (action === "toggle-lock" && refreshSeedId) {
              const seed =
                (doc.front.designerV2NativeObjects ?? []).find((o) => o.id === refreshSeedId) ??
                (doc.back.designerV2NativeObjects ?? []).find((o) => o.id === refreshSeedId) ??
                null;
              if (!seed) return;
              const patchSide = (doc.front.designerV2NativeObjects ?? []).some((o) => o.id === refreshSeedId)
                ? "front"
                : "back";
              dispatchTyped({
                type: "V2_PATCH_NATIVE_OBJECT",
                side: patchSide,
                id: refreshSeedId,
                patch: { locked: !seed.locked },
              });
            }
          }}
        />

        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px] xl:grid-rows-[auto_minmax(0,1fr)]">
          <div
            className={[
              "order-1 min-w-0 xl:order-2 xl:col-start-1 xl:row-start-2",
              "max-xl:sticky max-xl:top-14 max-xl:z-20 max-xl:-mx-4 max-xl:px-4 max-xl:pb-3",
              "max-xl:border-b max-xl:border-[rgba(255,255,255,0.1)] max-xl:bg-[#070708]/95 max-xl:backdrop-blur-md max-xl:shadow-[0_12px_32px_rgba(0,0,0,0.55)]",
              "xl:relative xl:top-auto xl:z-auto xl:mx-0 xl:border-0 xl:bg-transparent xl:shadow-none xl:backdrop-blur-none",
            ].join(" ")}
          >
            <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.82)] max-xl:pt-1">
              {bcPick(businessCardBuilderCopy.previewTitle, lang)}
            </h2>
            <p className="mt-1.5 max-w-xl text-[11px] leading-relaxed text-[rgba(255,255,255,0.48)]">
              {bcPick(businessCardBuilderCopy.studioPreviewDisclaimer, lang)}
            </p>
            <p className="mt-2 hidden max-xl:block text-[11px] text-[rgba(201,168,74,0.85)]">
              {lang === "en"
                ? "Preview stays pinned while you scroll — adjust fields below without losing sight of the card."
                : "La vista previa permanece fija al desplazar: editas abajo sin perder la tarjeta de vista."}
            </p>
            <div className="mt-4 flex justify-center max-xl:mt-3">
              <div className="w-full max-w-[min(100%,560px)] origin-top scale-[1.02] sm:scale-105 max-xl:max-h-[min(38vh,300px)] max-xl:scale-[0.92]">
                <BusinessCardPreview
                  document={doc}
                  side={doc.activeSide}
                  lang={lang}
                  snapGuidesOverlay={snapGuides}
                  editInteraction={{
                    selectedTextBlockId,
                    logoSelected: logoInspectorActive,
                    selectedV2NativeId,
                    onSelectTextBlock: (id) => {
                      setSelectedTextBlockId(id);
                      setLogoInspectorActive(false);
                      setSelectedV2NativeId(null);
                    },
                    onDeselectCanvas: () => {
                      setSelectedTextBlockId(null);
                      setLogoInspectorActive(false);
                      setSelectedV2NativeId(null);
                    },
                    onFocusLogo: () => {
                      setLogoInspectorActive(true);
                      setSelectedTextBlockId(null);
                      setSelectedV2NativeId(null);
                    },
                    onSelectV2Native: (id) => {
                      setSelectedV2NativeId(id);
                      if (id) {
                        setSelectedTextBlockId(null);
                        setLogoInspectorActive(false);
                      }
                    },
                    onMoveV2Native: (id, xPct, yPct) =>
                      dispatchTyped({ type: "V2_PATCH_NATIVE_OBJECT", side: doc.activeSide, id, patch: { xPct, yPct } }),
                    onPatchV2Native: (id, patch) =>
                      dispatchTyped({ type: "V2_PATCH_NATIVE_OBJECT", side: doc.activeSide, id, patch }),
                    transformInteraction: true,
                    onMoveTextBlock: (id, xPct, yPct) =>
                      dispatchTyped({ type: "SET_TEXT_BLOCK", side: doc.activeSide, id, patch: { xPct, yPct } }),
                    onPatchTextBlock: (id, patch) =>
                      dispatchTyped({ type: "SET_TEXT_BLOCK", side: doc.activeSide, id, patch }),
                    onMoveLogo: (xPct, yPct) =>
                      dispatchTyped({ type: "SET_LOGO_GEOM", side: doc.activeSide, patch: { xPct, yPct } }),
                    onPatchLogoGeom: (patch) =>
                      dispatchTyped({ type: "SET_LOGO_GEOM", side: doc.activeSide, patch }),
                    onSnapGuidesChange: setSnapGuides,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="order-2 min-w-0 xl:order-1 xl:col-span-2 xl:row-start-1">
            <BusinessCardContextualInspector
              lang={lang}
              doc={doc}
              side={doc.activeSide}
              dispatch={dispatchTyped}
              selectedTextBlockId={selectedTextBlockId}
              onSelectTextBlock={(id) => {
                setSelectedTextBlockId(id);
                setLogoInspectorActive(false);
                setSelectedV2NativeId(null);
              }}
              logoInspectorActive={logoInspectorActive}
              selectedV2NativeId={selectedV2NativeId}
              onSelectV2Native={setSelectedV2NativeId}
              onClearTemplateSelection={() => {
                setSelectedTextBlockId(null);
                setLogoInspectorActive(false);
              }}
            />
          </div>

          <div className="order-3 min-w-0 border-t border-[rgba(255,255,255,0.08)] pt-4 max-xl:mt-1 xl:border-t-0 xl:pt-0 xl:order-3 xl:col-start-2 xl:row-start-2 xl:sticky xl:top-24 self-start xl:max-h-[calc(100vh-6rem)] flex flex-col min-h-0">
            <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-1.5 flex gap-1 shrink-0 touch-manipulation">
              <button
                type="button"
                onClick={() => setWorkspaceTab("card")}
                className={[
                  "flex-1 min-h-[48px] rounded-xl px-3 py-2.5 text-sm font-semibold transition touch-manipulation",
                  workspaceTab === "card"
                    ? "bg-[rgba(201,168,74,0.22)] text-[rgba(255,247,226,0.98)] ring-1 ring-[rgba(201,168,74,0.35)]"
                    : "text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.06)]",
                ].join(" ")}
              >
                {bcPick(businessCardBuilderCopy.workspaceTabContent, lang)}
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceTab("studio")}
                className={[
                  "flex-1 min-h-[48px] rounded-xl px-3 py-2.5 text-sm font-semibold transition touch-manipulation",
                  workspaceTab === "studio"
                    ? "bg-[rgba(201,168,74,0.22)] text-[rgba(255,247,226,0.98)] ring-1 ring-[rgba(201,168,74,0.35)]"
                    : "text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.06)]",
                ].join(" ")}
              >
                {bcPick(businessCardBuilderCopy.workspaceTabStudio, lang)}
              </button>
            </div>
            <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1 -mr-1 pb-2">
              {workspaceTab === "card" ? (
                <BusinessCardEditorPanel
                  lang={lang}
                  doc={doc}
                  side={doc.activeSide}
                  dispatch={dispatchTyped}
                  onPickLogo={applyLogo}
                  selectedTextBlockId={selectedTextBlockId}
                  onSelectTextBlock={(id) => {
                    setSelectedTextBlockId(id);
                    setLogoInspectorActive(false);
                    setSelectedV2NativeId(null);
                  }}
                  onClearStudioNativeSelection={() => setSelectedV2NativeId(null)}
                />
              ) : (
                <BusinessCardDesignerV2Panel
                  lang={lang}
                  doc={doc}
                  side={doc.activeSide}
                  dispatch={dispatchTyped}
                  selectedV2NativeId={selectedV2NativeId}
                  onSelectV2Native={setSelectedV2NativeId}
                  selectedTextBlockId={selectedTextBlockId}
                  logoInspectorActive={logoInspectorActive}
                  onSelectTextBlock={(id) => {
                    setSelectedTextBlockId(id);
                    setLogoInspectorActive(false);
                    setSelectedV2NativeId(null);
                  }}
                  onFocusLogo={() => {
                    setLogoInspectorActive(true);
                    setSelectedTextBlockId(null);
                    setSelectedV2NativeId(null);
                  }}
                  onClearTemplateSelection={() => {
                    setSelectedTextBlockId(null);
                    setLogoInspectorActive(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <BusinessCardValidationPanel lang={lang} result={validation} />
          <BusinessCardApprovalPanel
            lang={lang}
            approval={doc.approval}
            onChange={(patch) => dispatchWithHistory({ type: "SET_APPROVAL", patch })}
          />

          <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
            <h2 className="text-base font-semibold">{bcPick(businessCardBuilderCopy.nextTitle, lang)}</h2>
            {sessionDraftError ? (
              <p className="mt-3 rounded-xl border border-[rgba(220,80,80,0.45)] bg-[rgba(80,20,20,0.35)] px-4 py-3 text-sm text-[rgba(255,230,230,0.95)]" role="alert">
                {sessionDraftError}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)] max-w-2xl">
              {bcPick(businessCardBuilderCopy.nextBody, lang)}
            </p>
            {!validation.hasBlockingContentIssues && !validation.approvalComplete ? (
              <p className="mt-2 text-sm text-[rgba(201,168,74,0.85)]">
                {lang === "en"
                  ? "Complete the checklist above to enable save draft & continue."
                  : "Completa la lista de verificación para activar guardar borrador y continuar."}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={!validation.canContinue}
                onClick={() => void continueToOrderDetails()}
                className={[
                  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition",
                  validation.canContinue
                    ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95 shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
                    : "bg-white/10 text-white/40 cursor-not-allowed",
                ].join(" ")}
              >
                {bcPick(businessCardBuilderCopy.saveContinue, lang)}
              </button>
              <Link
                href={withLang(`/tienda/p/${productSlug}`, lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-6 py-3 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)]"
              >
                {lang === "en" ? "Edit product options" : "Opciones del producto"}
              </Link>
              <Link
                href={withLang(tiendaPublicContactPath(), lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(201,168,74,0.35)] px-6 py-3 text-sm font-semibold text-[rgba(255,247,226,0.88)]"
              >
                {lang === "en" ? "Order with Leonix" : "Pedir con Leonix"}
              </Link>
            </div>
          </section>

          <p className="text-[11px] text-[rgba(255,255,255,0.38)]">
            {lang === "en" ? "Builder URL:" : "URL del constructor:"}{" "}
            <span className="font-mono">{businessCardConfigurePath(productSlug)}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
