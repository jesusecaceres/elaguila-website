import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

test.describe("Servicios browser smoke", () => {
  test("landing, publish CTA, publish shell, API publish, detail and results discovery", async ({ page, request }) => {
    await page.goto("/clasificados/servicios?lang=es");
    await expect(page.getByRole("heading", { name: /¿Ofreces un servicio\?/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Publica tu Servicio/i })).toBeVisible();
    await page.getByRole("link", { name: /Publica tu Servicio/i }).click();
    await expect(page).toHaveURL(/\/clasificados\/publicar\/servicios/);
    await expect(page.getByRole("heading", { name: /Perfil de negocio|Business profile/i })).toBeVisible();

    const fixturePath = path.join(process.cwd(), "scripts", "fixtures", "servicios-smoke-publish-state.json");
    const state = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    state.businessName = `Playwright Plumbing ${Date.now()}`;
    const pub = await request.post("/api/clasificados/servicios/publish", {
      data: { state, lang: "es" },
    });
    const pubText = await pub.text();
    expect(pub.ok(), `publish failed ${pub.status()}: ${pubText}`).toBeTruthy();
    const json = JSON.parse(pubText) as { ok?: boolean; slug?: string };
    expect(json.ok).toBeTruthy();
    const slug = String(json.slug);

    await page.goto(`/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    await expect(page.getByRole("heading", { name: String(state.businessName) })).toBeVisible();

    await page.goto(`/clasificados/servicios/resultados?lang=es&q=${encodeURIComponent("Playwright")}`);
    await expect(page.locator(`a[href*="/clasificados/servicios/${slug}"]`).first()).toBeVisible();
  });

  test("publish validation blocks incomplete application (no fake success)", async ({ request }) => {
    const res = await request.post("/api/clasificados/servicios/publish", {
      data: {
        lang: "es",
        state: { businessName: "X", city: "", confirmCommunityRules: false },
      },
    });
    expect(res.status()).toBe(422);
    const body = (await res.json()) as { ok?: boolean; error?: string };
    expect(body.ok).toBeFalsy();
    expect(body.error).toBe("not_ready");
  });

  test("results page tolerates odd filter params without 5xx", async ({ page }) => {
    const r = await page.goto("/clasificados/servicios/resultados?lang=es&legal=zzz&msg=2&foo=bar");
    expect(r?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: /Descubre servicios locales|Discover local services/i })).toBeVisible();
  });
});
