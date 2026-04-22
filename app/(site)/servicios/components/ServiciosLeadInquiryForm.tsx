"use client";

import { useState } from "react";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";

export function ServiciosLeadInquiryForm({ listingSlug, lang }: { listingSlug: string; lang: ServiciosLang }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"idle" | "ok" | "err">("idle");

  const t =
    lang === "en"
      ? {
          title: "Request a quote",
          name: "Your name",
          email: "Email",
          message: "What do you need?",
          submit: "Send",
          ok: "Sent — the provider will follow up by email.",
          err: "Could not send. Try again or use phone/WhatsApp.",
        }
      : {
          title: "Solicitar cotización",
          name: "Tu nombre",
          email: "Correo",
          message: "¿Qué necesitas?",
          submit: "Enviar",
          ok: "Enviado — el proveedor responderá por correo.",
          err: "No se pudo enviar. Intenta de nuevo o usa teléfono/WhatsApp.",
        };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDone("idle");
    try {
      const res = await fetch("/api/clasificados/servicios/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingSlug,
          senderName: name,
          senderEmail: email,
          message,
          requestKind: "quote",
          website: hp,
        }),
      });
      const j = (await res.json()) as { ok?: boolean };
      setDone(j.ok ? "ok" : "err");
      if (j.ok) {
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch {
      setDone("err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-black/[0.06] bg-white/95 p-4 shadow-sm sm:p-6"
      style={{ borderColor: "var(--lx-border, rgba(0,0,0,0.08))" }}
    >
      <h2 className="text-lg font-bold text-[color:var(--lx-text)]">{t.title}</h2>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          type="text"
          name="website"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
        />
        <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
          {t.name}
          <input
            required
            minLength={2}
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/[0.08] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
          {t.email}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/[0.08] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-[color:var(--lx-text-2)]">
          {t.message}
          <textarea
            required
            minLength={8}
            maxLength={4000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-black/[0.08] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-bold text-white shadow-md disabled:opacity-60"
        >
          {busy ? "…" : t.submit}
        </button>
        {done === "ok" ? <p className="text-sm font-medium text-emerald-800">{t.ok}</p> : null}
        {done === "err" ? <p className="text-sm font-medium text-rose-800">{t.err}</p> : null}
      </form>
    </section>
  );
}
