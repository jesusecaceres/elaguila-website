import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { subPick, orderSubmissionCopy } from "../../data/orderSubmissionCopy";
import { withLang } from "../../utils/tiendaRouting";
import { TiendaOrderShell } from "./TiendaOrderShell";

export function TiendaOrderAlreadySubmitted(props: { lang: Lang; orderId: string }) {
  const { lang, orderId } = props;
  return (
    <TiendaOrderShell>
      <div className="rounded-2xl border border-[rgba(201,168,74,0.35)] bg-[rgba(201,168,74,0.08)] p-6 space-y-3 max-w-xl">
        <h1 className="text-xl font-semibold text-[rgba(255,247,226,0.95)]">
          {subPick(orderSubmissionCopy.alreadySubmittedTitle, lang)}
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.72)]">{subPick(orderSubmissionCopy.alreadySubmittedBody, lang)}</p>
        <p className="text-sm font-mono text-[rgba(201,168,74,0.95)]">{orderId}</p>
        <Link
          href={withLang(`/tienda/order/complete?ref=${encodeURIComponent(orderId)}`, lang)}
          className="inline-flex rounded-full bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] px-5 py-2.5 text-sm font-semibold hover:brightness-95"
        >
          {subPick(orderSubmissionCopy.alreadySubmittedViewConfirm, lang)}
        </Link>
      </div>
    </TiendaOrderShell>
  );
}
