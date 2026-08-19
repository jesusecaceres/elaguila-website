import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { IglesiasNeedKey } from "./taxonomy";
import { slugifyIglesiasName } from "./slug";
import { type ChurchApplicationInput } from "./churchApplicationParse";

export type { ChurchApplicationInput } from "./churchApplicationParse";
export { parseChurchApplication } from "./churchApplicationParse";

async function uniqueSlug(admin: ReturnType<typeof getAdminSupabase>, name: string, city?: string): Promise<string> {
  const base = slugifyIglesiasName(name, city);
  for (let i = 0; i < 8; i++) {
    const slug = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin.from("churches").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${Date.now().toString(36).slice(-6)}`;
}

export async function submitChurchApplication(
  input: ChurchApplicationInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const admin = getAdminSupabase();
  const slug = await uniqueSlug(admin, input.name, input.city);

  const { data: church, error: churchError } = await admin
    .from("churches")
    .insert({
      slug,
      name: input.name,
      short_description: input.mission?.slice(0, 280) || null,
      mission: input.mission || null,
      church_type: input.churchType || null,
      denomination: input.denomination || null,
      approval_status: "pending",
      is_active: false,
      verification_status: "unverified",
      prayer_network_enrolled: false,
      city: input.city || null,
      state: input.state || null,
      country: input.country || null,
      zip: input.zip || null,
      address_line1: input.addressLine1 || null,
      address_line2: input.addressLine2 || null,
      public_location: input.publicLocation,
      languages: input.languages,
      phone: input.phone || null,
      email: input.email || null,
      website: input.website || null,
      whatsapp: input.whatsapp || null,
      livestream_url: input.livestreamUrl || null,
      socials: {
        facebook: input.facebook,
        instagram: input.instagram,
        youtube: input.youtube,
      },
      published_at: null,
    })
    .select("id")
    .single();

  if (churchError || !church?.id) return { ok: false, error: churchError?.message ?? "insert_failed" };
  const churchId = String(church.id);

  await admin.from("church_submissions").insert({
    church_id: churchId,
    applicant_name: input.applicantName || null,
    applicant_email: input.applicantEmail,
    applicant_phone: input.applicantPhone || null,
    prayer_team_intent: input.prayerTeamIntent || null,
  });

  if (input.services?.length) {
    await admin.from("church_services").insert(
      input.services.map((s, i) => ({
        church_id: churchId,
        day_of_week: s.dayOfWeek,
        starts_at: s.startsAt.length === 5 ? `${s.startsAt}:00` : s.startsAt,
        label: s.label || null,
        language: s.language,
        mode: s.mode,
        is_active: true,
        sort_order: i,
      })),
    );
  }

  if (input.ministries?.length) {
    await admin.from("church_ministries").insert(
      (input.ministries as IglesiasNeedKey[]).map((need_key, i) => ({
        church_id: churchId,
        need_key,
        is_active: true,
        sort_order: i,
      })),
    );
  }

  const media: Array<{ church_id: string; role: string; url: string; alt_text: string; sort_order: number }> = [];
  if (input.logoUrl) media.push({ church_id: churchId, role: "logo", url: input.logoUrl, alt_text: input.name, sort_order: 0 });
  if (input.heroUrl) media.push({ church_id: churchId, role: "hero", url: input.heroUrl, alt_text: input.name, sort_order: 0 });
  if (media.length) await admin.from("church_media").insert(media);

  return { ok: true, id: churchId };
}
