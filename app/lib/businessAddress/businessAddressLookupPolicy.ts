/**
 * Billing-triggering Google Geocoding calls are bounded to explicit confirmation/save.
 * Keystrokes, debounce-while-typing, and reopening an unchanged confirmed address must not
 * hit `/api/business-address/suggest`.
 */

export type AddressLookupTrigger = "keystroke" | "input" | "debounce" | "confirm" | "save" | "reopen_unchanged";

export function shouldFetchAddressSuggestions(input: {
  trigger: AddressLookupTrigger;
  streetLength: number;
  alreadyConfirmed: boolean;
  streetUnchanged?: boolean;
}): boolean {
  if (input.trigger === "keystroke" || input.trigger === "input" || input.trigger === "debounce") {
    return false;
  }
  if (input.trigger === "reopen_unchanged") return false;
  if (input.alreadyConfirmed && input.streetUnchanged !== false) return false;
  if (input.trigger !== "confirm" && input.trigger !== "save") return false;
  return input.streetLength >= 5;
}

export const ADDRESS_LOOKUP_MIN_CHARS = 5;
export const ADDRESS_SUGGEST_PATH = "/api/business-address/suggest";
