import { resolveClasificadosPublishLangFromSearchParams } from "./clasificadosPublishLang";

/**
 * Gate I.5.3 — builds a same-origin redirect destination that forwards the COMPLETE incoming
 * search-parameter set (edit/listingId/id/source/mode/returnTo/lane/campaign params, anything),
 * never a manual whitelist, per the gate's redirect-safety principle. `lang` is always present
 * and normalized in the output (via the same resolver every other clasificados publish redirect
 * uses), even when absent or malformed on the incoming request.
 *
 * `destinationPath` must always be a caller-supplied literal (never derived from user input) —
 * this function only ever appends query data to a path the caller already controls, so it
 * cannot become an open redirect.
 */
export function forwardPublishRedirectParams(
  destinationPath: string,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(searchParams);
  const usp = new URLSearchParams();
  usp.set("lang", routeLang);
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "lang" || value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) usp.append(key, v);
    } else {
      usp.set(key, value);
    }
  }
  return `${destinationPath}?${usp.toString()}`;
}
