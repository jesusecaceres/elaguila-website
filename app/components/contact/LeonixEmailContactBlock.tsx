"use client";

import { useCallback, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { tryWebShare } from "@/app/components/cta/ctaLaunchers";

export type LeonixEmailContactLang = "es" | "en";

const LABELS = {
  es: {
    openEmail: "Abrir correo",
    shareApps: "Compartir con apps",
    copied: "Copiado",
    copyAria: "Copiar correo",
  },
  en: {
    openEmail: "Open email",
    shareApps: "Share with apps",
    copied: "Copied",
    copyAria: "Copy email",
  },
} as const;

const ACTION_BTN =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)] hover:bg-[color:var(--lx-section)] active:scale-[0.99]";

function CopyEmailChip({ email, lang }: { email: string; lang: LeonixEmailContactLang }) {
  const [copied, setCopied] = useState(false);
  const t = LABELS[lang];

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }, [email]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[color:var(--lx-text-2)] transition hover:bg-black/[0.05] hover:text-[color:var(--lx-text)]"
      aria-label={t.copyAria}
      title={copied ? t.copied : t.copyAria}
    >
      {copied ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <FiCopy className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}

export type LeonixEmailContactBlockProps = {
  email: string;
  mailtoHref: string;
  lang: LeonixEmailContactLang;
  shareTitle?: string;
  shareText?: string;
  className?: string;
  /** When false, only render action buttons (no visible email row). Default true. */
  showEmail?: boolean;
};

export function LeonixEmailContactBlock({
  email,
  mailtoHref,
  lang,
  shareTitle,
  shareText,
  className = "",
  showEmail = true,
}: LeonixEmailContactBlockProps) {
  const t = LABELS[lang];
  const [shareHint, setShareHint] = useState<string | null>(null);

  const em = email.trim();
  if (!em) return null;

  const onShare = useCallback(async () => {
    const textParts = [shareText?.trim(), em].filter(Boolean);
    const payload = {
      title: shareTitle?.trim() || (lang === "en" ? "Leonix contact" : "Contacto Leonix"),
      text: textParts.join("\n"),
    };
    const result = await tryWebShare(payload);
    if (result === "shared" || result === "aborted") {
      setShareHint(null);
      return;
    }
    try {
      await navigator.clipboard.writeText(em);
      setShareHint(t.copied);
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint(null);
    }
  }, [em, lang, shareText, shareTitle, t.copied]);

  return (
    <div className={className}>
      {showEmail ? (
        <p className="flex flex-wrap items-center gap-0.5">
          <span className="font-medium text-[color:var(--lx-blue)] hover:text-[color:var(--lx-text)]">{em}</span>
          <CopyEmailChip email={em} lang={lang} />
        </p>
      ) : null}

      <div className={`flex flex-wrap gap-2 ${showEmail ? "mt-2" : ""}`}>
        <a href={mailtoHref} className={ACTION_BTN}>
          {t.openEmail}
        </a>
        <button type="button" className={ACTION_BTN} onClick={() => void onShare()}>
          {t.shareApps}
        </button>
      </div>

      {shareHint ? (
        <p className="mt-1.5 text-xs font-medium text-[color:var(--lx-text-2)]" aria-live="polite">
          {shareHint}
        </p>
      ) : null}
    </div>
  );
}
