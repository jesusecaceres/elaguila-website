import Link from "next/link";
import { AdminCtaDestinationHint, AdminCtaRoutingCallout } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass, adminActionProofOk } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { saveHomeMarketingAction } from "@/app/admin/homeMarketingActions";

export const dynamic = "force-dynamic";

function homeFeaturedCalloutHint(href: string): { effectiveLine: string; whenBlank?: string } {
  const t = href.trim();
  if (!t) {
    return {
      effectiveLine: "— not shown on the public site",
      whenBlank: "A URL starting with / or https:// is required for the chip to appear on /home.",
    };
  }
  if (!(t.startsWith("/") || t.startsWith("https://"))) {
    return {
      effectiveLine: "— not shown on the public site",
      whenBlank: "Only chips whose href starts with / or https:// are published (mergeHomeMarketing).",
    };
  }
  return { effectiveLine: t };
}

export default async function AdminHomeContentPage(props: { searchParams?: Promise<{ saved?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { payload, updatedAt } = await getSiteSectionPayload("home_marketing");
  const patch = payload as unknown as HomeMarketingPayload;
  const m = mergeHomeMarketing(patch);

  const callouts = [...(patch.featuredCallouts ?? [])];
  while (callouts.length < 5) {
    callouts.push({ labelEs: "", labelEn: "", href: "" });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Home"
        title="`/home` landing — copy, links & modules"
        subtitle="Control the magazine-entry hero, announcements, promo strip, and featured links. Site-wide nav announcements are in Global settings."
        helperText="Empty fields fall back to code defaults. Checkboxes control which blocks show (they do not create new section types in code)."
        rightSlot={
          <Link href="/admin/workspace/home" className={adminBtnSecondary}>
            ← Home workspace view
          </Link>
        }
      />

      {sp.saved === "1" ? (
        <div className={`${adminCardBase} ${adminActionProofOk} p-4 text-sm`}>Saved.</div>
      ) : null}

      <p className="text-xs text-[#7A7164]">Last updated: {updatedAt ? new Date(updatedAt).toLocaleString("en-US") : "—"}</p>

      <form action={saveHomeMarketingAction} className={`${adminCardBase} space-y-4 p-6`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Brand & headlines</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title ES" name="title_es" defaultValue={m.es.title} />
          <Field label="Title EN" name="title_en" defaultValue={m.en.title} />
          <Field label="Identity ES" name="identity_es" defaultValue={m.es.identity} />
          <Field label="Identity EN" name="identity_en" defaultValue={m.en.identity} />
          <Field label="Subtitle ES" name="precedent_es" defaultValue={m.es.precedent} />
          <Field label="Subtitle EN" name="precedent_en" defaultValue={m.en.precedent} />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Top announcement (optional)</h2>
        <p className="text-xs text-[#7A7164]">Thin strip above the hero — operational or short promo.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Announcement ES</label>
            <textarea name="announce_es" className={adminInputClass} rows={2} defaultValue={patch.announcementBar?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Announcement EN</label>
            <textarea name="announce_en" className={adminInputClass} rows={2} defaultValue={patch.announcementBar?.en ?? ""} />
          </div>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">CTAs & links</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Primary CTA ES" name="cta_primary_es" defaultValue={m.es.ctaPrimary} />
          <Field label="Primary CTA EN" name="cta_primary_en" defaultValue={m.en.ctaPrimary} />
          <Field label="Secondary CTA ES (text)" name="cta_secondary_es" defaultValue={m.es.ctaSecondary} />
          <Field label="Secondary CTA EN (text)" name="cta_secondary_en" defaultValue={m.en.ctaSecondary} />
          <Field
            label="Primary CTA URL (empty = magazine with language)"
            name="cta_primary_href"
            defaultValue={patch.ctaPrimaryHref ?? ""}
          />
          <Field
            label="Secondary CTA URL (empty = text only)"
            name="cta_secondary_href"
            defaultValue={patch.ctaSecondaryHref ?? ""}
          />
        </div>

        <div className="space-y-2">
          <AdminCtaDestinationHint
            label="Primary CTA (button + hero image)"
            hrefStored={patch.ctaPrimaryHref ?? ""}
            effectiveLine={
              patch.ctaPrimaryHref?.trim()
                ? `${patch.ctaPrimaryHref.trim()} (used as-is; ?lang is not auto-appended on /home).`
                : "`/magazine?lang={es|en}` follows active language on `/home` (same link for image and button)."
            }
            whenBlank={
              !patch.ctaPrimaryHref?.trim()
                ? "Empty = digital magazine; matches code default behavior."
                : undefined
            }
          />
          <AdminCtaDestinationHint
            label="Secondary CTA (line below primary)"
            hrefStored={patch.ctaSecondaryHref ?? ""}
            effectiveLine={
              patch.ctaSecondaryHref?.trim()
                ? `${patch.ctaSecondaryHref.trim()} (direct link).`
                : "Text without link: shown as paragraph below primary button."
            }
            whenBlank={
              !patch.ctaSecondaryHref?.trim()
                ? "No URL: not clickable. Save a URL above to activate the link."
                : undefined
            }
          />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Strip below button (optional)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Promo / note ES</label>
            <textarea name="promo_es" className={adminInputClass} rows={2} defaultValue={patch.promoStrip?.es ?? ""} />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5C5346]">Promo / note EN</label>
            <textarea name="promo_en" className={adminInputClass} rows={2} defaultValue={patch.promoStrip?.en ?? ""} />
          </div>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Cover image</h2>
        <Field label="URL or path (/… or https://)" name="cover_image_src" defaultValue={m.coverImageSrc} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Image alt ES" name="cover_alt_es" defaultValue={m.es.coverAlt} />
          <Field label="Image alt EN" name="cover_alt_en" defaultValue={m.en.coverAlt} />
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Block visibility (current template)</h2>
        <div className="grid gap-2 text-sm text-[#3D3428]">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_ann" defaultChecked={m.modules.showAnnouncement} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Show announcement strip (when copy exists)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_hero_img" defaultChecked={m.modules.showHeroImage} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Show large hero image
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_secondary" defaultChecked={m.modules.showSecondaryLine} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Show secondary line / promo below primary CTA
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_callouts" defaultChecked={m.modules.showCallouts} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Show featured links (chips)
          </label>
        </div>

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Featured links (up to 5)</h2>
        <p className="text-xs text-[#7A7164]">
          Manual routes (e.g. to Clasificados). Must start with <code className="rounded bg-[#FBF7EF] px-1">/</code> or{" "}
          <code className="rounded bg-[#FBF7EF] px-1">https://</code>. Saved order is rows #1–#5 (left to right on the page).
        </p>
        <AdminCtaRoutingCallout title="Chip row order and zone (single block)">
          <p>
            <strong>Order:</strong> row #1 is the leftmost chip; #5 is the rightmost. No drag-and-drop: order follows the fields in this form.
          </p>
          <p>
            <strong>Vertical position:</strong> the selector below moves the <strong>entire chip row</strong> at once (no per-chip position). Only affects the{" "}
            <code className="rounded bg-white/80 px-1">/home</code> template.
          </p>
        </AdminCtaRoutingCallout>
        <div>
          <label className="text-xs font-semibold text-[#5C5346]">Chip row position in hero</label>
          <select name="callouts_placement" className={`${adminInputClass} mt-1`} defaultValue={m.calloutsPlacement}>
            <option value="below_precedent">Below identity and subtitle (classic template)</option>
            <option value="below_title">Just below main headline</option>
          </select>
          <p className="mt-1 text-xs text-[#7A7164]">Affects `/home` only; does not auto-change Tienda or Clasificados categories.</p>
        </div>
        {callouts.slice(0, 5).map((c, idx) => {
          const co = homeFeaturedCalloutHint(c.href ?? "");
          return (
            <div key={idx} className="space-y-2 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label={`Label ES #${idx + 1}`} name={`callout_${idx + 1}_es`} defaultValue={c.labelEs} />
                <Field label={`Label EN #${idx + 1}`} name={`callout_${idx + 1}_en`} defaultValue={c.labelEn} />
                <Field label="URL" name={`callout_${idx + 1}_href`} defaultValue={c.href} />
              </div>
              <AdminCtaDestinationHint
                label={`Chip #${idx + 1} — destination`}
                hrefStored={c.href ?? ""}
                effectiveLine={co.effectiveLine}
                whenBlank={co.whenBlank}
              />
            </div>
          );
        })}

        <button type="submit" className={`${adminBtnPrimary} mt-4`}>
          Save
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
