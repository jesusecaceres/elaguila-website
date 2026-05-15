import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";
import {
  enrichContactChannelsFromBusinessMeta,
  parseLeonixContactChannelsV1FromDetailPairs,
  socialLinksFromChannelsPayload,
  type LeonixContactChannelsV1Payload,
  type LeonixPublicSocialLink,
} from "@/app/clasificados/lib/leonixContactChannelsV1";
type Args = {
  sellerType?: string;
  seller_type?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  business_meta?: string | null;
  detail_pairs?: unknown;
};

/**
 * Single precedence for public CTAs on Leonix BR + Rentas live detail:
 * business `negocioEmail` / `negocioTelOficina` override row columns when present (agent-first contract).
 */
export function resolveLeonixLiveListingContact(listing: Args): {
  phoneForTel: string | null;
  emailForMailto: string | null;
  website: string | null;
  contactChannels: LeonixContactChannelsV1Payload | null;
  socialLinks: LeonixPublicSocialLink[];
} {
  const meta = parseBusinessMeta(listing.business_meta);
  const isBiz = listing.sellerType === "business" || listing.seller_type === "business";
  const rowPhone = String(listing.contact_phone ?? "").trim();
  const rowEmail = String(listing.contact_email ?? "").trim();
  const office = meta?.negocioTelOficina?.trim() ?? "";
  const agentEmail = meta?.negocioEmail?.trim() ?? "";

  const phoneForTel = (isBiz ? office || rowPhone : rowPhone) || null;
  const emailForMailto = (isBiz ? agentEmail || rowEmail : rowEmail) || null;
  const site = meta?.negocioSitioWeb?.trim() ?? "";
  const ch = enrichContactChannelsFromBusinessMeta(parseLeonixContactChannelsV1FromDetailPairs(listing.detail_pairs), meta);
  const siteFromChannels = ch?.website?.trim() ?? "";
  const website = (siteFromChannels || site || null) as string | null;
  const socialLinks = socialLinksFromChannelsPayload(ch);

  return { phoneForTel, emailForMailto, website, contactChannels: ch, socialLinks };
}
