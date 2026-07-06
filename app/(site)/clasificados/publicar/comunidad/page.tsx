import { redirect } from "next/navigation";
import {
  resolveClasificadosPublishLangFromSearchParams,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

/**
 * Legacy entry: forward to the dedicated Comunidad quick publish flow at /publicar/comunidad/quick.
 * Preserves full SupportedLang from ?lang=.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarComunidadRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang("/publicar/comunidad/quick", routeLang));
}
