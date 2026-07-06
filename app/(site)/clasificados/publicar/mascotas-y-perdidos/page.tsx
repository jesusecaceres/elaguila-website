import { redirect } from "next/navigation";
import {
  resolveClasificadosPublishLangFromSearchParams,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

/**
 * Legacy entry: forward to the dedicated Mascotas y Perdidos quick publish flow.
 * Preserves full SupportedLang from ?lang=.
 */
export const dynamic = "force-dynamic";

export default async function ClasificadosPublicarMascotasPerdidosRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang("/publicar/mascotas-y-perdidos/quick", routeLang));
}
