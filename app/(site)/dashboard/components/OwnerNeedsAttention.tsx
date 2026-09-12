"use client";

import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";
import { accountAttentionItems } from "../lib/ownerAccountCommandCenter";
import { OwnerAttentionItemCard } from "./OwnerAttentionItemCard";
import type { OwnerAttentionItem } from "../lib/ownerAttentionModel";

export function OwnerNeedsAttention({
  lang,
  loading,
  error,
  items,
}: {
  lang: Lang;
  loading?: boolean;
  error?: boolean;
  items: OwnerAttentionItem[];
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
              <OwnerAttentionItemCard item={item} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
