"use client";

import { useCallback, useState } from "react";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosVinDecodeButtonLabel,
  autosVinDecodeError,
  autosVinDecodeHelper,
  autosVinDecodeInvalid,
  autosVinDecodeLoading,
  autosVinDecodePartial,
  autosVinDecodeSuccess,
} from "@/app/lib/clasificados/autos/autosVinDecodeCopy";
import { isValidVinCandidate, normalizeVinInput } from "@/app/lib/clasificados/autos/autosNhtsaVinDecode";
import {
  buildVinDecodeFillEmptyPatch,
  pickAutosVehicleStructuredFields,
  type AutosVehicleStructuredFields,
} from "@/app/lib/clasificados/autos/autosVehicleStructuredData";

const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

type DecodeStatus = "idle" | "loading" | "success" | "partial" | "error" | "invalid";

export function AutosVinDecodeBlock<T extends AutosVehicleStructuredFields>({
  lang,
  vinLabel,
  vin,
  modelYear,
  currentVehicle,
  onVinChange,
  onApplyPatch,
  className,
}: {
  lang: AutosClassifiedsLang;
  vinLabel: string;
  vin: string | undefined;
  modelYear?: number;
  currentVehicle: T;
  onVinChange: (vin: string | undefined) => void;
  onApplyPatch: (patch: Partial<T>) => void;
  className?: string;
}) {
  const [status, setStatus] = useState<DecodeStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const decode = useCallback(async () => {
    const normalized = normalizeVinInput(vin);
    if (!isValidVinCandidate(normalized)) {
      setStatus("invalid");
      setStatusMessage(autosVinDecodeInvalid(lang));
      return;
    }

    setStatus("loading");
    setStatusMessage(autosVinDecodeLoading(lang));

    try {
      const res = await fetch("/api/clasificados/autos/decode-vin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: normalized, modelYear }),
      });
      const j = (await res.json()) as {
        ok?: boolean;
        fields?: Partial<AutosVehicleStructuredFields>;
        partial?: boolean;
        error?: string;
      };

      if (!res.ok || !j.ok || !j.fields) {
        setStatus("error");
        setStatusMessage(autosVinDecodeError(lang));
        return;
      }

      const patch = buildVinDecodeFillEmptyPatch(pickAutosVehicleStructuredFields(currentVehicle), j.fields);
      if (Object.keys(patch).length > 0) {
        onApplyPatch(patch as Partial<T>);
      }
      if (patch.vin === undefined && normalized) {
        onVinChange(normalized);
      } else if (j.fields.vin) {
        onVinChange(j.fields.vin);
      }

      if (j.partial) {
        setStatus("partial");
        setStatusMessage(autosVinDecodePartial(lang));
      } else {
        setStatus("success");
        setStatusMessage(autosVinDecodeSuccess(lang));
      }
    } catch {
      setStatus("error");
      setStatusMessage(autosVinDecodeError(lang));
    }
  }, [vin, modelYear, lang, currentVehicle, onApplyPatch, onVinChange]);

  const statusTone =
    status === "success"
      ? "text-emerald-900"
      : status === "partial"
        ? "text-amber-900"
        : status === "error" || status === "invalid"
          ? "text-red-900"
          : "text-[color:var(--lx-muted)]";

  return (
    <div className={className} data-autos-vin-decode-block="1">
      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">{vinLabel}</label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          className={`${INPUT} sm:mt-0 sm:flex-1`}
          value={vin ?? ""}
          onChange={(e) => {
            setStatus("idle");
            setStatusMessage(null);
            const raw = e.target.value;
            onVinChange(raw.trim() ? raw : undefined);
          }}
          onBlur={() => {
            const n = normalizeVinInput(vin);
            if (n && n !== vin) onVinChange(n);
          }}
          autoComplete="off"
          spellCheck={false}
          maxLength={20}
          aria-describedby="autos-vin-decode-helper"
        />
        <button
          type="button"
          disabled={status === "loading"}
          onClick={() => void decode()}
          className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-60 sm:mt-0"
        >
          {status === "loading" ? autosVinDecodeLoading(lang) : autosVinDecodeButtonLabel(lang)}
        </button>
      </div>
      <p id="autos-vin-decode-helper" className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">
        {autosVinDecodeHelper(lang)}
      </p>
      {statusMessage ? (
        <p className={`mt-1.5 text-xs font-medium leading-relaxed ${statusTone}`} role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
