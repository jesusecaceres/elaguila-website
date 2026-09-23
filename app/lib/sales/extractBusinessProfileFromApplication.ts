/**
 * Application → canonical business profile. Reuses existing businesses + contacts writers.
 * Does not invent a second identity table. Missing fields are skipped.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { updateBusinessCoreFieldsAsStaff } from "@/app/lib/business/repositories/businessesRepo";
import { upsertContactValueAsStaff } from "@/app/lib/business/repositories/contactsRepo";

export type ApplicationBusinessFields = {
  businessName?: string | null;
  publicName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
};

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function syncCanonicalBusinessFromApplication(
  businessId: string,
  fields: ApplicationBusinessFields,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = trimmed(businessId);
  if (!id) return { ok: false, error: "business_id_required" };

  const displayName = trimmed(fields.businessName);
  const publicName = trimmed(fields.publicName) || displayName || null;
  const admin = getAdminSupabase();

  if (displayName) {
    const updated = await updateBusinessCoreFieldsAsStaff(admin, id, {
      displayName,
      publicName,
    });
    if (!updated.ok) return updated;
  } else if (publicName) {
    const updated = await updateBusinessCoreFieldsAsStaff(admin, id, { publicName });
    if (!updated.ok) return updated;
  }

  const phone = trimmed(fields.phone);
  if (phone) await upsertContactValueAsStaff(admin, id, "phone", null, phone);
  const email = trimmed(fields.email);
  if (email) await upsertContactValueAsStaff(admin, id, "email", null, email);
  const website = trimmed(fields.website);
  if (website) await upsertContactValueAsStaff(admin, id, "website", null, website);
  const whatsapp = trimmed(fields.whatsapp);
  if (whatsapp) await upsertContactValueAsStaff(admin, id, "phone", "whatsapp", whatsapp);

  return { ok: true };
}
