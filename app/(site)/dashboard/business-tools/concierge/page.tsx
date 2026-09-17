"use client";

/**
 * TODAY-2 — Personalized DIY Concierge Home. Unifies business identity, the latest Health Map,
 * the personalized DIY action registry, real progress, the Approval Center, and truthful
 * package/upgrade messaging. Feature-flagged off by default (business_diy_concierge flag,
 * business_identity_flags table) — renders a truthful "not yet available" / entitlement state
 * until personalized access resolves for the exact, membership-verified business.
 */
import { useEffect, useMemo, useState } from "react";
import { businessApiFetch } from "../_components/businessApiClient";
import { ActionCard, type ActionCardData } from "./_components/ActionCard";
import { ApprovalCenter, type ApprovalData } from "./_components/ApprovalCenter";
import { PackageExperience } from "@/app/components/leonix/PackageExperience";
import { DIMENSION_LABELS, ENTITLEMENT_STATE_LABELS, type ConciergeLang } from "./conciergeCopy";

type BlockedState = { dimensionKey: string; reason: string };
type OwnerDimension = {
  dimensionKey: string;
  status: string;
  explanationEs: string;
  explanationEn: string;
  limitationsEs: string | null;
  limitationsEn: string | null;
};
type MyBusiness = { businessId: string; displayName: string };
type HomePayload = {
  businessId: string;
  entitlement: { state: string; packageTier: string | null; conciergeGuidance: boolean };
  healthSummary: { assessedAt: string | null; dimensionCount: number } | null;
  actionProgress: { total: number; completed: number; inProgressOrAvailable: number } | null;
  pendingApprovalsCount: number;
  pendingServiceRequestsCount: number;
};

const COPY = {
  en: {
    title: "DIY Concierge",
    subtitle: "Where your business stands, what you can work on, and what Leonix can help with.",
    loading: "Loading…",
    chooseBusiness: "Choose a business",
    noBusiness: "We couldn't find a business linked to your account yet.",
    section1: "Where the business stands",
    section2: "What you can work on",
    section3: "Already complete",
    section4: "Needs evidence or your confirmation",
    section5: "Postponed",
    noActions: "No actions to show right now.",
    blockedTitle: "Not yet actionable",
    assessedOn: "Assessed on",
    progress: (done: number, total: number) => `${done} of ${total} actions completed`,
    requestTitle: "Describe what you'd like",
    requestPlaceholder: "What would you like help with?",
    submit: "Submit request",
    cancel: "Cancel",
    requestSent: "Request sent — a real Leonix team member will follow up. No payment or scheduling has been made yet.",
  },
  es: {
    title: "Concierge DIY",
    subtitle: "En qué está tu negocio, en qué puedes trabajar, y en qué te puede ayudar Leonix.",
    loading: "Cargando…",
    chooseBusiness: "Elige un negocio",
    noBusiness: "Aún no encontramos un negocio vinculado a tu cuenta.",
    section1: "En qué está el negocio",
    section2: "En qué puedes trabajar",
    section3: "Ya completado",
    section4: "Necesita evidencia o tu confirmación",
    section5: "Pospuesto",
    noActions: "No hay acciones que mostrar por ahora.",
    blockedTitle: "Todavía no se puede actuar",
    assessedOn: "Evaluado el",
    progress: (done: number, total: number) => `${done} de ${total} acciones completadas`,
    requestTitle: "Describe lo que te gustaría",
    requestPlaceholder: "¿En qué te gustaría que te ayudemos?",
    submit: "Enviar solicitud",
    cancel: "Cancelar",
    requestSent: "Solicitud enviada — un miembro real del equipo de Leonix dará seguimiento. Todavía no se ha hecho ningún pago ni programación.",
  },
} as const;

