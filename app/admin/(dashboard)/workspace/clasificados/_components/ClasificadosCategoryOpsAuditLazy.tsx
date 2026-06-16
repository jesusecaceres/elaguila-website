"use client";

import { useState } from "react";
import type { ClasificadosCategoryOpsAuditRow } from "@/app/admin/_lib/adminClasificadosCategoryOpsAudit";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { ClasificadosCategoryOpsAuditTable } from "./ClasificadosCategoryOpsAuditTable";

export function ClasificadosCategoryOpsAuditLazy({ lang }: { lang: AdminLang }) {
  const m = adminMessages(lang);
  const [rows, setRows] = useState<ClasificadosCategoryOpsAuditRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  async function loadAudit() {
    if (rows || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clasificados/category-ops-audit", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { rows?: ClasificadosCategoryOpsAuditRow[] };
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load operational audit");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(next: boolean) {
    setOpened(next);
    if (next) void loadAudit();
  }

  return (
    <section
      className={`${adminCardBase} mb-8 overflow-hidden p-0`}
      aria-labelledby="clasificados-ops-audit-heading"
      data-testid="clasificados-ops-audit-collapsible"
    >
      <details open={opened} onToggle={(e) => handleToggle((e.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer list-none border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="clasificados-ops-audit-heading" className="text-base font-bold text-[#1E1810]">
                {m("audit.title")}
              </h2>
              <p className="mt-1 max-w-4xl text-[11px] leading-snug text-[#5C5346]">{m("audit.intro")}</p>
            </div>
            <span className="rounded-md border border-[#C9B46A]/50 bg-[#FFFCF7] px-2 py-1 text-[10px] font-bold uppercase text-[#5C4E2E]">
              {opened ? "Open" : "Tap to load audit"}
            </span>
          </div>
        </summary>

        <div className="p-0">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-[#7A7164]">Loading operational audit…</p>
          ) : error ? (
            <div className="mx-4 my-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950" role="alert">
              <strong>Audit load failed.</strong> {error}
            </div>
          ) : rows ? (
            <ClasificadosCategoryOpsAuditTable rows={rows} lang={lang} />
          ) : null}
        </div>
      </details>
    </section>
  );
}
