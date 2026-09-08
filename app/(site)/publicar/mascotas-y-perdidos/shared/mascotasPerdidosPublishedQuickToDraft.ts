import { digitsOnly, formatPhoneInputDisplay } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { detailPairsToMap } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosListingDetailPairs";

import { emptyMascotasPerdidosQuickDraft } from "./mascotasPerdidosQuickDraft";
import type { MascotasPerdidosQuickDraft, MascotasPerdidosTriState } from "./mascotasPerdidosQuickTypes";

export type MascotasPerdidosPublishedListingLike = {
  id: string;
  title: string;
  city: string;
  description: string;
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
};

function to10Display(rawDigits: string): string {
  const d = rawDigits.replace(/\D/g, "").slice(0, 10);
  return formatPhoneInputDisplay(d);
}

function listingUrlsToImages(urls: string[] | null | undefined): EmpleosImageItem[] {
  if (!urls?.length) return [];
  return urls.map((url, i) => ({ id: `lst_${i}`, url, alt: "", isMain: i === 0 }));
}

function coerceTriState(raw: string | undefined): MascotasPerdidosTriState {
  const s = (raw ?? "").trim().toLowerCase();
  return s === "si" || s === "no" || s === "no_se" ? (s as MascotasPerdidosTriState) : "";
}

/**
 * Gate 3 — hydrates BOTH legacy "simple" lane listings (single image already stored as a 1-item
 * array; combined `Leonix:phoneDigits`/`Leonix:whatsappDigits` written with the SAME value, so
 * reading each independently reproduces the old behavior conservatively — nothing is inferred)
 * and new "rich" lane listings with the full field set. Every rich-lane key is read with a safe
 * empty-string/false fallback so a legacy row (missing all of them) hydrates cleanly.
 */
export function mascotasPerdidosPublishedQuickToDraft(
  listing: MascotasPerdidosPublishedListingLike,
): MascotasPerdidosQuickDraft {
  const pairs = detailPairsToMap(listing.detailPairs);
  const d = emptyMascotasPerdidosQuickDraft();

  d.title = String(listing.title ?? "").trim();
  d.noticeType = (pairs["Leonix:noticeType"] ?? "") as MascotasPerdidosQuickDraft["noticeType"];
  d.description = stripLeonixPublishedDescriptionBody(listing.description ?? "") || (listing.description ?? "").trim();
  d.images = listingUrlsToImages(listing.images);

  d.city = String(listing.city ?? "").trim();
  d.state = (pairs["Leonix:state"] ?? "").trim();
  d.country = (pairs["Leonix:country"] ?? "").trim();
  d.zip = (pairs["Leonix:zip"] ?? "").trim();
  d.lastSeenLocation = (pairs["Leonix:lastSeenLocation"] ?? "").trim();
  d.landmark = (pairs["Leonix:landmark"] ?? "").trim();

  d.petName = (pairs["Leonix:petName"] ?? "").trim();
  d.species = (pairs["Leonix:species"] ?? "").trim();
  d.breed = (pairs["Leonix:breed"] ?? "").trim();
  d.color = (pairs["Leonix:color"] ?? "").trim();
  d.sex = coerceTriState(pairs["Leonix:sex"]);
  d.ageApprox = (pairs["Leonix:ageApprox"] ?? "").trim();
  d.size = (pairs["Leonix:size"] ?? "").trim();
  d.identifyingMarks = (pairs["Leonix:identifyingMarks"] ?? "").trim();
  d.hasCollar = (pairs["Leonix:hasCollar"] ?? "") === "1";
  d.collarNote = (pairs["Leonix:collarNote"] ?? "").trim();
  d.microchip = coerceTriState(pairs["Leonix:microchip"]);

  d.lastSeenDate = (pairs["Leonix:lastSeenDate"] ?? "").trim();
  d.offersReward = (pairs["Leonix:offersReward"] ?? "") === "1";
  d.rewardAmount = (pairs["Leonix:rewardAmount"] ?? "").trim();
  d.safetyNote = (pairs["Leonix:safetyNote"] ?? "").trim();

  d.foundDate = (pairs["Leonix:foundDate"] ?? "").trim();
  d.currentStatus = (pairs["Leonix:currentStatus"] ?? "").trim();
  d.claimInstructions = (pairs["Leonix:claimInstructions"] ?? "").trim();

  d.temperament = (pairs["Leonix:temperament"] ?? "").trim();
  d.vaccinated = coerceTriState(pairs["Leonix:vaccinated"]);
  d.spayedNeutered = coerceTriState(pairs["Leonix:spayedNeutered"]);
  d.specialNeeds = (pairs["Leonix:specialNeeds"] ?? "").trim();
  d.adoptionDetails = (pairs["Leonix:adoptionDetails"] ?? "").trim();

  d.objectType = (pairs["Leonix:objectType"] ?? "").trim();

  const pDig = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "").slice(0, 10);
  const rowPhone = digitsOnly(String(listing.contact_phone ?? "")).slice(0, 10);
  const phoneDigits = pDig.length >= 10 ? pDig : rowPhone;
  d.phone = phoneDigits.length >= 10 ? to10Display(phoneDigits) : formatPhoneInputDisplay(String(listing.contact_phone ?? ""));

  const smsDig = (pairs["Leonix:smsDigits"] ?? "").replace(/\D/g, "").slice(0, 10);
  d.smsPhone = smsDig.length >= 10 ? to10Display(smsDig) : "";

  const waDig = (pairs["Leonix:whatsappDigits"] ?? "").replace(/\D/g, "").slice(0, 10);
  d.whatsapp = waDig.length >= 10 ? to10Display(waDig) : "";

  d.email = String(listing.contact_email ?? "").trim();
  d.facebook = (pairs["Leonix:facebook"] ?? "").trim();
  d.instagram = (pairs["Leonix:instagram"] ?? "").trim();

  return d;
}
