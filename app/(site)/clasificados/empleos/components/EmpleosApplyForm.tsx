"use client";

import { useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { EmpleosScreenerQuestion } from "@/app/clasificados/empleos/data/empleosJobTypes";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

import { EMPLEOS_CTA_PRIMARY } from "../lib/empleosPremiumUi";

export function isLiveListingId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

type Props = {
  listingId: string;
  lang: Lang;
  screenerQuestions?: readonly EmpleosScreenerQuestion[];
};

export function EmpleosApplyForm({ listingId, lang, screenerQuestions = [] }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const screeners = useMemo(() => screenerQuestions.filter((q) => q.prompt.trim()), [screenerQuestions]);

  async function submit() {
    setBusy(true);
    setErr(null);
    setDone(null);
    try {
      const sb = createSupabaseBrowserClient();
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const answersJson: Record<string, string> = {};
      for (const q of screeners) {
        answersJson[q.id] = (answers[q.id] ?? "").trim();
      }
      const res = await fetch("/api/clasificados/empleos/applications", {
        method: "POST",
        headers,
        body: JSON.stringify({
          listingId,
          applicantName: name.trim(),
          applicantEmail: email.trim(),
          applicantPhone: phone.trim() || null,
          message: message.trim(),
          answersJson,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setErr(json.error ?? (lang === "es" ? "No se pudo enviar" : "Could not submit"));
        return;
      }
      setDone(lang === "es" ? "Solicitud enviada. El empleador la verá en su panel." : "Application sent. The employer will see it in their dashboard.");
      setMessage("");
      setAnswers({});
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#2A2826] outline-none focus:border-[#C9B46A]/60";

  return (
    <div className="space-y-3 border-t border-[#F0E8DC]/80 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
        {lang === "es" ? "Aplicar a esta vacante" : "Apply to this job"}
      </p>
      {done ? <p className="text-sm font-medium text-emerald-900">{done}</p> : null}
      {err ? <p className="text-sm font-medium text-red-800">{err}</p> : null}
      <label className="block text-xs font-medium text-[#4A4744]">
        {lang === "es" ? "Nombre" : "Name"}
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <label className="block text-xs font-medium text-[#4A4744]">
        Email
        <input className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="block text-xs font-medium text-[#4A4744]">
        {lang === "es" ? "Teléfono (opcional)" : "Phone (optional)"}
        <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </label>
      <label className="block text-xs font-medium text-[#4A4744]">
        {lang === "es" ? "Mensaje / carta breve" : "Message / short cover letter"}
        <textarea className={`${field} min-h-[88px]`} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {screeners.map((q) => (
        <label key={q.id} className="block text-xs font-medium text-[#4A4744]">
          {q.prompt}
          <input
            className={field}
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
          />
        </label>
      ))}
      <button
        type="button"
        disabled={busy || !name.trim() || !email.trim()}
        onClick={() => void submit()}
        className={`${EMPLEOS_CTA_PRIMARY} w-full justify-center px-4 text-center disabled:opacity-40`}
      >
        {busy ? (lang === "es" ? "Enviando…" : "Sending…") : lang === "es" ? "Enviar solicitud" : "Submit application"}
      </button>
    </div>
  );
}
