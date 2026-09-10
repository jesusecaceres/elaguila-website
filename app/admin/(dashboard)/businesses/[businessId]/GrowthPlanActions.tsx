"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";
import type { GrowthProviderClass, GrowthSolutionState, GrowthCampaignStatus, GrowthRoadmapStepState } from "@/app/lib/business/growthEngine/types";

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

export function ReviewAssessmentButton({ businessId, assessmentId }: { businessId: string; assessmentId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/growth/assessment`, "PATCH", { assessmentId, note: note.trim() || null });
    setSubmitting(false);
    if (!ok) {
      setError(humanizeStaffWriteError(body?.error as string | undefined, "No se pudo guardar este cambio. No se perdió nada en esta pantalla. / We couldn't save this change. Nothing was lost from this screen."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2">
      {showNote ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota del operador (opcional) / Operator note (optional)"
            className="min-h-[44px] flex-1 rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
            rows={2}
          />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Aceptar como guía de trabajo / Accept as working guidance
        </button>
        {!showNote ? (
          <button type="button" onClick={() => setShowNote(true)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
            Agregar nota / Add note
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[10px] text-[#9A9184]">
        Esto no confirma hechos automáticamente. Use el Libro del Negocio para confirmar hechos. / This does not automatically confirm facts. Use the Business Book to confirm facts.
      </p>
      {error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Solution actions — state transitions + Creative Studio bridge
// ---------------------------------------------------------------------------

const PROVIDER_CLASS_LABEL: Record<GrowthProviderClass, { es: string; en: string }> = {
  leonix_provides: { es: "Leonix puede ayudar", en: "Leonix can help" },
  leonix_coordinates_partner: { es: "Leonix + socio", en: "Leonix + partner" },
  external_professional_required: { es: "Profesional externo", en: "External professional" },
};

export function providerClassLabel(providerClass: GrowthProviderClass): string {
  const l = PROVIDER_CLASS_LABEL[providerClass];
  return `${l.es} / ${l.en}`;
}

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

const ROADMAP_STATE_LABEL: Record<GrowthRoadmapStepState, { es: string; en: string }> = {
  not_started: { es: "Sin empezar", en: "Upcoming" },
  in_progress: { es: "En curso", en: "Current" },
  needs_client_input: { es: "Requiere info del cliente", en: "Needs Client Input" },
  needs_official_research: { es: "Requiere investigación oficial", en: "Needs Official Research" },
  blocked: { es: "Bloqueado", en: "Blocked" },
  complete: { es: "Completo", en: "Complete" },
  not_applicable: { es: "No aplica", en: "Not Applicable" },
};

export function roadmapStateLabel(state: GrowthRoadmapStepState): string {
  const l = ROADMAP_STATE_LABEL[state];
  return `${l.es} / ${l.en}`;
}

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
        className="min-h-[36px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-[11px]"
      >
        {(Object.keys(ROADMAP_STATE_LABEL) as GrowthRoadmapStepState[]).map((s) => (
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

export function QuestionsBatchAddForm({ businessId, questions }: { businessId: string; questions: readonly { textEs: string; textEn: string }[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
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

  return (
    <div className="mt-3">
      <ul className="space-y-1.5">
        {questions.map((q, i) => (
          <li key={i} className="flex items-start gap-2 rounded-lg border border-[#E8DFD0] bg-white p-2">
            <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="mt-1 h-[18px] w-[18px] shrink-0" aria-label={q.textEn} />
            <span className="text-sm">
              <span className="block">{q.textEs}</span>
              <span className="block text-[#6B5E47]">{q.textEn}</span>
            </span>
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
          <li key={c.id} className="flex items-start gap-2 rounded-lg border border-[#E8DFD0] p-2">
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
