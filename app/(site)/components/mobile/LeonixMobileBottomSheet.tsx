"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Leonix Global Mobile/PWA Foundation V1 — shared bottom sheet / side drawer.
 *
 * Borrows the Admin mobile drawer safety behavior (portal, body scroll lock,
 * Escape close, dialog semantics, 44px close target, overflow-safe panel).
 *
 * Mobile: bottom sheet anchored to the bottom edge (full width, rounded top,
 * ~92dvh max height, internal scroll, safe-area bottom padding).
 * Desktop (`placement="right"`): right-side panel; `placement="bottom"` keeps a
 * centered bottom sheet on all sizes.
 *
 * No category-specific content — only a default close aria fallback.
 */

type Lang = "es" | "en";

export type LeonixMobileBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  ariaLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: "bottom" | "right";
  lang?: Lang;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  panelClassName?: string;
  contentClassName?: string;
};

export function LeonixMobileBottomSheet({
  open,
  onClose,
  title,
  ariaLabel,
  children,
  footer,
  placement = "bottom",
  lang = "es",
  closeLabel,
  closeOnBackdrop = true,
  panelClassName = "",
  contentClassName = "",
}: LeonixMobileBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resolvedCloseLabel = closeLabel ?? (lang === "en" ? "Close" : "Cerrar");

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open && panelRef.current) panelRef.current.focus();
  }, [open]);

  if (!mounted || !open) return null;

  const isRight = placement === "right";
  const overlayAlign = isRight
    ? "items-end justify-center lg:items-stretch lg:justify-end"
    : "items-end justify-center";
  const panelDesktop = isRight
    ? "lg:h-full lg:max-h-none lg:w-[26rem] lg:max-w-md lg:rounded-none lg:rounded-l-3xl"
    : "sm:max-w-lg sm:rounded-3xl sm:mb-6";

  const sheet = (
    <div
      className={`fixed inset-0 z-[100] flex overflow-hidden ${overlayAlign}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1F241C]/50 backdrop-blur-[3px]"
        aria-label={resolvedCloseLabel}
        onClick={closeOnBackdrop ? close : undefined}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 flex max-h-[92dvh] w-full max-w-[100vw] flex-col overflow-hidden rounded-t-3xl border border-[#D4C4A8]/70 bg-[#FFFCF7] shadow-2xl outline-none ${panelDesktop} ${panelClassName}`}
      >
        <div className="flex shrink-0 justify-center pt-2 lg:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-[#D4C4A8]/80" />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E8D9C4]/70 bg-gradient-to-r from-[#FDF8F0]/60 to-[#FFFCF7] px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h2 className="truncate font-serif text-lg font-semibold text-[#1F241C]">{title}</h2>
            ) : (
              title
            )}
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#D4C4A8]/80 bg-white text-[#1F241C] transition hover:border-[#7A1E2C]/40 hover:bg-[#FDF8F0]"
            aria-label={resolvedCloseLabel}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5 ${contentClassName}`}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-[#E8D9C4]/70 bg-[#FFFCF7] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
