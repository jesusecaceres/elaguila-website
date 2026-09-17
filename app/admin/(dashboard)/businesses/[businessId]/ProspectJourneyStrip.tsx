import Link from "next/link";
import { resolveConciergeActionDestination } from "../../../_lib/conciergeIntent";

/**
 * Prospect preparation journey — RESEARCH → BUSINESS INFORMATION → PREPARE FOR CLIENT.
 *
 * Pure presentation over data the business page ALREADY loaded (nothing is queried here). Every
 * button is a jump to an existing section id on this same page or to an existing route; the
 * strip adds no engine, no score, and no new write path. Wording is deliberately honest about
 * what research really is (Google Places when configured, one bounded fetch of the business's
 * own website link, AI briefing drafts from Gemini, staff-captured source links/files) — never
 * a "full web" claim — and about the fact that AI output becomes canonical truth only after a
 * human review promotes it into the Living Book (business_facts, source class ai_inference).
 */

export type ProspectJourneyResearch =
  | { available: false }
  | {
      available: true;
      runCount: number;
      latestRunStatus: string | null;
      latestDraftReviewStatus: string | null;
      sourceLinkCount: number;
      sourceFileCount: number;
      googlePlacesAvailable: boolean;
      providerAvailable: boolean;
      canRun: boolean;
      canReview: boolean;
    };

export type ProspectJourneyStripProps = {
  businessId: string;
  research: ProspectJourneyResearch;
  identity: { metCount: number; totalCount: number; nextHelpfulActionEn: string };
  book: { available: boolean; confirmedFactCount: number; openUnknownCount: number; unresolvedContradictionCount: number };
  prepare: {
    businessProfile: boolean;
    creativeStudio: boolean;
    canCreateCreativeJob: boolean;
  };
};

function researchStateLabel(r: Extract<ProspectJourneyResearch, { available: true }>): string {
  if (r.runCount === 0) return "Sin investigación aún / No research run yet";
  if (r.latestRunStatus === "running" || r.latestRunStatus === "queued") return "Investigación en curso / Research in progress";
  if (r.latestRunStatus === "failed") return "Última investigación falló / Last research failed";
  switch (r.latestDraftReviewStatus) {
    case "draft":
      return "Borrador IA esperando revisión humana / AI draft awaiting human review";
    case "staff_reviewed":
      return "Revisado — promueva ítems al Libro / Reviewed — promote items to the Book";
    case "partially_promoted":
      return "Parcialmente promovido al Libro / Partially promoted to the Book";
    case "fully_promoted":
      return "Promovido al Libro del Negocio / Promoted to the Business Book";
    case "rejected":
      return "Borrador rechazado / Draft rejected";
    default:
      return `${r.runCount} corrida(s) / run(s)`;
  }
}

const btnPrimary = "inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white";
const btnSecondary = "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 py-2 text-xs font-semibold text-[#1E1810]";

