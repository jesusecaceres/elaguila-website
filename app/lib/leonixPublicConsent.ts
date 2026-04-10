export const LEONIX_CONSENT_STORAGE_KEY = "leonix_consent_v1";

export type LeonixConsentV1 = {
  version: 1;
  /** Session / security / language / route continuity — always true once decided. */
  necessary: true;
  analytics: boolean;
  personalization: boolean;
  updatedAt: string;
};

function safeParse(raw: string | null): LeonixConsentV1 | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<LeonixConsentV1>;
    if (j?.version !== 1 || !j.updatedAt) return null;
    return {
      version: 1,
      necessary: true,
      analytics: Boolean(j.analytics),
      personalization: Boolean(j.personalization),
      updatedAt: j.updatedAt,
    };
  } catch {
    return null;
  }
}

/** Full consent record, or null if the user has not chosen yet. */
export function readLeonixConsent(): LeonixConsentV1 | null {
  if (typeof window === "undefined") return null;
  try {
    return safeParse(window.localStorage.getItem(LEONIX_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** True when non-essential analytics may run (listing events, product measurement). */
export function leonixAnalyticsAllowed(): boolean {
  return readLeonixConsent()?.analytics === true;
}

/** True when first-party preference memory / tuning may run. */
export function leonixPersonalizationAllowed(): boolean {
  return readLeonixConsent()?.personalization === true;
}

export function persistLeonixConsent(patch: Pick<LeonixConsentV1, "analytics" | "personalization">): void {
  if (typeof window === "undefined") return;
  const rec: LeonixConsentV1 = {
    version: 1,
    necessary: true,
    analytics: patch.analytics,
    personalization: patch.personalization,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(LEONIX_CONSENT_STORAGE_KEY, JSON.stringify(rec));
    window.localStorage.setItem("leonix_consent_analytics", rec.analytics ? "1" : "0");
    window.localStorage.setItem("leonix_consent_personalization", rec.personalization ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}
