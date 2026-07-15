"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { AgenteIndividualResidencialFormState } from "../../../agente-individual/schema/agenteIndividualResidencialFormState";
import {
  Step01TipoAnuncio,
  Step02InformacionBasica,
  Step03Media,
} from "../../../agente-individual/sections/steps01-03";
import {
  Step04DetallesEsenciales,
  Step05Caracteristicas,
  Step06Descripcion,
  Step09ExtrasOpcionales,
} from "../../../agente-individual/sections/steps04-09";
import { useBrAgenteResidencialCopy } from "../../../agente-individual/application/BrAgenteResidencialLocaleContext";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../../brNegocioAdditionalInventoryDraft";
import {
  buildChildInventoryEditorState,
  buildLiveChildInventoryPreviewDraft,
  childInventoryDraftFromEditorState,
  childInventorySaveHasErrors,
  mergeChildEditorSessionWithDraft,
  mergeParentHubWithChildPropertyForEditor,
  pickChildPropertySlice,
  pickParentHubSlice,
  validateAgenteChildInventoryForSave,
} from "../../brNegocioChildInventoryFormMapping";
import {
  applyBrChildMediaDisplayFieldsToSlice,
  hydrateBrChildMediaCanonical,
} from "../../brNegocioChildMediaCanonical";
import { BrNegocioChildInventoryInheritedHubPanel, BrNegocioChildInventoryInheritedSummary } from "./BrNegocioChildInventoryInheritedHubPanel";
import { BrNegocioChildInventoryInheritedContactPanel } from "./BrNegocioChildInventoryInheritedContactPanel";
import { BrNegocioChildInventoryFullPreviewOverlay } from "./BrNegocioChildInventoryFullPreviewOverlay";
import { mapAdditionalDraftToInventoryCard, applyLiveEditorPhotosToInventoryCard } from "../../brNegocioInventoryCardModel";
import { BrNegocioPrePublishInventoryCard } from "./BrNegocioPrePublishInventoryCard";
import {
  childEditorSessionFromState,
  childSessionMatchesEditor,
  clearChildInventoryEditorSession,
  loadChildInventoryEditorSessionResolved,
  persistChildInventoryEditorSession,
  persistChildInventoryEditorSessionResolved,
  resolveChildEditorMediaId,
} from "../../brNegocioChildInventoryEditorSession";
import { mergeChildInventoryWithMediaBridge } from "../../brNegocioInventoryDraftPersistence";
import { channelLabelForInventoryCard } from "../../brNegocioInventoryChildContext";
import { brShouldIgnoreWizardShortcut } from "../../brWizardKeyboard";

type ChildInventorySaveMode = "close" | "addAnother" | "goToParentPreview";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: BrNegocioPrePublishInventoryLang;
  parentHubSnapshot: AgenteIndividualResidencialFormState;
  /** Full parent form for sibling preview cards. */
  parentFullState?: AgenteIndividualResidencialFormState;
  editingId: string | null;
  initialDraft: BrNegocioAdditionalInventoryPropertyDraft | null;
  /** Locked channel for new children (from inventory selector). Edit uses draft channel. */
  preferredCategoria?: BrNegocioCategoriaPropiedad | null;
  onSave: (draft: BrNegocioAdditionalInventoryPropertyDraft, mode: ChildInventorySaveMode) => void;
  onGoToParentPreview?: () => void;
};

const CHILD_STEP_LABELS_ES = [
  "Tipo de anuncio",
  "Información básica",
  "Fotos y medios",
  "Detalles esenciales",
  "Características destacadas",
  "Descripción",
  "Información profesional (heredada)",
  "Contacto y destinos (heredados)",
  "Extras opcionales",
  "Vista previa y guardar",
] as const;

const CHILD_STEP_LABELS_EN = [
  "Listing type",
  "Basic information",
  "Photos and media",
  "Essential details",
  "Highlighted features",
  "Description",
  "Professional info (inherited)",
  "Contact and destinations (inherited)",
  "Optional extras",
  "Preview and save",
] as const;

function childSliceHasPhotos(slice: { fotosDataUrls?: string[] } | null | undefined): boolean {
  return (slice?.fotosDataUrls ?? []).some((u) => String(u ?? "").trim().length > 0);
}

