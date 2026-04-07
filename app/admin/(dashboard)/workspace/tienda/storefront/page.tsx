import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { TiendaStorefrontPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeTiendaStorefrontCopy } from "@/app/lib/tienda/mergeTiendaStorefrontCopy";
import { saveTiendaStorefrontFormAction } from "@/app/admin/tiendaStorefrontAdminActions";
import { TIENDA_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaCategories";
import { TIENDA_HOMEPAGE_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaMerchandising";

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
        title="Vitrina `/tienda` — textos e imágenes"
        subtitle="Edita copy bilingüe, imágenes del héroe y portadas de categoría. Los productos del catálogo siguen en /admin/tienda/catalog."
        helperText="Guardar publica en la vitrina pública (revalidación). Vacía un campo para volver al texto por defecto del código."
        rightSlot={
          <Link href="/admin/workspace/tienda" className={adminBtnSecondary}>
            ← Mapa Tienda
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
          Guardado. La vitrina pública usará estos valores (salvo campos vacíos, que siguen el código base).
        </div>
      ) : null}

      {error ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          No se pudo leer `site_section_content`: {error}. Comprueba migraciones y variables Supabase.
        </div>
      ) : null}

      <p className="text-xs text-[#7A7164]">
        Última actualización en almacén: {updatedAt ? new Date(updatedAt).toLocaleString() : "— (sin fila aún)"}
      </p>

      <form action={saveTiendaStorefrontFormAction} className="space-y-8">
        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hero (columna izquierda)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="hero_eyebrow_es" defaultValue={m.hero.eyebrow.es} />
            <Field label="Eyebrow EN" name="hero_eyebrow_en" defaultValue={m.hero.eyebrow.en} />
            <Field label="Titular ES" name="hero_headline_es" defaultValue={m.hero.headline.es} />
            <Field label="Titular EN" name="hero_headline_en" defaultValue={m.hero.headline.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtítulo ES</label>
              <textarea name="hero_subhead_es" className={adminInputClass} rows={3} defaultValue={m.hero.subhead.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Subtítulo EN</label>
              <textarea name="hero_subhead_en" className={adminInputClass} rows={3} defaultValue={m.hero.subhead.en} />
            </div>
            <Field label="CTA primario ES" name="hero_cta_primary_es" defaultValue={m.hero.ctaPrimary.es} />
            <Field label="CTA primario EN" name="hero_cta_primary_en" defaultValue={m.hero.ctaPrimary.en} />
            <Field label="CTA secundario ES" name="hero_cta_secondary_es" defaultValue={m.hero.ctaSecondary.es} />
            <Field label="CTA secundario EN" name="hero_cta_secondary_en" defaultValue={m.hero.ctaSecondary.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Línea de soporte ES</label>
              <textarea name="hero_supporting_es" className={adminInputClass} rows={2} defaultValue={m.hero.supportingLine.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Línea de soporte EN</label>
              <textarea name="hero_supporting_en" className={adminInputClass} rows={2} defaultValue={m.hero.supportingLine.en} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hero — mosaico (URLs https)</h2>
          <p className="text-xs text-[#7A7164]">Opcional. Vacío = fotos por defecto del código (`tiendaVisualAssets`).</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tarjetas" name="tile_businessCards" defaultValue={patch.heroTileImages?.businessCards ?? ""} />
            <Field label="Banners / gran formato" name="tile_bannersSigns" defaultValue={patch.heroTileImages?.bannersSigns ?? ""} />
            <Field label="Flujo / proceso" name="tile_printWorkflow" defaultValue={patch.heroTileImages?.printWorkflow ?? ""} />
            <Field label="Mini volantes" name="tile_thumbFlyers" defaultValue={patch.heroTileImages?.thumbFlyers ?? ""} />
            <Field label="Mini brochures" name="tile_thumbBrochures" defaultValue={patch.heroTileImages?.thumbBrochures ?? ""} />
            <Field label="Mini stickers" name="tile_thumbStickers" defaultValue={patch.heroTileImages?.thumbStickers ?? ""} />
            <Field label="Mini promo" name="tile_thumbPromo" defaultValue={patch.heroTileImages?.thumbPromo ?? ""} />
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Franja promo (vitrina)</h2>
          <p className="text-xs text-[#7A7164]">Aparece debajo del hero en `/tienda`, antes de las categorías. Vacío = oculta.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Texto ES</label>
              <textarea name="storefront_promo_es" className={adminInputClass} rows={2} defaultValue={patch.storefrontPromoStrip?.es ?? ""} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">Texto EN</label>
              <textarea name="storefront_promo_en" className={adminInputClass} rows={2} defaultValue={patch.storefrontPromoStrip?.en ?? ""} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Orden de tarjetas (grupo principal)</h2>
          <p className="text-xs text-[#7A7164]">
            Lista de slugs separados por coma. Solo afecta el bloque “Impresión y promo” en la vitrina. Slugs inválidos se ignoran.
          </p>
          <Field
            label="Orden (ej. business-cards, flyers, …)"
            name="homepage_category_order"
            defaultValue={(patch.homepageCategorySlugs ?? [...TIENDA_HOMEPAGE_CATEGORY_SLUGS]).join(", ")}
          />
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Sección “Comprar por categoría”</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="cat_eyebrow_es" defaultValue={m.sections.categories.eyebrow.es} />
            <Field label="Eyebrow EN" name="cat_eyebrow_en" defaultValue={m.sections.categories.eyebrow.en} />
            <Field label="Título ES" name="cat_title_es" defaultValue={m.sections.categories.title.es} />
            <Field label="Título EN" name="cat_title_en" defaultValue={m.sections.categories.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Descripción ES</label>
              <textarea name="cat_desc_es" className={adminInputClass} rows={2} defaultValue={m.sections.categories.description.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Descripción EN</label>
              <textarea name="cat_desc_en" className={adminInputClass} rows={2} defaultValue={m.sections.categories.description.en} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Portadas de tarjeta por categoría</h2>
          <p className="text-xs text-[#7A7164]">Sobrescribe la foto de portada de cada categoría (https o ruta local).</p>
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Bloque destacados (catálogo admin)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="feat_eyebrow_es" defaultValue={m.sections.featured.eyebrow.es} />
            <Field label="Eyebrow EN" name="feat_eyebrow_en" defaultValue={m.sections.featured.eyebrow.en} />
            <Field label="Título ES" name="feat_title_es" defaultValue={m.sections.featured.title.es} />
            <Field label="Título EN" name="feat_title_en" defaultValue={m.sections.featured.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Descripción ES</label>
              <textarea name="feat_desc_es" className={adminInputClass} rows={2} defaultValue={m.sections.featured.description.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Descripción EN</label>
              <textarea name="feat_desc_en" className={adminInputClass} rows={2} defaultValue={m.sections.featured.description.en} />
            </div>
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Cómo funciona</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="hiw_eyebrow_es" defaultValue={m.sections.howItWorks.eyebrow.es} />
            <Field label="Eyebrow EN" name="hiw_eyebrow_en" defaultValue={m.sections.howItWorks.eyebrow.en} />
            <Field label="Título ES" name="hiw_title_es" defaultValue={m.sections.howItWorks.title.es} />
            <Field label="Título EN" name="hiw_title_en" defaultValue={m.sections.howItWorks.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Descripción ES</label>
              <textarea name="hiw_desc_es" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.description.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Descripción EN</label>
              <textarea name="hiw_desc_en" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.description.en} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Nota ES</label>
              <textarea name="hiw_note_es" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.note.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Nota EN</label>
              <textarea name="hiw_note_en" className={adminInputClass} rows={2} defaultValue={m.sections.howItWorks.note.en} />
            </div>
          </div>
          <p className="text-xs text-[#7A7164]">Los tres pasos detallados siguen definidos en código (`tiendaCopy`) por ahora.</p>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Confianza / calidad</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow ES" name="trust_eyebrow_es" defaultValue={m.sections.trust.eyebrow.es} />
            <Field label="Eyebrow EN" name="trust_eyebrow_en" defaultValue={m.sections.trust.eyebrow.en} />
            <Field label="Título ES" name="trust_title_es" defaultValue={m.sections.trust.title.es} />
            <Field label="Título EN" name="trust_title_en" defaultValue={m.sections.trust.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Bullets ES (uno por línea)</label>
              <textarea
                name="trust_items_es"
                className={adminInputClass}
                rows={6}
                defaultValue={m.sections.trust.items.es.join("\n")}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Bullets EN (uno por línea)</label>
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">CTA final</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título ES" name="fc_title_es" defaultValue={m.sections.finalCta.title.es} />
            <Field label="Título EN" name="fc_title_en" defaultValue={m.sections.finalCta.title.en} />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Cuerpo ES</label>
              <textarea name="fc_body_es" className={adminInputClass} rows={2} defaultValue={m.sections.finalCta.body.es} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[#5C5346]">Cuerpo EN</label>
              <textarea name="fc_body_en" className={adminInputClass} rows={2} defaultValue={m.sections.finalCta.body.en} />
            </div>
            <Field label="Botón primario ES" name="fc_primary_es" defaultValue={m.sections.finalCta.primary.es} />
            <Field label="Botón primario EN" name="fc_primary_en" defaultValue={m.sections.finalCta.primary.en} />
            <Field label="Botón secundario ES" name="fc_secondary_es" defaultValue={m.sections.finalCta.secondary.es} />
            <Field label="Botón secundario EN" name="fc_secondary_en" defaultValue={m.sections.finalCta.secondary.en} />
          </div>
        </section>

        <section className={`${adminCardBase} space-y-4 p-6`}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Avanzado — JSON de títulos por categoría</h2>
          <p className="text-xs text-[#7A7164]">
            Opcional. Formato: slug → `title`/`description` con `es`/`en`. Deja vacío para no usar.
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
          Guardar vitrina
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
