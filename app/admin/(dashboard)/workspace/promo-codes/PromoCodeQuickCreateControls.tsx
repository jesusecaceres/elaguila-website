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

export function PromoCodeQuickCreateControls() {
  const [presetId, setPresetId] = useState("custom");
  const [codeMode, setCodeMode] = useState<CodeMode>("auto");

  // Default to auto-generate on mount (blank code = server-generated code).
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

  return (
    <div className="rounded-xl border border-[#C9B46A]/60 bg-[#FBF7EF] p-3">
      <p className="text-xs font-bold text-[#1E1810]">Quick create (preset)</p>
      <p className="mt-1 text-[10px] text-[#7A7164]">
        Pick a preset to fill category, discount, and Revenue OS package scope automatically. You can still edit any field
        before saving.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#5C5346]">
          Preset
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
        </label>
        <label className="block text-xs font-semibold text-[#5C5346]">
          Code mode
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
            Leave blank to auto-generate a Leonix code on save.
          </span>
        </label>
      </div>
      {activePreset && activePreset.fields?.notes ? (
        <p className="mt-2 text-[10px] text-[#5C5346]">{activePreset.fields.notes}</p>
      ) : null}
    </div>
  );
}
