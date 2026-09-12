"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";
import { roadmapStateLabel, ROADMAP_STATE_KEYS } from "./growthPlanLabels";
import type {
  GrowthProviderClass,
  GrowthSolutionState,
  GrowthCampaignStatus,
  GrowthRoadmapStepState,
  GrowthAssessmentReviewDecision,
} from "@/app/lib/business/growthEngine/types";

async function postJson(url: string, method: string, body: unknown): Promise<{ ok: boolean; body: Record<string, unknown> | null; status: number }> {
  const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: res.ok && Boolean(parsed?.ok), body: parsed, status: res.status };
}

// ---------------------------------------------------------------------------
// Analyze / Re-analyze
// ---------------------------------------------------------------------------

export function AnalyzeBusinessButton({ businessId, hasAssessment }: { businessId: string; hasAssessment: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(forceReanalysis: boolean) {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/assessment`, "POST", { forceReanalysis });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "El análisis no está disponible en este momento. La información de este negocio está segura. Intente de nuevo más tarde. / Business analysis is temporarily unavailable. Your existing business information is safe. Try again later."));
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {!hasAssessment ? (
        <>
          <button
            type="button"
            onClick={() => void run(false)}
            disabled={submitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Analizando… / Analyzing…" : "Analizar negocio / Analyze Business"}
          </button>
          <p className="mt-2 max-w-prose text-xs text-[#6B5E47]">
            Business Concierge usará información confirmada del negocio, investigación, historial de la relación y actividad actual para identificar vacíos, preguntas y posibles próximos pasos. / Business Concierge will use confirmed business information, research, relationship history, and current activity to identify gaps, questions, and possible next steps.
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void run(true)}
          disabled={submitting}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-bold text-[#7A1E2C] disabled:opacity-50"
          title="Usa información nueva disponible y crea una nueva versión. / Uses newly available information and creates a new version."
        >
          {submitting ? "Analizando… / Analyzing…" : "Volver a analizar / Re-analyze"}
        </button>
      )}
      {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review assessment ("Accept as working guidance")
// ---------------------------------------------------------------------------

/**
 * Gate D — the full three-way review decision (MD Part 1). Accept keeps the note optional (Gate C
 * behavior preserved); Needs Correction and Reject both REQUIRE a note (enforced again server-side
 * — review_note_required — this is only the UI-side mirror) since a correction/rejection without a
 * reason is not useful to a future re-analysis. Neither decision ever silently marks the assessment
 * accepted — see the disclaimer line, which is now decision-agnostic.
 */
export function ReviewAssessmentButton({ businessId, assessmentId }: { businessId: string; assessmentId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pendingDecision, setPendingDecision] = useState<Exclude<GrowthAssessmentReviewDecision, "accepted"> | null>(null);

  async function submit(decision: GrowthAssessmentReviewDecision) {
    if ((decision === "needs_correction" || decision === "rejected") && !note.trim()) {
      setError(
        decision === "needs_correction"
          ? "Se requiere una nota que explique qué corregir. / A note explaining what to correct is required."
          : "Se requiere una razón de rechazo. / A rejection reason is required.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/assessment`, "PATCH", { assessmentId, decision, note: note.trim() || null });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar este cambio. No se perdió nada en esta pantalla. / We couldn't save this change. Nothing was lost from this screen."));
      return;
    }
    router.refresh();
  }

  if (pendingDecision) {
    return (
      <div className="mt-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            pendingDecision === "needs_correction"
              ? "¿Qué se debe corregir? (requerido) / What needs correcting? (required)"
              : "¿Por qué se rechaza? (requerido) / Why is this rejected? (required)"
          }
          className="min-h-[44px] w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
          rows={2}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit(pendingDecision)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Guardando… / Saving…" : pendingDecision === "needs_correction" ? "Confirmar corrección / Confirm correction" : "Confirmar rechazo / Confirm rejection"}
          </button>
          <button type="button" onClick={() => { setPendingDecision(null); setNote(""); setError(null); }} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
            Cancelar / Cancel
          </button>
        </div>
        {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit("accepted")}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Aceptar como guía de trabajo / Accept as working guidance
        </button>
        <button type="button" onClick={() => setPendingDecision("needs_correction")} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
          Necesita corrección / Needs correction
        </button>
        <button type="button" onClick={() => setPendingDecision("rejected")} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#7A1E2C]">
          Rechazar / Reject
        </button>
      </div>
      <p className="mt-1 text-[10px] text-[#9A9184]">
        Ninguna decisión confirma hechos automáticamente. Use el Libro del Negocio para confirmar hechos. / No decision automatically confirms facts. Use the Business Book to confirm facts.
      </p>
      {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution actions — state transitions + Creative Studio bridge
// ---------------------------------------------------------------------------

export function PromoteSuggestionButton({
  businessId,
  assessmentId,
  suggestion,
}: {
  businessId: string;
  assessmentId: string;
  suggestion: { textEs: string; textEn: string; providerClass: GrowthProviderClass; category: string; evidenceRefs: readonly string[] };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function promote() {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/solutions`, "POST", {
      sourceAssessmentId: assessmentId,
      providerClass: suggestion.providerClass,
      category: suggestion.category,
      titleEs: suggestion.textEs,
      titleEn: suggestion.textEn,
      evidenceRefs: suggestion.evidenceRefs,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar esta solución. / Could not save this solution."));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-[10px] font-semibold text-emerald-800">Agregado / Added</span>;

  return (
    <div className="mt-1">
      <button
        type="button"
        disabled={submitting}
        onClick={() => void promote()}
        className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-1.5 text-[11px] font-bold text-[#7A1E2C] disabled:opacity-50"
      >
        {submitting ? "Guardando… / Saving…" : "Agregar como solución / Add as solution"}
      </button>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

export function SolutionStateButtons({ businessId, solutionId, state }: { businessId: string; solutionId: string; state: GrowthSolutionState }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function transition(newState: GrowthSolutionState) {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/solutions/${solutionId}`, "PATCH", { state: newState });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo actualizar esta solución. / Could not update this solution."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {state === "suggested" ? (
          <button type="button" disabled={submitting} onClick={() => void transition("reviewed")} className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#3D3428] disabled:opacity-50">
            Revisado / Reviewed
          </button>
        ) : null}
        {state === "reviewed" ? (
          <button type="button" disabled={submitting} onClick={() => void transition("approved")} className="inline-flex min-h-[36px] items-center rounded-lg bg-[#1F3A2D] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            Aprobar / Approve
          </button>
        ) : null}
        {state === "approved" ? (
          <button type="button" disabled={submitting} onClick={() => void transition("in_progress")} className="inline-flex min-h-[36px] items-center rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            En progreso / In progress
          </button>
        ) : null}
        {state === "in_progress" ? (
          <button type="button" disabled={submitting} onClick={() => void transition("complete")} className="inline-flex min-h-[36px] items-center rounded-lg bg-[#1F3A2D] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
            Completar / Complete
          </button>
        ) : null}
        {state !== "dismissed" && state !== "complete" ? (
          <button type="button" disabled={submitting} onClick={() => void transition("dismissed")} className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#7A7164] disabled:opacity-50">
            Descartar / Dismiss
          </button>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

const CREATIVE_LANE_LABEL: Record<string, { es: string; en: string }> = {
  logo: { es: "Crear proyecto de logo", en: "Create Logo Project" },
  website: { es: "Crear proyecto de sitio web", en: "Create Website Project" },
  ad: { es: "Crear campaña creativa", en: "Create Campaign Creative" },
  sponsored_editorial: { es: "Crear editorial patrocinado", en: "Create Sponsored Editorial" },
};

export function CreateCreativeRequestButton({ businessId, solutionId, lane }: { businessId: string; solutionId: string; lane: "logo" | "website" | "ad" | "sponsored_editorial" }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = CREATIVE_LANE_LABEL[lane];

  async function create() {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/solutions/${solutionId}/creative-request`, "POST", { lane });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo crear el proyecto creativo. / Could not create the creative project."));
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        disabled={submitting}
        onClick={() => void create()}
        className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Creando… / Creating…" : `${label.es} / ${label.en}`}
      </button>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

/** Follow-up bridge — reuses the EXISTING follow-up API directly (no new persistence domain). */
export function CreateFollowUpFromSolutionButton({ businessId, purpose }: { businessId: string; purpose: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [date, setDate] = useState("");

  async function create() {
    if (!date) {
      setError("Se requiere una fecha. / A date is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/follow-up`, "POST", { scheduledDate: date, purpose });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo programar el seguimiento. / Could not schedule the follow-up."));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-[10px] font-semibold text-emerald-800">Seguimiento creado / Follow-up created</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs"
      />
      <button
        type="button"
        disabled={submitting}
        onClick={() => void create()}
        className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-2 text-[11px] font-bold text-[#7A1E2C] disabled:opacity-50"
      >
        {submitting ? "Guardando… / Saving…" : "Crear seguimiento / Create Follow-up"}
      </button>
      {error ? <p role="alert" className="mt-1 w-full text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

/**
 * Gate D (MD Part 3/4) — the generic Growth Solution -> Promise Keeper commitment bridge. Reused
 * for four different execution routes that all resolve to "create a real commitment" with only the
 * prefilled title/context differing: a general per-solution commitment, PARTNER COORDINATION (e.g.
 * "contact radio partner"), EXTERNAL PROFESSIONAL (e.g. "contact a CPA" — never routed into
 * Creative Studio as if Leonix were the provider), and PROMOTIONAL MATERIAL (the smallest truthful
 * handoff to Leonix Promocionales fulfillment, since no canonical order system exists in this
 * worktree yet). No fake completion: success only shows after the real commitment row is created
 * and linked back to the solution.
 */
export function CreateCommitmentButton({
  businessId,
  solutionId,
  titleEs,
  titleEn,
  buttonLabelEs,
  buttonLabelEn,
}: {
  businessId: string;
  solutionId: string;
  titleEs: string;
  titleEn: string;
  buttonLabelEs: string;
  buttonLabelEn: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [dueAt, setDueAt] = useState("");

  async function create() {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/solutions/${solutionId}/commitment-request`, "POST", {
      titleEs,
      titleEn,
      responsibleParty: "staff",
      dueAt: dueAt || null,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo crear el compromiso. / Could not create the commitment."));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-[10px] font-semibold text-emerald-800">Compromiso creado / Commitment created</span>;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-2 text-[11px] font-bold text-[#7A1E2C]">
        {buttonLabelEs} / {buttonLabelEn}
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#E8DFD0] p-2">
      <span className="text-xs text-[#3D3428]">{titleEs} / {titleEn}</span>
      <input
        type="date"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs"
        aria-label="Fecha límite / Due date"
      />
      <button
        type="button"
        disabled={submitting}
        onClick={() => void create()}
        className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Creando… / Creating…" : "Confirmar compromiso / Confirm commitment"}
      </button>
      {error ? <p role="alert" className="w-full text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

export function ResearchOfficialRequirementButton({ businessId, jurisdiction, topicEs, topicEn }: { businessId: string; jurisdiction: string; topicEs: string; topicEn: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function create() {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/official-requirements`, "POST", {
      jurisdiction,
      requirementTopicEs: topicEs,
      requirementTopicEn: topicEn,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo crear la investigación. / Could not create the research item."));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) return <span className="text-[10px] font-semibold text-emerald-800">Agregado a investigación / Added to research</span>;

  return (
    <div>
      <button
        type="button"
        disabled={submitting}
        onClick={() => void create()}
        className="inline-flex min-h-[36px] items-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-1.5 text-[11px] font-bold text-[#7A1E2C] disabled:opacity-50"
      >
        {submitting ? "Guardando… / Saving…" : "Investigar requisito / Research Requirement"}
      </button>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

export function VerifyOfficialRequirementForm({ businessId, requirementId }: { businessId: string; requirementId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceAgency, setSourceAgency] = useState("");

  async function verify() {
    if (!sourceUrl.trim() || !sourceAgency.trim()) {
      setError("Se requiere la fuente y la agencia. / Source and agency are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/official-requirements/${requirementId}/verify`, "POST", { sourceUrl: sourceUrl.trim(), sourceAgency: sourceAgency.trim() });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo verificar. / Could not verify."));
      return;
    }
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[36px] items-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#3D3428]">
        Verificar / Verify
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-lg border border-dashed border-[#E8DFD0] p-2">
      <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="URL de la fuente oficial / Official source URL" className="min-h-[36px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs" />
      <input value={sourceAgency} onChange={(e) => setSourceAgency(e.target.value)} placeholder="Agencia / Agency" className="min-h-[36px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs" />
      <button type="button" disabled={submitting} onClick={() => void verify()} className="inline-flex min-h-[36px] items-center justify-center rounded-lg bg-[#1F3A2D] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
        {submitting ? "Guardando… / Saving…" : "Confirmar verificación humana / Confirm human verification"}
      </button>
      {error ? <p role="alert" className="text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Roadmap step controls
// ---------------------------------------------------------------------------

export function RoadmapStepControl({ businessId, stepKey, state }: { businessId: string; stepKey: string; state: GrowthRoadmapStepState }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setState(newState: GrowthRoadmapStepState) {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/roadmap`, "PATCH", { stepKey, state: newState });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo actualizar el paso. / Could not update the step."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-1">
      <select
        value={state}
        disabled={submitting}
        onChange={(e) => void setState(e.target.value as GrowthRoadmapStepState)}
        className="min-h-[36px] max-w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-[11px]"
      >
        {ROADMAP_STATE_KEYS.map((s) => (
          <option key={s} value={s}>{roadmapStateLabel(s)}</option>
        ))}
      </select>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Questions batch-add to meeting
// ---------------------------------------------------------------------------

/**
 * Gate D (MD Part 2) — per-question review: an operator can DISMISS an irrelevant generated
 * question (never force-accepting a bad suggestion just because the overall assessment is useful)
 * or SELECT it for meeting prep, same as Gate C. Dismissal is deliberately ephemeral/client-side
 * only (this component's own state) — matching the mission's own "do not create a complicated
 * annotation system unless needed" instruction: the model's output history in
 * business_growth_assessments.client_questions is never rewritten, so nothing about the AI's
 * original output is lost; dismissing only hides a bad suggestion from THIS operator's current
 * pass, and a page reload naturally shows the full original list again since nothing was persisted.
 */
export function QuestionsBatchAddForm({ businessId, questions }: { businessId: string; questions: readonly { textEs: string; textEn: string }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function dismiss(i: number) {
    setDismissed((prev) => new Set(prev).add(i));
    setSelected((prev) => {
      if (!prev.has(i)) return prev;
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  }

  async function addSelected() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    const chosen = Array.from(selected).map((i) => `${questions[i].textEs} / ${questions[i].textEn}`);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/questions/meeting-bridge`, "POST", { questions: chosen });
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
    setResult(`${body?.addedCount ?? 0} pregunta(s) agregada(s) a la próxima reunión. / ${body?.addedCount ?? 0} question(s) added to the next meeting.`);
    setSelected(new Set());
    router.refresh();
  }

  if (questions.length === 0) return null;
  const visible = questions.map((q, i) => ({ q, i })).filter(({ i }) => !dismissed.has(i));
  if (visible.length === 0) {
    return <p className="mt-3 text-sm text-[#6B5E47]">Todas las preguntas fueron descartadas en esta sesión. / All questions were dismissed this session.</p>;
  }

  return (
    <div className="mt-3">
      <ul className="space-y-1.5">
        {visible.map(({ q, i }) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-[#E8DFD0] bg-white p-2">
            {/* The whole label (not just the 18px checkbox) is the real tap target — meets the
                44px touch-target requirement without needing an oversized checkbox graphic. */}
            <label className="flex min-h-[44px] flex-1 cursor-pointer items-start gap-2">
              <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="mt-1 h-[18px] w-[18px] shrink-0" aria-label={q.textEn} />
              <span className="flex-1 text-sm">
                <span className="block">{q.textEs}</span>
                <span className="block text-[#6B5E47]">{q.textEn}</span>
              </span>
            </label>
            <button
              type="button"
              onClick={() => dismiss(i)}
              className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg border border-[#E8DFD0] px-2 py-1 text-[10px] font-semibold text-[#7A7164]"
              aria-label={`Descartar / Dismiss: ${q.textEn}`}
            >
              Descartar / Dismiss
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={submitting || selected.size === 0}
        onClick={() => void addSelected()}
        className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Agregando… / Adding…" : `Agregar seleccionadas a la reunión / Add Selected to Meeting (${selected.size})`}
      </button>
      {result ? <p className="mt-1 text-[11px] text-emerald-800">{result}</p> : null}
      {error ? <p role="alert" className="mt-1 text-[11px] text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign Builder — lightweight, progressive. Pre-fill from a reviewed solution where safe;
// everything else requires explicit operator input (never assumed).
// ---------------------------------------------------------------------------

export function CampaignBuilderForm({
  businessId,
  sourceSolutionId,
  prefillObjectiveEs,
  prefillObjectiveEn,
  mediaChannels,
}: {
  businessId: string;
  sourceSolutionId?: string | null;
  prefillObjectiveEs?: string;
  prefillObjectiveEn?: string;
  mediaChannels: readonly { id: string; labelEs: string; labelEn: string; channelClass: "leonix_owned" | "partner"; availabilityState: string; notesEs: string | null; notesEn: string | null }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objectiveEs, setObjectiveEs] = useState(prefillObjectiveEs ?? "");
  const [objectiveEn, setObjectiveEn] = useState(prefillObjectiveEn ?? "");
  const [targetAudienceEs, setTargetAudienceEs] = useState("");
  const [offerEs, setOfferEs] = useState("");
  const [primaryCtaEs, setPrimaryCtaEs] = useState("");
  const [capacityAssumption, setCapacityAssumption] = useState("");
  const [campaignStart, setCampaignStart] = useState("");
  const [campaignEnd, setCampaignEnd] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());

  function toggleChannel(id: string) {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!objectiveEs.trim() || !objectiveEn.trim()) {
      setError("Se requiere el objetivo en español e inglés. / Objective is required in Spanish and English.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/campaigns`, "POST", {
      sourceSolutionId: sourceSolutionId ?? null,
      objectiveEs: objectiveEs.trim(),
      objectiveEn: objectiveEn.trim(),
      targetAudienceEs: targetAudienceEs.trim() || null,
      targetAudienceEn: targetAudienceEs.trim() || null,
      offerEs: offerEs.trim() || null,
      offerEn: offerEs.trim() || null,
      primaryCtaEs: primaryCtaEs.trim() || null,
      primaryCtaEn: primaryCtaEs.trim() || null,
      capacityAssumption: capacityAssumption.trim() || null,
      campaignStart: campaignStart || null,
      campaignEnd: campaignEnd || null,
      budgetAmount: budgetAmount.trim() ? Number(budgetAmount) : null,
      mediaChannelIds: Array.from(selectedChannels),
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo crear la campaña. Nada se perdió en esta pantalla. / Could not create the campaign. Nothing was lost from this screen."));
      return;
    }
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white">
        Crear campaña / Build Campaign
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Nueva campaña / New Campaign</h4>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input value={objectiveEs} onChange={(e) => setObjectiveEs(e.target.value)} placeholder="Objetivo (español) / Objective (Spanish)" className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        <input value={objectiveEn} onChange={(e) => setObjectiveEn(e.target.value)} placeholder="Objective (English)" className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        <input value={targetAudienceEs} onChange={(e) => setTargetAudienceEs(e.target.value)} placeholder="Audiencia / Audience" className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        <input value={offerEs} onChange={(e) => setOfferEs(e.target.value)} placeholder="Oferta / Offer" className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        <input value={primaryCtaEs} onChange={(e) => setPrimaryCtaEs(e.target.value)} placeholder="CTA principal / Primary CTA" className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        <input value={capacityAssumption} onChange={(e) => setCapacityAssumption(e.target.value)} placeholder="Supuesto de capacidad / Capacity assumption" className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        <label className="flex flex-col text-[11px] text-[#6B5E47]">
          Inicio / Start
          <input type="date" value={campaignStart} onChange={(e) => setCampaignStart(e.target.value)} className="mt-1 min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-[11px] text-[#6B5E47]">
          Fin / End
          <input type="date" value={campaignEnd} onChange={(e) => setCampaignEnd(e.target.value)} className="mt-1 min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col text-[11px] text-[#6B5E47] sm:col-span-2">
          Presupuesto si se conoce (USD) / Budget if known (USD)
          <input type="number" min="0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="mt-1 min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
        </label>
      </div>

      <h5 className="mt-3 text-[11px] font-bold uppercase tracking-wide text-[#8A6B1F]">Canales / Channels</h5>
      <ul className="mt-1 space-y-1.5">
        {mediaChannels.map((c) => (
          <li key={c.id} className="rounded-lg border border-[#E8DFD0] p-2">
            <label className="flex min-h-[44px] cursor-pointer items-start gap-2">
              <input type="checkbox" checked={selectedChannels.has(c.id)} onChange={() => toggleChannel(c.id)} className="mt-1 h-[18px] w-[18px] shrink-0" aria-label={c.labelEn} />
              <span className="text-sm">
                <span className="block font-semibold text-[#1E1810]">
                  {c.labelEs} / {c.labelEn}
                  {c.channelClass === "partner" ? <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-800">Socio / Partner</span> : null}
                </span>
                {c.channelClass === "partner" && c.notesEs ? (
                  <span className="block text-[11px] text-[#6B5E47]">
                    {c.notesEs} / {c.notesEn}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={submitting} onClick={() => void submit()} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {submitting ? "Creando… / Creating…" : "Crear campaña / Create Campaign"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
          Cancelar / Cancel
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign status
// ---------------------------------------------------------------------------

export function CampaignStatusControl({ businessId, campaignId, status }: { businessId: string; campaignId: string; status: GrowthCampaignStatus }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const NEXT_STATUS: Partial<Record<GrowthCampaignStatus, GrowthCampaignStatus>> = {
    draft: "ready_for_review",
    ready_for_review: "approved",
    approved: "in_production",
    in_production: "live",
    live: "measuring",
    measuring: "complete",
  };
  const next = NEXT_STATUS[status];

  async function advance() {
    if (!next) return;
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/campaigns/${campaignId}`, "PATCH", { status: next });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo actualizar la campaña. / Could not update the campaign."));
      return;
    }
    router.refresh();
  }

  if (!next) return null;

  return (
    <div className="mt-1">
      <button type="button" disabled={submitting} onClick={() => void advance()} className="inline-flex min-h-[36px] items-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-1.5 text-[11px] font-bold text-[#7A1E2C] disabled:opacity-50">
        {submitting ? "Guardando… / Saving…" : `Avanzar a / Move to ${next}`}
      </button>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
    </div>
  );
}

/**
 * WHOLE-PRODUCT PARTIAL-CLOSURE (AL_OUTCOMES / BV_MEASUREMENT) — records a real
 * business_outcomes row against this campaign through the canonical Program 7 Outcomes API
 * (POST /api/admin/businesses/[businessId]/outcomes), never a Growth-only measurement store.
 */
export function RecordOutcomeForm({ businessId, growthCampaignId }: { businessId: string; growthCampaignId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricLabelEs, setMetricLabelEs] = useState("");
  const [metricLabelEn, setMetricLabelEn] = useState("");
  const [baselineValue, setBaselineValue] = useState("");
  const [measuredValue, setMeasuredValue] = useState("");

  async function submit() {
    if (!metricLabelEs.trim() || !metricLabelEn.trim()) {
      setError("Se requiere el nombre de la métrica en español e inglés. / Metric name is required in Spanish and English.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const metricKey = metricLabelEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/outcomes`, "POST", {
      growthCampaignId,
      metricKey,
      metricLabelEs: metricLabelEs.trim(),
      metricLabelEn: metricLabelEn.trim(),
      baselineValue: baselineValue.trim() || null,
      measuredValue: measuredValue.trim() || null,
      measurementSource: "staff_observation",
      measuredAt: measuredValue.trim() ? new Date().toISOString() : null,
    });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar el resultado. / Could not save the outcome."));
      return;
    }
    setMetricLabelEs("");
    setMetricLabelEn("");
    setBaselineValue("");
    setMeasuredValue("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 inline-flex min-h-[36px] items-center rounded-lg border border-[#C9A84A]/70 bg-white px-3 py-1.5 text-[11px] font-bold text-[#7A1E2C]">
        Registrar resultado / Record outcome
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/50 p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input aria-label="Métrica (es) / Metric (es)" value={metricLabelEs} onChange={(e) => setMetricLabelEs(e.target.value)} placeholder="Métrica (es) — ej. Llamadas por semana" className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
        <input aria-label="Metric (en)" value={metricLabelEn} onChange={(e) => setMetricLabelEn(e.target.value)} placeholder="Metric (en) — e.g. Calls per week" className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
        <input aria-label="Línea base / Baseline" value={baselineValue} onChange={(e) => setBaselineValue(e.target.value)} placeholder="Línea base / Baseline (optional)" className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
        <input aria-label="Medido ahora / Measured now" value={measuredValue} onChange={(e) => setMeasuredValue(e.target.value)} placeholder="Medido ahora / Measured now (optional)" className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      </div>
      {error ? <p role="alert" className="mt-1 text-[10px] text-red-700">{error}</p> : null}
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={submitting} onClick={() => void submit()} className="min-h-[36px] rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
          {submitting ? "Guardando… / Saving…" : "Guardar / Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-[11px] font-semibold text-[#3D3428]">
          Cancelar / Cancel
        </button>
      </div>
    </div>
  );
}
