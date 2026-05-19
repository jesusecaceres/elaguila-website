import { redirect } from "next/navigation";

/**
 * Legacy entry: forward to the dedicated Busco quick publish flow at /publicar/busco/quick.
 * Preserves any `lang` query param so users keep their language preference.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarBuscoRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const langRaw = sp?.lang;
  const lang = (Array.isArray(langRaw) ? langRaw[0] : langRaw) === "en" ? "en" : "es";
  redirect(`/publicar/busco/quick?lang=${lang}`);
}
