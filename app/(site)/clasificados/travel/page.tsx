import { permanentRedirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy `/clasificados/travel` → canonical `/clasificados/viajes` (query string preserved). */
export default async function ClasificadosTravelLegacyRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) sp.append(key, item);
    } else {
      sp.set(key, value);
    }
  }
  const qs = sp.toString();
  permanentRedirect(qs ? `/clasificados/viajes?${qs}` : "/clasificados/viajes");
}
