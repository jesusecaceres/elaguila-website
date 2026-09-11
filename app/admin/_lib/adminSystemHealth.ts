/**
 * ADMIN-OS-01 GATE E — minimum Admin-native System Health surface.
 *
 * The only System Health signal that existed before this was inside the
 * owner-only LEO console (`buildLeoSystemHealthSnapshot`), and even there it
 * was config-presence only (env var set / not set), never a live probe. Any
 * delegated Admin with no LEO access had zero dependency-health signal at all
 * — a direct violation of the Master Operating Book's "must not make the
 * owner discover [a problem] through random buttons" for anyone but the
 * owner. See docs/admin-os/ADMIN_OS_CABLE_MAP.md, SYSTEM domain.
 *
 * Deliberately narrow: only the categories the gate names (Supabase/data-source
 * availability, known required tables, audit pipeline, safely-detectable
 * config readiness). Does not reuse `buildLeoSystemHealthSnapshot` directly —
 * that function's fixed component list (Gmail, Calendar, push alerts) is
 * LEO's own tool integrations, not general Admin operational dependencies;
 * showing them here would be scope creep and confusing, not honest. Reuses
 * the same state vocabulary/shape (`LeoSystemHealthState`/Component/Snapshot)
 * so both surfaces render consistently.
 *
 * Never exposes secret values — only whether a config var is set.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { isRevenueStripeConfigured } from "@/app/lib/listingPlans/revenueStripe";
import { resolveLeonixResendConfig } from "@/app/lib/email/leonixResendConfig";
import { isTwilioVerifyConfigured } from "@/app/lib/sms/twilioVerifyProvider";
import type {
  LeoSystemHealthComponent,
  LeoSystemHealthSnapshot,
  LeoSystemHealthState,
} from "@/app/leo/_lib/leoTypes";

async function probeTableReachable(
  supabase: ReturnType<typeof getAdminSupabase>,
  table: string,
): Promise<LeoSystemHealthState> {
  try {
    const { error } = await supabase.from(table).select("id", { count: "exact", head: true }).limit(1);
    return error ? "UNAVAILABLE" : "HEALTHY";
  } catch {
    return "UNAVAILABLE";
  }
}

/**
 * Master Operating Book §22 — "do not reduce provider health to config-presence if stronger
 * existing truth already exists." `leonix_stripe_webhook_events` is a real, already-populated
 * local record of what Stripe has actually told us (received_at, status, last_error) — no
 * outbound network call is made here, this only reads rows Stripe already delivered to our own
 * webhook endpoint in the past. Config-presence remains the fallback when Stripe is configured
 * but has no recent webhook rows yet (that's a "no data" case, not a failure — never inferred as
 * either healthy or broken beyond what config-presence already established).
 */
async function buildStripeHealthComponent(
  stripeConfigured: boolean,
  supabase: ReturnType<typeof getAdminSupabase> | null,
): Promise<LeoSystemHealthComponent> {
  if (!stripeConfigured) {
    return {
      key: "stripe_payments",
      label: "Stripe (payments)",
      state: "NOT_CONFIGURED",
      ownerMessage: "Stripe is not configured — real checkout/payment processing cannot run.",
    };
  }

  if (supabase) {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("leonix_stripe_webhook_events")
        .select("status, last_error, received_at")
        .gte("received_at", since)
        .order("received_at", { ascending: false })
        .limit(50);
      if (!error && data && data.length > 0) {
        const rows = data as { status: string; last_error: string | null; received_at: string }[];
        const failed = rows.filter((r) => r.status === "failed_terminal");
        if (failed.length > 0) {
          return {
            key: "stripe_payments",
            label: "Stripe (payments)",
            state: "DEGRADED",
            ownerMessage: `${failed.length} Stripe webhook event(s) failed permanently in the last 24 hours — some payments may not have recorded correctly. Check Payment Tracker.`,
          };
        }
        return {
          key: "stripe_payments",
          label: "Stripe (payments)",
          state: "HEALTHY",
          ownerMessage: null,
        };
      }
      // No rows in the last 24h (or table unreachable) — not evidence of failure, just no
      // stronger truth than config-presence to report. Fall through to config-presence-only.
    } catch {
      // Same: fall through to config-presence-only rather than reporting a fake failure.
    }
  }

  return {
    key: "stripe_payments",
    label: "Stripe (payments)",
    state: "HEALTHY",
    ownerMessage: null,
  };
}

