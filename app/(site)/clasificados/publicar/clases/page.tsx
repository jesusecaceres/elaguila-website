import { redirect } from "next/navigation";

/**
 * Legacy entry: forward to the dedicated Clases quick publish flow at /publicar/clases/quick.
 * Preserves any `lang` query param so users keep their language preference.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarClasesRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const langRaw = sp?.lang;
  const lang = (Array.isArray(langRaw) ? langRaw[0] : langRaw) === "en" ? "en" : "es";
  redirect(`/publicar/clases/quick?lang=${lang}`);
}
