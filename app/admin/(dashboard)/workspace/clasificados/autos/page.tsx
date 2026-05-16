import Link from "next/link";
import { autosRowMatchesAdminQueueSearch } from "@/app/admin/_lib/adminAdSearch";
import { getAdminLang, adminMessages } from "@/app/admin/_lib/adminI18n";
import { autosRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import {
  autosClassifiedsRowToDashboardRow,
  listAllAutosClassifiedsRowsForAdmin,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { AutosClassifiedsListingRow } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosListingAdminVisibilityBucket,
  autosListingStatusLabelEn,
  autosListingStatusLabelEs,
} from "@/app/lib/clasificados/autos/autosClassifiedsVisibility";
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { appendPreservedSearchParams, parseAdminScope } from "../_lib/clasificadosAdminScopeUrls";
import { adminCardBase, adminBtnSecondary, adminCtaChipSecondary } from "../../../../_components/adminTheme";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";

export const dynamic = "force-dynamic";

type AutosAdminPageProps = {
  searchParams?: Promise<{ q?: string; scope?: string }>;
};

function autosStripeAdminHint(row: AutosClassifiedsListingRow): string {
  if (row.stripe_payment_intent_id?.trim()) {
    const id = row.stripe_payment_intent_id.trim();
    return `pi…${id.slice(-8)}`;
  }
  if (row.stripe_checkout_session_id?.trim()) {
    const id = row.stripe_checkout_session_id.trim();
    return `cs…${id.slice(-8)}`;
  }
  return "—";
}

function formatTs(iso: string | null, locale: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "—";
  } catch {
    return "—";
  }
}

