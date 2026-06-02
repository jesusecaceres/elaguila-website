import Link from "next/link";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminCtaChipSecondary, adminInputClass, adminActionProofOk } from "@/app/admin/_components/adminTheme";
import { saveEnVentaCategoryContentAction } from "@/app/admin/clasificadosCategoryContentActions";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import { getEnVentaContentPatchForAdmin } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { getCategorySchema } from "@/app/clasificados/config/categorySchema";
import {
  mergeDetailFieldPatch,
  mergeEnVentaHubLanding,
  mergeEnVentaPublishHub,
} from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { DETAIL_FIELDS } from "@/app/clasificados/config/publishDetailFields";

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={`${adminInputClass} mt-1`} defaultValue={defaultValue} />
    </div>
  );
}

export async function EnVentaCategoryContentBlock(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const [{ updatedAt }, patch] = await Promise.all([
    getSiteSectionPayload("clasificados_category_content"),
    getEnVentaContentPatchForAdmin(),
  ]);

  const hubEs = mergeEnVentaHubLanding("es", patch);
  const hubEn = mergeEnVentaHubLanding("en", patch);
  const pubEs = mergeEnVentaPublishHub("es", patch);
  const pubEn = mergeEnVentaPublishHub("en", patch);

  const staffEs = patch?.staffModerationNotes?.es ?? "";
  const staffEn = patch?.staffModerationNotes?.en ?? "";

  const schema = getCategorySchema("en-venta");
  const queueHref = "/admin/workspace/clasificados/en-venta";

  return (
    <div className="space-y-6">
      {sp.saved === "1" ? (
        <div className={`${adminCardBase} ${adminActionProofOk} p-4 text-sm`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">
        Last updated (section): {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}
      </p>

      <div className={`${adminCardBase} flex flex-wrap gap-3 p-4`}>
        <Link href={queueHref} className={`${adminCtaChipSecondary} justify-center font-bold`}>
          Listings queue (en-venta) →
        </Link>
        <Link href="/admin/reportes" className={`${adminCtaChipSecondary} justify-center`}>
          Reports →
        </Link>
        <Link href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} className={`${adminCtaChipSecondary} justify-center`}>
          Category registry →
        </Link>
      </div>

      {schema ? (
        <div className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Code schema (reference)</p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-[#3D3428]">Plans</dt>
              <dd className="font-mono text-[#1E1810]">{schema.plans.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[#3D3428]">DETAIL_FIELDS group</dt>
              <dd className="font-mono text-[#1E1810]">{schema.formFieldGroupKey ?? "—"}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className={`${adminCardBase} border-[#7A9E6F]/35 bg-[#F8FCF6] p-4 text-sm text-[#2C4A22]`}>
        <p>
          <strong>Public routes affected by this form:</strong>{" "}
          <Link className="font-bold underline" href="/clasificados/en-venta" target="_blank" rel="noreferrer">
            /clasificados/en-venta
          </Link>{" "}
          (hub) and{" "}
          <Link className="font-bold underline" href="/clasificados/publicar/en-venta" target="_blank" rel="noreferrer">
            /clasificados/publicar/en-venta
          </Link>{" "}
          (plan selector). Publish wizard step copy still reads code definitions until field overrides connect to the orchestrator.
        </p>
      </div>

      <form action={saveEnVentaCategoryContentAction} className={`${adminCardBase} space-y-6 p-6`}>
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hub — branding / hero</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Optional emoji before title; optional image above logo. Image paths:{" "}
            <code className="rounded bg-[#FBF7EF] px-1">/</code> o <code className="rounded bg-[#FBF7EF] px-1">https://</code>.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Hero — ES" name="hub_hero_es" defaultValue={hubEs.hero} />
            <Field label="Hero — EN" name="hub_hero_en" defaultValue={hubEn.hero} />
            <Field label="Subtitle — ES" name="hub_sub_es" defaultValue={hubEs.sub} />
            <Field label="Subtitle — EN" name="hub_sub_en" defaultValue={hubEn.sub} />
            <Field label="Hero emoji (optional)" name="hub_hero_emoji" defaultValue={hubEs.heroEmoji} />
            <Field label="Hero image URL (optional)" name="hub_hero_image_url" defaultValue={hubEs.heroImageUrl} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hub — search and CTAs</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Search placeholder — ES" name="hub_searchPh_es" defaultValue={hubEs.searchPh} />
            <Field label="Search placeholder — EN" name="hub_searchPh_en" defaultValue={hubEn.searchPh} />
            <Field label="Search button — ES" name="hub_search_es" defaultValue={hubEs.search} />
            <Field label="Search button — EN" name="hub_search_en" defaultValue={hubEn.search} />
            <Field label="Publicar — ES" name="hub_publish_es" defaultValue={hubEs.publish} />
            <Field label="Publicar — EN" name="hub_publish_en" defaultValue={hubEn.publish} />
            <Field label="View listings — ES" name="hub_lista_es" defaultValue={hubEs.lista} />
            <Field label="View listings — EN" name="hub_lista_en" defaultValue={hubEn.lista} />
            <Field label="Trust line — ES" name="hub_trust_es" defaultValue={hubEs.trust} />
            <Field label="Trust line — EN" name="hub_trust_en" defaultValue={hubEn.trust} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Publish — plan selector (hub)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Copy for the three cards and the “back” link. <strong>Back URL</strong> (path only, e.g.{" "}
            <code className="rounded bg-[#FBF7EF] px-1">/clasificados/publicar</code>) overrides the default destination.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Title — ES" name="pub_title_es" defaultValue={pubEs.title} />
            <Field label="Title — EN" name="pub_title_en" defaultValue={pubEn.title} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtitle — ES</label>
              <textarea name="pub_subtitle_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.subtitle} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtitle — EN</label>
              <textarea name="pub_subtitle_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.subtitle} />
            </div>
            <Field label="Free — title ES" name="pub_freeTitle_es" defaultValue={pubEs.freeTitle} />
            <Field label="Free — title EN" name="pub_freeTitle_en" defaultValue={pubEn.freeTitle} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Free — description ES</label>
              <textarea name="pub_freeDesc_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.freeDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Free — description EN</label>
              <textarea name="pub_freeDesc_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.freeDesc} />
            </div>
            <Field label="Pro — title ES" name="pub_proTitle_es" defaultValue={pubEs.proTitle} />
            <Field label="Pro — title EN" name="pub_proTitle_en" defaultValue={pubEn.proTitle} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Pro — description ES</label>
              <textarea name="pub_proDesc_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.proDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Pro — description EN</label>
              <textarea name="pub_proDesc_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.proDesc} />
            </div>
            <Field label="Storefront — title ES" name="pub_sfTitle_es" defaultValue={pubEs.sfTitle} />
            <Field label="Storefront — title EN" name="pub_sfTitle_en" defaultValue={pubEn.sfTitle} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Storefront — description ES</label>
              <textarea name="pub_sfDesc_es" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEs.sfDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Storefront — description EN</label>
              <textarea name="pub_sfDesc_en" className={`${adminInputClass} mt-1`} rows={2} defaultValue={pubEn.sfDesc} />
            </div>
            <Field label="Volver — ES" name="pub_back_es" defaultValue={pubEs.back} />
            <Field label="Volver — EN" name="pub_back_en" defaultValue={pubEn.back} />
            <Field label="Volver — href (path)" name="pub_back_href" defaultValue={pubEs.backHref} />
            <Field label="Free lane — emoji" name="pub_lane_free_emoji" defaultValue={pubEs.laneFreeEmoji} />
            <Field label="Pro lane — badge / text" name="pub_lane_pro_badge" defaultValue={pubEs.laneProBadge} />
            <Field label="Storefront lane — emoji" name="pub_lane_sf_emoji" defaultValue={pubEs.laneSfEmoji} />
          </div>
          <p className="mt-2 text-xs text-[#7A7164]">
            Language toggle on the publish page uses fixed code copy (ES/EN) unless we extend the model.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Publish form fields (overrides)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Labels / placeholders / help per field (<code className="rounded bg-[#FBF7EF] px-1">en-venta</code> group in code). On the public site, the Free/Pro wizard at{" "}
            <code className="rounded bg-[#FBF7EF] px-1">/clasificados/publicar/en-venta/free|pro</code> merges these values server-side and applies them in steps (category, price, delivery, contact, etc.).{" "}
            <code className="rounded bg-[#FBF7EF] px-1">getPublishCategoryFields</code> also accepts the same overrides for annexes / utilities that pass them.
          </p>
          <div className="mt-4 space-y-6">
            {(DETAIL_FIELDS["en-venta"] ?? []).map((row) => {
              const mEs = mergeDetailFieldPatch(row.label, row.placeholder, patch?.detailFields?.[row.key], "es");
              const mEn = mergeDetailFieldPatch(row.label, row.placeholder, patch?.detailFields?.[row.key], "en");
              return (
                <div key={row.key} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-4">
                  <p className="font-mono text-[11px] font-bold text-[#7A7164]">
                    {row.key} · {row.type}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <Field label="Label ES" name={`df_${row.key}_label_es`} defaultValue={mEs.label} />
                    <Field label="Label EN" name={`df_${row.key}_label_en`} defaultValue={mEn.label} />
                    <Field label="Placeholder ES" name={`df_${row.key}_ph_es`} defaultValue={mEs.placeholder ?? ""} />
                    <Field label="Placeholder EN" name={`df_${row.key}_ph_en`} defaultValue={mEn.placeholder ?? ""} />
                    <Field label="Help ES (optional)" name={`df_${row.key}_help_es`} defaultValue={mEs.help ?? ""} />
                    <Field label="Help EN (optional)" name={`df_${row.key}_help_en`} defaultValue={mEn.help ?? ""} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Internal notes (moderation)</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Not shown on the public site with the current template; reference for the team.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">ES</label>
              <textarea name="staff_mod_es" className={`${adminInputClass} mt-1`} rows={3} defaultValue={staffEs} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">EN</label>
              <textarea name="staff_mod_en" className={`${adminInputClass} mt-1`} rows={3} defaultValue={staffEn} />
            </div>
          </div>
        </section>

        <button type="submit" className={adminBtnPrimary}>
          Save
        </button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
          ← Clasificados hub
        </Link>
      </div>
    </div>
  );
}
