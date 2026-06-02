import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { getCategorySchema } from "@/app/clasificados/config/categorySchema";
import { getClasificadosCategoryRegistryMerged } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { AdminSectionCard } from "@/app/admin/_components/AdminSectionCard";
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { EnVentaModerationFields } from "@/app/clasificados/en-venta/admin/EnVentaModerationFields";
import { adminCategoryWorkspaceQueueHref } from "@/app/admin/_lib/adminCategoryWorkspaceQueueHref";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";
import { ClasificadosQueueHeader } from "@/app/admin/(dashboard)/workspace/clasificados/_components/ClasificadosQueueHeader";
import { EnVentaCategoryContentBlock } from "../_components/EnVentaCategoryContentBlock";
import { CategoryDetailFieldsEditorBlock } from "../_components/CategoryDetailFieldsEditorBlock";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ saved?: string }>;
};

export default async function ClasificadosCategoryWorkspacePage(props: PageProps) {
  const { slug: raw } = await props.params;
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  const schema = getCategorySchema(slug);
  if (!schema) notFound();

  const registry = await getClasificadosCategoryRegistryMerged();
  const entry = registry.find((e) => e.slug === slug);
  if (!entry) notFound();

  const queueHref = adminCategoryWorkspaceQueueHref(slug);
  const isEnVenta = slug === "en-venta";
  const surface = clasificadosQueueSurfaceForSlug(slug);

  return (
    <div className="max-w-4xl space-y-10">
      <ClasificadosQueueHeader
        title={`${entry.displayNameEs} — operations & content`}
        sourceTable="site_section_content.clasificados_category_content · app/(site)/clasificados/config/categorySchema.ts"
        subtitle={`Category “${slug}”: operations workspace (#operacion) and copy / fields editor (#contenido).`}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
      />

      <section id="operacion" className="scroll-mt-6 space-y-8">
        <h2 className="text-lg font-bold text-[#1E1810]">Operations</h2>

        <div className={`${adminCardBase} flex flex-wrap gap-3 p-4`}>
          <Link href={queueHref} className={`${adminCtaChipSecondary} justify-center font-bold`}>
            Open listings queue →
          </Link>
          <Link href="/admin/reportes" className={`${adminCtaChipSecondary} justify-center`}>
            Reports →
          </Link>
          <Link href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} className={`${adminCtaChipSecondary} justify-center`}>
            Category registry →
          </Link>
          {slug === "servicios" ? (
            <Link
              href="/admin/workspace/clasificados/servicios"
              className={`${adminCtaChipSecondary} justify-center border-dashed border-emerald-700/40 bg-emerald-50/80 text-emerald-950`}
            >
              Servicios (public table) →
            </Link>
          ) : null}
          {slug === "empleos" ? (
            <Link
              href="/admin/workspace/clasificados/empleos"
              className={`${adminCtaChipSecondary} justify-center border-dashed border-amber-800/40 bg-amber-50/90 text-amber-950`}
            >
              Empleos — moderation (Supabase) →
            </Link>
          ) : null}
          {slug === "travel" ? (
            <Link
              href="/admin/clasificados/viajes"
              className={`${adminCtaChipSecondary} justify-center border-dashed border-[#C9B46A]/50 bg-[#FFFCF7] text-[#5C5346]`}
            >
              Viajes — legacy panel →
            </Link>
          ) : null}
        </div>

        <AdminSectionCard
          title="Schema (code) — plans & publishing"
          subtitle="Source: app/(site)/clasificados/config/categorySchema.ts"
        >
          <dl className="grid gap-2 text-sm text-[#5C5346] sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Allowed plans</dt>
              <dd className="mt-1 font-mono text-[#1E1810]">{schema.plans.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Field group (DETAIL_FIELDS)</dt>
              <dd className="mt-1 font-mono text-[#1E1810]">{schema.formFieldGroupKey ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Step order</dt>
              <dd className="mt-1 font-mono text-[11px] leading-snug text-[#1E1810]">{schema.stepOrder.join(" → ")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Preview / Pro preview</dt>
              <dd className="mt-1">
                {schema.previewEligible ? "free preview yes" : "free preview no"} ·{" "}
                {schema.proPreviewEligible ? "pro preview yes" : "pro preview no"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-[#7A7164]">Business branch</dt>
              <dd className="mt-1">{schema.businessBranchEligible ? "eligible" : "not applicable / disabled"}</dd>
            </div>
            {schema.subcategories?.length ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase text-[#7A7164]">Subcategories (taxonomy)</dt>
                <dd className="mt-1 text-xs text-[#3D3428]">{schema.subcategories.length} defined in taxonomy</dd>
              </div>
            ) : null}
          </dl>
        </AdminSectionCard>

        <AdminSectionCard
          title="Publish form copy & fields"
          subtitle="Base definitions in code; overrides persist in the Content section (#contenido)."
        >
          <ul className="list-inside list-disc space-y-2 text-sm text-[#5C5346]">
            <li>
              Shared field definitions per group:{" "}
              <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">app/(site)/clasificados/config/publishDetailFields.ts</code>{" "}
              (<code className="rounded bg-[#FBF7EF] px-1 text-[11px]">DETAIL_FIELDS</code>).
            </li>
            {isEnVenta ? (
              <li>
                For Sale copy & taxonomy:{" "}
                <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">app/clasificados/en-venta/</code> (wizards, visibility, Leonix
                contract).
              </li>
            ) : (
              <li>
                Additional fields per vertical may live under{" "}
                <code className="rounded bg-[#FBF7EF] px-1 text-[11px]">app/clasificados/{slug}/</code> or in the unified orchestrator.
              </li>
            )}
          </ul>
        </AdminSectionCard>

        <AdminSectionCard title="Preview & public routes" subtitle="From merged registry">
          <p className="text-sm text-[#5C5346]">
            Publish / landing target:{" "}
            <Link href={entry.landingTarget} className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
              {entry.landingTarget}
            </Link>
          </p>
          <p className="mt-2 text-xs text-[#7A7164]">
            Config layer: {entry.configLayer === "database" ? "Supabase overlay" : "code only"}. Notes: {entry.notes}
          </p>
        </AdminSectionCard>

        <AdminSectionCard title="Operational moderation" subtitle="Global queue + reports; per-category rules evolving">
          <p className="text-sm text-[#5C5346]">
            Listing moderation (statuses, reports, flags) uses the{" "}
            <Link href={queueHref} className="font-bold text-[#6B5B2E] underline">
              filtered queue
            </Link>{" "}
            and <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">/admin/reportes</Link>. For Sale–specific
            reasons are documented below.
          </p>
        </AdminSectionCard>

        {isEnVenta ? (
          <AdminSectionCard
            title="For Sale — moderation reference (contract fields)"
            subtitle="Documentation only; does not persist to the database from here."
          >
            <EnVentaModerationFields lang="en" />
          </AdminSectionCard>
        ) : null}
      </section>

      <section id="contenido" className="scroll-mt-6 space-y-6 border-t border-[#E8DFD0] pt-8">
        <h2 className="text-lg font-bold text-[#1E1810]">Content (editor)</h2>
        <p className="text-sm text-[#5C5346]">
          Edit bilingual copy, field labels, help text, and moderation notes. Empty values in an ES/EN pair remove the override and fall back
          to the base text in code.
        </p>
        {isEnVenta ? (
          <EnVentaCategoryContentBlock searchParams={props.searchParams} />
        ) : (
          <CategoryDetailFieldsEditorBlock slug={slug} searchParams={props.searchParams} />
        )}
      </section>
    </div>
  );
}
