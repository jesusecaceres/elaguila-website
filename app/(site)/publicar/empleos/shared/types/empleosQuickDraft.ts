import type { ExperienceSlug, JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";

import type { EmpleosImageItem } from "../media/empleosMediaTypes";
import { normalizePayUnit, parseLegacyPayString, syncLegacyPayField } from "../lib/empleosPayDisplay";

export type EmpleosQuickPrimaryCta = "phone" | "whatsapp" | "email";

export type EmpleosQuickPreferredApplyMethod =
  | "apply-link"
  | "email"
  | "phone"
  | "whatsapp"
  | "message";

export type EmpleosQuickScheduleRow = {
  day: string;
  /** Custom day/block label when `day === "otro"`. */
  dayCustom?: string;
  /** Legacy freeform shift text — preserved for old sessions. */
  shift: string;
  /** Structured start time (e.g. "8:00 AM"). Preferred over freeform shift. */
  startTime: string;
  /** Structured end time (e.g. "5:00 PM"). */
  endTime: string;
  /** Optional note per shift row. */
  note?: string;
};

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
  /** Custom workplace type label when workModality === "otro". */
  workModalityCustom: string;
  jobType: string;
  /** Custom job type label when `jobType === "otro"`. */
  jobTypeCustom: string;
  /** Legacy single line; combined with `scheduleRows` at publish. */
  schedule: string;
  /** Structured shifts; rendered as clean lines in preview and public output. */
  scheduleRows: EmpleosQuickScheduleRow[];
  /** Pay amount or range (e.g. "18", "18 - 25", "$18 - $25"). */
  payAmount: string;
  /** Pay unit slug — see `empleosPayDisplay`. */
  payUnit: string;
  /** Custom pay unit label when `payUnit === "otro"`. */
  payUnitCustom: string;
  /** Optional pay note (e.g. "más bonos"). */
  payNote: string;
  /** Legacy composed pay line — kept in sync for publish compatibility. */
  pay: string;
  description: string;
  /** Repeatable benefit lines → shell bullets. */
  benefits: string[];
  /** Up to 5 optional screener prompts for internal apply. */
  screenerQuestions: string[];
  images: EmpleosImageItem[];
  logoUrl: string;
  /** External application URL — creates primary Apply CTA on public detail. */
  applyLink: string;
  phone: string;
  whatsapp: string;
  /** SMS/text phone — separate from call phone. */
  smsPhone: string;
  email: string;
  website: string;
  /** Contact person or recruiter name shown on public apply card. */
  contactPerson: string;
  /** Recruiter role / title shown alongside contact name (e.g. "Hiring Manager"). */
  contactTitle: string;
  /** Preferred method for applicants to reach the employer. */
  preferredApplyMethod: EmpleosQuickPreferredApplyMethod;
  primaryCta: EmpleosQuickPrimaryCta;
  addressLine1: string;
  addressLine2: string;
  /** Workplace name / branch / work area (shown first in location section). */
  workspaceName: string;
  /** Service area or location notes for remote / multi-location jobs. */
  locationNotes: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  /** Optional company links shown in "Conoce al empleador" section. */
  companyLinkedIn: string;
  companyFacebook: string;
  companyInstagram: string;
  companyTikTok: string;
  companyYouTube: string;
  companyX: string;
  companySnapchat: string;
  companyOtherLinkLabel: string;
  companyOtherLinkUrl: string;
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
  const EXP_SLUGS: ExperienceSlug[] = ["entry", "mid", "senior", "sin-experiencia", "supervisor", "gerencia", "certificacion", "licencia"];
  const experienceLevel: ExperienceSlug = exp && EXP_SLUGS.includes(exp) ? exp : e.experienceLevel;
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
  const MODALITY_SLUGS: JobModalitySlug[] = ["presencial", "hibrido", "remoto", "campo", "varias-ubicaciones", "otro"];
  const workModality: JobModalitySlug =
    modalityRaw && MODALITY_SLUGS.includes(modalityRaw) ? modalityRaw : e.workModality;
  const workModalityCustom =
    typeof rest.workModalityCustom === "string" ? rest.workModalityCustom.trim() : e.workModalityCustom;

  let scheduleRows: EmpleosQuickScheduleRow[] = Array.isArray(rest.scheduleRows)
    ? rest.scheduleRows.map((r) => ({
        day: String((r as EmpleosQuickScheduleRow).day ?? "").trim(),
        dayCustom: String((r as EmpleosQuickScheduleRow).dayCustom ?? "").trim(),
        shift: String((r as EmpleosQuickScheduleRow).shift ?? "").trim(),
        startTime: String((r as EmpleosQuickScheduleRow).startTime ?? "").trim(),
        endTime: String((r as EmpleosQuickScheduleRow).endTime ?? "").trim(),
        note: String((r as EmpleosQuickScheduleRow).note ?? "").trim(),
      }))
    : [];
  const schedStr = typeof rest.schedule === "string" ? rest.schedule.trim() : "";
  if (!scheduleRows.some((r) => r.day || r.shift || r.startTime || r.endTime || r.note) && schedStr) {
    scheduleRows = [{ day: "", dayCustom: "", shift: schedStr, startTime: "", endTime: "", note: "" }];
  }
  if (!scheduleRows.length) scheduleRows = [{ day: "", dayCustom: "", shift: "", startTime: "", endTime: "", note: "" }];

  const legacyPay = typeof rest.pay === "string" ? rest.pay.trim() : e.pay;
  const parsedPay = parseLegacyPayString(legacyPay);
  const payAmount =
    typeof rest.payAmount === "string" && rest.payAmount.trim()
      ? rest.payAmount.trim()
      : parsedPay.payAmount || legacyPay;
  const payUnit =
    typeof rest.payUnit === "string" && rest.payUnit.trim()
      ? normalizePayUnit(rest.payUnit)
      : parsedPay.payUnit;
  const payUnitCustom =
    typeof rest.payUnitCustom === "string" && rest.payUnitCustom.trim()
      ? rest.payUnitCustom.trim()
      : parsedPay.payUnitCustom;
  const payNote =
    typeof rest.payNote === "string" && rest.payNote.trim()
      ? rest.payNote.trim()
      : parsedPay.payNote;
  const pay = syncLegacyPayField({ pay: legacyPay, payAmount, payUnit, payUnitCustom, payNote });

  const PREFERRED_METHODS: EmpleosQuickPreferredApplyMethod[] = ["apply-link", "email", "phone", "whatsapp", "message"];
  const prefRaw = rest.preferredApplyMethod as string | undefined;
  const preferredApplyMethod: EmpleosQuickPreferredApplyMethod =
    prefRaw && PREFERRED_METHODS.includes(prefRaw as EmpleosQuickPreferredApplyMethod)
      ? (prefRaw as EmpleosQuickPreferredApplyMethod)
      : e.preferredApplyMethod;

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
    workModalityCustom,
    scheduleRows,
    payAmount,
    payUnit,
    payUnitCustom,
    payNote,
    pay,
    applyLink: typeof rest.applyLink === "string" ? rest.applyLink.trim() : e.applyLink,
    smsPhone: typeof rest.smsPhone === "string" ? rest.smsPhone.trim() : e.smsPhone,
    contactPerson: typeof rest.contactPerson === "string" ? rest.contactPerson.trim() : e.contactPerson,
    contactTitle: typeof rest.contactTitle === "string" ? rest.contactTitle.trim() : e.contactTitle,
    preferredApplyMethod,
    workspaceName: typeof rest.workspaceName === "string" ? rest.workspaceName.trim() : e.workspaceName,
    locationNotes: typeof rest.locationNotes === "string" ? rest.locationNotes.trim() : e.locationNotes,
    companyLinkedIn: typeof rest.companyLinkedIn === "string" ? rest.companyLinkedIn.trim() : e.companyLinkedIn,
    companyFacebook: typeof rest.companyFacebook === "string" ? rest.companyFacebook.trim() : e.companyFacebook,
    companyInstagram: typeof rest.companyInstagram === "string" ? rest.companyInstagram.trim() : e.companyInstagram,
    companyTikTok: typeof rest.companyTikTok === "string" ? rest.companyTikTok.trim() : e.companyTikTok,
    companyYouTube: typeof rest.companyYouTube === "string" ? rest.companyYouTube.trim() : e.companyYouTube,
    companyX: typeof rest.companyX === "string" ? rest.companyX.trim() : e.companyX,
    companySnapchat: typeof rest.companySnapchat === "string" ? rest.companySnapchat.trim() : e.companySnapchat,
    companyOtherLinkLabel: typeof rest.companyOtherLinkLabel === "string" ? rest.companyOtherLinkLabel.trim() : e.companyOtherLinkLabel,
    companyOtherLinkUrl: typeof rest.companyOtherLinkUrl === "string" ? rest.companyOtherLinkUrl.trim() : e.companyOtherLinkUrl,
    jobType: typeof rest.jobType === "string" ? rest.jobType.trim() : e.jobType,
    jobTypeCustom: typeof rest.jobTypeCustom === "string" ? rest.jobTypeCustom.trim() : e.jobTypeCustom,
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
    workModalityCustom: "",
    jobType: "",
    jobTypeCustom: "",
    schedule: "",
    scheduleRows: [{ day: "", dayCustom: "", shift: "", startTime: "", endTime: "", note: "" }],
    payAmount: "",
    payUnit: "",
    payUnitCustom: "",
    payNote: "",
    pay: "",
    description: "",
    benefits: [],
    screenerQuestions: [],
    images: [],
    logoUrl: "",
    applyLink: "",
    phone: "",
    whatsapp: "",
    smsPhone: "",
    email: "",
    website: "",
    contactPerson: "",
    contactTitle: "",
    preferredApplyMethod: "phone",
    primaryCta: "phone",
    addressLine1: "",
    addressLine2: "",
    workspaceName: "",
    locationNotes: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    stateRegion: "",
    postalCode: "",
    country: "",
    companyLinkedIn: "",
    companyFacebook: "",
    companyInstagram: "",
    companyTikTok: "",
    companyYouTube: "",
    companyX: "",
    companySnapchat: "",
    companyOtherLinkLabel: "",
    companyOtherLinkUrl: "",
    videoObjectUrl: null,
    videoFileName: "",
    videoUrl: "",
    videoUrls: [],
  };
}
