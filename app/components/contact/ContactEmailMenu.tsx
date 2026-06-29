"use client";

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FiChevronDown, FiMail } from "react-icons/fi";
import { ServiciosTrackedLink } from "@/app/(site)/servicios/components/ServiciosTrackedLink";
import { trackServiciosListingCta } from "@/app/(site)/servicios/lib/serviciosCtaIntents";

export type ContactEmailMenuLang = "es" | "en";

const copy = {
  es: {
    openEmail: "Abrir correo",
    copyEmail: "Copiar correo",
    copyMessage: "Copiar mensaje",
    copied: "Copiado",
    menuLabel: "Opciones de correo",
  },
  en: {
    openEmail: "Open email",
    copyEmail: "Copy email",
    copyMessage: "Copy message",
    copied: "Copied",
    menuLabel: "Email options",
  },
} as const;

const MENU_BTN =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[color:var(--lx-text)] transition hover:bg-black/[0.04]";

type Props = {
  email: string;
  mailtoHref: string;
  messagePlain: string;
  lang: ContactEmailMenuLang;
  /** Visible trigger (icon + label). */
  children: React.ReactNode;
  triggerClassName: string;
  triggerStyle?: CSSProperties;
  /** Show mail icon + chevron on the right for affordance. */
  showChevron?: boolean;
  /** Servicios listing analytics for “Open email”. */
  listingSlug?: string;
  listingSourceId?: string | null;
  engagementListingId?: string | null;
  ownerUserId?: string | null;
  analyticsEventType?: string;
  /** Root wrapper (default full width for stacked CTAs). */
  rootClassName?: string;
};

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ContactEmailMenu({
  email,
  mailtoHref,
  messagePlain,
  lang,
  children,
  triggerClassName,
  triggerStyle,
  showChevron = true,
  listingSlug,
  listingSourceId,
  engagementListingId,
  ownerUserId,
  analyticsEventType,
  rootClassName = "relative w-full min-w-0",
}: Props) {
  const t = copy[lang];
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const flash = useCallback((msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2200);
  }, []);

  const trackEmailMenuAction = useCallback(
    (cta: "email_copy" | "message_copy") => {
      if (!listingSlug || !analyticsEventType) return;
      trackServiciosListingCta(listingSlug, analyticsEventType, {
        listingSlug,
        sourceId: listingSourceId,
        engagementId: (engagementListingId ?? listingSlug).trim(),
        ownerUserId: ownerUserId ?? undefined,
        source: "email_menu",
        cta,
      });
    },
    [analyticsEventType, engagementListingId, listingSlug, listingSourceId, ownerUserId],
  );

  const onCopyEmail: MouseEventHandler = async (e) => {
    e.preventDefault();
    const ok = await writeClipboard(email);
    if (ok) trackEmailMenuAction("email_copy");
    flash(ok ? t.copied : "");
    close();
  };

  const onCopyMessage: MouseEventHandler = async (e) => {
    e.preventDefault();
    const ok = await writeClipboard(messagePlain);
    if (ok) trackEmailMenuAction("message_copy");
    flash(ok ? t.copied : "");
    close();
  };

  const openLinkClass = `${MENU_BTN} rounded-b-none`;

  return (
    <div ref={rootRef} className={rootClassName}>
      <button
        type="button"
        className={triggerClassName}
        style={triggerStyle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex min-w-0 flex-1 items-center justify-center gap-2">
          {children}
        </span>
        {showChevron ? (
          <FiChevronDown className={`h-4 w-4 shrink-0 opacity-70 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t.menuLabel}
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg"
        >
          {listingSlug && analyticsEventType ? (
            <ServiciosTrackedLink
              listingSlug={listingSlug}
              sourceId={listingSourceId}
              engagementListingId={engagementListingId}
              ownerUserId={ownerUserId}
              eventType={analyticsEventType}
              href={mailtoHref}
              className={openLinkClass}
              role="menuitem"
              onClick={() => close()}
            >
              <FiMail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {t.openEmail}
            </ServiciosTrackedLink>
          ) : (
            <a href={mailtoHref} className={openLinkClass} role="menuitem" onClick={() => close()}>
              <FiMail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {t.openEmail}
            </a>
          )}
          <button type="button" role="menuitem" className={MENU_BTN} onClick={onCopyEmail}>
            {t.copyEmail}
          </button>
          <button type="button" role="menuitem" className={`${MENU_BTN} rounded-b-xl`} onClick={onCopyMessage}>
            {t.copyMessage}
          </button>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {feedback ?? ""}
      </p>
      {feedback ? (
        <p className="mt-1.5 text-center text-[11px] font-medium text-[color:var(--lx-text-2)]" aria-hidden>
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
