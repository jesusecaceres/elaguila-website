"use client";

/**
 * TODAY-3 — the owner-facing Next Right Move page. Renders exactly one current, truthfully
 * shared recommendation — never internal failed candidates, never staff-only six-test reasoning.
 * Feature-flagged off by default (business_stewardship_engine flag, business_identity_flags
 * table) — renders a truthful "not yet available" state until the flag is enabled for this user,
 * matching the DIY Concierge / Health Map / Living Book precedent exactly.
 */
import { useEffect, useState } from "react";
import { businessApiFetch } from "../_components/businessApiClient";

type Lang = "es" | "en";

type RecommendationPayload = {
  id: string;
  dimensionKey: string;
  status: string;
  confidence: string;
  verifiedNeedEs: string; verifiedNeedEn: string;
  readinessExplanationEs: string; readinessExplanationEn: string;
  businessConsequenceEs: string; businessConsequenceEn: string;
  ownerGoalAlignmentEs: string; ownerGoalAlignmentEn: string;
  capacityImpactEs: string; capacityImpactEn: string;
  primaryIntervention: string;
  freeOptionEs: string | null; freeOptionEn: string | null;
  guidedOptionEs: string | null; guidedOptionEn: string | null;
  correctiveServiceOptionEs: string | null; correctiveServiceOptionEn: string | null;
  managedOptionEs: string | null; managedOptionEn: string | null;
  externalReferralOptionEs: string | null; externalReferralOptionEn: string | null;
  doNothingYetOptionEs: string | null; doNothingYetOptionEn: string | null;
  expectedEffort: string;
  costBand: string;
  successMetricEs: string; successMetricEn: string;
  reviewDate: string | null;
  ownerDecision: string | null;
  sharedAt: string | null;
};

type MyBusiness = { businessId: string; displayName: string };

const DIMENSION_LABELS: Record<string, { es: string; en: string }> = {
  business_foundation: { es: "Fundamento del negocio", en: "Business foundation" },
  customer_clarity: { es: "Claridad sobre los clientes", en: "Customer clarity" },
  offer_and_value: { es: "Oferta y valor", en: "Offer and value" },
  operations_and_capacity: { es: "Operaciones y capacidad", en: "Operations and capacity" },
  visibility_and_discovery: { es: "Visibilidad y descubrimiento", en: "Visibility and discovery" },
  communication_and_follow_up: { es: "Comunicación y seguimiento", en: "Communication and follow-up" },
  owner_goals_and_sustainability: { es: "Metas del dueño y sostenibilidad", en: "Owner goals and sustainability" },
};

const EFFORT_LABELS: Record<string, { es: string; en: string }> = {
  minutes: { es: "Minutos", en: "Minutes" },
  under_1_hour: { es: "Menos de una hora", en: "Under an hour" },
  half_day: { es: "Medio día", en: "Half a day" },
  "1_2_days": { es: "1-2 días", en: "1-2 days" },
  ongoing: { es: "Continuo", en: "Ongoing" },
};

const COST_LABELS: Record<string, { es: string; en: string }> = {
  free: { es: "Gratis", en: "Free" },
  under_100: { es: "Menos de $100", en: "Under $100" },
  "100_500": { es: "$100–$500", en: "$100–$500" },
  "500_plus": { es: "Más de $500", en: "$500+" },
  unknown: { es: "Costo aún no estimado", en: "Cost not yet estimated" },
};

