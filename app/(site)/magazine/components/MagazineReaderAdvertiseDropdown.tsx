"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SupportedLang } from "@/app/lib/language";
import {
  getMagazineReaderAdvertiseCopy,
  getMagazineReaderAdvertiseOptions,
} from "@/app/lib/magazine/magazineReaderAdvertise";

type MagazineReaderAdvertiseDropdownProps = {
  lang: SupportedLang;
  className?: string;
};

const TRIGGER_CLASS =
  "inline-flex min-h-[2.875rem] items-center justify-center gap-1.5 rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721]";

const MENU_CLASS =
  "absolute top-full z-[60] mt-1 min-w-[14rem] overflow-visible rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.18)]";

const ITEM_CLASS =
  "block whitespace-nowrap px-4 py-2.5 text-sm text-[#3D3428] hover:bg-[#FBF7EF] hover:text-[#7A1E2C] focus-visible:bg-[#FBF7EF] focus-visible:text-[#7A1E2C] focus-visible:outline-none";

/** Same primary AdvertiseDropdown UI; preserves selected route lang in option hrefs. */
export function MagazineReaderAdvertiseDropdown({
  lang,
  className,
}: MagazineReaderAdvertiseDropdownProps) {
  const copy = getMagazineReaderAdvertiseCopy(lang);
  const options = getMagazineReaderAdvertiseOptions(lang);
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

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className={TRIGGER_CLASS}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{copy.button}</span>
        <span className="text-[0.6rem] leading-none opacity-80" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open ? (
        <div id={menuId} role="menu" aria-label={copy.menuAria} className={MENU_CLASS}>
          {options.map((option) => (
            <Link
              key={option.id}
              href={option.href}
              role="menuitem"
              className={ITEM_CLASS}
              onClick={close}
            >
              {option.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