export function ProspectJourneyStrip({ businessId, research, identity, book, prepare }: ProspectJourneyStripProps) {
  const identityComplete = identity.totalCount > 0 && identity.metCount >= identity.totalCount;
  return (
    <section
      id="prospect-journey"
      aria-label="Prospect preparation journey"
      className="scroll-mt-24 rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-4"
    >
      <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
        Preparación del prospecto / Prospect preparation · Investigar → Revisar → Confirmar la verdad → Preparar para el cliente
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* 1. RESEARCH */}
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">1 · Investigación / Research</p>
          {research.available ? (
            <>
              <p className="mt-1 text-sm font-semibold text-[#1E1810]">{researchStateLabel(research)}</p>
              <p className="mt-1 text-[11px] text-[#7A7164]">
                {research.sourceLinkCount} enlace(s) · {research.sourceFileCount} archivo(s) / {research.sourceLinkCount} link(s) · {research.sourceFileCount} file(s)
                {" · "}
                Google Places: {research.googlePlacesAvailable ? "configurado / configured" : "no configurado / not configured"}
                {" · "}
                IA: {research.providerAvailable ? "disponible / available" : "no configurada / not configured"}
              </p>
              <p className="mt-1 text-[11px] text-[#7A7164]">
                Fuentes reales: Google Places (si está configurado), una lectura del sitio web enlazado, enlaces/archivos capturados y un borrador IA. Nunca “toda la web”. / Real sources: Google Places (when configured), one read of the linked website, captured links/files, and an AI draft. Never “the whole web”.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href="#discover" className={btnPrimary}>
                  {research.runCount === 0
                    ? research.canRun
                      ? "Ejecutar investigación / Run research"
                      : "Ver fuentes / View sources"
                    : research.canReview
                      ? "Revisar investigación / Review research"
                      : "Ver investigación / View research"}
                </a>
                <Link href={`/admin/field/${businessId}`} className={btnSecondary}>
                  Agregar fuentes y archivos (Campo) / Add sources &amp; files (Field)
                </Link>
              </div>
              {!research.canRun ? (
                <p className="mt-2 text-[11px] text-[#7A7164]">Ejecutar y promover investigación IA es acción de gerente+. / Running and promoting AI research is a manager+ action.</p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-xs text-[#7A7164]">Descubrimiento de campo no disponible para su rol. / Field discovery is not available for your role.</p>
          )}
        </div>

        {/* 2. BUSINESS INFORMATION (human review → canonical truth) */}
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">2 · Información del negocio / Business information</p>
          <p className="mt-1 text-sm font-semibold text-[#1E1810]">
            Identidad {identity.metCount}/{identity.totalCount} {identityComplete ? "completa / complete" : "— falta información / — information missing"}
          </p>
          {!identityComplete ? <p className="mt-1 text-[11px] text-[#7A7164]">{identity.nextHelpfulActionEn}</p> : null}
          {book.available ? (
            <p className="mt-1 text-[11px] text-[#7A7164]">
              Libro del Negocio: {book.confirmedFactCount} confirmado(s) · {book.openUnknownCount} incógnita(s) · {book.unresolvedContradictionCount} conflicto(s) / Business Book: {book.confirmedFactCount} confirmed · {book.openUnknownCount} unknowns · {book.unresolvedContradictionCount} conflicts
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-[#7A7164]">
            La verdad canónica es la identidad confirmada + hechos confirmados por humanos. Un borrador IA nunca se vuelve hecho sin revisión. / Canonical truth is the confirmed identity + human-confirmed facts. An AI draft never becomes a fact without review.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href="#overview" className={identityComplete ? btnSecondary : btnPrimary}>
              {identityComplete ? "Revisar identidad / Review identity" : "Ver qué falta / See what is missing"}
            </a>
            {book.available ? (
              <a href="#business-book" className={btnSecondary}>
                Confirmar hechos / Confirm facts
              </a>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-[#9A9184]">
            Datos de contacto del negocio los edita el dueño en su panel (o se capturan al agregar el prospecto). / The owner edits business contact data in their dashboard (or it is captured when adding the prospect).
          </p>
        </div>

        {/* 3. PREPARE FOR CLIENT */}
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">3 · Preparar para el cliente / Prepare for client</p>
          <p className="mt-1 text-[11px] text-[#7A7164]">
            Todo se construye desde la misma identidad confirmada. / Everything is built from the same confirmed identity.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {prepare.businessProfile ? (
              <a href="#business-profile" className={btnPrimary}>
                Perfil de Negocio / Business Profile
              </a>
            ) : null}
            <Link href={resolveConciergeActionDestination("create_listing", businessId)} className={btnPrimary}>
              Crear anuncio / listado / Create Ad / Listing
            </Link>
            {prepare.creativeStudio ? (
              <>
                <a href="#creative" className={btnSecondary}>
                  Estudio Creativo / Creative Studio
                </a>
                <a href="#creative" className={btnSecondary} title="Magazine ad is an asset type inside Creative Studio; there is no separate magazine placement tool.">
                  Creativo para Revista / Magazine creative
                </a>
              </>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-[#9A9184]">
            {prepare.creativeStudio
              ? prepare.canCreateCreativeJob
                ? "Un trabajo creativo (incl. anuncio de revista) se crea desde una Oportunidad o una Solución de Crecimiento. / A creative job (incl. magazine ad) is created from an Opportunity or a Growth Solution."
                : "Puede ver y subir activos; crear un trabajo creativo es acción de gerente+. / You can view and upload assets; creating a creative job is manager+."
              : "Estudio Creativo no habilitado en este entorno. / Creative Studio is not enabled in this environment."}
          </p>
        </div>
      </div>
    </section>
  );
}
