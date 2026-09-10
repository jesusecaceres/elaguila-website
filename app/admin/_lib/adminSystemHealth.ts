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
