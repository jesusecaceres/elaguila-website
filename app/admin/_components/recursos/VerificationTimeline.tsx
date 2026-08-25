import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { VerificationEventRow } from "@/app/lib/recursos/intake/server/verificationEventsDb";

/**
 * Recursos Intake OS — Gate 6K/6L shared internal timeline renderer. Used on both the resource
 * detail page and the candidate review pages so the same event vocabulary reads identically
 * everywhere. Internal admin UI only — never rendered on any public route.
 */

const EVENT_LABEL: Record<string, string> = {
  candidate_created: "Candidato creado",
  ai_proposal_generated: "Propuesta de IA generada",
  evidence_recorded: "Evidencia registrada",
  field_accepted: "Campo aceptado",
  field_rejected: "Campo rechazado",
  promoted: "Promovido a recurso",
  dropped: "Candidato descartado",
  reverified: "Verificado / reverificado",
};

function TimelineEntry({ e }: { e: VerificationEventRow }) {
  return (
    <div className="flex gap-3 border-b border-[color:var(--lx-border)]/50 py-2.5 last:border-0">
      <div className="w-28 shrink-0 text-[11px] text-[#8B7E70]">{new Date(e.createdAt).toLocaleString()}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1E1810]">{EVENT_LABEL[e.eventType] ?? e.eventType}</p>
        <p className="text-xs text-[#7A7164]">
          {e.actorEmail ? `${e.actorEmail} · ` : ""}
          {e.sourceType ? `${e.sourceType} · ` : ""}
          {e.notes ?? ""}
        </p>
        {e.previousValue || e.acceptedValue ? (
          <p className="mt-0.5 text-[11px] text-[#7A7164]">
            {e.previousValue ? <span className="line-through">{e.previousValue}</span> : null}
            {e.previousValue && e.acceptedValue ? " → " : ""}
            {e.acceptedValue ?? ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function VerificationTimeline({ events, title = "Historial de verificación (interno)", compact = false }: { events: VerificationEventRow[]; title?: string; compact?: boolean }) {
  if (events.length === 0) return null;
  return (
    <section className={`${adminCardBase} ${compact ? "p-4" : "p-5"}`}>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5C4E2E]">{title}</h2>
      <div>
        {events.map((e) => (
          <TimelineEntry key={e.id} e={e} />
        ))}
      </div>
    </section>
  );
}
