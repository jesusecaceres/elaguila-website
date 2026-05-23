"use client";

import { useState, type FormEvent } from "react";
import type { Lang } from "../types/tienda";
import {
  LEONIX_MAILTO_TIENDA,
  LEONIX_PHONE_DISPLAY,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_EMAIL,
} from "../data/leonixContact";

const INQUIRY_OPTIONS: { value: string; es: string; en: string }[] = [
  { value: "specialty_product", es: "Producto especial / acabado distinto", en: "Specialty product / different finish" },
  { value: "custom_order", es: "Pedido personalizado", en: "Custom order" },
  { value: "rep_catalog", es: "Catálogo con asistencia / cotización", en: "Rep-assisted catalog / quote" },
  { value: "tienda_help", es: "Ayuda con la Tienda (configurador, archivos)", en: "Tienda help (configurator, files)" },
  { value: "general_tienda", es: "Pregunta general sobre Tienda", en: "General Tienda question" },
];

function TiendaContactSubmitError({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return (
    <div role="alert" className="rounded-xl border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100 leading-relaxed">
      {en ? (
        <p>
          We could not send your message right now. Please call us at{" "}
          <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
            {LEONIX_PHONE_DISPLAY}
          </a>{" "}
          or{" "}
          <a href={LEONIX_MAILTO_TIENDA} className="font-semibold underline break-all">
            email us directly
          </a>
          .
        </p>
      ) : (
        <p>
          No pudimos enviar tu mensaje ahora. Llámanos al{" "}
          <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
            {LEONIX_PHONE_DISPLAY}
          </a>{" "}
          o{" "}
          <a href={LEONIX_MAILTO_TIENDA} className="font-semibold underline break-all">
            escríbenos directamente
          </a>
          .
        </p>
      )}
    </div>
  );
}

export function TiendaContactForm(props: { lang: Lang; service?: string }) {
  const { lang, service } = props;
  const en = lang === "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState(service ? "rep_catalog" : "general_tienda");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/tienda/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone.trim() || undefined,
          inquiryType,
          message,
          lang,
          service: service?.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setInquiryType(service ? "rep_catalog" : "general_tienda");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8">
      {service ? (
        <div className="mb-5 rounded-xl border border-[color:var(--lx-olive)]/30 bg-[color:var(--lx-olive)]/8 px-4 py-3 text-sm">
          <span className="font-semibold text-[color:var(--lx-text)]">
            {en ? "Product / service of interest: " : "Producto / servicio de interés: "}
          </span>
          <span className="text-[color:var(--lx-text-2)]">{service.replace(/-/g, " ")}</span>
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">
        {en ? "Send us a note" : "Escríbenos"}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--lx-muted)] leading-relaxed">
        {en
          ? `This form delivers to ${LEONIX_TIENDA_EMAIL}. For fastest help, visit or call us — email may take longer.`
          : `Este formulario llega a ${LEONIX_TIENDA_EMAIL}. Para ayuda más rápida, visita o llámanos — el correo puede tardar más.`}
      </p>

      {status === "success" ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-[color:var(--lx-lion)]/40 bg-[color:var(--lx-lion)]/12 px-4 py-4 text-sm text-[color:var(--lx-text)]"
        >
          <p>
            {en
              ? "Message sent. We will reply as soon as possible."
              : "Mensaje enviado. Te responderemos lo antes posible."}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-medium text-[color:var(--lx-lion)] underline"
          >
            {en ? "Send another message" : "Enviar otro mensaje"}
          </button>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={(ev) => void onSubmit(ev)}>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[color:var(--lx-lion)]">
              {en ? "Topic" : "Tema"}
            </label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm text-[color:var(--lx-text)]"
            >
              {INQUIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {en ? o.en : o.es}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{en ? "Full name" : "Nombre completo"}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)]/60"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{en ? "Email" : "Correo"}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)]/60"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[color:var(--lx-muted)]">
              {en ? "Phone (recommended)" : "Teléfono (recomendado)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)]/60"
              placeholder={en ? "Best number to reach you" : "Mejor número para localizarte"}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{en ? "Message" : "Mensaje"}</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={12000}
              className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm text-[color:var(--lx-text)] placeholder:text-[color:var(--lx-muted)]/60"
            />
          </div>

          {status === "error" ? <TiendaContactSubmitError lang={lang} /> : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className={[
              "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3.5 rounded-full font-semibold transition shadow-[0_14px_40px_rgba(201,168,74,0.22)]",
              status === "loading"
                ? "bg-[color:var(--lx-gold)]/50 text-[color:var(--lx-text)] cursor-wait"
                : "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95",
            ].join(" ")}
          >
            {status === "loading" ? (en ? "Sending…" : "Enviando…") : en ? "Send to Tienda" : "Enviar a Tienda"}
          </button>
        </form>
      )}
    </section>
  );
}
