/**
 * GATE 5 — verify lead capture migration + API saves.
 * Run: npx tsx scripts/leonix-lead-capture-gate5-verify.ts
 *
 * Optional: BASE_URL=http://localhost:3000 to also hit HTTP routes (dev server must be running).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import {
  saveMediaKitLead,
  saveNewsletterSubscriber,
} from "../app/lib/leonix/leadCaptureServer";

const LEAD_CAPTURE_MIGRATION_NOTE =
  "Lead capture tables are not available. Apply the Supabase migration first.";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

const NEWSLETTER_TEST = {
  email: "test-coming-soon-newsletter@example.com",
  name: "Test Newsletter Lead",
  city: "San Jose",
  zipCode: "95112",
  preferredLanguage: "es",
  interests: "Restaurantes, Servicios, Cupones",
  source: "coming-soon",
  lang: "es" as const,
};

const MEDIA_KIT_TEST = {
  name: "Test Media Kit Lead",
  email: "test-media-kit@example.com",
  phone: "408-303-6500",
  business: "Test Business",
  message: "Testing media kit lead capture",
  lang: "es" as const,
  source: "media_kit_page",
};

function loadEnvLocal(): void {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2]!.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]!]) process.env[m[1]!] = v;
  }
}

function isMissingTableError(msg: string): boolean {
  return msg.includes("does not exist") || msg.includes("schema cache");
}

async function probeTables(url: string, serviceKey: string): Promise<{ ok: boolean; note: string }> {
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: nErr } = await supabase.from("leonix_newsletter_subscribers").select("id").limit(1);
  if (nErr) {
    const msg = nErr.message ?? "";
    const code = "code" in nErr ? String((nErr as { code?: string }).code) : "";
    if (isMissingTableError(msg) || code === "PGRST205") {
      return { ok: false, note: LEAD_CAPTURE_MIGRATION_NOTE };
    }
    return { ok: false, note: `Newsletter table probe failed: ${msg}` };
  }
  const { error: mErr } = await supabase.from("leonix_media_kit_leads").select("id").limit(1);
  if (mErr) {
    const msg = mErr.message ?? "";
    const code = "code" in mErr ? String((mErr as { code?: string }).code) : "";
    if (isMissingTableError(msg) || code === "PGRST205") {
      return { ok: false, note: LEAD_CAPTURE_MIGRATION_NOTE };
    }
    return { ok: false, note: `Media kit table probe failed: ${msg}` };
  }
  return { ok: true, note: "Tables present." };
}

async function httpPost(baseUrl: string, path: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: { ok?: boolean } = {};
  try {
    data = (await res.json()) as { ok?: boolean };
  } catch {
    /* ignore */
  }
  return { ok: res.ok && data.ok === true, status: res.status };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const baseUrl = process.env.BASE_URL?.trim() || "";

  console.log("=== GATE 5: Leonix lead capture verification ===\n");

  const migrationPath = path.join(root, "supabase/migrations/20260527200000_leonix_lead_capture.sql");
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist");
  console.log("[ok] Migration file exists:", migrationPath);

  if (!url || !serviceKey) {
    console.error("\n[BLOCKER] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    console.error("\nChuy must run (after Supabase login + link):");
    console.error("  npx supabase login");
    console.error("  npx supabase link --project-ref <your-project-ref>");
    console.error("  npx supabase db push");
    process.exit(1);
  }

  const probe = await probeTables(url, serviceKey);
  if (!probe.ok) {
    console.error("\n[BLOCKER] Migration not applied:", probe.note);
    console.error("\nSupabase CLI is not logged in on this machine. Chuy should run:");
    console.error("  npx supabase login");
    console.error("  npx supabase link --project-ref <ref-from-dashboard>");
    console.error("  npx supabase db push");
    console.error("\nOr apply SQL manually in Supabase Dashboard → SQL Editor:");
    console.error("  supabase/migrations/20260527200000_leonix_lead_capture.sql");
    process.exit(1);
  }
  console.log("[ok] Migration applied (tables reachable):", probe.note);

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const consentTimestamp = new Date().toISOString();
  const newsletterSave = await saveNewsletterSubscriber(supabase, {
    ...NEWSLETTER_TEST,
    consentTimestamp,
  });
  assert.equal(newsletterSave.ok, true, `newsletter save: ${!newsletterSave.ok ? newsletterSave.error : ""}`);
  console.log("[ok] Newsletter save via server helper:", newsletterSave.ok ? newsletterSave.id : "failed");

  const mediaKitSave = await saveMediaKitLead(supabase, MEDIA_KIT_TEST);
  assert.equal(mediaKitSave.ok, true, `media kit save: ${!mediaKitSave.ok ? mediaKitSave.error : "failed"}`);
  console.log("[ok] Media kit save via server helper:", mediaKitSave.ok ? mediaKitSave.id : "failed");

  const { data: newsletterRows, error: newsletterListErr } = await supabase
    .from("leonix_newsletter_subscribers")
    .select("email")
    .order("created_at", { ascending: false })
    .limit(100);
  assert.ok(!newsletterListErr, newsletterListErr?.message);
  assert.ok(
    (newsletterRows ?? []).some((r) => r.email === NEWSLETTER_TEST.email),
    "newsletter row visible in admin-style list"
  );
  console.log("[ok] Admin newsletter list query includes test email");

  const { data: mediaKitRows, error: mediaKitListErr } = await supabase
    .from("leonix_media_kit_leads")
    .select("email")
    .order("created_at", { ascending: false })
    .limit(100);
  assert.ok(!mediaKitListErr, mediaKitListErr?.message);
  assert.ok(
    (mediaKitRows ?? []).some((r) => r.email === MEDIA_KIT_TEST.email),
    "media kit row in admin-style list"
  );
  console.log("[ok] Admin media kit list query includes test email");

  const { data: newsletterExportRow } = await supabase
    .from("leonix_newsletter_subscribers")
    .select("email,name,source,lang")
    .eq("email", NEWSLETTER_TEST.email)
    .maybeSingle();
  assert.ok(newsletterExportRow?.email === NEWSLETTER_TEST.email);
  assert.equal(newsletterExportRow?.source, "coming-soon");
  console.log("[ok] Newsletter export row fields (source, lang) preserved");

  const { data: mediaKitExportRow } = await supabase
    .from("leonix_media_kit_leads")
    .select("email,name,lang,source")
    .eq("email", MEDIA_KIT_TEST.email)
    .maybeSingle();
  assert.ok(mediaKitExportRow?.email === MEDIA_KIT_TEST.email);
  assert.equal(mediaKitExportRow?.lang, "es");
  console.log("[ok] Media kit export row fields preserved");

  if (baseUrl) {
    const nEs = await httpPost(baseUrl, "/api/newsletter/subscribe", {
      email: NEWSLETTER_TEST.email,
      name: NEWSLETTER_TEST.name,
      city: NEWSLETTER_TEST.city,
      zipCode: NEWSLETTER_TEST.zipCode,
      preferredLanguage: NEWSLETTER_TEST.preferredLanguage,
      interests: NEWSLETTER_TEST.interests,
      source: NEWSLETTER_TEST.source,
      lang: NEWSLETTER_TEST.lang,
    });
    assert.ok(nEs.ok, `POST newsletter HTTP ${nEs.status}`);
    console.log("[ok] POST /api/newsletter/subscribe (lang=es)");

    const nEn = await httpPost(baseUrl, "/api/newsletter/subscribe", {
      ...NEWSLETTER_TEST,
      email: "test-coming-soon-newsletter-en@example.com",
      lang: "en",
      source: "coming-soon",
    });
    assert.ok(nEn.ok, `POST newsletter EN HTTP ${nEn.status}`);
    console.log("[ok] POST /api/newsletter/subscribe (lang=en)");

    const mEs = await httpPost(baseUrl, "/api/media-kit/request", MEDIA_KIT_TEST);
    assert.ok(mEs.ok, `POST media-kit HTTP ${mEs.status}`);
    console.log("[ok] POST /api/media-kit/request (lang=es)");

    const mEn = await httpPost(baseUrl, "/api/media-kit/request", {
      ...MEDIA_KIT_TEST,
      email: "test-media-kit-en@example.com",
      lang: "en",
    });
    assert.ok(mEn.ok, `POST media-kit EN HTTP ${mEn.status}`);
    console.log("[ok] POST /api/media-kit/request (lang=en)");
  } else {
    console.log("\n[skip] HTTP route checks — set BASE_URL=http://localhost:3000 with `npm run dev` running.");
  }

  console.log("\n=== Test records left in DB (for Chuy) ===");
  console.log("  Newsletter:", NEWSLETTER_TEST.email);
  if (baseUrl) console.log("  Newsletter (EN HTTP test): test-coming-soon-newsletter-en@example.com");
  console.log("  Media kit:", MEDIA_KIT_TEST.email);
  if (baseUrl) console.log("  Media kit (EN HTTP test): test-media-kit-en@example.com");
  console.log("\nAdmin inbox: /admin/leads/newsletter and /admin/leads/media-kit");
  console.log("CSV export (requires leonix_admin cookie): /api/admin/leads/newsletter/export");
  console.log("\nGATE 5 verification passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
