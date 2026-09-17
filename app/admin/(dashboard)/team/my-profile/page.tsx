import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { StaffTeamNav } from "@/app/admin/_components/StaffTeamNav";
import { adminActionProofErr, adminActionProofOk, adminCardBase, adminCtaChip } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubForm } from "@/app/admin/_components/executiveHub/ExecutiveHubForm";
import { resolveActingRosterIdentity } from "@/app/admin/_lib/adminRosterAudit";
import { getExecutiveHubRecordByRosterId } from "@/app/admin/_lib/executiveHubStore";
import { updateOwnExecutiveHubProfileAction } from "@/app/admin/executiveHubSelfServiceActions";

export const dynamic = "force-dynamic";

const ERROR_COPY: Record<string, string> = {
  identity_not_resolvable:
    "We could not confirm your staff identity for self-editing. Make sure you signed in with the Staff / Team login (email + password), not the owner bootstrap login, and that your account is active.",
  no_linked_profile:
    "No public contact profile is linked to your account yet. Ask an owner to open Executive Hub and link your account under “Link to staff account” — then this page will let you edit it yourself.",
};

/**
 * Master Operating Book V2 §0G — the staff self-service home. Reachable by any authenticated
 * Admin user (the dashboard layout already enforces login); what renders below depends entirely
 * on whether this specific caller's identity resolves to a linked Executive Hub profile — the
 * same two checks the self-service server action performs, done here too so the page itself
 * never shows a form it could not actually save.
 */
export default async function MyExecutiveProfilePage(props: { searchParams?: Promise<{ saved?: string; error?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};
  const actor = await resolveActingRosterIdentity();
  const profile = actor ? await getExecutiveHubRecordByRosterId(actor.rosterId) : null;

  return (
    <div>
      <StaffTeamNav />
      <div className="mt-6">
        <AdminPageHeader
          eyebrow="Team · My Profile"
          title="My contact profile"
          subtitle="Edit your own public contact information — name shown, title, bio, phone, email, socials, theme, and photo. Publishing, your slug, and company details remain owner-managed."
          rightSlot={
            profile ? (
              <Link href={`/contact/${profile.slug}`} target="_blank" rel="noreferrer" className={adminCtaChip}>
                View my public page →
              </Link>
            ) : undefined
          }
        />

        {sp.saved ? <p className={`${adminActionProofOk} mb-6`}>Saved.</p> : null}
        {sp.error ? (
          <p className={`${adminActionProofErr} mb-6`}>{ERROR_COPY[sp.error] ?? sp.error}</p>
        ) : null}

        {!actor ? (
          <div className={`${adminCardBase} p-5 text-sm text-[#5C5346]`}>{ERROR_COPY.identity_not_resolvable}</div>
        ) : !profile ? (
          <div className={`${adminCardBase} p-5 text-sm text-[#5C5346]`}>{ERROR_COPY.no_linked_profile}</div>
        ) : (
          <ExecutiveHubForm mode="self" initial={profile} action={updateOwnExecutiveHubProfileAction} />
        )}
      </div>
    </div>
  );
}
