/**
 * Gate 2: verify remote Supabase schema pieces Servicios needs (read-only + one reversible analytics probe).
 * Run: `npx tsx scripts/serviciosRemoteSchema.mts`
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env (e.g. from .env.local via dotenv — load manually or run from shell that has them).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!url || !service) {
    console.log(
      JSON.stringify({
        ok: false,
        error: "missing_env",
        need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      }),
    );
    process.exit(2);
  }

  const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  const leadsProbe = await sb.from("servicios_public_leads").select("id").limit(1);
  const ownerProbe = await sb.from("servicios_public_listings").select("slug, owner_user_id").limit(1);
  const analyticsNullProbe = await sb
    .from("servicios_analytics_events")
    .insert({ listing_slug: null, event_type: "smoke_schema_probe", meta: { probe: true } } as Record<string, unknown>)
    .select("id")
    .maybeSingle();

  let analyticsCleanup: string | null = null;
  if (!analyticsNullProbe.error && analyticsNullProbe.data && typeof analyticsNullProbe.data === "object") {
    const id = (analyticsNullProbe.data as { id?: string }).id;
    if (id) {
      const del = await sb.from("servicios_analytics_events").delete().eq("id", id);
      analyticsCleanup = del.error?.message ?? "ok";
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        servicios_public_leads: {
          applied: !leadsProbe.error,
          error: leadsProbe.error?.message ?? null,
        },
        owner_user_id_column: {
          applied: !ownerProbe.error,
          error: ownerProbe.error?.message ?? null,
        },
        servicios_analytics_nullable_slug: {
          applied: !analyticsNullProbe.error,
          error: analyticsNullProbe.error?.message ?? null,
          cleanup: analyticsCleanup,
        },
        migrations_repo_hint: [
          "supabase/migrations/20260411120000_servicios_leads_reviews_analytics.sql (servicios_public_leads)",
          "supabase/migrations/20260410200000_servicios_public_owner_user.sql (owner_user_id)",
          "supabase/migrations/20260422190000_servicios_analytics_slug_nullable.sql (listing_slug nullable)",
        ],
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  process.exit(1);
});
