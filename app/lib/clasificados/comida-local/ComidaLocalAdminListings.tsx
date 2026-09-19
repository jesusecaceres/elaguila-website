import Link from "next/link";

import type { AdminListingCommercialTruthMap } from "@/app/admin/_lib/adminListingCommercialTruth";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import type { PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import {
  ClassifiedAdminRowActions,
  type ClassifiedAdminLifecycleAction,
} from "@/app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions";
import {
  AdminCommercialTruthSection,
  AdminListingTruthSection,
} from "@/app/admin/(dashboard)/workspace/clasificados/_components/normalized/AdminListingCardSections";

import type { ComidaLocalAdminListingVm } from "./mapComidaLocalAdminListing";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  items: ComidaLocalAdminListingVm[];
  inspectId?: string | null;
  /** Listing truth per listing id (publication semantics, corrected for this table). */
  listingTruthById?: Record<string, PublicationTruth>;
  /** Read-only commercial truth per listing id (payment / entitlement / subscription records). */
  commercialTruthByListingId?: AdminListingCommercialTruthMap;
  /**
   * The canonical lifecycle actions per listing id (suspend / restore / archive / republish — payment-aware,
   * enforced again by the API route). Omit to render the list read-only. There is NO raw status selector.
   */
  actionsById?: Record<string, ClassifiedAdminLifecycleAction[]>;
  /** Payment anomaly text per listing id (published without a cleared payment). */
  paymentAnomalyById?: Record<string, string | null>;
  /** `suspended_reason` per listing id ('payment' = payment engine, 'moderation' = staff). */
  suspendedReasonById?: Record<string, string | null>;
  /** Empty-state copy override (e.g. when filters are active). */
  emptyMessage?: string;
};

