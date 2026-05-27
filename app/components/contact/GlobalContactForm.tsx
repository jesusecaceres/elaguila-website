"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import {
  LEONIX_PHONE_DISPLAY,
  LEONIX_PHONE_TEL,
  LEONIX_TIENDA_CONTACT_PATH,
} from "@/app/(site)/tienda/data/leonixContact";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";

type Lang = "es" | "en";

const SUBMIT_BTN =
  "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3 rounded-xl font-semibold shadow-[0_10px_28px_rgba(42,36,22,0.18)] transition";

const TOPIC_OPTIONS: { value: string; es: string; en: string }[] = [
  { value: "advertise_business", es: "Anunciar mi negocio", en: "Advertise my business" },
  { value: "classifieds", es: "Clasificados", en: "Classifieds" },
  { value: "promo_print", es: "Productos promocionales / impresión", en: "Promotional products / printing" },
  { value: "magazine", es: "Revista", en: "Magazine" },
  { value: "account_support", es: "Soporte de cuenta", en: "Account support" },
  { value: "general_question", es: "Pregunta general", en: "General question" },
];

function tiendaQuoteHref(lang: Lang): string {
  const params = new URLSearchParams({ lang, service: "cotizacion-general" });
  return `${LEONIX_TIENDA_CONTACT_PATH}?${params.toString()}`;
}

function buildGeneralMailto(fields: {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  lang: Lang;
}): string {
  const en = fields.lang === "en";
  const topicOption = TOPIC_OPTIONS.find((o) => o.value === fields.topic);
  const topicLabel = topicOption ? (en ? topicOption.en : topicOption.es) : fields.topic;

  const subject = en ? "Leonix Media Contact" : "Contacto Leonix Media";

  const bodyLines = [
    en ? "Source: Leonix Media general contact form" : "Origen: Formulario de contacto general Leonix Media",
    "",
    `${en ? "Topic" : "Motivo"}: ${topicLabel}`,
    `${en ? "Name" : "Nombre"}: ${fields.name}`,
    `${en ? "Email" : "Correo"}: ${fields.email}`,
    fields.phone ? `${en ? "Phone" : "Teléfono"}: ${fields.phone}` : "",
    `${en ? "Language" : "Idioma"}: ${fields.lang}`,
    "",
    `${en ? "Message" : "Mensaje"}:`,
    fields.message,
  ].filter(Boolean);

  const params = new URLSearchParams({ subject, body: bodyLines.join("\n") });
  return `mailto:${LEONIX_GLOBAL_EMAIL}?${params.toString()}`;
}

function ContactFallback({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-900">
      {en ? (
        <p>
          We could not open your email app automatically. Email us at{" "}
          <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang="en" /> or call us at{" "}
          <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
            {LEONIX_PHONE_DISPLAY}
          </a>
          .
        </p>
      ) : (
        <p>
          No pudimos abrir tu correo automáticamente. Escríbenos a{" "}
          <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang="es" /> o llámanos al{" "}
          <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
            {LEONIX_PHONE_DISPLAY}
          </a>
          .
        </p>
      )}
    </div>
  );
}

export function GlobalContactForm(props: { lang: Lang; initialMessage?: string }) {
  const { lang, initialMessage } = props;
  const en = lang === "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("general_question");
  const [message, setMessage] = useState(() => (initialMessage ?? "").slice(0, 12000));
  const [status, setStatus] = useState<"idle" | "opened" | "error">("idle");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mailto = buildGeneralMailto({ name, email, phone: phone.trim(), topic, message, lang });
    try {
      window.location.href = mailto;
      setStatus("opened");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-[color:var(--lx-card)] p-6 sm:p-8 rounded-2xl shadow-[0_18px_48px_rgba(42,36,22,0.10)] border border-[color:var(--lx-nav-border)]">
      <h2 className="text-2xl font-semibold text-[color:var(--lx-text)] mb-4">
        {en ? "Send a message" : "Envíanos un mensaje"}
      </h2>
      <p className="text-sm text-[color:var(--lx-muted)] mb-6 leading-relaxed">
        {en ? (
          <>
            Messages go to <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang="en" />. For promotional product
            quotes, use the promotional products contact linked above.
          </>
        ) : (
          <>
            Los mensajes llegan a <VisibleEmailWithCopy email={LEONIX_GLOBAL_EMAIL} lang="es" />. Para cotizaciones de
            productos promocionales, usa el contacto de productos promocionales arriba.
          </>
        )}
      </p>

      {status === "opened" ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm text-emerald-900"
        >
          <p>
            {en
              ? "Your email app opened. Review the message and press send."
              : "Se abrió tu aplicación de correo. Revisa el mensaje y presiona enviar."}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-medium text-emerald-800 underline"
          >
            {en ? "Fill out again" : "Llenar de nuevo"}
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block mb-1 text-[color:var(--lx-text-2)]/90">{en ? "Topic" : "Motivo"}</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/70 border border-[color:var(--lx-nav-border)] text-[color:var(--lx-text)] focus:outline-none"
            >
              {TOPIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {en ? o.en : o.es}
                </option>
              ))}
            </select>
            {topic === "promo_print" ? (
              <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                {en
                  ? "For faster print and promotional quotes, you can also use our "
                  : "Para cotizaciones de impresión y promoción más rápidas, también puedes usar la "}
                <Link href={tiendaQuoteHref(lang)} className="font-semibold text-[color:var(--lx-lion)] underline">
                  {en ? "promotional products contact" : "contacto de productos promocionales"}
                </Link>
                .
              </p>
            ) : null}
          </div>

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
              placeholder={en ? "If you'd like a callback" : "Si deseas que te llamemos"}
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

          {status === "error" ? <ContactFallback lang={lang} /> : null}

          <button
            type="submit"
            className={[
              SUBMIT_BTN,
              "bg-[color:var(--lx-cta-dark)] text-[color:var(--lx-cta-light)] hover:bg-[color:var(--lx-cta-dark-hover)]",
            ].join(" ")}
          >
            {en ? "Send to Leonix Media" : "Enviar a Leonix Media"}
          </button>
        </form>
      )}
    </div>
  );
}
