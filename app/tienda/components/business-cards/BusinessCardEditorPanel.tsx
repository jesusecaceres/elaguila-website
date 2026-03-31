"use client";

import type { ChangeEvent } from "react";
import type { Lang } from "../../types/tienda";
import type {
  BusinessCardDocument,
  BusinessCardSide,
  ScalePreset,
  TextFieldRole,
} from "../../product-configurators/business-cards/types";
import { LOGO_ACCEPT, LOGO_MAX_MB, TEXT_FIELD_MAX } from "../../product-configurators/business-cards/constants";
import type { BusinessCardBuilderAction } from "../../product-configurators/business-cards/businessCardBuilderReducer";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { BusinessCardPositionPicker } from "./BusinessCardPositionPicker";

const FIELD_ORDER: TextFieldRole[] = [
  "company",
  "personName",
  "title",
  "tagline",
  "phone",
  "email",
  "website",
  "address",
];

const SCALES: ScalePreset[] = ["sm", "md", "lg"];

export function BusinessCardEditorPanel(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  side: BusinessCardSide;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onPickLogo: (file: File | null) => void;
}) {
  const { lang, doc, side, dispatch, onPickLogo } = props;
  const state = side === "front" ? doc.front : doc.back;

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onPickLogo(f);
    e.target.value = "";
  };

  return (
    <div className="rounded-2xl border border-[rgba(201,180,106,0.25)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(251,247,239,0.95))] p-5 sm:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">
          {bcPick(businessCardBuilderCopy.fieldsTitle, lang)}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {FIELD_ORDER.map((role) => {
            const max = TEXT_FIELD_MAX[role];
            const label = businessCardBuilderCopy.fieldLabels[role];
            return (
              <div key={role}>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.85)]">
                    {bcPick(label, lang)}
                  </label>
                  <label className="flex items-center gap-1.5 text-[10px] text-[color:rgba(61,52,40,0.55)]">
                    <input
                      type="checkbox"
                      checked={state.textLayout.lineVisible[role]}
                      onChange={(e) =>
                        dispatch({ type: "TOGGLE_LINE", side, role, visible: e.target.checked })
                      }
                    />
                    {bcPick(businessCardBuilderCopy.showLine, lang)}
                  </label>
                </div>
                <input
                  className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[color:var(--lx-text)]"
                  value={state.fields[role]}
                  maxLength={max ?? 200}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", side, role, value: e.target.value })
                  }
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <h3 className="text-sm font-semibold text-[color:var(--lx-text)]">
          {bcPick(businessCardBuilderCopy.layoutTitle, lang)}
        </h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <BusinessCardPositionPicker
            label={bcPick(businessCardBuilderCopy.textGroupPos, lang)}
            value={state.textLayout.groupPosition}
            onChange={(p) => dispatch({ type: "SET_TEXT_GROUP_POSITION", side, position: p })}
          />
          <BusinessCardPositionPicker
            label={bcPick(businessCardBuilderCopy.logoPos, lang)}
            value={state.logo.position}
            onChange={(p) => dispatch({ type: "SET_LOGO_POSITION", side, position: p })}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.65)]">
              {bcPick(businessCardBuilderCopy.textScale, lang)}
            </div>
            <div className="mt-2 flex gap-2">
              {SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => dispatch({ type: "SET_TEXT_GROUP_SCALE", side, scale: s })}
                  className={[
                    "flex-1 rounded-lg py-2 text-xs font-semibold capitalize",
                    state.textLayout.groupScale === s
                      ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)]"
                      : "bg-black/5 text-[color:var(--lx-text)] border border-black/10",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.65)]">
              {bcPick(businessCardBuilderCopy.logoScale, lang)}
            </div>
            <div className="mt-2 flex gap-2">
              {SCALES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => dispatch({ type: "SET_LOGO_SCALE", side, scale: s })}
                  className={[
                    "flex-1 rounded-lg py-2 text-xs font-semibold capitalize",
                    state.logo.scale === s
                      ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)]"
                      : "bg-black/5 text-[color:var(--lx-text)] border border-black/10",
                  ].join(" ")}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold text-[color:rgba(61,52,40,0.65)]">
              {bcPick(businessCardBuilderCopy.nudgeText, lang)} (X / Y)
            </div>
            <div className="mt-2 flex gap-2 items-center">
              <input
                type="range"
                min={-1}
                max={1}
                step={0.25}
                value={doc.textNudgeX}
                onChange={(e) =>
                  dispatch({ type: "SET_TEXT_NUDGE", x: Number(e.target.value), y: doc.textNudgeY })
                }
                className="flex-1"
              />
              <input
                type="range"
                min={-1}
                max={1}
                step={0.25}
                value={doc.textNudgeY}
                onChange={(e) =>
                  dispatch({ type: "SET_TEXT_NUDGE", x: doc.textNudgeX, y: Number(e.target.value) })
                }
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[color:rgba(61,52,40,0.65)]">
              {bcPick(businessCardBuilderCopy.nudgeLogo, lang)} (X / Y)
            </div>
            <div className="mt-2 flex gap-2 items-center">
              <input
                type="range"
                min={-1}
                max={1}
                step={0.25}
                value={doc.logoNudgeX}
                onChange={(e) =>
                  dispatch({ type: "SET_LOGO_NUDGE", x: Number(e.target.value), y: doc.logoNudgeY })
                }
                className="flex-1"
              />
              <input
                type="range"
                min={-1}
                max={1}
                step={0.25}
                value={doc.logoNudgeY}
                onChange={(e) =>
                  dispatch({ type: "SET_LOGO_NUDGE", x: doc.logoNudgeX, y: Number(e.target.value) })
                }
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-cta-light)] cursor-pointer hover:bg-[color:var(--lx-cta-dark-hover)] transition">
            {bcPick(businessCardBuilderCopy.uploadLogo, lang)}
            <input type="file" accept={LOGO_ACCEPT} className="hidden" onChange={onFile} />
          </label>
          {state.logo.previewUrl ? (
            <button
              type="button"
              onClick={() => {
                onPickLogo(null);
              }}
              className="text-sm font-medium text-[color:rgba(61,52,40,0.75)] underline-offset-2 hover:underline"
            >
              {bcPick(businessCardBuilderCopy.removeLogo, lang)}
            </button>
          ) : null}
          <span className="text-[11px] text-[color:rgba(61,52,40,0.55)]">
            PNG, JPG, WebP, SVG • max {LOGO_MAX_MB} MB
          </span>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-[color:rgba(61,52,40,0.7)]">
          <input
            type="checkbox"
            checked={state.logo.visible}
            onChange={(e) => dispatch({ type: "SET_LOGO_VISIBLE", side, visible: e.target.checked })}
          />
          {lang === "en" ? "Show logo on this side" : "Mostrar logo en esta cara"}
        </label>
      </div>
    </div>
  );
}
