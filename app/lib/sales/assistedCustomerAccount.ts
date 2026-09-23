import "server-only";

import { provisionCustomerAuthUser } from "@/app/admin/_lib/adminUserProvisioning";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type AssistedCustomerAccountResult =
  | {
      ok: true;
      userId: string;
      inviteSent: boolean;
      inviteNote: string | null;
      membershipId: string;
    }
  | {
      ok: false;
      error:
        | "config"
        | "invalid_email"
        | "auth_error"
        | "profile_error"
        | "business_already_owned"
        | "membership_error";
      detail?: string;
    };

function normalizedEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Staff-assisted customer activation.
 *
 * Creates or safely reuses the customer's Supabase Auth identity, sends the customer a
 * password-setup/recovery email, and links that identity to the already-created canonical
 * business. Staff never sees or chooses the customer's permanent password.
 *
 * This is server-only and is called only after the staff write gate succeeds.
 */
export async function provisionAssistedCustomerAccount(input: {
  businessId: string;
  email: string;
  displayName?: string | null;
  phone?: string | null;
  invitedByAuthUserId: string;
}): Promise<AssistedCustomerAccountResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "config" };

  const email = normalizedEmail(input.email);
  if (!email || !email.includes("@")) return { ok: false, error: "invalid_email" };

  const provisioned = await provisionCustomerAuthUser({
    email,
    displayName: input.displayName,
    phone: input.phone,
    accountType: "business",
    sendInvite: true,
    reuseExisting: true,
  });

  if (!provisioned.ok) {
    return {
      ok: false,
      error: provisioned.code === "profile_error" ? "profile_error" : provisioned.code === "config" ? "config" : "auth_error",
      detail: provisioned.message,
    };
  }

  const admin = getAdminSupabase();

  const { data: otherPrimary, error: primaryErr } = await admin
    .from("business_memberships")
    .select("id, user_id")
    .eq("business_id", input.businessId)
    .eq("is_primary_owner", true)
    .eq("membership_status", "active")
    .neq("user_id", provisioned.userId)
    .limit(1)
    .maybeSingle();

  if (primaryErr) {
    return { ok: false, error: "membership_error", detail: primaryErr.message };
  }
  if (otherPrimary?.id) {
    return { ok: false, error: "business_already_owned" };
  }

  const now = new Date().toISOString();
  const { data: existing, error: existingErr } = await admin
    .from("business_memberships")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("user_id", provisioned.userId)
    .maybeSingle();

  if (existingErr) {
    return { ok: false, error: "membership_error", detail: existingErr.message };
  }

  let membershipId = String(existing?.id ?? "");
  if (membershipId) {
    const { error: updateErr } = await admin
      .from("business_memberships")
      .update({
        membership_role: "owner",
        membership_status: "active",
        is_primary_owner: true,
        invited_by_user_id: input.invitedByAuthUserId,
        revoked_at: null,
        authorization_role: "owner",
        representative_contact_email: email,
        manual_review_flag: false,
        updated_at: now,
      })
      .eq("id", membershipId);
    if (updateErr) return { ok: false, error: "membership_error", detail: updateErr.message };
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from("business_memberships")
      .insert({
        business_id: input.businessId,
        user_id: provisioned.userId,
        membership_role: "owner",
        membership_status: "active",
        is_primary_owner: true,
        invited_by_user_id: input.invitedByAuthUserId,
        accepted_at: null,
        authorization_role: "owner",
        representative_contact_email: email,
        manual_review_flag: false,
      })
      .select("id")
      .single();
    if (insertErr || !inserted?.id) {
      return { ok: false, error: "membership_error", detail: insertErr?.message ?? "membership_insert_failed" };
    }
    membershipId = String(inserted.id);
  }

  return {
    ok: true,
    userId: provisioned.userId,
    inviteSent: provisioned.inviteSent,
    inviteNote: provisioned.inviteNote,
    membershipId,
  };
}
