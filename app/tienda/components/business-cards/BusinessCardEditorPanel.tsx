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
  { id: "linen" as const, label: { es: "Lino", en: "Linen" }, preview: "linear-gradient(145deg,#fbf9f4 0%,#ebe4d8 100%)" },
  { id: "pearl" as const, label: { es: "Perla", en: "Pearl" }, preview: "linear-gradient(160deg,#fffef9 0%,#f2ebe4 100%)" },
  { id: "graphite" as const, label: { es: "Grafito", en: "Graphite" }, preview: "linear-gradient(145deg,#2a2a2e 0%,#1a1a1d 100%)" },
  { id: "sand" as const, label: { es: "Arena", en: "Sand" }, preview: "linear-gradient(145deg,#f6efe6 0%,#e2d6ca 100%)" },
];

function clampBlockAxis(v: number): number {
  return Math.min(95, Math.max(5, v));
}

export function BusinessCardEditorPanel(props: {
  lang: Lang;
  doc: BusinessCardDocument;
  side: BusinessCardSide;
  dispatch: (a: BusinessCardBuilderAction) => void;
  onPickLogo: (file: File | null) => void;
  selectedTextBlockId: string | null;
  onSelectTextBlock: (id: string | null) => void;
  logoInspectorActive: boolean;
}) {
  const { lang, doc, side, dispatch, onPickLogo, selectedTextBlockId, onSelectTextBlock, logoInspectorActive } = props;
  const state = side === "front" ? doc.front : doc.back;
  const selectedBlock = state.textBlocks.find((b) => b.id === selectedTextBlockId) ?? null;

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onPickLogo(f);
    e.target.value = "";
  };

  const solidColor = doc.canvasBackground.kind === "solid" ? doc.canvasBackground.color : "#fffdf7";

  const sideLabel =
    side === "front" ? bcPick(businessCardBuilderCopy.sideFront, lang) : bcPick(businessCardBuilderCopy.sideBack, lang);

  const blockChipLabel = (role: TextFieldRole | "custom", text: string) => {
    if (role === "custom") {
      const t = text.trim() || "…";
      return lang === "en" ? `Custom · ${t.slice(0, 14)}${t.length > 14 ? "…" : ""}` : `Pers. · ${t.slice(0, 14)}${t.length > 14 ? "…" : ""}`;
    }
    return bcPick(businessCardBuilderCopy.fieldLabels[role], lang);
  };

  return (
    <div className="rounded-2xl border border-[rgba(201,180,106,0.28)] bg-[linear-gradient(180deg,rgba(255,252,247,0.99),rgba(251,247,239,0.96))] p-4 sm:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] space-y-5 sm:space-y-6">
      <div className="rounded-xl border border-[rgba(201,168,74,0.22)] bg-[rgba(201,168,74,0.08)] px-3 py-2.5 sm:px-4">
        <p className="text-xs font-semibold text-[color:rgba(61,52,40,0.88)]">
          <span className="text-[color:#6B5B2E]">{bcPick(businessCardBuilderCopy.editingBanner, lang)}</span>{" "}
          <span className="font-bold">{sideLabel}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-[color:rgba(61,52,40,0.55)] leading-snug">
          {bcPick(businessCardBuilderCopy.previewHelp, lang)}
        </p>
      </div>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[color:rgba(61,52,40,0.45)]">
          {bcpPick(businessCardProductCopy.templatesHeading, lang)}
        </h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUSINESS_CARD_TEMPLATE_IDS.map((tid) => (
            <button
              key={tid}
              type="button"
              onClick={() => dispatch({ type: "APPLY_TEMPLATE", templateId: tid, lang })}
              className="group rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:border-[color:rgba(201,168,74,0.65)] hover:shadow-md active:scale-[0.99]"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-[color:rgba(201,168,74,0.9)]">
                {String(BUSINESS_CARD_TEMPLATE_IDS.indexOf(tid) + 1).padStart(2, "0")}
              </span>
              <p className="mt-1 text-sm font-semibold text-[color:var(--lx-text)] group-hover:text-[color:#5c4f2e]">
                {bcpPick(businessCardProductCopy.templateLabels[tid], lang)}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[color:rgba(61,52,40,0.58)]">
                {bcpPick(businessCardProductCopy.templateDescriptions[tid], lang)}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[color:rgba(61,52,40,0.45)]">
          {bcpPick(businessCardProductCopy.backgroundHeading, lang)}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-[color:rgba(61,52,40,0.75)]">
            <span>{lang === "en" ? "Solid" : "Sólido"}</span>
            <input
              type="color"
              value={solidColor.match(/^#/) ? solidColor : "#fffdf7"}
              onChange={(e) => dispatch({ type: "SET_CANVAS_BACKGROUND", payload: { kind: "solid", color: e.target.value } })}
              className="h-10 w-14 cursor-pointer rounded-lg border border-black/12 bg-white"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {BG_PRESETS.map((p) => {
            const active = doc.canvasBackground.kind === "preset" && doc.canvasBackground.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => dispatch({ type: "SET_CANVAS_BACKGROUND", payload: { kind: "preset", id: p.id } })}
                className={[
                  "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition touch-manipulation",
                  active
                    ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.12)] ring-1 ring-[rgba(201,168,74,0.35)]"
                    : "border-black/10 bg-white/95 hover:border-black/18",
                ].join(" ")}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-lg border border-black/8 shadow-inner"
                  style={{ background: p.preview }}
                  aria-hidden
                />
                <span className="text-[11px] font-semibold text-[color:var(--lx-text)]">{bcpPick(p.label, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[color:rgba(61,52,40,0.45)]">
            {bcpPick(businessCardProductCopy.designBlocksHeading, lang)}
          </h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_CUSTOM_TEXT_BLOCK", side, lang })}
            className="inline-flex items-center justify-center rounded-full border border-[rgba(107,91,46,0.35)] bg-[rgba(201,168,74,0.12)] px-3 py-1.5 text-[11px] font-semibold text-[color:#5c4f2e] hover:bg-[rgba(201,168,74,0.2)] touch-manipulation"
          >
            {bcpPick(businessCardProductCopy.addCustomLine, lang)}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-[color:rgba(61,52,40,0.55)]">{bcpPick(businessCardProductCopy.selectBlockHint, lang)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {state.textBlocks.map((b) => {
            const visible = b.role === "custom" || state.textLayout.lineVisible[b.role as TextFieldRole];
            if (!visible && b.role !== "custom") return null;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectTextBlock(b.id)}
                className={[
                  "rounded-full px-3.5 py-2 text-[11px] font-semibold border transition touch-manipulation min-h-[40px]",
                  selectedTextBlockId === b.id
                    ? "border-[color:var(--lx-gold)] bg-[color:rgba(201,168,74,0.22)] text-[color:#3d3428] shadow-sm"
                    : "border-black/10 bg-white text-[color:var(--lx-text)] hover:border-black/20",
                ].join(" ")}
              >
                {blockChipLabel(b.role, b.text)}
              </button>
            );
          })}
        </div>

        {selectedBlock ? (
          <div className="mt-4 space-y-3 rounded-2xl border border-[rgba(201,168,74,0.28)] bg-white/95 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:rgba(201,168,74,0.85)]">
              {lang === "en" ? "Inspector" : "Inspector"}
            </p>
            {selectedBlock.role !== "custom" ? (
              <p className="text-[11px] text-[color:rgba(61,52,40,0.65)]">{bcpPick(businessCardProductCopy.linkedFieldHint, lang)}</p>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-[color:rgba(61,52,40,0.75)]">
                  {lang === "en" ? "Custom text" : "Texto personalizado"}
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm text-[color:var(--lx-text)]"
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nid = `c-${Date.now().toString(36)}`;
                      dispatch({
                        type: "DUPLICATE_CUSTOM_TEXT_BLOCK",
                        side,
                        sourceId: selectedBlock.id,
                        newId: nid,
                        lang,
                      });
                      onSelectTextBlock(nid);
                    }}
                    className="rounded-full border border-black/12 bg-white px-3 py-1.5 text-[11px] font-semibold text-[color:#5c4f2e] hover:bg-black/[0.03]"
                  >
                    {bcpPick(businessCardProductCopy.duplicateCustomBlock, lang)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTextBlock(null);
                      dispatch({ type: "REMOVE_TEXT_BLOCK", side, id: selectedBlock.id });
                    }}
                    className="rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-[11px] font-semibold text-rose-900 hover:bg-rose-100"
                  >
                    {bcpPick(businessCardProductCopy.removeCustomBlock, lang)}
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                X %
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
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
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
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
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.5)]">
                {bcpPick(businessCardProductCopy.fineNudge, lang)}
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold text-[color:var(--lx-text)] touch-manipulation"
                    onClick={() =>
                      dispatch({
                        type: "SET_TEXT_BLOCK",
                        side,
                        id: selectedBlock.id,
                        patch: { xPct: clampBlockAxis(selectedBlock.xPct - 1) },
                      })
                    }
                  >
                    X −
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold touch-manipulation"
                    onClick={() =>
                      dispatch({
                        type: "SET_TEXT_BLOCK",
                        side,
                        id: selectedBlock.id,
                        patch: { xPct: clampBlockAxis(selectedBlock.xPct + 1) },
                      })
                    }
                  >
                    X +
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold touch-manipulation"
                    onClick={() =>
                      dispatch({
                        type: "SET_TEXT_BLOCK",
                        side,
                        id: selectedBlock.id,
                        patch: { yPct: clampBlockAxis(selectedBlock.yPct - 1) },
                      })
                    }
                  >
                    Y −
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-black/10 bg-white py-1.5 text-sm font-bold touch-manipulation"
                    onClick={() =>
                      dispatch({
                        type: "SET_TEXT_BLOCK",
                        side,
                        id: selectedBlock.id,
                        patch: { yPct: clampBlockAxis(selectedBlock.yPct + 1) },
                      })
                    }
                  >
                    Y +
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                {lang === "en" ? "Width %" : "Ancho %"}
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
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
                  className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
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
              <div className="mt-2 flex gap-1">
                {([400, 500, 600, 700] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      dispatch({ type: "SET_TEXT_BLOCK", side, id: selectedBlock.id, patch: { fontWeight: w } })
                    }
                    className={[
                      "flex-1 rounded-lg py-2 text-[11px] font-semibold border touch-manipulation",
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
                Color
                <input
                  type="color"
                  className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-black/10"
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
                        "flex-1 rounded-lg py-1.5 text-[10px] font-bold border uppercase touch-manipulation",
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
          </div>
        ) : null}

        {state.logo.visible && state.logo.previewUrl ? (
          <div
            className={[
              "mt-4 rounded-2xl border p-4 space-y-2 transition-shadow",
              logoInspectorActive
                ? "border-[rgba(201,168,74,0.55)] bg-[rgba(201,168,74,0.08)] ring-2 ring-[rgba(201,168,74,0.25)]"
                : "border-black/10 bg-white/90",
            ].join(" ")}
          >
            <p className="text-xs font-semibold text-[color:var(--lx-text)]">{bcpPick(businessCardProductCopy.logoOnCanvasTitle, lang)}</p>
            <p className="text-[11px] text-[color:rgba(61,52,40,0.65)]">{bcpPick(businessCardProductCopy.adjustLogoHint, lang)}</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10px] font-semibold uppercase text-[color:rgba(61,52,40,0.55)]">
                X %
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-black/10 px-1 py-1.5 text-xs"
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
                  className="mt-1 w-full rounded-lg border border-black/10 px-1 py-1.5 text-xs"
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
                  className="mt-1 w-full rounded-lg border border-black/10 px-1 py-1.5 text-xs"
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
        <h2 className="text-lg font-semibold text-[color:var(--lx-text)]">{bcPick(businessCardBuilderCopy.fieldsTitle, lang)}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {FIELD_ORDER.map((role) => {
            const max = TEXT_FIELD_MAX[role];
            const label = businessCardBuilderCopy.fieldLabels[role];
            return (
              <div key={role}>
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-[color:rgba(61,52,40,0.85)]">{bcPick(label, lang)}</label>
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
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[color:var(--lx-text)]"
                  value={state.fields[role]}
                  maxLength={max ?? 200}
                  onChange={(e) => dispatch({ type: "SET_FIELD", side, role, value: e.target.value })}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <h3 className="text-sm font-semibold text-[color:var(--lx-text)]">{bcPick(businessCardBuilderCopy.layoutTitle, lang)}</h3>
        <p className="mt-1 text-[11px] text-[color:rgba(61,52,40,0.55)]">
          {lang === "en"
            ? "Legacy anchors apply when templates do not use freeform blocks."
            : "Anclas heredadas cuando la plantilla no usa bloques libres."}
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
                    "flex-1 min-h-[44px] rounded-lg text-xs font-semibold capitalize touch-manipulation",
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
                    "flex-1 min-h-[44px] rounded-lg text-xs font-semibold capitalize touch-manipulation",
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
                className="flex-1 min-h-[44px]"
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
                className="flex-1 min-h-[44px]"
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
                className="flex-1 min-h-[44px]"
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
                className="flex-1 min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-5 py-2 text-sm font-semibold text-[color:var(--lx-cta-light)] cursor-pointer hover:bg-[color:var(--lx-cta-dark-hover)] transition touch-manipulation">
            {bcPick(businessCardBuilderCopy.uploadLogo, lang)}
            <input type="file" accept={LOGO_ACCEPT} className="hidden" onChange={onFile} />
          </label>
          {state.logo.previewUrl ? (
            <button
              type="button"
              onClick={() => {
                onPickLogo(null);
              }}
              className="min-h-[44px] text-sm font-medium text-[color:rgba(61,52,40,0.75)] underline-offset-2 hover:underline"
            >
              {bcPick(businessCardBuilderCopy.removeLogo, lang)}
            </button>
          ) : null}
          <span className="text-[11px] text-[color:rgba(61,52,40,0.55)]">
            PNG, JPG, WebP, SVG • max {LOGO_MAX_MB} MB
          </span>
        </div>
        <label className="mt-3 flex min-h-[44px] items-center gap-2 text-xs text-[color:rgba(61,52,40,0.7)]">
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
