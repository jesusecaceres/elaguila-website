import "server-only";

/**
 * Executive Hub — real persistence (EXEC-HUB-02 Real Database Foundation).
 *
 * Single source of truth for the `public.executives` table (see
 * `supabase/migrations/20260810120000_executive_hub_executives.sql`). Both the Admin
 * Executive Hub (`app/admin/_lib/executiveHubStore.ts`) and the public read path
 * (`app/lib/digitalContact/digitalContactRegistry.ts`) go through this module — no
 * second storage system, no duplicated row-mapping logic.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type {
  DigitalContactAddress,
  DigitalContactProfile,
  DigitalContactSocialLink,
} from "@/app/lib/digitalContact/digitalContactTypes";
import type { ExecutiveThemeId } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";
import type { ExecutiveHubRecord, ExecutiveHubStatus } from "@/app/admin/_lib/executiveHubTypes";
import type { DayHoursRow } from "@/app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

const TABLE = "executives";

const SELECT_COLUMNS =
  "slug, full_name, preferred_name, title, company, legal_entity, phone_display, phone_digits, whatsapp_digits, email, website, address_line1, address_line2, city, state, postal_code, photo_path, logo_path, cover_path, bio, languages, business_hub_link, connection_hub_link, trust_chips, socials, theme, working_hours, notes, meta_description, status, created_at, updated_at, published_at";

export type ExecutiveRow = {
  slug: string;
  full_name: string;
  preferred_name: string | null;
  title: string | null;
  company: string | null;
  legal_entity: string | null;
  phone_display: string | null;
  phone_digits: string | null;
  whatsapp_digits: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  photo_path: string | null;
  logo_path: string | null;
  cover_path: string | null;
  bio: string | null;
  languages: unknown;
  business_hub_link: string | null;
  connection_hub_link: string | null;
  trust_chips: unknown;
  socials: unknown;
  theme: string | null;
  working_hours: unknown;
  notes: string | null;
  meta_description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export function slugifyExecutive(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asSocials(v: unknown): DigitalContactSocialLink[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is { id: string; url: string } => !!x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string")
    .map((x) => ({ id: x.id as DigitalContactSocialLink["id"], url: x.url }));
}

function asWorkingHours(v: unknown): DayHoursRow[] {
  if (!Array.isArray(v) || v.length !== 7) return [];
  return v.map((row) => {
    const r = (row ?? {}) as Partial<DayHoursRow>;
    return {
      day: r.day as DayHoursRow["day"],
      closed: Boolean(r.closed),
      open: String(r.open ?? ""),
      close: String(r.close ?? ""),
    };
  });
}

export function rowToExecutiveHubRecord(row: ExecutiveRow): ExecutiveHubRecord {
  return {
    slug: row.slug,
    fullName: row.full_name,
    preferredName: row.preferred_name ?? undefined,
    title: row.title ?? "",
    company: row.company ?? "",
    legalEntity: row.legal_entity ?? "",
    phoneDisplay: row.phone_display ?? "",
    phoneDigits: row.phone_digits ?? "",
    whatsappDigits: row.whatsapp_digits ?? "",
    email: row.email ?? "",
    website: row.website ?? "",
    address: {
      line1: row.address_line1 ?? "",
      line2: row.address_line2 ?? undefined,
      city: row.city ?? "",
      state: row.state ?? "",
      postalCode: row.postal_code ?? "",
      country: "US",
    },
    photoPath: row.photo_path ?? null,
    logoPath: row.logo_path ?? null,
    coverPath: row.cover_path ?? null,
    bio: row.bio ?? "",
    languages: asStringArray(row.languages),
    businessHubLink: row.business_hub_link ?? "",
    connectionHubLink: row.connection_hub_link ?? "",
    trustChips: asStringArray(row.trust_chips),
    socials: asSocials(row.socials),
    theme: (row.theme as ExecutiveThemeId) ?? "leonix",
    workingHours: asWorkingHours(row.working_hours),
    notes: row.notes ?? "",
    metaDescription: row.meta_description ?? "",
    status: (row.status as ExecutiveHubStatus) ?? "draft",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToDigitalContactProfile(row: ExecutiveRow): DigitalContactProfile {
  const address: DigitalContactAddress = {
    line1: row.address_line1 ?? "",
    line2: row.address_line2 ?? undefined,
    city: row.city ?? "",
    state: row.state ?? "",
    postalCode: row.postal_code ?? "",
    country: "US",
  };
  return {
    slug: row.slug,
    fullName: row.full_name,
    preferredName: row.preferred_name ?? undefined,
    title: row.title ?? "",
    company: row.company ?? "",
    legalEntity: row.legal_entity ?? "",
    phoneDisplay: row.phone_display ?? "",
    phoneDigits: row.phone_digits ?? "",
    whatsappDigits: row.whatsapp_digits || undefined,
    email: row.email ?? "",
    website: row.website ?? "",
    address,
    photoPath: row.photo_path ?? null,
    coverPath: row.cover_path ?? null,
    bio: row.bio || undefined,
    trustChips: asStringArray(row.trust_chips),
    socials: asSocials(row.socials),
    theme: (row.theme as ExecutiveThemeId) ?? "leonix",
    metaDescription: row.meta_description || undefined,
    active: row.status === "published",
  };
}

function recordPatchToRow(
  patch: Partial<Omit<ExecutiveHubRecord, "slug" | "createdAt" | "updatedAt">>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.fullName !== undefined) row.full_name = patch.fullName;
  if (patch.preferredName !== undefined) row.preferred_name = patch.preferredName || null;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.company !== undefined) row.company = patch.company;
  if (patch.legalEntity !== undefined) row.legal_entity = patch.legalEntity;
  if (patch.phoneDisplay !== undefined) row.phone_display = patch.phoneDisplay;
  if (patch.phoneDigits !== undefined) row.phone_digits = patch.phoneDigits;
  if (patch.whatsappDigits !== undefined) row.whatsapp_digits = patch.whatsappDigits;
  if (patch.email !== undefined) row.email = patch.email;
  if (patch.website !== undefined) row.website = patch.website;
  if (patch.address !== undefined) {
    row.address_line1 = patch.address.line1;
    row.address_line2 = patch.address.line2 ?? null;
    row.city = patch.address.city;
    row.state = patch.address.state;
    row.postal_code = patch.address.postalCode;
  }
  if (patch.photoPath !== undefined) row.photo_path = patch.photoPath;
  if (patch.logoPath !== undefined) row.logo_path = patch.logoPath;
  if (patch.coverPath !== undefined) row.cover_path = patch.coverPath;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.languages !== undefined) row.languages = patch.languages;
  if (patch.businessHubLink !== undefined) row.business_hub_link = patch.businessHubLink;
  if (patch.connectionHubLink !== undefined) row.connection_hub_link = patch.connectionHubLink;
  if (patch.trustChips !== undefined) row.trust_chips = patch.trustChips;
  if (patch.socials !== undefined) row.socials = patch.socials;
  if (patch.theme !== undefined) row.theme = patch.theme;
  if (patch.workingHours !== undefined) row.working_hours = patch.workingHours;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.metaDescription !== undefined) row.meta_description = patch.metaDescription;
  if (patch.status !== undefined) {
    row.status = patch.status;
    if (patch.status === "published") row.published_at = new Date().toISOString();
  }
  row.updated_at = new Date().toISOString();
  return row;
}

export type ExecutiveDbResult = { ok: true; slug: string } | { ok: false; error: string };

/** Admin: every status, used by the Executive Hub list/editor. */
export async function dbListExecutiveHubRecords(): Promise<{ rows: ExecutiveHubRecord[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .order("full_name", { ascending: true });
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowToExecutiveHubRecord(r as unknown as ExecutiveRow)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

/** Admin: any status, by slug. */
export async function dbGetExecutiveHubRecord(slug: string): Promise<ExecutiveHubRecord | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq("slug", slugifyExecutive(slug))
      .maybeSingle();
    if (error || !data) return null;
    return rowToExecutiveHubRecord(data as unknown as ExecutiveRow);
  } catch {
    return null;
  }
}

