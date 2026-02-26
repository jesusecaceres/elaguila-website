"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import PageHero from "../../components/PageHero";

type BusinessType = "brick" | "truck" | "popup" | "stand";

type FormState = {
  businessType: BusinessType;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  city: string;

  // Brick & mortar
  address: string;
  googleMapsUrl: string;
  hoursNote: string;

  // Truck / pop-up / stand
  scheduleNote: string; // days/times
  locationNote: string; // where you park / events / rotation

  cuisine: string;
  website: string;
  instagram: string;
  facebook: string;

  // Upsells / eligibility hints
  interestedInVideo: "yes" | "no";
  message: string;
};

function clamp(s: string, max: number) {
  const v = (s || "").trim();
  return v.length > max ? v.slice(0, max) : v;
}

function buildEmailBody(data: FormState, args: { lang: "es" | "en"; plan: "lite" | "premium" }) {
  const { lang, plan } = args;
  const isEs = lang === "es";
  const typeLabel =
    data.businessType === "brick"
      ? isEs ? "Local (brick & mortar)" : "Brick & mortar"
      : data.businessType === "truck"
        ? isEs ? "Food truck" : "Food truck"
        : data.businessType === "popup"
          ? isEs ? "Pop-up" : "Pop-up"
          : isEs ? "Puesto / taco stand" : "Stand / taco stand";

  const lines: string[] = [
    isEs ? "SOLICITUD — RESTAURANTES (LEONIX)" : "REQUEST — RESTAURANTS (LEONIX)",
    "",
    `${isEs ? "Plan seleccionado" : "Selected plan"}: ${plan === "premium" ? "Business Premium" : "Business Lite"}`,
    `${isEs ? "Tipo" : "Type"}: ${typeLabel}`,
    "",
    `${isEs ? "Restaurante" : "Restaurant"}: ${data.businessName}`,
    `${isEs ? "Contacto" : "Contact"}: ${data.contactName}`,
    `${isEs ? "Teléfono" : "Phone"}: ${data.phone || "-"}`,
    `${isEs ? "Correo" : "Email"}: ${data.email || "-"}`,
    `${isEs ? "Ciudad" : "City"}: ${data.city}`,
    `${isEs ? "Cocina" : "Cuisine"}: ${data.cuisine || "-"}`,
    `${isEs ? "Website" : "Website"}: ${data.website || "-"}`,
    `${isEs ? "Instagram" : "Instagram"}: ${data.instagram || "-"}`,
    `${isEs ? "Facebook" : "Facebook"}: ${data.facebook || "-"}`,
  ];

  if (data.businessType === "brick") {
    lines.push(
      "",
      `${isEs ? "Dirección" : "Address"}: ${data.address || "-"}`,
      `${isEs ? "Google Maps" : "Google Maps"}: ${data.googleMapsUrl || "-"}`,
      `${isEs ? "Horario" : "Hours"}: ${data.hoursNote || "-"}`
    );
  } else {
    lines.push(
      "",
      `${isEs ? "Horario / días" : "Schedule / days"}: ${data.scheduleNote || "-"}`,
      `${isEs ? "Zonas / ubicaciones" : "Areas / locations"}: ${data.locationNote || "-"}`
    );
  }

  lines.push(
    "",
    `${isEs ? "Interesado en video" : "Interested in video"}: ${data.interestedInVideo === "yes" ? (isEs ? "Sí" : "Yes") : (isEs ? "No" : "No")}`,
    "",
    isEs ? "Mensaje:" : "Message:",
    data.message || "-"
  );

  return lines.join("\n");
}

