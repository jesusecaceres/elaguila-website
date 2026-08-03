import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../_lib/businessWorkspaceAccess";
import { getBusinessWorkspaceDetail } from "../../../_lib/businessWorkspaceData";
import { computeNextHelpfulAction, computeProfileCompleteness, type ProfileCompletenessInput } from "../../../_lib/salesWorkspaceLogic";
import { BROAD_BUSINESS_TYPES, BUSINESS_STAGES, CONTACT_LABELS, DIGITAL_PROFILE_PLATFORMS, OPERATING_MODELS, SALES_CHANNELS, SALES_RELATIONSHIPS } from "@/app/lib/business/constants";
import { countryLabel } from "@/app/lib/business/countries";
import { formatUsPhoneForDisplay } from "@/app/(site)/dashboard/business-tools/onboarding/_steps/Step6ContactsProfiles";
import { physicalAddressSummary, summarizeServiceCoverage } from "@/app/(site)/dashboard/business-tools/onboarding/wizardTypes";
import { businessIdentityCopy } from "@/app/(site)/dashboard/business-tools/_components/businessIdentityCopy";
import { FollowUpPanel, NotesPanel, StatusQuickActions } from "./BusinessWorkspaceActions";

export const dynamic = "force-dynamic";

function labelFromList(list: readonly { value: string; es: string; en: string }[], value: string | null, lang: "en" | "es" = "en"): string {
  if (!value) return "—";
  return list.find((o) => o.value === value)?.[lang] ?? value;
}

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity"];

