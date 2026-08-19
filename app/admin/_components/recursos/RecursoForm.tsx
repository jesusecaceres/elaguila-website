import type { ReactNode } from "react";
import { adminBtnPrimary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import { PRIMARY_CATEGORIES } from "@/app/lib/recursos/categories";
import { URGENCY_LEVELS } from "@/app/lib/recursos/urgency";
import type { ResourceRecord } from "@/app/lib/recursos/types";

const ORG_TYPES: { value: ResourceRecord["organizationType"]; label: string }[] = [
  { value: "nonprofit", label: "Nonprofit" },
  { value: "government", label: "Government" },
  { value: "faith-based", label: "Faith-based" },
  { value: "school-district", label: "School district" },
  { value: "healthcare", label: "Healthcare" },
  { value: "community-clinic", label: "Community clinic" },
  { value: "hotline", label: "Hotline" },
  { value: "other", label: "Other" },
];

const COST_MODELS: { value: ResourceRecord["costModel"]; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "low_cost", label: "Low cost" },
  { value: "eligibility_based", label: "Eligibility-based" },
  { value: "unknown", label: "Unknown" },
];

const PARTNER_STATUSES: { value: ResourceRecord["internal"]["partnerStatus"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "listed", label: "Listed" },
  { value: "partner", label: "Partner" },
  { value: "founding-partner", label: "Founding partner" },
];

const VERIFICATION_STATUSES: { value: ResourceRecord["verification"]["verificationStatus"]; label: string }[] = [
  { value: "needs_review", label: "Needs review" },
  { value: "verified", label: "Verified" },
  { value: "stale", label: "Stale" },
  { value: "inactive", label: "Inactive" },
];