export function ComidaLocalAdminListings({
  lang,
  items,
  inspectId,
  listingTruthById = {},
  commercialTruthByListingId = {},
  actionsById,
  paymentAnomalyById = {},
  suspendedReasonById = {},
  emptyMessage,
}: Props) {
  const q = `lang=${lang}`;
  const inspectItem = inspectId ? items.find((i) => i.id === inspectId) ?? null : null;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 text-sm text-[#5C5346]">
        <h2 className="text-base font-bold text-[#1E1810]">Comida Local</h2>
        <p className="mt-2">{emptyMessage ?? "No hay publicaciones de Comida Local todavía."}</p>
        <p className="mt-1 text-xs text-[#7A7164]">Puestos, pop-ups y vendedores locales publicados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#1E1810]">
          Comida Local ({items.length})
        </h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Puestos, pop-ups y vendedores locales publicados.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-left text-xs text-[#1E1810]">
          <thead className="bg-[#FBF7EF] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
            <tr>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Leonix ID</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Negocio</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Ciudad</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Tipo</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.listing")}</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.commercial")}</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Publicado</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Foto</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Enlaces</th>
              {actionsById ? (
                <th className="border-b border-[#E8DFD0] px-3 py-2">{adminTr(lang, "catShell.section.actions")}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const anomaly = paymentAnomalyById[item.id] ?? null;
              const suspendedReason = suspendedReasonById[item.id] ?? null;
              return (
                <tr key={item.id} id={`row-${item.id}`} className="border-b border-[#F0E8DA] align-top hover:bg-[#FFFCF7]">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] font-bold text-[#5C4E2E]">
                    {item.leonixAdId ?? "—"}
                  </td>
                  <td className="max-w-[180px] px-3 py-2">
                    <div className="font-semibold">{item.title}</div>
                    <span className="mt-1 inline-block rounded-md bg-[#7A1E2C]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#7A1E2C]">
                      {item.categoryLabel}
                    </span>
                    <div className="mt-1 font-mono text-[10px] text-[#7A7164]">{item.slug}</div>
                  </td>
                  <td className="px-3 py-2">{item.cityLabel}</td>
                  <td className="px-3 py-2">{item.foodTypeLabel}</td>
                  <td className="min-w-[11rem] px-3 py-2" data-testid="comida-row-listing-truth">
                    <AdminListingTruthSection
                      lang={lang}
                      status={item.rawStatus}
                      truth={listingTruthById[item.id] ?? null}
                      compact
                    />
                    {item.rawStatus === "suspended" ? (
                      <p className="mt-1 text-[10px] text-[#7A7164]" data-testid="comida-suspended-reason">
                        {adminTr(lang, "comidaAdmin.suspendedBy", { reason: suspendedReason ?? "—" })}
                      </p>
                    ) : null}
                    {anomaly ? (
                      <p className="mt-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900" data-testid="comida-payment-anomaly">
                        {adminTr(lang, "comidaAdmin.payAnomaly", { status: anomaly })}
                      </p>
                    ) : null}
                  </td>
                  <td className="min-w-[12rem] max-w-[16rem] px-3 py-2" data-testid="comida-row-commercial">
                    <div className="text-[10px]">
                      <div className="font-semibold">{item.packageLabel}</div>
                      <div className="text-[#7A7164]" title={item.rawPaymentStatus}>
                        {item.paymentStatusLabel}
                      </div>
                    </div>
                    <div className="mt-1.5 border-t border-[#F0E8DA] pt-1.5">
                      <AdminCommercialTruthSection lang={lang} truth={commercialTruthByListingId[item.id]} compact />
                    </div>
                  </td>
                  <td
                    className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]"
                    title={item.ownerUserId ?? ""}
                  >
                    {item.ownerUserId ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                    {item.publishedAtLabel}
                  </td>
                  <td className="px-3 py-2">
                    {item.mainPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.mainPhotoUrl}
                        alt=""
                        className="h-12 w-16 rounded border border-[#E8DFD0] object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[10px] text-[#7A7164]">—</span>
                    )}
                  </td>
                  <td className="space-y-1 px-3 py-2">
                    <Link
                      href={`${item.publicPath}?${q}`}
                      className="block font-semibold text-[#6B5B2E] underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver ficha
                    </Link>
                    <Link
                      href={`?id=${encodeURIComponent(item.id)}`}
                      className="block text-[#6B5B2E] underline"
                    >
                      Inspeccionar
                    </Link>
                  </td>
                  {actionsById ? (
                    <td className="min-w-[10rem] px-3 py-2" data-testid="comida-row-actions">
                      <ClassifiedAdminRowActions
                        variant="comida-local"
                        rowId={item.id}
                        leonixAdId={item.leonixAdId}
                        displayLabel={item.title}
                        publicLive={item.rawStatus === "published"}
                        promoted={false}
                        verified={false}
                        lifecycleActions={actionsById[item.id] ?? []}
                      />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inspectItem ? (
        <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 text-sm">
          <h3 className="font-bold text-[#1E1810]">
            Inspección — {inspectItem.title} ({inspectItem.leonixAdId ?? inspectItem.id})
          </h3>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[#5C5346]">Contacto</dt>
              <dd>{inspectItem.contactSummary}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#5C5346]">Redes</dt>
              <dd>{inspectItem.socialSummary}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#5C5346]">Creado</dt>
              <dd>{inspectItem.createdAtLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#5C5346]">Actualizado</dt>
              <dd>{inspectItem.updatedAtLabel}</dd>
            </div>
            {inspectItem.expiresAtLabel ? (
              <div>
                <dt className="font-semibold text-[#5C5346]">Expira</dt>
                <dd>{inspectItem.expiresAtLabel}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-semibold text-[#5C5346]">listing_json</dt>
              <dd>{inspectItem.listingJsonSummary ?? "—"}</dd>
            </div>
          </dl>
          {inspectItem.listingJson ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-bold text-[#6B5B2E]">
                Ver listing_json
              </summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-[#E8DFD0] bg-white p-3 font-mono text-[10px]">
                {JSON.stringify(inspectItem.listingJson, null, 2)}
              </pre>
            </details>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
