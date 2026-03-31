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
import { BUSINESS_CARD_TEMPLATE_IDS } from "../../product-configurators/business-cards/templates";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";
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

const BG_PRESETS = [
  { id: "linen" as const, label: { es: "Lino", en: "Linen" } },
  { id: "pearl" as const, label: { es: "Perla", en: "Pearl" } },
  { id: "graphite" as const, label: { es: "Grafito", en: "Graphite" } },
  { id: "sand" as const, label: { es: "Arena", en: "Sand" } },
];

export function BusinessCardEditorPanel(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  side: BusinessCardSide;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onPickLogo: (file: File | null) => void;
  selectedTextBlockId: string | null;
  onSelectTextBlock: (id: string | null) => void;
}) {
  const { lang, doc, side, dispatch, onPickLogo, selectedTextBlockId, onSelectTextBlock } = props;
  const state = side === "front" ? doc.front : doc.back;
  const selectedBlock = state.textBlocks.find((b) => b.id === selectedTextBlockId) ?? null;

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onPickLogo(f);
    e.target.value = "";
  };

  const solidColor = doc.canvasBackground.kind === "solid" ? doc.canvasBackground.color : "#fffdf7";

  return (
    <div className="rounded-2xl border border-[rgba(201,180,106,0.25)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98),rgba(251,247,239,0.95))] p-5 sm:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--lx-text)]">
          {bcpPick(businessCardProductCopy.templatesHeading, lang)}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {BUSINESS_CARD_TEMPLATE_IDS.map((tid) => (
            <button
              key={tid}
              type="button"
              onClick={() => dispatch({ type: "APPLY_TEMPLATE", templateId: tid, lang })}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-left text-xs font-semibold text-[color:var(--lx-text)] hover:border-[color:var(--lx-gold)] transition"
            >
              {bcpPick(businessCardProductCopy.templateLabels[tid], lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <h2 className="text-sm font-semibold text-[color:var(--lx-text)]">
          {bcpPick(businessCardProductCopy.backgroundHeading, lang)}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[color:rgba(61,52,40,0.75)]">
            <span>{lang === "en" ? "Solid" : "Sólido"}</span>
            <input
              type="color"
              value={solidColor.match(/^#/) ? solidColor : "#fffdf7"}
              onChange={(e) => dispatch({ type: "SET_CANVAS_BACKGROUND", payload: { kind: "solid", color: e.target.value } })}
              className="h-9 w-14 cursor-pointer rounded border border-black/15 bg-white"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {BG_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => dispatch({ type: "SET_CANVAS_BACKGROUND", payload: { kind: "preset", id: p.id } })}
              className={[
                "rounded-lg px-3 py-1.5 text-[11px] font-semibold border",
                doc.canvasBackground.kind === "preset" && doc.canvasBackground.id === p.id
                  ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.15)]"
                  : "border-black/10 bg-white/90",
              ].join(" ")}
            >
              {bcpPick(p.label, lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[color:var(--lx-text)]">
            {bcpPick(businessCardProductCopy.designBlocksHeading, lang)}
          </h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_CUSTOM_TEXT_BLOCK", side, lang })}
            className="text-[11px] font-semibold text-[color:#6B5B2E] underline-offset-2 hover:underline"
          >
            {bcpPick(businessCardProductCopy.addCustomLine, lang)}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-[color:rgba(61,52,40,0.55)]">
          {bcpPick(businessCardProductCopy.selectBlockHint, lang)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {state.textBlocks.map((b) => {
            const t = b.text.trim() || (b.role === "custom" ? "…" : b.role);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectTextBlock(b.id)}
                className={[
                  "rounded-full px-3 py-1 text-[11px] font-semibold border",
                  selectedTextBlockId === b.id
                    ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.18)]"
                    : "border-black/10 bg-white",
                ].join(" ")}
              >
                {b.role === "custom" ? (lang === "en" ? `Custom: ${t.slice(0, 18)}` : `Pers.: ${t.slice(0, 18)}`) : b.role}
              </button>
            );
          })}
        </div>

        {selectedBlock ? (
          <div className="mt-4 space-y-3 rounded-xl border border-black/10 bg-white/90 p-4">
            {selectedBlock.role !== "custom" ? (
              <p className="text-[11px] text-[color:rgba(61,52,40,0.65)]">
                {bcpPick(businessCardProductCopy.linkedFieldHint, lang)}
              </p>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
                  {lang === "en" ? "Custom text" : "Texto personalizado"}
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1.5 text-sm text-[color:var(--lx-text)]"
                  rows={2}
                  value={selectedBlock.text}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TEXT_BLOCK",
                      side,
                      id: selectedBlock.id,
                      patch: { text: e.target.value },
                    })
                  }
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                X %
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1 text-sm"
                  value={Math.round(selectedBlock.xPct)}
                  min={5}
                  max={95}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TEXT_BLOCK",
                      side,
                      id: selectedBlock.id,
                      patch: { xPct: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                Y %
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1 text-sm"
                  value={Math.round(selectedBlock.yPct)}
                  min={5}
                  max={95}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TEXT_BLOCK",
                      side,
                      id: selectedBlock.id,
                      patch: { yPct: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                {lang === "en" ? "Width %" : "Ancho %"}
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1 text-sm"
                  value={Math.round(selectedBlock.widthPct)}
                  min={20}
                  max={92}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TEXT_BLOCK",
                      side,
                      id: selectedBlock.id,
                      patch: { widthPct: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                {lang === "en" ? "Size" : "Tamaño"}
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-1 text-sm"
                  value={selectedBlock.fontSize}
                  min={6}
                  max={22}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TEXT_BLOCK",
                      side,
                      id: selectedBlock.id,
                      patch: { fontSize: Number(e.target.value) },
                    })
                  }
                />
              </label>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                {lang === "en" ? "Weight" : "Peso"}
              </div>
              <div className="mt-1 flex gap-1">
                {([400, 500, 600, 700] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      dispatch({ type: "SET_TEXT_BLOCK", side, id: selectedBlock.id, patch: { fontWeight: w } })
                    }
                    className={[
                      "flex-1 rounded-md py-1 text-[11px] font-semibold border",
                      selectedBlock.fontWeight === w
                        ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)]"
                        : "border-black/10 bg-white",
                    ].join(" ")}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                {lang === "en" ? "Color" : "Color"}
                <input
                  type="color"
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-black/10"
                  value={
                    selectedBlock.color.startsWith("#") ? selectedBlock.color : selectedBlock.color === "var(--lx-text)" ? "#2c2416" : "#2c2416"
                  }
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TEXT_BLOCK",
                      side,
                      id: selectedBlock.id,
                      patch: { color: e.target.value },
                    })
                  }
                />
              </label>
              <div>
                <div className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                  {lang === "en" ? "Align" : "Alineación"}
                </div>
                <div className="mt-1 flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SET_TEXT_BLOCK", side, id: selectedBlock.id, patch: { textAlign: a } })
                      }
                      className={[
                        "flex-1 rounded-md py-1 text-[10px] font-bold border uppercase",
                        selectedBlock.textAlign === a
                          ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.2)]"
                          : "border-black/10 bg-white",
                      ].join(" ")}
                    >
                      {a[0]!.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {selectedBlock.role === "custom" ? (
              <button
                type="button"
                onClick={() => {
                  onSelectTextBlock(null);
                  dispatch({ type: "REMOVE_TEXT_BLOCK", side, id: selectedBlock.id });
                }}
                className="text-xs font-semibold text-rose-800 underline-offset-2 hover:underline"
              >
                {bcpPick(businessCardProductCopy.removeCustomBlock, lang)}
              </button>
            ) : null}
          </div>
        ) : null}

        {state.logo.visible && state.logo.previewUrl ? (
          <div className="mt-4 rounded-xl border border-black/10 bg-white/90 p-4 space-y-2">
            <p className="text-[11px] text-[color:rgba(61,52,40,0.65)]">
              {bcpPick(businessCardProductCopy.adjustLogoHint, lang)}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                X %
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-black/10 px-1 py-1 text-xs"
                  value={Math.round(state.logoGeom.xPct)}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_LOGO_GEOM",
                      side,
                      patch: { xPct: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                Y %
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-black/10 px-1 py-1 text-xs"
                  value={Math.round(state.logoGeom.yPct)}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_LOGO_GEOM",
                      side,
                      patch: { yPct: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                W %
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-black/10 px-1 py-1 text-xs"
                  value={Math.round(state.logoGeom.widthPct)}
                  min={8}
                  max={70}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_LOGO_GEOM",
                      side,
                      patch: { widthPct: Number(e.target.value) },
                    })
                  }
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

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
        <p className="mt-1 text-[11px] text-[color:rgba(61,52,40,0.55)]">
          {lang === "en"
            ? "Legacy nudges apply when not using freeform blocks (empty template)."
            : "Ajustes heredados si no usas bloques libres."}
        </p>
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
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.65)]">
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
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(61,52,40,0.65)]">
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
