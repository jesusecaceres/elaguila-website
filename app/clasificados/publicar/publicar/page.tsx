import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function toQueryString(sp?: SearchParams) {
  if (!sp) return "";
  const params = new URLSearchParams();

  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") params.set(k, v);
    else if (Array.isArray(v)) {
      // Preserve first value (Next can provide arrays for repeated params)
      if (v[0]) params.set(k, v[0]);
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default async function PublicarDuplicateRoute({
  searchParams,
}: {
  // Next.js 15 safe typing: some setups treat searchParams as Promise-based
  searchParams?: Promise<SearchParams>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  redirect(`/clasificados/publicar${toQueryString(sp)}`);
}
