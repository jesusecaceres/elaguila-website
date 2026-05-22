import { redirect } from "next/navigation";
import { EN_VENTA_PUBLICAR_PRO } from "@/app/clasificados/en-venta/shared/constants/enVentaPublishRoutes";

export const dynamic = "force-dynamic";

/** Free lane files preserved; public URL redirects to Pro included-free flow. */
export default async function EnVentaFreePublishPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const qs = new URLSearchParams();
  qs.set("lang", lang);
  redirect(`${EN_VENTA_PUBLICAR_PRO}?${qs.toString()}`);
}
