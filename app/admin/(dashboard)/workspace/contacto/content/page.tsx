import Link from "next/link";
import { AdminCtaDestinationHint, AdminCtaRoutingCallout } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { ContactoPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeContactoCopy } from "@/app/lib/siteSectionContent/contactoMerge";
import { saveContactoSectionAction } from "@/app/admin/contactoSectionActions";
import { LEONIX_TIENDA_CONTACT_PATH } from "@/app/tienda/data/leonixContact";

export const dynamic = "force-dynamic";

export default async function AdminContactoContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("contacto");
  const patch = payload as unknown as ContactoPayload;
  const es = mergeContactoCopy("es", patch);
  const en = mergeContactoCopy("en", patch);

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Contacto"
        title="`/contacto` page"
        subtitle="Headline, intro, contact details, and notice. Submission still uses the global component (webhook/API not edited here)."
        helperText="Empty = code default text. The Tienda block can be customized below."
        rightSlot={
          <Link href="/admin/workspace/contacto" className={adminBtnSecondary}>
            ← Workspace view
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "—"}</p>

      <form action={saveContactoSectionAction} className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Headline</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="H1 ES" name="headline_es" defaultValue={patch.headline?.es ?? ""} placeholder={es.h1} />
          <Field label="H1 EN" name="headline_en" defaultValue={patch.headline?.en ?? ""} placeholder={en.h1} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Subtítulo ES (opcional)</label>
            <textarea name="subhead_es" className={adminInputClass} rows={2} defaultValue={patch.subheadline?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Subtítulo EN (opcional)</label>
            <textarea name="subhead_en" className={adminInputClass} rows={2} defaultValue={patch.subheadline?.en ?? ""} />
          </div>
        </div>

        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Introduction</h2>
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Intro ES</label>
            <textarea name="intro_es" className={adminInputClass} rows={3} defaultValue={patch.intro?.es ?? ""} placeholder={es.intro} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Intro EN</label>
            <textarea name="intro_en" className={adminInputClass} rows={3} defaultValue={patch.intro?.en ?? ""} placeholder={en.intro} />
          </div>
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Hours</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Horario ES" name="hours_es" defaultValue={patch.hours?.es ?? ""} placeholder={es.hours} />
          <Field label="Horario EN" name="hours_en" defaultValue={patch.hours?.en ?? ""} placeholder={en.hours} />
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Contact details</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email visible" name="email" defaultValue={patch.email ?? ""} placeholder={es.email} />
          <Field label="Phone (freeform line)" name="phone" defaultValue={patch.phone ?? ""} />
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Dirección ES</label>
            <textarea name="address_es" className={adminInputClass} rows={2} defaultValue={patch.address?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Dirección EN</label>
            <textarea name="address_en" className={adminInputClass} rows={2} defaultValue={patch.address?.en ?? ""} />
          </div>
          <Field label="Map URL (Maps or other)" name="map_url" defaultValue={patch.mapUrl ?? ""} />
          <div className="sm:col-span-2">
            <AdminCtaDestinationHint
              label="“Open map” link (contact block)"
              hrefStored={patch.mapUrl ?? ""}
              effectiveLine={
                patch.mapUrl?.trim()
                  ? `${patch.mapUrl.trim()} — opens in a new tab.`
                  : "— “Open map” link is not shown."
              }
              whenBlank={
                !patch.mapUrl?.trim() ? "Empty = no map link; the rest of the block (email, phone, etc.) stays visible." : undefined
              }
            />
          </div>
        </div>
        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Top notice (optional)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Aviso ES" name="notice_es" defaultValue={patch.noticeBanner?.es ?? ""} />
          <Field label="Aviso EN" name="notice_en" defaultValue={patch.noticeBanner?.en ?? ""} />
        </div>

        <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Tienda card (middle block)</h2>
        <p className="text-xs text-[#7A7164]">Copy for the box linking to Tienda help. Empty = defaults.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título ES" name="tienda_title_es" defaultValue={patch.tiendaCard?.title?.es ?? ""} placeholder={es.tiendaTitle} />
          <Field label="Título EN" name="tienda_title_en" defaultValue={patch.tiendaCard?.title?.en ?? ""} placeholder={en.tiendaTitle} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Cuerpo ES</label>
            <textarea name="tienda_body_es" className={adminInputClass} rows={2} defaultValue={patch.tiendaCard?.body?.es ?? ""} placeholder={es.tiendaBody} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Cuerpo EN</label>
            <textarea name="tienda_body_en" className={adminInputClass} rows={2} defaultValue={patch.tiendaCard?.body?.en ?? ""} placeholder={en.tiendaBody} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="CTA ES" name="tienda_cta_es" defaultValue={patch.tiendaCard?.cta?.es ?? ""} placeholder={es.tiendaCta} />
          <Field label="CTA EN" name="tienda_cta_en" defaultValue={patch.tiendaCard?.cta?.en ?? ""} placeholder={en.tiendaCta} />
        </div>
        <AdminCtaRoutingCallout title="Tienda card — button URL (not editable here)">
          <p>
            CTA text is edited above; destination is fixed in code:{" "}
            <code className="rounded bg-white/80 px-1">{LEONIX_TIENDA_CONTACT_PATH}</code> with{" "}
            <code className="rounded bg-white/80 px-1">?lang=</code> (same route as the public Tienda contact page).
          </p>
        </AdminCtaRoutingCallout>

        <button type="submit" className={`${adminBtnPrimary} mt-4`}>
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
