"use client";

import type { CSSProperties } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardDocument, BusinessCardSide, TextFieldRole } from "../../product-configurators/business-cards/types";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import {
  presetToLogoStyle,
  presetToTextAnchorStyle,
  scaleToLogoPercent,
  scaleToTextRem,
} from "../../product-configurators/business-cards/layoutPresets";

const LINE_ORDER: TextFieldRole[] = [
  "company",
  "personName",
  "title",
  "tagline",
  "phone",
  "email",
  "website",
  "address",
];

function mergeTransform(base: string | undefined, nudgeX: number, nudgeY: number): string {
  const nx = nudgeX * 3;
  const ny = nudgeY * 3;
  const b = base ?? "translate(-50%, -50%)";
  return `${b} translate(${nx}%, ${ny}%)`;
}

export function BusinessCardPreview(props: {
  document: BusinessCardDocument;
  side: BusinessCardSide;
  lang: Lang;
}) {
  const { document: doc, side, lang } = props;
  const state = side === "front" ? doc.front : doc.back;
  const logoStyle = presetToLogoStyle(state.logo.position);
  const textAnchor = presetToTextAnchorStyle(state.textLayout.groupPosition);
  const logoPct = scaleToLogoPercent(state.logo.scale);
  const baseRem = scaleToTextRem(state.textLayout.groupScale);
  const showLogo = state.logo.visible && Boolean(state.logo.previewUrl);

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <div
        className="relative w-full rounded-xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.45)] border border-[rgba(255,255,255,0.08)]"
        style={{ aspectRatio: "3.5 / 2" }}
      >
        {/* Bleed simulation */}
        <div className="absolute inset-0 bg-[#232326]" aria-hidden>
          <div className={`absolute inset-[2.8%] rounded-[6px] bg-[#fffdf7] shadow-inner`}>
            {/* Trim = this inner cream; safe zone guides */}
            {doc.guidesVisible ? (
              <>
                <div
                  className="absolute rounded-[4px] border border-dashed border-[rgba(201,168,74,0.45)] pointer-events-none z-10"
                  style={{ inset: "8%" }}
                  title="Safe area"
                />
                <div
                  className="absolute rounded-[4px] border border-[rgba(201,168,74,0.2)] pointer-events-none z-10"
                  style={{ inset: "4%" }}
                  title="Trim / edge zone"
                />
              </>
            ) : null}

            {/* Logo */}
            {showLogo ? (
              <div
                className="absolute z-[5]"
                style={{
                  ...logoStyle,
                  width: `${logoPct}%`,
                  transform: mergeTransform(
                    logoStyle.transform as string | undefined,
                    doc.logoNudgeX,
                    doc.logoNudgeY
                  ),
                }}
              >
                <div className="relative aspect-square w-full">
                  <img src={state.logo.previewUrl!} alt="" className="h-full w-full object-contain" />
                </div>
              </div>
            ) : null}

            {/* Text stack */}
            <div
              className="absolute z-[6] max-w-[88%]"
              style={{
                ...textAnchor,
                transform: mergeTransform(textAnchor.transform as string | undefined, doc.textNudgeX, doc.textNudgeY),
              }}
            >
              <div
                className="flex flex-col gap-[0.12em] text-[color:var(--lx-text)]"
                style={{
                  fontSize: `${baseRem}rem`,
                  lineHeight: 1.2,
                }}
              >
                {LINE_ORDER.map((role) => {
                  if (!state.textLayout.lineVisible[role]) return null;
                  const v = state.fields[role].trim();
                  if (!v) return null;
                  const isCompany = role === "company";
                  const isContact =
                    role === "phone" || role === "email" || role === "website" || role === "address";
                  return (
                    <div
                      key={role}
                      className={
                        isCompany
                          ? "font-semibold tracking-tight"
                          : isContact
                            ? "opacity-[0.88] text-[0.9em]"
                            : "font-medium"
                      }
                      style={{ textAlign: (textAnchor.textAlign as CSSProperties["textAlign"]) ?? "center" }}
                    >
                      {v}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-[rgba(255,255,255,0.45)]">
        3.5″ × 2″ • {side === "front" ? bcPick(businessCardBuilderCopy.sideFront, lang) : bcPick(businessCardBuilderCopy.sideBack, lang)}
      </p>
    </div>
  );
}
