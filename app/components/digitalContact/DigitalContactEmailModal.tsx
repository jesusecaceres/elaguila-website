"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import { copyToClipboard } from "@/app/components/cta/ctaDataHelpers";
import { openMailto, tryWebShare } from "@/app/components/cta/ctaLaunchers";

type Props = {
  open: boolean;
  onClose: () => void;
  email: string;
  copy: DigitalContactCopy;
  onAction?: (action: "open" | "copy" | "share") => void;
};

/**
 * Deliberately small — three rows, one job: get the email address into the user's
 * hands (open / copy / share) with the least friction possible. Not the full
 * `CtaActionSheet` drawer; Email is the only Quick Action that still needs any UI
 * at all once Call/SMS/WhatsApp/Website/Maps launch directly.
 */
export function DigitalContactEmailModal({ open, onClose, email, copy, onAction }: Props) {
  const titleId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (open) primaryRef.current?.focus();
    else setToast(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-serif text-lg font-bold text-[#1F241C]">
            {copy.emailLabel}
          </h2>
          <button
            type="button"
            aria-label={copy.emailModalClose}
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5F6258] transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="mt-2 truncate text-sm font-semibold text-[#1F241C]">{email}</p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            ref={primaryRef}
            type="button"
            onClick={() => {
              onAction?.("open");
              openMailto(email, "", "");
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-transparent bg-[#7A1E2C] px-4 py-2.5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF7]"
          >
            {copy.emailModalOpen}
          </button>
          <button
            type="button"
            onClick={() => {
              void copyToClipboard(email).then((ok) => {
                if (ok) {
                  onAction?.("copy");
                  flash(copy.copiedEmail);
                }
              });
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D6C7AD] bg-white px-4 py-2.5 text-sm font-bold text-[#1F241C] transition hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF7]"
          >
            {copy.actionCopyEmail}
          </button>
          <button
            type="button"
            onClick={() => {
              void (async () => {
                const outcome = await tryWebShare({ title: copy.emailLabel, text: email });
                if (outcome === "shared") {
                  onAction?.("share");
                  return;
                }
                if (outcome === "aborted") return;
                const ok = await copyToClipboard(email);
                if (ok) {
                  onAction?.("share");
                  flash(copy.linkCopiedToast);
                }
              })();
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#D6C7AD] bg-white px-4 py-2.5 text-sm font-bold text-[#1F241C] transition hover:bg-[#FBF7EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF7]"
          >
            {copy.emailModalShare}
          </button>
        </div>

        {toast ? (
          <p role="status" className="mt-3 text-center text-xs font-semibold text-[#5F6258]">
            {toast}
          </p>
        ) : null}
      </div>
    </div>
  );
}
