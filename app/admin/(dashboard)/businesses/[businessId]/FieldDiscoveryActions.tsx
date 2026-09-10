"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AiResearchInputPacket, BusinessAiBriefingDraft, BusinessAiResearchRun } from "@/app/lib/business/aiResearch/types";
import type { BusinessConsentRecord, BusinessSourceFile, BusinessSourceLink } from "@/app/lib/business/fieldDiscovery/types";
import { findSourceDefinition } from "@/app/lib/business/fieldDiscovery/sourceRegistry";

async function postJson(url: string, method: string, body: unknown): Promise<{ ok: boolean; body: Record<string, unknown> | null }> {
  const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const parsed = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { ok: res.ok && Boolean(parsed?.ok), body: parsed };
}

// ---------------------------------------------------------------------------
// 1-2. Canvassing overview + consent status (read-only, server-fetched props)
// ---------------------------------------------------------------------------

export function ConsentStatusPanel({ consent }: { consent: readonly BusinessConsentRecord[] }) {
  const latestByType = new Map<string, BusinessConsentRecord>();
  for (const c of consent) {
    if (!latestByType.has(c.consentType)) latestByType.set(c.consentType, c);
  }
  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Consentimiento / Consent</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {[...latestByType.entries()].map(([type, record]) => (
          <li key={type}>
            <span className="font-semibold">{type}:</span>{" "}
            <span className={record.consentState === "provided" ? "text-green-700" : "text-red-700"}>{record.consentState}</span>
          </li>
        ))}
        {latestByType.size === 0 ? <li className="text-[#6B5E47]">Sin registros de consentimiento. / No consent recorded yet.</li> : null}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Source links
// ---------------------------------------------------------------------------

export function SourceLinksPanel({ sourceLinks }: { sourceLinks: readonly BusinessSourceLink[] }) {
  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Fuentes / Sources</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {sourceLinks.map((s) => {
          const definition = findSourceDefinition(s.sourceType);
          const isLive = definition.researchSupport === "live_v1";
          return (
            <li key={s.id} className="flex items-center justify-between gap-2">
              <span className="truncate">
                <span className="font-semibold">{s.sourceType}:</span> {s.normalizedUrl}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${isLive ? "bg-emerald-100 text-emerald-900" : "bg-[#FAF7F2] text-[#6B5E47]"}`}
                  title={isLive ? "Investigado automáticamente por Leonix. / Automatically researched by Leonix." : "Enlace manual — Leonix no puede investigar esta plataforma automáticamente todavía (requiere acceso de API con permiso comercial). / Manual link — Leonix cannot automatically research this platform yet (requires business-permissioned API access)."}
                >
                  {isLive ? "Auto" : "Manual"}
                </span>
                <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-xs">{s.status}</span>
              </span>
            </li>
          );
        })}
        {sourceLinks.length === 0 ? <li className="text-[#6B5E47]">Sin fuentes todavía. / No sources yet.</li> : null}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Uploaded files
// ---------------------------------------------------------------------------

export function SourceFilesPanel({ sourceFiles }: { sourceFiles: readonly BusinessSourceFile[] }) {
  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Archivos / Files</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {sourceFiles.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2">
            <a href={f.publicUrl} target="_blank" rel="noreferrer" className="truncate text-[#7A1E2C] underline">
              {f.fileKind}: {f.originalFilename}
            </a>
            <span className="shrink-0 rounded-full bg-[#FAF7F2] px-2 py-0.5 text-xs">{f.uploadStatus}</span>
          </li>
        ))}
        {sourceFiles.length === 0 ? <li className="text-[#6B5E47]">Sin archivos todavía. / No files yet.</li> : null}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6-7. Website research / AI provider status + run button
// ---------------------------------------------------------------------------

export function RunResearchButton({
  businessId,
  canRun,
  providerAvailable,
  googlePlacesAvailable,
  runs,
}: {
  businessId: string;
  canRun: boolean;
  providerAvailable: boolean;
  googlePlacesAvailable: boolean;
  runs: readonly BusinessAiResearchRun[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = runs[0] ?? null;

  async function run() {
    setSubmitting(true);
    setError(null);
    const { ok, body } = await postJson(`/api/admin/businesses/${businessId}/research`, "POST", {});
    setSubmitting(false);
    if (!ok) {
      setError(String(body?.error ?? "run_failed"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Investigación con IA / AI Research</h3>
      <p className="mt-1 text-sm text-[#6B5E47]">
        Proveedor de síntesis / Synthesis provider: {providerAvailable ? "Gemini disponible / available" : "No configurado / Not configured"}
      </p>
      <p className="mt-1 text-sm text-[#6B5E47]">
        Google Business Profile: {googlePlacesAvailable ? "Búsqueda en vivo disponible / Live lookup available" : "No configurado (GOOGLE_PLACES_API_KEY) / Not configured (GOOGLE_PLACES_API_KEY)"}
      </p>
      {latest ? (
        <p className="mt-1 text-sm">
          Última ejecución / Last run: <span className="font-semibold">{latest.status}</span>
          {latest.failureReason ? ` — ${latest.failureReason}` : ""}
        </p>
      ) : null}
      {error ? <p role="alert" className="mt-1 text-xs text-red-700">{error}</p> : null}
      {canRun ? (
        <button
          type="button"
          onClick={() => void run()}
          disabled={submitting || !providerAvailable}
          className="mt-2 min-h-[40px] rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {submitting ? "Ejecutando… / Running…" : "Ejecutar investigación / Run research"}
        </button>
      ) : (
        <p className="mt-2 text-xs text-[#6B5E47]">Se requiere un manager para ejecutar. / A manager is required to run this.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7b. Raw per-source findings from the latest run — transparency into what was actually
// checked and found, distinct from the LLM's synthesized draft below. Staff should never have
// to trust a summary alone; every source-level fact here is exactly what the adapters returned,
// with its own requiresConfirmation flags.
// ---------------------------------------------------------------------------

function websiteStatusLabel(status: string): string {
  if (status === "completed") return "Revisado / Checked";
  if (status === "unreachable") return "No se pudo acceder / Unreachable";
  if (status === "blocked") return "Bloqueado / Blocked";
  if (status === "unsupported") return "No compatible / Unsupported";
  return status;
}

function googlePlacesStatusLabel(status: string): string {
  if (status === "completed") return "Encontrado / Found";
  if (status === "not_configured") return "No configurado / Not configured";
  if (status === "not_found") return "No se encontró coincidencia / No match found";
  if (status === "unreachable") return "No se pudo acceder / Unreachable";
  if (status === "unauthorized") return "Clave rechazada / Key rejected";
  return status;
}

export function SourceFindingsPanel({ latestRun }: { latestRun: BusinessAiResearchRun | null }) {
  const packet = (latestRun?.inputSnapshot ?? null) as AiResearchInputPacket | null;
  const website = packet?.websiteResearch ?? null;
  const places = packet?.googlePlacesResearch ?? null;

  if (!latestRun || (!website && !places)) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Fuentes revisadas / Sources checked</h3>
        <p className="mt-1 text-sm text-[#6B5E47]">Todavía no se ha ejecutado una investigación. / No research run yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Fuentes revisadas / Sources checked</h3>
      <p className="mt-1 text-xs text-[#9A9184]">
        Estos son los hallazgos crudos de cada fuente, no un resumen de IA. Todo requiere confirmación de un humano antes de convertirse en un hecho. / These are the raw findings from each source, not an AI summary. Everything requires human confirmation before becoming a fact.
      </p>

      {website ? (
        <div className="mt-3 rounded-lg border border-dashed border-[#E8DFD0] p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Sitio web / Website</span>
            <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase">{websiteStatusLabel(website.status)}</span>
          </div>
          {website.title ? <p className="mt-1 text-xs">{website.title}</p> : null}
          {website.evidence.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-xs text-[#6B5E47]">
              {website.evidence.slice(0, 8).map((e, i) => (
                <li key={i}>{e.claim}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {places ? (
        <div className="mt-3 rounded-lg border border-dashed border-[#E8DFD0] p-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">Google Business Profile</span>
            <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase">{googlePlacesStatusLabel(places.status)}</span>
          </div>
          {places.matchedName ? <p className="mt-1 text-xs">{places.matchedName} — {places.formattedAddress ?? "sin dirección / no address"}</p> : null}
          {places.evidence.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-xs text-[#6B5E47]">
              {places.evidence.map((e, i) => (
                <li key={i}>
                  {e.claim}
                  {e.requiresConfirmation ? <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800">Confirmar / Confirm</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {places.limitations.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-[10px] text-[#9A9184]">
              {places.limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8-15. AI briefing draft — strengths/opportunities/contradictions/unknowns/limitations,
// promotion/review actions, history.
// ---------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8A6B1F]">{confidence}</span>;
}

function DraftItemRow({
  businessId,
  draftId,
  itemId,
  action,
  claimEs,
  claimEn,
  confidence,
  promotionStatus,
  canPromote,
  canReview,
}: {
  businessId: string;
  draftId: string;
  itemId: string;
  action: "promote_strength" | "promote_opportunity" | "promote_unknown" | "promote_contradiction";
  claimEs: string;
  claimEn: string;
  confidence: string;
  promotionStatus: "unresolved" | "promoted" | "rejected";
  canPromote: boolean;
  canReview: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(actionName: string) {
    setBusy(true);
    await postJson(`/api/admin/businesses/${businessId}/briefing/${draftId}`, "PATCH", { action: actionName, itemId });
    setBusy(false);
    router.refresh();
  }

  return (
    <li className="rounded-lg border border-dashed border-[#E8DFD0] p-2">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">Draft / Inference</span>
        <ConfidenceBadge confidence={confidence} />
        <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] uppercase">{promotionStatus}</span>
      </div>
      <p className="mt-1 text-sm">{claimEs}</p>
      <p className="text-sm text-[#6B5E47]">{claimEn}</p>
      {promotionStatus === "unresolved" ? (
        <div className="mt-1 flex gap-2">
          {canPromote ? (
            <button type="button" disabled={busy} onClick={() => void act(action)} className="min-h-[32px] rounded-lg bg-[#7A1E2C] px-3 py-1 text-xs font-bold text-white disabled:opacity-50">
              Promover / Promote
            </button>
          ) : null}
          {canReview ? (
            <button type="button" disabled={busy} onClick={() => void act("reject_item")} className="min-h-[32px] rounded-lg border border-[#E8DFD0] px-3 py-1 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
              Rechazar / Reject
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function BriefingReviewPanel({
  businessId,
  draft,
  canReview,
  canPromote,
}: {
  businessId: string;
  draft: BusinessAiBriefingDraft | null;
  canReview: boolean;
  canPromote: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!draft) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Borrador de IA / AI Briefing Draft</h3>
        <p className="mt-1 text-sm text-[#6B5E47]">Todavía no hay un borrador. / No draft yet.</p>
      </div>
    );
  }

  const confirmedDraft = draft;
  async function markReviewed() {
    setBusy(true);
    await postJson(`/api/admin/businesses/${businessId}/briefing/${confirmedDraft.id}`, "PATCH", { action: "mark_reviewed" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Borrador de IA / AI Briefing Draft</h3>
        <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-xs">{draft.reviewStatus}</span>
      </div>
      <p className="mt-2 text-sm">{draft.summaryEs}</p>
      <p className="text-sm text-[#6B5E47]">{draft.summaryEn}</p>

      <h4 className="mt-3 text-xs font-bold text-[#3D3428]">Fortalezas / Strengths</h4>
      <ul className="mt-1 space-y-2">
        {draft.strengths.map((s) => (
          <DraftItemRow key={s.itemId} businessId={businessId} draftId={draft.id} itemId={s.itemId} action="promote_strength" claimEs={s.claimEs} claimEn={s.claimEn} confidence={s.confidence} promotionStatus={s.promotionStatus} canPromote={canPromote} canReview={canReview} />
        ))}
      </ul>

      <h4 className="mt-3 text-xs font-bold text-[#3D3428]">Oportunidades / Opportunities</h4>
      <ul className="mt-1 space-y-2">
        {draft.opportunities.map((o) => (
          <DraftItemRow key={o.itemId} businessId={businessId} draftId={draft.id} itemId={o.itemId} action="promote_opportunity" claimEs={o.claimEs} claimEn={o.claimEn} confidence={o.confidence} promotionStatus={o.promotionStatus} canPromote={canPromote} canReview={canReview} />
        ))}
      </ul>

      <h4 className="mt-3 text-xs font-bold text-[#3D3428]">Contradicciones / Contradictions</h4>
      <ul className="mt-1 space-y-2">
        {draft.contradictions.map((c) => (
          <DraftItemRow key={c.itemId} businessId={businessId} draftId={draft.id} itemId={c.itemId} action="promote_contradiction" claimEs={c.descriptionEs} claimEn={c.descriptionEn} confidence="medium" promotionStatus={c.promotionStatus} canPromote={canPromote} canReview={canReview} />
        ))}
      </ul>

      <h4 className="mt-3 text-xs font-bold text-[#3D3428]">Desconocidos / Unknowns</h4>
      <ul className="mt-1 space-y-2">
        {draft.unknowns.map((u) => (
          <DraftItemRow key={u.itemId} businessId={businessId} draftId={draft.id} itemId={u.itemId} action="promote_unknown" claimEs={u.questionEs} claimEn={u.questionEn} confidence={u.priority} promotionStatus={u.promotionStatus} canPromote={canPromote} canReview={canReview} />
        ))}
      </ul>

      <h4 className="mt-3 text-xs font-bold text-[#3D3428]">Limitaciones / Limitations</h4>
      <ul className="mt-1 list-inside list-disc text-xs text-[#6B5E47]">
        {draft.limitations.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>

      {canReview && draft.reviewStatus === "draft" ? (
        <button type="button" disabled={busy} onClick={() => void markReviewed()} className="mt-3 min-h-[40px] rounded-lg bg-[#3D3428] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          Marcar como revisado / Mark reviewed
        </button>
      ) : null}
    </div>
  );
}