/** BR-INV-FIX-01D — full Agente property application for child inventory (save only, no publish). */
export function BrNegocioChildInventoryFullApplication({
  open,
  onClose,
  lang,
  parentHubSnapshot,
  parentFullState,
  editingId,
  initialDraft,
  preferredCategoria = null,
  onSave,
  onGoToParentPreview,
}: Props) {
  const { t } = useBrAgenteResidencialCopy();
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const parentHubRef = useRef(pickParentHubSlice(parentHubSnapshot));
  const baselinePropertyRef = useRef("");
  const lockedChildCategoriaRef = useRef<BrNegocioCategoriaPropiedad | null>(null);
  const [step, setStep] = useState(0);
  const [state, setStateRaw] = useState<AgenteIndividualResidencialFormState>(() =>
    buildChildInventoryEditorState(parentHubRef.current, initialDraft, lang, {
      preferredCategoria,
    }),
  );
  const [errors, setErrors] = useState<ReturnType<typeof validateAgenteChildInventoryForSave>>({});
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);
  const [idbResolvedSlice, setIdbResolvedSlice] = useState<ReturnType<typeof pickChildPropertySlice> | null>(null);

  const stepLabels = lang === "en" ? CHILD_STEP_LABELS_EN : CHILD_STEP_LABELS_ES;
  const total = stepLabels.length;
  /** Stable inventory draft id for IDB/session — not the nullable `editingId` edit-mode flag. */
  const childMediaId = resolveChildEditorMediaId(editingId, initialDraft?.id ?? null, null);

  async function hydrateChildEditorMediaIntoState(
    nextState: AgenteIndividualResidencialFormState,
  ): Promise<AgenteIndividualResidencialFormState> {
    const slice = pickChildPropertySlice(nextState);
    const images = await hydrateBrChildMediaCanonical({
      childId: childMediaId || initialDraft?.id || "child",
      fotosDataUrls: slice.fotosDataUrls,
      fotoPortadaIndex: slice.fotoPortadaIndex,
      photoUrls: initialDraft?.photoUrls,
      mainPhotoUrl: initialDraft?.mainPhotoUrl,
      primaryPhotoIndex: initialDraft?.primaryPhotoIndex,
    });
    if (!images.length) return nextState;
    const withDisplay = applyBrChildMediaDisplayFieldsToSlice(slice, images);
    return mergeParentHubWithChildPropertyForEditor(parentHubRef.current, withDisplay);
  }

  useEffect(() => {
    if (!open) return;
    parentHubRef.current = pickParentHubSlice(parentHubSnapshot);
    let cancelled = false;
    void loadChildInventoryEditorSessionResolved().then((session) => {
      if (cancelled) return;
      const hydratedDraft = initialDraft
        ? mergeChildInventoryWithMediaBridge([initialDraft])[0] ?? initialDraft
        : null;
      let bootState: AgenteIndividualResidencialFormState;
      // Match reserved new-child draft id OR saved editingId (never require editingId === null sentinel).
      if (session && childSessionMatchesEditor(session, editingId, initialDraft?.id ?? null)) {
        if (hydratedDraft) {
          bootState = buildChildInventoryEditorState(
            parentHubRef.current,
            mergeChildEditorSessionWithDraft(session.propertyForm, hydratedDraft),
            lang,
          );
        } else {
          bootState = mergeParentHubWithChildPropertyForEditor(parentHubRef.current, session.propertyForm);
        }
        setStep(Math.min(session.step, total - 1));
      } else {
        bootState = buildChildInventoryEditorState(parentHubRef.current, hydratedDraft, lang, {
          preferredCategoria,
        });
        setStep(0);
      }
      // Lock channel: new child uses selector choice; existing draft keeps its stored channel.
      if (preferredCategoria && !hydratedDraft?.propertyForm?.categoriaPropiedad) {
        bootState = { ...bootState, categoriaPropiedad: preferredCategoria };
      }
      lockedChildCategoriaRef.current = bootState.categoriaPropiedad;
      setStateRaw(bootState);
      baselinePropertyRef.current = JSON.stringify(pickChildPropertySlice(bootState));
      void hydrateChildEditorMediaIntoState(bootState).then((hydrated) => {
        if (cancelled) return;
        setStateRaw(hydrated);
        setIdbResolvedSlice(pickChildPropertySlice(hydrated));
        baselinePropertyRef.current = JSON.stringify(pickChildPropertySlice(hydrated));
      });
      setErrors({});
      setFullPreviewOpen(false);
    });
    return () => {
      cancelled = true;
    };
    // Intentionally omit parentHubSnapshot identity churn — hub text updates must not wipe child media boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable child media id + open/editing only
  }, [open, editingId, childMediaId, initialDraft?.id, lang, total, preferredCategoria]);

  const isDirty = useCallback(() => {
    return JSON.stringify(pickChildPropertySlice(state)) !== baselinePropertyRef.current;
  }, [state]);

  const setState = useCallback<Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>>(
    (updater) => {
      setStateRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const slice = pickChildPropertySlice(next);
        const locked = lockedChildCategoriaRef.current;
        return mergeParentHubWithChildPropertyForEditor(parentHubRef.current, {
          ...slice,
          ...(locked ? { categoriaPropiedad: locked } : {}),
        });
      });
    },
    [],
  );

  const confirmClose = useCallback(
    (action: () => void) => {
      if (!isDirty() || window.confirm(copy.unsavedCloseConfirm)) action();
    },
    [copy.unsavedCloseConfirm, isDirty],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (brShouldIgnoreWizardShortcut(e)) return;
      e.preventDefault();
      confirmClose(() => {
        clearChildInventoryEditorSession();
        setErrors({});
        onClose();
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirmClose, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !childMediaId) return;
    const hasRawPhotos = (state.fotosDataUrls ?? []).some((u) => String(u ?? "").startsWith("data:"));
    const delay = hasRawPhotos ? 0 : 400;
    const timer = setTimeout(() => {
      persistChildInventoryEditorSession(
        childEditorSessionFromState(editingId, step, state, initialDraft?.id ?? null),
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [open, editingId, childMediaId, initialDraft?.id, step, state]);

  /** Hard refresh while child drawer is open — kick durable child session write (never MAIN_PHOTO). */
  useEffect(() => {
    if (!open || !childMediaId) return;
    const onPageHide = () => {
      void persistChildInventoryEditorSessionResolved(
        childEditorSessionFromState(editingId, step, state, initialDraft?.id ?? null),
      );
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [open, childMediaId, editingId, step, state, initialDraft?.id]);

  useEffect(() => {
    if (!open || !childMediaId) {
      setIdbResolvedSlice(null);
      return;
    }
    const slice = pickChildPropertySlice(state);
    const hasUnresolved = (slice.fotosDataUrls ?? []).some((u) => String(u ?? "").startsWith("__LX_BR_AGENTE_IDB__"));
    if (!hasUnresolved) {
      setIdbResolvedSlice(slice);
      return;
    }
    let cancelled = false;
    void hydrateBrChildMediaCanonical({
      childId: childMediaId,
      fotosDataUrls: slice.fotosDataUrls,
      fotoPortadaIndex: slice.fotoPortadaIndex,
    }).then((images) => {
      if (cancelled || !images.length) return;
      const withDisplay = applyBrChildMediaDisplayFieldsToSlice(slice, images);
      setIdbResolvedSlice(withDisplay);
      setStateRaw((prev) => {
        const prevSlice = pickChildPropertySlice(prev);
        if (!(prevSlice.fotosDataUrls ?? []).some((u) => String(u ?? "").startsWith("__LX_BR_AGENTE_IDB__"))) {
          return prev;
        }
        return mergeParentHubWithChildPropertyForEditor(parentHubRef.current, withDisplay);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [open, state, childMediaId]);

  const previewStateForCard = useMemo(() => {
    if (!idbResolvedSlice) return state;
    return mergeParentHubWithChildPropertyForEditor(parentHubRef.current, idbResolvedSlice);
  }, [state, idbResolvedSlice]);

  /** Editor steps / cover gallery must render displayable URLs from the canonical collection. */
  const mediaFormState = previewStateForCard;

  const canonicalPreviewDraft = useMemo(
    () =>
      buildLiveChildInventoryPreviewDraft({
        parentHub: parentHubRef.current,
        state: previewStateForCard,
        initialDraft,
        lang,
      }),
    [previewStateForCard, initialDraft, lang],
  );

  const previewCard = useMemo(() => {
    const card = mapAdditionalDraftToInventoryCard(canonicalPreviewDraft, lang);
    return applyLiveEditorPhotosToInventoryCard(card, previewStateForCard);
  }, [canonicalPreviewDraft, previewStateForCard, lang]);

  const packageStateForPreview = useMemo(
    () =>
      parentFullState ?? {
        ...parentHubSnapshot,
        additionalInventoryProperties: [],
      },
    [parentFullState, parentHubSnapshot],
  );

  const openFullPreview = useCallback(() => {
    const nextErrors = validateAgenteChildInventoryForSave(state, lang);
    setErrors(nextErrors);
    if (childInventorySaveHasErrors(nextErrors)) return;
    void persistChildInventoryEditorSessionResolved(
      childEditorSessionFromState(editingId, step, state, initialDraft?.id ?? null),
    ).then(() => setFullPreviewOpen(true));
  }, [state, lang, editingId, step, initialDraft?.id]);

  const handleCancel = useCallback(() => {
    confirmClose(() => {
      clearChildInventoryEditorSession();
      setErrors({});
      onClose();
    });
  }, [confirmClose, onClose]);

  const attemptSave = useCallback(
    (mode: ChildInventorySaveMode) => {
      const nextErrors = validateAgenteChildInventoryForSave(state, lang);
      setErrors(nextErrors);
      if (childInventorySaveHasErrors(nextErrors)) return;
      void (async () => {
        // Final durable media commit before parent inventory card receives the draft.
        const committed = await persistChildInventoryEditorSessionResolved(
          childEditorSessionFromState(editingId, step, state, initialDraft?.id ?? null),
        );
        const stateForSave =
          committed.propertyForm && childSliceHasPhotos(committed.propertyForm)
            ? mergeParentHubWithChildPropertyForEditor(parentHubRef.current, committed.propertyForm)
            : state;
        const draft = childInventoryDraftFromEditorState(
          parentHubRef.current,
          stateForSave,
          initialDraft,
          lang,
        );
        // Clear before onSave/close: inventory shell restore effect reopens from session when drawer closes.
        clearChildInventoryEditorSession();
        onSave(draft, mode);
        baselinePropertyRef.current = JSON.stringify(pickChildPropertySlice(state));
        setFullPreviewOpen(false);
        if (mode === "close" || mode === "goToParentPreview") {
          setErrors({});
          onClose();
          if (mode === "goToParentPreview") onGoToParentPreview?.();
        } else {
          parentHubRef.current = pickParentHubSlice(parentHubSnapshot);
          setStateRaw(buildChildInventoryEditorState(parentHubRef.current, null, lang));
          baselinePropertyRef.current = JSON.stringify(
            pickChildPropertySlice(buildChildInventoryEditorState(parentHubRef.current, null, lang)),
          );
          setStep(0);
          setErrors({});
        }
      })();
    },
    [state, lang, editingId, step, initialDraft, onSave, onClose, parentHubSnapshot, onGoToParentPreview],
  );

  if (!open) return null;

  const title = editingId ? copy.drawerTitleEdit : copy.drawerTitle;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[#F6F0E2] text-[#2C2416]"
      role="dialog"
      aria-modal="true"
      data-br-child-inventory-app
      aria-labelledby="br-child-inventory-full-app-title"
    >
      <header className="shrink-0 border-b border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">
              {copy.sectionKicker}
            </p>
            <h2 id="br-child-inventory-full-app-title" className="truncate font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#5C5346]/88">{copy.fullAppExplain}</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-[44px] shrink-0 touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7]"
          >
            {copy.cancel}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 rounded-xl border border-[#C9B46A]/35 bg-[#FFF6E7] px-3 py-3 text-sm text-[#5C5346]">
            {copy.inheritedNotice}
          </div>
          <div className="mb-4 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#3D3428]">
            <span className="font-semibold">
              {lang === "en" ? "Property channel (locked): " : "Canal de propiedad (fijo): "}
            </span>
            {channelLabelForInventoryCard(state.categoriaPropiedad, lang === "en" ? "en" : "es")}
            <span className="mt-1 block text-xs text-[#7A7164]">
              {lang === "en"
                ? "Cancel and use Add property again to choose a different channel. This does not change the main listing."
                : "Cancela y usa Agregar propiedad otra vez para elegir otro canal. Esto no cambia el anuncio principal."}
            </span>
          </div>
          <div className="mb-4" data-br-child-step-nav>
            <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-2 shadow-sm">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{t.app.navPasos}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                {stepLabels.map((label, i) => (
                  <button
                    key={`child-m-${i}-${label}`}
                    type="button"
                    data-br-child-step={i}
                    onClick={() => setStep(i)}
                    className={
                      "min-h-[52px] w-[min(100%,9.5rem)] shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-snug transition touch-manipulation " +
                      (i === step
                        ? "border-[#C9B46A] bg-[#FFF0D4] text-[#6E5418] shadow-sm"
                        : "border-[#E8DFD0]/80 bg-white/90 text-[#5C5346] active:bg-white")
                    }
                  >
                    <span className="block text-[10px] font-bold tabular-nums opacity-70">
                      {i + 1}/{total}
                    </span>
                    <span className="line-clamp-2">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {step === 0 ? <Step01TipoAnuncio state={state} setState={setState} /> : null}
          {step === 1 ? <Step02InformacionBasica state={state} setState={setState} /> : null}
          {step === 2 ? (
            <Step03Media
              state={mediaFormState}
              setState={setState}
              onMediaDraftCommit={(next) => {
                void persistChildInventoryEditorSessionResolved(
                  childEditorSessionFromState(editingId, step, next, initialDraft?.id ?? null),
                );
              }}
            />
          ) : null}
          {step === 3 ? <Step04DetallesEsenciales state={state} setState={setState} /> : null}
          {step === 4 ? <Step05Caracteristicas state={state} setState={setState} /> : null}
          {step === 5 ? <Step06Descripcion state={state} setState={setState} /> : null}
          {step === 6 ? <BrNegocioChildInventoryInheritedHubPanel state={state} /> : null}
          {step === 7 ? <BrNegocioChildInventoryInheritedContactPanel state={state} /> : null}
          {step === 8 ? <Step09ExtrasOpcionales state={state} setState={setState} /> : null}
          {step === 9 ? (
            <section className="space-y-4 rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-sm sm:p-6">
              <div>
                <h3 className="text-lg font-bold text-[#1E1810]">{copy.previewSaveTitle}</h3>
                <p className="mt-1 text-sm text-[#5C5346]/88">{copy.previewSaveBody}</p>
              </div>

              <BrNegocioChildInventoryInheritedSummary state={state} lang={lang} />

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#B8954A]">
                  {lang === "es" ? "Vista previa de la propiedad" : "Property preview"}
                </p>
                <BrNegocioPrePublishInventoryCard card={previewCard} lang={lang} />
              </div>

              <button
                type="button"
                onClick={openFullPreview}
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-5 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8]"
              >
                {copy.previewThisProperty}
              </button>

              <div className="flex flex-col gap-2 border-t border-[#E8DFD0]/80 pt-4 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => attemptSave("close")}
                  className="min-h-[48px] w-full touch-manipulation rounded-2xl border border-[#C9B46A]/55 bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-3 text-sm font-bold text-[#1E1810] shadow-sm hover:opacity-95 sm:min-h-0 sm:flex-1"
                >
                  {copy.saveProperty}
                </button>
                <button
                  type="button"
                  onClick={() => attemptSave("addAnother")}
                  className="min-h-[48px] w-full touch-manipulation rounded-2xl border border-[#E8DFD0] bg-white px-5 py-3 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7] sm:min-h-0 sm:flex-1"
                >
                  {copy.saveAndAddAnother}
                </button>
                <button
                  type="button"
                  onClick={() => attemptSave("goToParentPreview")}
                  className="min-h-[48px] w-full touch-manipulation rounded-2xl border border-[#E8DFD0] bg-white px-5 py-3 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7] sm:min-h-0 sm:flex-1"
                >
                  {copy.saveAndGoToParentPreview}
                </button>
              </div>
            </section>
          ) : null}

          {errors.titulo || errors.precio || errors.ciudad || errors.direccionPais || errors.direccionEstado || errors.fotos ? (
            <div className="mt-4 rounded-xl border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]">
              <p className="font-semibold">{copy.validationSummary}</p>
              <ul className="mt-2 list-inside list-disc space-y-0.5">
                {errors.titulo ? <li>{errors.titulo}</li> : null}
                {errors.precio ? <li>{errors.precio}</li> : null}
                {errors.ciudad ? <li>{errors.ciudad}</li> : null}
                {errors.direccionPais ? <li>{errors.direccionPais}</li> : null}
                {errors.direccionEstado ? <li>{errors.direccionEstado}</li> : null}
                {errors.fotos ? <li>{errors.fotos}</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="shrink-0 border-t border-[#E8DFD0] bg-[#FAF7F2] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={step <= 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="min-h-[48px] rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] disabled:opacity-40 sm:min-h-0 sm:py-2.5"
          >
            {t.app.anterior}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {step < total - 1 ? (
              <button
                type="button"
                disabled={step >= total - 1}
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-5 py-3 text-sm font-semibold text-[#6E5418] disabled:opacity-40 sm:min-h-0 sm:w-auto sm:py-2.5"
              >
                {t.app.siguiente}
              </button>
            ) : null}
          </div>
        </div>
      </footer>

      {fullPreviewOpen ? (
        <BrNegocioChildInventoryFullPreviewOverlay
          open={fullPreviewOpen}
          onClose={() => setFullPreviewOpen(false)}
          lang={lang}
          parentHubSnapshot={parentHubSnapshot}
          childDraft={canonicalPreviewDraft}
          parentFullState={packageStateForPreview}
          context="childApplication"
          onEdit={() => setFullPreviewOpen(false)}
          onSaveAndReturnToParent={() => attemptSave("goToParentPreview")}
        />
      ) : null}
    </div>
  );
}
