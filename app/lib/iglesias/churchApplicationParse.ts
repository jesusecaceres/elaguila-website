import { isIglesiasNeedKey, isIglesiasServiceLanguage, isIglesiasServiceMode, type IglesiasNeedKey } from "./taxonomy";

export type ChurchApplicationInput = {
  name: string;
  denomination?: string;
  churchType?: string;
  mission?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  addressLine1?: string;
  addressLine2?: string;
  publicLocation: boolean;
  languages: string[];
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  livestreamUrl?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  logoUrl?: string;
  heroUrl?: string;
  applicantName?: string;
  applicantEmail: string;
  applicantPhone?: string;
  services?: Array<{
    dayOfWeek: number;
    startsAt: string;
    language: string;
    mode: string;
    label?: string;
  }>;
  ministries?: string[];
  prayerTeamIntent?: "YES" | "NO" | "INTERESTED";
};

function clean(v: unknown, max = 240): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function httpsUrl(v: string): string | null {
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return null;
    return u.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export function parseChurchApplication(body: unknown): { ok: true; data: ChurchApplicationInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid" };
  const o = body as Record<string, unknown>;
  if (clean(o.website_extra) || clean(o.company)) return { ok: false, error: "invalid" };

  const name = clean(o.name, 160);
  const applicantEmail = clean(o.applicantEmail, 200).toLowerCase();
  if (name.length < 2) return { ok: false, error: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) return { ok: false, error: "email" };

  const languagesRaw = Array.isArray(o.languages) ? o.languages : [];
  const languages = languagesRaw.map((x) => String(x)).filter(isIglesiasServiceLanguage);
  const ministriesRaw = Array.isArray(o.ministries) ? o.ministries : [];
  const ministries = ministriesRaw.map((x) => String(x).toUpperCase()).filter(isIglesiasNeedKey);

  const intentRaw = clean(o.prayerTeamIntent, 16).toUpperCase();
  const prayerTeamIntent =
    intentRaw === "YES" || intentRaw === "NO" || intentRaw === "INTERESTED" ? intentRaw : undefined;

  const servicesRaw = Array.isArray(o.services) ? o.services.slice(0, 12) : [];
  const services: ChurchApplicationInput["services"] = [];
  for (const s of servicesRaw) {
    if (!s || typeof s !== "object") continue;
    const row = s as Record<string, unknown>;
    const dayOfWeek = Number(row.dayOfWeek);
    const startsAt = clean(row.startsAt, 12);
    const language = clean(row.language, 16);
    const mode = clean(row.mode, 16);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) continue;
    if (!/^\d{1,2}:\d{2}/.test(startsAt)) continue;
    if (!isIglesiasServiceLanguage(language) || !isIglesiasServiceMode(mode)) continue;
    services.push({
      dayOfWeek,
      startsAt,
      language,
      mode,
      label: clean(row.label, 80) || undefined,
    });
  }

  return {
    ok: true,
    data: {
      name,
      denomination: clean(o.denomination, 120) || undefined,
      churchType: clean(o.churchType, 80) || undefined,
      mission: clean(o.mission, 4000) || undefined,
      city: clean(o.city, 80) || undefined,
      state: clean(o.state, 40) || undefined,
      country: clean(o.country, 80) || undefined,
      zip: clean(o.zip, 12) || undefined,
      addressLine1: clean(o.addressLine1, 160) || undefined,
      addressLine2: clean(o.addressLine2, 160) || undefined,
      publicLocation: o.publicLocation === true,
      languages,
      phone: clean(o.phone, 40) || undefined,
      email: clean(o.email, 200) || undefined,
      website: httpsUrl(clean(o.website, 400)) || undefined,
      whatsapp: clean(o.whatsapp, 40) || undefined,
      livestreamUrl: httpsUrl(clean(o.livestreamUrl, 400)) || undefined,
      facebook: httpsUrl(clean(o.facebook, 400)) || undefined,
      instagram: httpsUrl(clean(o.instagram, 400)) || undefined,
      youtube: httpsUrl(clean(o.youtube, 400)) || undefined,
      logoUrl: httpsUrl(clean(o.logoUrl, 500)) || undefined,
      heroUrl: httpsUrl(clean(o.heroUrl, 500)) || undefined,
      applicantName: clean(o.applicantName, 120) || undefined,
      applicantEmail,
      applicantPhone: clean(o.applicantPhone, 40) || undefined,
      services,
      ministries: ministries as IglesiasNeedKey[],
      prayerTeamIntent,
    },
  };
}
