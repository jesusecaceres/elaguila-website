import { PACKAGE_ENTITLEMENT_CATEGORIES, PACKAGE_ENTITLEMENT_CONTRACT_TERMS, PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES, PACKAGE_ENTITLEMENT_TIERS } from "./packageEntitlementConstants";

export const PROMO_CODE_TRACKER_FETCH_LIMIT = 150;

export const PROMO_CODE_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
  { value: "redeemed", label: "Redeemed" },
] as const;

export const PROMO_CODE_TYPES = PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES;

export const PROMO_CODE_CATEGORIES = PACKAGE_ENTITLEMENT_CATEGORIES;

export const PROMO_CODE_PACKAGE_TIERS = PACKAGE_ENTITLEMENT_TIERS;

export const PROMO_CODE_CONTRACT_TERMS = PACKAGE_ENTITLEMENT_CONTRACT_TERMS;
