"use client";

import { useState, type FormEvent } from "react";
import type { Lang } from "../types/tienda";
import { LEONIX_TIENDA_EMAIL } from "../data/leonixContact";

const INQUIRY_OPTIONS: { value: string; es: string; en: string }[] = [
  { value: "specialty_product", es: "Producto especial / acabado distinto", en: "Specialty product / different finish" },
  { value: "custom_order", es: "Pedido personalizado", en: "Custom order" },
  { value: "rep_catalog", es: "Catálogo con asistencia / cotización", en: "Rep-assisted catalog / quote" },
  { value: "tienda_help", es: "Ayuda con la Tienda (configurador, archivos)", en: "Tienda help (configurator, files)" },
  { value: "general_tienda", es: "Pregunta general sobre Tienda", en: "General Tienda question" },
];

export function TiendaContactForm(props: { lang: Lang }) {
  const { lang } = props;
  const en = lang === "en";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("general_tienda");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
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
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? (en ? "Could not send. Try calling the office." : "No se pudo enviar. Intenta llamar a la oficina."));
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setInquiryType("general_tienda");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg(en ? "Network error. Please try again or call us." : "Error de red. Intenta de nuevo o llámanos.");
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.35)] p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-[rgba(255,247,226,0.96)]">
        {en ? "Send us a note" : "Escríbenos"}
      </h2>
      <p className="mt-2 text-sm text-[rgba(255,255,255,0.62)] leading-relaxed">
        {en
          ? `This form delivers to ${LEONIX_TIENDA_EMAIL}. For fastest help, visit or call us — email may take longer.`
          : `Este formulario llega a ${LEONIX_TIENDA_EMAIL}. Para ayuda más rápida, visita o llámanos — el correo puede tardar más.`}
      </p>

      {status === "success" ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-[rgba(201,168,74,0.45)] bg-[rgba(201,168,74,0.12)] px-4 py-4 text-sm text-[rgba(255,247,226,0.95)]"
        >
          <p>
            {en
              ? "Received — we’ll follow up. If it’s urgent, call the office."
              : "Recibido — te contactaremos. Si es urgente, llama a la oficina."}
          </p>
          <button
            type="button"
            onClick={() => setStatus("idle")}
            className="mt-3 text-sm font-medium text-[rgba(201,168,74,0.95)] underline"
          >
            {en ? "Send another message" : "Enviar otro mensaje"}
          </button>
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={(ev) => void onSubmit(ev)}>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[rgba(201,168,74,0.85)]">
              {en ? "Topic" : "Tema"}
            </label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.45)] px-4 py-3 text-sm text-white"
            >
              {INQUIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {en ? o.en : o.es}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.75)]">{en ? "Full name" : "Nombre completo"}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="mt-1.5 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.45)] px-4 py-3 text-sm text-white placeholder:text-white/40"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.75)]">{en ? "Email" : "Correo"}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.45)] px-4 py-3 text-sm text-white placeholder:text-white/40"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.75)]">
              {en ? "Phone (recommended)" : "Teléfono (recomendado)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.45)] px-4 py-3 text-sm text-white placeholder:text-white/40"
              placeholder={en ? "Best number to reach you" : "Mejor número para localizarte"}
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[rgba(255,255,255,0.75)]">{en ? "Message" : "Mensaje"}</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={12000}
              className="mt-1.5 w-full rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.45)] px-4 py-3 text-sm text-white placeholder:text-white/40"
            />
          </div>

          {status === "error" && errorMsg ? (
            <div role="alert" className="rounded-xl border border-rose-400/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className={[
              "w-full rounded-full py-3.5 text-sm font-semibold transition shadow-[0_14px_40px_rgba(201,168,74,0.22)]",
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
