import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function withSearchParams(path: string, sp?: SearchParams) {
  if (!sp) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") params.set(k, v);
    else if (Array.isArray(v)) for (const item of v) params.append(k, item);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string | string[] }>;
  searchParams?: Promise<SearchParams>;
}) {
  const p = await params;
  const sp = searchParams ? await searchParams : undefined;

  const raw = p.id;
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;

  redirect(withSearchParams("/clasificados/anuncio/" + encodeURIComponent(value), sp));
}
