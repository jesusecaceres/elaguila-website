import { redirect } from "next/navigation";
import { EN_VENTA_PUBLICAR_PRO } from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";
import {
  resolveClasificadosPublishLangFromSearchParams,
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";

export const dynamic = "force-dynamic";

/** Public publish entry — Pro included at no charge (Free lane parked, not deleted). */
export default async function EnVentaPublishHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const { routeLang } = resolveClasificadosPublishLangFromSearchParams(sp);
  redirect(withClasificadosPublishLang(EN_VENTA_PUBLICAR_PRO, routeLang));
}