export default function DiyConciergePage() {
  const [lang, setLang] = useState<ConciergeLang>("es");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [businesses, setBusinesses] = useState<MyBusiness[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [home, setHome] = useState<HomePayload | null>(null);
  const [dimensions, setDimensions] = useState<OwnerDimension[]>([]);
  const [actions, setActions] = useState<ActionCardData[]>([]);
  const [blocked, setBlocked] = useState<BlockedState[]>([]);
  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [busy, setBusy] = useState(false);
  const [serviceRequestDraft, setServiceRequestDraft] = useState<{ actionKey: string; requestType: "guide_me_concierge" | "let_leonix_handle_it" } | null>(null);
  const [requestText, setRequestText] = useState("");
  const [requestSentMessage, setRequestSentMessage] = useState<string | null>(null);
  const t = COPY[lang];

  useEffect(() => {
    (async () => {
      const result = await businessApiFetch<{ businesses: MyBusiness[] }>("/api/dashboard/business/diy-concierge/my-businesses");
      if (!result.ok) {
        setStatus("error");
        return;
      }
      setBusinesses(result.data.businesses);
      if (result.data.businesses.length > 0) setBusinessId(result.data.businesses[0].businessId);
      else setStatus("ready");
    })();
  }, []);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      setStatus("loading");
      const [homeRes, healthRes, actionsRes, approvalsRes] = await Promise.all([
        businessApiFetch<HomePayload>(`/api/dashboard/business/diy-concierge/home?businessId=${businessId}`),
        businessApiFetch<{ dimensions: OwnerDimension[] }>(`/api/dashboard/business/diy-concierge/health-explanations?businessId=${businessId}`),
        businessApiFetch<{ actions: ActionCardData[]; blocked: BlockedState[] }>(`/api/dashboard/business/diy-concierge/actions?businessId=${businessId}`),
        businessApiFetch<{ approvals: ApprovalData[] }>(`/api/dashboard/business/diy-concierge/approvals?businessId=${businessId}`),
      ]);
      if (homeRes.ok) setHome(homeRes.data);
      if (healthRes.ok) setDimensions(healthRes.data.dimensions);
      if (actionsRes.ok) {
        setActions(actionsRes.data.actions);
        setBlocked(actionsRes.data.blocked);
      }
      if (approvalsRes.ok) setApprovals(approvalsRes.data.approvals);
      setStatus("ready");
    })();
  }, [businessId]);

  const grouped = useMemo(() => {
    const groups: Record<"todo" | "completed" | "needsAttention" | "postponed", ActionCardData[]> = {
      todo: [], completed: [], needsAttention: [], postponed: [],
    };
    for (const a of actions) {
      if (a.status === "available" || a.status === "in_progress") groups.todo.push(a);
      else if (a.status === "completed") groups.completed.push(a);
      else if (a.status === "awaiting_evidence" || a.status === "awaiting_owner_confirmation") groups.needsAttention.push(a);
      else if (a.status === "postponed") groups.postponed.push(a);
    }
    return groups;
  }, [actions]);

  async function handleDecision(actionKey: string, decision: string) {
    if (!businessId) return;
    setBusy(true);
    await businessApiFetch<{ action: unknown }>("/api/dashboard/business/diy-concierge/actions", {
      method: "POST",
      body: JSON.stringify({ businessId, actionKey, decision }),
    });
    setBusy(false);
    // Refetch actions after a decision — never assume the optimistic state, always re-read real status.
    const actionsRes = await businessApiFetch<{ actions: ActionCardData[]; blocked: BlockedState[] }>(`/api/dashboard/business/diy-concierge/actions?businessId=${businessId}`);
    if (actionsRes.ok) {
      setActions(actionsRes.data.actions);
      setBlocked(actionsRes.data.blocked);
    }
  }

  function openServiceRequest(actionKey: string, requestType: "guide_me_concierge" | "let_leonix_handle_it") {
    setServiceRequestDraft({ actionKey, requestType });
    setRequestText("");
  }

  async function submitServiceRequest() {
    if (!businessId || !serviceRequestDraft || !requestText.trim()) return;
    setBusy(true);
    const result = await businessApiFetch("/api/dashboard/business/diy-concierge/service-requests", {
      method: "POST",
      body: JSON.stringify({
        businessId,
        sourceActionId: null,
        requestType: serviceRequestDraft.requestType,
        requestedDeliverable: requestText.trim(),
        urgencyPreference: "no_rush",
      }),
    });
    setBusy(false);
    setServiceRequestDraft(null);
    if (result.ok) setRequestSentMessage(t.requestSent);
  }

  async function handleWithdrawApproval(approvalId: string) {
    if (!businessId) return;
    setBusy(true);
    await businessApiFetch("/api/dashboard/business/diy-concierge/approvals", {
      method: "POST",
      body: JSON.stringify({ businessId, approvalId, decision: "withdrawn" }),
    });
    setBusy(false);
    const approvalsRes = await businessApiFetch<{ approvals: ApprovalData[] }>(`/api/dashboard/business/diy-concierge/approvals?businessId=${businessId}`);
    if (approvalsRes.ok) setApprovals(approvalsRes.data.approvals);
  }

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-5 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-[#1E1810]">{t.title}</h1>
          <p className="mt-1 text-sm text-[#5C5346]">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setLang("en")} className={`min-h-[36px] rounded-lg px-2 py-1 text-xs font-semibold ${lang === "en" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>EN</button>
          <button type="button" onClick={() => setLang("es")} className={`min-h-[36px] rounded-lg px-2 py-1 text-xs font-semibold ${lang === "es" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>ES</button>
        </div>
      </div>

      {status === "loading" ? <p className="text-sm text-[#7A7164]">{t.loading}</p> : null}

      {status !== "loading" && businesses.length === 0 ? (
        <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.noBusiness}</p>
      ) : null}

      {businesses.length > 1 ? (
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-[#3D3428]">{t.chooseBusiness}</span>
          <select
            value={businessId ?? ""}
            onChange={(e) => setBusinessId(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 text-sm text-[#3D3428]"
          >
            {businesses.map((b) => (
              <option key={b.businessId} value={b.businessId}>{b.displayName}</option>
            ))}
          </select>
        </label>
      ) : null}

      {home ? (
        <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.section1}</p>
          <p className="mt-1 text-sm text-[#5C5346]">{ENTITLEMENT_STATE_LABELS[home.entitlement.state]?.[lang] ?? home.entitlement.state}</p>
          {home.healthSummary?.assessedAt ? (
            <p className="mt-1 text-xs text-[#9A9184]">{t.assessedOn} {new Date(home.healthSummary.assessedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US")}</p>
          ) : null}
          {home.actionProgress ? (
            <p className="mt-1 text-sm text-[#5C5346]">{t.progress(home.actionProgress.completed, home.actionProgress.total)}</p>
          ) : null}
        </div>
      ) : null}

      {home?.entitlement.state === "personalized_access_active" ? (
        <>
          {dimensions.length > 0 ? (
            <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.section1}</p>
              <ul className="mt-2 space-y-3">
                {dimensions.map((d) => (
                  <li key={d.dimensionKey} className="min-w-0">
                    <p className="break-words text-sm font-semibold text-[#3D3428]">{DIMENSION_LABELS[d.dimensionKey]?.[lang] ?? d.dimensionKey}</p>
                    <p className="mt-1 break-words text-sm text-[#5C5346]">{lang === "es" ? d.explanationEs : d.explanationEn}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.section2}</p>
            <div className="space-y-3">
              {grouped.todo.length === 0 ? <p className="text-sm text-[#7A7164]">{t.noActions}</p> : null}
              {grouped.todo.map((a) => (
                <ActionCard key={a.actionKey} data={a} lang={lang} onDecision={handleDecision} onRequestService={openServiceRequest} busy={busy} />
              ))}
            </div>
          </div>

          {grouped.needsAttention.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.section4}</p>
              <div className="space-y-3">
                {grouped.needsAttention.map((a) => (
                  <ActionCard key={a.actionKey} data={a} lang={lang} onDecision={handleDecision} onRequestService={openServiceRequest} busy={busy} />
                ))}
              </div>
            </div>
          ) : null}

          {grouped.postponed.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.section5}</p>
              <div className="space-y-3">
                {grouped.postponed.map((a) => (
                  <ActionCard key={a.actionKey} data={a} lang={lang} onDecision={handleDecision} onRequestService={openServiceRequest} busy={busy} />
                ))}
              </div>
            </div>
          ) : null}

          {grouped.completed.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.section3}</p>
              <div className="space-y-3">
                {grouped.completed.map((a) => (
                  <ActionCard key={a.actionKey} data={a} lang={lang} onDecision={handleDecision} onRequestService={openServiceRequest} busy={busy} />
                ))}
              </div>
            </div>
          ) : null}

          {blocked.length > 0 ? (
            <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2] p-4">
              <p className="text-sm font-bold text-[#1E1810]">{t.blockedTitle}</p>
              <ul className="mt-2 space-y-1 text-sm text-[#5C5346]">
                {blocked.map((b, i) => (
                  <li key={i} className="break-words">
                    {DIMENSION_LABELS[b.dimensionKey]?.[lang] ?? b.dimensionKey}: {b.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ApprovalCenter approvals={approvals} lang={lang} onWithdraw={handleWithdrawApproval} busy={busy} />
        </>
      ) : null}

      <PackageExperience lang={lang} />

      {requestSentMessage ? (
        <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-3 text-sm text-[#5C5346]">{requestSentMessage}</p>
      ) : null}

      {serviceRequestDraft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <p className="text-sm font-bold text-[#1E1810]">{t.requestTitle}</p>
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder={t.requestPlaceholder}
              rows={4}
              maxLength={2000}
              className="mt-2 w-full rounded-xl border border-[#E8DFD0] p-3 text-sm text-[#3D3428]"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setServiceRequestDraft(null)} className="min-h-11 rounded-xl border border-[#E8DFD0] px-4 text-sm font-semibold text-[#3D3428]">
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={busy || !requestText.trim()}
                onClick={submitServiceRequest}
                className="min-h-11 rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] disabled:opacity-50"
              >
                {t.submit}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
