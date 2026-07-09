import { redirect } from "next/navigation";
import {
  resolveClasificadosPublishLangFromSearchParams,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

/**
 * Legacy entry: forward to the dedicated Busco quick publish flow at /publicar/busco/quick.
 * Preserves full SupportedLang from ?lang=.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarBuscoRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang("/publicar/busco/quick", routeLang));
}
