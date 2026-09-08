import type { IglesiasNeedKey, IglesiasServiceLanguage, IglesiasServiceMode } from "./taxonomy";

export type IglesiasApprovalStatus = "pending" | "approved" | "rejected";
export type IglesiasVerificationStatus = "unverified" | "verified";
export type IglesiasMediaRole = "logo" | "hero" | "gallery";

export type ChurchSocials = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
};

export type ChurchRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  mission: string | null;
  church_type: string | null;
  denomination: string | null;
  approval_status: IglesiasApprovalStatus;
  is_active: boolean;
  verification_status: IglesiasVerificationStatus;
  prayer_network_enrolled: boolean;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  address_line1: string | null;
  address_line2: string | null;
  public_location: boolean;
  latitude: number | null;
  longitude: number | null;
  languages: IglesiasServiceLanguage[];
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsapp: string | null;
  livestream_url: string | null;
  socials: ChurchSocials;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ChurchServiceRow = {
  id: string;
  church_id: string;
  day_of_week: number;
  starts_at: string;
  label: string | null;
  language: IglesiasServiceLanguage;
  mode: IglesiasServiceMode;
  is_active: boolean;
  sort_order: number;
};

export type ChurchMinistryRow = {
  id: string;
  church_id: string;
  need_key: IglesiasNeedKey;
  display_note: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ChurchMediaRow = {
  id: string;
  church_id: string;
  role: IglesiasMediaRole;
  url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
};

export type PublicChurchCard = {
  id: string;
  slug: string;
  name: string;
  denomination: string | null;
  churchType: string | null;
  city: string | null;
  state: string | null;
  languages: IglesiasServiceLanguage[];
  phone: string | null;
  publicLocation: boolean;
  addressLine1: string | null;
  logoUrl: string | null;
  heroUrl: string | null;
  imageAlt: string;
  needKeys: IglesiasNeedKey[];
  nextServiceSummary: string | null;
};

export type PublicChurchProfile = PublicChurchCard & {
  shortDescription: string | null;
  mission: string | null;
  zip: string | null;
  addressLine2: string | null;
  website: string | null;
  email: string | null;
  whatsapp: string | null;
  livestreamUrl: string | null;
  socials: ChurchSocials;
  services: ChurchServiceRow[];
  ministries: ChurchMinistryRow[];
  gallery: ChurchMediaRow[];
  prayerNetworkParticipant: boolean;
};

export type IglesiasBrowseState = {
  q: string;
  city: string;
  zip: string;
  need: IglesiasNeedKey | null;
  /** Church service language filter. Distinct from UI `?lang=`. */
  language: IglesiasServiceLanguage | null;
  /** Parsed for URL stability; BUILD 01 does not filter or badge on this. */
  prayerNetwork: boolean | null;
};
