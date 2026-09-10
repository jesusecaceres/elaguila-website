"use client";

import { useMemo, useState } from "react";
import { REGIONS, regionsSortedByLabel } from "@/app/lib/business/regions";
import { countryLabel } from "@/app/lib/business/countries";
import type { CoverageRegionSelection } from "@/app/lib/business/types";

type Lang = "es" | "en";

/**
 * Region shortcuts for multi-country coverage (Gate BCO-3R-B.3, Phase 7/9). Clicking a region
 * opens a panel offering two explicit choices — "select all countries in this region" (behind a
 * second confirm step) or "choose specific countries" (a searchable per-region checklist) — so a
 * region shortcut never silently claims every country in it.
 */
export function RegionShortcutBar({
  lang,
  legend,
  selectedCountryCodes,
  regionSelections,
  onChange,
  t,
}: {
  lang: Lang;
  legend: string;
  selectedCountryCodes: readonly string[];
  regionSelections: readonly CoverageRegionSelection[];
  onChange: (next: { countryCodes: string[]; regionSelections: CoverageRegionSelection[] }) => void;
  t: {
    selectAllLabel: (n: number) => string;
    confirmLabel: string;
    cancelLabel: string;
    chooseSpecificLabel: string;
    searchPlaceholder: string;
    noResultsLabel: string;
    countSelectedInRegion: (n: number) => string;
  };
}) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [query, setQuery] = useState("");

  const sortedRegions = useMemo(() => regionsSortedByLabel(lang), [lang]);
  const region = REGIONS.find((r) => r.code === activeRegion) ?? null;

  const regionCountryOptions = useMemo(() => {
    if (!region) return [];
    return region.countryCodes.map((code) => ({ code, label: countryLabel(code, lang) })).sort((a, b) => a.label.localeCompare(b.label, lang === "es" ? "es" : "en"));
  }, [region, lang]);

  const filteredRegionOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regionCountryOptions;
    return regionCountryOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [regionCountryOptions, query]);

  function openRegion(code: string) {
    setActiveRegion((cur) => (cur === code ? null : code));
    setPendingConfirm(false);
    setQuery("");
  }

  function confirmSelectAll() {
    if (!region) return;
    const merged = Array.from(new Set([...selectedCountryCodes, ...region.countryCodes]));
    const nextSelections = [...regionSelections.filter((s) => s.regionCode !== region.code), { regionCode: region.code, wholeRegion: true, countryCodes: region.countryCodes }];
    onChange({ countryCodes: merged, regionSelections: nextSelections });
    setPendingConfirm(false);
  }

  function toggleCountry(code: string) {
    const next = selectedCountryCodes.includes(code) ? selectedCountryCodes.filter((c) => c !== code) : [...selectedCountryCodes, code];
    onChange({ countryCodes: next, regionSelections: [...regionSelections] });
  }

  const selectedInRegion = region ? region.countryCodes.filter((c) => selectedCountryCodes.includes(c)).length : 0;

  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-[#3D3428]">{legend}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={legend}>
        {sortedRegions.map((r) => {
          const count = r.countryCodes.filter((c) => selectedCountryCodes.includes(c)).length;
          return (
            <button
              key={r.code}
              type="button"
              aria-expanded={activeRegion === r.code}
              onClick={() => openRegion(r.code)}
              className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                activeRegion === r.code ? "border-[#C9A84A] bg-[#FBF7EF]" : "border-[#E8DFD0] bg-white"
              }`}
            >
              {r[lang]}
              {count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {region ? (
        <div className="mt-2 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-3">
          <p className="text-xs font-semibold text-[#1E1810]">{t.countSelectedInRegion(selectedInRegion)}</p>

          {!pendingConfirm ? (
            <button
              type="button"
              onClick={() => setPendingConfirm(true)}
              className="mt-2 min-h-[36px] rounded-lg border border-[#C9A84A] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1810]"
            >
              {t.selectAllLabel(region.countryCodes.length)}
            </button>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#C9A84A] bg-white p-2">
              <span className="text-xs text-[#5C5346]">{t.selectAllLabel(region.countryCodes.length)}</span>
              <button type="button" onClick={confirmSelectAll} className="min-h-[32px] rounded-lg bg-[#C9A84A] px-3 py-1 text-xs font-bold text-[#1E1810]">
                {t.confirmLabel}
              </button>
              <button type="button" onClick={() => setPendingConfirm(false)} className="min-h-[32px] rounded-lg border border-[#E8DFD0] px-3 py-1 text-xs font-semibold text-[#3D3428]">
                {t.cancelLabel}
              </button>
            </div>
          )}

          <p className="mt-3 text-xs font-semibold text-[#3D3428]">{t.chooseSpecificLabel}</p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-sm text-[#1E1810]"
          />
          <div className="mt-2 grid max-h-56 grid-cols-1 gap-1 overflow-auto sm:grid-cols-2" role="group" aria-label={t.chooseSpecificLabel}>
            {filteredRegionOptions.length === 0 ? (
              <p className="text-xs text-[#7A7164]">{t.noResultsLabel}</p>
            ) : (
              filteredRegionOptions.map((o) => {
                const checked = selectedCountryCodes.includes(o.code);
                return (
                  <label key={o.code} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#3D3428] hover:bg-white">
                    <input type="checkbox" checked={checked} onChange={() => toggleCountry(o.code)} className="h-4 w-4" />
                    {o.label}
                  </label>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