export default async function AdminBusinessDetailPage({ params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    redirect("/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const detail = await getBusinessWorkspaceDetail(businessId, access.actor);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <AdminPageHeader title="Business not found" eyebrow="Sales workspace" />
        <Link href="/admin/businesses" className="text-sm font-semibold text-[#7A1E2C] underline">
          ← Back to businesses
        </Link>
      </div>
    );
  }

  const { business, membership, contacts, serviceAreas, digitalProfiles, customLinks, listingLinks, salesProfile, notes, currentFollowUp } = detail;
  const primaryArea = serviceAreas.find((a) => a.isPrimary) ?? serviceAreas[0] ?? null;
  const t = businessIdentityCopy("en");

  const completenessInput: ProfileCompletenessInput = {
    business: {
      displayName: business.displayName,
      broadBusinessType: business.broadBusinessType,
      businessStage: business.businessStage,
      updatedAt: business.updatedAt,
      preferredResponseMethod: business.preferredResponseMethod,
    },
    authorizationNeedsReview: membership?.manualReviewFlag ?? false,
    contacts: contacts.map((c) => ({ contactType: c.contactType, capabilities: c.capabilities })),
    serviceAreas: serviceAreas.map((a) => ({ country: a.country, rawText: a.rawText })),
    digitalProfiles: digitalProfiles.map((d) => ({ platform: d.platform })),
    customLinks: customLinks.map((l) => ({ linkType: l.linkType })),
    listingLinks: listingLinks.map((l) => ({ status: l.status })),
  };
  const completeness = computeProfileCompleteness(completenessInput);
  const nextAction = computeNextHelpfulAction(completenessInput);

  const canViewPrivateContacts = actorHasCapability(access.actor, "view_private_contacts");
  const primaryPhone = canViewPrivateContacts ? contacts.find((c) => c.contactType === "phone") : undefined;
  const primaryEmail = canViewPrivateContacts ? contacts.find((c) => c.contactType === "email") : undefined;
  const websiteContact = canViewPrivateContacts ? (contacts.find((c) => c.contactType === "website") ?? null) : null;

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/businesses" className="text-xs font-semibold text-[#7A1E2C] underline">
        ← Back to businesses
      </Link>
      <AdminPageHeader
        title={business.displayName}
        eyebrow={business.publicName && business.publicName !== business.displayName ? `Public name: ${business.publicName}` : "Sales workspace"}
        subtitle={`${labelFromList(BROAD_BUSINESS_TYPES, business.broadBusinessType)} · ${labelFromList(BUSINESS_STAGES, business.businessStage)}`}
        rightSlot={<StatusQuickActions businessId={business.id} currentStatus={salesProfile.status} />}
      />

      {/* B. Contact actions — near the top, real formatted values, respects visibility. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Contact actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {primaryPhone ? (
            <a href={`tel:${primaryPhone.normalizedValue}`} className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white">
              Call {formatUsPhoneForDisplay(primaryPhone.value)}
            </a>
          ) : null}
          {primaryPhone?.capabilities.includes("sms") ? (
            <a href={`sms:${primaryPhone.normalizedValue}`} className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
              SMS
            </a>
          ) : null}
          {primaryPhone?.capabilities.includes("whatsapp") ? (
            <a href={`https://wa.me/${primaryPhone.normalizedValue.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="min-h-[40px] rounded-lg border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-800">
              WhatsApp
            </a>
          ) : null}
          {primaryEmail ? (
            <a href={`mailto:${primaryEmail.value}`} className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
              Email
            </a>
          ) : null}
          {websiteContact ? (
            <a href={websiteContact.value.startsWith("http") ? websiteContact.value : `https://${websiteContact.value}`} target="_blank" rel="noopener noreferrer" className="min-h-[40px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428]">
              Website
            </a>
          ) : null}
          {!canViewPrivateContacts ? (
            <p className="text-xs text-[#7A7164]">Your role does not include permission to view private contact details.</p>
          ) : !primaryPhone && !primaryEmail && !websiteContact ? (
            <p className="text-xs text-[#7A7164]">No verified contact method on file yet.</p>
          ) : null}
        </div>
      </section>

      {/* G. Possible next helpful action */}
      <section className="rounded-2xl border border-[#C9A84A]/50 bg-[#FBF7EF] p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Possible next helpful action</h2>
        <p className="mt-1 text-base font-bold text-[#7A1E2C]">{nextAction.headline.en}</p>
        <p className="mt-2 text-xs text-[#5C5346]">
          <span className="font-semibold">Evidence:</span> {nextAction.evidence.en}
        </p>
        <p className="mt-1 text-xs text-[#5C5346]">
          <span className="font-semibold">Confirm:</span> {nextAction.whatToConfirm.en}
        </p>
        <p className="mt-1 text-xs text-[#7A7164]">
          <span className="font-semibold">Do not recommend yet:</span> {nextAction.whatNotToRecommendYet.en}
        </p>
      </section>

      {/* F. Profile completeness — checklist, never a bare percentage. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">
          Profile completeness — {completeness.metCount}/{completeness.totalCount}
        </h2>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {completeness.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-xs">
              <span aria-hidden="true" className={item.met ? "text-emerald-700" : "text-[#A67C52]"}>
                {item.met ? "✓" : "○"}
              </span>
              <span className={item.met ? "text-[#3D3428]" : "text-[#7A7164]"}>{item.label.en}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* A. Business summary */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Business summary</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Legal name</dt>
            <dd className="text-sm text-[#1E1810]">{business.legalName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Languages</dt>
            <dd className="text-sm text-[#1E1810]">{business.businessPrimaryLanguage ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Operating model</dt>
            <dd className="text-sm text-[#1E1810]">{business.operatingModels.map((m) => labelFromList(OPERATING_MODELS, m)).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Sales relationships</dt>
            <dd className="text-sm text-[#1E1810]">{business.salesRelationships.map((m) => labelFromList(SALES_RELATIONSHIPS, m)).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Sales channels</dt>
            <dd className="text-sm text-[#1E1810]">{business.salesChannels.map((m) => labelFromList(SALES_CHANNELS, m)).join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Year started</dt>
            <dd className="text-sm text-[#1E1810]">{business.yearStarted ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Last updated</dt>
            <dd className="text-sm text-[#1E1810]">{new Date(business.updatedAt).toLocaleString("en-US")}</dd>
          </div>
        </dl>
      </section>

      {/* C. Location and service coverage — never merged into one line. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Location and service coverage</h2>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Business country</dt>
            <dd className="text-sm text-[#1E1810]">{primaryArea?.country ? countryLabel(primaryArea.country, "en") : "—"}</dd>
          </div>
          {primaryArea && physicalAddressSummary(primaryArea.structuredDetails, primaryArea.country ?? "", "en") ? (
            <div>
              <dt className="text-xs font-semibold text-[#8A6B1F]">Physical address {primaryArea.structuredDetails.addressVisibility ? `(${primaryArea.structuredDetails.addressVisibility})` : ""}</dt>
              <dd className="text-sm text-[#1E1810]">{physicalAddressSummary(primaryArea.structuredDetails, primaryArea.country ?? "", "en")}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold text-[#8A6B1F]">Service area</dt>
            <dd className="text-sm text-[#1E1810]">{primaryArea ? summarizeServiceCoverage(primaryArea.country ?? "", primaryArea.structuredDetails, "en", t.wizard.step5.coverage.summary) : "—"}</dd>
          </div>
        </dl>
      </section>

      {/* D. Digital presence */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Digital presence</h2>
        {digitalProfiles.length === 0 && customLinks.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No digital profiles or links on file.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {digitalProfiles.map((p) => (
              <li key={p.id}>
                <a href={p.handleOrUrl.startsWith("http") || p.handleOrUrl.startsWith("@") ? p.handleOrUrl : `https://${p.handleOrUrl}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-white">
                  {labelFromList(DIGITAL_PROFILE_PLATFORMS, p.platform)}
                </a>
              </li>
            ))}
            {customLinks.map((l) => (
              <li key={l.id}>
                <a href={l.displayUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-white">
                  {l.customLabel ?? l.linkType}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contacts — all methods, labeled, formatted. */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">All contacts on file</h2>
        <dl className="mt-2 space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
              <dt className="text-xs font-semibold text-[#8A6B1F]">{labelFromList(CONTACT_LABELS, c.label)}</dt>
              <dd className="text-[#1E1810]">{!canViewPrivateContacts ? c.value : c.contactType === "phone" ? formatUsPhoneForDisplay(c.value) : c.value}</dd>
              <dd className="text-[10px] text-[#9A9184]">({c.visibility})</dd>
            </div>
          ))}
          {contacts.length === 0 ? <p className="text-sm text-[#7A7164]">No contacts on file.</p> : null}
          {contacts.length > 0 && !canViewPrivateContacts ? <p className="text-xs text-[#7A7164]">Contact values are hidden — your role does not include view_private_contacts.</p> : null}
        </dl>
      </section>

      {/* E. Connected Leonix advertisements */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Connected Leonix advertisements</h2>
        {listingLinks.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No connected advertisements.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {listingLinks.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E8DFD0] p-2 text-xs">
                <span>
                  {l.listingSource} · Ad ID {l.listingId}
                </span>
                <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 font-bold text-[#3D3428]">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sales preparation panel */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Before contacting this business</h2>
        <ul className="mt-2 space-y-1 text-xs text-[#5C5346]">
          <li>Preferred contact method: {business.preferredResponseMethod ?? "not set — confirm before calling"}</li>
          <li>Primary language: {business.businessPrimaryLanguage ?? "not set"}</li>
          <li>Connected ads: {listingLinks.length}</li>
          <li>Last contacted: {salesProfile.lastContactedAt ? new Date(salesProfile.lastContactedAt).toLocaleDateString("en-US") : "never recorded"}</li>
          {membership?.manualReviewFlag ? <li className="font-semibold text-amber-800">⚠ Authorization needs review before proceeding.</li> : null}
          {!primaryPhone && !primaryEmail ? <li className="font-semibold text-amber-800">⚠ No verified owner contact on file.</li> : null}
        </ul>
      </section>

      {/* Follow-up system */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Follow-up</h2>
        <div className="mt-3">
          <FollowUpPanel businessId={business.id} current={currentFollowUp} />
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <h2 className="text-sm font-bold text-[#1E1810]">Sales notes</h2>
        <p className="mt-1 text-xs text-[#7A7164]">Internal only — never shown to the business owner.</p>
        <div className="mt-3">
          <NotesPanel businessId={business.id} notes={notes} />
        </div>
      </section>
    </div>
  );
}
