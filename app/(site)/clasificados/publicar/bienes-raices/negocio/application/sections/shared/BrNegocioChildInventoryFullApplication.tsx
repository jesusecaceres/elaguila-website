"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
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
  childInventoryDraftFromEditorState,
  childInventorySaveHasErrors,
  mergeParentHubWithChildPropertyForEditor,
  pickChildPropertySlice,
  pickParentHubSlice,
  validateAgenteChildInventoryForSave,
} from "../../brNegocioChildInventoryFormMapping";
import { BrNegocioChildInventoryInheritedHubPanel } from "./BrNegocioChildInventoryInheritedHubPanel";
import { BrNegocioChildInventoryInheritedContactPanel } from "./BrNegocioChildInventoryInheritedContactPanel";
import { BrNegocioChildInventoryFullPreviewOverlay } from "./BrNegocioChildInventoryFullPreviewOverlay";
import { mapAdditionalDraftToInventoryCard } from "../../brNegocioInventoryCardModel";
import { BrNegocioPrePublishInventoryCard } from "./BrNegocioPrePublishInventoryCard";
import {
  childEditorSessionFromState,
  clearChildInventoryEditorSession,
  loadChildInventoryEditorSessionResolved,
  persistChildInventoryEditorSession,
} from "../../brNegocioChildInventoryEditorSession";
import { mergeChildInventoryWithMediaBridge } from "../../brNegocioInventoryDraftPersistence";

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

