import { redirect } from "next/navigation";
import { EN_VENTA_PUBLICAR_PRO } from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";

export const dynamic = "force-dynamic";

/** Public publish entry — Pro included at no charge (Free lane parked, not deleted). */
export default async function EnVentaPublishHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const qs = new URLSearchParams();
  qs.set("lang", lang);
  redirect(`${EN_VENTA_PUBLICAR_PRO}?${qs.toString()}`);
}
