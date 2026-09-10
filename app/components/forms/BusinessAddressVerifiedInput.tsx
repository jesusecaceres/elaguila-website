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

export function BusinessAddressVerifiedInput({
  lang,
  value,
  onChange,
  className,
}: {
  lang: "es" | "en";
  value: BusinessAddress;
  onChange: (next: BusinessAddress) => void;
  className?: string;
}) {
  const copy = COPY[lang];
  const [query, setQuery] = useState(value.street || "");
  const [suggestions, setSuggestions] = useState<BusinessAddress[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 5) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/business-address/suggest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: trimmed }),
          });
          const json = (await res.json()) as { ok: boolean; suggestions?: BusinessAddress[] };
          if (json.ok && json.suggestions?.length) {
            setSuggestions(json.suggestions);
            setOpen(true);
          } else {
            setSuggestions([]);
            setOpen(false);
          }
        } catch {
          setSuggestions([]);
          setOpen(false);
        }
      })();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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
    onChange({
      ...suggestion,
      verificationStatus: "user_confirmed",
      manualEntry: false,
    });
  }

  return (
    <div className={className}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleManualStreetChange(e.target.value)}
        placeholder={copy.placeholder}
        className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
        autoComplete="off"
      />
      <p className="mt-1 text-xs text-black/50">{copy.manualHint}</p>
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
