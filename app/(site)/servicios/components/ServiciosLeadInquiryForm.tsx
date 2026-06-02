"use client";

import { useState } from "react";
import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  formatServiciosUsPhoneDisplay,
  normalizeServiciosLeadPhoneForSubmit,
  serviciosPhoneDigitsOnly,
} from "../lib/serviciosUsPhoneMask";

type PreferredContact = "email" | "phone" | "whatsapp";

export function ServiciosLeadInquiryForm({ listingSlug, lang }: { listingSlug: string; lang: ServiciosLang }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState<PreferredContact>("email");
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"idle" | "ok" | "partial" | "err">("idle");

  const t =
    lang === "en"
      ? {
          title: "Request a quote",
          name: "Your name",
          email: "Email",
          phone: "Phone / WhatsApp",
          phoneHint: "Optional — helps if you prefer a call or WhatsApp.",
          prefLabel: "How should they contact you?",
          prefEmail: "Email",
          prefPhone: "Phone",
          prefWhatsapp: "WhatsApp",
          message: "What do you need?",
          submit: "Send",
          ok: "Request sent. The business will receive your message by email.",
          partial:
            "Request saved, but we could not email the business. Use the contact buttons above for a faster response.",
          err: "Could not send. Try again or use the contact buttons above.",
        }
      : {
          title: "Solicitar cotización",
          name: "Tu nombre",
          email: "Correo",
          phone: "Teléfono / WhatsApp",
          phoneHint: "Opcional — útil si prefieres llamada o WhatsApp.",
          prefLabel: "¿Cómo prefieres que te contacten?",
          prefEmail: "Correo",
          prefPhone: "Teléfono",
          prefWhatsapp: "WhatsApp",
          message: "¿Qué necesitas?",
          submit: "Enviar",
          ok: "Solicitud enviada. El negocio recibirá tu mensaje por correo.",
          partial:
            "Solicitud guardada, pero no pudimos enviar un correo al negocio. Usa los botones de contacto arriba para una respuesta más rápida.",
          err: "No se pudo enviar. Intenta de nuevo o usa los botones de contacto arriba.",
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
          senderPhone: normalizeServiciosLeadPhoneForSubmit(senderPhone) || undefined,
          preferredContactMethod,
          message,
          requestKind: "quote",
          website: hp,
          lang,
        }),
      });
      const j = (await res.json()) as { ok?: boolean; accepted?: boolean; emailNotified?: boolean };
      if (j.accepted === false) {
        setDone("idle");
        return;
      }
      if (!res.ok || !j.ok) {
        setDone("err");
        return;
      }
      if (j.emailNotified) {
        setDone("ok");
        setName("");
        setEmail("");
        setSenderPhone("");
        setPreferredContactMethod("email");
        setMessage("");
      } else {
        setDone("partial");
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
          {t.phone}
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={20}
            value={senderPhone}
            onChange={(e) => {
              let d = serviciosPhoneDigitsOnly(e.target.value);
              if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
              setSenderPhone(formatServiciosUsPhoneDisplay(d.slice(0, 10)));
            }}
            placeholder="(555) 555-5555"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-black/[0.08] px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[0.65rem] font-normal leading-snug text-[color:var(--lx-muted)]">
            {t.phoneHint}
          </span>
        </label>
        <fieldset>
          <legend className="text-xs font-semibold text-[color:var(--lx-text-2)]">{t.prefLabel}</legend>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(
              [
                ["email", t.prefEmail],
                ["phone", t.prefPhone],
                ["whatsapp", t.prefWhatsapp],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name="preferredContactMethod"
                  value={value}
                  checked={preferredContactMethod === value}
                  onChange={() => setPreferredContactMethod(value)}
                  className="h-4 w-4 accent-[#7A1E2C]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
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
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-white shadow-md transition hover:brightness-[1.06] disabled:opacity-60"
        >
          {busy ? "…" : t.submit}
        </button>
        {done === "ok" ? <p className="text-sm font-medium text-emerald-800">{t.ok}</p> : null}
        {done === "partial" ? <p className="text-sm font-medium text-amber-900">{t.partial}</p> : null}
        {done === "err" ? <p className="text-sm font-medium text-rose-800">{t.err}</p> : null}
      </form>
    </section>
  );
}