export default function RestaurantBusinessFormPage() {
  const sp = useSearchParams();
  const lang: "es" | "en" = sp?.get("lang") === "en" ? "en" : "es";
  const plan: "lite" | "premium" = sp?.get("plan") === "premium" ? "premium" : "lite";

  const packagesHref = `/restaurantes/planes?lang=${lang}`;
  const backHref = `/restaurantes?lang=${lang}`;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<FormState>({
    businessType: "brick",
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    googleMapsUrl: "",
    hoursNote: "",
    scheduleNote: "",
    locationNote: "",
    cuisine: "",
    website: "",
    instagram: "",
    facebook: "",
    interestedInVideo: "no",
    message: "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const mailTo = useMemo(() => {
    const to = "chuy@leonixmedia.com";
    const subject =
      lang === "es"
        ? "Solicitud: Publicar restaurante en LEONIX"
        : "Request: List my restaurant on LEONIX";

    const body = buildEmailBody(data, { lang, plan });
    const params = new URLSearchParams({ subject, body });
    return `mailto:${to}?${params.toString()}`;
  }, [data, lang, plan]);

  function validate(): string | null {
    if (!data.businessName.trim()) return lang === "es" ? "Falta el nombre del restaurante." : "Restaurant name is required.";
    if (!data.contactName.trim()) return lang === "es" ? "Falta el nombre de contacto." : "Contact name is required.";
    if (!data.phone.trim() && !data.email.trim())
      return lang === "es" ? "Agrega teléfono o correo." : "Add a phone number or email.";
    if (!data.city.trim()) return lang === "es" ? "Falta la ciudad." : "City is required.";

    if (data.businessType === "brick") {
      if (!data.address.trim() && !data.googleMapsUrl.trim()) {
        return lang === "es"
          ? "Agrega dirección o enlace de Google Maps."
          : "Add an address or a Google Maps link.";
      }
    } else {
      if (!data.scheduleNote.trim()) {
        return lang === "es"
          ? "Agrega tu horario / días típicos."
          : "Add your typical schedule / days.";
      }
      if (!data.locationNote.trim()) {
        return lang === "es"
          ? "Agrega dónde te ubicas (zonas, eventos o rotación)."
          : "Add where you operate (areas, events, rotation).";
      }
    }

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
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(buildEmailBody(data, { lang, plan }));
    } catch {
      // ignore
    }
  }

  const typeOptions = [
    { key: "brick" as const, es: "Local / Restaurante", en: "Brick & mortar" },
    { key: "truck" as const, es: "Food truck", en: "Food truck" },
    { key: "popup" as const, es: "Pop-up", en: "Pop-up" },
    { key: "stand" as const, es: "Puesto / taco stand", en: "Stand / taco stand" },
  ];

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

              <div className="mt-3 text-xs text-gray-400">
                {plan === "premium"
                  ? (lang === "es" ? "✅ Premium incluye opción de video (según disponibilidad)." : "✅ Premium includes a video option (based on availability).")
                  : (lang === "es" ? "ℹ️ Video está disponible con Premium." : "ℹ️ Video is available with Premium.")}
                <span className="ml-2">
                  <Link href={packagesHref} className="underline underline-offset-4 text-gray-200 hover:text-white">
                    {lang === "es" ? "Ver planes" : "View plans"}
                  </Link>
                </span>
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
                  className="inline-flex items-center justify-center rounded-xl bg-black/40 border border-white/10 text-gray-100 px-4 py-3 text-sm font-semibold hover:border-white/20 transition"
                >
                  {lang === "es" ? "Copiar detalles" : "Copy details"}
                </button>
                <Link
                  href={backHref}
                  className="inline-flex items-center justify-center rounded-xl bg-black/40 border border-white/10 text-gray-100 px-4 py-3 text-sm font-semibold hover:border-white/20 transition"
                >
                  {lang === "es" ? "Volver a Restaurantes" : "Back to Restaurants"}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs text-gray-300">{lang === "es" ? "Tipo de negocio *" : "Business type *"}</label>
                <select
                  value={data.businessType}
                  onChange={(e) => update("businessType", e.target.value as BusinessType)}
                  className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                >
                  {typeOptions.map((o) => (
                    <option key={o.key} value={o.key}>
                      {lang === "es" ? o.es : o.en}
                    </option>
                  ))}
                </select>
              </div>

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
                    placeholder={lang === "es" ? "Tu nombre" : "Your name"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Cocina (opcional)" : "Cuisine (optional)"}</label>
                  <input
                    value={data.cuisine}
                    onChange={(e) => update("cuisine", clamp(e.target.value, 60))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: Mexicana, Pupusas…" : "Ex: Mexican, Pupusas…"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Teléfono" : "Phone"}</label>
                  <input
                    value={data.phone}
                    onChange={(e) => update("phone", clamp(e.target.value, 40))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: (408) 123-4567" : "Ex: (408) 123-4567"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Correo" : "Email"}</label>
                  <input
                    value={data.email}
                    onChange={(e) => update("email", clamp(e.target.value, 80))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Ej: negocio@email.com" : "Ex: business@email.com"}
                  />
                </div>
              </div>

              {data.businessType === "brick" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-300">{lang === "es" ? "Dirección" : "Address"}</label>
                    <input
                      value={data.address}
                      onChange={(e) => update("address", clamp(e.target.value, 120))}
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                      placeholder={lang === "es" ? "Calle, ciudad" : "Street, city"}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-300">{lang === "es" ? "Enlace Google Maps" : "Google Maps link"}</label>
                      <input
                        value={data.googleMapsUrl}
                        onChange={(e) => update("googleMapsUrl", clamp(e.target.value, 200))}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                        placeholder="https://maps.google.com/..." 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-300">{lang === "es" ? "Horario" : "Hours"}</label>
                      <input
                        value={data.hoursNote}
                        onChange={(e) => update("hoursNote", clamp(e.target.value, 120))}
                        className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                        placeholder={lang === "es" ? "Ej: Lun–Dom 10am–9pm" : "Ex: Mon–Sun 10am–9pm"}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-300">{lang === "es" ? "Horario / días típicos *" : "Typical schedule / days *"}</label>
                    <input
                      value={data.scheduleNote}
                      onChange={(e) => update("scheduleNote", clamp(e.target.value, 140))}
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                      placeholder={lang === "es" ? "Ej: Mar–Dom 6pm–11pm" : "Ex: Tue–Sun 6pm–11pm"}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-300">{lang === "es" ? "Zonas / ubicaciones *" : "Areas / locations *"}</label>
                    <textarea
                      value={data.locationNote}
                      onChange={(e) => update("locationNote", clamp(e.target.value, 300))}
                      className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50 min-h-[90px]"
                      placeholder={lang === "es" ? "Ej: Viernes en Downtown SJ; Sábados en eventos; rotamos por..."
                        : "Ex: Fridays in Downtown SJ; Saturdays at events; rotating..."}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Website (opcional)" : "Website (optional)"}</label>
                  <input
                    value={data.website}
                    onChange={(e) => update("website", clamp(e.target.value, 200))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Instagram (opcional)" : "Instagram (optional)"}</label>
                  <input
                    value={data.instagram}
                    onChange={(e) => update("instagram", clamp(e.target.value, 80))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "@tuinsta" : "@yourinsta"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-300">{lang === "es" ? "Facebook (opcional)" : "Facebook (optional)"}</label>
                  <input
                    value={data.facebook}
                    onChange={(e) => update("facebook", clamp(e.target.value, 120))}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                    placeholder={lang === "es" ? "Página o enlace" : "Page or link"}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300">
                    {lang === "es" ? "¿Interesado en video?" : "Interested in video?"}
                  </label>
                  <select
                    value={data.interestedInVideo}
                    onChange={(e) => update("interestedInVideo", e.target.value as any)}
                    className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
                  >
                    <option value="no">{lang === "es" ? "No" : "No"}</option>
                    <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300">{lang === "es" ? "Mensaje (opcional)" : "Message (optional)"}</label>
                <textarea
                  value={data.message}
                  onChange={(e) => update("message", clamp(e.target.value, 600))}
                  className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50 min-h-[120px]"
                  placeholder={lang === "es" ? "Cuéntanos lo que más quieres lograr (más llamadas, más clientes, especiales, etc.)" : "Tell us what you want most (more calls, more customers, specials, etc.)"}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 px-4 py-3 text-sm font-semibold hover:bg-yellow-500/20 transition disabled:opacity-60"
                >
                  {submitting
                    ? (lang === "es" ? "Preparando..." : "Preparing...")
                    : (lang === "es" ? "Continuar" : "Continue")}
                </button>

                <Link
                  href={packagesHref}
                  className="inline-flex items-center justify-center rounded-xl bg-black/40 border border-white/10 text-gray-100 px-4 py-3 text-sm font-semibold hover:border-white/20 transition"
                >
                  {lang === "es" ? "Ver planes" : "View plans"}
                </Link>
              </div>

              <div className="pt-2 text-xs text-gray-400">
                {lang === "es"
                  ? "En el siguiente paso te preparamos un correo listo para enviar (sin backend aún)."

                  : "Next step generates an email draft to send (no backend yet)."}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
