"use client";

import { useState } from "react";
import type { BrPropertyInventoryCountSnapshot } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import type { BrInventoryAddContext } from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import { BrPropertyInventoryValueDrawer } from "./BrPropertyInventoryValueDrawer";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  addCtx: BrInventoryAddContext;
  counts: BrPropertyInventoryCountSnapshot;
  label: string;
  className?: string;
  variant?: "primary" | "secondary";
};

export function BrPropertyInventoryValueDrawerTrigger({
  lang,
  addCtx,
  counts,
  label,
  className = "",
  variant = "primary",
}: Props) {
  const [open, setOpen] = useState(false);
  const base =
    variant === "primary"
      ? "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#2A2620] px-4 text-sm font-bold text-[#FAF7F2]"
      : "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-white px-4 text-sm font-semibold text-[#6E5418]";

  return (
    <>
      <button type="button" className={`${base} ${className}`.trim()} onClick={() => setOpen(true)}>
        {label}
      </button>
      <BrPropertyInventoryValueDrawer
        open={open}
        onClose={() => setOpen(false)}
        lang={lang}
        addCtx={addCtx}
        counts={counts}
      />
    </>
  );
}