function overallFromComponents(states: LeoSystemHealthState[]): LeoSystemHealthState {
  if (states.some((s) => s === "UNAVAILABLE")) return "DEGRADED";
  if (states.some((s) => s === "DEGRADED")) return "DEGRADED";
  if (states.every((s) => s === "HEALTHY" || s === "NOT_CONFIGURED")) return "HEALTHY";
  if (states.every((s) => s === "NOT_CONFIGURED")) return "NOT_CONFIGURED";
  return "UNKNOWN";
}

export async function buildAdminSystemHealthSnapshot(): Promise<LeoSystemHealthSnapshot> {
  const components: LeoSystemHealthComponent[] = [];
  const configured = isSupabaseAdminConfigured();

  components.push({
    key: "supabase_config",
    label: "Supabase configuration",
    state: configured ? "HEALTHY" : "NOT_CONFIGURED",
    ownerMessage: configured ? null : "Supabase service credentials are not set for this deployment.",
  });

  if (configured) {
    const supabase = getAdminSupabase();
    const [profiles, listings, auditLog, teamRoster] = await Promise.all([
      probeTableReachable(supabase, "profiles"),
      probeTableReachable(supabase, "listings"),
      probeTableReachable(supabase, "admin_audit_log"),
      probeTableReachable(supabase, "admin_team_members"),
    ]);

    components.push({
      key: "supabase_live",
      label: "Supabase data access (live)",
      state: profiles,
      ownerMessage: profiles === "UNAVAILABLE" ? "Could not read from the database right now." : null,
    });

    components.push({
      key: "marketplace_data",
      label: "Marketplace data (listings table)",
      state: listings,
      ownerMessage: listings === "UNAVAILABLE" ? "Classifieds/listings data is unreachable right now." : null,
    });

    components.push({
      key: "audit_pipeline",
      label: "Audit pipeline (admin_audit_log)",
      state: auditLog,
      ownerMessage: auditLog === "UNAVAILABLE" ? "Admin actions may not be getting recorded right now." : null,
    });

    components.push({
      key: "team_roster",
      label: "Team roster / permissions data",
      state: teamRoster,
      ownerMessage: teamRoster === "UNAVAILABLE" ? "Staff roster and permission checks are unreachable right now." : null,
    });
  }

  const enforceRoster = process.env.ADMIN_ENFORCE_ROSTER_PERMISSIONS === "1";
  components.push({
    key: "roster_permission_enforcement",
    label: "Roster permission enforcement",
    state: enforceRoster ? "HEALTHY" : "NOT_CONFIGURED",
    ownerMessage: enforceRoster
      ? null
      : "Off — every admin with the shared password can take every action regardless of their roster role. This is expected on single-operator deployments.",
  });

  // Master Operating Book §22 — payment provider, email, and SMS readiness. Config-presence
  // only (same honesty bar as every other component here): whether real payments, order
  // emails, and phone verification can actually run depends on these, but this never touches
  // or exposes the credential values themselves.
  const stripeConfigured = isRevenueStripeConfigured();
  components.push(await buildStripeHealthComponent(stripeConfigured, configured ? getAdminSupabase() : null));

  const emailConfig = resolveLeonixResendConfig();
  components.push({
    key: "email_resend",
    label: "Email delivery (Resend)",
    state: emailConfig.ok ? "HEALTHY" : "NOT_CONFIGURED",
    ownerMessage: emailConfig.ok ? null : "Resend is not configured — order confirmations and other transactional email cannot send.",
  });

  const smsConfigured = isTwilioVerifyConfigured();
  components.push({
    key: "sms_twilio",
    label: "SMS verification (Twilio)",
    state: smsConfigured ? "HEALTHY" : "NOT_CONFIGURED",
    ownerMessage: smsConfigured ? null : "Twilio is not configured — phone/SMS verification cannot run.",
  });

  const limitations: string[] = [];
  const degraded = components.filter((c) => c.state === "DEGRADED" || c.state === "UNAVAILABLE");
  if (degraded.length > 0) {
    limitations.push(`${degraded.length} system component(s) degraded or unavailable.`);
  }
  if (!configured) {
    limitations.push("Live data checks were skipped because Supabase is not configured.");
  }

  return {
    generatedAt: new Date().toISOString(),
    overall: overallFromComponents(components.map((c) => c.state)),
    components,
    limitations,
  };
}
