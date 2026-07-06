import { redirect } from "next/navigation";
import { EN_VENTA_PUBLICAR_PRO } from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import {
  resolveClasificadosPublishLangFromSearchParams,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

export const dynamic = "force-dynamic";

/** Free lane files preserved; public URL redirects to Pro included-free flow. */
export default async function EnVentaFreePublishPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang(EN_VENTA_PUBLICAR_PRO, routeLang));
}
