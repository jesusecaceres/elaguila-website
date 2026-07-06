import { redirect } from "next/navigation";
import {
  resolveClasificadosPublishLangFromSearchParams,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

/**
 * Legacy entry: forward to the dedicated Clases quick publish flow at /publicar/clases/quick.
 * Preserves full SupportedLang from ?lang=.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarClasesRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang("/publicar/clases/quick", routeLang));
}
