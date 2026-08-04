"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { ideaBuilderCopy, type Lang } from "./ideaBuilderCopy";

type IdeaBuilderPath = "have_business" | "thinking_about_starting";
type ReadinessAnswerValue = boolean | string | null;
type ReadinessAnswers = Record<string, ReadinessAnswerValue>;

type Draft = {
  intentId: string;
  path: IdeaBuilderPath | null;
  ideaDescription: string;
  customerDefinition: string;
  problemDefinition: string;
  simpleOffer: string;
  readinessAnswers: ReadinessAnswers;
  status: "in_progress" | "completed" | "abandoned";
};

type CompletionState = { requiredFieldsFilled: number; requiredFieldsTotal: number; readinessAnswered: number; readinessTotal: number; isComplete: boolean };
type ReadinessSummary = { byCategory: { category: string; answered: number; total: number }[]; suggestedNextCapabilityKeys: string[] };

const READINESS_QUESTIONS: { key: string; category: string; es: string; en: string }[] = [
  { key: "has_clear_time_commitment", category: "startup_readiness", es: "Tienes claro cuanto tiempo a la semana puedes dedicar a este negocio?", en: "Do you know how many hours a week you can commit to this business?" },
  { key: "has_starting_funds_plan", category: "startup_readiness", es: "Tienes una idea de cuanto dinero necesitas para empezar?", en: "Do you have an idea of how much money you would need to start?" },
  { key: "comfortable_with_phone_tools", category: "technology_readiness", es: "Te sientes comodo usando tu telefono para fotos, mensajes y aplicaciones basicas?", en: "Are you comfortable using your phone for photos, messages, and basic apps?" },
  { key: "has_email_or_account_ready", category: "technology_readiness", es: "Tienes un correo electronico que revisas regularmente?", en: "Do you have an email address you check regularly?" },
  { key: "knows_where_customers_look", category: "visibility_basics", es: "Sabes donde tus posibles clientes buscan negocios como el tuyo?", en: "Do you know where your potential customers look for businesses like yours?" },
  { key: "has_business_name_idea", category: "visibility_basics", es: "Tienes una idea de nombre para tu negocio?", en: "Do you have an idea for your business name?" },
  { key: "comfortable_responding_customers", category: "communication_basics", es: "Te sientes comodo respondiendo preguntas de clientes?", en: "Are you comfortable responding to customer questions?" },
  { key: "has_way_to_be_contacted", category: "communication_basics", es: "Tienes un telefono o WhatsApp que puedas usar para tu negocio?", en: "Do you have a phone or WhatsApp you can use for your business?" },
];

