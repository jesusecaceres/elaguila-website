"use client";

import { useCallback, useEffect, useState } from "react";

import { trackClasificadosEvent } from "@/app/lib/clasificadosAnalytics";

type Lang = "es" | "en";

const COPY = {
  es: {
    title: "Correo",
    visibleLabel: "Dirección de correo",
    copy: "Copiar correo",
    copied: "Correo copiado",
    openApp: "Abrir app de correo",
    gmail: "Abrir en Gmail",
    close: "Cerrar",
    clipboardUnavailable: "Si no puedes copiar, anota el correo de arriba.",
  },
  en: {
    title: "Email",
    visibleLabel: "Email address",
    copy: "Copy email",
    copied: "Email copied",
    openApp: "Open email app",
    gmail: "Open in Gmail",
    close: "Close",
    clipboardUnavailable: "If copy is unavailable, note the email address above.",
  },
} as const;

function isProbablySafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function gmailComposeUrl(to: string, subject: string): string {
  const q = new URLSearchParams();
  q.set("view", "cm");
  q.set("fs", "1");
  q.set("to", to.trim());
  if (subject.trim()) q.set("su", subject.trim());
  return `https://mail.google.com/mail/?${q.toString()}`;
}

export type EmailContactOptionsSheetProps = {
  open: boolean;
  onClose: () => void;
  email: string;
  lang: Lang;
  mailtoHref: string;
  mailtoSubject?: string;
  listingId?: string | null;
  listingCategory?: string | null;
  ownerUserId?: string | null;
};

export function EmailContactOptionsSheet({
  open,
  onClose,
  email,
  lang,
  mailtoHref,
  mailtoSubject = "",
  listingId,
  listingCategory,
  ownerUserId,
}: EmailContactOptionsSheetProps) {
  const t = COPY[lang];
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setHint(null);
  }, [open]);

  const track = useCallback(
    async (action: "email_open_app" | "email_copy" | "email_gmail_open") => {
      const id = (listingId ?? "").trim();
      if (!id) return;
      await trackClasificadosEvent({
        listing_id: id,
        category: listingCategory ?? undefined,
        event_type: "cta_click",
        event_source: "detail",
        owner_user_id: ownerUserId ?? null,
        metadata: { action },
      });
    },
    [listingId, listingCategory, ownerUserId],
  );

  const onCopy = useCallback(async () => {
    const em = email.trim();
    if (!em) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(em);
        setHint(t.copied);
        void track("email_copy");
      } else {
        setHint(t.clipboardUnavailable);
      }
    } catch {
      setHint(t.clipboardUnavailable);
    }
  }, [email, t, track]);

  if (!open) return null;

  const em = email.trim();
  const gmailHref = isProbablySafeEmail(em) ? gmailComposeUrl(em, mailtoSubject) : null;

  const btn =
    "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition border border-black/15 bg-white text-[#111111] hover:bg-[#F5F5F5]";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lx-email-sheet-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-[#FCF9F2] p-5 text-[#333333] shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="lx-email-sheet-title" className="text-lg font-bold">
            {t.title}
          </h2>
          <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold hover:bg-black/5" onClick={onClose}>
            {t.close}
          </button>
        </div>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#5C564E]">{t.visibleLabel}</p>
        <p className="mt-1 break-all text-sm font-mono text-[#111111]">{em}</p>

        <div className="mt-4 flex flex-col gap-2">
          <a
            href={mailtoHref}
            className={btn}
            style={{ backgroundColor: "#E67E22", color: "#FFFCF7", borderColor: "transparent" }}
            onClick={() => {
              void track("email_open_app");
            }}
          >
            {t.openApp}
          </a>
          <button type="button" className={btn} onClick={() => void onCopy()}>
            {t.copy}
          </button>
          {gmailHref ? (
            <a
              href={gmailHref}
              target="_blank"
              rel="noopener noreferrer"
              className={btn}
              onClick={() => {
                void track("email_gmail_open");
              }}
            >
              {t.gmail}
            </a>
          ) : null}
        </div>
        {hint ? <p className="mt-3 text-sm font-medium text-emerald-900">{hint}</p> : null}
      </div>
    </div>
  );
}