function Field({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
        {label}
        {required ? <span className="text-rose-700"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={adminInputClass}
      />
      {hint ? <p className="mt-1 text-[11px] leading-snug text-[#8B7E70]">{hint}</p> : null}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  hint,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: string;
  rows?: number;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
        {label}
      </label>
      <textarea id={name} name={name} rows={rows} defaultValue={defaultValue ?? ""} className={adminInputClass} />
      {hint ? <p className="mt-1 text-[11px] leading-snug text-[#8B7E70]">{hint}</p> : null}
    </div>
  );
}

function CheckboxField({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[color:var(--lx-border)] bg-white/80 px-3 py-2.5 text-xs font-semibold text-[#1E1810]">
      <input type="checkbox" name={name} defaultChecked={Boolean(defaultChecked)} className="mt-0.5" />
      <span>
        {label}
        {hint ? <span className="mt-0.5 block text-[11px] font-normal text-[#8B7E70]">{hint}</span> : null}
      </span>
    </label>
  );
}

function SectionCard({ title, children, subtitle }: { title: string; children: ReactNode; subtitle?: string }) {
  return (
    <section className={`${adminCardBase} p-4 sm:p-5`}>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">{title}</h3>
      {subtitle ? <p className="mt-1 text-xs text-[#7A7164]">{subtitle}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function RecursoForm({
  mode,
  initial,
  action,
}: {
  mode: "create" | "edit";
  initial?: ResourceRecord;
  action: (formData: FormData) => void;
}) {
  const r = initial;
  return (
    <form action={action} className="flex flex-col gap-5">
      {mode === "edit" && r ? <input type="hidden" name="id" value={r.id} /> : null}

      <SectionCard title="1. Identity">
        <Field label="Slug" name="slug" defaultValue={r?.slug} required hint="URL-safe unique identifier. Auto-slugified on save." />
        <Field label="Organization name" name="organizationName" defaultValue={r?.organizationName} required />
        <Field label="Program name (optional)" name="programName" defaultValue={r?.programName} />
        <div>
          <label htmlFor="organizationType" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Organization type
          </label>
          <select id="organizationType" name="organizationType" defaultValue={r?.organizationType ?? "nonprofit"} className={adminInputClass}>
            {ORG_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard title="2. Description (ES/EN)" subtitle="Short descriptions are required; details are optional.">
        <TextAreaField label="Short description — ES" name="shortDescriptionEs" defaultValue={r?.shortDescriptionEs} />
        <TextAreaField label="Short description — EN" name="shortDescriptionEn" defaultValue={r?.shortDescriptionEn} />
        <TextAreaField label="Details — ES (optional)" name="detailsEs" defaultValue={r?.detailsEs} rows={4} />
        <TextAreaField label="Details — EN (optional)" name="detailsEn" defaultValue={r?.detailsEn} rows={4} />
      </SectionCard>

      <SectionCard title="3. Category + urgency">
        <div>
          <label htmlFor="primaryCategory" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Primary category
          </label>
          <select id="primaryCategory" name="primaryCategory" defaultValue={r?.primaryCategory ?? "community-support"} className={adminInputClass}>
            {PRIMARY_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.labelEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="urgencyLevel" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Urgency level
          </label>
          <select id="urgencyLevel" name="urgencyLevel" defaultValue={r?.urgencyLevel ?? "i-need-help"} className={adminInputClass}>
            {URGENCY_LEVELS.map((u) => (
              <option key={u.level} value={u.level}>
                {u.labelEn}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] leading-snug text-[#8B7E70]">
            help-now records must have an official source + direct contact before they can be marked verified.
          </p>
        </div>
        <Field
          label="Secondary tags (comma-separated)"
          name="secondaryCategories"
          defaultValue={(r?.secondaryCategories ?? []).join(", ")}
        />
      </SectionCard>

      <SectionCard title="4. Audience">
        <Field label="Minimum age (optional)" name="ageMin" type="number" defaultValue={r?.ageMin ?? ""} />
        <Field label="Maximum age (optional)" name="ageMax" type="number" defaultValue={r?.ageMax ?? ""} />
        <Field label="Audience tags (comma-separated)" name="audienceTags" defaultValue={(r?.audienceTags ?? []).join(", ")} />
      </SectionCard>

      <SectionCard title="5–7. Services, eligibility, languages">
        <Field label="Service tags (comma-separated)" name="serviceTags" defaultValue={(r?.serviceTags ?? []).join(", ")} />
        <Field label="Service area" name="serviceArea" defaultValue={r?.serviceArea} />
        <TextAreaField label="Eligibility — ES" name="eligibilityEs" defaultValue={r?.eligibilityEs} />
        <TextAreaField label="Eligibility — EN" name="eligibilityEn" defaultValue={r?.eligibilityEn} />
        <Field label="Languages spoken (comma-separated)" name="languages" defaultValue={(r?.languages ?? []).join(", ")} />
      </SectionCard>

      <SectionCard title="8. Cost">
        <div>
          <label htmlFor="costModel" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Cost model
          </label>
          <select id="costModel" name="costModel" defaultValue={r?.costModel ?? "unknown"} className={adminInputClass}>
            {COST_MODELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard title="9. Contact actions" subtitle="Leave a field blank to hide its CTA on the public page — nothing here is invented.">
        <Field label="Phone" name="phone" defaultValue={r?.contact.phone} hint="Blank → CALL button hidden." />
        <Field label="Crisis phone" name="crisisPhone" defaultValue={r?.contact.crisisPhone} hint="Used only if Phone is blank." />
        <Field label="SMS" name="sms" defaultValue={r?.contact.sms} hint="Blank → TEXT button hidden." />
        <Field label="WhatsApp" name="whatsapp" defaultValue={r?.contact.whatsapp} hint="Blank → WhatsApp button hidden." />
        <Field label="Email" name="email" defaultValue={r?.contact.email} hint="Blank → EMAIL button hidden." />
        <Field label="Website URL" name="websiteUrl" defaultValue={r?.contact.websiteUrl} hint="Blank → WEBSITE button hidden." />
        <Field label="Application URL" name="applicationUrl" defaultValue={r?.contact.applicationUrl} hint="Blank → APPLY button hidden." />
      </SectionCard>

      <SectionCard title="10. Address / maps" subtitle="For safety-sensitive orgs (e.g. DV shelters), check “withheld for safety” to hide the address and MAP button entirely.">
        <Field label="Address line 1" name="addressLine1" defaultValue={r?.contact.address?.line1} />
        <Field label="Address line 2" name="addressLine2" defaultValue={r?.contact.address?.line2} />
        <Field label="City" name="addressCity" defaultValue={r?.contact.address?.city} />
        <Field label="State" name="addressState" defaultValue={r?.contact.address?.state} />
        <Field label="ZIP" name="addressZip" defaultValue={r?.contact.address?.zip} />
        <Field label="Maps search URL (optional)" name="mapsSearchHref" defaultValue={r?.contact.mapsSearchHref} />
        <CheckboxField
          label="Address withheld for safety"
          name="addressWithheldForSafety"
          defaultChecked={Boolean(r?.contact.address?.addressWithheldForSafety)}
          hint="Hides address + MAP CTA from the public page."
        />
      </SectionCard>

      <SectionCard title="11. Hours">
        <Field label="Hours note — ES" name="hoursNoteEs" defaultValue={r?.contact.hoursNoteEs} />
        <Field label="Hours note — EN" name="hoursNoteEn" defaultValue={r?.contact.hoursNoteEn} />
        <CheckboxField
          label="Open 24/7"
          name="is24Hours"
          defaultChecked={Boolean(r?.contact.is24Hours)}
          hint="Only check this if truly true — never implied by category."
        />
      </SectionCard>

      <SectionCard title="12. Verification">
        <Field label="Official source URL" name="officialSourceUrl" defaultValue={r?.verification.officialSourceUrl} />
        <Field
          label="Last verified at"
          name="lastVerifiedAt"
          type="date"
          defaultValue={r?.verification.lastVerifiedAt ? r.verification.lastVerifiedAt.slice(0, 10) : ""}
        />
        <Field
          label="Next verification due"
          name="nextVerificationAt"
          type="date"
          defaultValue={r?.verification.nextVerificationAt ? r.verification.nextVerificationAt.slice(0, 10) : ""}
        />
        <div>
          <label htmlFor="verificationStatus" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Verification status
          </label>
          <select
            id="verificationStatus"
            name="verificationStatus"
            defaultValue={r?.verification.verificationStatus ?? "needs_review"}
            className={adminInputClass}
          >
            {VERIFICATION_STATUSES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] leading-snug text-[#8B7E70]">
            Prefer the dedicated Verify/Needs-review/Stale/Deactivate actions on the list page — they enforce the
            help-now safety checks. This field is for manual correction only.
          </p>
        </div>
        <CheckboxField
          label="Active (visible to the future public directory)"
          name="active"
          defaultChecked={r ? r.verification.active : true}
        />
      </SectionCard>

      <SectionCard title="13. Editorial / internal" subtitle="Never affects public ranking — relationship/print management only.">
        <div>
          <label htmlFor="partnerStatus" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Partner status
          </label>
          <select id="partnerStatus" name="partnerStatus" defaultValue={r?.internal.partnerStatus ?? "none"} className={adminInputClass}>
            {PARTNER_STATUSES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <CheckboxField label="Featured" name="featured" defaultChecked={Boolean(r?.internal.featured)} />
          <CheckboxField label="Print eligible" name="printEligible" defaultChecked={Boolean(r?.internal.printEligible)} />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField label="Internal notes (staff-only, never public)" name="internalNotes" defaultValue={r?.internal.internalNotes} />
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="submit" className={adminBtnPrimary}>
          {mode === "create" ? "Create resource" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
