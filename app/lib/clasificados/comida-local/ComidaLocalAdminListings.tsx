import Link from "next/link";

import type { ComidaLocalAdminListingVm } from "./mapComidaLocalAdminListing";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  items: ComidaLocalAdminListingVm[];
  inspectId?: string | null;
  statusUpdateAction?: (formData: FormData) => Promise<void>;
};

const STATUS_OPTIONS = [
  "draft",
  "published",
  "paused",
  "suspended",
  "pending_payment",
] as const;

export function ComidaLocalAdminListings({
  lang,
  items,
  inspectId,
  statusUpdateAction,
}: Props) {
  const q = `lang=${lang}`;
  const inspectItem = inspectId ? items.find((i) => i.id === inspectId) ?? null : null;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 text-sm text-[#5C5346]">
        <h2 className="text-base font-bold text-[#1E1810]">Comida Local</h2>
        <p className="mt-2">No hay publicaciones de Comida Local todavía.</p>
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
        <table className="w-full min-w-[960px] border-collapse text-left text-xs text-[#1E1810]">
          <thead className="bg-[#FBF7EF] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
            <tr>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Leonix ID</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Negocio</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Ciudad</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Tipo</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Estado</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Paquete / pago</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Publicado</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Foto</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Enlaces</th>
              {statusUpdateAction ? (
                <th className="border-b border-[#E8DFD0] px-3 py-2">Moderación</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#F0E8DA] align-top hover:bg-[#FFFCF7]">
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
                <td className="px-3 py-2">
                  <span title={item.rawStatus}>{item.statusLabel}</span>
                </td>
                <td className="px-3 py-2">
                  <div>{item.packageLabel}</div>
                  <div className="text-[10px] text-[#7A7164]" title={item.rawPaymentStatus}>
                    {item.paymentStatusLabel}
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
                {statusUpdateAction ? (
                  <td className="px-3 py-2">
                    <form action={statusUpdateAction} className="flex max-w-[12rem] flex-col gap-1">
                      <input type="hidden" name="listing_id" value={item.id} />
                      <select
                        name="listing_status"
                        defaultValue={item.rawStatus}
                        className="max-w-[11rem] rounded border border-[#E8DFD0] bg-white px-1 py-1 text-[11px]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded border border-[#C9B46A]/60 bg-[#FFFCF7] px-2 py-1 text-[10px] font-bold text-[#5C4E2E]"
                      >
                        Guardar estado
                      </button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
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
