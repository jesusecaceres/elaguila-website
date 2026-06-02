import Link from "next/link";
import { AdminCtaRoutingCallout } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass, adminActionProofOk } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { TiendaStorefrontPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeTiendaStorefrontCopy } from "@/app/lib/tienda/mergeTiendaStorefrontCopy";
import { saveTiendaStorefrontFormAction } from "@/app/admin/tiendaStorefrontAdminActions";
import { TIENDA_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaCategories";
import { TIENDA_HOMEPAGE_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaMerchandising";
import { tiendaPublicContactPath } from "@/app/tienda/utils/tiendaRouting";

export const dynamic = "force-dynamic";

export default async function AdminTiendaStorefrontPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt, error } = await getSiteSectionPayload("tienda_storefront");
  const patch = payload as unknown as TiendaStorefrontPayload;
  const m = mergeTiendaStorefrontCopy(patch);

  return (
    <div className="max-w-4xl space-y-8">
      <AdminPageHeader
        eyebrow="Workspace · Tienda"
        title="`/tienda` storefront — copy & images"
        subtitle="Edit bilingual copy, hero images, and category covers. Catalog products remain at /admin/tienda/catalog."
        helperText="Save publishes to the public storefront (revalidation). Clear a field to fall back to code defaults."
        rightSlot={
          <Link href="/admin/workspace/tienda" className={adminBtnSecondary}>
            ← Tienda map
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} ${adminActionProofOk} p-4 text-sm`}>
          Saved. The public storefront will use these values (empty fields still follow code defaults).
        </div>
      ) : null}

      {error ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          Could not read `site_section_content`: {error}. Check migrations and Supabase variables.
        </div>
      ) : null}

      <p className="text-xs text-[#7A7164]">
        Last updated in storage: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "— (no row yet)"}
      </p>

      <div className={`${adminCardBase} border-[#C9B46A]/35 bg-[#FFFCF7] p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Price, labels & per-item visibility</p>
        <p className="mt-1 text-xs text-[#7A7164]">
          Edited in the catalog (each product record), not here. This screen is storefront marketing: copy, category images, card order, and promo strip.
        </p>
        <Link href="/admin/tienda/catalog" className="mt-2 inline-block text-xs font-bold text-[#6B5B2E] underline">
          Open admin catalog →
        </Link>
      </div>

      <form action={saveTiendaStorefrontFormAction} className="space-y-8">
        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hero (left column)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="hero_eyebrow_es" defaultValue={m.hero.eyebrow.es} />
            <Field label="Eyebrow EN" name="hero_eyebrow_en" defaultValue={m.hero.eyebrow.en} />
            <Field label="Titular ES" name="hero_headline_es" defaultValue={m.hero.headline.es} />
            <Field label="Titular EN" name="hero_headline_en" defaultValue={m.hero.headline.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtitle ES</label>
              <textarea name="hero_subhead_es" className={adminInputClass} rows={3} defaultValue={m.hero.subhead.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtitle EN</label>
              <textarea name="hero_subhead_en" className={adminInputClass} rows={3} defaultValue={m.hero.subhead.en} />
            </div>
            <Field label="Primary CTA ES" name="hero_cta_primary_es" defaultValue={m.hero.ctaPrimary.es} />
            <Field label="Primary CTA EN" name="hero_cta_primary_en" defaultValue={m.hero.ctaPrimary.en} />
            <Field label="Secondary CTA ES" name="hero_cta_secondary_es" defaultValue={m.hero.ctaSecondary.es} />
            <Field label="Secondary CTA EN" name="hero_cta_secondary_en" defaultValue={m.hero.ctaSecondary.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Supporting line ES</label>
              <textarea name="hero_supporting_es" className={adminInputClass} rows={2} defaultValue={m.hero.supportingLine.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Supporting line EN</label>
              <textarea name="hero_supporting_en" className={adminInputClass} rows={2} defaultValue={m.hero.supportingLine.en} />
            </div>
          </div>
          <AdminCtaRoutingCallout title="Hero — button destinations (fixed in code)">
            <p>
              This screen only edits <strong>labels</strong>. On the public site (`/tienda`) the primary points to anchor{" "}
              <code className="rounded bg-white/80 px-1">#shop</code> and the secondary to{" "}
              <code className="rounded bg-white/80 px-1">{tiendaPublicContactPath()}</code> with{" "}
              <code className="rounded bg-white/80 px-1">?lang=</code> — same as{" "}
              <code className="rounded bg-white/80 px-1">app/(site)/tienda/page.tsx</code>.
            </p>
          </AdminCtaRoutingCallout>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hero — mosaic (https URLs)</h2>
          <p className="text-xs text-[#7A7164]">Optional. Empty = default photos from code (`tiendaVisualAssets`).</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Business cards" name="tile_businessCards" defaultValue={patch.heroTileImages?.businessCards ?? ""} />
            <Field label="Banners / large format" name="tile_bannersSigns" defaultValue={patch.heroTileImages?.bannersSigns ?? ""} />
            <Field label="Workflow / process" name="tile_printWorkflow" defaultValue={patch.heroTileImages?.printWorkflow ?? ""} />
            <Field label="Mini flyers" name="tile_thumbFlyers" defaultValue={patch.heroTileImages?.thumbFlyers ?? ""} />
            <Field label="Mini brochures" name="tile_thumbBrochures" defaultValue={patch.heroTileImages?.thumbBrochures ?? ""} />
            <Field label="Mini stickers" name="tile_thumbStickers" defaultValue={patch.heroTileImages?.thumbStickers ?? ""} />
            <Field label="Mini promo" name="tile_thumbPromo" defaultValue={patch.heroTileImages?.thumbPromo ?? ""} />
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Promo strip (storefront)</h2>
          <p className="text-xs text-[#7A7164]">Appears below hero on `/tienda`, before categories. Empty = hidden.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Text ES</label>
              <textarea name="storefront_promo_es" className={adminInputClass} rows={2} defaultValue={patch.storefrontPromoStrip?.es ?? ""} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Text EN</label>
              <textarea name="storefront_promo_en" className={adminInputClass} rows={2} defaultValue={patch.storefrontPromoStrip?.en ?? ""} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Card order (main group)</h2>
          <p className="text-xs text-[#7A7164]">
            Comma-separated slug list. Only affects the “Print & promo” block on the storefront. Invalid slugs are ignored.
          </p>
          <Field
            label="Order (e.g. business-cards, flyers, …)"
            name="homepage_category_order"
            defaultValue={(patch.homepageCategorySlugs ?? [...TIENDA_HOMEPAGE_CATEGORY_SLUGS]).join(", ")}
          />
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">“Shop by category” section</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="cat_eyebrow_es" defaultValue={m.sections.categories.eyebrow.es} />
            <Field label="Eyebrow EN" name="cat_eyebrow_en" defaultValue={m.sections.categories.eyebrow.en} />
            <Field label="Title ES" name="cat_title_es" defaultValue={m.sections.categories.title.es} />
            <Field label="Title EN" name="cat_title_en" defaultValue={m.sections.categories.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Description ES</label>
              <textarea name="cat_desc_es" className={adminInputClass} rows={2} defaultValue={m.sections.categories.description.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Description EN</label>
              <textarea name="cat_desc_en" className={adminInputClass} rows={2} defaultValue={m.sections.categories.description.en} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Category card covers</h2>
          <p className="text-xs text-[#7A7164]">Overrides each category card cover photo (https or local path).</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TIENDA_CATEGORY_SLUGS.map((slug) => (
              <Field
                key={slug}
                label={slug}
                name={`cover_${slug.replace(/-/g, "__")}`}
                defaultValue={patch.categoryCardCoverUrls?.[slug] ?? ""}
              />
            ))}
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Featured block (admin catalog)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="feat_eyebrow_es" defaultValue={m.sections.featured.eyebrow.es} />
            <Field label="Eyebrow EN" name="feat_eyebrow_en" defaultValue={m.sections.featured.eyebrow.en} />
            <Field label="Title ES" name="feat_title_es" defaultValue={m.sections.featured.title.es} />
            <Field label="Title EN" name="feat_title_en" defaultValue={m.sections.featured.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Description ES</label>
              <textarea name="feat_desc_es" className={adminInputClass} rows={2} defaultValue={m.sections.featured.description.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Description EN</label>
              <textarea name="feat_desc_en" className={adminInputClass} rows={2} defaultValue={m.sections.featured.description.en} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="hiw_eyebrow_es" defaultValue={m.sections.howItWorks.eyebrow.es} />
            <Field label="Eyebrow EN" name="hiw_eyebrow_en" defaultValue={m.sections.howItWorks.eyebrow.en} />
            <Field label="Title ES" name="hiw_title_es" defaultValue={m.sections.howItWorks.title.es} />
            <Field label="Title EN" name="hiw_title_en" defaultValue={m.sections.howItWorks.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Description ES</label>
              <textarea name="hiw_desc_es" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.description.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Description EN</label>
              <textarea name="hiw_desc_en" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.description.en} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Note ES</label>
              <textarea name="hiw_note_es" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.note.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Note EN</label>
              <textarea name="hiw_note_en" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.note.en} />
            </div>
          </div>
          <p className="text-xs text-[#7A7164]">The three detailed steps remain defined in code (`tiendaCopy`) for now.</p>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Trust / quality</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="trust_eyebrow_es" defaultValue={m.sections.trust.eyebrow.es} />
            <Field label="Eyebrow EN" name="trust_eyebrow_en" defaultValue={m.sections.trust.eyebrow.en} />
            <Field label="Title ES" name="trust_title_es" defaultValue={m.sections.trust.title.es} />
            <Field label="Title EN" name="trust_title_en" defaultValue={m.sections.trust.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Bullets ES (one per line)</label>
              <textarea
                name="trust_items_es"
                className={adminInputClass}
                rows={6}
                defaultValue={m.sections.trust.items.es.join("\n")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Bullets EN (one per line)</label>
              <textarea
                name="trust_items_en"
                className={adminInputClass}
                rows={6}
                defaultValue={m.sections.trust.items.en.join("\n")}
              />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Final CTA</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title ES" name="fc_title_es" defaultValue={m.sections.finalCta.title.es} />
            <Field label="Title EN" name="fc_title_en" defaultValue={m.sections.finalCta.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Body ES</label>
              <textarea name="fc_body_es" className={adminInputClass} rows={2} defaultValue={m.sections.finalCta.body.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Body EN</label>
              <textarea name="fc_body_en" className={adminInputClass} rows={2} defaultValue={m.sections.finalCta.body.en} />
            </div>
            <Field label="Primary button ES" name="fc_primary_es" defaultValue={m.sections.finalCta.primary.es} />
            <Field label="Primary button EN" name="fc_primary_en" defaultValue={m.sections.finalCta.primary.en} />
            <Field label="Secondary button ES" name="fc_secondary_es" defaultValue={m.sections.finalCta.secondary.es} />
            <Field label="Secondary button EN" name="fc_secondary_en" defaultValue={m.sections.finalCta.secondary.en} />
          </div>
          <AdminCtaRoutingCallout title="Final CTA — destinations (fixed in code)">
            <p>
              Buttons use the same routes as the hero: primary → <code className="rounded bg-white/80 px-1">#shop</code>,
              secondary → <code className="rounded bg-white/80 px-1">{tiendaPublicContactPath()}</code> + language. No URL fields in this form.
            </p>
          </AdminCtaRoutingCallout>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Advanced — category title JSON</h2>
          <p className="text-xs text-[#7A7164]">
            Optional. Format: slug → `title`/`description` with `es`/`en`. Leave empty to skip.
          </p>
          <textarea
            name="category_copy_json"
            className={adminInputClass}
            rows={8}
            defaultValue={
              patch.categoryCardCopy && Object.keys(patch.categoryCardCopy).length
                ? JSON.stringify(patch.categoryCardCopy, null, 2)
                : ""
            }
            placeholder={'{\n  "flyers": { "title": { "es": "…", "en": "…" } }\n}'}
          />
        </section>

        <button type="submit" className={adminBtnPrimary}>
          Save storefront
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={adminInputClass} defaultValue={defaultValue} />
    </div>
  );
}
