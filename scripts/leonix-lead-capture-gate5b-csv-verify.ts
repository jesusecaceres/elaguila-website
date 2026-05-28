/**
 * GATE 5B — admin-authenticated CSV export smoke test.
 * Run: npx tsx scripts/leonix-lead-capture-gate5b-csv-verify.ts
 * Requires: npm run dev, ADMIN_PASSWORD in .env.local
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function loadEnvLocal(): void {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2]!.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]!]) process.env[m[1]!] = v;
  }
}

async function adminLoginCookie(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) throw new Error("ADMIN_PASSWORD missing in .env.local");

  const body = new URLSearchParams({ password });
  const res = await fetch(`${baseUrl}/admin/login/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const legacy = res.headers.get("set-cookie");
  const all = [...setCookie, ...(legacy ? [legacy] : [])];
  const admin = all.find((c) => c.startsWith("leonix_admin="));
  if (!admin) throw new Error(`Admin login failed (status ${res.status}); no leonix_admin cookie`);
  return admin.split(";")[0]!;
}

async function fetchCsv(path: string, cookie: string): Promise<{ ok: boolean; status: number; sample: string }> {
  const res = await fetch(`${baseUrl}${path}`, { headers: { Cookie: cookie } });
  const text = await res.text();
  return {
    ok: res.ok && res.headers.get("content-type")?.includes("text/csv") === true && text.includes("email"),
    status: res.status,
    sample: text.slice(0, 200),
  };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const cookie = await adminLoginCookie();
  console.log("[ok] Admin login cookie obtained");

  const newsletter = await fetchCsv("/api/admin/leads/newsletter/export", cookie);
  if (!newsletter.ok) {
    throw new Error(`Newsletter CSV failed: ${newsletter.status} ${newsletter.sample}`);
  }
  console.log("[ok] Newsletter CSV export:", newsletter.status);

  const mediaKit = await fetchCsv("/api/admin/leads/media-kit/export", cookie);
  if (!mediaKit.ok) {
    throw new Error(`Media kit CSV failed: ${mediaKit.status} ${mediaKit.sample}`);
  }
  console.log("[ok] Media kit CSV export:", mediaKit.status);

  const unauth = await fetch(`${baseUrl}/api/admin/leads/newsletter/export`);
  if (unauth.status !== 401) {
    throw new Error(`Expected 401 without cookie, got ${unauth.status}`);
  }
  console.log("[ok] CSV export blocked without admin cookie (401)");

  const newsletterPage = await fetch(`${baseUrl}/admin/leads/newsletter`, { headers: { Cookie: cookie } });
  const newsletterHtml = await newsletterPage.text();
  if (!newsletterPage.ok || !newsletterHtml.includes("test-coming-soon-newsletter@example.com")) {
    throw new Error(`Admin newsletter page missing test row (status ${newsletterPage.status})`);
  }
  console.log("[ok] Admin newsletter page lists test email");

  const mediaKitPage = await fetch(`${baseUrl}/admin/leads/media-kit`, { headers: { Cookie: cookie } });
  const mediaKitHtml = await mediaKitPage.text();
  if (!mediaKitPage.ok || !mediaKitHtml.includes("test-media-kit@example.com")) {
    throw new Error(`Admin media kit page missing test row (status ${mediaKitPage.status})`);
  }
  console.log("[ok] Admin media kit page lists test email");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