async function getBearerToken(): Promise<string | null> {
  const sb = createSupabaseBrowserClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiCall<T>(token: string, method: string, body?: unknown): Promise<{ ok: boolean; data?: T }> {
  try {
    const res = await fetch("/api/dashboard/business/idea-builder", {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json.ok === true, data: json };
  } catch {
    return { ok: false };
  }
}

export function IdeaBuilderWizard({ lang }: { lang: Lang }) {
  const t = ideaBuilderCopy(lang);
  const [status, setStatus] = useState<"checking_auth" | "signed_out" | "unavailable" | "ready">("checking_auth");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [completion, setCompletion] = useState<CompletionState | null>(null);
  const [readiness, setReadiness] = useState<ReadinessSummary | null>(null);
  const [catalogLessons, setCatalogLessons] = useState<{ lessonKey: string; capabilityKey: string; titleEs: string; titleEn: string }[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getBearerToken();
      if (!token) {
        setStatus("signed_out");
        return;
      }
      const list = await apiCall<{ drafts: (Draft & { readinessAnswers: ReadinessAnswers })[] }>(token, "GET");
      if (!list.ok) {
        setStatus("unavailable");
        return;
      }
      const existing = (list.data?.drafts ?? []).find((d) => d.status === "in_progress");
      const initial: Draft = existing
        ? {
            intentId: existing.intentId,
            path: existing.path,
            ideaDescription: existing.ideaDescription ?? "",
            customerDefinition: existing.customerDefinition ?? "",
            problemDefinition: existing.problemDefinition ?? "",
            simpleOffer: existing.simpleOffer ?? "",
            readinessAnswers: existing.readinessAnswers ?? {},
            status: existing.status,
          }
        : {
            intentId: globalThis.crypto.randomUUID(),
            path: null,
            ideaDescription: "",
            customerDefinition: "",
            problemDefinition: "",
            simpleOffer: "",
            readinessAnswers: {},
            status: "in_progress",
          };
      setDraft(initial);
      setStatus("ready");
    })();
  }, []);

  useEffect(() => {
    fetch(`/api/dashboard/business/learning/catalog?lang=${lang}`)
      .then((res) => res.json())
      .then((json: { ok: boolean; lessons?: { lessonKey: string; capabilityKey: string; titleEs: string; titleEn: string }[] }) => {
        if (json.ok) setCatalogLessons(json.lessons ?? []);
      })
      .catch(() => {});
  }, [lang]);

  function scheduleSave(next: Draft) {
    setDraft(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const token = await getBearerToken();
      if (!token) return;
      setSaving(true);
      const result = await apiCall<{ completionState: CompletionState; readinessSummary: ReadinessSummary }>(token, "POST", {
        intentId: next.intentId,
        path: next.path,
        ideaDescription: next.ideaDescription,
        customerDefinition: next.customerDefinition,
        problemDefinition: next.problemDefinition,
        simpleOffer: next.simpleOffer,
        readinessAnswers: next.readinessAnswers,
        language: lang,
      });
      if (result.ok && result.data) {
        setCompletion(result.data.completionState);
        setReadiness(result.data.readinessSummary);
      }
      setSaving(false);
    }, 600);
  }

  async function markComplete() {
    if (!draft) return;
    const token = await getBearerToken();
    if (!token) return;
    setSaving(true);
    await apiCall(token, "PATCH", { intentId: draft.intentId, action: "complete" });
    setDraft({ ...draft, status: "completed" });
    setSaving(false);
  }

  function downloadSummary() {
    if (!draft) return;
    const lines = [
      t.summaryFileTitle,
      "",
      `${t.pathQuestion} ${draft.path === "have_business" ? t.pathHaveBusiness : draft.path === "thinking_about_starting" ? t.pathThinking : "-"}`,
      "",
      `${t.ideaDescriptionLabel}\n${draft.ideaDescription || "-"}`,
      "",
      `${t.customerDefinitionLabel}\n${draft.customerDefinition || "-"}`,
      "",
      `${t.problemDefinitionLabel}\n${draft.problemDefinition || "-"}`,
      "",
      `${t.simpleOfferLabel}\n${draft.simpleOffer || "-"}`,
      "",
      t.disclaimer,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leonix-idea-builder-summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const suggestedLessons = useMemo(() => {
    if (!readiness) return [];
    return readiness.suggestedNextCapabilityKeys
      .map((key) => catalogLessons.find((l) => l.capabilityKey === key))
      .filter((l): l is (typeof catalogLessons)[number] => Boolean(l));
  }, [readiness, catalogLessons]);

  if (status === "checking_auth" || status === "signed_out") {
    return <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2] p-6 text-sm text-[#5C5346]">{t.loading}</div>;
  }
  if (status === "unavailable") {
    return <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2] p-6 text-sm text-[#5C5346]">{t.unavailable}</div>;
  }
  if (!draft) return null;

  const percent = completion ? Math.round(((completion.requiredFieldsFilled + completion.readinessAnswered) / (completion.requiredFieldsTotal + completion.readinessTotal)) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1810]">{t.title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#5C5346]">{t.subtitle}</p>
      </header>

      {draft.status === "completed" ? (
        <p className="rounded-2xl border border-[#C9B46A]/40 bg-[#FFFCF7] p-4 text-sm text-[#3D3428]">{t.completedBanner}</p>
      ) : null}

      <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <p className="text-xs font-semibold text-[#5C5346]">{t.completionLabel}: {percent}% {saving ? `(${t.savingStatus})` : `(${t.saveStatus})`}</p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F3EBDD]">
          <div className="h-full bg-gradient-to-r from-[#D4BC6A] to-[#C9A84A]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <section className="space-y-2">
        <p className="text-sm font-semibold text-[#1E1810]">{t.pathQuestion}</p>
        <div className="flex flex-wrap gap-2">
          {(["have_business", "thinking_about_starting"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => scheduleSave({ ...draft, path: p })}
              className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${draft.path === p ? "border-[#C9A84A] bg-[#FFFCF7] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#3D3428]"}`}
            >
              {p === "have_business" ? t.pathHaveBusiness : t.pathThinking}
            </button>
          ))}
        </div>
      </section>

      {(
        [
          ["ideaDescription", t.ideaDescriptionLabel],
          ["customerDefinition", t.customerDefinitionLabel],
          ["problemDefinition", t.problemDefinitionLabel],
          ["simpleOffer", t.simpleOfferLabel],
        ] as const
      ).map(([field, label]) => (
        <section key={field} className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#1E1810]" htmlFor={field}>{label}</label>
          <textarea
            id={field}
            value={draft[field]}
            onChange={(e) => scheduleSave({ ...draft, [field]: e.target.value })}
            placeholder={t.placeholderText}
            rows={3}
            maxLength={4000}
            className="w-full min-h-11 rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm text-[#3D3428] outline-none focus:border-[#C9B46A]"
          />
        </section>
      ))}

      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-[#1E1810]">{t.readinessTitle}</p>
          <p className="text-xs text-[#7A7164]">{t.readinessSubtitle}</p>
        </div>
        <ul className="space-y-3">
          {READINESS_QUESTIONS.map((q) => {
            const value = draft.readinessAnswers[q.key] ?? null;
            return (
              <li key={q.key} className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
                <p className="break-words text-sm text-[#3D3428]">{lang === "es" ? q.es : q.en}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([
                    [true, t.yes],
                    [false, t.no],
                    ["not_sure", t.notSure],
                  ] as const).map(([answerValue, label]) => (
                    <button
                      key={String(answerValue)}
                      type="button"
                      onClick={() => scheduleSave({ ...draft, readinessAnswers: { ...draft.readinessAnswers, [q.key]: answerValue } })}
                      className={`min-h-11 rounded-lg border px-3 text-xs font-semibold ${value === answerValue ? "border-[#C9A84A] bg-[#FFFCF7] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#5C5346]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-semibold text-[#1E1810]">{t.nextLessonsTitle}</p>
        {suggestedLessons.length === 0 ? (
          <p className="text-xs text-[#9A9184]">{t.noNextLessons}</p>
        ) : (
          <ul className="space-y-2">
            {suggestedLessons.map((l) => (
              <li key={l.lessonKey}>
                <Link href={`/aprender/leccion/${l.lessonKey}?lang=${lang}`} className="block min-h-11 rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm font-semibold text-[#3D3428]">
                  {lang === "es" ? l.titleEs : l.titleEn}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={markComplete}
          disabled={saving || draft.status === "completed"}
          className="inline-flex min-h-11 items-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-5 text-sm font-semibold text-[#1E1810] disabled:opacity-60"
        >
          {t.markComplete}
        </button>
        <button type="button" onClick={downloadSummary} className="inline-flex min-h-11 items-center rounded-2xl border border-[#E8DFD0] bg-white px-5 text-sm font-semibold text-[#2C2416]">
          {t.downloadSummary}
        </button>
      </div>

      <p className="text-xs text-[#9A9184]">{t.disclaimer}</p>
    </div>
  );
}
