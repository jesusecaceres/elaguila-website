"use client";

/**
 * Gate G23 — shared Globalization business-address input with optional provider verification.
 *
 * Manual entry is always the default and always valid: typing without ever selecting a
 * suggestion (or when GOOGLE_MAPS_API_KEY isn't configured, in which case `/api/business-address/
 * suggest` always returns `{ok:false, reason:"no_provider_configured"}` and no suggestions ever
 * appear) produces `verificationStatus: "manual"` — this component never blocks saving on a
 * provider result. Selecting a real suggestion sets `verificationStatus: "user_confirmed"` (the
 * owner explicitly picked it), never "verified" — this component is not the verifying adapter,
 * only the picker; per `businessAddressContract.ts`'s own doctrine, "verified" is reserved for a
 * provider adapter's own confirmed result, which this UI layer does not claim to be.
 *
 * Category call sites own their own field layout/theming and pass `value`/`onChange` — this
 * component owns only the suggest-and-pick behavior, not a category-specific visual shell.
 */
import { useEffect, useRef, useState } from "react";
import type { BusinessAddress } from "@/app/lib/businessAddress/businessAddressContract";

const COPY = {
  es: {
    placeholder: "Calle y número",
    manualHint: "Puedes escribir la dirección manualmente — no se requiere verificación.",
    suggestionsLabel: "Sugerencias",
    useThis: "Usar esta dirección",
  },
  en: {
    placeholder: "Street address",
    manualHint: "You can type the address manually — verification is never required.",
    suggestionsLabel: "Suggestions",
    useThis: "Use this address",
  },
} as const;

type LookupState = "idle" | "searching" | "results" | "no_results" | "unavailable";

const STATUS_COPY = {
  es: {
    searching: "Buscando sugerencias de dirección…",
    results: "Selecciona tu dirección de las sugerencias de Google Maps para confirmarla, o sigue escribiendo.",
    noResults: "Sin coincidencias en Google Maps. Puedes continuar manualmente (quedará como no verificada).",
    unavailable:
      "La búsqueda de direcciones no está disponible en este momento. Puedes escribir tu dirección manualmente (quedará como no verificada).",
    confirmed: "Dirección seleccionada de las sugerencias de Google Maps (confirmada por ti).",
    manual: "Dirección escrita manualmente — no verificada.",
  },
  en: {
    searching: "Looking up address suggestions…",
    results: "Pick your address from the Google Maps suggestions to confirm it, or keep typing.",
    noResults: "No Google Maps match. You can continue manually (it will stay unverified).",
    unavailable: "Address lookup isn't available right now. You can type your address manually (it will stay unverified).",
    confirmed: "Address picked from Google Maps suggestions (confirmed by you).",
    manual: "Address typed manually — not verified.",
  },
} as const;

/**
 * Servicios Owner QA (⚠️21 / SVC-QA-05) — the provider lookup was wired but silent: the owner saw a
 * plain text box and could not tell whether suggestions were searching, empty, or unavailable. The
 * component now states which of those is true, sends the city/region the form already knows as
 * lookup context (a bare street rarely matches), and never labels a typed address as verified — a
 * picked suggestion is "confirmed by you" (`user_confirmed`), nothing more.
 */
export function BusinessAddressVerifiedInput({
  lang,
  value,
  onChange,
  className,
  inputClassName,
  locationHint,
}: {
  lang: "es" | "en";
  value: BusinessAddress;
  onChange: (next: BusinessAddress) => void;
  /** Wrapper classes. */
  className?: string;
  /** Classes for the text input itself (defaults to the component's own input style). */
  inputClassName?: string;
  /** City / region context appended to the lookup query when the typed text doesn't include it. */
  locationHint?: string;
}) {
  const copy = COPY[lang];
  const status = STATUS_COPY[lang];
  const [query, setQuery] = useState(value.street || "");
  const [suggestions, setSuggestions] = useState<BusinessAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [lookup, setLookup] = useState<LookupState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 5 || value.verificationStatus === "user_confirmed") {
      setSuggestions([]);
      setOpen(false);
      setLookup("idle");
      return;
    }
    const hint = (locationHint ?? "").trim();
    const lookupQuery =
      hint && !trimmed.toLowerCase().includes(hint.split(",")[0]!.trim().toLowerCase()) ? `${trimmed}, ${hint}` : trimmed;
    debounceRef.current = setTimeout(() => {
      setLookup("searching");
      void (async () => {
        try {
          const res = await fetch("/api/business-address/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: lookupQuery }),
          });
          const json = (await res.json()) as { ok: boolean; suggestions?: BusinessAddress[]; reason?: string };
          if (json.ok && json.suggestions?.length) {
            setSuggestions(json.suggestions);
            setOpen(true);
            setLookup("results");
          } else {
            setSuggestions([]);
            setOpen(false);
            setLookup(json.ok || json.reason === "provider_status_zero_results" ? "no_results" : "unavailable");
          }
        } catch {
          setSuggestions([]);
          setOpen(false);
          setLookup("unavailable");
        }
      })();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locationHint, value.verificationStatus]);

  function handleManualStreetChange(next: string) {
    setQuery(next);
    onChange({
      ...value,
      street: next,
      verificationStatus: "manual",
      provider: null,
      providerPlaceId: null,
      manualEntry: true,
    });
  }

  function handlePickSuggestion(suggestion: BusinessAddress) {
    setQuery(suggestion.street);
    setOpen(false);
    setLookup("idle");
    onChange({
      ...suggestion,
      verificationStatus: "user_confirmed",
      manualEntry: false,
    });
  }

  const confirmed = value.verificationStatus === "user_confirmed" && Boolean(value.street?.trim());
  const statusLine =
    lookup === "searching"
      ? status.searching
      : lookup === "results"
        ? status.results
        : lookup === "no_results"
          ? status.noResults
          : lookup === "unavailable"
            ? status.unavailable
            : confirmed
              ? status.confirmed
              : query.trim()
                ? status.manual
                : null;

  return (
    <div className={className}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleManualStreetChange(e.target.value)}
        placeholder={copy.placeholder}
        className={inputClassName ?? "w-full rounded-lg border border-black/15 px-3 py-2 text-sm"}
        autoComplete="off"
      />
      <p className="mt-1 text-xs text-black/50">{copy.manualHint}</p>
      {statusLine ? (
        <p
          role="status"
          aria-live="polite"
          className={`mt-1 text-xs font-medium ${confirmed && lookup === "idle" ? "text-emerald-700" : "text-[#6b5c42]"}`}
          data-business-address-lookup={confirmed && lookup === "idle" ? "confirmed" : lookup === "idle" ? "manual" : lookup}
        >
          {confirmed && lookup === "idle" ? "✓ " : ""}
          {statusLine}
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul className="mt-1 divide-y divide-black/5 rounded-lg border border-black/10 bg-white shadow-sm">
          {suggestions.map((s) => (
            <li key={s.providerPlaceId ?? s.formattedAddress}>
              <button
                type="button"
                onClick={() => handlePickSuggestion(s)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-black/5"
              >
                {s.formattedAddress ?? `${s.street}, ${s.city}, ${s.region} ${s.postalCode}`}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
