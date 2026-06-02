import Link from "next/link";
import { AdminCtaRoutingCallout } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { IglesiasPagePayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeIglesiasPagePayload } from "@/app/lib/siteSectionContent/iglesiasPageMerge";
import { saveIglesiasPageAction } from "@/app/admin/sectionPageActions";

export const dynamic = "force-dynamic";

export default async function AdminIglesiasContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("iglesias_page");
  const patch = payload as unknown as IglesiasPagePayload;
  const m = mergeIglesiasPagePayload(payload);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="`/iglesias` page — transitional copy"
        subtitle="Until a directory exists with database rows, this copy replaces the landing text. No editable listings here."
        helperText="site_section_content → iglesias_page. Empty fields = code defaults."
        rightSlot={
          <Link href="/admin/workspace/iglesias" className={adminBtnSecondary}>
            ← Workspace overview
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}</p>

      <p className="text-xs text-[#5C5346]">
        <a href="/iglesias" className="font-bold text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
          Open /iglesias
        </a>
      </p>

      <form action={saveIglesiasPageAction} className={`${adminCardBase} space-y-4 p-6`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título ES" name="title_es" defaultValue={patch.title?.es ?? ""} placeholder={m.es.title} />
          <Field label="Título EN" name="title_en" defaultValue={patch.title?.en ?? ""} placeholder={m.en.title} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Subtítulo ES</label>
          <textarea name="subtitle_es" className={adminInputClass} rows={4} defaultValue={patch.subtitle?.es ?? ""} placeholder={m.es.subtitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Subtítulo EN</label>
          <textarea name="subtitle_en" className={adminInputClass} rows={4} defaultValue={patch.subtitle?.en ?? ""} placeholder={m.en.subtitle} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Note / secondary CTA ES</label>
          <textarea name="note_es" className={adminInputClass} rows={3} defaultValue={patch.note?.es ?? ""} placeholder={m.es.note} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Note / secondary CTA EN</label>
          <textarea name="note_en" className={adminInputClass} rows={3} defaultValue={patch.note?.en ?? ""} placeholder={m.en.note} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Back button text ES" name="back_es" defaultValue={patch.backCta?.es ?? ""} placeholder={m.es.backCta} />
          <Field label="Back button EN" name="back_en" defaultValue={patch.backCta?.en ?? ""} placeholder={m.en.backCta} />
        </div>
        <AdminCtaRoutingCallout title="Button — destination (fixed in code)">
          <p>
            You only edit the button label. On the public site the link is always{" "}
            <code className="rounded bg-white/80 px-1">/clasificados?lang=…</code> (
            <code className="rounded bg-white/80 px-1">IglesiasPageClient</code>) — there is no URL field in this editor.
          </p>
        </AdminCtaRoutingCallout>
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
