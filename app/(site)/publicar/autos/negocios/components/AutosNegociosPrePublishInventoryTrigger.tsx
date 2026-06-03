"use client";

import { useState } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { AutosNegociosPrePublishInventoryDrawer } from "./AutosNegociosPrePublishInventoryDrawer";

export function AutosNegociosPrePublishInventoryTrigger({
  lang,
  label,
  className = "",
  variant = "primary",
}: {
  lang: AutosNegociosLang;
  label: string;
  className?: string;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const base =
    variant === "primary"
      ? "inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#2A2620] px-5 text-sm font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1E1810]"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-4 text-sm font-semibold text-[#6E5418]";

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AutosNegociosPrePublishInventoryDrawer open={open} onClose={() => setOpen(false)} lang={lang} />
    </>
  );
}
