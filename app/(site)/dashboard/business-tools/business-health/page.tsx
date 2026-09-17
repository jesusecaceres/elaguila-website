"use client";

/**
 * Gate BCO-6A, Gate 5 — "Business Health Map" minimum owner-safe view. Plain-language dimension
 * conclusions and findings only — no confidence machinery, no supporting record ids, no evidence,
 * no internal audit history, no recommendation-readiness gate (a staff/system-only construct).
 * Feature-flagged off by default (business_health_map flag, business_identity_flags table) — this
 * page renders a "not yet available" state until the flag is enabled for this user.
 */
import { useEffect, useState } from "react";
import { businessApiFetch } from "../_components/businessApiClient";

type CopyShape = Record<
  | "title" | "subtitle" | "unavailable" | "noBusiness" | "loading" | "noAssessment" | "assessedOn"
  | "strengths" | "needsAttention" | "needMoreInfo" | "clarificationNeeded" | "noFindings",
  string
>;

const DIMENSION_LABELS: Record<string, { es: string; en: string }> = {
  business_foundation: { es: "Fundamento del negocio", en: "Business foundation" },
  customer_clarity: { es: "Claridad sobre los clientes", en: "Customer clarity" },
  offer_and_value: { es: "Oferta y valor", en: "Offer and value" },
  operations_and_capacity: { es: "Operaciones y capacidad", en: "Operations and capacity" },
  visibility_and_discovery: { es: "Visibilidad y descubrimiento", en: "Visibility and discovery" },
  communication_and_follow_up: { es: "Comunicación y seguimiento", en: "Communication and follow-up" },
  owner_goals_and_sustainability: { es: "Metas del dueño y sostenibilidad", en: "Owner goals and sustainability" },
};

type OwnerDimension = {
  dimensionKey: string;
  status: "strong" | "stable" | "needs_attention" | "insufficient_information" | "blocked_by_contradiction";
  explanationEs: string;
  explanationEn: string;
  limitationsEs: string | null;
  limitationsEn: string | null;
  calculatedAt: string;
};
type OwnerFinding = { findingType: string; titleEs: string; titleEn: string; explanationEs: string; explanationEn: string };
type HealthPayload = { businessId: string; assessedAt: string | null; dimensions: OwnerDimension[]; findings: OwnerFinding[] };

const COPY = {
  en: {
    title: "Business Health Map",
    subtitle: "A plain-language look at what Leonix currently understands about your business, area by area.",
    unavailable: "This feature isn't available for your account yet.",
    noBusiness: "We couldn't find a business linked to your account.",
    loading: "Loading…",
    noAssessment: "No assessment has been run yet — check back soon.",
    assessedOn: "Assessed on",
    strengths: "Strengths",
    needsAttention: "Needs attention",
    needMoreInfo: "Leonix needs more information",
    clarificationNeeded: "Needs clarification",
    noFindings: "No specific notes for this area yet.",
  },
  es: {
    title: "Mapa de salud del negocio",
    subtitle: "Una mirada en lenguaje claro a lo que Leonix entiende actualmente sobre su negocio, área por área.",
    unavailable: "Esta función aún no está disponible para su cuenta.",
    noBusiness: "No pudimos encontrar un negocio vinculado a su cuenta.",
    loading: "Cargando…",
    noAssessment: "Aún no se ha realizado una evaluación — vuelva pronto.",
    assessedOn: "Evaluado el",
    strengths: "Fortalezas",
    needsAttention: "Necesita atención",
    needMoreInfo: "Leonix necesita más información",
    clarificationNeeded: "Necesita aclaración",
    noFindings: "Aún no hay notas específicas para esta área.",
  },
} as const;

const STATUS_GROUP: Record<OwnerDimension["status"], "strengths" | "needsAttention" | "needMoreInfo" | "clarificationNeeded"> = {
  strong: "strengths",
  stable: "strengths",
  needs_attention: "needsAttention",
  insufficient_information: "needMoreInfo",
  blocked_by_contradiction: "clarificationNeeded",
};

export default function BusinessHealthPage() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [status, setStatus] = useState<"loading" | "unavailable" | "no_business" | "ready" | "error">("loading");
  const [data, setData] = useState<HealthPayload | null>(null);
  const t: CopyShape = COPY[lang];

  useEffect(() => {
    (async () => {
      const result = await businessApiFetch<HealthPayload>("/api/dashboard/business/health");
      if (!result.ok) {
        setStatus(result.status === 404 && result.error === "feature_disabled" ? "unavailable" : result.status === 404 ? "no_business" : "error");
        return;
      }
      setData(result.data);
      setStatus("ready");
    })();
  }, []);

  const groups: Record<"strengths" | "needsAttention" | "needMoreInfo" | "clarificationNeeded", OwnerDimension[]> = {
    strengths: [],
    needsAttention: [],
    needMoreInfo: [],
    clarificationNeeded: [],
  };
  if (data) {
    for (const d of data.dimensions) groups[STATUS_GROUP[d.status]].push(d);
  }

  return (
    <div className="mx-auto w-full max-w-2xl min-w-0 space-y-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-[#1E1810]">{t.title}</h1>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setLang("en")} className={`min-h-[36px] rounded-lg px-2 py-1 text-xs font-semibold ${lang === "en" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>EN</button>
          <button type="button" onClick={() => setLang("es")} className={`min-h-[36px] rounded-lg px-2 py-1 text-xs font-semibold ${lang === "es" ? "bg-[#7A1E2C] text-white" : "border border-[#E8DFD0] text-[#3D3428]"}`}>ES</button>
        </div>
      </div>
      <p className="text-sm text-[#5C5346]">{t.subtitle}</p>

      {status === "loading" ? <p className="text-sm text-[#7A7164]">{t.loading}</p> : null}
      {status === "unavailable" ? <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.unavailable}</p> : null}
      {status === "no_business" ? <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.noBusiness}</p> : null}
      {status === "error" ? <p className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] p-4 text-sm text-[#5C5346]">{t.loading}</p> : null}

      {status === "ready" && data && data.dimensions.length === 0 ? <p className="text-sm text-[#7A7164]">{t.noAssessment}</p> : null}

      {status === "ready" && data && data.dimensions.length > 0 ? (
        <div className="space-y-4">
          {data.assessedAt ? (
            <p className="text-[11px] text-[#9A9184]">{t.assessedOn} {new Date(data.assessedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US")}</p>
          ) : null}

          {(["strengths", "needsAttention", "needMoreInfo", "clarificationNeeded"] as const).map((group) =>
            groups[group].length > 0 ? (
              <div key={group} className="rounded-xl border border-[#E8DFD0] bg-white p-4">
                <h2 className="text-sm font-bold text-[#1E1810]">{t[group]}</h2>
                <ul className="mt-2 space-y-3">
                  {groups[group].map((d) => (
                    <li key={d.dimensionKey} className="min-w-0">
                      <p className="break-words text-sm font-semibold text-[#3D3428]">
                        {DIMENSION_LABELS[d.dimensionKey]?.[lang] ?? d.dimensionKey}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#5C5346]">{lang === "es" ? d.explanationEs : d.explanationEn}</p>
                      {(lang === "es" ? d.limitationsEs : d.limitationsEn) ? (
                        <p className="mt-1 break-words text-xs text-[#9A9184]">{lang === "es" ? d.limitationsEs : d.limitationsEn}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
