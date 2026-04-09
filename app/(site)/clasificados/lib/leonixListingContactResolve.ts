import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";

type Args = {
  sellerType?: string;
  seller_type?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  business_meta?: string | null;
};

/**
 * Single precedence for public CTAs on Leonix BR + Rentas live detail:
 * business `negocioEmail` / `negocioTelOficina` override row columns when present (agent-first contract).
 */
export function resolveLeonixLiveListingContact(listing: Args): {
  phoneForTel: string | null;
  emailForMailto: string | null;
  website: string | null;
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
  const website = site || null;

  return { phoneForTel, emailForMailto, website };
}
