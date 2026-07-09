"use client";

/**
 * Promo Admin OS quick-create controls (Gate PROMO-ADMIN-OS-QUICK-CREATE-01).
 *
 * Client enhancer for the server-rendered create form (#promo-code-create-form).
 * It only fills existing form fields — the server action remains the single
 * source of truth for code normalization, generation, and duplicate checks.
 */

import { useCallback, useEffect, useState } from "react";
import { adminInputClass } from "@/app/admin/_components/adminTheme";
import { PROMO_CODE_QUICK_PRESETS } from "@/app/admin/_lib/promoCodeConstants";
import { getPromoPresetGuide } from "@/app/admin/_lib/promoCodePresetGuide";
import {
  promoFieldBadgeClass,
  promoFieldBadgeLabel,
  PROMO_OS_CREAM_PANEL,
  PROMO_OS_SERIF_TITLE,
} from "@/app/admin/_lib/promoCodeOsV2Theme";

const FORM_ID = "promo-code-create-form";

type CodeMode = "auto" | "custom";

function getForm(): HTMLFormElement | null {
  const el = document.getElementById(FORM_ID);
  return el instanceof HTMLFormElement ? el : null;
}

function setField(form: HTMLFormElement, name: string, value: string) {
  const el = form.elements.namedItem(name);
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/** Auto mode keeps the code blank so the server generates a Leonix code on save. */
function applyCodeMode(form: HTMLFormElement, mode: CodeMode) {
  const code = form.elements.namedItem("code");
  if (!(code instanceof HTMLInputElement)) return;
  if (mode === "auto") {
    code.value = "";
    code.readOnly = true;
    code.placeholder = "(auto-generated Leonix code on save)";
  } else {
    code.readOnly = false;
    code.placeholder = "LX-PROMO-…";
    code.focus();
  }
}

function readinessClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-950";
    case "draft":
      return "bg-amber-100 text-amber-950";
    case "coming_later":
      return "bg-[#F4F0E8] text-[#7A7164]";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

function readinessLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active now";
    case "draft":
      return "Draft / verify";
    case "coming_later":
      return "Coming later";
    default:
      return status;
  }
}

export function PromoCodeQuickCreateControls() {
  const [presetId, setPresetId] = useState("custom");
  const [codeMode, setCodeMode] = useState<CodeMode>("auto");

  useEffect(() => {
    const form = getForm();
    if (form) applyCodeMode(form, "auto");
  }, []);

  const applyPreset = useCallback((id: string) => {
    setPresetId(id);
    const preset = PROMO_CODE_QUICK_PRESETS.find((p) => p.id === id);
    const form = getForm();
    if (!form || !preset || preset.disabled) return;
    if (id === "custom") return;

    const f = preset.fields ?? {};
    if (f.code_type) setField(form, "code_type", f.code_type);
    if (f.promo_type) setField(form, "promo_type", f.promo_type);
    if (f.percent_off !== undefined) setField(form, "percent_off", f.percent_off);
    if (f.amount_off_dollars !== undefined) setField(form, "amount_off_dollars", f.amount_off_dollars);
    if (f.category !== undefined) setField(form, "category", f.category);
    if (f.package_scope !== undefined) {
      setField(form, "package_scope", f.package_scope);
      setField(form, "package_scope_custom", "");
    }
    if (f.status) setField(form, "status", f.status);
    if (f.notes !== undefined) setField(form, "notes", f.notes);
    if (f.code_mode) {
      setCodeMode(f.code_mode);
      applyCodeMode(form, f.code_mode);
    }
  }, []);

  const changeCodeMode = useCallback((mode: CodeMode) => {
    setCodeMode(mode);
    const form = getForm();
    if (form) applyCodeMode(form, mode);
  }, []);

  const activePreset = PROMO_CODE_QUICK_PRESETS.find((p) => p.id === presetId);
  const guide = getPromoPresetGuide(presetId);
  const isComingLater = activePreset?.disabled || guide.readiness === "coming_later";

  return (
    <div className={`${PROMO_OS_CREAM_PANEL} p-3`}>
      <p className={PROMO_OS_SERIF_TITLE}>Quick create · Preset directory</p>
      <p className="mt-1 text-[10px] text-[#7A7164]">
        Pick a preset to fill safe defaults. Required fields still apply — review before create.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#5C5346]">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[#1E1810]">Preset</span>
            <span className={promoFieldBadgeClass("required")}>{promoFieldBadgeLabel("required")}</span>
          </span>
          <select
            name="quick_preset"
            value={presetId}
            onChange={(e) => applyPreset(e.target.value)}
            className={`${adminInputClass} mt-1`}
          >
            {PROMO_CODE_QUICK_PRESETS.map((p) => (
              <option key={p.id} value={p.id} disabled={p.disabled}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
            Sets safe defaults for category, discount, and package scope.
          </span>
        </label>
        <label className="block text-xs font-semibold text-[#5C5346]">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[#1E1810]">Code mode</span>
            <span className={promoFieldBadgeClass("optional")}>{promoFieldBadgeLabel("optional")}</span>
          </span>
          <select
            name="code_mode"
            value={codeMode}
            onChange={(e) => changeCodeMode(e.target.value === "custom" ? "custom" : "auto")}
            className={`${adminInputClass} mt-1`}
          >
            <option value="auto">Auto-generate (recommended)</option>
            <option value="custom">Custom code</option>
          </select>
          <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
            Auto-generate is recommended. Custom only when admin needs a known code.
          </span>
        </label>
      </div>

      <div
        className={`mt-3 rounded-lg border p-3 text-[10px] leading-relaxed ${
          isComingLater ? "border-[#7A1E2C]/35 bg-[#FDF2F4]" : "border-[#C9B46A]/50 bg-[#FFFCF7]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-[#1E1810]">{guide.title}</p>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${readinessClass(guide.readiness)}`}>
            {readinessLabel(guide.readiness)}
          </span>
          {isComingLater ? (
            <span className={promoFieldBadgeClass("coming_later")}>{promoFieldBadgeLabel("coming_later")}</span>
          ) : null}
        </div>
        <p className="mt-2 text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Purpose:</span> {guide.purpose}
        </p>
        <p className="mt-1 text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Best use:</span> {guide.bestUse}
        </p>
        <p className="mt-1 text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Required:</span> {guide.requiredFields.join(" · ")}
        </p>
        <p className="mt-1 text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Optional tracking:</span> {guide.optionalFields.join(" · ")}
        </p>
        <p className="mt-1 text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Applies to:</span> {guide.appliesTo}
        </p>
        <p className="mt-1 text-[#5C5346]">
          <span className="font-semibold text-[#1E1810]">Excludes:</span> {guide.excludes}
        </p>
        <p className={`mt-2 font-medium ${isComingLater ? "text-[#7A1E2C]" : "text-[#6B5B2E]"}`}>
          {guide.readinessNote}
        </p>
      </div>

      {activePreset && activePreset.fields?.notes ? (
        <p className="mt-2 text-[10px] text-[#5C5346]">{activePreset.fields.notes}</p>
      ) : null}
    </div>
  );
}
