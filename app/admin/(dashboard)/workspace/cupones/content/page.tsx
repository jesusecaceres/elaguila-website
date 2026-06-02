import Link from "next/link";
import { AdminCtaRoutingCallout } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { CuponCardPayload, CuponesPagePayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeCuponesPagePayload } from "@/app/lib/siteSectionContent/cuponesPageMerge";
import { saveCuponesPageAction } from "@/app/admin/sectionPageActions";

export const dynamic = "force-dynamic";

const SLOTS = 8;

function slotCoupon(patch: CuponesPagePayload, merged: { coupons: CuponCardPayload[] }, i: number): CuponCardPayload {
  const fromPatch = patch.coupons?.[i];
  const fromMerged = merged.coupons[i];
  return {
    titleEs: fromPatch?.titleEs ?? fromMerged?.titleEs ?? "",
    titleEn: fromPatch?.titleEn ?? fromMerged?.titleEn ?? "",
    businessEs: fromPatch?.businessEs ?? fromMerged?.businessEs ?? "",
    businessEn: fromPatch?.businessEn ?? fromMerged?.businessEn ?? "",
    descriptionEs: fromPatch?.descriptionEs ?? fromMerged?.descriptionEs ?? "",
    descriptionEn: fromPatch?.descriptionEn ?? fromMerged?.descriptionEn ?? "",
    image: fromPatch?.image ?? fromMerged?.image ?? "",
    expiresEs: fromPatch?.expiresEs ?? fromMerged?.expiresEs ?? "",
    expiresEn: fromPatch?.expiresEn ?? fromMerged?.expiresEn ?? "",
  };
}

export default async function AdminCuponesContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("cupones_page");
  const patch = payload as unknown as CuponesPagePayload;
  const merged = mergeCuponesPagePayload(payload);

  return (
    <div className="max-w-4xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Cupones"
        title="`/cupones` and `/coupons` — headline & cards"
        subtitle="One bilingual payload feeds both public routes. Leave a coupon row empty (no ES or EN title) to omit it on save."
        helperText="site_section_content → cupones_page. Images under /public (e.g. /coupons/…)."
        rightSlot={
          <Link href="/admin/workspace/cupones" className={adminBtnSecondary}>
            ← Workspace overview
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}</p>

      <p className="text-xs text-[#5C5346]">
        <a href="/cupones" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          /cupones
        </a>{" "}
        ·{" "}
        <a href="/coupons" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          /coupons
        </a>
      </p>

      <form action={saveCuponesPageAction} className={`${adminCardBase} space-y-6 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Page</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título página ES" name="page_title_es" defaultValue={patch.pageTitle?.es ?? ""} placeholder={merged.titleEs} />
          <Field label="Título página EN" name="page_title_en" defaultValue={patch.pageTitle?.en ?? ""} placeholder={merged.titleEn} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Intro ES</label>
          <textarea name="intro_es" className={adminInputClass} rows={2} defaultValue={patch.intro?.es ?? ""} placeholder={merged.introEs} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Intro EN</label>
          <textarea name="intro_en" className={adminInputClass} rows={2} defaultValue={patch.intro?.en ?? ""} placeholder={merged.introEn} />
        </div>

        <AdminCtaRoutingCallout title="Per-coupon links">
          <p>
            This editor <strong>does not define a URL per coupon</strong>: public cards are informational (image + text in{" "}
            <code className="rounded bg-white/80 px-1">CouponCard</code>). No configurable CTA destination here until the data model supports it.
          </p>
        </AdminCtaRoutingCallout>

        {Array.from({ length: SLOTS }, (_, idx) => {
          const i = idx + 1;
          const c = slotCoupon(patch, merged, idx);
          return (
            <div key={i} className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-4">
              <p className="text-xs font-bold uppercase text-[#7A7164]">Coupon #{i}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Título ES" name={`c${i}_title_es`} defaultValue={c.titleEs} />
                <Field label="Título EN" name={`c${i}_title_en`} defaultValue={c.titleEn} />
                <Field label="Negocio ES" name={`c${i}_biz_es`} defaultValue={c.businessEs} />
                <Field label="Negocio EN" name={`c${i}_biz_en`} defaultValue={c.businessEn} />
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-[#5C5346]">Description ES</label>
                  <textarea name={`c${i}_desc_es`} className={adminInputClass} rows={2} defaultValue={c.descriptionEs} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#5C5346]">Description EN</label>
                  <textarea name={`c${i}_desc_en`} className={adminInputClass} rows={2} defaultValue={c.descriptionEn} />
                </div>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Field label="Image (/coupons/…)" name={`c${i}_img`} defaultValue={c.image} />
                <Field label="Expires ES (freeform)" name={`c${i}_exp_es`} defaultValue={c.expiresEs} />
                <Field label="Expires EN" name={`c${i}_exp_en`} defaultValue={c.expiresEn} />
              </div>
            </div>
          );
        })}

        <button type="submit" className={adminBtnPrimary}>
          Save
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={adminInputClass} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}