const COPY = {
  es: {
    title: "Tu próximo paso",
    subtitle: "La única acción más importante para tu negocio en este momento — explicada con transparencia.",
    loading: "Cargando…",
    chooseBusiness: "Elige un negocio",
    noBusiness: "Aún no encontramos un negocio vinculado a tu cuenta.",
    unavailable: "Esta función aún no está disponible para tu cuenta.",
    noMove: "Todavía no hay un próximo paso compartido para este negocio.",
    why: "Por qué esta acción",
    whatWeConfirmed: "Lo que Leonix confirmó",
    consequence: "Consecuencia para el negocio",
    goalAlignment: "Encaje con tus metas",
    capacityImpact: "Impacto en tu capacidad",
    freeFirst: "Opción gratuita",
    guided: "Opción guiada",
    corrective: "Servicio correctivo",
    managed: "Servicio administrado",
    referral: "Especialista externo",
    doNothing: "Esperar por ahora",
    effort: "Esfuerzo esperado",
    cost: "Costo",
    metric: "Cómo saber si funcionó",
    reviewDate: "Fecha de revisión",
    accept: "Aceptar",
    decline: "Rechazar",
    postpone: "Posponer",
    decided: "Ya decidiste sobre este paso.",
    error: "Ocurrió un error. Intenta de nuevo.",
  },
  en: {
    title: "Your Next Right Move",
    subtitle: "The single most important action for your business right now — explained transparently.",
    loading: "Loading…",
    chooseBusiness: "Choose a business",
    noBusiness: "We couldn't find a business linked to your account yet.",
    unavailable: "This feature isn't available for your account yet.",
    noMove: "There isn't a shared Next Right Move for this business yet.",
    why: "Why this action",
    whatWeConfirmed: "What Leonix confirmed",
    consequence: "Business consequence",
    goalAlignment: "Fit with your goals",
    capacityImpact: "Impact on your capacity",
    freeFirst: "Free option",
    guided: "Guided option",
    corrective: "Corrective service",
    managed: "Managed service",
    referral: "External specialist",
    doNothing: "Wait for now",
    effort: "Expected effort",
    cost: "Cost",
    metric: "How to know it worked",
    reviewDate: "Review date",
    accept: "Accept",
    decline: "Decline",
    postpone: "Postpone",
    decided: "You've already decided on this move.",
    error: "Something went wrong. Please try again.",
  },
} as const;

