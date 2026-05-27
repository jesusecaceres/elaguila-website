"use client";

import { useState, type FormEvent } from "react";
import type { Lang } from "../types/tienda";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";
import { LEONIX_PHONE_DISPLAY, LEONIX_PHONE_TEL, LEONIX_TIENDA_EMAIL } from "../data/leonixContact";

const INQUIRY_OPTIONS: { value: string; es: string; en: string }[] = [
  { value: "specialty_product", es: "Producto especial / acabado distinto", en: "Specialty product / different finish" },
  { value: "custom_order", es: "Pedido personalizado", en: "Custom order" },
  { value: "rep_catalog", es: "Catálogo con asistencia / cotización", en: "Rep-assisted catalog / quote" },
  { value: "tienda_help", es: "Ayuda con pedidos (configurador, archivos)", en: "Order help (configurator, files)" },
  { value: "general_tienda", es: "Pregunta general sobre productos promocionales", en: "General promotional products question" },
];

function buildTiendaMailto(fields: {
  name: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
  service?: string;
  lang: Lang;
}): string {
  const en = fields.lang === "en";
  const topicOption = INQUIRY_OPTIONS.find((o) => o.value === fields.inquiryType);
  const topicLabel = topicOption ? (en ? topicOption.en : topicOption.es) : fields.inquiryType;

  const subject = en
    ? "Promotional Products Quote - Leonix Media"
    : "Cotización Productos para Promoción - Leonix Media";

  const bodyLines = [
    en ? "Source: Promotional products / Productos para Promoción" : "Origen: Productos para Promoción",
    "",
    `${en ? "Topic" : "Tema"}: ${topicLabel}`,
    fields.service ? `${en ? "Product / service" : "Producto / servicio"}: ${fields.service.replace(/-/g, " ")}` : "",
    `${en ? "Name" : "Nombre"}: ${fields.name}`,
    `${en ? "Email" : "Correo"}: ${fields.email}`,
    fields.phone ? `${en ? "Phone" : "Teléfono"}: ${fields.phone}` : "",
    `${en ? "Language" : "Idioma"}: ${fields.lang}`,
    "",
    `${en ? "Message" : "Mensaje"}:`,
    fields.message,
  ].filter(Boolean);

  const params = new URLSearchParams({ subject, body: bodyLines.join("\n") });
  return `mailto:${LEONIX_TIENDA_EMAIL}?${params.toString()}`;
}

function TiendaContactFallback({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-900">
      {en ? (
        <p>
          We could not open your email app automatically. Email us at{" "}
          <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang="en" /> or call us at{" "}
          <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
            {LEONIX_PHONE_DISPLAY}
          </a>
          .
        </p>
      ) : (
        <p>
          No pudimos abrir tu correo automáticamente. Escríbenos a{" "}
          <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang="es" /> o llámanos al{" "}
          <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
            {LEONIX_PHONE_DISPLAY}
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
  const [status, setStatus] = useState<"idle" | "opened" | "error">("idle");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mailto = buildTiendaMailto({ name, email, phone: phone.trim(), inquiryType, message, service, lang });
    try {
      window.location.href = mailto;
      setStatus("opened");
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
        {en ? (
          <>
            This form opens your email app to send a message to{" "}
            <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang="en" />. For fastest help, visit or call us.
          </>
        ) : (
          <>
            Este formulario abre tu correo para enviar un mensaje a{" "}
            <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang="es" />. Para ayuda más rápida, visita o llámanos.
          </>
        )}
      </p>

      {status === "opened" ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-[color:var(--lx-lion)]/40 bg-[color:var(--lx-lion)]/12 px-4 py-4 text-sm text-[color:var(--lx-text)]"
        >
          <p>
            {en
              ? "Your email app opened. Review the quote request and press send."
              : "Se abrió tu aplicación de correo. Revisa la cotización y presiona enviar."}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-medium text-[color:var(--lx-lion)] underline"
          >
            {en ? "Fill out again" : "Llenar de nuevo"}
          </button>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
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

          {status === "error" ? <TiendaContactFallback lang={lang} /> : null}

          <button
            type="submit"
            className={[
              "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3.5 rounded-full font-semibold transition shadow-[0_14px_40px_rgba(201,168,74,0.22)]",
              "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95",
            ].join(" ")}
          >
            {en ? "Send quote request" : "Enviar cotización"}
          </button>
        </form>
      )}
    </section>
  );
}
