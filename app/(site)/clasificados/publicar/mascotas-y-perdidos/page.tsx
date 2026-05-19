import { redirect } from "next/navigation";

/**
 * Legacy entry: forward to the dedicated Mascotas y Perdidos quick publish flow at /publicar/mascotas-y-perdidos/quick.
 * Preserves any `lang` query param so users keep their language preference.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarMascotasPerdidosRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const langRaw = sp?.lang;
  const lang = (Array.isArray(langRaw) ? langRaw[0] : langRaw) === "en" ? "en" : "es";
  redirect(`/publicar/mascotas-y-perdidos/quick?lang=${lang}`);
}
