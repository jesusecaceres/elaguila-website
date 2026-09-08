"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Canonical Owner Entity Workspace header.
 *
 * Structure only — this component never fetches, never resolves a route, never decides
 * whether a capability is real. The category adapter passes truthful, already-resolved
 * values; this component owns layout, typography, and responsive behavior so every entity
 * type reads as the same Leonix product regardless of category.
 */
import Link from "next/link";

export type Lang = "es" | "en";

export function OwnerEntityHeader({
  eyebrow,
  title,
  subtitle,
  statusLabel,
  statusChipClass,
  plan,
  leonixId,
  badges,
  createAction,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  statusLabel: string;
  statusChipClass: string;
  plan?: string | null;
  leonixId?: string | null;
  badges?: string[];
  createAction?: { label: string; href: string } | null;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{eyebrow}</span>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-2xl font-semibold text-[#1F241C] sm:text-[1.75rem]">{title}</h1>
          <span className={statusChipClass}>{statusLabel}</span>
          {badges?.map((b) => (
            <span
              key={b}
              className="inline-flex shrink-0 items-center rounded-full border border-[#C9A84A]/70 bg-gradient-to-br from-[#FBF7EF] to-[#F3EBDD] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C4A16]"
            >
              {b}
            </span>
          ))}
        </div>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{subtitle}</p> : null}
        {plan || leonixId ? (
          <p className="mt-1.5 text-xs text-[#7A7164]">
            {plan ? <span>{plan}</span> : null}
            {plan && leonixId ? <span> · </span> : null}
            {leonixId ? <span className="font-mono">{leonixId}</span> : null}
          </p>
        ) : null}
      </div>
      {createAction ? (
        <Link
          href={createAction.href}
          prefetch={false}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-2xl border border-[#C9A84A]/55 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
        >
          {createAction.label}
        </Link>
      ) : null}
    </header>
  );
}