export default function NextRightMovePage() {
  const [lang, setLang] = useState<Lang>("es");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [businesses, setBusinesses] = useState<MyBusiness[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [entitlementState, setEntitlementState] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
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
      const result = await businessApiFetch<{ entitlementState: string; recommendation: RecommendationPayload | null }>(`/api/dashboard/business/recommendations?businessId=${businessId}`);
      if (result.ok) {
        setEntitlementState(result.data.entitlementState);
        setRecommendation(result.data.recommendation);
      }
      setStatus("ready");
    })();
  }, [businessId]);

  async function decide(decision: "accept" | "decline" | "postpone") {
    if (!businessId || !recommendation) return;
    setBusy(true);
    const reviewDate = decision === "postpone" ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined;
    const result = await businessApiFetch(`/api/dashboard/business/recommendations/${recommendation.id}/decision`, {
      method: "PATCH",
      body: JSON.stringify({ businessId, decision, note: note.trim() || null, reviewDate }),
    });
    setBusy(false);
    if (result.ok) {
      const refreshed = await businessApiFetch<{ recommendation: RecommendationPayload | null }>(`/api/dashboard/business/recommendations?businessId=${businessId}`);
      if (refreshed.ok) setRecommendation(refreshed.data.recommendation);
      setNote("");
    }
  }

  const l = lang;

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-5 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-[#1E1810]">{t.title}</h1>
          <p className="mt-1 text-sm text-[#5C5346]">{t.subtitle}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setLang("en")} className={`min-h-[44px] rounded-lg px-3 py-1 text-xs font-semibold ${lang === "en" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>EN</button>
          <button type="button" onClick={() => setLang("es")} className={`min-h-[44px] rounded-lg px-3 py-1 text-xs font-semibold ${lang === "es" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>ES</button>
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
            className="min-h-[44px] w-full rounded-xl border border-[#E8DFD0] bg-white px-3 text-sm text-[#3D3428]"
          >
            {businesses.map((b) => (
              <option key={b.businessId} value={b.businessId}>{b.displayName}</option>
            ))}
          </select>
        </label>
      ) : null}

      {status === "ready" && entitlementState && entitlementState !== "personalized_access_active" ? (
        <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.unavailable}</p>
      ) : null}

      {status === "ready" && entitlementState === "personalized_access_active" && !recommendation ? (
        <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.noMove}</p>
      ) : null}

      {status === "ready" && recommendation ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8DFD0] bg-white p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9A9184]">
              {DIMENSION_LABELS[recommendation.dimensionKey]?.[l] ?? recommendation.dimensionKey}
            </span>
            <p className="mt-2 text-sm font-bold text-[#1E1810]">{t.why}</p>
            <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.verifiedNeedEs : recommendation.verifiedNeedEn}</p>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.whatWeConfirmed}</p>
            <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.readinessExplanationEs : recommendation.readinessExplanationEn}</p>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.consequence}</p>
            <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.businessConsequenceEs : recommendation.businessConsequenceEn}</p>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.goalAlignment}</p>
            <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.ownerGoalAlignmentEs : recommendation.ownerGoalAlignmentEn}</p>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[#9A9184]">{t.capacityImpact}</p>
            <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.capacityImpactEs : recommendation.capacityImpactEn}</p>
          </div>

          <div className="rounded-2xl border border-[#E8DFD0] bg-white p-5">
            <ol className="space-y-3">
              {recommendation.freeOptionEs || recommendation.freeOptionEn ? (
                <li className="rounded-xl bg-[#FAF7F2] p-3">
                  <p className="text-xs font-bold text-[#2A4536]">{t.freeFirst}</p>
                  <p className="mt-1 text-sm text-[#3D3428]">{l === "es" ? recommendation.freeOptionEs : recommendation.freeOptionEn}</p>
                </li>
              ) : null}
              {recommendation.guidedOptionEs || recommendation.guidedOptionEn ? (
                <li className="rounded-xl bg-[#FAF7F2] p-3">
                  <p className="text-xs font-bold text-[#3D3428]">{t.guided}</p>
                  <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.guidedOptionEs : recommendation.guidedOptionEn}</p>
                </li>
              ) : null}
              {recommendation.correctiveServiceOptionEs || recommendation.correctiveServiceOptionEn ? (
                <li className="rounded-xl bg-[#FAF7F2] p-3">
                  <p className="text-xs font-bold text-[#3D3428]">{t.corrective}</p>
                  <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.correctiveServiceOptionEs : recommendation.correctiveServiceOptionEn}</p>
                </li>
              ) : null}
              {recommendation.managedOptionEs || recommendation.managedOptionEn ? (
                <li className="rounded-xl bg-[#FAF7F2] p-3">
                  <p className="text-xs font-bold text-[#3D3428]">{t.managed}</p>
                  <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.managedOptionEs : recommendation.managedOptionEn}</p>
                </li>
              ) : null}
              {recommendation.externalReferralOptionEs || recommendation.externalReferralOptionEn ? (
                <li className="rounded-xl bg-[#FAF7F2] p-3">
                  <p className="text-xs font-bold text-[#3D3428]">{t.referral}</p>
                  <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.externalReferralOptionEs : recommendation.externalReferralOptionEn}</p>
                </li>
              ) : null}
              {recommendation.doNothingYetOptionEs || recommendation.doNothingYetOptionEn ? (
                <li className="rounded-xl bg-[#FAF7F2] p-3">
                  <p className="text-xs font-bold text-[#3D3428]">{t.doNothing}</p>
                  <p className="mt-1 text-sm text-[#5C5346]">{l === "es" ? recommendation.doNothingYetOptionEs : recommendation.doNothingYetOptionEn}</p>
                </li>
              ) : null}
            </ol>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#7A7164]">
              <span>{t.effort}: {EFFORT_LABELS[recommendation.expectedEffort]?.[l] ?? recommendation.expectedEffort}</span>
              <span>·</span>
              <span>{t.cost}: {COST_LABELS[recommendation.costBand]?.[l] ?? recommendation.costBand}</span>
            </div>
            <p className="mt-2 text-sm text-[#5C5346]">{t.metric}: {l === "es" ? recommendation.successMetricEs : recommendation.successMetricEn}</p>
            {recommendation.reviewDate ? (
              <p className="mt-1 text-xs text-[#9A9184]">{t.reviewDate}: {new Date(recommendation.reviewDate).toLocaleDateString(l === "es" ? "es-ES" : "en-US")}</p>
            ) : null}
          </div>

          {recommendation.ownerDecision ? (
            <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.decided}</p>
          ) : (
            <div className="rounded-2xl border border-[#E8DFD0] bg-white p-5">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder=""
                className="w-full rounded-xl border border-[#E8DFD0] p-3 text-sm text-[#3D3428]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void decide("accept")} className="min-h-[44px] rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 text-sm font-semibold text-[#1E1810] disabled:opacity-50">
                  {t.accept}
                </button>
                <button type="button" disabled={busy} onClick={() => void decide("postpone")} className="min-h-[44px] rounded-xl border border-[#E8DFD0] px-5 text-sm font-semibold text-[#3D3428] disabled:opacity-50">
                  {t.postpone}
                </button>
                <button type="button" disabled={busy} onClick={() => void decide("decline")} className="min-h-[44px] rounded-xl border border-[#E8DFD0] px-5 text-sm font-semibold text-[#3D3428] disabled:opacity-50">
                  {t.decline}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
