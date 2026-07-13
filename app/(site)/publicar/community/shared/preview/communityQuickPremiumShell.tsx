"use client";

import type { ReactNode } from "react";
import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LeonixTrustFooter } from "@/app/(site)/clasificados/components/leonixShell/LeonixTrustFooter";
import type { WeeklyScheduleGridItem } from "../lib/communityWeeklySchedule";

/** Leonix cream/ivory canvas surfaces — aligned with En Venta / Varios detail shells. */
export const COMMUNITY_PREMIUM_SURFACE = {
  canvasCard:
    "rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_14px_40px_-18px_rgba(31,36,28,0.18)] ring-1 ring-[#C9A84A]/10",
  sectionLabel: "text-[11px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]",
  infoTile:
    "rounded-lg border border-[#D6C7AD]/70 bg-[#FBF7EF]/90 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
  infoTileLabel: "text-[10px] font-semibold uppercase tracking-wide text-[#9A948C]",
  infoTileValue: "mt-1 text-sm font-bold leading-snug text-[#2A2826]",
  chip:
    "inline-flex max-w-full items-center rounded-lg border border-[#C9A84A]/55 bg-[#FBF7EF] px-3 py-1.5 text-xs font-semibold text-[#3D3428] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]",
  scheduleRow: "flex items-center justify-between gap-3 border-b border-[#D6C7AD]/45 py-2.5 last:border-b-0",
} as const;

export function CommunityPremiumCanvasCard({
  children,
  className = "",
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <section className={`${COMMUNITY_PREMIUM_SURFACE.canvasCard} p-4 sm:p-5 ${className}`} data-testid={testId}>
      {children}
    </section>
  );
}

export function CommunityPremiumOrganizerCard({
  label,
  name,
  logoSrc,
}: {
  label: string;
  name: string;
  logoSrc?: string;
}) {
  const display = name.trim() || "—";
  const initial = display !== "—" ? display.slice(0, 1).toUpperCase() : "?";
  const logo = logoSrc?.trim();

  return (
    <div className="mx-auto mt-5 flex max-w-md items-center gap-4 rounded-2xl border border-[#C9B46A]/50 bg-[#FBF7EF]/90 px-5 py-4 shadow-md">
      {logo ? (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-[#C9B46A]/45 bg-white shadow-sm">
          <Image src={logo} alt="" fill className="object-cover" sizes="64px" unoptimized />
        </div>
      ) : (
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF8EC] to-[#F3E0C0] text-xl font-bold text-[#7A6B4A]"
          aria-hidden
        >
          {initial}
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A6B1F]">{label}</p>
        <p className="mt-1 truncate text-lg font-bold leading-tight text-[#2A2826] sm:text-xl">{display}</p>
      </div>
    </div>
  );
}

export function CommunityPremiumIdentitySection({
  title,
  organizerLabel,
  organizerName,
  organizerLogoUrl,
  chips,
}: {
  title: string;
  organizerLabel: string;
  organizerName: string;
  organizerLogoUrl?: string;
  chips: string[];
}) {
  const visibleChips = chips.filter((c) => c.trim() && c !== "—");

  return (
    <header className="text-center" data-testid="community-premium-identity">
      <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#2A2826] sm:text-4xl lg:text-5xl lg:leading-tight">
        {title.trim() || "—"}
      </h1>
      <CommunityPremiumOrganizerCard label={organizerLabel} name={organizerName} logoSrc={organizerLogoUrl} />
      {visibleChips.length ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {visibleChips.map((chip) => (
            <span key={chip} className={COMMUNITY_PREMIUM_SURFACE.chip}>
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export type CommunityPremiumInfoItem = {
  key: string;
  label: string;
  value: string;
  subValue?: string;
};

export function CommunityPremiumInfoGrid({ items }: { items: CommunityPremiumInfoItem[] }) {
  const visible = items.filter((it) => it.value.trim() && it.value !== "—");
  if (!visible.length) return null;

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      data-testid="community-premium-info-grid"
    >
      {visible.map((it) => (
        <div key={it.key} className={COMMUNITY_PREMIUM_SURFACE.infoTile}>
          <p className={COMMUNITY_PREMIUM_SURFACE.infoTileLabel}>{it.label}</p>
          <p className={COMMUNITY_PREMIUM_SURFACE.infoTileValue}>{it.value}</p>
          {it.subValue?.trim() ? (
            <p className="mt-0.5 text-[11px] leading-snug text-[#5C564E]">{it.subValue}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CommunityPremiumScheduleCard({
  title,
  rows,
  singleRow,
  lang,
}: {
  title: string;
  rows: WeeklyScheduleGridItem[];
  /** Fallback when no weekly rows exist (e.g. single session time). */
  singleRow?: { dayLabel: string; timeRange: string } | null;
  lang: Lang;
}) {
  void lang;
  const hasRows = rows.length > 0;
  const hasSingle = Boolean(singleRow?.timeRange.trim());
  if (!hasRows && !hasSingle) return null;

  return (
    <CommunityPremiumCanvasCard testId="community-premium-schedule">
      <h2 className={COMMUNITY_PREMIUM_SURFACE.sectionLabel}>{title}</h2>
      <div className="mt-3">
        {hasRows
          ? rows.map((row) => (
              <div key={row.dayKey} className={COMMUNITY_PREMIUM_SURFACE.scheduleRow}>
                <span className="min-w-0 text-sm font-medium text-[#5C564E]">{row.dayLabel}</span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#2A2826]">{row.timeRange}</span>
              </div>
            ))
          : singleRow ? (
              <div className={COMMUNITY_PREMIUM_SURFACE.scheduleRow}>
                <span className="min-w-0 text-sm font-medium text-[#5C564E]">{singleRow.dayLabel}</span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#2A2826]">{singleRow.timeRange}</span>
              </div>
            ) : null}
      </div>
    </CommunityPremiumCanvasCard>
  );
}

/** Present multi-sentence or line-broken text with readable spacing. */
function formatReadableText(text: string): ReactNode {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#3D3428]">{trimmed}</p>;
  }
  return (
    <ul className="space-y-2 text-[15px] leading-relaxed text-[#3D3428]">
      {lines.map((line, i) => (
        <li key={`${line.slice(0, 24)}-${i}`} className="flex gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84A]" aria-hidden />
          <span className="min-w-0 whitespace-pre-line">{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function CommunityPremiumTextCard({
  title,
  body,
  testId,
}: {
  title: string;
  body: string;
  testId?: string;
}) {
  if (!body.trim()) return null;
  return (
    <CommunityPremiumCanvasCard testId={testId}>
      <h2 className={COMMUNITY_PREMIUM_SURFACE.sectionLabel}>{title}</h2>
      <div className="mt-3">{formatReadableText(body)}</div>
    </CommunityPremiumCanvasCard>
  );
}

export function CommunityPremiumTrustFooter({
  lang,
  leonixAdId,
}: {
  lang: Lang;
  leonixAdId?: string | null;
}) {
  return (
    <div data-testid="community-premium-trust-footer">
      <LeonixTrustFooter lang={lang} leonixAdId={leonixAdId} />
    </div>
  );
}
