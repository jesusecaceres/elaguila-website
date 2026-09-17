"use client";

import { useState } from "react";
import { PhoneInput } from "@/app/components/forms/PhoneInput";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { WeeklyScheduleEditor } from "@/app/(site)/publicar/community/shared/components/WeeklyScheduleEditor";
import { emptyCommunityWeeklySchedule } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";
import type { DayHoursRow, DayKey } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { EXECUTIVE_THEME_OPTIONS } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import { EXECUTIVE_HUB_STATUSES, executiveHubStatusLabel, type ExecutiveHubRecord } from "@/app/admin/_lib/executiveHubTypes";
import { ExecutiveHubAssetUpload } from "./ExecutiveHubAssetUpload";
import { ExecutiveHubBusinessHubSelector } from "./ExecutiveHubBusinessHubSelector";
import { describeExecutiveOwnershipHooks } from "./businessHubAdapter";
import { adminBtnPrimary, adminCardBase, adminCtaChipSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";

type Props = {
  /**
   * Master Operating Book V2 §0G — "self" is the staff self-service mode: the same editor,
   * scoped to only the safe personal fields a staff member may change about their own profile.
   * Owner-only sections/fields are not rendered at all in this mode (not just disabled) — the
   * real authorization boundary lives server-side in the self-service action, which never reads
   * these field names from FormData regardless of what a crafted request might include; hiding
   * them here is a UX courtesy, not the security boundary.
   */
  mode: "create" | "edit" | "self";
  initial?: ExecutiveHubRecord | null;
  action: (formData: FormData) => void | Promise<void>;
  /** Owner-only — active roster members selectable for the "Link to staff account" field. */
  rosterOptions?: { id: string; displayName: string; email: string }[];
};

const FIELD_LABEL = "text-xs font-bold uppercase tracking-wide text-[#7A7164]";
const FIELD_WRAP = "flex flex-col gap-1.5";

const CARD_SECTIONS = [
  { id: "identity", label: "Identity", ownerOnly: false },
  { id: "company", label: "Company", ownerOnly: true },
  { id: "contact", label: "Contact", ownerOnly: false },
  { id: "social", label: "Social", ownerOnly: false },
  { id: "business-hub", label: "Business Hub", ownerOnly: true },
  { id: "availability", label: "Availability", ownerOnly: true },
  { id: "theme", label: "Theme", ownerOnly: false },
  { id: "publishing", label: "Publishing", ownerOnly: true },
  { id: "images", label: "Images", ownerOnly: false },
] as const;

function socialUrl(initial: ExecutiveHubRecord | null | undefined, id: string): string {
  return initial?.socials.find((s) => s.id === id)?.url ?? "";
}

const OWNERSHIP_HOOK_LABELS: { key: keyof ReturnType<typeof describeExecutiveOwnershipHooks>; label: string }[] = [
  { key: "leadOwner", label: "Lead Owner" },
  { key: "businessOwner", label: "Business Owner" },
  { key: "salesRep", label: "Sales Rep" },
  { key: "accountManager", label: "Account Manager" },
  { key: "virtualAssistant", label: "Virtual Assistant" },
  { key: "aiConcierge", label: "AI Concierge" },
  { key: "connectionHub", label: "Connection Hub" },
];

/** Gate 5 + 7 — architecture-only disclosure, not an interactive control. Nothing here is implemented. */
function ExecutiveHubFutureHooksDisclosure({ slug }: { slug: string }) {
  const hooks = describeExecutiveOwnershipHooks(slug || "(save a slug first)");
  return (
    <div className="rounded-lg border border-[#C9B46A]/40 bg-[#FFFCF7] p-3 text-xs leading-relaxed text-[#5C4E2E]">
      <p className="font-bold uppercase tracking-wide">Future integration hooks — not implemented</p>
      <p className="mt-1">
        This record&apos;s stable <code>slug</code> is the anchor future systems will key off. None of the following are
        wired up; listed here only so future builds know where to attach without a schema change.
      </p>
      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {OWNERSHIP_HOOK_LABELS.map(({ key, label }) => (
          <li key={key} className="flex items-start gap-1.5" title={hooks[key].note}>
            <span className="mt-0.5 inline-flex shrink-0 rounded-md border border-[#C9B46A]/60 bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#5C4E2E]">
              Not connected
            </span>
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExecutiveHubForm({ mode, initial, action, rosterOptions }: Props) {
  const isSelf = mode === "self";
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [phoneDisplay, setPhoneDisplay] = useState(initial?.phoneDisplay ?? "");
  const [phoneDigits, setPhoneDigits] = useState(initial?.phoneDigits ?? "");
  const [whatsappDisplay, setWhatsappDisplay] = useState(initial?.whatsappDigits ?? "");
  const [whatsappDigits, setWhatsappDigits] = useState(initial?.whatsappDigits ?? "");
  const [city, setCity] = useState(initial?.address.city ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "leonix");
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [workingHours, setWorkingHours] = useState<DayHoursRow[]>(initial?.workingHours ?? emptyCommunityWeeklySchedule());
  const [photoPath, setPhotoPath] = useState(initial?.photoPath ?? "");
  const [logoPath, setLogoPath] = useState(initial?.logoPath ?? "");
  const [coverPath, setCoverPath] = useState(initial?.coverPath ?? "");
  const [businessHubLink, setBusinessHubLink] = useState(initial?.businessHubLink ?? "");
  const [connectionHubLink, setConnectionHubLink] = useState(initial?.connectionHubLink ?? "");

  function patchDay(day: DayKey, patch: Partial<DayHoursRow>) {
    setWorkingHours((rows) => rows.map((r) => (r.day === day ? { ...r, ...patch } : r)));
  }

  return (
    <form action={action} className="space-y-6">
      {/* Master Operating Book V2 §0G — no slug hidden field in self mode. The self-service
          server action resolves the caller's own profile from their authenticated identity and
          never reads a client-supplied slug/id, so there is nothing to submit here at all. */}
      {mode === "edit" ? <input type="hidden" name="slug" value={initial?.slug ?? ""} /> : null}
      <input type="hidden" name="phoneDisplay" value={phoneDisplay} />
      <input type="hidden" name="phoneDigits" value={phoneDigits} />
      <input type="hidden" name="whatsappDigits" value={whatsappDigits} />
      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="photoPath" value={photoPath} />
      {!isSelf ? (
        <>
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="workingHoursJson" value={JSON.stringify(workingHours)} />
          <input type="hidden" name="logoPath" value={logoPath} />
          <input type="hidden" name="coverPath" value={coverPath} />
          <input type="hidden" name="businessHubLink" value={businessHubLink} />
          <input type="hidden" name="connectionHubLink" value={connectionHubLink} />
        </>
      ) : null}

      <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:-mx-0 sm:px-0">
        {CARD_SECTIONS.filter((s) => !isSelf || !s.ownerOnly).map((s) => (
          <a
            key={s.id}
            href={`#exec-${s.id}`}
            className="shrink-0 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-xs font-bold text-[#5C5346] hover:bg-[color:var(--lx-section)]"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <section id="exec-identity" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="fullName">Full name</label>
            {isSelf ? (
              <p className="rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#5C5346]" title="Full name is set by an owner — contact an owner_admin to change it.">
                {initial?.fullName}
              </p>
            ) : (
              <input id="fullName" name="fullName" required defaultValue={initial?.fullName ?? ""} className={adminInputClass} />
            )}
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="preferredName">Preferred name</label>
            <input id="preferredName" name="preferredName" defaultValue={initial?.preferredName ?? ""} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="title">Title</label>
            <input id="title" name="title" defaultValue={initial?.title ?? ""} className={adminInputClass} />
          </div>
          {mode === "create" ? (
            <div className={FIELD_WRAP}>
              <label className={FIELD_LABEL} htmlFor="slug">URL slug (/contact/…)</label>
              <input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. maria"
                className={adminInputClass}
              />
            </div>
          ) : (
            <div className={FIELD_WRAP}>
              <span className={FIELD_LABEL}>URL slug</span>
              <p className="rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2.5 text-sm text-[#5C5346]">
                /contact/{initial?.slug}
              </p>
            </div>
          )}
        </div>
        {!isSelf ? (
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="languages">Languages (comma-separated)</label>
            <input id="languages" name="languages" defaultValue={(initial?.languages ?? []).join(", ")} placeholder="English, Spanish" className={adminInputClass} />
          </div>
        ) : null}
        <div className={FIELD_WRAP}>
          <label className={FIELD_LABEL} htmlFor="bio">Biography</label>
          <textarea id="bio" name="bio" defaultValue={initial?.bio ?? ""} rows={4} className={adminInputClass} />
        </div>
        {!isSelf ? (
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="trustChips">Trust chips (comma-separated, 2–4 max)</label>
            <input id="trustChips" name="trustChips" defaultValue={(initial?.trustChips ?? []).join(", ")} className={adminInputClass} />
          </div>
        ) : null}
        {!isSelf && mode !== "create" ? (
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="linkedRosterId">Link to staff account (self-service)</label>
            <select id="linkedRosterId" name="linkedRosterId" defaultValue={initial?.linkedRosterId ?? ""} className={adminInputClass}>
              <option value="">Not linked — owner-managed only</option>
              {(rosterOptions ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName} ({r.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-[#7A7164]">
              Linking lets that staff member edit their own name, title, bio, contact info, socials, theme, and photo from
              their own &ldquo;My contact profile&rdquo; page — never publishing state, slug, or company/legal fields.
            </p>
          </div>
        ) : null}
      </section>

      {!isSelf ? (
      <section id="exec-company" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Company</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="company">Company</label>
            <input id="company" name="company" defaultValue={initial?.company ?? ""} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="legalEntity">Legal entity</label>
            <input id="legalEntity" name="legalEntity" defaultValue={initial?.legalEntity ?? ""} className={adminInputClass} />
          </div>
          <div className={`${FIELD_WRAP} sm:col-span-2`}>
            <label className={FIELD_LABEL} htmlFor="addressLine1">Address line 1</label>
            <input id="addressLine1" name="addressLine1" defaultValue={initial?.address.line1 ?? ""} className={adminInputClass} />
          </div>
          <div className={`${FIELD_WRAP} sm:col-span-2`}>
            <label className={FIELD_LABEL} htmlFor="addressLine2">Address line 2</label>
            <input id="addressLine2" name="addressLine2" defaultValue={initial?.address.line2 ?? ""} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <span className={FIELD_LABEL}>City</span>
            <CityAutocomplete value={city} onChange={setCity} lang="en" variant="brForm" freeText />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="state">State</label>
            <input id="state" name="state" defaultValue={initial?.address.state ?? "CA"} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="postalCode">ZIP</label>
            <input id="postalCode" name="postalCode" defaultValue={initial?.address.postalCode ?? ""} className={adminInputClass} />
          </div>
        </div>
      </section>
      ) : null}

      <section id="exec-contact" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={initial?.email ?? ""} className={adminInputClass} />
          </div>
          {!isSelf ? (
            <div className={FIELD_WRAP}>
              <label className={FIELD_LABEL} htmlFor="website">Website</label>
              <input id="website" name="website" defaultValue={initial?.website ?? ""} className={adminInputClass} />
            </div>
          ) : null}
          <div className={FIELD_WRAP}>
            <span className={FIELD_LABEL}>Phone</span>
            <PhoneInput
              value={phoneDisplay}
              onChange={setPhoneDisplay}
              onDigitsChange={setPhoneDigits}
              className={adminInputClass}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className={FIELD_WRAP}>
            <span className={FIELD_LABEL}>WhatsApp (optional, falls back to phone)</span>
            <PhoneInput
              value={whatsappDisplay}
              onChange={setWhatsappDisplay}
              onDigitsChange={setWhatsappDigits}
              className={adminInputClass}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </section>

      <section id="exec-social" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Social</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="socialFacebook">Facebook</label>
            <input id="socialFacebook" name="socialFacebook" defaultValue={socialUrl(initial, "facebook")} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="socialInstagram">Instagram</label>
            <input id="socialInstagram" name="socialInstagram" defaultValue={socialUrl(initial, "instagram")} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="socialLinkedin">LinkedIn</label>
            <input id="socialLinkedin" name="socialLinkedin" defaultValue={socialUrl(initial, "linkedin")} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="socialX">X (Twitter)</label>
            <input id="socialX" name="socialX" defaultValue={socialUrl(initial, "x")} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="socialTiktok">TikTok</label>
            <input id="socialTiktok" name="socialTiktok" defaultValue={socialUrl(initial, "tiktok")} className={adminInputClass} />
          </div>
          <div className={FIELD_WRAP}>
            <label className={FIELD_LABEL} htmlFor="socialYoutube">YouTube</label>
            <input id="socialYoutube" name="socialYoutube" defaultValue={socialUrl(initial, "youtube")} className={adminInputClass} />
          </div>
        </div>
      </section>

      {!isSelf ? (
      <>
      <section id="exec-business-hub" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Business Hub</h2>
        <p className="text-xs text-[#7A7164]">
          Search the Business Hub directory, select a match, or paste a manual reference link. One active business is
          supported today (see below for the multi-business path) — no fake matches are ever shown here.
        </p>
        <ExecutiveHubBusinessHubSelector value={businessHubLink} onChange={setBusinessHubLink} />

        <div className={FIELD_WRAP}>
          <label className={FIELD_LABEL} htmlFor="connectionHubLink">Connection Hub link</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="connectionHubLink"
              value={connectionHubLink}
              onChange={(e) => setConnectionHubLink(e.target.value)}
              placeholder="https://…"
              className={adminInputClass}
            />
            <div className="flex shrink-0 gap-2">
              <a
                href={connectionHubLink || undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!connectionHubLink) e.preventDefault();
                }}
                className={`${adminCtaChipSecondary} text-xs ${!connectionHubLink ? "pointer-events-none opacity-50" : ""}`}
              >
                Preview
              </a>
              <button
                type="button"
                disabled={!connectionHubLink}
                onClick={() => setConnectionHubLink("")}
                className={`${adminCtaChipSecondary} text-xs disabled:opacity-50`}
              >
                Unlink
              </button>
            </div>
          </div>
        </div>

        <ExecutiveHubFutureHooksDisclosure slug={slug || initial?.slug || ""} />
      </section>

      <section id="exec-availability" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Availability</h2>
        <WeeklyScheduleEditor
          lang="en"
          rows={workingHours}
          onPatchDay={patchDay}
          closedLabel="Closed"
          helperText="Shown on the executive's public contact card once wired to publish (Foundation V1 — admin-only for now)."
        />
      </section>
      </>
      ) : null}

      <section id="exec-theme" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Theme</h2>
        <div className={FIELD_WRAP}>
          <span className={FIELD_LABEL}>Executive theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)} className={adminInputClass}>
            {EXECUTIVE_THEME_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </section>

      {!isSelf ? (
      <section id="exec-publishing" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Publishing</h2>
        <div className={FIELD_WRAP}>
          <span className={FIELD_LABEL}>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={adminInputClass}>
            {EXECUTIVE_HUB_STATUSES.map((s) => (
              <option key={s} value={s}>{executiveHubStatusLabel(s)}</option>
            ))}
          </select>
          <p className="text-xs text-[#7A7164]">
            Only &ldquo;Published&rdquo; is visible at /contact/{slug || initial?.slug || "…"}. Saving with any other status hides it immediately.
          </p>
        </div>
        <div className={FIELD_WRAP}>
          <label className={FIELD_LABEL} htmlFor="metaDescription">Meta description override (optional)</label>
          <input id="metaDescription" name="metaDescription" defaultValue={initial?.metaDescription ?? ""} className={adminInputClass} />
        </div>
        <div className={FIELD_WRAP}>
          <label className={FIELD_LABEL} htmlFor="notes">Internal notes (staff-only, never public)</label>
          <textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={3} className={adminInputClass} />
        </div>
      </section>
      ) : null}

      <section id="exec-images" className={`${adminCardBase} space-y-4 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#1E1810]">Images</h2>
        <p className="text-xs text-[#7A7164]">
          {slug || initial?.slug ? "" : "Enter a slug above first — uploads are stored under that slug."}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <ExecutiveHubAssetUpload
            slug={slug || initial?.slug || ""}
            kind="headshot"
            label="Executive headshot"
            currentUrl={photoPath || null}
            onUploaded={setPhotoPath}
            onRemoved={() => setPhotoPath("")}
          />
          {!isSelf ? (
            <>
              <ExecutiveHubAssetUpload
                slug={slug || initial?.slug || ""}
                kind="logo"
                label="Company logo"
                currentUrl={logoPath || null}
                onUploaded={setLogoPath}
                onRemoved={() => setLogoPath("")}
              />
              <ExecutiveHubAssetUpload
                slug={slug || initial?.slug || ""}
                kind="cover"
                label="Cover image (optional)"
                currentUrl={coverPath || null}
                onUploaded={setCoverPath}
                onRemoved={() => setCoverPath("")}
              />
            </>
          ) : null}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className={adminBtnPrimary}>
          {mode === "create" ? "Create executive" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
