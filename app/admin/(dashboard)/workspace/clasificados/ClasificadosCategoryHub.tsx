import Link from "next/link";
import type { ClasificadosCategoryRegistryEntry } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { getCategorySchema } from "@/app/clasificados/config/categorySchema";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { getClassifiedsOpsContract } from "@/app/admin/_lib/classifiedsOpsContract";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { adminCardBase } from "../../../_components/adminTheme";

function planSummary(plans: string[]): string {
  if (!plans.length) return "—";
  return plans.join(" · ");
}

export function ClasificadosCategoryHub({
  registry,
  lang,
}: {
  registry: ClasificadosCategoryRegistryEntry[];
  lang: AdminLang;
}) {
  const m = adminMessages(lang);

  return (
    <section className="mb-8" aria-labelledby="clasificados-hub-heading">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="clasificados-hub-heading" className="text-lg font-bold text-[#1E1810]">
            {m("hub.title")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-[#5C5346]">
            {(() => {
              const intro = m("hub.intro");
              const marker = "categorySchema";
              const i = intro.indexOf(marker);
              if (i < 0) return intro;
              return (
                <>
                  {intro.slice(0, i)}
                  <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">{marker}</code>
                  {intro.slice(i + marker.length)}
                </>
              );
            })()}
          </p>
        </div>
        <Link
          href="/admin/categories"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-[#C9B46A]/45 bg-[#FFFCF7] px-4 py-2 text-xs font-bold text-[#5C4E2E] underline-offset-2 hover:underline"
        >
          {m("hub.categoriesRegistry")}
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {registry.map((entry) => {
          const schema = getCategorySchema(entry.slug);
          if (!schema) return null;
          const isEnVenta = entry.slug === "en-venta";
          const cardClass = isEnVenta
            ? `${adminCardBase} border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50/90 to-[#FFFCF7] p-5 shadow-[0_12px_40px_rgba(16,90,50,0.08)]`
            : `${adminCardBase} p-5`;

          return (
            <li key={entry.slug}>
              <article className={cardClass}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-2xl leading-none" aria-hidden>
                      {entry.emoji}
                    </p>
                    <h3 className="mt-2 text-base font-bold text-[#1E1810]">{entry.displayNameEs}</h3>
                    <p className="mt-0.5 font-mono text-[11px] text-[#7A7164]">{entry.slug}</p>
                  </div>
                  {isEnVenta ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                      {m("hub.standardLive")}
                    </span>
                  ) : (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        entry.operationalStatus === "live"
                          ? "bg-emerald-100 text-emerald-900"
                          : entry.operationalStatus === "staged"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-sky-100 text-sky-900"
                      }`}
                    >
                      {entry.operationalStatus}
                    </span>
                  )}
                </div>

                <dl className="mt-3 space-y-1.5 text-[11px] text-[#5C5346]">
                  <div className="flex gap-1">
                    <dt className="font-semibold text-[#3D3428]">{m("hub.plans")}</dt>
                    <dd className="min-w-0">{planSummary(schema.plans)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="shrink-0 font-semibold text-[#3D3428]">{m("hub.fields")}</dt>
                    <dd className="min-w-0 break-words">
                      {m("hub.fieldGroup")} <code className="rounded bg-white/80 px-1">{schema.formFieldGroupKey ?? "—"}</code>
                    </dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>
                      {m("hub.preview")}: {schema.previewEligible ? m("hub.yes") : m("hub.no")} · {m("hub.proPreview")}:{" "}
                      {schema.proPreviewEligible ? m("hub.yes") : m("hub.no")}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#3D3428]">{m("hub.readiness")}:</span> {entry.readiness}
                  </div>
                </dl>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {(() => {
                    const ops = getClassifiedsOpsContract(entry.slug);
                    if (ops) {
                      return (
                        <>
                          <Link
                            href={ops.publicListingsAdminPath}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-[#C9B46A]/55 bg-[#FFF7ED] px-4 py-2.5 text-center text-sm font-bold text-[#92400E] hover:bg-[#FFEDD5] sm:min-h-0"
                          >
                            {m("hub.restDbLink")}
                          </Link>
                          <Link
                            href={ops.fieldsNotesAdminPath}
                            className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl px-4 py-2.5 text-center text-sm font-bold text-[#1E1810] sm:min-h-0 ${
                              isEnVenta
                                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                                : "border border-[#7A9E6F]/45 bg-[#F4FAF2] hover:bg-[#E8F4E4]"
                            }`}
                          >
                            {isEnVenta ? m("hub.editorEnVenta") : m("hub.editorOther")}
                          </Link>
                          <Link
                            href={ops.operationalSpaceAdminPath}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-4 py-2.5 text-center text-sm font-semibold text-[#1E1810] hover:bg-[#F4EFE4] sm:min-h-0"
                          >
                            {m("hub.opsSpace")}
                          </Link>
                          <Link
                            href={ops.adQueueAdminPath}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-dashed border-[#B8A990] bg-white/80 px-4 py-2.5 text-center text-xs font-semibold text-[#5C4E2E] hover:bg-[#FFFCF7] sm:min-h-0"
                            title={m("hub.queueFilteredTitle")}
                          >
                            {m("hub.queueFiltered")}
                          </Link>
                        </>
                      );
                    }
                    return (
                      <>
                        <Link
                          href={
                            isEnVenta
                              ? "/admin/workspace/clasificados/category/en-venta"
                              : `/admin/workspace/clasificados/category/editor/${encodeURIComponent(entry.slug)}`
                          }
                          className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl px-4 py-2.5 text-center text-sm font-bold text-[#1E1810] sm:min-h-0 ${
                            isEnVenta
                              ? "bg-emerald-700 text-white hover:bg-emerald-800"
                              : "border border-[#7A9E6F]/45 bg-[#F4FAF2] hover:bg-[#E8F4E4]"
                          }`}
                        >
                          {isEnVenta ? m("hub.editorEnVenta") : m("hub.editorOther")}
                        </Link>
                        <Link
                          href={`/admin/workspace/clasificados/category/${encodeURIComponent(entry.slug)}`}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-4 py-2.5 text-center text-sm font-semibold text-[#1E1810] hover:bg-[#F4EFE4] sm:min-h-0"
                        >
                          {m("hub.opsSpace")}
                        </Link>
                        <Link
                          href={adminCategoryWorkspaceQueueHref(entry.slug)}
                          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-dashed border-[#B8A990] bg-white/80 px-4 py-2.5 text-center text-xs font-semibold text-[#5C4E2E] hover:bg-[#FFFCF7] sm:min-h-0"
                          title={m("hub.queueFilteredTitle")}
                        >
                          {m("hub.queueFiltered")}
                        </Link>
                      </>
                    );
                  })()}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
