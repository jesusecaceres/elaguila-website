import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "../../_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { GlobalSitePayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeGlobalSite } from "@/app/lib/siteSectionContent/globalSiteMerge";
import { saveGlobalSiteAction } from "@/app/admin/globalSiteActions";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

export const dynamic = "force-dynamic";

export default async function AdminGlobalSiteSettingsPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt, error } = await getSiteSectionPayload("global_site");
  const patch = payload as unknown as GlobalSitePayload;
  const g = mergeGlobalSite(patch);
  const locale = lang === "es" ? "es-MX" : "en-US";

  return (
    <div>
      <AdminPageHeader
        title={m("globalSitePage.title")}
        subtitle={m("globalSitePage.subtitle")}
        eyebrow="Global admin"
        helperText={m("globalSitePage.helperText")}
        rightSlot={
          <Link href="/admin/workspace/home" className={adminBtnSecondary}>
            {m("globalSitePage.homeEditorCta")}
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} mb-6 border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          {m("globalSitePage.savedBanner")}
        </div>
      ) : null}

      {error ? (
        <div className={`${adminCardBase} mb-6 border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          {m("globalSitePage.readError")} {error}
        </div>
      ) : null}

      <div className={`${adminCardBase} mb-6 border-[#D8C79A]/60 bg-[#FFFCF4] p-4 text-xs text-[#5C5346]`}>
        <strong className="font-semibold text-[#3D3428]">{m("globalSitePage.clasificadosLead")}</strong>{" "}
        <Link href="/admin/workspace/clasificados" className="font-semibold text-[#2F4A65] underline underline-offset-2">
          /admin/workspace/clasificados
        </Link>
        {m("globalSitePage.clasificadosTail")}
      </div>

      <p className="mb-4 text-xs text-[#7A7164]">
        {m("globalSitePage.updated")} {updatedAt ? new Date(updatedAt).toLocaleString(locale) : "—"}
      </p>

      <form action={saveGlobalSiteAction} className={`${adminCardBase} space-y-6 p-6`}>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">{m("globalSitePage.sectionMenu")}</h2>
          <p className="mt-1 text-xs text-[#7A7164]">{m("globalSitePage.sectionMenuBody")}</p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input
              type="checkbox"
              name="toggle_banner_region"
              defaultChecked={g.toggles.showSiteWideBanners}
              className="h-4 w-4 rounded border-[#E8DFD0]"
            />
            {m("globalSitePage.toggleMenuBanners")}
          </label>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">{m("globalSitePage.sectionNotice")}</h2>
          <p className="mt-1 text-xs text-[#7A7164]">{m("globalSitePage.sectionNoticeBody")}</p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input
              type="checkbox"
              name="toggle_notice"
              defaultChecked={g.toggles.showSitewideNotice}
              className="h-4 w-4 rounded border-[#E8DFD0]"
            />
            {m("globalSitePage.toggleNotice")}
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">{m("globalSitePage.labelNoticeEs")}</label>
              <textarea name="notice_es" className={adminInputClass} rows={2} defaultValue={g.notice.es} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">{m("globalSitePage.labelNoticeEn")}</label>
              <textarea name="notice_en" className={adminInputClass} rows={2} defaultValue={g.notice.en} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">{m("globalSitePage.sectionPromo")}</h2>
          <p className="mt-1 text-xs text-[#7A7164]">{m("globalSitePage.sectionPromoBody")}</p>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#3D3428]">
            <input
              type="checkbox"
              name="toggle_promo"
              defaultChecked={g.toggles.showGlobalPromoStrip}
              className="h-4 w-4 rounded border-[#E8DFD0]"
            />
            {m("globalSitePage.togglePromo")}
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">{m("globalSitePage.labelPromoEs")}</label>
              <textarea name="promo_es" className={adminInputClass} rows={2} defaultValue={g.promo.es} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">{m("globalSitePage.labelPromoEn")}</label>
              <textarea name="promo_en" className={adminInputClass} rows={2} defaultValue={g.promo.en} />
            </div>
          </div>
        </section>

        <button type="submit" className={adminBtnPrimary}>
          {m("globalSitePage.submit")}
        </button>
      </form>

      <div className={`${adminCardBase} mt-8 p-4 text-xs text-[#7A7164]`}>{m("globalSitePage.footer")}</div>
    </div>
  );
}
