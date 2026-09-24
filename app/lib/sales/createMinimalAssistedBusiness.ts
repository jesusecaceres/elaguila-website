/**
 * Quick Sales — minimal canonical business create for assisted custody.
 *
 * Reuses the existing staff INSERT RPC (`createCanvassedBusiness` →
 * `create_staff_canvassed_business`) and the existing `business_contacts` writer.
 * Does not open Field Canvassing, does not start a discovery session, and does not
 * write social/source/consent rows.
 */
import "server-only";

import type { StaffWriteActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { createCanvassedBusiness, searchCanvassDuplicateCandidates } from "@/app/lib/business/fieldDiscovery/repository";
import { normalizeEmail } from "@/app/lib/business/fieldDiscovery/logic";
import type { CanvassDuplicateWarning } from "@/app/lib/business/fieldDiscovery/types";
import { upsertContactValueAsStaff } from "@/app/lib/business/repositories/contactsRepo";

export type MinimalAssistedBusinessInput = {
  businessName: string;
  publicName?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  confirmCreateDespiteDuplicates?: boolean;
};

export type MinimalAssistedBusinessResult =
  | {
      ok: true;
      businessId: string;
      displayName: string;
      publicName: string;
      contactName: string | null;
      phone: string | null;
      email: string | null;
    }
  | { ok: false; error: "invalid_input"; field: "businessName" | "email" }
  | { ok: false; error: "duplicate_business_warning"; duplicateWarning: CanvassDuplicateWarning }
  | { ok: false; error: "create_failed"; detail: string };

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function createMinimalAssistedBusiness(
  input: MinimalAssistedBusinessInput,
  actor: StaffWriteActor,
): Promise<MinimalAssistedBusinessResult> {
  const displayName = trimmed(input.businessName);
  if (!displayName) return { ok: false, error: "invalid_input", field: "businessName" };

  const publicName = trimmed(input.publicName) || displayName;
  const contactName = trimmed(input.contactName) || null;
  const phone = trimmed(input.phone) || null;
  const emailRaw = trimmed(input.email) || null;
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) return { ok: false, error: "invalid_input", field: "email" };

  const duplicateWarning = await searchCanvassDuplicateCandidates({
    actorAuthUserId: actor.authUserId,
    businessName: displayName,
    phone,
    email,
    website: null,
  });
  if (duplicateWarning.level !== "none" && !input.confirmCreateDespiteDuplicates) {
    return { ok: false, error: "duplicate_business_warning", duplicateWarning };
  }

  const created = await createCanvassedBusiness(
    { displayName, primaryLanguage: "es" },
    actor,
  );
  if (!created.ok) return { ok: false, error: "create_failed", detail: created.error };

  const admin = getAdminSupabase();
  if (publicName !== displayName) {
    await admin.from("businesses").update({ public_name: publicName }).eq("id", created.businessId);
  } else {
    await admin.from("businesses").update({ public_name: displayName }).eq("id", created.businessId);
  }

  if (phone) {
    await upsertContactValueAsStaff(admin, created.businessId, "phone", null, phone);
  }
  if (email) {
    await upsertContactValueAsStaff(admin, created.businessId, "email", null, email);
  }

  return {
    ok: true,
    businessId: created.businessId,
    displayName,
    publicName,
    contactName,
    phone,
    email,
  };
}
