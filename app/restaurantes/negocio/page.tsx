"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import PageHero from "../../components/PageHero";

type FormState = {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  cuisine: string;
  website: string;
  instagram: string;
  facebook: string;
  googleMapsUrl: string;
  hoursNote: string;
  message: string;
};

function clamp(s: string, max: number) {
  const v = (s || "").trim();
  return v.length > max ? v.slice(0, max) : v;
}

function buildEmailBody(data: FormState) {
  const lines = [
    `Restaurant: ${data.businessName}`,
    `Contact: ${data.contactName}`,
    `Phone: ${data.phone}`,
    `Email: ${data.email}`,
    `City: ${data.city}`,
    `Address: ${data.address}`,
    `Cuisine: ${data.cuisine}`,
    `Website: ${data.website}`,
    `Instagram: ${data.instagram}`,
    `Facebook: ${data.facebook}`,
    `Google Maps: ${data.googleMapsUrl}`,
    `Hours note: ${data.hoursNote}`,
    "",
    "Message:",
    data.message,
  ];
  return lines.join("\n");
}

export default function RestaurantBusinessFormPage() {
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") || "es";

  const packagesHref = `/restaurantes/planes?lang=${lang}`;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<FormState>({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    cuisine: "",
    website: "",
    instagram: "",
    facebook: "",
    googleMapsUrl: "",
    hoursNote: "",
    message: "",
  });

  const mailTo = useMemo(() => {
    const to = "chuy@leonixmedia.com";
    const subject = lang === "es" ? "Solicitud: Publicar restaurante en LEONIX" : "Request: List my restaurant on LEONIX";
    const body = buildEmailBody(data);
    const params = new URLSearchParams({
      subject,
      body,
    });
    return `mailto:${to}?${params.toString()}`;
  }, [data, lang]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!data.businessName.trim()) return lang === "es" ? "Falta el nombre del restaurante." : "Restaurant name is required.";
    if (!data.contactName.trim()) return lang === "es" ? "Falta el nombre de contacto." : "Contact name is required.";
    if (!data.phone.trim() && !data.email.trim())
      return lang === "es" ? "Agrega teléfono o correo." : "Add a phone number or email.";
    if (!data.city.trim()) return lang === "es" ? "Falta la ciudad." : "City is required.";
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      // Minimal, no-guess workflow: we generate an email draft with all details.
      // Businesses can send immediately. This keeps builds GREEN while backend intake is finalized.
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(buildEmailBody(data));
    } catch {
      // ignore
    }
  }

  const backHref = `/restaurantes?lang=${lang}`;

  return (
    <main className="min-h-screen bg-black text-white">
      <PageHero title="List Your Restaurant" titleEs="Publica tu restaurante" />

      <section className="w-full max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-100">
                {lang === "es" ? "Formulario rápido (móvil primero)" : "Fast form (mobile-first)"}
              </div>
              <div className="mt-1 text-sm text-gray-300">
                {lang === "es"
                  ? "Llena lo básico y nosotros te ayudamos a cerrar clientes con un perfil verificado."
                  : "Share the essentials—we’ll help you close customers with a verified profile."}
              </div>
            </div>
            <Link href={backHref} className="text-sm text-gray-200 hover:text-white underline underline-offset-4">
              {lang === "es" ? "Volver" : "Back"}
            </Link>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {submitted ? (
            <div className="mt-5 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
              <div className="text-base font-semibold text-yellow-200">
                {lang === "es" ? "Listo. Solo falta enviar." : "Done. Just send it."}
              </div>
              <div className="mt-2 text-sm text-gray-200">
                {lang === "es"
                  ? "Abre el correo con tu solicitud (ya viene preparado) y envíalo. Te respondemos para verificar y publicar."
                  : "Open the email draft (pre-filled) and send it. We’ll reply to verify and publish."}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href={mailTo}
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 px-4 py-3 text-sm font-semibold hover:bg-yellow-500/20 transition"
                >
                  {lang === "es" ? "Abrir correo listo" : "Open email draft"}
                </a>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-100 px-4 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  {lang === "es" ? "Copiar detalles" : "Copy details"}
                </button>
                <Link
                  href={packagesHref}
                  className="inline-flex items-center justify-center rounded-xl bg-black/30 border border-yellow-500/25 text-gray-100 px-4 py-3 text-sm font-semibold hover:bg-black/40 transition"
                >
                  {lang === "es" ? "Ver planes" : "View plans"}
                </Link>
              </div>

              <div className="mt-4 text-xs text-gray-300">
                {lang === "es"
                  ? "Tip: Si prefieres, también puedes enviar un mensaje por Instagram con estos detalles."
                  : "Tip: If you prefer, you can also DM us on Instagram with the same details."}
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Nombre del restaurante *" : "Restaurant name *"}</label>
                  <input
                    value={data.businessName}
                    onChange={(e) => update("businessName", clamp(e.target.value, 80))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: Taquería El León" : "Ex: El León Taqueria"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Ciudad *" : "City *"}</label>
                  <input
                    value={data.city}
                    onChange={(e) => update("city", clamp(e.target.value, 60))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Nombre de contacto *" : "Contact name *"}</label>
                  <input
                    value={data.contactName}
                    onChange={(e) => update("contactName", clamp(e.target.value, 80))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: Juan Pérez" : "Ex: John Doe"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Teléfono / WhatsApp" : "Phone / WhatsApp"}</label>
                  <input
                    value={data.phone}
                    onChange={(e) => update("phone", clamp(e.target.value, 40))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: (408) 555-1234" : "Ex: (408) 555-1234"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Correo" : "Email"}</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", clamp(e.target.value, 80))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: info@..." : "Ex: info@..."}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Cocina (opcional)" : "Cuisine (optional)"}</label>
                  <input
                    value={data.cuisine}
                    onChange={(e) => update("cuisine", clamp(e.target.value, 60))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: Mexicana, Mariscos" : "Ex: Mexican, Seafood"}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300">{lang === "es" ? "Dirección (opcional)" : "Address (optional)"}</label>
                <input
                  value={data.address}
                  onChange={(e) => update("address", clamp(e.target.value, 120))}
                  className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                  placeholder={lang === "es" ? "Calle, número, suite" : "Street, number, suite"}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Sitio web (opcional)" : "Website (optional)"}</label>
                  <input
                    value={data.website}
                    onChange={(e) => update("website", clamp(e.target.value, 120))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Google Maps link (opcional)" : "Google Maps link (optional)"}</label>
                  <input
                    value={data.googleMapsUrl}
                    onChange={(e) => update("googleMapsUrl", clamp(e.target.value, 180))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Instagram (opcional)" : "Instagram (optional)"}</label>
                  <input
                    value={data.instagram}
                    onChange={(e) => update("instagram", clamp(e.target.value, 80))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder="@"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Facebook (opcional)" : "Facebook (optional)"}</label>
                  <input
                    value={data.facebook}
                    onChange={(e) => update("facebook", clamp(e.target.value, 120))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "URL o nombre" : "URL or name"}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300">{lang === "es" ? "Horario (opcional)" : "Hours note (optional)"}</label>
                <input
                  value={data.hoursNote}
                  onChange={(e) => update("hoursNote", clamp(e.target.value, 160))}
                  className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                  placeholder={lang === "es" ? "Ej: Lun–Dom 9am–9pm" : "Ex: Mon–Sun 9am–9pm"}
                />
              </div>

              <div>
                <label className="text-xs text-gray-300">{lang === "es" ? "Mensaje (opcional)" : "Message (optional)"}</label>
                <textarea
                  value={data.message}
                  onChange={(e) => update("message", clamp(e.target.value, 800))}
                  className="mt-1 w-full min-h-[120px] rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                  placeholder={lang === "es" ? "¿Qué quieres lograr? (más llamadas, más mesas, catering…)" : "What do you want to achieve? (more calls, more tables, catering…)"}
                />
              </div>

              <button
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 px-4 py-3 text-sm font-semibold hover:bg-yellow-500/20 transition disabled:opacity-60"
              >
                {submitting ? (lang === "es" ? "Preparando…" : "Preparing…") : (lang === "es" ? "Continuar" : "Continue")}
              </button>

              <div className="text-xs text-gray-400">
                {lang === "es"
                  ? "Al continuar, se genera un correo listo con tu información. No se publica nada sin verificación."
                  : "Continuing generates a ready-to-send email with your info. Nothing is published without verification."}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
