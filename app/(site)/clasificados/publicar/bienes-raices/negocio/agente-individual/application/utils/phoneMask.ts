/**
 * BR/Rentas phone mask — thin re-export of the shared Leonix phone-format engine
 * (`@/app/lib/leonix/phoneFormat.ts`). Keeps the local names/signatures every BR/Rentas caller
 * already uses so no call site needs to change; the shared engine also correctly strips a
 * pasted leading US country-code "1" (11 digits), which this local module previously did not.
 */
import {
  onLeonixPhoneInputChange,
  stripPhoneDigits,
  formatUsPhone,
} from "@/app/lib/leonix/phoneFormat";

export function digitsOnly(raw: string): string {
  return stripPhoneDigits(raw);
}

export function formatUsPhoneDisplay(digits: string): string {
  return formatUsPhone(digits);
}

export function onPhoneInputChange(raw: string, prevDigits: string): { display: string; digits: string } {
  return onLeonixPhoneInputChange(raw, prevDigits);
}
