"use client";

import { useCallback, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { tryWebShare } from "@/app/components/cta/ctaLaunchers";
import { getPublicLocaleCopy, type PublicFormLang } from "@/app/lib/leonix/publicFormCopy";

export type LeonixEmailContactLang = PublicFormLang;

function emailLabels(lang: PublicFormLang) {
  return getPublicLocaleCopy(lang).emailBlock;
}

const ACTION_BTN =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)] hover:bg-[color:var(--lx-section)] active:scale-[0.99]";

/** Small two-square copy control — clipboard only, not share sheet. */
export function EmailCopyIconButton({
  email,
  lang,
  className = "",
}: {
  email: string;
  lang: LeonixEmailContactLang;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = emailLabels(lang);
  const em = email.trim();
  if (!em) return null;

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(em);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* silent */
    }
  }, [em]);

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[color:var(--lx-text-2)] transition hover:bg-black/[0.05] hover:text-[color:var(--lx-text)] ${className}`}
      aria-label={t.copyAria}
      title={copied ? t.copied : t.copyAria}
    >
      {copied ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <FiCopy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

/** Inline visible email + copy icon (no mailto on the address). */
export function VisibleEmailWithCopy({
  email,
  lang,
  className = "",
}: {
  email: string;
  lang: LeonixEmailContactLang;
  className?: string;
}) {
  const em = email.trim();
  if (!em) return null;
  return (
    <span className={`inline-flex max-w-full items-center gap-0.5 align-baseline ${className}`}>
      <span className="break-all font-medium">{em}</span>
      <EmailCopyIconButton email={em} lang={lang} />
    </span>
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
  const t = emailLabels(lang);

  const em = email.trim();
  if (!em) return null;

  const onShare = useCallback(async () => {
    const textParts = [shareText?.trim(), em].filter(Boolean);
    const payload = {
      title: shareTitle?.trim() || (lang === "es" ? "Contacto Leonix" : "Leonix contact"),
      text: textParts.join("\n"),
    };
    await tryWebShare(payload);
  }, [em, lang, shareText, shareTitle]);

  return (
    <div className={className}>
      {showEmail ? (
        <p className="flex flex-wrap items-center gap-0.5">
          <span className="font-medium text-[color:var(--lx-blue)]">{em}</span>
          <EmailCopyIconButton email={em} lang={lang} className="ml-0.5" />
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

    </div>
  );
}
