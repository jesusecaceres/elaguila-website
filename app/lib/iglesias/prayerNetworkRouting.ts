export const MAX_PRAYER_TEAM_RECIPIENTS = 3;
export const MAX_PRAYER_DELIVERY_ATTEMPTS = 3;

export type PrayerNetworkTeamStatus = "ACTIVE" | "PAUSED" | "DISABLED";

export type PrayerRoutingRequest = {
  visibility: string;
  moderation_status: string;
  language: string;
  category: string | null;
  city: string | null;
  target_church_id: string | null;
};

export type PrayerTeamCandidate = {
  teamId: string;
  churchId: string;
  churchName: string;
  enabled: boolean;
  status: PrayerNetworkTeamStatus;
  acceptsPrivate: boolean;
  churchApproved: boolean;
  churchActive: boolean;
  supportedLanguages: string[];
  supportedCategories: string[];
  geographicScope: string | null;
  churchCity: string | null;
  churchState: string | null;
  deliveryCount: number;
  lastDeliveredAt: string | null;
};

export function isPrayerNetworkRoutable(prayer: Pick<PrayerRoutingRequest, "visibility" | "moderation_status">): boolean {
  return prayer.visibility === "PRIVATE_PRAYER_TEAM" && prayer.moderation_status === "CLEARLY_SAFE";
}

export function isPublicPrayerNetworkParticipant(args: {
  churchApproved: boolean;
  churchActive: boolean;
  published: boolean;
  teamEnabled: boolean;
  teamStatus: string;
  acceptsPrivate: boolean;
}): boolean {
  return (
    args.churchApproved &&
    args.churchActive &&
    args.published &&
    args.teamEnabled &&
    args.teamStatus === "ACTIVE" &&
    args.acceptsPrivate
  );
}

function fold(v: string | null | undefined): string {
  return (v ?? "").normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
}

function languageCompatible(supported: string[], requestLanguage: string): boolean {
  if (!supported.length) return true;
  if (supported.includes(requestLanguage)) return true;
  if (supported.includes("bilingual") && (requestLanguage === "es" || requestLanguage === "en")) return true;
  return false;
}

function categoryCompatible(supported: string[], category: string | null): boolean {
  if (!supported.length) return true;
  if (!category) return true;
  return supported.includes(category);
}

function geoCompatible(team: PrayerTeamCandidate, city: string | null): boolean {
  const needle = fold(city);
  if (!needle) return true;
  const scope = fold(team.geographicScope);
  if (!scope) return true;
  return fold(team.churchCity).includes(needle) || fold(team.churchState).includes(needle) || scope.includes(needle) || needle.includes(scope);
}

export function isPrayerTeamEligible(team: PrayerTeamCandidate, prayer: PrayerRoutingRequest): boolean {
  if (!isPrayerNetworkRoutable(prayer)) return false;
  if (!team.churchApproved || !team.churchActive) return false;
  if (!team.enabled || team.status !== "ACTIVE") return false;
  if (!team.acceptsPrivate) return false;
  if (!languageCompatible(team.supportedLanguages, prayer.language)) return false;
  if (!categoryCompatible(team.supportedCategories, prayer.category)) return false;
  if (!geoCompatible(team, prayer.city)) return false;
  return true;
}

function scoreTeam(team: PrayerTeamCandidate, prayer: PrayerRoutingRequest): number[] {
  const langScore = languageCompatible(team.supportedLanguages, prayer.language) ? 1 : 0;
  const catScore = categoryCompatible(team.supportedCategories, prayer.category) ? 1 : 0;
  const needle = fold(prayer.city);
  const geoScore =
    needle && (fold(team.churchCity).includes(needle) || fold(team.geographicScope).includes(needle)) ? 1 : 0;
  const last = team.lastDeliveredAt ? Date.parse(team.lastDeliveredAt) : 0;
  return [langScore, catScore, geoScore, -team.deliveryCount, -last];
}

function compareTeams(a: PrayerTeamCandidate, b: PrayerTeamCandidate, prayer: PrayerRoutingRequest): number {
  const sa = scoreTeam(a, prayer);
  const sb = scoreTeam(b, prayer);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return sb[i] - sa[i];
  }
  return a.teamId.localeCompare(b.teamId);
}

export type PrayerTeamSelection = {
  selected: PrayerTeamCandidate[];
  reason: "ROUTED" | "NOT_ROUTABLE" | "NONE_ELIGIBLE" | "TARGET_INELIGIBLE" | "TARGET_ROUTED";
};

export function selectPrayerNetworkTeams(
  prayer: PrayerRoutingRequest,
  teams: PrayerTeamCandidate[],
  paidPlacementIgnored?: unknown,
): PrayerTeamSelection {
  void paidPlacementIgnored;
  if (!isPrayerNetworkRoutable(prayer)) {
    return { selected: [], reason: "NOT_ROUTABLE" };
  }

  if (prayer.target_church_id) {
    const target = teams.find((t) => t.churchId === prayer.target_church_id);
    if (!target || !isPrayerTeamEligible(target, prayer)) {
      return { selected: [], reason: "TARGET_INELIGIBLE" };
    }
    return { selected: [target], reason: "TARGET_ROUTED" };
  }

  const eligible = teams.filter((t) => isPrayerTeamEligible(t, prayer)).sort((a, b) => compareTeams(a, b, prayer));
  const selected = eligible.slice(0, MAX_PRAYER_TEAM_RECIPIENTS);
  return { selected, reason: selected.length ? "ROUTED" : "NONE_ELIGIBLE" };
}

export function canRetryPrayerDelivery(attemptCount: number): boolean {
  return attemptCount < MAX_PRAYER_DELIVERY_ATTEMPTS;
}

export type PrayerDeliveryPayload = {
  body: string;
  category: string | null;
  language: string;
  displayName: string | null;
  city: string | null;
  contact: { method: string; value: string } | null;
};

export function mapPrayerTeamDeliveryPayload(row: {
  body: string;
  category: string | null;
  language: string;
  display_name: string | null;
  city: string | null;
  contact_consent: boolean;
  preferred_contact_method: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  submitter_user_id?: string | null;
  anonymous_session_hash?: string | null;
  ip_hash?: string | null;
  ai_decision?: string | null;
}): PrayerDeliveryPayload {
  let contact: PrayerDeliveryPayload["contact"] = null;
  if (row.contact_consent) {
    if (row.preferred_contact_method === "email" && row.contact_email) {
      contact = { method: "email", value: row.contact_email };
    } else if (row.preferred_contact_method === "phone" && row.contact_phone) {
      contact = { method: "phone", value: row.contact_phone };
    } else if (row.preferred_contact_method === "whatsapp" && row.contact_whatsapp) {
      contact = { method: "whatsapp", value: row.contact_whatsapp };
    }
  }
  return {
    body: row.body,
    category: row.category,
    language: row.language,
    displayName: row.contact_consent ? row.display_name : null,
    city: row.contact_consent ? row.city : null,
    contact,
  };
}

export function prayerDeliveryPayloadHasForbiddenKeys(payload: unknown): string[] {
  const forbidden = [
    "submitter_user_id",
    "anonymous_session_hash",
    "ip_hash",
    "ip",
    "ai_decision",
    "ai_reason_codes",
    "moderation_status",
    "other_teams",
    "recipients",
  ];
  const found: string[] = [];
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (forbidden.includes(k)) found.push(k);
      walk(v);
    }
  };
  walk(payload);
  return found;
}

export function prayerNetworkEmailSubject(lang: "es" | "en"): string {
  return lang === "en" ? "New private prayer request — Leonix" : "Nueva petición privada de oración — Leonix";
}
