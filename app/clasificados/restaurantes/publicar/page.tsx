import { redirect } from "next/navigation";

type SearchParams = Record<string, string | string[] | undefined>;

function one(sp: SearchParams, key: string): string | undefined {
  const v = sp?.[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Legacy URL: forwards to the live Restaurantes publish application.
 * Preserves lang, plan (paquetes), and placeType when present.
 */
export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = (await searchParams) ?? {};
  const p = new URLSearchParams();
  p.set("lang", one(sp, "lang") === "en" ? "en" : "es");
  const plan = one(sp, "plan");
  if (plan) p.set("plan", plan);
  const placeType = one(sp, "placeType");
  if (placeType) p.set("placeType", placeType);
  redirect(`/publicar/restaurantes?${p.toString()}`);
}
