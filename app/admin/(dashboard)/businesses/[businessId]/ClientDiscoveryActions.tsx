"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";
import { DictationButton } from "@/app/admin/field/FieldAgentComponents";
import { PROJECT_TYPE_REGISTRY } from "@/app/lib/business/projectDiscovery/projectTypeRegistry";
import {
  consentMethodLabel,
  consentStateLabel,
  discoveryStatusLabel,
  formatBilingual,
  truthCaptureChoiceLabel,
  TRUTH_CAPTURE_CHOICES,
} from "@/app/lib/business/projectDiscovery/discoveryLabels";
import type {
  DiscoveryConsentMethod,
  DiscoveryConsentState,
  DiscoveryConsentType,
  DiscoveryItemValueType,
  DiscoveryTruthClass,
  ProjectDiscoveryIntentStatus,
  ProjectDiscoveryStatus,
  ProjectType,
} from "@/app/lib/business/projectDiscovery/types";
import type { WebsiteDiscoverySection, WebsiteRequirementChoiceOption } from "@/app/lib/business/projectDiscovery/websiteDiscoveryCatalog";

async function postJson(url: string, method: string, body: unknown): Promise<{ ok: boolean; body: Record<string, unknown> | null; status: number }> {
  const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: res.ok && Boolean(parsed?.ok), body: parsed, status: res.status };
}

const INPUT = "min-h-[44px] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 py-2 text-sm text-[#1E1810]";
const PRIMARY_BTN = "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50";
const SECONDARY_BTN = "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810] disabled:opacity-50";

