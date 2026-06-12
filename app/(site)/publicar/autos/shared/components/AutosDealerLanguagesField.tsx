"use client";

import { useState } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  addAutosDealerCustomLanguage,
  AUTOS_DEALER_LANGUAGE_PRESET_EN,
  AUTOS_DEALER_LANGUAGE_PRESET_ES,
  AUTOS_DEALER_LANGUAGES_MAX,
  autosDealerCustomLanguages,
  dealerLanguagesForOutput,
  normalizeDealerLanguages,
  removeAutosDealerLanguage,
  toggleAutosDealerPresetLanguage,
} from "@/app/lib/clasificados/autos/autosDealerLanguages";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

function chipSelectedClass(selected: boolean): string {
  return selected
    ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)]"
    : "border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]";
}

export function AutosDealerLanguagesField({
  lang,
  copy,
  languages,
  onChange,
}: {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  languages: string[] | undefined;
  onChange: (next: string[]) => void;
}) {
  const t = copy.app.dealer.languages;
  const selected = normalizeDealerLanguages(languages, { liveDraft: true });
  const atLimit = selected.length >= AUTOS_DEALER_LANGUAGES_MAX;
  const [otherOpen, setOtherOpen] = useState(() => autosDealerCustomLanguages(languages).length > 0);
  const [customPending, setCustomPending] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const esSelected = selected.some((l) => l === AUTOS_DEALER_LANGUAGE_PRESET_ES);
  const enSelected = selected.some((l) => l === AUTOS_DEALER_LANGUAGE_PRESET_EN);

  const apply = (next: string[]) => {
    onChange(dealerLanguagesForOutput(next));
  };

  const togglePreset = (preset: typeof AUTOS_DEALER_LANGUAGE_PRESET_ES | typeof AUTOS_DEALER_LANGUAGE_PRESET_EN) => {
    apply(toggleAutosDealerPresetLanguage(selected, preset));
  };

  const addCustom = () => {
    const result = addAutosDealerCustomLanguage(selected, customPending, { liveDraft: true });
    if (!result.ok) {
      if (result.reason === "empty") setCustomError(lang === "es" ? "Escribe un idioma." : "Enter a language.");
      else if (result.reason === "duplicate") {
        setCustomError(lang === "es" ? "Este idioma ya está agregado." : "This language is already added.");
      } else setCustomError(t.limitReached);
      return;
    }
    setCustomError(null);
    setCustomPending("");
    apply(result.languages);
  };

  return (
    <div className="mt-6">
      <p className={LABEL}>{t.heading}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{t.helper}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={esSelected}
          disabled={!esSelected && atLimit}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${chipSelectedClass(esSelected)}`}
          onClick={() => togglePreset(AUTOS_DEALER_LANGUAGE_PRESET_ES)}
        >
          {t.presetSpanish}
        </button>
        <button
          type="button"
          aria-pressed={enSelected}
          disabled={!enSelected && atLimit}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${chipSelectedClass(enSelected)}`}
          onClick={() => togglePreset(AUTOS_DEALER_LANGUAGE_PRESET_EN)}
        >
          {t.presetEnglish}
        </button>
        <button
          type="button"
          aria-pressed={otherOpen}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${chipSelectedClass(otherOpen)}`}
          onClick={() => setOtherOpen((v) => !v)}
        >
          {t.presetOther}
        </button>
      </div>

      {selected.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {selected.map((label) => (
            <li key={label}>
              <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-3 py-1 text-sm font-semibold text-[color:var(--lx-text)]">
                {label}
                <button
                  type="button"
                  className="ml-0.5 rounded-full px-1 text-[color:var(--lx-muted)] hover:text-red-800"
                  aria-label={`${t.removeChip} ${label}`}
                  onClick={() => apply(removeAutosDealerLanguage(selected, label))}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {atLimit ? (
        <p className="mt-2 text-[11px] font-medium text-amber-900">{t.limitReached}</p>
      ) : null}

      {otherOpen ? (
        <div className="mt-4 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-3">
          <label className={LABEL}>{t.customLabel}</label>
          <input
            className={INPUT}
            value={customPending}
            placeholder={t.customPlaceholder}
            onChange={(e) => {
              setCustomPending(autosDraftTextValue(e.target.value) ?? "");
              setCustomError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <p className="mt-1.5 text-[10px] leading-relaxed text-[color:var(--lx-muted)]">{t.customExamplesHelper}</p>
          {customError ? <p className="mt-2 text-[11px] font-medium text-red-800">{customError}</p> : null}
          <button
            type="button"
            disabled={atLimit}
            className="mt-3 rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={addCustom}
          >
            {t.addCustom}
          </button>
        </div>
      ) : null}
    </div>
  );
}
