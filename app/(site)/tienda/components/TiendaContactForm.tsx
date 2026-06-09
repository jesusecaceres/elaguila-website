"use client";

import { useState, type FormEvent } from "react";
import type { Lang } from "../types/tienda";
import { submitContactForm } from "@/app/(site)/lib/submitContactForm";
import { VisibleEmailWithCopy } from "@/app/components/contact/LeonixEmailContactBlock";
import { LEONIX_PHONE_DISPLAY, LEONIX_PHONE_TEL, LEONIX_TIENDA_EMAIL } from "../data/leonixContact";
import { getLeadSuccessMessage, getPublicLeadErrorMessage } from "@/app/lib/leonix/leadConfirmationCopy";

const INQUIRY_OPTIONS: { value: string; es: string; en: string }[] = [
  { value: "specialty_product", es: "Producto especial / acabado distinto", en: "Specialty product / different finish" },
  { value: "custom_order", es: "Pedido personalizado", en: "Custom order" },
  { value: "rep_catalog", es: "Catálogo con asistencia / cotización", en: "Rep-assisted catalog / quote" },
  { value: "tienda_help", es: "Ayuda con pedidos (configurador, archivos)", en: "Order help (configurator, files)" },
  { value: "general_tienda", es: "Pregunta general sobre productos promocionales", en: "General promotional products question" },
];

function buildPromoMessage(fields: {
  inquiryType: string;
  service?: string;
  message: string;
  lang: Lang;
}): string {
  const en = fields.lang === "en";
  const topicOption = INQUIRY_OPTIONS.find((o) => o.value === fields.inquiryType);
  const topicLabel = topicOption ? (en ? topicOption.en : topicOption.es) : fields.inquiryType;
  const lines = [
    en ? "Promotional products / print quote request" : "Solicitud de cotización — productos promocionales / impresión",
    `${en ? "Topic" : "Tema"}: ${topicLabel}`,
    fields.service ? `${en ? "Product / service" : "Producto / servicio"}: ${fields.service.replace(/-/g, " ")}` : "",
    "",
    fields.message,
  ].filter(Boolean);
  return lines.join("\n");
}

export function TiendaContactForm(props: { lang: Lang; service?: string }) {
  const { lang, service } = props;
  const en = lang === "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [cityArea, setCityArea] = useState("");
  const [inquiryType, setInquiryType] = useState(service ? "rep_catalog" : "general_tienda");
  const [message, setMessage] = useState("");
  const [consentToContact, setConsentToContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!consentToContact) {
      setError(
        en
          ? "Please confirm consent to be contacted."
          : "Confirma el consentimiento para que te contactemos."
      );
      return;
    }

    setError(null);
    setLoading(true);

    const result = await submitContactForm(
      {
        fullName: name,
        email,
        phone: phone.trim(),
        businessName: businessName.trim(),
        cityArea: cityArea.trim(),
        inquiryType: "promotionalProducts",
        preferredContactMethod: phone.trim() ? "either" : "email",
        message: buildPromoMessage({ inquiryType, service, message, lang }),
        sourcePage: "/tienda/contacto",
        sourceCta: "promo_quote",
        consentToContact: true,
      },
      lang
    );

    setLoading(false);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setError(result.message || getPublicLeadErrorMessage(lang));
  }

  if (submitted) {
    return (
      <section className="mt-10 rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] p-6 sm:p-8">
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 text-sm leading-relaxed text-emerald-900"
        >
          <p className="font-medium">{getLeadSuccessMessage("promotionalProducts", lang)}</p>
        </div>
      </section>
    );
  }

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
        {en ? "Request a quote" : "Solicitar cotización"}
      </h2>
      <p className="mt-2 text-sm text-[color:var(--lx-muted)] leading-relaxed">
        {en ? (
          <>
            Submit your quote request online. Our team at{" "}
            <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang="en" /> will follow up with you.
          </>
        ) : (
          <>
            Envía tu cotización en línea. Nuestro equipo en{" "}
            <VisibleEmailWithCopy email={LEONIX_TIENDA_EMAIL} lang="es" /> dará seguimiento contigo.
          </>
        )}
      </p>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[color:var(--lx-lion)]">
            {en ? "Product / service interest" : "Interés de producto / servicio"}
          </label>
          <select
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value)}
            disabled={loading}
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
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{en ? "Email" : "Correo"}</label>
          <input
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">
            {en ? "Phone (recommended)" : "Teléfono (recomendado)"}
          </label>
          <input
            type="tel"
            disabled={loading}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">
            {en ? "Business or organization (optional)" : "Negocio u organización (opcional)"}
          </label>
          <input
            type="text"
            disabled={loading}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="organization"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">
            {en ? "City / area (optional)" : "Ciudad / área (opcional)"}
          </label>
          <input
            type="text"
            disabled={loading}
            value={cityArea}
            onChange={(e) => setCityArea(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
            autoComplete="address-level2"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--lx-muted)]">{en ? "Message" : "Mensaje"}</label>
          <textarea
            required
            disabled={loading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={12000}
            className="mt-1.5 w-full rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-canvas)] px-4 py-3 text-sm"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-[color:var(--lx-text-2)]">
          <input
            type="checkbox"
            required
            checked={consentToContact}
            onChange={(e) => setConsentToContact(e.target.checked)}
            disabled={loading}
            className="mt-1 h-4 w-4 shrink-0 rounded"
          />
          <span>
            {en
              ? "I agree that Leonix may contact me about my request"
              : "Acepto que Leonix me contacte sobre mi solicitud"}
          </span>
        </label>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-950">
            <p>{error}</p>
            <p className="mt-2 text-xs">
              {en ? "Or call " : "O llama al "}
              <a href={LEONIX_PHONE_TEL} className="font-semibold underline">
                {LEONIX_PHONE_DISPLAY}
              </a>
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={[
            "w-full min-h-[44px] whitespace-nowrap text-center text-sm sm:text-base px-4 py-3.5 rounded-full font-semibold transition shadow-[0_14px_40px_rgba(201,168,74,0.22)] disabled:opacity-70",
            "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95",
          ].join(" ")}
        >
          {loading ? (en ? "Sending…" : "Enviando…") : en ? "Send quote request" : "Enviar cotización"}
        </button>
      </form>
    </section>
  );
}
