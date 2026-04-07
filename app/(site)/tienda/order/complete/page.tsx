import type { Lang } from "../../types/tienda";
import { normalizeLang } from "../../utils/tiendaRouting";
import { TiendaOrderCompleteClient } from "../../components/order/TiendaOrderCompleteClient";

export default async function TiendaOrderCompletePage(props: { searchParams?: Promise<{ ref?: string; lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);
  const ref = typeof sp.ref === "string" ? sp.ref : "";

  return <TiendaOrderCompleteClient orderRef={ref} lang={lang} />;
}
