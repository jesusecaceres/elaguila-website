"use client";

import { useState, type FormEvent } from "react";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";

type Lang = "es" | "en";

export function GlobalContactForm(props: { lang: Lang }) {
  const { lang } = props;
  const en = lang === "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone.trim() || undefined, message, lang }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? (en ? "Something went wrong." : "Algo salió mal."));
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg(en ? "Network error. Please try again." : "Error de red. Intenta de nuevo.");
    }
  };

  return (
    <div className="bg-[color:var(--lx-card)] p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
      <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">
        {en ? "Send a message" : "Envíanos un mensaje"}
      </h2>
      <p className="text-sm text-[color:var(--lx-muted)] mb-6 leading-relaxed">
        {en
          ? `Messages go to ${LEONIX_GLOBAL_EMAIL}. For print orders and Tienda, use the Tienda contact page linked above.`
          : `Los mensajes llegan a ${LEONIX_GLOBAL_EMAIL}. Para pedidos de impresión y Tienda, usa la página de contacto Tienda arriba.`}
      </p>

      {status === "success" ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm text-emerald-900"
        >
          <p>
            {en
              ? "Thank you — your message was sent. We’ll get back to you as soon as we can."
              : "Gracias — tu mensaje se envió. Te responderemos lo antes posible."}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-medium text-emerald-800 underline"
          >
            {en ? "Send another message" : "Enviar otro mensaje"}
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={(ev) => void onSubmit(ev)}>
          <div>
            <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{en ? "Full name" : "Nombre completo"}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
              placeholder={en ? "Your name" : "Tu nombre"}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{en ? "Email" : "Correo electrónico"}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
              placeholder={en ? "you@example.com" : "tu@ejemplo.com"}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block mb-1 text-[color:var(--lx-text-2)]/90">
              {en ? "Phone (optional)" : "Teléfono (opcional)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
              placeholder={en ? "If you’d like a callback" : "Si deseas que te llamemos"}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{en ? "Message" : "Mensaje"}</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={12000}
              className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)] focus:outline-none"
              placeholder={en ? "How can we help?" : "¿En qué podemos ayudarte?"}
            />
          </div>

          {status === "error" && errorMsg ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className={[
              "w-full py-3 rounded-xl text-lg font-semibold shadow-[0_10px_28px_rgba(42,36,22,0.18)] transition",
              status === "loading"
                ? "bg-[color:var(--lx-cta-dark)]/60 text-[color:var(--lx-cta-light)] cursor-wait"
                : "bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)]",
            ].join(" ")}
          >
            {status === "loading" ? (en ? "Sending…" : "Enviando…") : en ? "Send message" : "Enviar mensaje"}
          </button>
        </form>
      )}
    </div>
  );
}
