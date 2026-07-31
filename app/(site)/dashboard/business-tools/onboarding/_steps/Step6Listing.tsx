"use client";

import { useState } from "react";
import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayload } from "../wizardTypes";
import { businessApiFetch } from "../../_components/businessApiClient";

const SUPPORTED_SOURCES = [
  { value: "listings", label: "Bienes raíces / Listings" },
  { value: "restaurantes_public_listings", label: "Restaurantes" },
  { value: "servicios_public_listings", label: "Servicios" },
  { value: "autos_classifieds_listings", label: "Autos" },
] as const;

type VerifyState = "idle" | "checking" | "verified" | "pending" | "unsupported";

export function Step6Listing({
  t,
  payload,
  onChange,
}: {
  t: BusinessIdentityCopy["wizard"]["step6"];
  payload: WizardDraftPayload;
  onChange: (next: WizardDraftPayload) => void;
}) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const skipped = payload.listingCandidate === null;

  async function checkOwnership(source: string, id: string) {
    if (!source || !id) return;
    setVerifyState("checking");
    const result = await businessApiFetch<{ result: { ok: boolean; reasonCode?: string } }>("/api/dashboard/business/verify-listing", {
      method: "POST",
      body: JSON.stringify({ listingSource: source, listingId: id }),
    });
    if (!result.ok) {
      setVerifyState("pending");
      return;
    }
    if (result.data.result.ok) setVerifyState("verified");
    else if (result.data.result.reasonCode === "unsupported_listing_source") setVerifyState("unsupported");
    else setVerifyState("pending");
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onChange({ ...payload, listingCandidate: null });
            setVerifyState("idle");
          }}
          className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold ${
            skipped ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
          }`}
        >
          {t.skipLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...payload, listingCandidate: { listingSource: "", listingId: "" } })}
          className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold ${
            !skipped ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
          }`}
        >
          {t.selectLabel}
        </button>
      </div>

      {!skipped && payload.listingCandidate ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="listing-source" className="block text-xs font-semibold text-[#3D3428]">
              {t.sourceLabel}
            </label>
            <select
              id="listing-source"
              value={payload.listingCandidate.listingSource}
              onChange={(e) => {
                onChange({ ...payload, listingCandidate: { listingSource: e.target.value, listingId: payload.listingCandidate?.listingId ?? "" } });
                setVerifyState("idle");
              }}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
            >
              <option value="">—</option>
              {SUPPORTED_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="listing-id" className="block text-xs font-semibold text-[#3D3428]">
              {t.idLabel}
            </label>
            <input
              id="listing-id"
              type="text"
              value={payload.listingCandidate.listingId}
              onChange={(e) => {
                onChange({ ...payload, listingCandidate: { listingSource: payload.listingCandidate?.listingSource ?? "", listingId: e.target.value } });
                setVerifyState("idle");
              }}
              onBlur={() => void checkOwnership(payload.listingCandidate?.listingSource ?? "", payload.listingCandidate?.listingId ?? "")}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
            />
          </div>
          <div className="sm:col-span-2" role="status" aria-live="polite">
            {verifyState === "checking" ? <p className="text-xs text-[#7A7164]">{t.verifying}</p> : null}
            {verifyState === "verified" ? <p className="text-xs font-semibold text-[#2A4536]">{t.verifiedOk}</p> : null}
            {verifyState === "pending" ? <p className="text-xs text-[#8A6B1F]">{t.verifiedPending}</p> : null}
            {verifyState === "unsupported" ? <p className="text-xs text-[#7A1E2C]">{t.unsupportedSource}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
