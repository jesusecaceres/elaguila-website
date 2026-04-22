import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import type {
  CompanyTypeSlug,
  EmpleosJobRecord,
  EmpleosListingTier,
  EmpleosScreenerQuestion,
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

/** Schedule / free-text line that may mention remote or hybrid. */
function mapModalityFromText(raw: string): JobModalitySlug {
  const v = raw.toLowerCase();
  if (v.includes("remote") || v.includes("remoto") || v.includes("virtual")) return "remoto";
  if (v.includes("híbrid") || v.includes("hibrid") || v.includes("hybrid")) return "hibrido";
  return "presencial";
}

function tierFromPremium(data: { featured: boolean; premium: boolean }): EmpleosListingTier {
  if (data.premium) return "promoted";
  if (data.featured) return "featured";
  return "standard";
}

function asExperience(v: string | undefined): ExperienceSlug {
  return v === "entry" || v === "mid" || v === "senior" ? v : "mid";
}

function screenerFromStrings(prompts: string[]): EmpleosScreenerQuestion[] {
  return prompts.slice(0, 5).map((prompt, i) => ({ id: `sq${i + 1}`, prompt }));
}

function validThroughIsoFrom(publishedAt: string): string {
  const d = new Date(publishedAt);
  d.setUTCDate(d.getUTCDate() + 90);
  return d.toISOString();
}

function tierForLane(lane: "quick" | "premium" | "feria", premiumTier: EmpleosListingTier): EmpleosListingTier {
  if (lane === "feria") return "featured";
  if (lane === "quick") return "standard";
  return premiumTier;
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
  const validThroughIso = validThroughIsoFrom(publishedAt);

  if (e.payload.lane === "quick") {
    const d = e.payload.data;
    const { min, max } = parseSalaryRange(d.pay);
    const imageSrc = e.mediaReferences.primaryImageUrl ?? d.logoUrl ?? PLACEHOLDER_IMG;
    const category = (d.categorySlug || "oficina").trim() || "oficina";
    const modality = mapModalityFromText(d.schedule);
    const descParts = [
      d.description,
      d.addressLine1 ? `Dirección: ${d.addressLine1}, ${d.addressCity}, ${d.addressState} ${d.addressZip}`.trim() : "",
      d.website ? `Web: ${d.website}` : "",
      d.phone ? `Tel: ${d.phone}` : "",
      d.whatsapp ? `WhatsApp: ${d.whatsapp}` : "",
      d.email ? `Email: ${d.email}` : "",
      d.videoUrl ? `Video: ${d.videoUrl}` : "",
    ].filter(Boolean);
    const description = descParts.join("\n\n");
    const screeners = screenerFromStrings(d.screenerQuestions ?? []);

    return {
      id: opts.listingId,
      slug: opts.slug,
      title: d.title,
      company: d.businessName,
      city: d.city,
      state: d.state,
      postalCode: d.addressZip?.trim() || undefined,
      category,
      modality,
      jobType: mapJobType(d.jobType),
      salaryMin: min,
      salaryMax: max,
      salaryLabel: d.pay || (min && max ? `$${min.toLocaleString()} – $${max.toLocaleString()}` : "—"),
      experience: asExperience(d.experienceLevel),
      companyType: "small" as CompanyTypeSlug,
      quickApply: d.primaryCta === "email",
      publishedAt,
      listingTier: tierForLane("quick", "standard"),
      verifiedEmployer: false,
      premiumEmployer: false,
      companyInitials: initials(d.businessName),
      imageSrc,
      imageAlt: d.title,
      summary: d.description.slice(0, 220),
      description,
      requirements: [d.schedule ? `Horario / modalidad declarados: ${d.schedule}` : ""].filter(Boolean),
      benefits: d.benefits,
      benefitChips: d.benefits.slice(0, 4),
      showOnLandingFeatured: false,
      showOnLandingRecent: false,
      publicationLane: "quick",
      scheduleLabel: d.schedule,
      screenerQuestions: screeners,
      validThroughIso,
      employerPhone: d.phone || undefined,
      employerWhatsapp: d.whatsapp || undefined,
      employerEmail: d.email || undefined,
      employerWebsite: d.website || undefined,
      employerAddressLine: d.addressLine1 || undefined,
    };
  }

  if (e.payload.lane === "premium") {
    const d = e.payload.data;
    const primary = `${d.salaryPrimary} ${d.salarySecondary}`.trim();
    const { min, max } = parseSalaryRange(primary);
    const imageSrc = e.mediaReferences.primaryImageUrl ?? d.logoUrl ?? PLACEHOLDER_IMG;
    const category = (d.categorySlug || "oficina").trim() || "oficina";
    const modality: JobModalitySlug = d.workModality;
    const descParts = [
      d.introduction,
      d.responsibilities.length ? `Responsabilidades:\n${d.responsibilities.map((x) => `• ${x}`).join("\n")}` : "",
      d.requirements.length ? `Requisitos:\n${d.requirements.map((x) => `• ${x}`).join("\n")}` : "",
      d.offers.length ? `Ofrecemos:\n${d.offers.map((x) => `• ${x}`).join("\n")}` : "",
      d.companyOverview ? `Empresa:\n${d.companyOverview}` : "",
      d.employerAddress ? `Ubicación empresa: ${d.employerAddress}` : "",
      d.employerRating || d.reviewCount ? `Valoración: ${d.employerRating} (${d.reviewCount} reseñas)` : "",
      d.videoUrl ? `Video: ${d.videoUrl}` : "",
    ].filter(Boolean);
    const description = descParts.join("\n\n");
    const screeners = screenerFromStrings(d.screenerQuestions ?? []);
    const extUrl = d.primaryCta === "website" ? d.websiteUrl : undefined;

    return {
      id: opts.listingId,
      slug: opts.slug,
      title: d.title,
      company: d.companyName,
      city: d.city,
      state: d.state,
      category,
      modality,
      jobType: mapJobType(d.jobType),
      salaryMin: min,
      salaryMax: max,
      salaryLabel: primary || "—",
      experience: asExperience(d.experienceLevel),
      companyType: d.premium ? ("mid" as CompanyTypeSlug) : ("small" as CompanyTypeSlug),
      quickApply: d.primaryCta === "email",
      publishedAt,
      listingTier: tierForLane("premium", tierFromPremium(d)),
      verifiedEmployer: false,
      premiumEmployer: d.premium,
      companyInitials: initials(d.companyName),
      imageSrc,
      imageAlt: d.title,
      summary: d.introduction.slice(0, 220),
      description,
      requirements: d.requirements,
      benefits: d.offers,
      benefitChips: d.offers.slice(0, 4),
      showOnLandingFeatured: false,
      showOnLandingRecent: false,
      publicationLane: "premium",
      scheduleLabel: d.scheduleLabel || undefined,
      screenerQuestions: screeners,
      validThroughIso,
      employerWhatsapp: d.whatsapp || undefined,
      employerEmail: d.email || undefined,
      employerWebsite: d.websiteUrl || undefined,
      externalApplyUrl: extUrl || undefined,
    };
  }

  const d = e.payload.data;
  const imageSrc = e.mediaReferences.primaryImageUrl ?? PLACEHOLDER_IMG;
  const descCore = [d.dateLine, d.timeLine, d.venue, ...d.detailsBullets].filter(Boolean).join("\n");
  const descParts = [
    descCore,
    d.ctaIntro,
    d.industryFocus ? `Industria / enfoque: ${d.industryFocus}` : "",
    d.bilingual ? (e.language === "es" ? "Evento bilingüe (ES / EN)." : "Bilingual event (ES / EN).") : "",
    d.organizerUrl ? `Organizador (web): ${d.organizerUrl}` : "",
    d.contactLink ? `Enlace: ${d.contactLink}` : "",
    d.contactPhone ? `Tel: ${d.contactPhone}` : "",
    d.contactEmail ? `Email: ${d.contactEmail}` : "",
    d.ctaLabel ? `CTA: ${d.ctaLabel}` : "",
    ...d.secondaryDetails.map((x) => x.trim()).filter(Boolean),
  ].filter(Boolean);
  const description = descParts.join("\n\n");
  const modality = mapModalityFromText(String(d.modality));

  return {
    id: opts.listingId,
    slug: opts.slug,
    title: d.title,
    company: d.organizer,
    city: d.city,
    state: d.state,
    category: "feria",
    modality,
    jobType: "tiempo-completo",
    salaryMin: 0,
    salaryMax: 0,
    salaryLabel: d.freeEntry ? (e.language === "es" ? "Entrada libre / consultar" : "Free entry / inquire") : "—",
    experience: "mid" as ExperienceSlug,
    companyType: "small" as CompanyTypeSlug,
    quickApply: Boolean(d.contactEmail?.trim()),
    publishedAt,
    listingTier: tierForLane("feria", "featured"),
    verifiedEmployer: false,
    premiumEmployer: false,
    companyInitials: initials(d.organizer),
    imageSrc,
    imageAlt: d.flyerAlt || d.title,
    summary: descCore.slice(0, 220) || d.title,
    description,
    requirements: d.secondaryDetails,
    benefits: d.detailsBullets,
    benefitChips: d.detailsBullets.slice(0, 4),
    showOnLandingFeatured: false,
    showOnLandingRecent: false,
    publicationLane: "feria",
    industryFocus: d.industryFocus || undefined,
    bilingual: d.bilingual,
    languagesSpoken: d.bilingual ? "es, en" : "es",
    feriaDateLine: d.dateLine || undefined,
    feriaTimeLine: d.timeLine || undefined,
    feriaVenue: d.venue || undefined,
    organizerUrl: d.organizerUrl || undefined,
    freeEntry: d.freeEntry,
    scheduleLabel: [d.dateLine, d.timeLine].filter(Boolean).join(" · ") || undefined,
    screenerQuestions: [],
    validThroughIso,
    employerPhone: d.contactPhone || undefined,
    employerEmail: d.contactEmail || undefined,
    externalApplyUrl: d.contactLink?.startsWith("http") ? d.contactLink : d.organizerUrl || undefined,
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
