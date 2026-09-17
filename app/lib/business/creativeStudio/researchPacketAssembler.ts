/**
 * Program 6, Gate 6L / Gate 10B — Creative Research Packet Assembler.
 * Consumes approved data from Program 4 and canonical identity stores.
 * Does NOT build a second web crawler. Reuses existing truth boundary.
 * Generation-time compile only. Old snapshots are never live-recomposed.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { listContactsForBusiness } from "@/app/lib/business/repositories/contactsRepo";
import { listCustomLinksForBusiness } from "@/app/lib/business/repositories/customLinksRepo";
import { listDigitalProfilesForBusiness } from "@/app/lib/business/repositories/digitalProfilesRepo";
import { listServiceAreasForBusiness } from "@/app/lib/business/repositories/serviceAreasRepo";
import { getOpportunityById } from "@/app/lib/business/opportunity/repository";
import { listCreativeAssetMetadataForBusiness } from "./repository";
import {
  CONFIRMED_CUSTOMER_FACT_KEYS,
  CONFIRMED_GOAL_FACT_KEYS,
  CONFIRMED_SERVICE_FACT_KEYS,
  contactIsWhatsApp,
  isConfirmedLivingBookFact,
  missingBrandTruthItems,
} from "./researchPacketLogic";
import type { SnapshotCategory } from "./types";

export interface ResearchPacketResult {
  categories: readonly SnapshotCategory[];
  missingTruth: readonly string[];
  staleItems: readonly string[];
  contradictedItems: readonly string[];
  unapprovedInferences: readonly string[];
  readyForCreative: boolean;
}

export type AssembleResearchPacketOptions = {
  sourceOpportunityId?: string | null;
};

export async function assembleResearchPacket(
  businessId: string,
  options: AssembleResearchPacketOptions = {},
): Promise<ResearchPacketResult> {
  const supabase = getAdminSupabase();
  const categories: SnapshotCategory[] = [];
  const missingTruth: string[] = [];
  const staleItems: string[] = [];
  const contradictedItems: string[] = [];
  const unapprovedInferences: string[] = [];
  const now = new Date().toISOString();
  const missingImportant: string[] = [...missingBrandTruthItems()];

  const [
    businessResult,
    factsResult,
    contradictionsResult,
    recommendationsResult,
    briefingsResult,
    contacts,
    serviceAreas,
    digitalProfiles,
    customLinks,
    assets,
    opportunity,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, display_name, normalized_name, primary_language, broad_business_type, specific_business_type, operating_models, business_stage")
      .eq("id", businessId)
      .maybeSingle(),
    supabase
      .from("business_facts")
      .select("id, fact_key, fact_category, display_value, status, source_class, confirmation_state, last_verified_at")
      .eq("business_id", businessId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("business_contradictions")
      .select("id, claim_a_label, claim_b_label")
      .eq("business_id", businessId)
      .eq("status", "open"),
    supabase
      .from("business_recommendations")
      .select("id, dimension_key, status, verified_need_es, verified_need_en, primary_intervention")
      .eq("business_id", businessId)
      .eq("status", "approved")
      .eq("is_current", true),
    supabase
      .from("business_ai_briefing_drafts")
      .select("id, status")
      .eq("business_id", businessId)
      .eq("status", "approved"),
    listContactsForBusiness(supabase, businessId),
    listServiceAreasForBusiness(supabase, businessId),
    listDigitalProfilesForBusiness(supabase, businessId),
    listCustomLinksForBusiness(supabase, businessId),
    listCreativeAssetMetadataForBusiness(businessId),
    options.sourceOpportunityId
      ? getOpportunityById(businessId, options.sourceOpportunityId)
      : Promise.resolve(null),
  ]);

  const business = businessResult.data;
  if (business) {
    categories.push({
      category: "identity",
      truthStatus: "KNOWN",
      data: {
        displayName: business.display_name,
        normalizedName: business.normalized_name,
        primaryLanguage: business.primary_language,
        broadBusinessType: business.broad_business_type,
        specificBusinessType: business.specific_business_type,
        operatingModel: business.operating_models,
        businessStage: business.business_stage,
      },
      evidenceRefs: [],
      snapshotTimestamp: now,
    });
  } else {
    missingTruth.push("Business identity not found.");
  }

  const compiledContacts = contacts.slice(0, 40).map((row) => ({
    id: row.id,
    contactType: row.contactType,
    value: row.value,
    isPrimary: row.isPrimary,
    visibility: row.visibility,
    channelKind: row.channelKind,
    capabilities: row.capabilities,
    isWhatsApp: contactIsWhatsApp(row),
  }));
  const phone = compiledContacts.find((row) => row.contactType === "phone");
  const email = compiledContacts.find((row) => row.contactType === "email");
  const website = compiledContacts.find((row) => row.contactType === "website");
  const whatsapp = compiledContacts.find((row) => row.isWhatsApp);
  if (!phone) missingImportant.push("Approved/active phone — missing.");
  if (!email) missingImportant.push("Approved/active email — missing.");
  if (!whatsapp) missingImportant.push("Approved/active WhatsApp — missing.");
  categories.push({
    category: "approved_contacts_location",
    truthStatus: compiledContacts.length > 0 || serviceAreas.length > 0 ? "KNOWN" : "UNKNOWN",
    data: {
      contacts: compiledContacts,
      phones: compiledContacts.filter((row) => row.contactType === "phone"),
      emails: compiledContacts.filter((row) => row.contactType === "email"),
      websites: compiledContacts.filter((row) => row.contactType === "website"),
      whatsapp: compiledContacts.filter((row) => row.isWhatsApp),
      serviceAreas: serviceAreas.slice(0, 20).map((row) => ({
        id: row.id,
        areaKind: row.areaKind,
        rawText: row.rawText,
        cityHint: row.cityHint,
        isPrimary: row.isPrimary,
        country: row.country,
      })),
    },
    evidenceRefs: compiledContacts.map((row) => ({
      factId: row.id,
      sourceClass: "business_contacts",
      approvalState: row.visibility,
      evidenceId: null,
    })),
    snapshotTimestamp: now,
  });

  categories.push({
    category: "digital_destinations",
    truthStatus: digitalProfiles.length > 0 || customLinks.length > 0 || Boolean(website) ? "KNOWN" : "UNKNOWN",
    data: {
      officialWebsite: website?.value ?? null,
      socialProfiles: digitalProfiles.slice(0, 20).map((row) => ({
        id: row.id,
        platform: row.platform,
        handleOrUrl: row.handleOrUrl,
      })),
      destinationLinks: customLinks.slice(0, 20).map((row) => ({
        id: row.id,
        linkType: row.linkType,
        customLabel: row.customLabel,
        displayUrl: row.displayUrl,
        visibility: row.visibility,
      })),
    },
    evidenceRefs: [
      ...digitalProfiles.map((row) => ({ factId: row.id, sourceClass: "business_digital_profiles", approvalState: "stored", evidenceId: null })),
      ...customLinks.map((row) => ({ factId: row.id, sourceClass: "business_custom_links", approvalState: row.visibility, evidenceId: null })),
    ],
    snapshotTimestamp: now,
  });
  if (!website && digitalProfiles.length === 0 && customLinks.length === 0) {
    missingImportant.push("Stored official website / digital destinations — missing.");
  }

  const facts = factsResult.data ?? [];
  const verifiedFacts = facts.filter((f) => isConfirmedLivingBookFact(String(f.confirmation_state), String(f.status)));
  const unverifiedFacts = facts.filter((f) => f.confirmation_state === "unconfirmed");
  const compiledFacts = verifiedFacts.map((f) => ({
    fieldKey: String(f.fact_key),
    displayValue: String(f.display_value ?? ""),
    sourceClass: f.source_class ? String(f.source_class) : null,
    confirmationState: f.confirmation_state ? String(f.confirmation_state) : null,
    factId: String(f.id),
    factCategory: f.fact_category ? String(f.fact_category) : null,
  }));

  categories.push({
    category: "confirmed_facts",
    truthStatus: compiledFacts.length > 0 ? "KNOWN" : "UNKNOWN",
    data: { facts: compiledFacts },
    evidenceRefs: compiledFacts.map((f) => ({
      factId: f.factId,
      sourceClass: f.sourceClass,
      approvalState: f.confirmationState,
      evidenceId: null,
    })),
    snapshotTimestamp: now,
  });
  if (compiledFacts.length === 0) missingTruth.push("No approved business facts found in Living Business Book.");
  if (unverifiedFacts.length > 0) {
    unapprovedInferences.push(`${unverifiedFacts.length} unverified facts should not be printed as confirmed truth.`);
  }
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 90);
  for (const f of facts) {
    if (f.last_verified_at && new Date(String(f.last_verified_at)) < staleThreshold) {
      staleItems.push(`Fact ${f.fact_key} last verified ${f.last_verified_at}.`);
    }
  }

  const goalFacts = compiledFacts.filter((f) => (CONFIRMED_GOAL_FACT_KEYS as readonly string[]).includes(f.fieldKey));
  const customerFacts = compiledFacts.filter((f) => (CONFIRMED_CUSTOMER_FACT_KEYS as readonly string[]).includes(f.fieldKey));
  const serviceFacts = compiledFacts.filter((f) => (CONFIRMED_SERVICE_FACT_KEYS as readonly string[]).includes(f.fieldKey));
  categories.push({
    category: "goals_customer_services",
    truthStatus: goalFacts.length + customerFacts.length + serviceFacts.length > 0 ? "KNOWN" : "UNKNOWN",
    data: {
      facts: [...goalFacts, ...customerFacts, ...serviceFacts],
      ownerGoals: goalFacts,
      targetCustomer: customerFacts,
      productsServices: serviceFacts,
      confirmedCta: null,
      confirmedOffer: null,
    },
    evidenceRefs: [...goalFacts, ...customerFacts, ...serviceFacts].map((f) => ({
      factId: f.factId,
      sourceClass: f.sourceClass,
      approvalState: f.confirmationState,
      evidenceId: null,
    })),
    snapshotTimestamp: now,
  });
  if (goalFacts.length === 0) missingImportant.push("Confirmed owner goals — missing.");
  if (customerFacts.length === 0) missingImportant.push("Confirmed target customer — missing.");
  if (serviceFacts.length === 0) missingImportant.push("Confirmed product/service summary — missing.");
  missingImportant.push("Confirmed CTA — no canonical fact key exists.");
  missingImportant.push("Confirmed offer — no canonical fact key exists.");

  const contradictions = contradictionsResult.data ?? [];
  if (contradictions.length > 0) {
    for (const c of contradictions) {
      contradictedItems.push(`Contradiction: ${c.claim_a_label} ↔ ${c.claim_b_label}`);
    }
  }

  const recommendations = recommendationsResult.data ?? [];
  if (recommendations.length > 0) {
    categories.push({
      category: "source_recommendation",
      truthStatus: "KNOWN",
      data: {
        recommendations: recommendations.map((r) => ({
          id: r.id,
          dimensionKey: r.dimension_key,
          needEs: r.verified_need_es,
          needEn: r.verified_need_en,
          primaryIntervention: r.primary_intervention,
        })),
      },
      evidenceRefs: recommendations.map((r) => ({ factId: null, sourceClass: "stewardship", approvalState: "approved", evidenceId: r.id })),
      snapshotTimestamp: now,
    });
  }

  if (opportunity) {
    categories.push({
      category: "source_opportunity",
      truthStatus: "KNOWN",
      data: {
        id: opportunity.id,
        opportunityType: opportunity.opportunityType,
        titleEn: opportunity.titleEn,
        titleEs: opportunity.titleEs,
        summaryEn: opportunity.summaryEn,
        lifecycleState: opportunity.lifecycleState,
        sourceTitle: opportunity.sourceTitle,
        confirmedSponsorship: false,
      },
      evidenceRefs: [{ factId: opportunity.id, sourceClass: "business_creative_opportunities", approvalState: opportunity.lifecycleState, evidenceId: null }],
      snapshotTimestamp: now,
    });
  }

  const assetRows = assets.map((row) => ({
    id: row.id,
    assetKind: row.assetKind,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    storageRef: row.storageRef,
    rightsSource: row.rightsSource,
    rightsStatus: row.rightsStatus,
    authenticityClassification: row.authenticityClassification,
    approvalState: row.approvalState,
    uploadedDoesNotMeanApproved: row.approvalState !== "approved",
  }));
  categories.push({
    category: "creative_assets",
    truthStatus: assetRows.length > 0 ? "KNOWN" : "UNKNOWN",
    data: {
      assets: assetRows,
      clientLogos: assetRows.filter((row) => row.assetKind === "client_logo"),
      clientPhotos: assetRows.filter((row) => row.assetKind === "client_photo"),
    },
    evidenceRefs: assetRows.map((row) => ({
      factId: row.id,
      sourceClass: row.rightsSource,
      approvalState: `${row.approvalState}/${row.rightsStatus}`,
      evidenceId: null,
    })),
    snapshotTimestamp: now,
  });
  if (!assetRows.some((row) => row.assetKind === "client_logo")) {
    missingImportant.push("Client logo — missing.");
  }

  const briefings = briefingsResult.data ?? [];
  if (briefings.length > 0) {
    categories.push({
      category: "ai_research_context",
      truthStatus: "UNAPPROVED_INFERENCE",
      data: { briefingCount: briefings.length },
      evidenceRefs: [],
      snapshotTimestamp: now,
    });
    unapprovedInferences.push("AI research briefings are context only, not printable facts.");
  }

  categories.push({
    category: "missing_important_information",
    truthStatus: "UNKNOWN",
    data: { items: missingImportant },
    evidenceRefs: [],
    snapshotTimestamp: now,
  });

  const readyForCreative = missingTruth.length === 0 && contradictedItems.length === 0;

  return {
    categories,
    missingTruth,
    staleItems,
    contradictedItems,
    unapprovedInferences,
    readyForCreative,
  };
}
