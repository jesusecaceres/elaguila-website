"use client";

import { useState } from "react";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export function ServiciosReviewSubmitForm({ listingSlug, lang }: { listingSlug: string; lang: ServiciosLang }) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(5);
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"idle" | "ok" | "err">("idle");

  const t =
    lang === "en"
      ? {
          title: "Leave a review",
          note: "Reviews are moderated before they appear publicly.",
          author: "Your name",
          stars: "Rating",
          text: "Your experience",
          submit: "Submit for review",
          ok: "Thanks — your review is pending moderation.",
          err: "Could not submit. Try again later.",
        }
      : {
          title: "Dejar una reseña",
          note: "Las reseñas se moderan antes de publicarse.",
          author: "Tu nombre",
          stars: "Calificación",
          text: "Tu experiencia",
          submit: "Enviar a revisión",
          ok: "Gracias — tu reseña está pendiente de moderación.",
          err: "No se pudo enviar. Intenta más tarde.",
        };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDone("idle");
    try {
      const res = await fetch("/api/clasificados/servicios/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingSlug,
          authorName,
          body,
          rating,
          companyUrl: hp,
        }),
      });
      const j = (await res.json()) as { ok?: boolean };
      setDone(j.ok ? "ok" : "err");
      if (j.ok) {
        setAuthorName("");
        setBody("");
        setRating(5);
      }
    } catch {
      setDone("err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-black/[0.06] bg-[color:var(--lx-section)]/40 p-4 sm:p-6"
      style={{ borderColor: "var(--lx-border, rgba(0,0,0,0.08))" }}
    >
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.title}</h2>
      <p className="mt-1 text-xs text-[color:var(--lx-text-2)]">{t.note}</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          type="text"
          name="companyUrl"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
        <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
          {t.author}
          <input
            required
            minLength={2}
            maxLength={120}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
          {t.stars}
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
          {t.text}
          <textarea
            required
            minLength={12}
            maxLength={2000}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#3B66AD]/40 bg-white px-4 text-sm font-bold text-[#3B66AD] shadow-sm disabled:opacity-60"
        >
          {busy ? "…" : t.submit}
        </button>
        {done === "ok" ? <p className="text-sm font-medium text-emerald-800">{t.ok}</p> : null}
        {done === "err" ? <p className="text-sm font-medium text-rose-800">{t.err}</p> : null}
      </form>
    </section>
  );
}
