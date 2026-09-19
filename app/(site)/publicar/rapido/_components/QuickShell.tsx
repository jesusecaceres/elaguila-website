"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";

/** 390px-first shell shared by the chooser, the intake and the My-Ad doorway. */
export function QuickShell({
  lang,
  title,
  subtitle,
  eyebrow,
  backHref,
  backLabel,
  children,
}: {
  lang: QuickLang;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F6F0E2] pb-24 pt-24 text-[#3D2C12] sm:pt-28">
      <div className="mx-auto w-full max-w-xl px-4">
        {backHref ? (
          <Link href={backHref} className="mb-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-[#7A1E2C] underline underline-offset-2">
            ← {backLabel ?? quickCopy("back", lang)}
          </Link>
        ) : null}
        <header className="rounded-3xl border border-[#D8C79A]/70 bg-[#FFFDF7] px-5 py-5 shadow-[0_18px_48px_rgba(113,84,22,0.10)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B28A2F]">{eyebrow ?? quickCopy("eyebrow", lang)}</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[#5D4A25]/90">{subtitle}</p> : null}
        </header>
        <div className="mt-4">{children}</div>
      </div>
    </main>
  );
}

export const quickCard = "rounded-2xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-4 shadow-[0_10px_24px_-16px_rgba(113,84,22,0.25)]";
export const quickPrimaryBtn =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#7A1E2C] px-5 text-base font-extrabold text-white shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
export const quickSecondaryBtn =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[#B28A2F]/50 bg-[#FFF6E7] px-5 text-sm font-semibold text-[#6E4E18] active:scale-[0.99]";
export const quickInput =
  "mt-1 block min-h-[48px] w-full rounded-xl border border-[#D8C79A] bg-white px-3 py-2 text-base text-[#3D2C12] outline-none focus:border-[#7A1E2C] focus:ring-2 focus:ring-[#7A1E2C]/15";
export const quickLabel = "block text-sm font-semibold text-[#3D2C12]";
