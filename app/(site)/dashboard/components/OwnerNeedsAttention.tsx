"use client";

import Link from "next/link";
import { LX_DASH, lxDashStatusChipClass } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";
import { accountAttentionItems, derivedFeedTone } from "../lib/ownerAccountCommandCenter";
import type { DerivedFeedItem } from "../lib/derivedDashboardFeed";

export function OwnerNeedsAttention({
  lang,
  loading,
  error,
  items,
}: {
  lang: Lang;
  loading?: boolean;
  error?: boolean;
  items: DerivedFeedItem[];
}) {
  const t = accountCommandCenterCopy(lang);
  const rows = accountAttentionItems(items);

  return (
    <section className={LX_DASH.panel} aria-labelledby="owner-needs-attention-heading">
      <h2 id="owner-needs-attention-heading" className={LX_DASH.sectionTitle}>
        {t.attentionTitle}
      </h2>
      {loading ? (
        <p className={`mt-3 ${LX_DASH.bodyMuted}`}>{t.attentionLoading}</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-800">{t.attentionError}</p>
      ) : rows.length === 0 ? (
        <p className={`mt-3 ${LX_DASH.emptyState}`}>{t.attentionEmpty}</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {rows.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-[44px] flex-col gap-1 rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7] px-4 py-3 transition hover:border-[#C9A84A]/45"
              >
                <span className={lxDashStatusChipClass(derivedFeedTone(item.kind))}>{item.title}</span>
                {item.detail ? <span className="text-sm leading-relaxed text-[#3D3428]">{item.detail}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