/** BR-INV-FIX-01D — full Agente property application for child inventory (save only, no publish). */
export function BrNegocioChildInventoryFullApplication({
  open,
  onClose,
  lang,
  parentHubSnapshot,
  parentFullState,
  editingId,
  initialDraft,
  onSave,
  onGoToParentPreview,
}: Props) {
  const { t } = useBrAgenteResidencialCopy();
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const parentHubRef = useRef(pickParentHubSlice(parentHubSnapshot));
  const baselinePropertyRef = useRef("");
  const [step, setStep] = useState(0);
  const [state, setStateRaw] = useState<AgenteIndividualResidencialFormState>(() =>
    buildChildInventoryEditorState(parentHubRef.current, initialDraft, lang),
  );
  const [errors, setErrors] = useState<ReturnType<typeof validateAgenteChildInventoryForSave>>({});
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  const stepLabels = lang === "en" ? CHILD_STEP_LABELS_EN : CHILD_STEP_LABELS_ES;
  const total = stepLabels.length;

  useEffect(() => {
    if (!open) return;
    parentHubRef.current = pickParentHubSlice(parentHubSnapshot);
    let cancelled = false;
    void loadChildInventoryEditorSessionResolved().then((session) => {
      if (cancelled) return;
      let bootState: AgenteIndividualResidencialFormState;
      if (session && session.editingId === editingId) {
        if (initialDraft) {
          bootState = buildChildInventoryEditorState(
            parentHubRef.current,
            {
              ...initialDraft,
              propertyForm: session.propertyForm as Partial<AgenteIndividualResidencialFormState>,
            },
            lang,
          );
        } else {
          bootState = mergeParentHubWithChildPropertyForEditor(parentHubRef.current, session.propertyForm);
        }
        setStep(Math.min(session.step, total - 1));
      } else {
        bootState = buildChildInventoryEditorState(parentHubRef.current, initialDraft, lang);
        setStep(0);
      }
      setStateRaw(bootState);
      setErrors({});
      setFullPreviewOpen(false);
      baselinePropertyRef.current = JSON.stringify(pickChildPropertySlice(bootState));
    });
    return () => {
      cancelled = true;
    };
  }, [open, editingId, initialDraft, parentHubSnapshot, lang, total]);

  const isDirty = useCallback(() => {
    return JSON.stringify(pickChildPropertySlice(state)) !== baselinePropertyRef.current;
  }, [state]);

  const confirmClose = useCallback(
    (action: () => void) => {
      if (!isDirty() || window.confirm(copy.unsavedCloseConfirm)) action();
    },
    [copy.unsavedCloseConfirm, isDirty],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        confirmClose(() => {
          clearChildInventoryEditorSession();
          setErrors({});
          onClose();
        });
      }
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

  const setState = useCallback<Dispatch<SetStateAction<AgenteIndividualResidencialFormState>>>(
    (updater) => {
      setStateRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return mergeParentHubWithChildPropertyForEditor(parentHubRef.current, pickChildPropertySlice(next));
      });
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      persistChildInventoryEditorSession(childEditorSessionFromState(editingId, step, state));
    }, 400);
    return () => clearTimeout(timer);
  }, [open, editingId, step, state]);

  const previewDraft = useMemo(
    () => childInventoryDraftFromEditorState(parentHubRef.current, state, initialDraft, lang),
    [state, initialDraft, lang],
  );

  const previewCard = useMemo(() => {
    const merged = mergeChildInventoryWithMediaBridge([previewDraft])[0];
    return mapAdditionalDraftToInventoryCard(merged, lang);
  }, [previewDraft, lang]);

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
    setFullPreviewOpen(true);
  }, [state, lang]);

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
      const draft = childInventoryDraftFromEditorState(
        parentHubRef.current,
        state,
        initialDraft,
        lang,
      );
      onSave(draft, mode);
      clearChildInventoryEditorSession();
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
    },
    [state, lang, initialDraft, onSave, onClose, parentHubSnapshot, onGoToParentPreview],
  );

  if (!open) return null;

  const title = editingId ? copy.drawerTitleEdit : copy.drawerTitle;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[#F6F0E2] text-[#2C2416]"
      role="dialog"
      aria-modal="true"
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
          <div className="mb-4 lg:hidden">
            <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-2 shadow-sm">
              <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{t.app.navPasos}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                {stepLabels.map((label, i) => (
                  <button
                    key={`child-m-${i}-${label}`}
                    type="button"
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
          <div className="mb-4 rounded-xl border border-[#E8DFD0]/80 bg-white/60 px-3 py-3 text-sm text-[#5C5346] hidden sm:block">
            {t.app.pasoDe}{" "}
            <span className="font-bold text-[#1E1810]">{step + 1}</span> {t.app.de} {total}
            <span className="mx-2 text-[#C9B46A]">·</span>
            {stepLabels[step]}
          </div>

          {step === 0 ? <Step01TipoAnuncio state={state} setState={setState} /> : null}
          {step === 1 ? <Step02InformacionBasica state={state} setState={setState} /> : null}
          {step === 2 ? <Step03Media state={state} setState={setState} /> : null}
          {step === 3 ? <Step04DetallesEsenciales state={state} setState={setState} /> : null}
          {step === 4 ? <Step05Caracteristicas state={state} setState={setState} /> : null}
          {step === 5 ? <Step06Descripcion state={state} setState={setState} /> : null}
          {step === 6 ? <BrNegocioChildInventoryInheritedHubPanel state={state} /> : null}
          {step === 7 ? <BrNegocioChildInventoryInheritedContactPanel state={state} /> : null}
          {step === 8 ? <Step09ExtrasOpcionales state={state} setState={setState} /> : null}
          {step === 9 ? (
            <section className="space-y-4 rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1E1810]">{copy.previewSaveTitle}</h3>
              <p className="text-sm text-[#5C5346]/88">{copy.previewSaveBody}</p>
              <BrNegocioPrePublishInventoryCard card={previewCard} lang={lang} />
              <button
                type="button"
                onClick={openFullPreview}
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-5 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0 sm:w-auto"
              >
                {copy.previewThisProperty}
              </button>
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
            {step === total - 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => attemptSave("close")}
                  className="min-h-[48px] rounded-2xl border border-[#C9B46A]/55 bg-[#FFF6E7] px-5 py-3 text-sm font-bold text-[#6E5418] hover:bg-[#FFEFD8] sm:min-h-0"
                >
                  {copy.saveProperty}
                </button>
                <button
                  type="button"
                  onClick={() => attemptSave("addAnother")}
                  className="min-h-[48px] rounded-2xl border border-[#E8DFD0] bg-white px-5 py-3 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7] sm:min-h-0"
                >
                  {copy.saveAndAddAnother}
                </button>
                <button
                  type="button"
                  onClick={() => attemptSave("goToParentPreview")}
                  className="min-h-[48px] w-full touch-manipulation rounded-2xl border border-[#E8DFD0] bg-white px-5 py-3 text-sm font-semibold text-[#5C5346] hover:bg-[#FFFCF7] sm:min-h-0 sm:w-auto"
                >
                  {copy.saveAndGoToParentPreview}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={step >= total - 1}
                onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                className="min-h-[48px] rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-5 py-3 text-sm font-semibold text-[#6E5418] disabled:opacity-40 sm:min-h-0 sm:py-2.5"
              >
                {t.app.siguiente}
              </button>
            )}
          </div>
        </div>
      </footer>

      {fullPreviewOpen ? (
        <BrNegocioChildInventoryFullPreviewOverlay
          open={fullPreviewOpen}
          onClose={() => setFullPreviewOpen(false)}
          lang={lang}
          parentHubSnapshot={parentHubSnapshot}
          childDraft={previewDraft}
          parentFullState={packageStateForPreview}
        />
      ) : null}
    </div>
  );
}
