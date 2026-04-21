import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import type {
  CompanyTypeSlug,
  EmpleosJobRecord,
  EmpleosListingTier,
  ExperienceSlug,
  JobModalitySlug,
  JobTypeSlug,
} from "../../data/empleosJobTypes";
import type { EmpleosCanonicalListing, EmpleosStagedPublicStatus } from "./empleosCanonicalListing";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80";

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "LX";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[p.length - 1]![0]).toUpperCase();
}

function parseSalaryRange(label: string): { min: number; max: number } {
  const nums =
    label
      .match(/\d[\d,]*/g)
      ?.map((x) => Number(String(x).replace(/,/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (nums.length >= 2) return { min: Math.min(...nums), max: Math.max(...nums) };
  if (nums.length === 1) return { min: nums[0]!, max: nums[0]! };
  return { min: 0, max: 0 };
}

function mapJobType(raw: string): JobTypeSlug {
  const v = raw.toLowerCase();
  if (v.includes("medio")) return "medio-tiempo";
  if (v.includes("temporal")) return "temporal";
  if (v.includes("contrato")) return "por-contrato";
  return "tiempo-completo";
}

function mapModality(raw: string): JobModalitySlug {
  const v = raw.toLowerCase();
  if (v.includes("remote") || v.includes("remoto")) return "remoto";
  if (v.includes("híbrid") || v.includes("hibrid") || v.includes("hybrid")) return "hibrido";
  return "presencial";
}

function tierFromPremium(data: { featured: boolean; premium: boolean }): EmpleosListingTier {
  if (data.premium) return "promoted";
  if (data.featured) return "featured";
  return "standard";
}

/**
 * Maps a publish envelope (post-sanitize) into the public `EmpleosJobRecord` browse/detail shape.
 */
export function empleosEnvelopeToJobRecord(
  e: EmpleosPublishEnvelope,
  opts: { slug: string; listingId: string; publishedAtIso: string | null },
): EmpleosJobRecord {
  const now = new Date().toISOString();
  const publishedAt = opts.publishedAtIso ?? now;

  if (e.payload.lane === "quick") {
    const d = e.payload.data;
    const { min, max } = parseSalaryRange(d.pay);
    const imageSrc = e.mediaReferences.primaryImageUrl ?? d.logoUrl ?? PLACEHOLDER_IMG;
    return {
      id: opts.listingId,
      slug: opts.slug,
      title: d.title,
      company: d.businessName,
      city: d.city,
      state: d.state,
      postalCode: d.addressZip?.trim() || undefined,
      category: "oficina",
      modality: mapModality(d.schedule),
      jobType: mapJobType(d.jobType),
      salaryMin: min,
      salaryMax: max,
      salaryLabel: d.pay || (min && max ? `$${min.toLocaleString()} – $${max.toLocaleString()}` : "—"),
      experience: "mid" as ExperienceSlug,
      companyType: "small" as CompanyTypeSlug,
      quickApply: d.primaryCta === "email",
      publishedAt,
      listingTier: "standard",
      verifiedEmployer: false,
      premiumEmployer: false,
      companyInitials: initials(d.businessName),
      imageSrc,
      imageAlt: d.title,
      summary: d.description.slice(0, 220),
      description: d.description,
      requirements: [],
      benefits: d.benefits,
      benefitChips: d.benefits.slice(0, 4),
      showOnLandingFeatured: false,
      showOnLandingRecent: false,
    };
  }

  if (e.payload.lane === "premium") {
    const d = e.payload.data;
    const primary = `${d.salaryPrimary} ${d.salarySecondary}`.trim();
    const { min, max } = parseSalaryRange(primary);
    const imageSrc = e.mediaReferences.primaryImageUrl ?? d.logoUrl ?? PLACEHOLDER_IMG;
    return {
      id: opts.listingId,
      slug: opts.slug,
      title: d.title,
      company: d.companyName,
      city: d.city,
      state: d.state,
      category: "oficina",
      modality: mapModality(d.jobType),
      jobType: mapJobType(d.jobType),
      salaryMin: min,
      salaryMax: max,
      salaryLabel: primary || "—",
      experience: "mid" as ExperienceSlug,
      companyType: d.premium ? ("mid" as CompanyTypeSlug) : ("small" as CompanyTypeSlug),
      quickApply: d.primaryCta === "email",
      publishedAt,
      listingTier: tierFromPremium(d),
      verifiedEmployer: false,
      premiumEmployer: d.premium,
      companyInitials: initials(d.companyName),
      imageSrc,
      imageAlt: d.title,
      summary: d.introduction.slice(0, 220),
      description: [d.introduction, ...d.responsibilities, ...d.requirements].filter(Boolean).join("\n\n"),
      requirements: d.requirements,
      benefits: d.offers,
      benefitChips: d.offers.slice(0, 4),
      showOnLandingFeatured: false,
      showOnLandingRecent: false,
    };
  }

  const d = e.payload.data;
  const imageSrc = e.mediaReferences.primaryImageUrl ?? PLACEHOLDER_IMG;
  const desc = [d.dateLine, d.timeLine, d.venue, ...d.detailsBullets].filter(Boolean).join("\n");
  return {
    id: opts.listingId,
    slug: opts.slug,
    title: d.title,
    company: d.organizer,
    city: d.city,
    state: d.state,
    category: "oficina",
    modality: mapModality(d.modality),
    jobType: "tiempo-completo",
    salaryMin: 0,
    salaryMax: 0,
    salaryLabel: d.freeEntry ? (e.language === "es" ? "Entrada libre / consultar" : "Free entry / inquire") : "—",
    experience: "mid" as ExperienceSlug,
    companyType: "small" as CompanyTypeSlug,
    quickApply: Boolean(d.contactEmail?.trim()),
    publishedAt,
    listingTier: "featured",
    verifiedEmployer: false,
    premiumEmployer: false,
    companyInitials: initials(d.organizer),
    imageSrc,
    imageAlt: d.flyerAlt || d.title,
    summary: desc.slice(0, 220),
    description: desc,
    requirements: d.secondaryDetails,
    benefits: d.detailsBullets,
    benefitChips: d.detailsBullets.slice(0, 4),
    showOnLandingFeatured: false,
    showOnLandingRecent: false,
  };
}

export function empleosEnvelopeToCanonical(
  e: EmpleosPublishEnvelope,
  opts: {
    listingId: string;
    ownerId: string;
    slug: string;
    status: EmpleosStagedPublicStatus;
    publishedAt: string | null;
  },
): EmpleosCanonicalListing {
  const now = new Date().toISOString();
  const jobRecord = empleosEnvelopeToJobRecord(e, {
    slug: opts.slug,
    listingId: opts.listingId,
    publishedAtIso: opts.publishedAt,
  });
  const jr = jobRecord;
  const createdAt = e.createdAt ?? now;
  return {
    listingId: opts.listingId,
    ownerId: opts.ownerId,
    category: "empleos",
    lane: e.lane,
    slug: opts.slug,
    language: e.language,
    status: opts.status,
    title: jr.title,
    company: jr.company,
    city: jr.city,
    state: jr.state,
    postalCode: jr.postalCode,
    salaryLabel: jr.salaryLabel,
    salaryMin: jr.salaryMin,
    salaryMax: jr.salaryMax,
    summary: jr.summary,
    description: jr.description,
    requirements: [...jr.requirements],
    benefits: [...jr.benefits],
    benefitChips: [...jr.benefitChips],
    jobRecord: jr,
    analytics: { views: 0, clicks: 0, contacts: 0, saves: 0 },
    createdAt,
    updatedAt: now,
    publishedAt: opts.status === "published" ? opts.publishedAt ?? now : null,
    envelopeSchemaVersion: 1,
  };
}
