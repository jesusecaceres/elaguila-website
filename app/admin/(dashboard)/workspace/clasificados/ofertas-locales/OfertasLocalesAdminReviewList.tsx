import Link from "next/link";

import { getSafeOfertaLocalSourceAssetHref } from "@/app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers";
import type {
  OfertaLocalAdminDetailVm,
  OfertaLocalAdminListVm,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminHelpers";
import type { OfertaLocalPublishedAssetMetadata } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";

import { OfertasLocalesAdminAiItemReviewSection } from "./OfertasLocalesAdminAiItemReviewSection";
import { reviewOfertaLocalAdminAction } from "./actions";

type Props = {
  items: OfertaLocalAdminListVm[];
  inspectItem: OfertaLocalAdminDetailVm | null;
  basePath: string;
  scope: "queue" | "live";
  reviewEnabled: boolean;
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "pending_review":
      return "bg-amber-100 text-amber-950";
    case "approved":
      return "bg-emerald-100 text-emerald-950";
    case "rejected":
      return "bg-rose-100 text-rose-950";
    case "archived":
      return "bg-slate-200 text-slate-800";
    default:
      return "bg-[#F0E8DA] text-[#5C5346]";
  }
}

function AssetList({ label, assets }: { label: string; assets: OfertaLocalPublishedAssetMetadata[] }) {
  if (assets.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{label}</h4>
      <ul className="mt-2 space-y-2">
        {assets.map((asset) => {
          const href = getSafeOfertaLocalSourceAssetHref(asset.url);
          return (
            <li key={asset.id} className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-3 text-xs">
              <div className="font-semibold text-[#1E1810]">
                {asset.fileName || asset.title || asset.id}
              </div>
              <div className="mt-1 text-[10px] text-[#7A7164]">
                {asset.assetType}
                {asset.mimeType ? ` · ${asset.mimeType}` : ""}
                {typeof asset.sizeBytes === "number" ? ` · ${asset.sizeBytes} bytes` : ""}
              </div>
              {asset.note ? <p className="mt-1 text-[#5C5346]">{asset.note}</p> : null}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-semibold text-[#6B5B2E] underline"
                >
                  Ver archivo
                </a>
              ) : (
                <p className="mt-2 text-[10px] text-[#7A7164]">Sin URL pública</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SocialLink({ label, href }: { label: string; href?: string | null }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-[#6B5B2E] underline">
      {label}
    </a>
  );
}

function InspectDetail({
  item,
  reviewEnabled,
}: {
  item: OfertaLocalAdminDetailVm;
  reviewEnabled: boolean;
}) {
  const { socialLinks, wantsAiSearchableSpecials, featuredPlacementScope, userNote, adminReviewNotes } =
    item.metadata;

  return (
    <div className="space-y-4 rounded-2xl border border-[#C9B46A]/50 bg-[#FFFCF7] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#1E1810]">{item.businessName}</h3>
          <p className="text-sm text-[#5C5346]">{item.title}</p>
        </div>
        <span className={`rounded-lg px-2 py-1 text-xs font-bold uppercase ${statusBadgeClass(item.status)}`}>
          {item.status}
        </span>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Tipo de oferta</dt>
          <dd>{item.offerType}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Categoría</dt>
          <dd>{item.businessCategory}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Mercado</dt>
          <dd>{item.marketType || "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Vigencia</dt>
          <dd>
            {item.validFrom} → {item.validUntil}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Dirección</dt>
          <dd>
            {[item.address, item.city, item.state, item.zipCode].filter(Boolean).join(", ") || "—"}
          </dd>
        </div>
        {item.serviceZipCodes.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">ZIPs de servicio</dt>
            <dd>{item.serviceZipCodes.join(", ")}</dd>
          </div>
        ) : null}
        {item.phone ? (
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Teléfono</dt>
            <dd>{item.phone}</dd>
          </div>
        ) : null}
        {item.whatsapp ? (
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">WhatsApp</dt>
            <dd>{item.whatsapp}</dd>
          </div>
        ) : null}
        {item.websiteHref ? (
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Sitio web</dt>
            <dd>
              <a href={item.websiteHref} target="_blank" rel="noreferrer" className="underline">
                {item.websiteHref}
              </a>
            </dd>
          </div>
        ) : null}
        {item.directionsHref ? (
          <div>
            <dt className="text-[10px] font-bold uppercase text-[#7A7164]">Direcciones</dt>
            <dd>
              <a href={item.directionsHref} target="_blank" rel="noreferrer" className="underline">
                Abrir mapa
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      {item.description ? (
        <div>
          <h4 className="text-xs font-bold uppercase text-[#7A7164]">Descripción</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#1E1810]">{item.description}</p>
        </div>
      ) : null}

      {item.couponText ? (
        <div>
          <h4 className="text-xs font-bold uppercase text-[#7A7164]">Texto del cupón</h4>
          <p className="mt-1 text-sm">{item.couponText}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <AssetList label="Volantes / flyers" assets={item.flyerAssets} />
        <AssetList label="Cupones" assets={item.couponAssets} />
      </div>

      {(item.membershipUrl ||
        item.digitalCouponUrl ||
        item.requiresMembershipForDeals ||
        item.membershipNote ||
        item.digitalCouponNote) && (
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm">
          <h4 className="text-xs font-bold uppercase text-[#7A7164]">Membresía / cupón digital</h4>
          {item.requiresMembershipForDeals ? (
            <p className="mt-1 text-xs text-amber-900">Requiere membresía para ofertas</p>
          ) : null}
          {item.membershipUrl ? (
            <p className="mt-1">
              <a href={item.membershipUrl} target="_blank" rel="noreferrer" className="underline">
                {item.membershipCtaLabel || "Membresía"}
              </a>
            </p>
          ) : null}
          {item.membershipNote ? <p className="mt-1 text-xs">{item.membershipNote}</p> : null}
          {item.digitalCouponUrl ? (
            <p className="mt-1">
              <a href={item.digitalCouponUrl} target="_blank" rel="noreferrer" className="underline">
                Cupón digital
              </a>
            </p>
          ) : null}
          {item.digitalCouponNote ? <p className="mt-1 text-xs">{item.digitalCouponNote}</p> : null}
        </div>
      )}

      <div className="rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm">
        <h4 className="text-xs font-bold uppercase text-[#7A7164]">Redes y reseñas</h4>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <SocialLink label="Facebook" href={socialLinks.facebookUrl} />
          <SocialLink label="Instagram" href={socialLinks.instagramUrl} />
          <SocialLink label="TikTok" href={socialLinks.tiktokUrl} />
          <SocialLink label="YouTube" href={socialLinks.youtubeUrl} />
          <SocialLink label="Google Business" href={socialLinks.googleBusinessUrl} />
          <SocialLink label="Google Reviews" href={socialLinks.googleReviewUrl} />
          <SocialLink label="Yelp" href={socialLinks.yelpUrl} />
        </div>
        {!socialLinks.facebookUrl &&
        !socialLinks.instagramUrl &&
        !socialLinks.tiktokUrl &&
        !socialLinks.youtubeUrl &&
        !socialLinks.googleBusinessUrl &&
        !socialLinks.googleReviewUrl &&
        !socialLinks.yelpUrl ? (
          <p className="mt-2 text-xs text-[#7A7164]">Sin enlaces sociales en metadata</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm">
          <h4 className="text-xs font-bold uppercase text-[#7A7164]">AI Searchable Specials</h4>
          <p className="mt-1">
            {wantsAiSearchableSpecials ? (
              <span className="font-semibold text-emerald-900">Solicitado — pendiente de revisión de ítems</span>
            ) : (
              <span className="text-[#7A7164]">No solicitado</span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3 text-sm">
          <h4 className="text-xs font-bold uppercase text-[#7A7164]">Featured placement intent</h4>
          <p className="mt-1">
            {item.featuredRequested ? (
              <>
                <span className="font-semibold">Solicitado</span>
                {featuredPlacementScope ? (
                  <span className="text-[#5C5346]"> · alcance: {featuredPlacementScope}</span>
                ) : null}
              </>
            ) : (
              <span className="text-[#7A7164]">No solicitado</span>
            )}
          </p>
          <p className="mt-1 text-[10px] text-[#7A7164]">
            No implica colocación pagada hasta aprobación explícita del equipo Leonix.
          </p>
        </div>
      </div>

      {(userNote || adminReviewNotes.length > 0) && (
        <div className="rounded-xl border border-dashed border-[#C9B46A]/60 bg-[#FBF7EF] p-3 text-sm">
          <h4 className="text-xs font-bold uppercase text-[#7A7164]">Notas internas</h4>
          {userNote ? <p className="mt-1 whitespace-pre-wrap">{userNote}</p> : null}
          {adminReviewNotes.map((note, i) => (
            <pre key={i} className="mt-2 overflow-x-auto rounded bg-white/80 p-2 text-[10px]">
              {note}
            </pre>
          ))}
        </div>
      )}

      <dl className="grid gap-2 text-xs text-[#7A7164] sm:grid-cols-3">
        <div>
          <dt className="font-bold">Owner</dt>
          <dd className="font-mono">{item.ownerId}</dd>
        </div>
        <div>
          <dt className="font-bold">Enviado</dt>
          <dd>{item.submittedAt}</dd>
        </div>
        <div>
          <dt className="font-bold">Actualizado</dt>
          <dd>{item.updatedAt}</dd>
        </div>
      </dl>

      {wantsAiSearchableSpecials ? (
        <OfertasLocalesAdminAiItemReviewSection ofertaLocalId={item.id} />
      ) : null}

      {reviewEnabled && item.status !== "approved" && item.status !== "archived" ? (
        <div className="space-y-3 border-t border-[#E8DFD0] pt-4">
          <h4 className="text-sm font-bold text-[#1E1810]">Moderación</h4>
          <form action={reviewOfertaLocalAdminAction} className="space-y-2">
            <input type="hidden" name="offer_id" value={item.id} />
            <label className="block text-xs font-semibold text-[#5C5346]">
              Nota interna (opcional)
              <textarea
                name="admin_note"
                rows={2}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
                placeholder="Motivo de rechazo o nota de aprobación"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(item.status === "pending_review" ||
                item.status === "submitted" ||
                item.status === "draft") && (
                <>
                  <button
                    type="submit"
                    name="action"
                    value="approve"
                    className="rounded-xl border border-emerald-600/40 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900"
                  >
                    Aprobar
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="reject"
                    className="rounded-xl border border-rose-600/40 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-900"
                  >
                    Rechazar
                  </button>
                </>
              )}
              <button
                type="submit"
                name="action"
                value="archive"
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-bold text-[#5C5346]"
              >
                Archivar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function OfertasLocalesAdminReviewList({
  items,
  inspectItem,
  basePath,
  scope,
  reviewEnabled,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 text-sm text-[#5C5346]">
        <h2 className="text-base font-bold text-[#1E1810]">Ofertas Locales</h2>
        <p className="mt-2">
          {scope === "live"
            ? "No hay ofertas aprobadas en este momento."
            : "No hay envíos pendientes de revisión."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-[#1E1810]">
          Ofertas Locales ({items.length})
        </h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {scope === "live"
            ? "Ofertas aprobadas — elegibles para ruta pública."
            : "Cola pending_review / submitted / draft — no visibles públicamente."}
        </p>
      </div>

      {inspectItem ? <InspectDetail item={inspectItem} reviewEnabled={reviewEnabled} /> : null}

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-left text-xs text-[#1E1810]">
          <thead className="bg-[#FBF7EF] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
            <tr>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Negocio</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Oferta</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Tipo</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Categoría</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Ciudad / ZIP</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Vigencia</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Estado</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Assets</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">AI</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Featured</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Enviado</th>
              <th className="border-b border-[#E8DFD0] px-3 py-2">Revisar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-[#F0E8DA] align-top hover:bg-[#FFFCF7]">
                <td className="max-w-[140px] px-3 py-2 font-semibold">{item.businessName}</td>
                <td className="max-w-[160px] px-3 py-2">{item.title}</td>
                <td className="px-3 py-2">{item.offerType}</td>
                <td className="px-3 py-2">{item.businessCategory}</td>
                <td className="px-3 py-2">
                  {item.city}
                  <div className="font-mono text-[10px] text-[#7A7164]">{item.zipCode}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                  {item.validFrom}
                  <br />→ {item.validUntil}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">{item.assetCount}</td>
                <td className="px-3 py-2">{item.wantsAiSearchableSpecials ? "Sí" : "—"}</td>
                <td className="px-3 py-2">
                  {item.featuredRequested ? (
                    <span title={item.featuredPlacementScope ?? ""}>Sí</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-[10px]" title={item.ownerIdShort}>
                  {item.ownerIdShort}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">
                  {item.submittedAt.slice(0, 10)}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`${basePath}?id=${encodeURIComponent(item.id)}${scope === "live" ? "&scope=live" : ""}`}
                    className="font-semibold text-[#6B5B2E] underline"
                  >
                    Revisar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
