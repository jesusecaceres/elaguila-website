import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(sp: SearchParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.set(key, value);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/** Legacy full-page publish preview URL — category publish flows own preview; land at publish entry. */
export default async function LegacyPreviewListingRedirect({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  redirect(`/clasificados/publicar${toQueryString(sp)}`);
}
