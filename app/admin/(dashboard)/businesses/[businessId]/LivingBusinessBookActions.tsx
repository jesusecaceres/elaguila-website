"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FACT_CATEGORIES, SOURCE_CLASSES, CONFIDENCE_LEVELS, UNKNOWN_PRIORITIES, DISCOVERY_SESSION_TYPES } from "@/app/lib/business/livingBook/constants";
import { DISCOVERY_QUESTIONS, findQuestionByKey } from "@/app/lib/business/livingBook/questionRegistry";
import type { BusinessDiscoverySession, BusinessUnknown } from "@/app/lib/business/livingBook/types";

async function postJson(url: string, method: string, body: unknown): Promise<boolean> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.ok;
}

export function CreateFactForm({ businessId, canConfirm }: { businessId: string; canConfirm: boolean }) {
  const router = useRouter();
  const [factKey, setFactKey] = useState("");
  const [factCategory, setFactCategory] = useState(FACT_CATEGORIES[0].value);
  const [sourceClass, setSourceClass] = useState("staff_observation");
  const [displayValue, setDisplayValue] = useState("");
  const [confidence, setConfidence] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!factKey.trim() || !displayValue.trim()) {
      setError("Fact key and value are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await postJson(`/api/admin/businesses/${businessId}/book/facts`, "POST", {
      factKey: factKey.trim(),
      factCategory,
      sourceClass,
      value: displayValue.trim(),
      displayValue: displayValue.trim(),
      confidence,
    });
    setSubmitting(false);
    if (!ok) {
      setError("Could not save — a manager may need to review this fact first, or check the fact key.");
      return;
    }
    setFactKey("");
    setDisplayValue("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-4">
      <fieldset className="space-y-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Add a fact</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="fact-key" className="block text-xs font-semibold text-[#3D3428]">Fact key</label>
            <input id="fact-key" value={factKey} onChange={(e) => setFactKey(e.target.value)} placeholder="e.g. busy_season" className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label htmlFor="fact-category" className="block text-xs font-semibold text-[#3D3428]">Category</label>
            <select id="fact-category" value={factCategory} onChange={(e) => setFactCategory(e.target.value as typeof factCategory)} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              {FACT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.en}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fact-source" className="block text-xs font-semibold text-[#3D3428]">Source class</label>
            <select id="fact-source" value={sourceClass} onChange={(e) => setSourceClass(e.target.value)} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              {SOURCE_CLASSES.filter((o) => canConfirm || o.value !== "owner_confirmed").map((o) => <option key={o.value} value={o.value}>{o.en}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="fact-confidence" className="block text-xs font-semibold text-[#3D3428]">Confidence</label>
            <select id="fact-confidence" value={confidence} onChange={(e) => setConfidence(e.target.value)} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              {CONFIDENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.en}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="fact-value" className="block text-xs font-semibold text-[#3D3428]">Value</label>
          <textarea id="fact-value" value={displayValue} onChange={(e) => setDisplayValue(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm" placeholder="What Leonix understands…" />
        </div>
        {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
        <button type="button" onClick={() => void submit()} disabled={submitting} className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {submitting ? "Saving…" : "Save fact"}
        </button>
      </fieldset>
    </div>
  );
}

export function FactDecisionButtons({ businessId, factId }: { businessId: string; factId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function decide(action: "confirm" | "reject") {
    setBusy(true);
    await postJson(`/api/admin/businesses/${businessId}/book/facts/${factId}`, "PATCH", { action });
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="mt-1 flex gap-2">
      <button type="button" disabled={busy} onClick={() => void decide("confirm")} className="min-h-[32px] rounded-lg border border-emerald-600 px-2 py-1 text-[11px] font-semibold text-emerald-800 disabled:opacity-50">Confirm</button>
      <button type="button" disabled={busy} onClick={() => void decide("reject")} className="min-h-[32px] rounded-lg border border-[#E8DFD0] px-2 py-1 text-[11px] font-semibold text-[#3D3428] disabled:opacity-50">Reject</button>
    </div>
  );
}

export function CreateUnknownForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [questionLabel, setQuestionLabel] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!questionLabel.trim()) return;
    setSubmitting(true);
    await postJson(`/api/admin/businesses/${businessId}/book/unknowns`, "POST", { questionLabel: questionLabel.trim(), priority });
    setSubmitting(false);
    setQuestionLabel("");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-3">
      <div className="min-w-[200px] flex-1">
        <label htmlFor="unknown-label" className="block text-xs font-semibold text-[#3D3428]">New unknown</label>
        <input id="unknown-label" value={questionLabel} onChange={(e) => setQuestionLabel(e.target.value)} placeholder="What don't we know yet?" className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-sm" />
      </div>
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className="min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
        {UNKNOWN_PRIORITIES.map((o) => <option key={o.value} value={o.value}>{o.en}</option>)}
      </select>
      <button type="button" onClick={() => void submit()} disabled={submitting} className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Add</button>
    </div>
  );
}

export function ResolveUnknownForm({ businessId, unknown }: { businessId: string; unknown: BusinessUnknown }) {
  const router = useRouter();
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit() {
    if (!resolution.trim()) return;
    setSubmitting(true);
    await postJson(`/api/admin/businesses/${businessId}/book/unknowns/${unknown.id}`, "PATCH", { resolution: resolution.trim() });
    setSubmitting(false);
    router.refresh();
  }
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution…" className="min-h-[32px] flex-1 rounded-lg border border-[#E8DFD0] bg-white px-2 py-1 text-xs" />
      <button type="button" disabled={submitting} onClick={() => void submit()} className="min-h-[32px] rounded-lg border border-emerald-600 px-2 py-1 text-[11px] font-semibold text-emerald-800 disabled:opacity-50">Resolve</button>
    </div>
  );
}

export function DiscoveryPanel({ businessId, session }: { businessId: string; session: BusinessDiscoverySession | null }) {
  const router = useRouter();
  const [sessionType, setSessionType] = useState(DISCOVERY_SESSION_TYPES[0].value);
  const [language, setLanguage] = useState<"es" | "en">("en");
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function start() {
    setSubmitting(true);
    await postJson(`/api/admin/businesses/${businessId}/book/discovery`, "POST", { sessionType, language, consentState: "owner_provided" });
    setSubmitting(false);
    router.refresh();
  }

  async function answer(questionKey: string, skip: boolean) {
    if (!session) return;
    setSubmitting(true);
    await postJson(`/api/admin/businesses/${businessId}/book/discovery/${session.id}`, "PATCH", {
      action: "answer",
      questionKey,
      answerText: skip ? null : answerText.trim() || null,
      answerValue: skip ? null : answerText.trim() || null,
      skipped: skip,
    });
    setSubmitting(false);
    setAnswerText("");
    router.refresh();
  }

  async function complete() {
    if (!session) return;
    setSubmitting(true);
    await postJson(`/api/admin/businesses/${businessId}/book/discovery/${session.id}`, "PATCH", { action: "complete", summary: "Session completed via staff workspace." });
    setSubmitting(false);
    router.refresh();
  }

  if (!session || session.status === "completed") {
    return (
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-3">
        <select value={sessionType} onChange={(e) => setSessionType(e.target.value as typeof sessionType)} className="min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
          {DISCOVERY_SESSION_TYPES.map((o) => <option key={o.value} value={o.value}>{o.en}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value as "es" | "en")} className="min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <button type="button" onClick={() => void start()} disabled={submitting} className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Start discovery session</button>
      </div>
    );
  }

  const nextKey = session.nextUnansweredQuestionKey ?? DISCOVERY_QUESTIONS[0]?.key ?? null;
  const question = nextKey ? findQuestionByKey(nextKey) : null;

  return (
    <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
      <p className="text-xs font-semibold text-[#8A6B1F]">Session in progress — {session.sessionType}</p>
      {question ? (
        <div className="mt-2">
          <p className="text-sm font-semibold text-[#1E1810]">{session.language === "es" ? question.es : question.en}</p>
          {question.whyWeAsk ? <p className="mt-1 text-[11px] text-[#7A7164]">{session.language === "es" ? question.whyWeAsk.es : question.whyWeAsk.en}</p> : null}
          <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-sm" placeholder="Answer…" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={submitting} onClick={() => void answer(question.key, false)} className="min-h-[36px] rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Save answer</button>
            <button type="button" disabled={submitting} onClick={() => void answer(question.key, true)} className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-xs font-semibold text-[#3D3428] disabled:opacity-50">Prefer not to answer</button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#7A7164]">All registry questions answered for this session.</p>
      )}
      <button type="button" disabled={submitting} onClick={() => void complete()} className="mt-3 min-h-[36px] rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50">Complete session</button>
    </div>
  );
}
