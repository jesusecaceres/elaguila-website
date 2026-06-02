import Link from "next/link";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminCtaChipSecondary, adminInputClass, adminActionProofOk, adminInfoCallout } from "@/app/admin/_components/adminTheme";
import { saveCategoryDetailFieldsContentAction } from "@/app/admin/clasificadosCategoryContentActions";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type {
  ClasificadosCategoryContentRootPayload,
  ClasificadosCategoryDetailOnlyPatch,
} from "@/app/lib/clasificados/clasificadosCategoryContentTypes";
import { extractCategoryPatch, mergeDetailFieldPatch } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { DETAIL_FIELDS } from "@/app/clasificados/config/publishDetailFields";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#5C5346]">{label}</label>
      <input name={name} className={`${adminInputClass} mt-1`} defaultValue={defaultValue} />
    </div>
  );
}

const EDITOR_SLUGS = new Set([
  "autos",
  "rentas",
  "servicios",
  "empleos",
  "restaurantes",
  "clases",
  "comunidad",
  "mascotas-y-perdidos",
  "travel",
  "bienes-raices",
]);

export async function CategoryDetailFieldsEditorBlock(props: {
  slug: string;
  searchParams?: Promise<{ saved?: string }>;
}) {
  const slug = props.slug;
  if (!EDITOR_SLUGS.has(slug)) return null;

  const sp = props.searchParams ? await props.searchParams : {};
  const [{ payload, updatedAt }] = await Promise.all([getSiteSectionPayload("clasificados_category_content")]);
  const root = payload as unknown as ClasificadosCategoryContentRootPayload;
  const rawPatch = extractCategoryPatch(root, slug) as ClasificadosCategoryDetailOnlyPatch | undefined;
  const patch = rawPatch ?? {};

  const rows = DETAIL_FIELDS[slug] ?? [];
  const title =
    slug === "travel"
      ? "Viajes (travel)"
      : slug === "bienes-raices"
        ? "Bienes raíces"
        : slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  const queueHref = adminCategoryWorkspaceQueueHref(slug);

  return (
    <div className="space-y-6">
      {sp.saved === "1" ? (
        <div className={`${adminCardBase} ${adminActionProofOk} p-4`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Last section update: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}</p>

      <div className={`${adminCardBase} flex flex-wrap gap-3 p-4`}>
        <Link href={queueHref} className={`${adminCtaChipSecondary} justify-center text-xs font-bold`}>
          Ad queue →
        </Link>
        <Link href="/admin/reportes" className={`${adminCtaChipSecondary} justify-center text-xs`}>
          Reports →
        </Link>
      </div>

      {slug === "rentas" || slug === "bienes-raices" ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          {slug === "rentas"
            ? "Rentas uses dynamic rows by subcategory and type — DETAIL_FIELDS.rentas is empty in code. You can save internal notes until stable override keys are defined."
            : "Real estate uses dynamic BR forms — DETAIL_FIELDS is empty unless keys align with the orchestrator. You can save moderation notes."}
        </div>
      ) : null}

      {slug === "clases" || slug === "comunidad" || slug === "mascotas-y-perdidos" ? (
        <div className={`${adminCardBase} ${adminInfoCallout}`}>
          This category has no rows in <code className="rounded bg-white/80 px-1">DETAIL_FIELDS</code> yet. You can leave staff notes;
          when fields exist in code, they will appear here automatically.
        </div>
      ) : null}

      <form action={saveCategoryDetailFieldsContentAction} className={`${adminCardBase} space-y-6 p-6`}>
        <input type="hidden" name="category_slug" value={slug} />
        <p className="text-xs text-[#7A7164]">
          Content editor — <strong>{title}</strong>. Persisted in{" "}
          <code className="rounded bg-[#FBF7EF] px-1">site_section_content.clasificados_category_content</code> →{" "}
          <code className="rounded bg-[#FBF7EF] px-1">categories[&quot;{slug}&quot;]</code>.
        </p>

        {rows.length ? (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Fields (DETAIL_FIELDS)</h2>
            <div className="mt-4 space-y-6">
              {rows.map((row) => {
                const mEs = mergeDetailFieldPatch(row.label, row.placeholder, patch.detailFields?.[row.key], "es");
                const mEn = mergeDetailFieldPatch(row.label, row.placeholder, patch.detailFields?.[row.key], "en");
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
                      <Field label="Help ES" name={`df_${row.key}_help_es`} defaultValue={mEs.help ?? ""} />
                      <Field label="Help EN" name={`df_${row.key}_help_en`} defaultValue={mEn.help ?? ""} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Internal notes (moderation)</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">ES</label>
              <textarea
                name="staff_mod_es"
                className={`${adminInputClass} mt-1`}
                rows={3}
                defaultValue={patch.staffModerationNotes?.es ?? ""}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#5C5346]">EN</label>
              <textarea
                name="staff_mod_en"
                className={`${adminInputClass} mt-1`}
                rows={3}
                defaultValue={patch.staffModerationNotes?.en ?? ""}
              />
            </div>
          </div>
        </section>

        <button type="submit" className={adminBtnPrimary}>
          Save
        </button>
      </form>

      <Link href="/admin/workspace/clasificados" className={adminBtnSecondary}>
        ← Clasificados hub
      </Link>
    </div>
  );
}
