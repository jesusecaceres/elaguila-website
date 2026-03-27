"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const COPY = {
  es: {
    title: "Contactar por correo",
    listing: "Anuncio",
    seller: "Vendedor",
    namePh: "Tu nombre",
    emailPh: "Tu correo (opcional)",
    messagePh: "Mensaje",
    sendLeonix: "Enviar por Leonix",
    openGmail: "Abrir Gmail",
    openYahoo: "Abrir Yahoo",
    defaultMail: "Usar correo predeterminado",
    copyEmail: "Copiar email",
    cancel: "Cerrar",
    loginHint: "Inicia sesión para enviar tu consulta por Leonix.",
    selfBlock: "No puedes enviarte un mensaje a ti mismo en esta vista.",
    sending: "Enviando…",
    sentOk: "Mensaje enviado.",
    sendErr: "No se pudo enviar. Inténtalo de nuevo.",
    copyOk: "Correo copiado",
    subj: "Interés en tu anuncio Leonix",
    defaultMsg: () => "Hola, me interesa tu anuncio. ¿Sigue disponible?",
  },
  en: {
    title: "Email contact",
    listing: "Listing",
    seller: "Seller",
    namePh: "Your name",
    emailPh: "Your email (optional)",
    messagePh: "Message",
    sendLeonix: "Send via Leonix",
    openGmail: "Open Gmail",
    openYahoo: "Open Yahoo",
    defaultMail: "Use default mail app",
    copyEmail: "Copy email",
    cancel: "Close",
    loginHint: "Sign in to send your inquiry through Leonix.",
    selfBlock: "You can’t send a message to yourself in this view.",
    sending: "Sending…",
    sentOk: "Message sent.",
    sendErr: "Could not send. Please try again.",
    copyOk: "Email copied",
    subj: "Question about your Leonix listing",
    defaultMsg: () => "Hi — I'm interested in your listing. Is it still available?",
  },
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  lang: "es" | "en";
  sellerName: string;
  sellerEmail: string;
  listingTitle: string;
};

function btnRowClass() {
  return "flex w-full min-h-[44px] items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#E8E8E8] sm:py-2.5";
}

export function EnVentaCorreoModal({ open, onClose, lang, sellerName, sellerEmail, listingTitle }: Props) {
  const t = COPY[lang];
  const emailAddr = sellerEmail.trim();

  const defaultBody = useMemo(() => t.defaultMsg(), [t]);

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [message, setMessage] = useState(defaultBody);
  const [leonixErr, setLeonixErr] = useState<string | null>(null);
  const [leonixOk, setLeonixOk] = useState(false);
  const [leonixSending, setLeonixSending] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [selfInquiry, setSelfInquiry] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMessage(defaultBody);
    setLeonixErr(null);
    setLeonixOk(false);
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setHasSession(!!user);
        const u = user?.email?.trim().toLowerCase() ?? "";
        const se = emailAddr.trim().toLowerCase();
        setSelfInquiry(Boolean(u && se && u === se));
        if (user?.email) {
          setBuyerEmail((prev) => prev || user.email || "");
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
          setSelfInquiry(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, defaultBody, emailAddr]);

  const subj = lang === "es" ? COPY.es.subj : COPY.en.subj;

  const mailtoUrl = useMemo(() => {
    const sub = encodeURIComponent(subj);
    const body = encodeURIComponent(message);
    return `mailto:${encodeURIComponent(emailAddr)}?subject=${sub}&body=${body}`;
  }, [emailAddr, message, subj]);

  const gmailUrl = useMemo(() => {
    const sub = encodeURIComponent(subj);
    const body = encodeURIComponent(message);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddr)}&su=${sub}&body=${body}`;
  }, [emailAddr, message, subj]);

  const yahooUrl = useMemo(() => {
    const sub = encodeURIComponent(subj);
    const body = encodeURIComponent(message);
    return `https://compose.mail.yahoo.com/?to=${encodeURIComponent(emailAddr)}&subject=${sub}&body=${body}`;
  }, [emailAddr, message, subj]);

  const copySellerEmail = useCallback(() => {
    if (typeof navigator !== "undefined" && emailAddr && navigator.clipboard) {
      void navigator.clipboard.writeText(emailAddr);
    }
    onClose();
  }, [emailAddr, onClose]);

  const sendLeonix = useCallback(async () => {
    if (selfInquiry) {
      setLeonixErr(t.selfBlock);
      return;
    }
    setLeonixErr(null);
    setLeonixOk(false);
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLeonixErr(t.loginHint);
      return;
    }
    const msg = message.trim();
    if (!msg) return;

    setLeonixSending(true);
    try {
      const res = await fetch("/api/clasificados/en-venta/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sellerEmail: emailAddr,
          message: msg,
          listingTitle,
          buyerName: buyerName.trim() || undefined,
          buyerEmail: buyerEmail.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setLeonixErr(data.error ?? t.sendErr);
        return;
      }
      setLeonixOk(true);
      window.setTimeout(() => {
        setLeonixOk(false);
        onClose();
      }, 1200);
    } catch {
      setLeonixErr(t.sendErr);
    } finally {
      setLeonixSending(false);
    }
  }, [buyerEmail, buyerName, emailAddr, listingTitle, message, onClose, selfInquiry, t]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="en-venta-correo-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 pb-safe shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="en-venta-correo-title" className="text-base font-bold text-[#1E1810] pb-2 border-b border-[#E8DFD0]/90">
          {t.title}
        </h2>
        <p className="mt-2 text-xs font-semibold text-[#7A7164]">
          {t.listing}: <span className="text-[#3D3428]">{listingTitle.trim() || "—"}</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-[#7A7164]">
          {t.seller}: <span className="text-[#3D3428]">{sellerName}</span>
        </p>

        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            placeholder={t.namePh}
            className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/70"
            autoComplete="name"
          />
          <input
            type="email"
            value={buyerEmail}
            onChange={(e) => setBuyerEmail(e.target.value)}
            placeholder={t.emailPh}
            className="w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/70"
            autoComplete="email"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePh}
            rows={4}
            className="w-full resize-y rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/70 min-h-[100px]"
          />
        </div>

        {leonixErr ? <p className="mt-2 text-xs font-medium text-red-700">{leonixErr}</p> : null}
        {leonixOk ? <p className="mt-2 text-xs font-medium text-[#2d6a4f]">{t.sentOk}</p> : null}

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={leonixSending || !message.trim() || selfInquiry}
            onClick={() => void sendLeonix()}
            className="flex w-full min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-bold text-[#1E1810] shadow-md disabled:opacity-50"
          >
            {leonixSending ? t.sending : t.sendLeonix}
          </button>
          {selfInquiry ? <p className="text-xs text-[#7A7164]">{t.selfBlock}</p> : null}
          {hasSession === false ? <p className="text-xs text-[#7A7164]">{t.loginHint}</p> : null}

          <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={onClose} className={btnRowClass()}>
            {t.openGmail}
          </a>
          <a href={yahooUrl} target="_blank" rel="noopener noreferrer" onClick={onClose} className={btnRowClass()}>
            {t.openYahoo}
          </a>
          <a href={mailtoUrl} onClick={onClose} className={`${btnRowClass()} text-[#3D3428]/90`}>
            {t.defaultMail}
          </a>
          <button type="button" onClick={copySellerEmail} className={`${btnRowClass()} text-left`}>
            {t.copyEmail}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-[#E8DFD0] py-3 text-sm font-medium text-[#3D3428] hover:bg-white/80 min-h-[44px]"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
