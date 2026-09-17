"use client";

import { useEffect, useState } from "react";
import { businessApiFetch } from "../../_components/businessApiClient";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayloadV2 } from "../wizardTypes";

type OwnedListingCandidate = { listingSource: string; listingId: string; displayName?: string; city?: string; imageUrl?: string; status?: string };

const SOURCE_LABELS: Record<Lang, Record<string, string>> = {
  es: {
    listings: "Clasificados general",
    restaurantes_public_listings: "Restaurantes",
    servicios_public_listings: "Servicios",
    autos_classifieds_listings: "Autos",
  },
  en: {
    listings: "General classifieds",
    restaurantes_public_listings: "Restaurants",
    servicios_public_listings: "Services",
    autos_classifieds_listings: "Autos",
  },
};

function isSelected(payload: WizardDraftPayloadV2, c: OwnedListingCandidate): boolean {
  return payload.selectedListingCandidates.some((s) => s.listingSource === c.listingSource && s.listingId === c.listingId);
}

export function Step8OwnedListings({
  t,
  lang,
  payload,
  onChange,
}: {
  t: BusinessIdentityCopy["wizard"]["step8"];
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [candidates, setCandidates] = useState<OwnedListingCandidate[]>([]);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackSource, setFallbackSource] = useState("listings");
  const [fallbackId, setFallbackId] = useState("");

  async function load() {
    setState("loading");
    const result = await businessApiFetch<{ candidates: OwnedListingCandidate[] }>("/api/dashboard/business/discover-listings");
    if (result.ok) {
      setCandidates(result.data.candidates);
      setState("ready");
    } else {
      setState("error");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function toggleCandidate(c: OwnedListingCandidate) {
    const selected = isSelected(payload, c);
    onChange({
      ...payload,
      listingsSkipped: false,
      selectedListingCandidates: selected
        ? payload.selectedListingCandidates.filter((s) => !(s.listingSource === c.listingSource && s.listingId === c.listingId))
        : [...payload.selectedListingCandidates, { listingSource: c.listingSource, listingId: c.listingId }],
    });
  }

  function addFallback() {
    if (!fallbackId.trim()) return;
    onChange({ ...payload, listingsSkipped: false, selectedListingCandidates: [...payload.selectedListingCandidates, { listingSource: fallbackSource, listingId: fallbackId.trim() }] });
    setFallbackId("");
  }

  function markNoneOfTheseAreMine() {
    onChange({ ...payload, listingsSkipped: true, selectedListingCandidates: [] });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      {state === "loading" ? (
        <p role="status" aria-live="polite" className="text-sm text-[#5C5346]">
          {t.loading}
        </p>
      ) : state === "error" ? (
        <div role="alert" className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
          <p className="text-sm text-[#7A1E2C]">{t.error}</p>
          <button type="button" onClick={() => void load()} className="mt-2 text-xs font-semibold text-[#3D3428] underline">
            {t.retry}
          </button>
        </div>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-[#5C5346]">{t.none}</p>
      ) : (
        <>
          <p className="text-sm text-[#5C5346]">{t.lead}</p>
          <ul className="space-y-3">
            {candidates.map((c) => {
              const selected = isSelected(payload, c);
              return (
                <li key={`${c.listingSource}-${c.listingId}`} className={`rounded-2xl border p-4 ${selected ? "border-[#C9A84A] bg-[#FBF7EF]" : "border-[#E8DFD0] bg-white"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-xl bg-[#F3EBDD]" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A6B1F]">{SOURCE_LABELS[lang][c.listingSource] ?? c.listingSource}</p>
                        <p className="break-words text-sm font-bold text-[#1E1810]">{c.displayName ?? "—"}</p>
                        {c.city ? <p className="break-words text-xs text-[#7A7164]">{c.city}</p> : null}
                        <p className="mt-1 break-words text-xs text-[#7A7164]">
                          {t.leonixAdIdLabel}: {c.listingId}
                          {c.status ? ` · ${t.statusLabel}: ${c.status}` : ""}
                        </p>
                      </div>
                    </div>
                    <label className="flex min-h-[44px] shrink-0 items-center gap-2 border-t border-dashed border-[#E8DFD0] pt-3 text-xs font-semibold text-[#3D3428] sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0">
                      <input type="checkbox" checked={selected} onChange={() => toggleCandidate(c)} className="h-4 w-4 shrink-0" />
                      <span>{t.confirmCandidate}</span>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
          <label className="flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#3D3428]">
            <input
              type="checkbox"
              checked={payload.listingsSkipped}
              onChange={(e) => (e.target.checked ? markNoneOfTheseAreMine() : onChange({ ...payload, listingsSkipped: false }))}
              className="h-4 w-4 shrink-0"
            />
            <span>{t.noneOfTheseLabel}</span>
          </label>
        </>
      )}

      <div>
        <button type="button" onClick={() => setShowFallback((v) => !v)} className="text-xs font-semibold text-[#7A1E2C] underline">
          {t.fallbackToggle}
        </button>
        {showFallback ? (
          <div className="mt-2 grid grid-cols-1 gap-2 rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-4 sm:grid-cols-3">
            <div>
              <label htmlFor="fallbackSource" className="block text-xs font-semibold text-[#3D3428]">
                {t.fallbackSourceLabel}
              </label>
              <select id="fallbackSource" value={fallbackSource} onChange={(e) => setFallbackSource(e.target.value)} className="mt-1 w-full min-h-[40px] rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-xs">
                {Object.entries(SOURCE_LABELS[lang]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="fallbackId" className="block text-xs font-semibold text-[#3D3428]">
                {t.fallbackIdLabel}
              </label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <input id="fallbackId" type="text" value={fallbackId} onChange={(e) => setFallbackId(e.target.value)} className="min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-xs" />
                <button type="button" onClick={addFallback} className="min-h-[44px] shrink-0 rounded-lg border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#3D3428] hover:bg-[#FAF7F2]">
                  {t.confirmCandidate}
                </button>
              </div>
            </div>
            <p className="text-xs text-[#7A7164] sm:col-span-3">{t.fallbackNote}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
