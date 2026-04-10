"use client";

import type { ComponentType } from "react";

const BORDER = "rgba(61, 54, 48, 0.12)";
const CREAM_CARD = "#FDFBF7";
const CHARCOAL = "#3D3630";
const MUTED = "rgba(61, 54, 48, 0.62)";
const BRONZE = "#C5A059";

type IconComp = ComponentType<{ className?: string }>;

/**
 * Normalized stat strip for Leonix privado preview: fixed grid (no flex-wrap orphans),
 * equal cell rhythm, aligned labels/values — shared by BR privado + Rentas privado shells.
 */
export function LeonixPrivadoPreviewQuickFactsStrip({
  quickFacts,
}: {
  quickFacts: Array<{ Icon: IconComp; label: string; value: string }>;
}) {
  if (quickFacts.length === 0) return null;

  return (
    <div
      className="mt-3 grid w-full grid-cols-2 gap-2 rounded-xl border p-2.5 sm:mt-3 sm:grid-cols-3 sm:gap-2 sm:p-3 lg:grid-cols-4"
      style={{ borderColor: BORDER, background: CREAM_CARD, boxShadow: "0 10px 36px -16px rgba(42,36,22,0.12)" }}
    >
      {quickFacts.map(({ Icon, label, value }, qfIdx) => (
        <div
          key={`${label}-${qfIdx}`}
          className="flex min-h-[76px] min-w-0 flex-col justify-center rounded-lg border px-2 py-2 sm:min-h-[80px] sm:px-2.5 sm:py-2"
          style={{ borderColor: BORDER }}
        >
          <div className="flex min-w-0 items-start gap-2">
            <span style={{ color: BRONZE }} className="mt-0.5 shrink-0">
              <Icon className="block h-[17px] w-[17px] sm:h-[18px] sm:w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase leading-tight tracking-wide" style={{ color: MUTED }}>
                {label}
              </p>
              <p
                className="mt-0.5 break-words text-sm font-bold leading-snug [font-variant-numeric:tabular-nums] [overflow-wrap:anywhere]"
                style={{ color: CHARCOAL }}
              >
                {value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Alias for shared BR negocio + privado / rentas preview shells. */
export const LeonixPreviewQuickFactsStrip = LeonixPrivadoPreviewQuickFactsStrip;
