import type { ExperienceSlug, JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import type { EmpleosImageItem } from "../media/empleosMediaTypes";

export type EmpleosQuickPrimaryCta = "phone" | "whatsapp" | "email";

export type EmpleosQuickScheduleRow = { day: string; shift: string };

export type EmpleosQuickDraft = {
  title: string;
  businessName: string;
  /** Role family — must match `EmpleosJobRecord.category` filter slugs. */
  categorySlug: string;
  /** When `categorySlug === "otro"`, public-facing custom label. */
  categoryCustom: string;
  experienceLevel: ExperienceSlug;
  /** Open public city used for search; legacy sessions may still contain old regional labels. */
  city: string;
  state: string;
  workModality: JobModalitySlug;
  jobType: string;
  /** Legacy single line; combined with `scheduleRows` at publish. */
  schedule: string;
  /** Structured shifts; rendered as clean lines in preview and public output. */
  scheduleRows: EmpleosQuickScheduleRow[];
  pay: string;
  description: string;
  /** Repeatable benefit lines → shell bullets. */
  benefits: string[];
  /** Up to 5 optional screener prompts for internal apply. */
  screenerQuestions: string[];
  images: EmpleosImageItem[];
  logoUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  primaryCta: EmpleosQuickPrimaryCta;
  addressLine1: string;
  addressLine2: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  /** Local object URL for draft preview only — not uploaded to Mux */
  videoObjectUrl: string | null;
  videoFileName: string;
  /** External video URL for draft preview only (no Mux). */
  videoUrl: string;
  /** External video URLs for public preview/publish. Legacy `videoUrl` is mirrored as the first item. */
  videoUrls: string[];
};

/** Migrates legacy `benefitsText` and partial sessions. */
export function normalizeEmpleosQuickDraft(p: Partial<EmpleosQuickDraft> & { benefitsText?: string }): EmpleosQuickDraft {
  const e = emptyEmpleosQuickDraft();
  const raw = p as Partial<EmpleosQuickDraft> & { benefitsText?: string };
  const legacyText = typeof raw.benefitsText === "string" ? raw.benefitsText : "";
  const rest: Partial<EmpleosQuickDraft> = { ...raw };
  delete (rest as { benefitsText?: string }).benefitsText;
  let benefits = Array.isArray(rest.benefits) ? [...rest.benefits] : [];
  if (!benefits.length && legacyText.trim()) {
    benefits = legacyText.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  const exp = rest.experienceLevel;
  const experienceLevel: ExperienceSlug =
    exp === "entry" || exp === "mid" || exp === "senior" ? exp : e.experienceLevel;
  const screenerQuestions = Array.isArray(rest.screenerQuestions)
    ? rest.screenerQuestions.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 5)
    : e.screenerQuestions;
  const categorySlug = typeof rest.categorySlug === "string" && rest.categorySlug.trim() ? rest.categorySlug.trim() : e.categorySlug;
  const categoryCustom =
    typeof rest.categoryCustom === "string" ? rest.categoryCustom.trim() : e.categoryCustom;
  const cityRaw = typeof rest.city === "string" && rest.city.trim() ? rest.city.trim() : e.city;
  const stateRegion =
    typeof rest.stateRegion === "string" && rest.stateRegion.trim()
      ? rest.stateRegion.trim()
      : typeof rest.addressState === "string" && rest.addressState.trim()
        ? rest.addressState.trim()
        : typeof rest.state === "string"
          ? rest.state.trim()
          : e.stateRegion;
  const postalCode =
    typeof rest.postalCode === "string" && rest.postalCode.trim()
      ? rest.postalCode.trim()
      : typeof rest.addressZip === "string"
        ? rest.addressZip.trim()
        : e.postalCode;
  const legacyVideoUrl = typeof rest.videoUrl === "string" ? rest.videoUrl.trim() : "";
  const videoUrls = Array.from(
    new Set(
      [
        ...(Array.isArray(rest.videoUrls) ? rest.videoUrls : []),
        legacyVideoUrl,
      ]
        .map((u) => String(u ?? "").trim())
        .filter((u) => /^https?:\/\//i.test(u)),
    ),
  ).slice(0, 4);
  const modalityRaw = rest.workModality;
  const workModality: JobModalitySlug =
    modalityRaw === "presencial" || modalityRaw === "hibrido" || modalityRaw === "remoto" ? modalityRaw : e.workModality;

  let scheduleRows: EmpleosQuickScheduleRow[] = Array.isArray(rest.scheduleRows)
    ? rest.scheduleRows.map((r) => ({
        day: String((r as EmpleosQuickScheduleRow).day ?? "").trim(),
        shift: String((r as EmpleosQuickScheduleRow).shift ?? "").trim(),
      }))
    : [];
  const schedStr = typeof rest.schedule === "string" ? rest.schedule.trim() : "";
  if (!scheduleRows.some((r) => r.day || r.shift) && schedStr) {
    scheduleRows = [{ day: "", shift: schedStr }];
  }
  if (!scheduleRows.length) scheduleRows = [{ day: "", shift: "" }];

  return {
    ...e,
    ...rest,
    benefits,
    categorySlug,
    categoryCustom,
    experienceLevel,
    screenerQuestions,
    videoUrl: videoUrls[0] ?? "",
    videoUrls,
    city: cityRaw,
    state: typeof rest.state === "string" && rest.state.trim() ? rest.state.trim() : stateRegion,
    addressCity: typeof rest.addressCity === "string" && rest.addressCity.trim() ? rest.addressCity.trim() : cityRaw,
    addressState: typeof rest.addressState === "string" && rest.addressState.trim() ? rest.addressState.trim() : stateRegion,
    addressZip: typeof rest.addressZip === "string" && rest.addressZip.trim() ? rest.addressZip.trim() : postalCode,
    stateRegion,
    postalCode,
    country: typeof rest.country === "string" ? rest.country.trim() : e.country,
    workModality,
    scheduleRows,
  };
}

export function emptyEmpleosQuickDraft(): EmpleosQuickDraft {
  return {
    title: "",
    businessName: "",
    categorySlug: "oficina",
    categoryCustom: "",
    experienceLevel: "mid",
    city: "",
    state: "",
    workModality: "presencial",
    jobType: "",
    schedule: "",
    scheduleRows: [{ day: "", shift: "" }],
    pay: "",
    description: "",
    benefits: [],
    screenerQuestions: [],
    images: [],
    logoUrl: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    primaryCta: "phone",
    addressLine1: "",
    addressLine2: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    stateRegion: "",
    postalCode: "",
    country: "",
    videoObjectUrl: null,
    videoFileName: "",
    videoUrl: "",
    videoUrls: [],
  };
}
