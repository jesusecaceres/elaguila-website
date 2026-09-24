/**
 * LAUNCH — Comida Local: NO-VIDEO policy + LEGACY ROW hydration (fail visibly, never a blank form).
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-launch-comida-local-video-legacy-01.ts
 *
 * A. Video: Comida Local does not promise or accept video. Source scan of every Comida Local surface
 *    (application, quick intake, field copy, types/persistence, preview/detail, packages, media registry,
 *    publish validator/route) proves no video input, field, or promise exists; stray legacy `video*` keys in
 *    stored JSON are tolerated (no crash) and dropped, never surfaced or republished.
 * B. Legacy hydration: the reverse mapper (columns -> draft) is EXECUTED — round trip forward(draft) ->
 *    columns -> reverse, refusal below the documented minimum, and the shared row mapper / assisted
 *    reopen never return a blank draft. The client wiring (blocking notice, no Save-for-Client from that
 *    state) and the server overwrite guard are source assertions (no server / no browser here).
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import { mergeComidaLocalDraftFromStorage } from "../app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { draftToComidaLocalPublicListingInsert } from "../app/lib/clasificados/comida-local/comidaLocalPublicListingMapper";
import {
  COMIDA_LOCAL_LEGACY_ROW_COLUMNS,
  comidaLocalDraftFromLegacyRowColumns,
} from "../app/lib/clasificados/comida-local/comidaLocalLegacyRowMapper";
import {
  COMIDA_LOCAL_ASSISTED_REOPEN_UNSAFE_NOTICE,
  comidaLocalDraftFromAssistedBoundRow,
  comidaLocalEditHydrationFromRow,
} from "../app/lib/clasificados/comida-local/comidaLocalListingEditContext";
import { normalizeComidaLocalDraftForPublish, parseComidaLocalPublishRequest } from "../app/lib/clasificados/comida-local/comidaLocalPublishValidation";

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

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const img = (role: "main" | "gallery" | "logo", n: number) => ({
  id: `${role}-${n}`,
  role,
  url: `https://cdn.example.test/${role}-${n}.jpg`,
  storagePath: `comida-local/${role}-${n}.jpg`,
  fileName: `${role}-${n}.jpg`,
  contentType: "image/jpeg",
  sizeBytes: 1234,
  uploadedAt: "2026-09-01T00:00:00.000Z",
});

function fullDraft() {
  return mergeComidaLocalDraftFromStorage({
    ...createEmptyComidaLocalDraft(),
    draftListingId: "draft-abc-1",
    businessName: "Tacos El Compa",
    foodType: "tacos",
    foodTypeCustom: "",
    cityCanonical: "Oakland",
    cityDisplay: "Oakland",
    zoneNote: "Fruitvale",
    queVendes: "Tacos de canasta y birria todos los dias en la esquina.",
    phone: "5105550199",
    whatsapp: "5105550111",
    instagramUrl: "https://www.instagram.com/tacoselcompa",
    facebookUrl: "https://www.facebook.com/tacoselcompa",
    tiktokUrl: "https://www.tiktok.com/@tacoselcompa",
    locationNote: "Frente al mercado",
    locationUrl: "https://maps.example.test/x",
    availabilityNote: "Jueves a domingo",
    serviceOptions: ["pickup", "delivery"],
    paymentMethods: ["cash", "zelle"],
    paymentOtherNote: "",
    priceLevel: "2",
    languages: ["es", "bilingual"],
    mainPhoto: img("main", 0),
    logoImage: img("logo", 0),
    galleryImages: [img("gallery", 1), img("gallery", 2)],
  });
}

const COLUMN_BACKED_FIELDS = [
  "foodType",
  "foodTypeCustom",
  "cityCanonical",
  "cityDisplay",
  "zoneNote",
  "queVendes",
  "phone",
  "whatsapp",
  "instagramUrl",
  "facebookUrl",
  "tiktokUrl",
  "locationNote",
  "locationUrl",
  "availabilityNote",
  "serviceOptions",
  "paymentMethods",
  "paymentOtherNote",
  "priceLevel",
  "languages",
  "mainPhoto",
  "logoImage",
  "galleryImages",
] as const;

function legacyRow(draft = fullDraft(), extra: Record<string, unknown> = {}): Record<string, unknown> {
  const insert = draftToComidaLocalPublicListingInsert(draft, "tacos-el-compa-oakland", {
    ownerUserId: "owner-1",
    draftListingId: "draft-col-1",
    packageTier: "basic",
    status: "pending_payment",
  });
  const { listing_json: _dropped, ...columns } = insert;
  return { id: "row-1", leonix_ad_id: "COMIDA-1", updated_at: "2026-09-24T00:00:00Z", ...columns, listing_json: null, ...extra };
}

async function main() {
  // ══ A. VIDEO POLICY ═══════════════════════════════════════════════════════════════════════════
  const scanDirs = [
    "app/lib/clasificados/comida-local",
    "app/(site)/publicar/comida-local",
    "app/(site)/clasificados/comida-local",
    "app/api/clasificados/comida-local",
  ];
  const codeVideoHits: string[] = [];
  for (const dir of scanDirs) {
    for (const file of walk(join(ROOT, dir))) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (!/video|v[ií]deo/i.test(line)) return;
          const t = line.trim();
          if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return; // comments document the policy
          codeVideoHits.push(`${rel}:${i + 1}: ${t}`);
        });
    }
  }

  check("A1: the only executable 'video' tokens in Comida Local are the validator zero, the heavy-media reject, and the Quick contract literal", () => {
    const allowed = [
      /comidaLocalPublishValidation\.ts:\d+: maxExternalVideos: 0,$/,
      /api\/clasificados\/comida-local\/publish\/route\.ts:\d+: .*data:video\/.*$/,
      /rapido\/ComidaLocalQuickIntakeClient\.tsx:\d+: videoOptional: true as const,$/,
    ];
    const unexpected = codeVideoHits.filter((h) => !allowed.some((re) => re.test(h)));
    assert.deepEqual(unexpected, [], `unexpected video surface(s):\n${unexpected.join("\n")}`);
    assert.equal(codeVideoHits.length, 3, `expected exactly the 3 allowed hits, got:\n${codeVideoHits.join("\n")}`);
  });

  check("A2: no video draft field, no file input accepting video, application + quick media step are image-only", () => {
    const types = read("app/lib/clasificados/comida-local/comidaLocalTypes.ts");
    assert.ok(!/video/i.test(types), "ComidaLocalDraft has no video field");
    const mediaStep = read("app/(site)/publicar/rapido/_components/QuickMediaStep.tsx");
    assert.ok(mediaStep.includes('accept="image/*"'));
    assert.ok(!/accept="[^"]*video/i.test(mediaStep), "Quick media step never accepts video");
    const app = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
    assert.ok(!/video/i.test(app), "application client has no video input or copy");
    const fieldCopy = read("app/lib/clasificados/comida-local/comidaLocalFieldCopy.ts");
    assert.ok(!/video/i.test(fieldCopy), "field copy promises no video");
    const packages = read("app/lib/clasificados/comida-local/comidaLocalPackages.ts");
    assert.ok(!/video/i.test(packages), "package copy promises no video");
  });

  check("A3: validator, media registry and owner capability registry all say no video for comida-local", () => {
    const validation = read("app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts");
    assert.ok(/maxExternalVideos:\s*0/.test(validation));
    const media = read("app/lib/media/listingMediaConfigs.ts");
    const entry = media.slice(media.indexOf('pipeline: "comida_local"'));
    const block = entry.slice(0, entry.indexOf('pipeline: "comunidad"'));
    assert.ok(/maxExternalVideos:\s*0/.test(block) && /videoValidator:\s*"none"/.test(block));
    const caps = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
    const capBlock = caps.slice(caps.indexOf('"comida-local": merge({'));
    assert.ok(/video:\s*"unsupported"/.test(capBlock.slice(0, capBlock.indexOf("}),"))));
  });

  check("A4: quick intake documents the no-video policy and caps photos at what the base package can publish", () => {
    const quick = read("app/(site)/publicar/comida-local/rapido/ComidaLocalQuickIntakeClient.tsx");
    assert.ok(quick.includes("NO-VIDEO POLICY"));
    assert.ok(quick.includes("maxImages: 1 + COMIDA_LOCAL_GALLERY_MAX"));
    assert.ok(quick.includes("draft.media.slice(1, 1 + COMIDA_LOCAL_GALLERY_MAX)"));
    assert.ok(!quick.includes("slice(1, 6)"));
  });

  check("A5: stored legacy video keys never crash loading and are dropped, never republished", () => {
    const stray = {
      ...fullDraft(),
      videoUrl: "https://youtu.be/abc123",
      videos: [{ url: "https://youtu.be/abc123" }],
      externalVideoUrls: ["https://vimeo.com/1"],
    };
    const merged = mergeComidaLocalDraftFromStorage(stray) as unknown as Record<string, unknown>;
    assert.equal(merged.businessName, "Tacos El Compa");
    assert.ok(!Object.keys(merged).some((k) => /video/i.test(k)), "merge allowlist drops video keys");
    const publishDraft = normalizeComidaLocalDraftForPublish(stray, "basic") as unknown as Record<string, unknown>;
    assert.ok(!Object.keys(publishDraft).some((k) => /video/i.test(k)));
    const parsed = parseComidaLocalPublishRequest({ draft: stray, draftListingId: "d1", packageTier: "basic" });
    assert.ok(parsed.ok, "a legacy draft with stray video keys still publishes as photos-only");
    const insert = draftToComidaLocalPublicListingInsert(fullDraft(), "s", { ownerUserId: null, draftListingId: "d1", packageTier: "basic" });
    assert.ok(!Object.keys(insert).some((k) => /video/i.test(k)));
    assert.ok(!Object.keys(insert.listing_json).some((k) => /video/i.test(k)));
    // A hydrated legacy row whose listing_json carries stray video keys also loads fine and drops them.
    const row = { id: "r", slug: "s", draft_listing_id: "d1", listing_json: stray };
    const hyd = comidaLocalEditHydrationFromRow(row, "r");
    assert.ok(hyd.ok && !Object.keys(hyd.draft).some((k) => /video/i.test(k)));
  });

  // ══ B. LEGACY HYDRATION ═══════════════════════════════════════════════════════════════════════
  check("B1: reverse mapper round trip — forward(draft) -> columns -> reverse gives the same column-backed fields", () => {
    const draft = fullDraft();
    const row = legacyRow(draft);
    const back = comidaLocalDraftFromLegacyRowColumns(row);
    assert.ok(back.ok);
    if (!back.ok) return;
    for (const f of COLUMN_BACKED_FIELDS) {
      assert.deepEqual(back.draft[f], draft[f], `field ${f}`);
    }
  });

  check("B2: fields the columns do not hold stay at empty-draft defaults (nothing fabricated)", () => {
    const back = comidaLocalDraftFromLegacyRowColumns(legacyRow());
    assert.ok(back.ok);
    if (!back.ok) return;
    const empty = createEmptyComidaLocalDraft();
    for (const k of ["smsPhone", "email", "businessType", "businessAddressLine", "mobileOrderLinkUrl", "eventScheduleNote", "locationUpdatedAt"] as const) {
      assert.equal(back.draft[k], empty[k], k);
    }
    assert.deepEqual(back.draft.highlights, []);
    assert.deepEqual(back.draft.additionalWebsites, []);
    assert.deepEqual(back.draft.weeklyHours, {});
    assert.equal(back.draft.showAddressPublicly, false);
  });

  check("B3: minimum — each missing essential (name, que_vendes, city, contact) refuses with a named reason", () => {
    const base = legacyRow();
    const cases: Array<[string, Record<string, unknown>, string]> = [
      ["no business_name", { business_name: "  " }, "business_name"],
      ["no que_vendes", { que_vendes: "" }, "que_vendes"],
      ["no city", { city_display: "", city_canonical: null }, "city"],
      ["no contact", { phone: null, whatsapp: "" }, "contact"],
    ];
    for (const [label, patch, missing] of cases) {
      const r = comidaLocalDraftFromLegacyRowColumns({ ...base, ...patch });
      assert.equal(r.ok, false, label);
      if (!r.ok) assert.ok(r.missing.includes(missing as never), `${label}: ${r.missing.join(",")}`);
    }
    // one city column OR one contact channel is enough.
    assert.ok(comidaLocalDraftFromLegacyRowColumns({ ...base, city_canonical: null }).ok);
    assert.ok(comidaLocalDraftFromLegacyRowColumns({ ...base, phone: null }).ok);
    assert.ok(comidaLocalDraftFromLegacyRowColumns({ ...base, whatsapp: null }).ok);
  });

  check("B4: wrong-typed / hostile column values degrade to empty, never crash, never leak through unfiltered", () => {
    const r = comidaLocalDraftFromLegacyRowColumns({
      ...legacyRow(),
      service_options: "pickup",
      payment_methods: ["cash", "bitcoin"],
      languages: { es: true },
      main_photo: { url: "data:image/png;base64,AAAA" },
      gallery_images: [{ url: "blob:https://x/1" }, img("gallery", 9)],
      price_level: 7,
    });
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.deepEqual(r.draft.serviceOptions, []);
    assert.deepEqual(r.draft.paymentMethods, ["cash"]);
    assert.deepEqual(r.draft.languages, []);
    assert.equal(r.draft.mainPhoto, null, "unsafe image URLs are dropped by the shared normalizer");
    assert.equal(r.draft.galleryImages.length, 1);
    assert.equal(r.draft.priceLevel, "");
  });

  check("B5: shared row mapper — a legacy row (listing_json null/absent/{}) hydrates from columns and keeps the ROW's own draft_listing_id", () => {
    for (const listing_json of [null, undefined, {}, [], "junk"]) {
      const row = { ...legacyRow(), slug: "tacos-el-compa-oakland", draft_listing_id: "draft-col-1", listing_json };
      const res = comidaLocalEditHydrationFromRow(row, "row-1");
      assert.ok(res.ok, `listing_json=${JSON.stringify(listing_json)}`);
      if (!res.ok) continue;
      assert.equal(res.draft.draftListingId, "draft-col-1");
      assert.equal(res.draft.businessName, "Tacos El Compa");
      assert.equal(res.context.draftListingId, "draft-col-1");
      const assisted = comidaLocalDraftFromAssistedBoundRow(row, "row-1");
      assert.ok(assisted);
      assert.equal(assisted!.draftListingId, "draft-col-1");
    }
  });

  check("B6: a usable listing_json still wins over columns (green path untouched)", () => {
    const stored = { ...fullDraft(), businessName: "From JSON", smsPhone: "5105550188" };
    const row = { ...legacyRow(), slug: "s", draft_listing_id: "draft-col-1", listing_json: stored };
    const draft = comidaLocalDraftFromAssistedBoundRow(row, "row-1");
    assert.ok(draft);
    assert.equal(draft!.businessName, "From JSON");
    assert.equal(draft!.smsPhone, "5105550188");
    assert.equal(draft!.draftListingId, "draft-col-1");
  });

  check("B7: too-incomplete legacy rows are REFUSED (never a blank draft) — owner edit + assisted reopen", () => {
    const skeletons: Array<Record<string, unknown>> = [
      { id: "r", slug: "s", draft_listing_id: "d1" },
      { id: "r", slug: "s", draft_listing_id: "d1", listing_json: null, business_name: "Only Name" },
      { id: "r", slug: "s", draft_listing_id: "d1", listing_json: {}, business_name: "", city_display: "Oakland", que_vendes: "x", phone: "5105550100" },
      { id: "r", slug: "s", draft_listing_id: "d1", listing_json: { queVendes: "no name in json" } },
      { ...legacyRow(), slug: "s", draft_listing_id: "", listing_json: null },
      { ...legacyRow(), slug: "", draft_listing_id: "d1", listing_json: null },
    ];
    for (const [i, row] of skeletons.entries()) {
      const res = comidaLocalEditHydrationFromRow(row, "r");
      assert.equal(res.ok, false, `skeleton #${i} must be refused`);
      if (!res.ok) assert.equal(res.reason, "not_editable_legacy_row");
      assert.equal(comidaLocalDraftFromAssistedBoundRow(row, "r"), null, `skeleton #${i} assisted`);
    }
  });

  check("B8: owner-scoped fetch selects every reverse-mapper column (select string kept in sync)", () => {
    const ctx = read("app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts");
    const selectSrc = ctx.slice(ctx.indexOf(".select("), ctx.indexOf('.eq("id", listingId)'));
    for (const c of COMIDA_LOCAL_LEGACY_ROW_COLUMNS) assert.ok(selectSrc.includes(c), `select lacks ${c}`);
    assert.ok(selectSrc.includes("listing_json") && selectSrc.includes("draft_listing_id") && selectSrc.includes("slug"));
  });

  check("B9: FAIL VISIBLE wiring — bilingual notice replaces the form and Save-for-Client, derived from the bound row", () => {
    const n = COMIDA_LOCAL_ASSISTED_REOPEN_UNSAFE_NOTICE;
    for (const s of [n.titleEs, n.titleEn, n.bodyEs, n.bodyEn]) assert.ok(s.length > 20);
    assert.notEqual(n.bodyEs, n.bodyEn);
    const app = read("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
    assert.ok(app.includes("COMIDA_LOCAL_ASSISTED_REOPEN_UNSAFE_NOTICE"));
    const memo = app.slice(app.indexOf("const assistedRowUnsafe"), app.indexOf("const previewIssues"));
    assert.ok(memo.includes('assistedBound.status === "ready"'));
    assert.ok(memo.includes("comidaLocalDraftFromAssistedBoundRow(assistedBound.bound.row, assistedBound.bound.listingId) === null"));
    assert.ok(!memo.includes("shouldHydrate"), "flag must survive markHydrated()");
    const guardAt = app.indexOf("if (assistedRowUnsafe) {");
    const barAt = app.indexOf("<AssistedSaveForClientBar");
    const formReturnAt = app.indexOf("min-h-screen", guardAt + 200);
    assert.ok(guardAt > 0 && barAt > guardAt, "the block returns before the bar is ever rendered");
    assert.ok(formReturnAt > guardAt);
    assert.ok(app.slice(guardAt, barAt).includes('role="alert"'));
    assert.ok(app.slice(guardAt, guardAt + 600).includes("return ("), "early return");
    // Hydration effect no longer applies a blank draft when the mapper returns null.
    const effect = app.slice(app.indexOf('useAssistedBoundRow("comida-local")'), app.indexOf("const assistedRowUnsafe"));
    assert.ok(effect.includes("if (next) {") && effect.includes("setDraft(next)"));
  });

  check("B10: server never applies a blank (name-less) assisted draft to an EXISTING row", () => {
    const route = read("app/api/clasificados/comida-local/publish/route.ts");
    const custodyAt = route.indexOf("listing_not_linked_to_business");
    const guardAt = route.indexOf("assisted_draft_blank_for_existing_row");
    const slugBaseAt = route.indexOf("const slugBase");
    assert.ok(custodyAt > 0 && guardAt > custodyAt && guardAt < slugBaseAt, "guard sits after custody proof, before any write");
    assert.ok(route.slice(custodyAt, guardAt).includes("if (!draft.businessName.trim())"));
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-launch-comida-local-video-legacy-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
