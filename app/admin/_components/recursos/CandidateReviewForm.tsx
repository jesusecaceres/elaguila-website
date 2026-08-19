import { adminBtnPrimary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import type { CandidateReview } from "@/app/lib/recursos/verificationEvidence";
import { saveCandidateReviewAction } from "@/app/admin/recursosCandidateActions";

const SOURCE_TYPES: { value: NonNullable<CandidateReview["currentSourceType"]>; label: string }[] = [
  { value: "government", label: "Official government page" },
  { value: "official_org_site", label: "Official organization website" },
  { value: "phone_call", label: "Phone call (not sufficient alone for help-now)" },
];

const ADDRESS_HANDLING: { value: NonNullable<CandidateReview["addressHandling"]>; label: string }[] = [
  { value: "confirmed", label: "Confirmed — safe to publish" },
  { value: "withheld_for_safety", label: "Withheld for safety" },
  { value: "not_applicable", label: "Not applicable (no physical location)" },
];

const CONFIRMABLE_FIELDS = ["phone", "crisisPhone", "sms", "email", "websiteUrl", "hours", "eligibility", "languages", "serviceArea"];

function Field({
  label,
  name,
  defaultValue,
  hint,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} className={adminInputClass} />
      {hint ? <p className="mt-1 text-[11px] leading-snug text-[#8B7E70]">{hint}</p> : null}
    </div>
  );
}

export function CandidateReviewForm({ candidateId, review }: { candidateId: string; review: CandidateReview | null }) {
  const confirmedSet = new Set(review?.fieldsConfirmed ?? []);

  return (
    <form action={saveCandidateReviewAction} className={`${adminCardBase} flex flex-col gap-4 p-4 sm:p-5`}>
      <input type="hidden" name="candidateId" value={candidateId} />

      <h3 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Current official verification evidence</h3>
      <p className="text-xs leading-snug text-[#7A7164]">
        Fill this in only from what you confirm on a CURRENT official government or organization source today — never carry the
        2023 PDF values forward as if they were current. Leave a field blank rather than guess.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current official source URL" name="currentSourceUrl" defaultValue={review?.currentSourceUrl} />
        <div>
          <label htmlFor="currentSourceType" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Source type
          </label>
          <select id="currentSourceType" name="currentSourceType" defaultValue={review?.currentSourceType ?? ""} className={adminInputClass}>
            <option value="">— Select —</option>
            {SOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="organizationConfirmedActive" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Organization/program currently active?
          </label>
          <select
            id="organizationConfirmedActive"
            name="organizationConfirmedActive"
            defaultValue={review?.organizationConfirmedActive === null || review?.organizationConfirmedActive === undefined ? "" : String(review.organizationConfirmedActive)}
            className={adminInputClass}
          >
            <option value="">— Unknown / not yet checked —</option>
            <option value="true">Yes, confirmed active</option>
            <option value="false">No — appears defunct/merged/renamed</option>
          </select>
        </div>

        <div>
          <label htmlFor="addressHandling" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
            Address handling
          </label>
          <select id="addressHandling" name="addressHandling" defaultValue={review?.addressHandling ?? ""} className={adminInputClass}>
            <option value="">— Select —</option>
            {ADDRESS_HANDLING.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Fields confirmed against the current source</p>
        <div className="flex flex-wrap gap-2">
          {CONFIRMABLE_FIELDS.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[color:var(--lx-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#1E1810]">
              <input type="checkbox" name="fieldsConfirmed" value={f} defaultChecked={confirmedSet.has(f)} />
              {f}
            </label>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[color:var(--lx-border)] bg-white/80 px-3 py-2.5 text-xs font-semibold text-[#1E1810]">
        <input type="checkbox" name="is24HoursConfirmedExplicit" defaultChecked={Boolean(review?.is24HoursConfirmedExplicit)} className="mt-0.5" />
        <span>
          24/7 explicitly confirmed on the current source
          <span className="mt-0.5 block text-[11px] font-normal text-[#8B7E70]">Only check this if the source states it outright — never inferred.</span>
        </span>
      </label>

      <div>
        <label htmlFor="verificationNotes" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Verification notes (discrepancies vs. the 2023 PDF, provenance, anything a reviewer should know)
        </label>
        <textarea id="verificationNotes" name="verificationNotes" rows={4} defaultValue={review?.verificationNotes ?? ""} className={adminInputClass} />
      </div>

      <div>
        <label htmlFor="disposition" className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
          Disposition
        </label>
        <select id="disposition" name="disposition" defaultValue={review?.disposition ?? "pending"} className={adminInputClass}>
          <option value="pending">Pending — still researching</option>
          <option value="ready_for_promotion">Ready for promotion</option>
          <option value="dropped">Dropped — obsolete/no longer exists</option>
        </select>
        <p className="mt-1 text-[11px] leading-snug text-[#8B7E70]">
          Setting this to "Ready for promotion" does not publish anything by itself — it only unlocks the Promote action below.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" className={adminBtnPrimary}>
          Save evidence
        </button>
      </div>
    </form>
  );
}
