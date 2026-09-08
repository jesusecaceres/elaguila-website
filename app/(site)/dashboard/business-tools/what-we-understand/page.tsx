"use client";

/**
 * Gate BCO-5A, Gate 5 — "What Leonix Understands About Your Business." Minimum owner-facing
 * foundation: review owner-safe facts, confirm/correct/reject them, or mark "not sure." Never
 * rewrites a canonical fact directly — every submission is reviewed by staff (business_corrections
 * workflow). Feature-flagged off by default (living_business_book flag, business_identity_flags
 * table) — this page renders a "not yet available" state until the flag is enabled for this user.
 */
import { useEffect, useState } from "react";
import { businessApiFetch } from "../_components/businessApiClient";

type CopyShape = Record<
  | "title" | "subtitle" | "unavailable" | "noBusiness" | "loading" | "noFacts" | "confirm" | "correct"
  | "notSure" | "correctionPlaceholder" | "submit" | "pending" | "accepted" | "declined" | "lastVerified"
  | "never" | "openQuestions" | "openQuestionsHint",
  string
>;

type OwnerFact = { id: string; factKey: string; displayValue: string | null; confirmationState: string; lastVerifiedAt: string | null };
type OwnerCorrection = { id: string; relatedFactId: string | null; correctionType: string; status: string; createdAt: string };
type BookPayload = { businessId: string; facts: OwnerFact[]; unknowns: { id: string; questionLabel: string }[]; corrections: OwnerCorrection[] };

const COPY = {
  en: {
    title: "What Leonix Understands About Your Business",
    subtitle: "Review what we have on file. Confirm what's accurate, or let us know if something needs a correction.",
    unavailable: "This feature isn't available for your account yet.",
    noBusiness: "We couldn't find a business linked to your account.",
    loading: "Loading…",
    noFacts: "Nothing to review yet — check back soon.",
    confirm: "This is accurate",
    correct: "Suggest a correction",
    notSure: "I'm not sure",
    correctionPlaceholder: "What should this say instead?",
    submit: "Send to Leonix",
    pending: "Pending review",
    accepted: "Confirmed",
    declined: "Not accepted — a Leonix team member will follow up",
    lastVerified: "Last verified",
    never: "not yet verified",
    openQuestions: "Open questions",
    openQuestionsHint: "A Leonix team member may reach out about these.",
  },
  es: {
    title: "Lo que Leonix entiende sobre su negocio",
    subtitle: "Revise lo que tenemos registrado. Confirme lo que es correcto, o avísenos si algo necesita una corrección.",
    unavailable: "Esta función aún no está disponible para su cuenta.",
    noBusiness: "No pudimos encontrar un negocio vinculado a su cuenta.",
    loading: "Cargando…",
    noFacts: "Aún no hay nada que revisar — vuelva pronto.",
    confirm: "Esto es correcto",
    correct: "Sugerir una corrección",
    notSure: "No estoy seguro",
    correctionPlaceholder: "¿Qué debería decir en su lugar?",
    submit: "Enviar a Leonix",
    pending: "Pendiente de revisión",
    accepted: "Confirmado",
    declined: "No aceptado — un miembro del equipo de Leonix se pondrá en contacto",
    lastVerified: "Última verificación",
    never: "aún no verificado",
    openQuestions: "Preguntas abiertas",
    openQuestionsHint: "Un miembro del equipo de Leonix podría contactarlo sobre esto.",
  },
} as const;

export default function WhatWeUnderstandPage() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [status, setStatus] = useState<"loading" | "unavailable" | "no_business" | "ready" | "error">("loading");
  const [data, setData] = useState<BookPayload | null>(null);
  const t = COPY[lang];

  useEffect(() => {
    (async () => {
      const result = await businessApiFetch<BookPayload>("/api/dashboard/business/book");
      if (!result.ok) {
        setStatus(result.status === 404 && result.error === "feature_disabled" ? "unavailable" : result.status === 404 ? "no_business" : "error");
        return;
      }
      setData(result.data);
      setStatus("ready");
    })();
  }, []);

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

      {status === "ready" && data ? (
        <div className="space-y-3">
          {data.facts.length === 0 ? <p className="text-sm text-[#7A7164]">{t.noFacts}</p> : null}
          {data.facts.map((f) => (
            <FactCard key={f.id} fact={f} lang={lang} t={t} pendingCorrection={data.corrections.find((c) => c.relatedFactId === f.id && c.status === "pending") ?? null} />
          ))}

          {data.unknowns.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <h2 className="text-sm font-bold text-amber-900">{t.openQuestions}</h2>
              <p className="mt-1 text-xs text-amber-800">{t.openQuestionsHint}</p>
              <ul className="mt-2 space-y-1">
                {data.unknowns.map((u) => (
                  <li key={u.id} className="text-sm text-amber-900">• {u.questionLabel}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FactCard({ fact, lang, t, pendingCorrection }: { fact: OwnerFact; lang: "en" | "es"; t: CopyShape; pendingCorrection: OwnerCorrection | null }) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(pendingCorrection ? "pending" : null);

  async function submit(correctionType: "owner_confirms" | "owner_corrects" | "owner_rejects") {
    setSubmitting(true);
    const result = await businessApiFetch("/api/dashboard/business/book/corrections", {
      method: "POST",
      body: JSON.stringify({
        correctionType,
        relatedFactId: fact.id,
        submittedDisplayValue: correctionType === "owner_corrects" ? correctionText.trim() || null : null,
        explanation: correctionType === "owner_corrects" ? correctionText.trim() || null : null,
      }),
    });
    setSubmitting(false);
    if (result.ok) {
      setDone("pending");
      setShowCorrection(false);
    }
  }

  return (
    <div className="min-w-0 rounded-xl border border-[#E8DFD0] bg-white p-4">
      <p className="break-words text-sm font-semibold text-[#1E1810]">{fact.displayValue ?? "—"}</p>
      <p className="mt-1 text-[11px] text-[#9A9184]">
        {t.lastVerified}: {fact.lastVerifiedAt ? new Date(fact.lastVerifiedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US") : t.never}
      </p>

      {done === "pending" ? (
        <p className="mt-2 rounded-lg bg-[#FFF4E0] px-2 py-1 text-xs font-semibold text-[#5C4E2E]">{t.pending}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={submitting} onClick={() => void submit("owner_confirms")} className="min-h-[40px] rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{t.confirm}</button>
          <button type="button" disabled={submitting} onClick={() => setShowCorrection((v) => !v)} className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50">{t.correct}</button>
          <button type="button" disabled={submitting} onClick={() => void submit("owner_rejects")} className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50">{t.notSure}</button>
        </div>
      )}

      {showCorrection ? (
        <div className="mt-2">
          <textarea value={correctionText} onChange={(e) => setCorrectionText(e.target.value)} rows={2} placeholder={t.correctionPlaceholder} className="w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" />
          <button type="button" disabled={submitting} onClick={() => void submit("owner_corrects")} className="mt-2 min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{t.submit}</button>
        </div>
      ) : null}
    </div>
  );
}
