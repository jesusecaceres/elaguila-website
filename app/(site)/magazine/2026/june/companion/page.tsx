import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Retired route. The readable-companion product is gone; this URL exists only
 * to honor old bookmarks, printed QR codes, and shared/indexed links by
 * sending visitors to the canonical reader.
 */
function buildReadRedirect(searchParams: SearchParams): string {
  const lang = firstParam(searchParams.lang).trim();
  return lang ? `/magazine/2026/june/read?lang=${encodeURIComponent(lang)}` : "/magazine/2026/june/read";
}

export default async function June2026CompanionPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await props.searchParams) ?? {};
  redirect(buildReadRedirect(sp));
}
