import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const e2ePassword = process.env.RESTAURANTES_E2E_PASSWORD;

test.describe("Restaurantes smoke (production build)", () => {
  test("landing → results → publish (no demo explícito banner)", async ({ page }) => {
    await page.goto("/clasificados/restaurantes?lang=es");
    await expect(page.locator("h1").first()).toContainText(/restaurantes/i);
    await expect(page.getByText("Demo explícito")).toHaveCount(0);

    await page.goto("/clasificados/restaurantes/resultados?lang=es");
    await expect(page.locator("h1").first()).toContainText(/restaurantes/i);
    await expect(page.getByText("Demo explícito")).toHaveCount(0);

    await page.goto("/publicar/restaurantes?lang=es&plan=free");
    await expect(page.getByRole("heading", { name: /Publicar restaurante/i })).toBeVisible();
  });

  test("publish API rejects empty body (no fake success)", async ({ request }) => {
    const res = await request.post("/api/clasificados/restaurantes/publish", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const j = (await res.json()) as { error?: string };
    expect(j.error).toBe("missing_draft");
  });

  test("signed-in owner can open dashboard route (session via Supabase password)", async ({ page, context }) => {
    test.skip(!url || !anon || !service || !e2ePassword, "Set NEXT_PUBLIC_SUPABASE_URL, ANON, SERVICE_ROLE_KEY, RESTAURANTES_E2E_PASSWORD");

    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const email = `rx-e2e-${Date.now()}@leonix-e2e.invalid`;
    const password = e2ePassword!;
    const { error: cuErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (cuErr && !String(cuErr.message).toLowerCase().includes("already")) {
      throw cuErr;
    }

    const browserAnon = createClient(url!, anon!);
    const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({ email, password });
    if (sErr || !sess.session) throw sErr ?? new Error("no session");

    const ref = new URL(url!).hostname.split(".")[0];
    const storageKey = `sb-${ref}-auth-token`;
    const persisted = JSON.stringify({
      currentSession: sess.session,
      expiresAt: sess.session.expires_at,
    });
    await context.addInitScript(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* ignore */
        }
      },
      [storageKey, persisted] as const,
    );

    await page.goto("/dashboard/restaurantes?lang=es");
    await expect(page.getByText(/Mis restaurantes|restaurantes/i).first()).toBeVisible({ timeout: 25_000 });

    await admin.auth.admin.deleteUser(sess.user.id);
  });
});
