"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { trackEnVentaMessageIntent } from "@/app/clasificados/en-venta/analytics/enVentaAnalytics";

const COPY = {
  es: {
    title: "Contactar por correo (Leonix)",
    listing: "Anuncio",
    listingId: "ID del anuncio",
    seller: "Vendedor",
    buyerSection: "Tu cuenta (comprador)",
    buyerNameLabel: "Nombre",
    buyerEmailLabel: "Correo",
    sellerSection: "Vendedor (solo lectura)",
    messagePh: "Tu mensaje",
    sendLeonix: "Enviar por Leonix",
    openGmail: "Abrir Gmail",
    openYahoo: "Abrir Yahoo",
    defaultMail: "Usar correo predeterminado",
    copyEmail: "Copiar email",
    cancel: "Cerrar",
    loginHint: "Inicia sesión para enviar tu consulta por Leonix.",
    selfBlock:
      "Estás viendo tu propio anuncio: Leonix no permite enviarte una consulta a ti mismo. Si quieres probar el flujo, usa otra cuenta o abre Gmail, Yahoo o tu correo desde abajo.",
    sending: "Enviando…",
    sentOk: "Mensaje enviado.",
    sendErr: "No se pudo enviar. Inténtalo de nuevo.",
    copyOk: "Correo copiado",
    subj: "Interés en tu anuncio Leonix",
    defaultMsg: () => "Hola, me interesa tu anuncio. ¿Sigue disponible?",
    noPublicId: "— (sin ID público; borrador o vista previa)",
  },
  en: {
    title: "Email contact (Leonix)",
    listing: "Listing",
    listingId: "Listing ID",
    seller: "Seller",
    buyerSection: "Your account (buyer)",
    buyerNameLabel: "Name",
    buyerEmailLabel: "Email",
    sellerSection: "Seller (read-only)",
    messagePh: "Your message",
    sendLeonix: "Send via Leonix",
    openGmail: "Open Gmail",
    openYahoo: "Open Yahoo",
    defaultMail: "Use default mail app",
    copyEmail: "Copy email",
    cancel: "Close",
    loginHint: "Sign in to send your inquiry through Leonix.",
    selfBlock:
      "This is your own listing — Leonix cannot send you an inquiry to yourself. To test the flow, use another account or use Gmail, Yahoo, or default mail below.",
    sending: "Sending…",
    sentOk: "Message sent.",
    sendErr: "Could not send. Please try again.",
    copyOk: "Email copied",
    subj: "Question about your Leonix listing",
    defaultMsg: () => "Hi — I'm interested in your listing. Is it still available?",
    noPublicId: "— (no public ID; draft or preview)",
  },
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  lang: "es" | "en";
  sellerName: string;
  sellerEmail: string;
  listingTitle: string;
  /** Published listing UUID when known (strongest server routing). */
  listingId?: string | null;
  /** Seller auth user id when known (e.g. seller’s session matches draft email). */
  sellerOwnerId?: string | null;
  /** Human-readable listing id for display (UUID or preview token). */
  listingIdDisplay?: string | null;
  /** Defaults to En Venta route; Rentas uses the same handler once it accepts `rentas` listings. */
  inquiryApiPath?: string;
  /** When set, called after successful Leonix send instead of `trackEnVentaMessageIntent`. */
  onMessageSentAnalytics?: (listingId: string | null, userId: string | null) => void;
};

function btnRowClass() {
  return "flex w-full min-h-[44px] items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#E8E8E8] sm:py-2.5";
}

function normEmail(e: string): string {
  return e.trim().toLowerCase();
}

function readOnlyFieldClass() {
  return "w-full cursor-not-allowed rounded-xl border border-[#E8DFD0] bg-[#EFEAE0] px-3 py-2 text-sm text-[#1E1810]/90";
}