function formatUsd(n: number | undefined | null, locale: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMiles(n: number | undefined | null, locale: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n)} mi`;
}

function visLabel(bucket: string, m: ReturnType<typeof adminMessages>): string {
  if (bucket === "public") return m("autosQueue.visibilityPublic");
  if (bucket === "pre_publish") return m("autosQueue.visibilityPre");
  return m("autosQueue.visibilityInactive");
}

function statusLabel(status: AutosClassifiedsListingRow["status"], lang: AdminLang): string {
  return lang === "es" ? autosListingStatusLabelEs(status) : autosListingStatusLabelEn(status);
}

export default async function AdminAutosClassifiedsPage(props: AutosAdminPageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const locale = lang === "es" ? "es-MX" : "en-US";

  const sp = (props.searchParams ? await props.searchParams : {}) as Record<string, string | string[] | undefined>;
  const scope = parseAdminScope(sp);
  const qRaw = typeof sp.q === "string" ? sp.q.trim() : "";
  const autosBase = "/admin/workspace/clasificados/autos";
  const queueNavHref = appendPreservedSearchParams(autosBase, sp, null);
  const liveNavHref = appendPreservedSearchParams(autosBase, sp, "live");
  let rows = await listAllAutosClassifiedsRowsForAdmin(400);
  if (qRaw) {
    const profileSet = new Set<string>();
    if (isSupabaseAdminConfigured() && qRaw.length >= 2) {
      const supabase = getAdminSupabase();
      const pids = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
      for (const id of pids) profileSet.add(id);
    }
    rows = rows.filter((r) => {
      const dash = autosClassifiedsRowToDashboardRow(r);
      const L = r.listing_payload;
      const blob = [
        L.year,
        L.make,
        L.model,
        L.trim,
        L.vin,
        L.stockNumber,
        L.state,
        L.zip,
        L.dealerName,
        (L.description ?? "").slice(0, 500),
      ]
        .filter((x) => x != null && String(x).trim() !== "")
        .join(" ")
        .toLowerCase();
      const lx = r.leonix_ad_id ?? null;
      return autosRowMatchesAdminQueueSearch(
        {
          id: r.id,
          owner_user_id: r.owner_user_id,
          title: dash.title,
          city: dash.city,
          leonix_ad_id: lx,
          vehicleTextBlob: blob,
        },
        qRaw,
        profileSet,
      );
    });
  }

  if (scope === "live") {
    rows = rows.filter((r) => autosRowIsPublicLive(r as unknown as Record<string, unknown>));
  }

  const surface = clasificadosQueueSurfaceForSlug("autos");

  return (
    <div className="mx-auto max-w-[110rem] px-4 py-8 sm:px-6">
      <ClasificadosQueueHeader
        title={m("autosQueue.pageTitle")}
        sourceTable={surface.sourceTable}
        subtitle={m("autosQueue.pageSubtitle")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        rightSlot={
          <ClasificadosScopeNav lang={lang} queueHref={queueNavHref} liveHref={liveNavHref} active={scope === "live" ? "live" : "queue"} />
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/workspace/clasificados" className={adminCtaChipSecondary}>
          {m("autosQueue.backGeneric")}
        </Link>
        <Link href="/publicar/autos" className={adminCtaChipSecondary} target="_blank" rel="noreferrer">
          {m("autosQueue.openPublishFlow")}
        </Link>
      </div>

      <div className={`${adminCardBase} mb-6 space-y-3 p-4 text-sm text-[#5C5346]`}>
        <p className="font-bold text-[#1E1810]">{m("autosQueue.searchTitle")}</p>
        <p className="text-[10px] leading-snug text-[#7A7164]">{m("autosQueue.searchHint")}</p>
        <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action={autosBase}>
          {scope === "live" ? <input type="hidden" name="scope" value="live" /> : null}
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{m("autosQueue.labelQ")}</span>
            <input
              name="q"
              defaultValue={qRaw}
              className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
              placeholder={m("autosQueue.placeholderQ")}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]">
            {m("common.apply")}
          </button>
          <Link href={queueNavHref} className={`${adminBtnSecondary} inline-flex items-center text-xs`}>
            {m("common.clear")}
          </Link>
        </form>
      </div>

      {rows.length === 0 ? (
        <div className={`${adminCardBase} p-6 text-sm text-[#5C5346]`}>
          {m("autosQueue.emptyTable")}
        </div>
      ) : (
        <div className={`${adminCardBase} overflow-x-auto p-0`}>
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="px-3 py-2">{m("listings.col.id")}</th>
                <th className="px-3 py-2">{m("listings.col.leonixId")}</th>
                <th className="px-3 py-2">{m("listings.col.title")}</th>
                <th className="px-3 py-2">{m("autosQueue.colVia")}</th>
                <th className="px-3 py-2">{m("autosQueue.colDest")}</th>
                <th className="px-3 py-2">{m("listings.col.status")}</th>
                <th className="px-3 py-2">{m("autosQueue.colVis")}</th>
                <th className="px-3 py-2">{m("autosQueue.colPub")}</th>
                <th className="px-3 py-2">Stripe</th>
                <th className="px-3 py-2">{m("listings.col.date")}</th>
                <th className="px-3 py-2">{m("listings.col.owner")}</th>
                <th className="px-3 py-2">{m("autosQueue.colImg")}</th>
                <th className="px-3 py-2" title={m("autosQueue.actionsColTitle")}>
                  {m("autosQueue.colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const dash = autosClassifiedsRowToDashboardRow(r);
                const bucket = autosListingAdminVisibilityBucket(r.status);
                const vis = visLabel(bucket, m);
                const pub = formatTs(r.published_at, locale);
                const updated = formatTs(r.updated_at, locale);
                const stripeHint = autosStripeAdminHint(r);
                const payload = r.listing_payload;
                const sellerName = (payload.dealerName ?? "").trim();
                const location = [payload.city, payload.state].map((x) => x?.trim()).filter(Boolean).join(", ");
                const contactSignal = [
                  payload.dealerPhoneOffice || payload.dealerPhone,
                  payload.dealerWhatsapp,
                  payload.dealerEmail,
                  payload.dealerWebsite,
                ].some((x) => x?.trim());
                const mediaSignal = [
                  dash.thumbUrl ? "photo" : "",
                  payload.muxPlaybackId?.trim() || payload.muxPlaybackUrl?.trim() ? "video" : "",
                ].filter(Boolean).join(" + ");
                const liveHref =
                  r.status === "active"
                    ? `${autosLiveVehiclePath(r.id)}?lang=${r.lang === "en" ? "en" : "es"}`
                    : null;
                return (
                  <tr key={r.id} className="border-b border-[#E8DFD0]/80">
                    <td className="max-w-[7rem] truncate px-3 py-2 font-mono text-[10px]" title={r.id}>
                      {r.id.slice(0, 8)}…
                    </td>
                    <td className="max-w-[9rem] truncate px-3 py-2 font-mono text-[10px]" title={r.leonix_ad_id ?? ""}>
                      {r.leonix_ad_id ?? "—"}
                    </td>
                    <td className="max-w-[18rem] px-3 py-2" title={dash.title}>
                      <p className="line-clamp-2 font-semibold">{dash.title}</p>
                      <p className="mt-1 text-[10px] font-normal text-[#5C5346]">
                        {formatUsd(payload.price, locale)}
                        {payload.mileage != null ? ` · ${formatMiles(payload.mileage, locale)}` : ""}
                        {location ? ` · ${location}` : ""}
                      </p>
                      {(sellerName || contactSignal || mediaSignal) ? (
                        <p className="mt-0.5 text-[10px] font-normal text-[#7A7164]">
                          {sellerName ? sellerName : r.lane}
                          {contactSignal ? " · contact" : ""}
                          {mediaSignal ? ` · ${mediaSignal}` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{r.lane}</td>
                    <td className="px-3 py-2">{r.featured ? m("autosQueue.yes") : m("autosQueue.no")}</td>
                    <td className="px-3 py-2">{statusLabel(r.status, lang)}</td>
                    <td className="px-3 py-2">{vis}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[#5C5346]">{pub}</td>
                    <td
                      className="max-w-[8rem] truncate px-3 py-2 font-mono text-[10px]"
                      title={[r.stripe_checkout_session_id, r.stripe_payment_intent_id].filter(Boolean).join(" · ") || undefined}
                    >
                      {stripeHint}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[#5C5346]">{updated}</td>
                    <td className="max-w-[6rem] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id}>
                      {r.owner_user_id.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">{dash.thumbUrl ? m("autosQueue.yes") : m("autosQueue.no")}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-2">
                        {liveHref ? (
                          <Link
                            href={liveHref}
                            className="font-bold text-[#6B5B2E] underline"
                            target="_blank"
                            rel="noreferrer"
                            title={m("autosQueue.viewPublicTitle")}
                          >
                            {m("autosQueue.viewPublic")}
                          </Link>
                        ) : (
                          <span className="text-[#7A7164]">—</span>
                        )}
                        <ClassifiedAdminRowActions
                          variant="autos"
                          rowId={r.id}
                          publicLive={r.status === "active"}
                          promoted={r.featured}
                          verified={Boolean(r.leonix_verified)}
                          canArchive={r.status !== "cancelled" && r.status !== "draft" && r.status !== "pending_payment"}
                          staffEditBoardHref={`/dashboard/mis-anuncios/${encodeURIComponent(r.id)}`}
                          republishCategory="autos"
                          republishRow={{
                            lane: r.lane,
                            status: r.status,
                            republish_override: (r as { republish_override?: boolean | null }).republish_override,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
