"use client";

/**
 * Globalization Build D-S, Gate DS4 — shared focus-management primitive.
 *
 * Confirmed missing before this fix: LeonixMobileBottomSheet.tsx and CtaActionSheet.tsx (the two
 * canonical shared overlay surfaces — the Google/Yelp reputation drawer and Community Trust
 * surfaces are built on the former, nearly every category's contact/CTA flow on the latter) both
 * already had role="dialog"/aria-modal, Escape-to-close, and initial focus, but neither actually
 * trapped Tab/Shift+Tab within the open overlay, and neither restored focus to the trigger
 * element on close. No focus-trap library was already installed, so this is a minimal
 * dependency-free implementation rather than a new heavy dependency.
 *
 * One hook, adopted at both canonical shared surfaces — never per-category.
 */
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/**
 * Traps Tab/Shift+Tab within `containerRef` while `active` is true, and restores focus to
 * whatever element had focus immediately before activation once `active` goes back to false
 * (or the component unmounts while still active).
 */
export function useLeonixFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const container = containerRef.current;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !container) return;
      const focusables = focusableElements(container);
      if (focusables.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || !container.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (activeEl === last || !container.contains(activeEl)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const toRestore = previouslyFocused.current;
      if (toRestore && document.contains(toRestore)) {
        toRestore.focus();
      }
      previouslyFocused.current = null;
    };
  }, [active, containerRef]);
}
