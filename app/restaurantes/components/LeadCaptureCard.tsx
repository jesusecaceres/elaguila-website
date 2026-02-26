'use client';

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function getLang(sp: ReturnType<typeof useSearchParams> | null): "es" | "en" {
  const v = sp?.get("lang");
  return v === "en" ? "en" : "es";
}

function normalizePhoneForSms(phone: string): string {
  // Keep digits and leading +
  const p = String(phone || "").trim();
  return p.replace(/[^0-9+]/g, "");
}

function buildEmailBody(args: { restaurantName: string; name: string; phone: string; message: string; lang: "es" | "en" }) {
  const { restaurantName, name, phone, message, lang } = args;

  if (lang === "en") {
    return [
      `Restaurant: ${restaurantName}`,
      `Name: ${name || "-"}`,
      `Phone: ${phone || "-"}`,
      "",
      message || "Hi! I’d like more info."
    ].join("\n");
  }

  return [
    `Restaurante: ${restaurantName}`,
    `Nombre: ${name || "-"}`,
    `Tel: ${phone || "-"}`,
    "",
    message || "Hola! Quiero más información."
  ].join("\n");
}

function buildSmsBody(args: { restaurantName: string; name: string; phone: string; message: string; lang: "es" | "en" }) {
  const { restaurantName, name, phone, message, lang } = args;
  if (lang === "en") {
    return `Restaurant: ${restaurantName}. Name: ${name || "-"}. Phone: ${phone || "-"}. ${message || "Hi! I’d like more info."}`;
  }
  return `Restaurante: ${restaurantName}. Nombre: ${name || "-"}. Tel: ${phone || "-"}. ${message || "Hola! Quiero más información."}`;
}

export default function LeadCaptureCard(props: { restaurantName: string; email?: string | null; phone?: string | null }) {
  const sp = useSearchParams();
  const lang = getLang(sp);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const emailHref = useMemo(() => {
    const to = String(props.email || "").trim();
    if (!to) return "";
    const subject = lang === "en" ? `Info request: ${props.restaurantName}` : `Solicitud de info: ${props.restaurantName}`;
    const body = buildEmailBody({ restaurantName: props.restaurantName, name, phone, message, lang });
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [props.email, props.restaurantName, name, phone, message, lang]);

  const smsHref = useMemo(() => {
    const to = normalizePhoneForSms(String(props.phone || ""));
    if (!to) return "";
    const body = buildSmsBody({ restaurantName: props.restaurantName, name, phone, message, lang });
    // iOS supports sms:&body= ; Android varies but generally works.
    return `sms:${encodeURIComponent(to)}?&body=${encodeURIComponent(body)}`;
  }, [props.phone, props.restaurantName, name, phone, message, lang]);

  const canCopy = useMemo(() => typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function", []);

  async function onCopy() {
    try {
      const text = buildSmsBody({ restaurantName: props.restaurantName, name, phone, message, lang });
      await navigator.clipboard.writeText(text);
      // minimal feedback without toasts to keep deps zero
      alert(lang === "en" ? "Copied." : "Copiado.");
    } catch {
      alert(lang === "en" ? "Could not copy." : "No se pudo copiar.");
    }
  }

  async function onShare() {
    try {
      const text = buildSmsBody({ restaurantName: props.restaurantName, name, phone, message, lang });
      const nav: any = typeof navigator !== "undefined" ? navigator : null;
      if (nav?.share) {
        await nav.share({
          title: lang === "en" ? "Restaurant request" : "Solicitud al restaurante",
          text
        });
      } else {
        if (canCopy) await navigator.clipboard.writeText(text);
        alert(lang === "en" ? "Copied." : "Copiado.");
      }
    } catch {
      // ignore share cancel
    }
  }

  const title = lang === "en" ? "Request info" : "Pedir información";
  const subtitle =
    lang === "en"
      ? "Send a quick message. Mobile-friendly."
      : "Manda un mensaje rápido. Ideal en el teléfono.";

  const btnEmail = lang === "en" ? "Email" : "Correo";
  const btnSms = lang === "en" ? "Text" : "Texto";
  const btnCopy = lang === "en" ? "Copy" : "Copiar";
  const btnShare = lang === "en" ? "Share" : "Compartir";

  return (
    <div className="mt-6 bg-black/30 border border-white/10 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-yellow-300 font-semibold">{title}</div>
          <div className="text-sm text-gray-300 mt-1">{subtitle}</div>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="shrink-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100 text-sm"
        >
          {btnShare}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={lang === "en" ? "Your name (optional)" : "Tu nombre (opcional)"}
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={lang === "en" ? "Your phone (optional)" : "Tu teléfono (opcional)"}
          inputMode="tel"
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={lang === "en" ? "Message" : "Mensaje"}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {emailHref ? (
          <a
            href={emailHref}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 hover:bg-yellow-500/25 text-yellow-100 text-sm"
          >
            {btnEmail}
          </a>
        ) : null}

        {smsHref ? (
          <a
            href={smsHref}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100 text-sm"
          >
            {btnSms}
          </a>
        ) : null}

        {canCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100 text-sm"
          >
            {btnCopy}
          </button>
        ) : null}
      </div>

      {!emailHref && !smsHref ? (
        <div className="mt-3 text-sm text-gray-400">
          {lang === "en" ? "Contact info not available yet." : "Aún no hay contacto disponible."}
        </div>
      ) : null}
    </div>
  );
}