export function EnVentaCorreoModal({
  open,
  onClose,
  lang,
  sellerName,
  sellerEmail,
  listingTitle,
  listingId = null,
  sellerOwnerId = null,
  listingIdDisplay = null,
  inquiryApiPath = "/api/clasificados/en-venta/inquiry",
  onMessageSentAnalytics,
}: Props) {
  const t = COPY[lang];
  const emailAddr = sellerEmail.trim();

  const defaultBody = useMemo(() => t.defaultMsg(), [t]);

  const [message, setMessage] = useState(defaultBody);
  const [leonixErr, setLeonixErr] = useState<string | null>(null);
  const [leonixOk, setLeonixOk] = useState(false);
  const [leonixSending, setLeonixSending] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [selfInquiry, setSelfInquiry] = useState(false);
  const [lockedBuyerName, setLockedBuyerName] = useState("");
  const [lockedBuyerEmail, setLockedBuyerEmail] = useState("");
  const openGenerationRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    const gen = ++openGenerationRef.current;

    setMessage(defaultBody);
    setLeonixErr(null);
    setLeonixOk(false);
    setLeonixSending(false);
    setHasSession(null);
    setSelfInquiry(false);
    setLockedBuyerName("");
    setLockedBuyerEmail("");

    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || gen !== openGenerationRef.current) return;

        const uid = user?.id ?? null;
        const sessionEmail = user?.email?.trim() ?? "";
        setHasSession(!!user);

        let displayName = "";
        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("id", user.id)
            .maybeSingle();
          if (cancelled || gen !== openGenerationRef.current) return;
          const row = profile as { display_name?: string | null; email?: string | null } | null;
          const meta = user.user_metadata as Record<string, unknown> | undefined;
          const fromMeta =
            (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
            (typeof meta?.name === "string" && meta.name.trim()) ||
            "";
          displayName =
            (row?.display_name?.trim() || "").trim() ||
            fromMeta ||
            (sessionEmail ? sessionEmail.split("@")[0] : "");
        }
        setLockedBuyerEmail(sessionEmail);
        setLockedBuyerName(displayName);

        const se = normEmail(emailAddr);
        const ue = normEmail(sessionEmail);
        const ownerId = sellerOwnerId?.trim() || null;
        const isSelf =
          Boolean(uid && ownerId && uid === ownerId) || Boolean(ue && se && ue === se);
        setSelfInquiry(isSelf);
      } catch {
        if (!cancelled && gen === openGenerationRef.current) {
          setHasSession(false);
          setLockedBuyerName("");
          setLockedBuyerEmail("");
          setSelfInquiry(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, defaultBody, emailAddr, sellerOwnerId]);

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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLeonixErr(t.loginHint);
      return;
    }
    const msg = message.trim();
    if (!msg) return;

    const gen = openGenerationRef.current;
    setLeonixSending(true);
    try {
      const res = await fetch(inquiryApiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sellerEmail: emailAddr,
          message: msg,
          listingTitle,
          buyerName: lockedBuyerName.trim() || undefined,
          buyerEmail: lockedBuyerEmail.trim() || undefined,
          listingId: listingId?.trim() || undefined,
          sellerOwnerId: sellerOwnerId?.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (gen !== openGenerationRef.current) return;
      if (!res.ok) {
        setLeonixErr(data.error ?? t.sendErr);
        return;
      }
      const uid = session.user?.id ?? null;
      const lid = listingId?.trim() || null;
      if (onMessageSentAnalytics) {
        onMessageSentAnalytics(lid, uid);
      } else if (lid) {
        trackEnVentaMessageIntent(lid, uid);
      }
      setLeonixOk(true);
      window.setTimeout(() => {
        setLeonixOk(false);
        onClose();
      }, 1200);
    } catch {
      if (gen === openGenerationRef.current) {
        setLeonixErr(t.sendErr);
      }
    } finally {
      if (gen === openGenerationRef.current) {
        setLeonixSending(false);
      }
    }
  }, [
    emailAddr,
    listingId,
    listingTitle,
    lockedBuyerEmail,
    lockedBuyerName,
    message,
    onClose,
    selfInquiry,
    sellerOwnerId,
    inquiryApiPath,
    onMessageSentAnalytics,
    t,
  ]);

  const sendBlocked =
    leonixSending ||
    !message.trim() ||
    selfInquiry ||
    hasSession === false ||
    hasSession === null;

  const idLine =
    listingIdDisplay?.trim() ||
    (listingId?.trim() && /^[0-9a-f-]{36}$/i.test(listingId.trim()) ? listingId.trim() : null) ||
    t.noPublicId;

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
          {t.listingId}: <span className="font-mono text-[11px] text-[#3D3428]">{idLine}</span>
        </p>

        <div className="mt-4 rounded-xl border border-[#E8DFD0]/90 bg-white/60 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.sellerSection}</p>
          <p className="mt-1 text-sm font-semibold text-[#1E1810]">{sellerName}</p>
          <p className="mt-0.5 font-mono text-[11px] text-[#5C5346]">{emailAddr || "—"}</p>
        </div>

        <div className="mt-4 rounded-xl border border-[#E8DFD0]/90 bg-[#FAF7F2]/80 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{t.buyerSection}</p>
          <label className="mt-2 block">
            <span className="text-[11px] font-semibold text-[#7A7164]">{t.buyerNameLabel}</span>
            <input type="text" readOnly value={lockedBuyerName} className={`${readOnlyFieldClass()} mt-1`} tabIndex={-1} />
          </label>
          <label className="mt-2 block">
            <span className="text-[11px] font-semibold text-[#7A7164]">{t.buyerEmailLabel}</span>
            <input type="email" readOnly value={lockedBuyerEmail} className={`${readOnlyFieldClass()} mt-1`} tabIndex={-1} />
          </label>
        </div>

        <div className="mt-3">
          <label className="text-[11px] font-semibold text-[#7A7164]">{t.messagePh}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePh}
            rows={4}
            className="mt-1 w-full resize-y rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/70 min-h-[100px]"
          />
        </div>

        {leonixErr ? <p className="mt-2 text-xs font-medium text-red-700">{leonixErr}</p> : null}
        {leonixOk ? <p className="mt-2 text-xs font-medium text-[#2d6a4f]">{t.sentOk}</p> : null}

        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={sendBlocked}
            onClick={() => void sendLeonix()}
            className="flex w-full min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-bold text-[#1E1810] shadow-md disabled:opacity-50"
          >
            {leonixSending ? t.sending : t.sendLeonix}
          </button>
          {selfInquiry ? <p className="text-xs font-medium leading-snug text-[#5C5346]">{t.selfBlock}</p> : null}
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
