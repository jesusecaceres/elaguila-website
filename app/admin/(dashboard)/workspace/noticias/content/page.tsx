import Link from "next/link";
import { AdminCtaRoutingCallout } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { NoticiasPagePayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeNoticiasPagePayload } from "@/app/lib/siteSectionContent/noticiasPageMerge";
import { saveNoticiasPageAction } from "@/app/admin/sectionPageActions";

export const dynamic = "force-dynamic";

export default async function AdminNoticiasContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("noticias_page");
  const patch = payload as unknown as NoticiasPagePayload;
  const m = mergeNoticiasPagePayload(payload);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Noticias"
        title="`/noticias` shell — headline & strip"
        subtitle="Edit only the page frame (title, subtitle, breaking label). The listing still comes from the RSS API; not a full article CMS yet."
        helperText="Saved in site_section_content → noticias_page. Empty fields restore code defaults."
        rightSlot={
          <Link href="/admin/workspace/noticias" className={adminBtnSecondary}>
            ← Workspace overview
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}</p>

      <p className="text-xs text-[#5C5346]">
        Public preview:{" "}
        <a href="/noticias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          /noticias
        </a>
      </p>

      <form action={saveNoticiasPageAction} className={`${adminCardBase} space-y-4 p-6`}>
        <AdminCtaRoutingCallout title="CTAs with URL">
          <p>
            This screen only adjusts the text frame for <code className="rounded bg-white/80 px-1">/noticias</code>. There are no button or URL fields: the listing links to RSS/API sources per page code.
          </p>
        </AdminCtaRoutingCallout>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Headlines</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título página ES" name="page_title_es" defaultValue={patch.pageTitle?.es ?? ""} placeholder={m.es.pageTitle} />
          <Field label="Título página EN" name="page_title_en" defaultValue={patch.pageTitle?.en ?? ""} placeholder={m.en.pageTitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Subtítulo ES</label>
          <textarea name="subtitle_es" className={adminInputClass} rows={3} defaultValue={patch.subtitle?.es ?? ""} placeholder={m.es.subtitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Subtítulo EN</label>
          <textarea name="subtitle_en" className={adminInputClass} rows={3} defaultValue={patch.subtitle?.en ?? ""} placeholder={m.en.subtitle} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Breaking label ES" name="breaking_es" defaultValue={patch.breakingLabel?.es ?? ""} placeholder={m.es.breakingLabel} />
          <Field label="Breaking label EN" name="breaking_en" defaultValue={patch.breakingLabel?.en ?? ""} placeholder={m.en.breakingLabel} />
        </div>
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
