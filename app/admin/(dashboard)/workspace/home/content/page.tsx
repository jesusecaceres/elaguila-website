import Link from "next/link";
import { AdminCtaDestinationHint } from "@/app/admin/_components/AdminCtaDestinationHint";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminInputClass, adminActionProofOk } from "@/app/admin/_components/adminTheme";
import { getSiteSectionPayload } from "@/app/lib/siteSectionContent/siteSectionContentData";
import type { HomeMarketingPayload } from "@/app/lib/siteSectionContent/payloadTypes";
import { mergeHomeMarketing } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { saveHomeMarketingAction } from "@/app/admin/homeMarketingActions";

export const dynamic = "force-dynamic";

/**
 * Home launch architecture is code-owned (`app/(site)/home/homePageCopy.ts` + the shared current
 * magazine edition in `app/lib/magazine/currentEdition.ts`). The public `/home` reads ONLY these
 * `home_marketing` values today:
 *   - announcementBar.es / .en  + modules.showAnnouncement   (thin strip above the hero)
 *   - modules.showHeroImage                                   (current-edition cover column in the hero)
 * Every other field below is a legacy CMS field retained for backward compatibility: it is still
 * stored and round-tripped on save (never blanked), but editing it does not change public Home.
 */

function homeFeaturedCalloutHint(href: string): { effectiveLine: string; whenBlank?: string } {
  const t = href.trim();
  if (!t) {
    return {
      effectiveLine: "— not shown on the public site",
      whenBlank: "Legacy field: the launch Home does not render featured chips.",
    };
  }
  if (!(t.startsWith("/") || t.startsWith("https://"))) {
    return {
      effectiveLine: "— not shown on the public site",
      whenBlank: "Legacy field: the launch Home does not render featured chips.",
    };
  }
  return { effectiveLine: `${t} (stored only — not rendered by the launch Home)` };
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
        title="`/home` landing — live controls"
        subtitle="The launch Home (hero, current edition, Discover, Featured, Learn & Grow, business visibility, newsletter) is code-owned. This editor controls only the announcement strip and the hero cover column. Site-wide nav announcements are in Global settings."
        helperText="Legacy hero/CTA/cover/chip fields are kept read-only below for backward compatibility; they are stored but no longer rendered on /home."
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
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Top announcement (optional) — LIVE</h2>
        <p className="text-xs text-[#7A7164]">Thin strip above the hero — operational or short promo. Shown on /home when the toggle is on and copy exists.</p>
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

        <h2 className="pt-4 text-sm font-bold uppercase tracking-wide text-[#5C5346]">Block visibility — LIVE</h2>
        <div className="grid gap-2 text-sm text-[#3D3428]">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_ann" defaultChecked={m.modules.showAnnouncement} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Show announcement strip (when copy exists)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="mod_hero_img" defaultChecked={m.modules.showHeroImage} className="h-4 w-4 rounded border-[#E8DFD0]" />
            Show the current-edition cover column in the hero (cover, month and “Leer edición actual” come from the magazine source, not from this editor)
          </label>
        </div>

        {/* Home launch architecture is code-owned; legacy CMS fields retained for backward compatibility. */}
        <details className="mt-6 rounded-xl border border-[#E8DFD0]/80 bg-[#FBF7EF]/60 p-4">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-wide text-[#7A7164]">
            Legacy fields (read-only) — not used by the launch Home
          </summary>
          <p className="mt-2 text-xs text-[#7A7164]">
            These values are kept in the database for backward compatibility and are re-saved unchanged. The public /home hero
            headline, supporting copy, CTAs, cover image and featured chips are code-owned since the launch redesign.
          </p>

          <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-[#7A7164]">Brand & headlines (legacy)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <LegacyField label="Title ES" name="title_es" value={patch.title?.es ?? ""} />
            <LegacyField label="Title EN" name="title_en" value={patch.title?.en ?? ""} />
            <LegacyField label="Identity ES" name="identity_es" value={patch.identity?.es ?? ""} />
            <LegacyField label="Identity EN" name="identity_en" value={patch.identity?.en ?? ""} />
            <LegacyField label="Subtitle ES" name="precedent_es" value={patch.precedent?.es ?? ""} />
            <LegacyField label="Subtitle EN" name="precedent_en" value={patch.precedent?.en ?? ""} />
          </div>

          <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-[#7A7164]">CTAs & links (legacy)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <LegacyField label="Primary CTA ES" name="cta_primary_es" value={patch.ctaPrimary?.es ?? ""} />
            <LegacyField label="Primary CTA EN" name="cta_primary_en" value={patch.ctaPrimary?.en ?? ""} />
            <LegacyField label="Secondary CTA ES (text)" name="cta_secondary_es" value={patch.ctaSecondary?.es ?? ""} />
            <LegacyField label="Secondary CTA EN (text)" name="cta_secondary_en" value={patch.ctaSecondary?.en ?? ""} />
            <LegacyField label="Primary CTA URL" name="cta_primary_href" value={patch.ctaPrimaryHref ?? ""} />
            <LegacyField label="Secondary CTA URL" name="cta_secondary_href" value={patch.ctaSecondaryHref ?? ""} />
          </div>
          <div className="mt-2 space-y-2">
            <AdminCtaDestinationHint
              label="Primary CTA (legacy)"
              hrefStored={patch.ctaPrimaryHref ?? ""}
              effectiveLine="Not used: the launch hero’s primary CTA scrolls to #explorar and the cover links to the current edition reader."
            />
            <AdminCtaDestinationHint
              label="Secondary CTA (legacy)"
              hrefStored={patch.ctaSecondaryHref ?? ""}
              effectiveLine="Not used: the launch hero’s secondary CTA scrolls to #anunciate."
            />
          </div>

          <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-[#7A7164]">Strip below button (legacy)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[#7A7164]">Promo / note ES</label>
              <textarea name="promo_es" readOnly className={adminInputClass} rows={2} defaultValue={patch.promoStrip?.es ?? ""} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#7A7164]">Promo / note EN</label>
              <textarea name="promo_en" readOnly className={adminInputClass} rows={2} defaultValue={patch.promoStrip?.en ?? ""} />
            </div>
          </div>

          <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-[#7A7164]">Cover image (legacy)</h3>
          <p className="text-xs text-[#7A7164]">The launch Home shows the real current-edition cover from the magazine source (same as /magazine).</p>
          <LegacyField label="URL or path" name="cover_image_src" value={patch.coverImageSrc ?? ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <LegacyField label="Image alt ES" name="cover_alt_es" value={patch.coverAlt?.es ?? ""} />
            <LegacyField label="Image alt EN" name="cover_alt_en" value={patch.coverAlt?.en ?? ""} />
          </div>

          <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-[#7A7164]">Legacy visibility toggles (stored, not rendered)</h3>
          {/* Hidden inputs keep the stored booleans exactly as they are; the disabled boxes are display only. */}
          {m.modules.showSecondaryLine ? <input type="hidden" name="mod_secondary" value="on" /> : null}
          {m.modules.showCallouts ? <input type="hidden" name="mod_callouts" value="on" /> : null}
          <input type="hidden" name="callouts_placement" value={m.calloutsPlacement} />
          <div className="grid gap-2 text-sm text-[#7A7164]">
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled defaultChecked={m.modules.showSecondaryLine} className="h-4 w-4 rounded border-[#E8DFD0]" />
              Secondary line / promo below primary CTA (legacy)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled defaultChecked={m.modules.showCallouts} className="h-4 w-4 rounded border-[#E8DFD0]" />
              Featured links (chips) (legacy)
            </label>
            <p className="text-xs">
              Chip row position (legacy): {m.calloutsPlacement === "below_title" ? "just below main headline" : "below identity and subtitle"}
            </p>
          </div>

          <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-[#7A7164]">Featured links (legacy, up to 5)</h3>
          {callouts.slice(0, 5).map((c, idx) => {
            const co = homeFeaturedCalloutHint(c.href ?? "");
            return (
              <div key={idx} className="mt-2 space-y-2 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <LegacyField label={`Label ES #${idx + 1}`} name={`callout_${idx + 1}_es`} value={c.labelEs} />
                  <LegacyField label={`Label EN #${idx + 1}`} name={`callout_${idx + 1}_en`} value={c.labelEn} />
                  <LegacyField label="URL" name={`callout_${idx + 1}_href`} value={c.href} />
                </div>
                <AdminCtaDestinationHint
                  label={`Chip #${idx + 1} — destination (legacy)`}
                  hrefStored={c.href ?? ""}
                  effectiveLine={co.effectiveLine}
                  whenBlank={co.whenBlank}
                />
              </div>
            );
          })}
        </details>

        <button type="submit" className={`${adminBtnPrimary} mt-4`}>
          Save
        </button>
      </form>
    </div>
  );
}

/** Read-only legacy input: keeps the stored value in the form so saving never blanks it. */
function LegacyField({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#7A7164]">{label}</label>
      <input name={name} readOnly className={`${adminInputClass} opacity-70`} defaultValue={value} />
    </div>
  );
}
