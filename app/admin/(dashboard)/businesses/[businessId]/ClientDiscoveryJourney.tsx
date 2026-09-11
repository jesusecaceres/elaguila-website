import Link from "next/link";
import {
  AddProjectIntentForm,
  CaptureAnswerForm,
  ConsentToggle,
  DiscoveryAssetUpload,
  DiscoveryStatusButtons,
  IntentStatusButtons,
  ItemReviewButtons,
  LinkMeetingButton,
  MeetingNoteCapture,
  SendQuestionsToMeetingButton,
  StartDiscoveryForm,
  VisualReferenceForm,
} from "./ClientDiscoveryActions";
import {
  EMPTY_STATE_NO_ASSETS,
  EMPTY_STATE_NO_DISCOVERY,
  EMPTY_STATE_NO_NOTES,
  EMPTY_STATE_NO_PROJECT_INTENT,
  questionsEmptyStateFor,
} from "@/app/lib/business/projectDiscovery/discoveryEmptyStates";
import { formatBilingual } from "@/app/lib/business/projectDiscovery/discoveryLabels";
import {
  buildBeforeYouWrapUpView,
  buildLeonixDecisionsView,
  buildMultiProjectNav,
  buildOfficialResearchView,
  buildQuestionsToAskNowView,
  buildScopeWarningView,
  buildSectionsReviewView,
  buildTopScreenSummary,
  buildWhatWeAlreadyKnow,
} from "@/app/lib/business/projectDiscovery/discoveryWorkspaceViewModel";
import type { RequirementEvaluation, WebsiteReadinessResult, WebsiteScopeSignalResult } from "@/app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import type { QuestionCandidate } from "@/app/lib/business/projectDiscovery/websiteQuestionEngine";
import type {
  ProjectDiscovery,
  ProjectDiscoveryConsent,
  ProjectDiscoveryEvent,
  ProjectDiscoveryIntent,
  ProjectDiscoveryItem,
  ProjectDiscoverySource,
} from "@/app/lib/business/projectDiscovery/types";

const CARD = "rounded-2xl border border-[#E8DFD0] bg-white p-4";
const SUBCARD = "rounded-lg border border-[#E8DFD0] p-3";

export interface WebsiteEngineOutput {
  evaluations: readonly RequirementEvaluation[];
  readiness: WebsiteReadinessResult;
  questionsToAskNow: readonly QuestionCandidate[];
  wrapUp: readonly QuestionCandidate[];
  scopeSignals: WebsiteScopeSignalResult;
}

export interface ClientDiscoveryJourneyProps {
  businessId: string;
  currentDiscovery: ProjectDiscovery | null;
  otherDiscoveries: readonly ProjectDiscovery[];
  intents: readonly ProjectDiscoveryIntent[];
  selectedIntentId: string | null;
  items: readonly ProjectDiscoveryItem[];
  sources: readonly ProjectDiscoverySource[];
  consents: readonly ProjectDiscoveryConsent[];
  events: readonly ProjectDiscoveryEvent[];
  website: WebsiteEngineOutput | null;
  upcomingMeetings: readonly { id: string; label: string }[];
  canCreate: boolean;
  canManage: boolean;
  canReview: boolean;
  canManageConsent: boolean;
  startFromGrowthSolution?: { titleEs: string; titleEn: string; sourceGrowthSolutionId: string; sourceGrowthAssessmentId?: string } | null;
}

function itemForField(items: readonly ProjectDiscoveryItem[], fieldKey: string, intentId: string | null): ProjectDiscoveryItem | null {
  return items.find((i) => i.fieldKey === fieldKey && i.projectIntentId === intentId) ?? items.find((i) => i.fieldKey === fieldKey && i.projectIntentId === null) ?? null;
}

