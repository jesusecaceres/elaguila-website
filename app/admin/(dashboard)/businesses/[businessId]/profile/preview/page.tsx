import { notFound, redirect } from "next/navigation";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../../../_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { listContactsForBusiness } from "@/app/lib/business/repositories/contactsRepo";
import { listServiceAreasForBusiness } from "@/app/lib/business/repositories/serviceAreasRepo";
import { listDigitalProfilesForBusiness } from "@/app/lib/business/repositories/digitalProfilesRepo";
import { listCustomLinksForBusiness } from "@/app/lib/business/repositories/customLinksRepo";
import { getBusinessProfile } from "@/app/lib/business/profile/repository";
import { BusinessProfilePresentation } from "@/app/lib/business/profile/BusinessProfilePresentation";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function StaffBusinessProfilePreviewPage({ params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_profile")) {
    redirect("/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const admin = getAdminSupabase();

  const [business, profile, contacts, serviceAreas, digitalProfiles, customLinks] = await Promise.all([
    getBusinessByIdForCurrentUser(admin, businessId),
    getBusinessProfile(businessId),
    listContactsForBusiness(admin, businessId),
    listServiceAreasForBusiness(admin, businessId),
    listDigitalProfilesForBusiness(admin, businessId),
    listCustomLinksForBusiness(admin, businessId),
  ]);

  if (!business) notFound();

  return (
    <BusinessProfilePresentation
      mode="staff_preview"
      profileStatus={profile?.status ?? "draft"}
      business={{
        displayName: business.displayName,
        publicName: business.publicName,
        broadBusinessType: business.broadBusinessType,
        specificBusinessType: business.specificBusinessType,
        customSpecificType: business.customSpecificType,
      }}
      profile={{
        headline: profile?.headline ?? null,
        shortDescription: profile?.shortDescription ?? null,
        aboutDescription: profile?.aboutDescription ?? null,
        logoUrl: profile?.logoUrl ?? null,
        heroImageUrl: profile?.heroImageUrl ?? null,
        galleryImages: profile?.galleryImages ?? [],
        featuredHighlights: profile?.featuredHighlights ?? [],
      }}
      contacts={contacts.filter((c) => c.visibility === "public").map((c) => ({ contactType: c.contactType, value: c.value, label: c.label, isPrimary: c.isPrimary, channelKind: c.channelKind }))}
      digitalProfiles={digitalProfiles.map((d) => ({ platform: d.platform, handleOrUrl: d.handleOrUrl }))}
      customLinks={customLinks.filter((l) => l.visibility === "public").map((l) => ({ linkType: l.linkType, customLabel: l.customLabel, displayUrl: l.displayUrl, sortOrder: l.sortOrder }))}
      serviceAreas={serviceAreas.map((a) => ({ country: a.country, cityHint: a.cityHint, areaKind: a.areaKind, isPrimary: a.isPrimary }))}
    />
  );
}
