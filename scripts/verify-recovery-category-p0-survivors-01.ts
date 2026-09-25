/**
 * RECOVERY — category P0 survivors (semantic ports onto golden fff3d53d9).
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-recovery-category-p0-survivors-01.ts
 *
 * 1. da25bc921 (hook hunk)  — useLeonixPublishFlowExitClear no longer clears on pagehide/pageshow
 *                              (hard refresh of BR Privado form/preview wiped the paid draft).
 * 2. 245a70f1c(a)           — dashboard lifecycle adapter edits the REAL Busco/Mascotas publisher keys/values.
 * 3. 245a70f1c(c)           — Clases/Comunidad expiry: classEndDate/oneTimeDate keys, results for both
 *                              categories, detail-page gate.
 * 4. 13b0d1725(a)           — NOT PORTED (golden has no term timestamp that renewals bump); evidence pinned.
 * 5. 13b0d1725(b)           — Empleos Quick envelope -> draft keeps workModalityCustom.
 * 6. 13b0d1725(c)           — Ofertas draft recovery keeps membershipCtaLabel / digitalCouponUrl / digitalCouponNote.
 *
 * Source pins for client wiring; pure functions are EXECUTED with fixtures (no DB, no network).
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getCategoryLifecycleAdapter } from "../app/(site)/dashboard/mis-anuncios/[id]/editar/categoryLifecycleAdapters";
import { BUSCO_BUDGET_MODE_OPTIONS, BUSCO_URGENCY_OPTIONS } from "../app/(site)/publicar/busco/shared/buscoTaxonomy";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "../app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import {
  communityEventDiscoveryExpiryDateKey,
  isCommunityEventActiveForDiscovery,
} from "../app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration";
import { normalizeEmpleosQuickDraft } from "../app/(site)/publicar/empleos/shared/types/empleosQuickDraft";
import { hydrateQuickDraftFromEnvelope } from "../app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { buildEmpleosPublishEnvelopeFromQuick } from "../app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { mapOfertaLocalAdminRowToDraftRecoveryPatch } from "../app/lib/ofertas-locales/ofertasLocalesOwnerHelpers";
import type { OfertaLocalAdminRow } from "../app/lib/ofertas-locales/ofertasLocalesAdminHelpers";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

type Pair = { label?: string; value?: string };
const pairsOf = (patch: Record<string, unknown>) => (patch.detail_pairs as Pair[]) ?? [];
const pairVal = (patch: Record<string, unknown>, label: string) => pairsOf(patch).find((p) => p.label === label)?.value;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Exit-clear hook
// ─────────────────────────────────────────────────────────────────────────────
const HOOK = "app/(site)/clasificados/lib/leonixApplicationStandard/useLeonixPublishFlowExitClear.ts";
const BR_FORM = "app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx";

check("1a hook: no pagehide/pageshow listener (hard refresh must not wipe the draft)", () => {
  const src = read(HOOK);
  assert.ok(!/addEventListener\(\s*["']pagehide["']/.test(src), "pagehide listener still registered");
  assert.ok(!/addEventListener\(\s*["']pageshow["']/.test(src), "pageshow listener still registered");
  assert.ok(!src.includes("PageTransitionEvent"), "pageshow handler still present");
});

check("1b hook: SPA-unmount clear kept (outside-flow check + suspend guard)", () => {
  const src = read(HOOK);
  assert.ok(src.includes("queueMicrotask("), "unmount microtask clear missing");
  assert.ok(src.includes("isPathInsideFlowRef.current(p)"), "outside-flow path check missing");
  assert.ok(src.includes("getSuspendRef.current()"), "suspend guard missing");
});

check("1c hook: file keeps CRLF line endings", () => {
  const raw = readFileSync(join(ROOT, HOOK));
  const text = raw.toString("utf8");
  const lf = (text.match(/\n/g) ?? []).length;
  const crlf = (text.match(/\r\n/g) ?? []).length;
  assert.equal(lf, crlf, "mixed line endings");
});

check("1d only BR Privado (application + preview) mount the hook", () => {
  const app = read("app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoApplication.tsx");
  const preview = read("app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx");
  assert.ok(app.includes("useLeonixPublishFlowExitClear({"));
  assert.ok(preview.includes("useLeonixPublishFlowExitClear({"));
});

check("1e BR Privado form: pagehide FLUSH kept; comment reflects the hook no longer clears on refresh", () => {
  const src = read(BR_FORM);
  assert.ok(src.includes('window.addEventListener("pagehide", flush)'), "form flush on pagehide missing");
  assert.ok(src.includes("no longer clears on pagehide/pageshow"), "form comment not updated");
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dashboard lifecycle adapters — Busco + Mascotas
// ─────────────────────────────────────────────────────────────────────────────
const busco = getCategoryLifecycleAdapter("busco")!;
const mascotas = getCategoryLifecycleAdapter("mascotas-y-perdidos")!;

check("2a Busco field spec: urgency options == publisher's 4 states; budgetMode options == publisher modes", () => {
  const urg = busco.fields.find((f) => f.key === "urgency");
  assert.deepEqual(urg?.options?.map((o) => o.value), BUSCO_URGENCY_OPTIONS.map((o) => o.value));
  assert.deepEqual(urg?.options?.map((o) => o.value), ["normal", "esta_semana", "lo_antes_posible", "urgente_hoy"]);
  const mode = busco.fields.find((f) => f.key === "budgetMode");
  assert.deepEqual(mode?.options?.map((o) => o.value), BUSCO_BUDGET_MODE_OPTIONS.map((o) => o.value));
  assert.ok(busco.fields.some((f) => f.key === "budgetAmount"));
  assert.ok(!busco.fields.some((f) => f.key === "budget"), "legacy free-text budget field still exposed");
});

const buscoRow = {
  city: "San José",
  contact_phone: "4085550100",
  contact_email: "a@example.test",
  detail_pairs: [
    { label: "Leonix:state", value: "CA" },
    { label: "Leonix:buscoBudgetMode", value: "tiene" },
    { label: "Leonix:buscoBudgetAmount", value: "500" },
    { label: "Leonix:buscoBudget", value: "legacy text" },
    { label: "Leonix:buscoUrgency", value: "urgente_hoy" },
    { label: "Leonix:buscoType", value: "servicio" },
    { label: "Leonix:whatsappDigits", value: "4085550199" },
  ],
};

check("2b Busco hydrate reads structured budget + real urgency", () => {
  const h = busco.hydrate(buscoRow);
  assert.equal(h.urgency, "urgente_hoy");
  assert.equal(h.budgetMode, "tiene");
  assert.equal(h.budgetAmount, "500");
});

check("2c Busco round trip preserves urgente_hoy, tiene/500, untouched legacy + unknown pairs", () => {
  const patch = busco.serialize(buscoRow, busco.hydrate(buscoRow));
  assert.equal(pairVal(patch, "Leonix:buscoUrgency"), "urgente_hoy");
  assert.equal(pairVal(patch, "Leonix:buscoBudgetMode"), "tiene");
  assert.equal(pairVal(patch, "Leonix:buscoBudgetAmount"), "500");
  assert.equal(pairVal(patch, "Leonix:buscoBudget"), "legacy text", "legacy key must not be rewritten");
  assert.equal(pairVal(patch, "Leonix:buscoType"), "servicio", "unowned pair dropped");
});

check("2d Busco serialize mirrors publisher omissions (normal urgency / no_aplica mode / amount only with tiene)", () => {
  const h = busco.hydrate(buscoRow);
  const p1 = busco.serialize(buscoRow, { ...h, urgency: "normal", budgetMode: "no_aplica" });
  assert.equal(pairVal(p1, "Leonix:buscoUrgency"), undefined);
  assert.equal(pairVal(p1, "Leonix:buscoBudgetMode"), undefined);
  assert.equal(pairVal(p1, "Leonix:buscoBudgetAmount"), undefined);
  const p2 = busco.serialize(buscoRow, { ...h, budgetMode: "gratis", budgetAmount: "999", urgency: "lo_antes_posible" });
  assert.equal(pairVal(p2, "Leonix:buscoBudgetMode"), "gratis");
  assert.equal(pairVal(p2, "Leonix:buscoBudgetAmount"), undefined);
  assert.equal(pairVal(p2, "Leonix:buscoUrgency"), "lo_antes_posible");
});

check("2e Busco legacy urgency values coerce like the public readers (urgente->urgente_hoy, pronto->esta_semana)", () => {
  const legacy = (v: string) => busco.hydrate({ ...buscoRow, detail_pairs: [{ label: "Leonix:buscoUrgency", value: v }] }).urgency;
  assert.equal(legacy("urgente"), "urgente_hoy");
  assert.equal(legacy("pronto"), "esta_semana");
  assert.equal(legacy(""), "normal");
  assert.equal(busco.hydrate({ ...buscoRow, detail_pairs: [] }).budgetMode, "no_aplica");
});

check("2f Mascotas noticeType options == publisher taxonomy (5 slugs)", () => {
  const f = mascotas.fields.find((x) => x.key === "noticeType");
  assert.deepEqual(f?.options?.map((o) => o.value), MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((o) => o.value));
  assert.ok(!f?.options?.some((o) => o.value === "perdido" || o.value === "encontrado"));
});

const mascotasRow = {
  city: "Oakland",
  contact_phone: "5105550100",
  contact_email: "",
  detail_pairs: [
    { label: "Leonix:mascotasLane", value: "rich" },
    { label: "Leonix:noticeType", value: "mascota-perdida" },
    { label: "Leonix:lastSeenLocation", value: "Lake Merritt" },
    { label: "Leonix:whatsappDigits", value: "5105550199" },
    { label: "Leonix:petName", value: "Luna" },
  ],
};

check("2g Mascotas round trip preserves mascota-perdida, distinct WhatsApp and unowned pairs", () => {
  const h = mascotas.hydrate(mascotasRow);
  assert.equal(h.noticeType, "mascota-perdida");
  const patch = mascotas.serialize(mascotasRow, h);
  assert.equal(pairVal(patch, "Leonix:noticeType"), "mascota-perdida");
  assert.equal(pairVal(patch, "Leonix:whatsappDigits"), "5105550199");
  assert.equal(pairVal(patch, "Leonix:petName"), "Luna");
  const patch2 = mascotas.serialize(mascotasRow, { ...h, noticeType: "objeto-encontrado" });
  assert.equal(pairVal(patch2, "Leonix:noticeType"), "objeto-encontrado");
});

check("2h Mascotas rows corrupted by the old editor map back (perdido/encontrado)", () => {
  const h = (v: string) => mascotas.hydrate({ ...mascotasRow, detail_pairs: [{ label: "Leonix:noticeType", value: v }] }).noticeType;
  assert.equal(h("perdido"), "mascota-perdida");
  assert.equal(h("encontrado"), "mascota-encontrada");
  assert.equal(h("adopcion-mascota"), "adopcion-mascota");
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Clases / Comunidad expiry
// ─────────────────────────────────────────────────────────────────────────────
const TODAY = "2026-09-25";
check("3a expiry predicate: Clases classEndDate / oneTimeDate honored (inclusive day)", () => {
  assert.equal(isCommunityEventActiveForDiscovery({ "Leonix:classEndDate": "2026-09-01" }, TODAY), false);
  assert.equal(isCommunityEventActiveForDiscovery({ "Leonix:oneTimeDate": "2026-09-24" }, TODAY), false);
  assert.equal(isCommunityEventActiveForDiscovery({ "Leonix:oneTimeDate": "2026-09-25" }, TODAY), true);
  assert.equal(isCommunityEventActiveForDiscovery({ "Leonix:classEndDate": "2026-12-31" }, TODAY), true);
});

check("3b expiry predicate: ongoing / missing dates stay visible; Comunidad unchanged", () => {
  assert.equal(isCommunityEventActiveForDiscovery({ "Leonix:classStartDate": "2026-01-01" }, TODAY), true);
  assert.equal(isCommunityEventActiveForDiscovery({}, TODAY), true);
  assert.equal(isCommunityEventActiveForDiscovery({ "Leonix:eventDate": "2026-09-20" }, TODAY), false);
  assert.equal(
    isCommunityEventActiveForDiscovery({ "Leonix:eventDate": "2026-09-20", "Leonix:eventEndDate": "2026-09-30" }, TODAY),
    true,
  );
  assert.equal(communityEventDiscoveryExpiryDateKey({ "Leonix:eventEndDate": "2026-10-01T10:00" }), "2026-10-01");
});

check("3c results client applies expiry to every category (not comunidad-only)", () => {
  const src = read("app/(site)/clasificados/community/CommunityListingsResultsClient.tsx");
  assert.ok(src.includes("if (!isCommunityEventActiveForDiscovery(pairs)) return false;"));
  assert.ok(!src.includes('category === "comunidad" && !isCommunityEventActiveForDiscovery'));
});

check("3d anuncio detail gates expired Clases/Comunidad quick listings to the not-found state", () => {
  const src = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  assert.ok(src.includes("isCommunityEventActiveForDiscovery(communityQuickPairMap)"));
  assert.ok(src.includes("if (!listing || isExpiredCommunityQuickListing) {"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Empleos public term — deliberately NOT ported; pin the evidence
// ─────────────────────────────────────────────────────────────────────────────
check("4 (skipped) evidence: renew/republish paths do NOT bump published_at", () => {
  const adminRoute = read("app/api/admin/empleos/listings/[id]/route.ts");
  const repub = adminRoute.slice(adminRoute.indexOf('if (action === "republish")'), adminRoute.indexOf("switch (action)"));
  assert.ok(repub.includes("republished_at: now"));
  assert.ok(!/\bpublished_at\s*:/.test(repub),"admin republish now bumps published_at — revisit item 4");
  const activation = read("app/lib/listingPlans/revenueEmpleosFulfillment.ts");
  assert.ok(activation.includes('status === "published" || status === "pending_review"'));
  assert.ok(activation.includes("row.published_at ?? now"));
  const db = read("app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts");
  assert.ok(db.includes("published_at: (prior as { published_at?: string | null }).published_at ?? row.published_at"));
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Empleos workModalityCustom
// ─────────────────────────────────────────────────────────────────────────────
check("5 Empleos Quick envelope -> draft keeps workModalityCustom", () => {
  const draft = normalizeEmpleosQuickDraft({
    title: "Pescador",
    businessName: "Mar Azul",
    city: "Monterey",
    state: "CA",
    jobType: "tiempo-completo",
    workModality: "otro",
    workModalityCustom: "Barco pesquero",
    description: "Trabajo en barco.",
    phone: "8315550100",
    email: "jobs@example.test",
  });
  const envelope = buildEmpleosPublishEnvelopeFromQuick(draft, "es");
  const back = hydrateQuickDraftFromEnvelope(envelope);
  assert.ok(back, "hydrate returned null");
  assert.equal(back!.workModality, "otro");
  assert.equal(back!.workModalityCustom, "Barco pesquero");
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Ofertas draft recovery
// ─────────────────────────────────────────────────────────────────────────────
check("6 Ofertas recovery patch carries membershipCtaLabel (snapshot) + digital coupon url/note (columns)", () => {
  const row = {
    membership_url: "https://club.example.test",
    membership_note: "Socios",
    digital_coupon_url: "https://coupon.example.test",
    digital_coupon_note: "Muestra en caja",
    draft_snapshot: { membershipCtaLabel: "Únete al club" },
  } as unknown as OfertaLocalAdminRow;
  const p = mapOfertaLocalAdminRowToDraftRecoveryPatch(row);
  assert.equal(p.membershipCtaLabel, "Únete al club");
  assert.equal(p.digitalCouponUrl, "https://coupon.example.test");
  assert.equal(p.digitalCouponNote, "Muestra en caja");
  assert.equal(p.membershipUrl, "https://club.example.test");
  const empty = mapOfertaLocalAdminRowToDraftRecoveryPatch({ draft_snapshot: null } as unknown as OfertaLocalAdminRow);
  assert.equal(empty.membershipCtaLabel, "");
  assert.equal(empty.digitalCouponUrl, "");
  assert.equal(empty.digitalCouponNote, "");
});

check("6b OfertaLocalAdminRow does not select the production-removed membership_cta_label column", () => {
  const admin = read("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");
  assert.ok(!/membership_cta_label\s*:/.test(admin), "membership_cta_label added to the row type");
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nverify-recovery-category-p0-survivors-01: ${passed.length}/${checks} checks passed`);
for (const p of passed) console.log(`  ok  ${p}`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL ${f}`);
  console.log("\nRESULT: FAIL");
  process.exit(1);
}
console.log("\nRESULT: PASS");
