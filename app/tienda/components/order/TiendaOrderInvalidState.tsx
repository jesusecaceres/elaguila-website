import Link from "next/link";
import type { Lang } from "../../types/tienda";
import type { TiendaOrderSource } from "../../types/orderHandoff";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";
import { withLang } from "../../utils/tiendaRouting";
import { configurePathForSource, productPathForSlug } from "../../order/orderFormStorage";
import { TiendaOrderShell } from "./TiendaOrderShell";

export function TiendaOrderInvalidState(props: { source: TiendaOrderSource; slug: string; lang: Lang }) {
  const { source, slug, lang } = props;
  return (
    <TiendaOrderShell>
      <header>
        <h1 className="text-2xl font-semibold text-[rgba(255,247,226,0.95)]">{ohPick(orderHandoffCopy.invalidTitle, lang)}</h1>
        <p className="mt-3 text-sm text-[rgba(255,255,255,0.68)] max-w-xl">{ohPick(orderHandoffCopy.invalidBody, lang)}</p>
      </header>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={withLang(configurePathForSource(source, slug), lang)}
          className="inline-flex justify-center rounded-full bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] px-6 py-3 text-sm font-semibold hover:brightness-95"
        >
          {ohPick(orderHandoffCopy.invalidCtaBuilder, lang)}
        </Link>
        <Link
          href={withLang(productPathForSlug(slug), lang)}
          className="inline-flex justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-6 py-3 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)]"
        >
          {ohPick(orderHandoffCopy.backToProduct, lang)}
        </Link>
      </div>
    </TiendaOrderShell>
  );
}
