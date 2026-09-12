"use server";

/**
 * Executive Hub — STAFF SELF-SERVICE action (Master Operating Book V2 §0G).
 *
 * This is the whole security boundary for staff self-editing their own public contact profile.
 * Read this file's own identity_rule before touching it:
 *
 *   1. The acting identity is resolved SERVER-SIDE from the authenticated session cookie via
 *      `resolveActingRosterIdentity()` (the same, already-proven function
 *      `adminRosterAudit.ts`'s `writeRosterAuditLog()` uses) — never from a slug, id, or email
 *      the client supplies in the request body.
 *   2. `resolveActingRosterIdentity()` reads ONLY `LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE` /
 *      `LEONIX_ADMIN_AUTH_USER_ID_COOKIE`, which are set exclusively by the real Staff/Team
 *      email+password login (`/admin/login/auth/route.ts`, `bootstrap: false`) — the bootstrap
 *      shared-password login (`/admin/login/submit/route.ts`) never sets either cookie. A pure
 *      bootstrap session therefore cannot resolve an identity here and this action correctly
 *      falls through to the "not resolvable" error path — bootstrap is never broadened into a
 *      fake staff identity.
 *   3. The identity's own `is_active` flag is checked inside `resolveActingRosterIdentity()`
 *      itself — an inactive/deactivated roster row resolves to `null`, so this action cannot be
 *      reached by a deactivated staff member even if their old session cookie is still present.
 *   4. The target executive row is looked up by `linked_roster_id = <resolved rosterId>` — a
 *      real foreign key set only by an owner_admin (never by the staff member). There is no path
 *      by which a caller can select a different row: no slug, id, or "which profile" parameter is
 *      ever read from the request.
 *   5. Only an explicit allow-list of field names is ever read from the submitted FormData
 *      (see ALLOWED_SELF_SERVICE_FIELDS below). Every governance/identity field — status, slug,
 *      company, legalEntity, address, website, businessHubLink, connectionHubLink,
 *      workingHoursJson, notes, metaDescription, trustChips, languages, linkedRosterId itself —
 *      is never read here, regardless of whether a crafted request includes it. Hiding these
 *      fields in the UI (ExecutiveHubForm's "self" mode) is a courtesy; this allow-list is the
 *      actual boundary.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveActingRosterIdentity } from "@/app/admin/_lib/adminRosterAudit";
import { getExecutiveHubRecordByRosterId, updateExecutiveHubRecord } from "@/app/admin/_lib/executiveHubStore";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import type { DigitalContactSocialLink } from "@/app/lib/digitalContact/digitalContactTypes";
import { EXECUTIVE_THEME_OPTIONS, type ExecutiveThemeId } from "@/app/lib/digitalContact/digitalContactExecutiveTheme";

const THEME_IDS = new Set<string>(EXECUTIVE_THEME_OPTIONS.map((opt) => opt.id));

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function parseTheme(raw: string): ExecutiveThemeId {
  return (THEME_IDS.has(raw) ? raw : "leonix") as ExecutiveThemeId;
}

function normalizeDialDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 10 ? `1${digits}` : digits;
}

function buildSocials(f: FormData): DigitalContactSocialLink[] {
  const map: { id: DigitalContactSocialLink["id"]; field: string }[] = [
    { id: "facebook", field: "socialFacebook" },
    { id: "instagram", field: "socialInstagram" },
    { id: "linkedin", field: "socialLinkedin" },
    { id: "x", field: "socialX" },
    { id: "tiktok", field: "socialTiktok" },
    { id: "youtube", field: "socialYoutube" },
  ];
  const out: DigitalContactSocialLink[] = [];
  for (const { id, field } of map) {
    const url = str(f, field);
    if (url) out.push({ id, url });
  }
  return out;
}

/**
 * The ONLY fields this action ever reads from FormData. Everything else the client might submit
 * (status, slug, company, legalEntity, address*, website, businessHubLink, connectionHubLink,
 * workingHoursJson, notes, metaDescription, trustChips, languages, linkedRosterId) is silently
 * ignored — never parsed, never forwarded to the store's patch object.
 */
function readSelfServiceFields(formData: FormData) {
  return {
    preferredName: str(formData, "preferredName"),
    title: str(formData, "title"),
    bio: str(formData, "bio"),
    phoneDisplay: str(formData, "phoneDisplay"),
    phoneDigits: normalizeDialDigits(str(formData, "phoneDigits")),
    whatsappDigits: normalizeDialDigits(str(formData, "whatsappDigits")),
    email: str(formData, "email"),
    photoPath: str(formData, "photoPath") || null,
    socials: buildSocials(formData),
    theme: parseTheme(str(formData, "theme")),
  };
}

export async function updateOwnExecutiveHubProfileAction(formData: FormData): Promise<void> {
  const actor = await resolveActingRosterIdentity();
  if (!actor) {
    // Covers: not logged in via real Staff/Team auth, bootstrap-only session, inactive roster
    // row, or roster row not found — every one of these is "cannot resolve who you are," which
    // must never fall back to guessing from the request body.
    redirect("/admin/team/my-profile?error=identity_not_resolvable");
  }

  const profile = await getExecutiveHubRecordByRosterId(actor.rosterId);
  if (!profile) {
    // Either no profile is linked to this staff member yet (ask an owner to link one in
    // Executive Hub), or the linked_roster_id migration isn't applied remotely yet. Both cases
    // get the same honest message — this action never creates a profile itself (self-creation is
    // out of scope for this gate; see ADMIN_OS_PROGRESS.md).
    redirect("/admin/team/my-profile?error=no_linked_profile");
  }

  const patch = readSelfServiceFields(formData);
  const result = await updateExecutiveHubRecord(profile.slug, patch);
  if (!result.ok) {
    redirect(`/admin/team/my-profile?error=${encodeURIComponent(result.error)}`);
  }

  // Best-effort real actor attribution — appendAdminAuditLog() degrades gracefully (see
  // 20260909140000_admin_audit_log_actor_attribution.sql) and never fabricates identity; it
  // already has the real resolved actor from the session, not from anything the client sent.
  await appendAdminAuditLog({
    action: "executive_hub_self_profile_updated",
    targetType: "executives",
    targetId: profile.slug,
    meta: { actor_email: actor.email, actor_roster_id: actor.rosterId },
  });

  revalidatePath("/admin/team/my-profile");
  revalidatePath(`/contact/${profile.slug}`);
  redirect("/admin/team/my-profile?saved=1");
}