// ---------------------------------------------------------------------------
// Start Discovery (MD <start_discovery>, <growth_bridge>)
// ---------------------------------------------------------------------------
export function StartDiscoveryForm({
  businessId,
  prefillTitle,
  prefillProjectType,
  sourceGrowthAssessmentId,
  sourceGrowthSolutionId,
  sourceOpportunityId,
}: {
  businessId: string;
  prefillTitle?: string;
  prefillProjectType?: ProjectType;
  sourceGrowthAssessmentId?: string;
  sourceGrowthSolutionId?: string;
  sourceOpportunityId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(prefillTitle ?? "");
  const [projectType, setProjectType] = useState<ProjectType>(prefillProjectType ?? "website");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Escriba un título de trabajo. / Write a working title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery`, "POST", {
      title: title.trim(),
      primaryProjectType: projectType,
      sourceGrowthAssessmentId,
      sourceGrowthSolutionId,
      sourceOpportunityId,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo iniciar el descubrimiento. / Could not start discovery."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Título de trabajo / Working title</span>
        <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sitio web nuevo / New website" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Tipo de proyecto / Project type</span>
        <select className={INPUT} value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}>
          {PROJECT_TYPE_REGISTRY.filter((d) => d.active).map((d) => (
            <option key={d.key} value={d.key}>{d.labelEs} / {d.labelEn}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => void submit()} disabled={submitting} className={PRIMARY_BTN}>
        {submitting ? "Iniciando… / Starting…" : "Iniciar descubrimiento del cliente / Start Client Discovery"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Project Need (MD <multi_project_ui>)
// ---------------------------------------------------------------------------
export function AddProjectIntentForm({ businessId, discoveryId }: { businessId: string; discoveryId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("logo_brand_identity");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setError("Escriba un título. / Write a title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/intents`, "POST", { title: title.trim(), projectType });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo agregar el proyecto. / Could not add the project."));
      return;
    }
    setTitle("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={SECONDARY_BTN}>
        Agregar proyecto / Add Project Need
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#E8DFD0] p-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Título / Title</span>
        <input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tarjetas de presentación / Business cards" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Tipo de proyecto / Project type</span>
        <select className={INPUT} value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}>
          {PROJECT_TYPE_REGISTRY.filter((d) => d.active).map((d) => (
            <option key={d.key} value={d.key}>{d.labelEs} / {d.labelEn}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => void submit()} disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? "Agregando… / Adding…" : "Agregar / Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={SECONDARY_BTN}>Cancelar / Cancel</button>
      </div>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function IntentStatusButtons({ businessId, discoveryId, intentId, status }: { businessId: string; discoveryId: string; intentId: string; status: ProjectDiscoveryIntentStatus }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transition(newStatus: ProjectDiscoveryIntentStatus) {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/intents/${intentId}`, "PATCH", { status: newStatus });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo actualizar. / Could not update."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {status === "candidate" ? (
        <>
          <button type="button" onClick={() => void transition("confirmed")} disabled={submitting} className={SECONDARY_BTN}>Confirmar / Confirm</button>
          <button type="button" onClick={() => void transition("declined")} disabled={submitting} className={SECONDARY_BTN}>Rechazar / Decline</button>
        </>
      ) : null}
      {status === "confirmed" ? (
        <button type="button" onClick={() => void transition("declined")} disabled={submitting} className={SECONDARY_BTN}>Rechazar / Decline</button>
      ) : null}
      {status === "declined" ? (
        <button type="button" onClick={() => void transition("candidate")} disabled={submitting} className={SECONDARY_BTN}>Reactivar / Reactivate</button>
      ) : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Answer capture (MD <answer_capture>; Gate 3.1 <part_2_choice_renderer>, <part_3_asset_ref_renderer>,
// <part_6_existing_answer_editing>) — one small reusable renderer, driven entirely by the caller's
// expectedAnswerType + catalog options. Never a bespoke component per requirement: choice and
// asset_ref are branches of THIS component, not new components.
// ---------------------------------------------------------------------------
let uidCounter = 0;
function useStableId(prefix: string): string {
  const [id] = useState(() => `${prefix}-${(uidCounter += 1)}`);
  return id;
}

function defaultTruthClassForSection(section: WebsiteDiscoverySection): DiscoveryTruthClass {
  return section === "brand_identity" || section === "visual_references" ? "client_preference" : "client_confirmed";
}

/** "true"/"false" sentinel choice values coerce to a real JS boolean so existing dependency/scope-signal checks elsewhere keep working (MD <part_2_choice_renderer>). */
function coerceChoiceValue(raw: string): string | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

function choiceValueToOptionValue(value: unknown): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return typeof value === "string" ? value : "";
}

export interface ExistingSourceFileOption {
  id: string;
  label: string;
}

export interface CaptureAnswerFormProps {
  businessId: string;
  discoveryId: string;
  projectIntentId: string | null;
  fieldKey: string;
  section: WebsiteDiscoverySection;
  questionEs: string;
  questionEn: string;
  valueType: DiscoveryItemValueType;
  options?: readonly WebsiteRequirementChoiceOption[];
  existingSourceFiles?: readonly ExistingSourceFileOption[];
  initialValue?: unknown;
  initialDisplayValue?: string | null;
  initialTruthClass?: DiscoveryTruthClass | null;
}

export function CaptureAnswerForm({
  businessId,
  discoveryId,
  projectIntentId,
  fieldKey,
  section,
  questionEs,
  questionEn,
  valueType,
  options,
  existingSourceFiles,
  initialValue,
  initialDisplayValue,
  initialTruthClass,
}: CaptureAnswerFormProps) {
  const router = useRouter();
  const isEditing = initialDisplayValue != null || initialValue != null;
  const [text, setText] = useState<string>(() => {
    if (valueType === "boolean") return initialValue === true ? "yes" : initialValue === false ? "no" : "";
    if (valueType === "list" && Array.isArray(initialValue)) return initialValue.join(", ");
    if (valueType === "choice" || valueType === "asset_ref") return "";
    return initialDisplayValue ?? (typeof initialValue === "string" ? initialValue : "");
  });
  const [choiceValue, setChoiceValue] = useState<string>(() => choiceValueToOptionValue(initialValue));
  const [assetChoice, setAssetChoice] = useState<string>(() => (typeof initialValue === "string" ? initialValue : ""));
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [truthClass, setTruthClass] = useState<DiscoveryTruthClass>(initialTruthClass ?? defaultTruthClassForSection(section));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const radioGroupName = useStableId(`truth-${fieldKey}`);
  const choiceGroupName = useStableId(`choice-${fieldKey}`);

  async function uploadNewAsset(file: File): Promise<{ id: string; label: string } | null> {
    setUploadingAsset(true);
    const form = new FormData();
    form.append("businessId", businessId);
    form.append("fileKind", "other");
    form.append("file", file);
    const res = await fetch("/api/admin/field-discovery/assets/upload", { method: "POST", credentials: "include", body: form });
    const uploadBody = await res.json().catch(() => null);
    setUploadingAsset(false);
    if (!res.ok || !uploadBody?.ok) {
      setError(humanizeStaffWriteError(uploadBody?.error as string | undefined, "No se pudo subir el archivo. / Could not upload the file."));
      return null;
    }
    return { id: String(uploadBody.sourceFile?.id ?? ""), label: file.name };
  }

  async function submit() {
    if (valueType === "asset_ref" && !assetChoice) {
      setError("Elija o suba un archivo. / Choose or upload a file.");
      return;
    }
    if (valueType === "choice" && !choiceValue) {
      setError("Elija una opción. / Choose an option.");
      return;
    }
    if (valueType !== "boolean" && valueType !== "choice" && valueType !== "asset_ref" && !text.trim()) {
      setError("Escriba una respuesta. / Write an answer.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSaved(false);

    let value: unknown;
    let displayValue: string;
    if (valueType === "boolean") {
      value = text === "yes";
      displayValue = text === "yes" ? "Sí / Yes" : "No / No";
    } else if (valueType === "list") {
      const list = text.split(",").map((v) => v.trim()).filter(Boolean);
      value = list;
      displayValue = list.join(", ");
    } else if (valueType === "choice") {
      value = coerceChoiceValue(choiceValue);
      const chosen = options?.find((o) => o.value === choiceValue);
      displayValue = chosen ? `${chosen.labelEs} / ${chosen.labelEn}` : choiceValue;
    } else if (valueType === "asset_ref") {
      value = assetChoice;
      const existing = existingSourceFiles?.find((f) => f.id === assetChoice);
      displayValue = existing?.label ?? "Archivo adjuntado / File attached";
    } else {
      value = text.trim();
      displayValue = text.trim();
    }

    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/items`, "POST", {
      projectIntentId,
      fieldKey,
      value,
      displayValue,
      truthClass,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar la respuesta. / Could not save the answer."));
      return;
    }

    // asset_ref answers also become a visible, itemId-linked source record so they show up in
    // Project Assets & Visual References too (MD <part_3_asset_ref_renderer>: "see the selected
    // asset/reference afterward") — never a second blob store, the file already exists.
    if (valueType === "asset_ref" && (body?.item as { id?: string } | undefined)?.id) {
      await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/sources`, "POST", {
        sourceType: "asset",
        businessSourceFileId: assetChoice,
        itemId: (body?.item as { id: string }).id,
        label: displayValue,
      });
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#E8DFD0] p-3">
      <p className="text-sm font-semibold text-[#1E1810]">{questionEs}</p>
      <p className="text-xs text-[#6B5E47]">{questionEn}</p>

      {valueType === "boolean" ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setText("yes")} className={text === "yes" ? PRIMARY_BTN : SECONDARY_BTN} aria-pressed={text === "yes"}>Sí / Yes</button>
          <button type="button" onClick={() => setText("no")} className={text === "no" ? PRIMARY_BTN : SECONDARY_BTN} aria-pressed={text === "no"}>No / No</button>
        </div>
      ) : valueType === "choice" && options && options.length > 0 ? (
        options.length <= 4 ? (
          <fieldset className="space-y-1">
            <legend className="sr-only">{questionEs} / {questionEn}</legend>
            {options.map((o) => (
              <label key={o.value} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-[#E8DFD0] px-3 py-2">
                <input type="radio" name={choiceGroupName} value={o.value} checked={choiceValue === o.value} onChange={() => setChoiceValue(o.value)} className="h-4 w-4 shrink-0" />
                <span className="text-sm text-[#1E1810]">{o.labelEs} / {o.labelEn}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <label className="block">
            <span className="sr-only">{questionEs} / {questionEn}</span>
            <select className={INPUT} value={choiceValue} onChange={(e) => setChoiceValue(e.target.value)}>
              <option value="" disabled>Seleccione una opción / Select an option</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.labelEs} / {o.labelEn}</option>
              ))}
            </select>
          </label>
        )
      ) : valueType === "asset_ref" ? (
        <div className="space-y-2">
          {existingSourceFiles && existingSourceFiles.length > 0 ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Elegir archivo existente / Choose existing file</span>
              <select className={INPUT} value={assetChoice} onChange={(e) => setAssetChoice(e.target.value)}>
                <option value="">— Seleccionar / Select —</option>
                {existingSourceFiles.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#1E1810]">O subir un archivo nuevo / Or upload a new file</span>
            <input
              type="file"
              disabled={uploadingAsset}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const uploaded = await uploadNewAsset(file);
                if (uploaded) setAssetChoice(uploaded.id);
              }}
              className="block min-h-[44px] w-full text-xs file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-[#7A1E2C] file:px-3 file:text-xs file:font-semibold file:text-white"
            />
          </label>
          {uploadingAsset ? <p className="text-xs text-[#7A7164]">Subiendo… / Uploading…</p> : null}
          {assetChoice ? (
            <p className="text-xs font-semibold text-[#1F3A2D]">
              Seleccionado / Selected: {existingSourceFiles?.find((f) => f.id === assetChoice)?.label ?? assetChoice}
            </p>
          ) : null}
        </div>
      ) : valueType === "list" ? (
        <input className={INPUT} value={text} onChange={(e) => setText(e.target.value)} placeholder="Separe con comas / Separate with commas" />
      ) : valueType === "date" ? (
        <input type="date" className={INPUT} value={text} onChange={(e) => setText(e.target.value)} />
      ) : valueType === "url" ? (
        <input type="url" className={INPUT} value={text} onChange={(e) => setText(e.target.value)} placeholder="https://" />
      ) : valueType === "number" ? (
        <input type="number" className={INPUT} value={text} onChange={(e) => setText(e.target.value)} />
      ) : (
        <textarea className={`${INPUT} min-h-[80px]`} value={text} onChange={(e) => setText(e.target.value)} />
      )}

      <fieldset className="space-y-1">
        <legend className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">¿Quién dijo esto? / Who said this?</legend>
        <div className="flex flex-wrap gap-2">
          {TRUTH_CAPTURE_CHOICES.map((t) => (
            <label key={t} className={`flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${truthClass === t ? "border-[#7A1E2C] bg-[#FBEEEF] text-[#7A1E2C] font-semibold" : "border-[#D6C7AD] bg-white text-[#1E1810]"}`}>
              <input type="radio" name={radioGroupName} value={t} checked={truthClass === t} onChange={() => setTruthClass(t)} className="h-3.5 w-3.5 shrink-0" />
              {formatBilingual(truthCaptureChoiceLabel(t))}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="button" onClick={() => void submit()} disabled={submitting} className={PRIMARY_BTN}>
        {submitting ? "Guardando… / Saving…" : isEditing ? "Actualizar respuesta / Update answer" : "Guardar / Save"}
      </button>
      {saved ? <p role="status" className="text-xs font-semibold text-[#1F3A2D]">Guardado. / Saved.</p> : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function ItemReviewButtons({ businessId, discoveryId, itemId, confirmationState }: { businessId: string; discoveryId: string; itemId: string; confirmationState: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(state: "confirmed" | "rejected") {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/items/${itemId}/confirm`, "PATCH", { confirmationState: state });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo actualizar. / Could not update."));
      return;
    }
    router.refresh();
  }

  if (confirmationState === "confirmed") return <p className="text-[10px] font-semibold text-[#1F3A2D]">Confirmado / Confirmed</p>;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      <button type="button" onClick={() => void set("confirmed")} disabled={submitting} className={SECONDARY_BTN}>Confirmar / Confirm</button>
      <button type="button" onClick={() => void set("rejected")} disabled={submitting} className={SECONDARY_BTN}>Rechazar / Reject</button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gate 3.1 <part_1_sections_review_actionability>, <part_6_existing_answer_editing> — the ONE
// action affordance shared by Sections Review and What We Already Know. Never a fake link: "leonix"
// / "research" point at the real Leonix Decisions section (same fieldKey listed there); "ask" and
// "edit" both render the SAME reusable CaptureAnswerForm — "edit" only differs by pre-filling it
// with the existing answer, so re-saving upserts the same row rather than creating a duplicate.
// This is also the deterministic "focused question" mechanism: it renders any requirement directly,
// regardless of whether Gate 2's batch-limited Questions to Ask Now currently includes it.
// ---------------------------------------------------------------------------
export function AnswerRowActions({
  businessId,
  discoveryId,
  intentId,
  fieldKey,
  section,
  clientQuestionEs,
  clientQuestionEn,
  expectedAnswerType,
  options,
  existingItemId,
  existingValue,
  existingDisplayValue,
  existingTruthClass,
  existingConfirmationState,
  actionKind,
  canCreate,
  canReview,
  existingSourceFiles,
}: {
  businessId: string;
  discoveryId: string;
  intentId: string | null;
  fieldKey: string;
  section: WebsiteDiscoverySection;
  clientQuestionEs: string;
  clientQuestionEn: string;
  expectedAnswerType: DiscoveryItemValueType;
  options?: readonly WebsiteRequirementChoiceOption[];
  existingItemId: string | null;
  existingValue: unknown;
  existingDisplayValue: string | null;
  existingTruthClass: string | null;
  existingConfirmationState: "unconfirmed" | "confirmed" | "rejected" | null;
  actionKind: "ask" | "edit" | "leonix" | "research" | "none";
  canCreate: boolean;
  canReview: boolean;
  existingSourceFiles?: readonly ExistingSourceFileOption[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (actionKind === "none") return null;

  if (actionKind === "leonix" || actionKind === "research") {
    return (
      <a href="#leonix-decisions" className={SECONDARY_BTN}>
        {actionKind === "leonix" ? "Ver en Decisiones de Leonix / View in Leonix Decisions" : "Ver en Investigación Oficial / View in Official Research"}
      </a>
    );
  }

  if (!canCreate) return null;

  return (
    <div>
      <button type="button" onClick={() => setExpanded((v) => !v)} className={SECONDARY_BTN} aria-expanded={expanded}>
        {expanded ? "Cerrar / Close" : actionKind === "edit" ? "Editar / Edit" : "Responder / Answer"}
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2">
          <CaptureAnswerForm
            businessId={businessId}
            discoveryId={discoveryId}
            projectIntentId={intentId}
            fieldKey={fieldKey}
            section={section}
            questionEs={clientQuestionEs}
            questionEn={clientQuestionEn}
            valueType={expectedAnswerType}
            options={options}
            existingSourceFiles={existingSourceFiles}
            initialValue={existingValue}
            initialDisplayValue={existingDisplayValue}
            initialTruthClass={(existingTruthClass as DiscoveryTruthClass | null) ?? undefined}
          />
          {actionKind === "edit" && canReview && existingItemId && existingConfirmationState && existingConfirmationState !== "confirmed" ? (
            <ItemReviewButtons businessId={businessId} discoveryId={discoveryId} itemId={existingItemId} confirmationState={existingConfirmationState} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meeting Notes (MD <notes_and_dictation>) — reuses DictationButton exactly; Save is explicit and
// the saved note becomes visible immediately via router.refresh().
// ---------------------------------------------------------------------------
export function MeetingNoteCapture({ businessId, discoveryId }: { businessId: string; discoveryId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/sources`, "POST", { sourceType: "manual", label: "Nota de reunión / Meeting note", notes: text.trim() });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar la nota. / Could not save the note."));
      return;
    }
    setText("");
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <textarea className={`${INPUT} min-h-[80px]`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escriba o dicte una nota… / Type or dictate a note…" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <DictationButton onTranscript={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
        <button type="button" onClick={() => void save()} disabled={submitting || !text.trim()} className={PRIMARY_BTN}>
          {submitting ? "Guardando… / Saving…" : "Guardar nota / Save note"}
        </button>
      </div>
      {saved ? <p role="status" className="text-xs font-semibold text-[#1F3A2D]">Nota guardada. / Note saved.</p> : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assets (MD <asset_workflow>) — reuses the existing Field Discovery upload endpoint; never a
// second blob store.
// ---------------------------------------------------------------------------
export function DiscoveryAssetUpload({ businessId, discoveryId }: { businessId: string; discoveryId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [assetType, setAssetType] = useState("logo");

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    setSaved(false);
    const form = new FormData();
    form.append("businessId", businessId);
    form.append("fileKind", assetType === "logo" || assetType === "screenshot" || assetType === "photo" || assetType === "pdf" ? assetType : "other");
    form.append("file", file);
    const res = await fetch("/api/admin/field-discovery/assets/upload", { method: "POST", credentials: "include", body: form });
    const uploadBody = await res.json().catch(() => null);
    if (!res.ok || !uploadBody?.ok) {
      setUploading(false);
      setError(humanizeStaffWriteError(uploadBody?.error as string | undefined, "No se pudo subir el archivo. / Could not upload the file."));
      return;
    }
    const sourceFileId = String(uploadBody.sourceFile?.id ?? "");
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/sources`, "POST", {
      sourceType: "asset",
      businessSourceFileId: sourceFileId,
      label: assetType,
    });
    setUploading(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "El archivo se subió, pero no se pudo asociar al descubrimiento. / The file uploaded, but could not be linked to this discovery."));
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#E8DFD0] p-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Subir activo del cliente / Upload Client Asset</h4>
      <p className="text-[11px] text-[#9A9184]">Logo, foto, PDF, captura de pantalla, documento de marca… / Logo, photo, PDF, screenshot, brand document…</p>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Tipo de archivo / File type</span>
        <select className={INPUT} value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="logo">Logo / Logo</option>
          <option value="screenshot">Captura de pantalla / Screenshot</option>
          <option value="photo">Foto / Photo</option>
          <option value="pdf">PDF / PDF</option>
          <option value="other">Otro (documento de marca, referencia, video) / Other (brand document, reference, video)</option>
        </select>
      </label>
      <input
        type="file"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="block min-h-[44px] w-full text-xs file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-[#7A1E2C] file:px-3 file:text-xs file:font-semibold file:text-white"
      />
      {uploading ? <p className="text-xs text-[#7A7164]">Subiendo… / Uploading…</p> : null}
      {saved ? <p role="status" className="text-xs font-semibold text-[#1F3A2D]">Archivo adjuntado. / File attached.</p> : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visual References (MD <visual_references>) — asset-or-URL, reference type, annotations.
// ---------------------------------------------------------------------------
const REFERENCE_TYPES = ["Layout", "Typography", "Color", "Hero", "Navigation", "Imagery", "Content hierarchy", "Animation", "General inspiration"] as const;

export function VisualReferenceForm({ businessId, discoveryId }: { businessId: string; discoveryId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [referenceType, setReferenceType] = useState<(typeof REFERENCE_TYPES)[number]>("General inspiration");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [mustNotCopy, setMustNotCopy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (!url.trim()) {
      setError("Ingrese una URL. / Enter a URL.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const notes = [
      likes.trim() ? `Le gusta / Likes: ${likes.trim()}` : null,
      dislikes.trim() ? `No le gusta / Dislikes: ${dislikes.trim()}` : null,
      inspiration.trim() ? `Inspiración a tomar / Inspiration to take: ${inspiration.trim()}` : null,
      mustNotCopy.trim() ? `NO copiar / Must NOT copy: ${mustNotCopy.trim()}` : null,
    ].filter(Boolean).join("\n");
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/sources`, "POST", {
      sourceType: "website_url",
      externalUrl: url.trim(),
      label: referenceType,
      notes,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar la referencia. / Could not save the reference."));
      return;
    }
    setUrl(""); setLikes(""); setDislikes(""); setInspiration(""); setMustNotCopy("");
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#E8DFD0] p-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Agregar inspiración / referencia / Add Inspiration / Reference</h4>
      <p className="text-[11px] text-[#9A9184]">Sitio web, diseño, competidor, captura de pantalla… / Website, design, competitor, screenshot…</p>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Sitio web de referencia (URL) / Reference website (URL)</span>
        <input type="url" className={INPUT} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">Tipo de referencia / Reference type</span>
        <select className={INPUT} value={referenceType} onChange={(e) => setReferenceType(e.target.value as (typeof REFERENCE_TYPES)[number])}>
          {REFERENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">¿Qué le gusta y por qué? / What do they like, and why?</span>
        <input className={INPUT} value={likes} onChange={(e) => setLikes(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">¿Qué no le gusta? / What don&apos;t they like?</span>
        <input className={INPUT} value={dislikes} onChange={(e) => setDislikes(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">¿Qué tomar como inspiración? / What to take as inspiration?</span>
        <input className={INPUT} value={inspiration} onChange={(e) => setInspiration(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-[#1E1810]">¿Qué NO se debe copiar? / What must NOT be copied?</span>
        <input className={INPUT} value={mustNotCopy} onChange={(e) => setMustNotCopy(e.target.value)} />
      </label>
      <button type="button" onClick={() => void submit()} disabled={submitting} className={PRIMARY_BTN}>
        {submitting ? "Guardando… / Saving…" : "Guardar referencia / Save reference"}
      </button>
      {saved ? <p role="status" className="text-xs font-semibold text-[#1F3A2D]">Referencia guardada. / Reference saved.</p> : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recording consent (MD <recording_consent>) — consent STATE only, never recording.
// ---------------------------------------------------------------------------
export function ConsentToggle({
  businessId,
  discoveryId,
  consentType,
  currentState,
  headingEs,
  headingEn,
}: {
  businessId: string;
  discoveryId: string;
  consentType: DiscoveryConsentType;
  currentState: DiscoveryConsentState | null;
  headingEs: string;
  headingEn: string;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<DiscoveryConsentMethod>("verbal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record(state: DiscoveryConsentState) {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/consent`, "POST", { consentType, state, method, language: "es" });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo registrar el consentimiento. / Could not record consent."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#E8DFD0] p-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{headingEs} / {headingEn}</h4>
      <p className="text-xs font-semibold text-[#1E1810]">
        Estado actual / Current state: {currentState ? formatBilingual(consentStateLabel(currentState)) : "No preguntado / Not asked"}
      </p>
      <label className="block">
        <span className="sr-only">Método de consentimiento / Consent method</span>
        <select className={INPUT} value={method} onChange={(e) => setMethod(e.target.value as DiscoveryConsentMethod)}>
          {(["verbal", "written", "digital_acknowledgment"] as const).map((m) => (
            <option key={m} value={m}>{formatBilingual(consentMethodLabel(m))}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void record("provided")} disabled={submitting} className={PRIMARY_BTN} aria-label={`${headingEs}: Sí / ${headingEn}: Yes`}>Sí / Yes</button>
        <button type="button" onClick={() => void record("declined")} disabled={submitting} className={SECONDARY_BTN} aria-label={`${headingEs}: No / ${headingEn}: No`}>No / No</button>
      </div>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discovery lifecycle (MD <status_transition>)
// ---------------------------------------------------------------------------
export function DiscoveryStatusButtons({ businessId, discoveryId, status, options }: { businessId: string; discoveryId: string; status: ProjectDiscoveryStatus; options: readonly ProjectDiscoveryStatus[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transition(newStatus: ProjectDiscoveryStatus) {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}`, "PATCH", { status: newStatus });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo cambiar el estado. / Could not change status."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.filter((o) => o !== status).map((o) => (
        <button key={o} type="button" onClick={() => void transition(o)} disabled={submitting} className={SECONDARY_BTN}>
          {formatBilingual(discoveryStatusLabel(o))}
        </button>
      ))}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Send unresolved questions to meeting (MD <meeting_bridge>)
// ---------------------------------------------------------------------------
export function SendQuestionsToMeetingButton({ businessId, discoveryId, questions }: { businessId: string; discoveryId: string; questions: readonly { fieldKey: string; questionEs: string; questionEn: string }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function toggle(fieldKey: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fieldKey)) next.delete(fieldKey);
      else next.add(fieldKey);
      return next;
    });
  }

  async function send() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    const chosen = questions.filter((q) => selected.has(q.fieldKey)).map((q) => `${q.questionEs} / ${q.questionEn}`);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}/meeting-bridge`, "POST", { questions: chosen });
    setSubmitting(false);
    if (!ok) {
      const code = body?.error as string | undefined;
      if (code === "no_upcoming_meeting") {
        setError("No hay una reunión próxima. Programe una reunión primero. / No upcoming meeting. Schedule a meeting first.");
      } else {
        setError(humanizeStaffWriteError(code, "No se pudieron agregar las preguntas. / Could not add the questions."));
      }
      return;
    }
    setResult(`Se agregaron ${body?.addedCount ?? 0} pregunta(s) a la reunión. / Added ${body?.addedCount ?? 0} question(s) to the meeting.`);
    setSelected(new Set());
    router.refresh();
  }

  if (questions.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border border-[#E8DFD0] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Enviar preguntas a la reunión / Send questions to meeting</p>
      <ul className="space-y-1">
        {questions.map((q) => (
          <li key={q.fieldKey}>
            <label className="flex min-h-[36px] cursor-pointer items-start gap-2">
              <input type="checkbox" checked={selected.has(q.fieldKey)} onChange={() => toggle(q.fieldKey)} className="mt-1 h-4 w-4 shrink-0" />
              <span className="text-xs text-[#3D3428]">{q.questionEs} / {q.questionEn}</span>
            </label>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => void send()} disabled={submitting || selected.size === 0} className={PRIMARY_BTN}>
        {submitting ? "Enviando… / Sending…" : "Enviar seleccionadas / Send selected"}
      </button>
      {result ? <p role="status" className="text-xs font-semibold text-[#1F3A2D]">{result}</p> : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function LinkMeetingButton({ businessId, discoveryId, meetings }: { businessId: string; discoveryId: string; meetings: readonly { id: string; label: string }[] }) {
  const router = useRouter();
  const [meetingId, setMeetingId] = useState(meetings[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function link() {
    if (!meetingId) return;
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/discovery/${discoveryId}`, "PATCH", { linkMeetingId: meetingId });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo vincular la reunión. / Could not link the meeting."));
      return;
    }
    router.refresh();
  }

  if (meetings.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="block">
        <span className="sr-only">Reunión a vincular / Meeting to link</span>
        <select className={INPUT} style={{ maxWidth: 260 }} value={meetingId} onChange={(e) => setMeetingId(e.target.value)}>
          {meetings.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </label>
      <button type="button" onClick={() => void link()} disabled={submitting} className={SECONDARY_BTN}>
        Vincular reunión / Link meeting
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

