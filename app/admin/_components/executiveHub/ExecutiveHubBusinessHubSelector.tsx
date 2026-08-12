"use client";

import { useEffect, useState } from "react";
import { adminCtaChipSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import { searchBusinessHubAction, getBusinessHubByReferenceAction } from "@/app/admin/executiveHubActions";
import type { BusinessHubSummary } from "./businessHubAdapter";

/**
 * Business Hub Search / Select / Clear / Preview (Gate 2 + 3 + 4).
 *
 * There is no real Business Hub directory yet (confirmed in Gate 1), so `search` always
 * comes back empty with an honest reason instead of fake matches. The manual reference
 * link fallback keeps the V2 behavior working for admins who already have a URL to paste.
 * The instant a real Business Hub service is wired into `businessHubAdapter.ts`, this
 * component starts returning/selecting real results with zero changes needed here.
 */
export function ExecutiveHubBusinessHubSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (link: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<BusinessHubSummary[]>([]);
  const [reason, setReason] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState(value);
  const [connected, setConnected] = useState<BusinessHubSummary | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setManualLink(value);
    if (!value) {
      setConnected(null);
      return;
    }
    let cancelled = false;
    setResolving(true);
    getBusinessHubByReferenceAction(value)
      .then((summary) => {
        if (!cancelled) setConnected(summary);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function runSearch() {
    setSearching(true);
    setSearched(false);
    try {
      const res = await searchBusinessHubAction(query);
      setResults(res.results);
      setReason(res.reason);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function selectBusiness(biz: BusinessHubSummary) {
    onChange(biz.previewUrl);
    setConnected(biz);
  }

  function clearBusiness() {
    onChange("");
    setConnected(null);
    setManualLink("");
  }

  return (
    <div className="space-y-4">
      {!value ? (
        <div className="rounded-lg border border-dashed border-[#E8DFD0] bg-[#FAF7F2] p-4">
          <p className="text-sm font-semibold text-[#5C5346]">No Business Hub connected.</p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Business Hub by name, category, or city…"
              className={adminInputClass}
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching}
              className={`${adminCtaChipSecondary} shrink-0 text-xs`}
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </div>

          {searched ? (
            results.length === 0 ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
                {reason}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {results.map((biz) => (
                  <li key={biz.id}>
                    <button
                      type="button"
                      onClick={() => selectBusiness(biz)}
                      className="flex w-full items-center gap-3 rounded-lg border border-[#E8DFD0] bg-white p-3 text-left hover:bg-[#FAF7F2]"
                    >
                      {biz.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={biz.logoUrl} alt={biz.name} className="h-10 w-10 rounded-lg border border-[#E8DFD0] object-cover" />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-[#E8DFD0]" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#1E1810]">{biz.name}</span>
                        <span className="block truncate text-xs text-[#7A7164]">{biz.category} · {biz.city}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          <details className="mt-3 text-xs text-[#7A7164]">
            <summary className="cursor-pointer font-semibold">Or paste a reference link manually</summary>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={manualLink}
                onChange={(e) => setManualLink(e.target.value)}
                placeholder="https://…"
                className={adminInputClass}
              />
              <button
                type="button"
                disabled={!manualLink.trim()}
                onClick={() => onChange(manualLink.trim())}
                className={`${adminCtaChipSecondary} shrink-0 text-xs disabled:opacity-50`}
              >
                Link
              </button>
            </div>
          </details>
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-start gap-3">
            {connected?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={connected.logoUrl} alt={connected.name} className="h-12 w-12 rounded-lg border border-emerald-200 object-cover" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-emerald-300 text-[10px] text-emerald-900">
                No logo
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-emerald-950">{connected?.name ?? "Business Hub — linked"}</p>
              <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-emerald-900">
                <div><dt className="inline font-semibold">Category: </dt><dd className="inline">{connected?.category ?? "—"}</dd></div>
                <div><dt className="inline font-semibold">City: </dt><dd className="inline">{connected?.city ?? "—"}</dd></div>
                <div><dt className="inline font-semibold">Status: </dt><dd className="inline">{connected?.status ?? "—"}</dd></div>
              </dl>
              {!connected ? (
                <p className="mt-2 text-xs leading-relaxed text-emerald-900/90">
                  {resolving
                    ? "Checking Business Hub directory…"
                    : "This is a manual reference link — the Business Hub directory service isn't implemented yet, so Name/Category/City/Status above can't be resolved. Selecting from Search once that service exists will populate these automatically."}
                </p>
              ) : null}
              <p className="mt-2 truncate text-[11px] text-emerald-800/80">{value}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <a href={value} target="_blank" rel="noreferrer" className={`${adminCtaChipSecondary} text-xs`}>
              Open Preview
            </a>
            <button type="button" onClick={clearBusiness} className={`${adminCtaChipSecondary} text-xs`}>
              Clear
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled
        title="Multiple businesses per executive activate once Business Hub ships a one-to-many schema. Today's executives.business_hub_link column holds exactly one reference."
        className={`${adminCtaChipSecondary} w-full text-xs opacity-50`}
      >
        + Add another business (coming with multi-business Business Hub schema)
      </button>
    </div>
  );
}
