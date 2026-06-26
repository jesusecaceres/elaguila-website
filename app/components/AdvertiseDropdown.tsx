"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  getAdvertiseDropdownCopy,
  getAdvertiseDropdownOptions,
  type AdvertiseLang,
} from "@/app/lib/advertiseDropdownConfig";

export type AdvertiseDropdownVariant = "outline" | "primary" | "onDark" | "navbar";

type AdvertiseDropdownProps = {
  lang: AdvertiseLang;
  variant?: AdvertiseDropdownVariant;
  className?: string;
  /** Override trigger label (e.g. compact navbar "Anúnciate"). */
  buttonLabel?: string;
  align?: "left" | "right";
  fullWidth?: boolean;
  onNavigate?: () => void;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const TRIGGER_CLASS: Record<AdvertiseDropdownVariant, string> = {
  outline:
    "inline-flex min-h-[2.875rem] items-center justify-center gap-1.5 rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:text-[0.9375rem]",
  primary:
    "inline-flex min-h-[2.875rem] items-center justify-center gap-1.5 rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721]",
  onDark:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-full border-2 border-[#C9A84A]/60 bg-transparent px-6 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#C9A84A]/15",
  navbar:
    "inline-flex shrink-0 min-h-[2rem] items-center justify-center gap-1 rounded-full bg-[#7A1E2C] px-3 py-1.5 text-[0.7rem] font-bold text-[#FFFDF7] shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)] transition-colors hover:bg-[#5e1721] sm:min-h-[2.125rem] sm:px-3.5 sm:text-xs",
};

const MENU_CLASS =
  "absolute top-full z-[60] mt-1 min-w-[14rem] overflow-visible rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.18)]";

const ITEM_CLASS =
  "block whitespace-nowrap px-4 py-2.5 text-sm text-[#3D3428] hover:bg-[#FBF7EF] hover:text-[#7A1E2C] focus-visible:bg-[#FBF7EF] focus-visible:text-[#7A1E2C] focus-visible:outline-none";

export function AdvertiseDropdown({
  lang,
  variant = "outline",
  className,
  buttonLabel,
  align = "left",
  fullWidth = false,
  onNavigate,
}: AdvertiseDropdownProps) {
  const copy = getAdvertiseDropdownCopy(lang);
  const options = getAdvertiseDropdownOptions(lang);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  const label = buttonLabel ?? copy.button;

  return (
    <div ref={rootRef} className={cx("relative", fullWidth && "w-full", className)}>
      <button
        type="button"
        className={cx(TRIGGER_CLASS[variant], fullWidth && "w-full")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={buttonLabel ? copy.button : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{label}</span>
        <span className="text-[0.6rem] leading-none opacity-80" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={copy.menuAria}
          className={cx(MENU_CLASS, align === "right" ? "right-0" : "left-0")}
        >
          {options.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              role="menuitem"
              className={ITEM_CLASS}
              onClick={() => {
                close();
                onNavigate?.();
              }}
            >
              {option.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
