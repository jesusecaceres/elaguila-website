"use client";

import type { DealerStructuredAddressPatch } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";

const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

export type AutosDealerStructuredAddressLabels = {
  streetNumber: string;
  streetName: string;
  unitOrSuite: string;
  city: string;
  state: string;
  zipCode: string;
  helperMaps: string;
  helperSearch: string;
};

export function AutosDealerStructuredAddressFields({
  labels,
  values,
  onPatch,
}: {
  labels: AutosDealerStructuredAddressLabels;
  values: DealerStructuredAddressPatch;
  onPatch: (patch: Partial<DealerStructuredAddressPatch>) => void;
}) {
  return (
    <div className="sm:col-span-2 space-y-4">
      <p className="text-xs leading-relaxed text-[color:var(--lx-muted)]">
        {labels.helperMaps} {labels.helperSearch}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>{labels.streetNumber}</label>
          <input
            className={INPUT}
            value={values.dealerStreetNumber ?? ""}
            onChange={(e) => onPatch({ dealerStreetNumber: e.target.value.trim() || undefined })}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={LABEL}>{labels.streetName}</label>
          <input
            className={INPUT}
            value={values.dealerStreetName ?? ""}
            onChange={(e) => onPatch({ dealerStreetName: e.target.value.trim() || undefined })}
            autoComplete="street-address"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>{labels.unitOrSuite}</label>
          <input
            className={INPUT}
            value={values.dealerUnitOrSuite ?? ""}
            onChange={(e) => onPatch({ dealerUnitOrSuite: e.target.value.trim() || undefined })}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={LABEL}>{labels.city}</label>
          <input
            className={INPUT}
            value={values.dealerAddressCity ?? ""}
            onChange={(e) => onPatch({ dealerAddressCity: e.target.value.trim() || undefined })}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label className={LABEL}>{labels.state}</label>
          <input
            className={INPUT}
            value={values.dealerAddressState ?? ""}
            onChange={(e) => onPatch({ dealerAddressState: e.target.value.trim() || undefined })}
            autoComplete="address-level1"
          />
        </div>
        <div>
          <label className={LABEL}>{labels.zipCode}</label>
          <input
            className={INPUT}
            inputMode="numeric"
            value={values.dealerAddressZip ?? ""}
            onChange={(e) => onPatch({ dealerAddressZip: e.target.value.trim() || undefined })}
            autoComplete="postal-code"
          />
        </div>
      </div>
    </div>
  );
}