export function ClientDiscoveryJourney(props: ClientDiscoveryJourneyProps) {
  const { businessId, currentDiscovery, intents, selectedIntentId, items, sources, consents, events, website, upcomingMeetings, canCreate, canManage, canReview, canManageConsent } = props;

  if (!currentDiscovery) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6B5E47]">{formatBilingual(EMPTY_STATE_NO_DISCOVERY)}</p>
        {canCreate ? (
          <StartDiscoveryForm
            businessId={businessId}
            prefillTitle={props.startFromGrowthSolution ? props.startFromGrowthSolution.titleEs : undefined}
            sourceGrowthSolutionId={props.startFromGrowthSolution?.sourceGrowthSolutionId}
            sourceGrowthAssessmentId={props.startFromGrowthSolution?.sourceGrowthAssessmentId}
          />
        ) : null}
      </div>
    );
  }

  const navItems = buildMultiProjectNav(intents);
  const selectedIntent = intents.find((i) => i.id === selectedIntentId) ?? intents[0] ?? null;
  const unresolvedQuestionCount = website ? website.questionsToAskNow.length : 0;
  const topScreen = buildTopScreenSummary({ discovery: currentDiscovery, readiness: website?.readiness ?? null, unresolvedQuestionCount });

  return (
    <div className="space-y-4">
      {/* Top screen (MD <top_screen>) */}
      <section className={`${CARD} bg-[#FFFDF7]`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#3D3428]">{formatBilingual(topScreen.discoveryStatusLabel)}</span>
          {topScreen.readinessLabel ? <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-bold uppercase text-[#8A6B1F]">{formatBilingual(topScreen.readinessLabel)}</span> : null}
        </div>
        <p className="mt-2 text-sm font-semibold text-[#1E1810]">{currentDiscovery.title}</p>
        <p className="mt-1 text-xs text-[#6B5E47]">{formatBilingual(topScreen.progressSummary)}</p>
        {events.length > 0 ? (
          <p className="mt-1 text-[10px] text-[#9A9184]">Última actividad / Last activity: {new Date(events[0].createdAt).toLocaleString("en-US")}</p>
        ) : null}
        <a href="#discovery-dominant-action" className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white">
          {formatBilingual(topScreen.dominantAction.label)}
        </a>
      </section>

      {/* Multi-project nav (MD <multi_project_ui>) */}
      <section className={CARD}>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Proyectos en este descubrimiento / Projects in this discovery</h3>
        {navItems.length === 0 ? <p className="mt-2 text-sm text-[#6B5E47]">{formatBilingual(EMPTY_STATE_NO_PROJECT_INTENT)}</p> : null}
        <ul className="mt-2 space-y-2">
          {navItems.map((nav) => {
            const intent = intents.find((i) => i.id === nav.intentId)!;
            return (
              <li key={nav.intentId} className={SUBCARD}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`?discoveryIntent=${nav.intentId}#client-discovery`} className={`text-sm font-semibold ${nav.intentId === selectedIntent?.id ? "text-[#7A1E2C]" : "text-[#1E1810]"}`}>
                    {nav.intentId === selectedIntent?.id ? "● " : "○ "}{nav.titleLabel}
                  </Link>
                  <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{formatBilingual(nav.statusLabel)}</span>
                </div>
                <p className="mt-1 text-[10px] text-[#9A9184]">{formatBilingual(nav.projectTypeLabel)}</p>
                {!nav.adaptiveEngineAvailable ? (
                  <p className="mt-1 text-[10px] text-[#9A9184]">Este tipo de proyecto todavía no tiene cuestionario adaptativo — trabajo futuro. / This project type does not have its own adaptive questionnaire yet — future work.</p>
                ) : null}
                {canManage ? <IntentStatusButtons businessId={businessId} discoveryId={currentDiscovery.id} intentId={intent.id} status={intent.status} /> : null}
              </li>
            );
          })}
        </ul>
        {canCreate ? <div className="mt-3"><AddProjectIntentForm businessId={businessId} discoveryId={currentDiscovery.id} /></div> : null}
      </section>

      {selectedIntent && website ? (
        <>
          <WhatWeAlreadyKnowSection evaluations={website.evaluations} />
          <QuestionsToAskNowSection
            businessId={businessId}
            discoveryId={currentDiscovery.id}
            intentId={selectedIntent.id}
            candidates={website.questionsToAskNow}
            wrapUp={buildBeforeYouWrapUpView(website.wrapUp, website.readiness)}
            upcomingMeetings={upcomingMeetings}
            canCreate={canCreate}
          />
          <BeforeYouWrapUpSection
            businessId={businessId}
            discoveryId={currentDiscovery.id}
            intentId={selectedIntent.id}
            wrapUp={buildBeforeYouWrapUpView(website.wrapUp, website.readiness)}
            canCreate={canCreate}
          />
        </>
      ) : selectedIntent ? (
        <section className={CARD}>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Preguntas para hacer ahora / Questions to Ask Now</h3>
          <p className="mt-2 text-sm text-[#6B5E47]">{formatBilingual({ es: "Este tipo de proyecto todavía no tiene su propio cuestionario adaptativo — esa parte llegará en una futura mejora.", en: "This project type does not have its own adaptive questionnaire yet — that part is future work." })}</p>
        </section>
      ) : null}

      <MeetingNotesSection businessId={businessId} discoveryId={currentDiscovery.id} sources={sources} canCreate={canCreate} />
      <AssetsReferencesSection businessId={businessId} discoveryId={currentDiscovery.id} sources={sources} canCreate={canCreate} />
      <ConsentSection businessId={businessId} discoveryId={currentDiscovery.id} consents={consents} canManageConsent={canManageConsent} />

      {website ? (
        <>
          <ScopeWarningSection scopeSignals={website.scopeSignals} />
          <LeonixDecisionsSection evaluations={website.evaluations} />
        </>
      ) : null}

      <ReadinessSection discoveryId={currentDiscovery.id} businessId={businessId} status={currentDiscovery.status} upcomingMeetings={upcomingMeetings} canManage={canManage} />

      {website ? <SectionsReviewSection evaluations={website.evaluations} items={items} intentId={selectedIntent?.id ?? null} businessId={businessId} discoveryId={currentDiscovery.id} canReview={canReview} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
function WhatWeAlreadyKnowSection({ evaluations }: { evaluations: readonly RequirementEvaluation[] }) {
  const known = buildWhatWeAlreadyKnow(evaluations);
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Lo que ya sabemos / What We Already Know</h3>
      {known.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">Aún no hay información resuelta para este proyecto. / No resolved information for this project yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {known.map((k) => (
            <li key={k.fieldKey} className={SUBCARD}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#1E1810]">{k.labelEs} / {k.labelEn}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${k.isProvisional ? "bg-[#FFF4E0] text-[#5C4E2E]" : "bg-emerald-100 text-emerald-900"}`}>{formatBilingual(k.truthLabel)}</span>
              </div>
              <p className="mt-1 text-sm text-[#3D3428]">{k.displayValue}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
function QuestionsToAskNowSection({
  businessId, discoveryId, intentId, candidates, wrapUp, upcomingMeetings, canCreate,
}: {
  businessId: string; discoveryId: string; intentId: string;
  candidates: readonly QuestionCandidate[];
  wrapUp: ReturnType<typeof buildBeforeYouWrapUpView>;
  upcomingMeetings: readonly { id: string; label: string }[];
  canCreate: boolean;
}) {
  const views = buildQuestionsToAskNowViewSafe(candidates);
  const emptyCopy = questionsEmptyStateFor(wrapUp.clientDiscoveryComplete, wrapUp.leonixDecisionsRemain, wrapUp.officialResearchRemains);

  return (
    <section id="discovery-dominant-action" className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Preguntas para hacer ahora / Questions to Ask Now</h3>
      {views.length === 0 ? (
        <p className="mt-2 text-sm text-[#6B5E47]">{formatBilingual(emptyCopy)}</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {views.map((q) => (
            <li key={q.fieldKey}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[10px] font-bold text-[#5C4E2E]">{formatBilingual(q.blockingLabel)}</span>
                {q.mayChangeScope ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">Puede cambiar el alcance / May change scope</span> : null}
              </div>
              {canCreate ? (
                <CaptureAnswerForm
                  businessId={businessId}
                  discoveryId={discoveryId}
                  projectIntentId={intentId}
                  fieldKey={q.fieldKey}
                  section={q.section}
                  questionEs={q.questionEs}
                  questionEn={q.questionEn}
                  valueType={q.expectedAnswerType}
                />
              ) : null}
              <details className="mt-1">
                <summary className="cursor-pointer text-[10px] text-[#9A9184]">Por qué preguntamos / Why we&apos;re asking</summary>
                <p className="mt-1 text-[11px] text-[#7A7164]">{q.whyItMattersEs} / {q.whyItMattersEn}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
      {canCreate && views.length > 0 ? (
        <div className="mt-3">
          <SendQuestionsToMeetingButton businessId={businessId} discoveryId={discoveryId} questions={views.map((q) => ({ fieldKey: q.fieldKey, questionEs: q.questionEs, questionEn: q.questionEn }))} />
        </div>
      ) : null}
      {upcomingMeetings.length > 0 && canCreate ? <div className="mt-2"><LinkMeetingButton businessId={businessId} discoveryId={discoveryId} meetings={upcomingMeetings} /></div> : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Antes de terminar / Before You Wrap Up (MD <before_you_wrap_up>) — dedicated closeout action,
// distinct from the running Questions to Ask Now list: a concise, high-risk-only safety check.
// ---------------------------------------------------------------------------
function BeforeYouWrapUpSection({
  businessId, discoveryId, intentId, wrapUp, canCreate,
}: {
  businessId: string; discoveryId: string; intentId: string;
  wrapUp: ReturnType<typeof buildBeforeYouWrapUpView>;
  canCreate: boolean;
}) {
  const isAllClear = wrapUp.items.length === 0;
  return (
    <section className={`${CARD} ${isAllClear && wrapUp.clientDiscoveryComplete ? "border-emerald-300 bg-emerald-50" : ""}`}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Antes de terminar / Before You Wrap Up</h3>
      <p className="mt-1 text-sm font-semibold text-[#1E1810]">{formatBilingual(wrapUp.message)}</p>
      {wrapUp.items.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {wrapUp.items.map((q) => (
            <li key={q.fieldKey}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[10px] font-bold text-[#5C4E2E]">{formatBilingual(q.blockingLabel)}</span>
              </div>
              {canCreate ? (
                <CaptureAnswerForm
                  businessId={businessId}
                  discoveryId={discoveryId}
                  projectIntentId={intentId}
                  fieldKey={q.fieldKey}
                  section={q.section}
                  questionEs={q.questionEs}
                  questionEn={q.questionEn}
                  valueType={q.expectedAnswerType}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function buildQuestionsToAskNowViewSafe(candidates: readonly QuestionCandidate[]) {
  return buildQuestionsToAskNowView(candidates);
}

// ---------------------------------------------------------------------------
function MeetingNotesSection({ businessId, discoveryId, sources, canCreate }: { businessId: string; discoveryId: string; sources: readonly ProjectDiscoverySource[]; canCreate: boolean }) {
  const notes = sources.filter((s) => s.sourceType === "manual").slice().reverse();
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Notas de la reunión / Meeting Notes</h3>
      {canCreate ? <div className="mt-2"><MeetingNoteCapture businessId={businessId} discoveryId={discoveryId} /></div> : null}
      {notes.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B5E47]">{formatBilingual(EMPTY_STATE_NO_NOTES)}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {notes.map((n) => (
            <li key={n.id} className={SUBCARD}>
              <p className="whitespace-pre-wrap text-sm text-[#3D3428]">{n.notes}</p>
              <p className="mt-1 text-[10px] text-[#9A9184]">{new Date(n.createdAt).toLocaleString("en-US")} · {n.createdByEmail ?? n.createdByRole}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
function AssetsReferencesSection({ businessId, discoveryId, sources, canCreate }: { businessId: string; discoveryId: string; sources: readonly ProjectDiscoverySource[]; canCreate: boolean }) {
  const assets = sources.filter((s) => s.sourceType === "asset" || s.sourceType === "website_url");
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Archivos y referencias / Assets & References</h3>
      {canCreate ? (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DiscoveryAssetUpload businessId={businessId} discoveryId={discoveryId} />
          <VisualReferenceForm businessId={businessId} discoveryId={discoveryId} />
        </div>
      ) : null}
      {assets.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B5E47]">{formatBilingual(EMPTY_STATE_NO_ASSETS)}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {assets.map((a) => (
            <li key={a.id} className={SUBCARD}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#1E1810]">{a.label ?? (a.sourceType === "asset" ? "Archivo / File" : "Referencia web / Web reference")}</span>
                <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">
                  {a.sourceType === "asset" ? "Archivo subido / Uploaded file" : "Referencia web / Web reference"}
                </span>
              </div>
              {a.externalUrl ? <a href={a.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-[#7A1E2C] underline">{a.externalUrl}</a> : null}
              {a.notes ? <p className="mt-1 whitespace-pre-wrap text-xs text-[#3D3428]">{a.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
function ConsentSection({ businessId, discoveryId, consents, canManageConsent }: { businessId: string; discoveryId: string; consents: readonly ProjectDiscoveryConsent[]; canManageConsent: boolean }) {
  const latest = (type: string) => consents.filter((c) => c.consentType === type).slice(-1)[0]?.state ?? null;
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Grabación de la reunión / Meeting Recording</h3>
      <p className="mt-1 text-xs text-[#7A7164]">
        ¿Grabar esta conversación? Esto registra el consentimiento del cliente — no activa ninguna grabación real. / Record this conversation? This records the client&apos;s consent — it does not activate any real recording.
      </p>
      {canManageConsent ? (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConsentToggle businessId={businessId} discoveryId={discoveryId} consentType="audio_recording" currentState={latest("audio_recording")} />
          <ConsentToggle businessId={businessId} discoveryId={discoveryId} consentType="transcription" currentState={latest("transcription")} />
        </div>
      ) : null}
      <p className="mt-2 text-[10px] text-[#9A9184]">La grabación y la transcripción reales no están activas todavía en este producto. / Real recording and transcription are not active in this product yet.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
function ScopeWarningSection({ scopeSignals }: { scopeSignals: WebsiteScopeSignalResult }) {
  const view = buildScopeWarningView(scopeSignals);
  if (!view.show) return null;
  return (
    <section className={`${CARD} border-amber-300 bg-amber-50`}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">Posible alcance de plataforma personalizada / Possible Custom Platform Scope</h3>
      <p className="mt-1 text-sm font-semibold text-amber-900">{formatBilingual(view.candidateLabel)}</p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {view.reasons.map((r, i) => <li key={i} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amber-900">{formatBilingual(r)}</li>)}
      </ul>
      <p className="mt-2 text-xs text-amber-900">{formatBilingual(view.message)}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
function LeonixDecisionsSection({ evaluations }: { evaluations: readonly RequirementEvaluation[] }) {
  const decisions = buildLeonixDecisionsView(evaluations);
  const research = buildOfficialResearchView(evaluations);
  if (decisions.length === 0 && research.length === 0) return null;
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Decisiones de Leonix / Leonix Decisions</h3>
      <p className="mt-1 text-[11px] text-[#9A9184]">Nunca se muestran al cliente como preguntas. / Never shown to the client as questions.</p>
      <ul className="mt-2 space-y-1">
        {[...decisions, ...research].map((d) => (
          <li key={d.fieldKey} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-[#1E1810]">{d.labelEs} / {d.labelEn}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.resolved ? "bg-emerald-100 text-emerald-900" : "bg-[#FFF4E0] text-[#5C4E2E]"}`}>{d.resolved ? "Resuelto / Resolved" : "Pendiente / Pending"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
function ReadinessSection({ discoveryId, businessId, status, upcomingMeetings, canManage }: { discoveryId: string; businessId: string; status: ProjectDiscovery["status"]; upcomingMeetings: readonly { id: string; label: string }[]; canManage: boolean }) {
  return (
    <section className={CARD}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Preparación / Readiness</h3>
      {canManage ? (
        <div className="mt-2">
          <DiscoveryStatusButtons
            businessId={businessId}
            discoveryId={discoveryId}
            status={status}
            options={["in_progress", "needs_client_information", "needs_leonix_decision", "ready_for_blueprint", "blueprint_created"]}
          />
        </div>
      ) : null}
      {upcomingMeetings.length === 0 ? <p className="mt-2 text-[11px] text-[#9A9184]">No hay una reunión próxima vinculada. / No upcoming meeting linked.</p> : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
function SectionsReviewSection({
  evaluations, items, intentId, businessId, discoveryId, canReview,
}: {
  evaluations: readonly RequirementEvaluation[]; items: readonly ProjectDiscoveryItem[]; intentId: string | null; businessId: string; discoveryId: string; canReview: boolean;
}) {
  const groups = buildSectionsReviewView(evaluations);
  return (
    <details className={CARD}>
      <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Revisión completa por secciones / Full Sections Review</summary>
      <div className="mt-3 space-y-3">
        {groups.map((g) => (
          <div key={g.key}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">{formatBilingual(g.label)}</p>
            <ul className="mt-1 space-y-1">
              {g.requirements.map((r) => {
                const item = itemForField(items, r.fieldKey, intentId);
                return (
                  <li key={r.fieldKey} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0E9DA] py-1 text-sm">
                    <span className="text-[#1E1810]">{r.labelEs} / {r.labelEn}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{formatBilingual(r.statusLabel)}</span>
                      {canReview && item && item.confirmationState !== "confirmed" ? (
                        <ItemReviewButtons businessId={businessId} discoveryId={discoveryId} itemId={item.id} confirmationState={item.confirmationState} />
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