export async function dbCreateExecutiveHubRecord(
  input: Omit<ExecutiveHubRecord, "createdAt" | "updatedAt">
): Promise<ExecutiveDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  const slug = slugifyExecutive(input.slug || input.fullName);
  if (!slug) return { ok: false, error: "A URL slug is required." };
  if (!input.fullName.trim()) return { ok: false, error: "Full name is required." };

  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    const row = {
      slug,
      ...recordPatchToRow(input),
      created_at: now,
      updated_at: now,
      published_at: input.status === "published" ? now : null,
    };
    const { error } = await supabase.from(TABLE).insert(row);
    if (error) {
      if (error.code === "23505") return { ok: false, error: `An executive with slug "${slug}" already exists.` };
      return { ok: false, error: error.message };
    }
    return { ok: true, slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed." };
  }
}

export async function dbUpdateExecutiveHubRecord(
  slug: string,
  patch: Partial<Omit<ExecutiveHubRecord, "slug" | "createdAt" | "updatedAt">>
): Promise<ExecutiveDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  const key = slugifyExecutive(slug);
  try {
    const supabase = getAdminSupabase();
    const row = recordPatchToRow(patch);
    const { data, error } = await supabase.from(TABLE).update(row).eq("slug", key).select("slug").maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: `Executive "${slug}" was not found.` };
    return { ok: true, slug: key };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function dbSetExecutiveHubStatus(slug: string, status: ExecutiveHubStatus): Promise<ExecutiveDbResult> {
  return dbUpdateExecutiveHubRecord(slug, { status });
}

/** Public: ONLY published rows — safe for the /contact/[slug] read path. */
export async function dbGetPublishedExecutiveProfile(slug: string): Promise<DigitalContactProfile | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq("slug", slugifyExecutive(slug))
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return rowToDigitalContactProfile(data as unknown as ExecutiveRow);
  } catch {
    return null;
  }
}

/** Public: every published slug — merged with the legacy registry for generateStaticParams. */
export async function dbListPublishedExecutiveSlugs(): Promise<string[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select("slug").eq("status", "published");
    if (error || !data) return [];
    return data.map((r) => String((r as { slug: string }).slug));
  } catch {
    return [];
  }
}
