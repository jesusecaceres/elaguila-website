/**
 * SERVICIOS LIVE LAUNCH PERFECTION — Wave 2 (⚠️4 / ⚠️5 / ⚠️6), 2026-09-13.
 *
 * ⚠️4  Rapid multi-URL entry. Autos owned the only bulk "paste several links" parser; the algorithm
 *      moved verbatim to the shared media module (parseBulkExternalVideoUrls) and Autos now delegates
 *      to it. Servicios adopts it with ONE entry normaliser shared by single-add and bulk paste.
 * ⚠️5  One canonical video cap (8): the application constant, the public gallery cap and the media
 *      contract must agree, and the application's hint copy derives from the constant.
 * ⚠️6  Video helper copy is truthful: videos are external links only.
 *
 * Execution-first: the shared parser, the Autos wrapper, the Servicios normaliser and the video-list
 * normaliser are executed against fixtures. Source assertions then pin the adoption points.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-video-bulk-entry.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  parseBulkExternalVideoUrls,
  splitPastedExternalVideoUrls,
} from "../app/lib/media/externalVideoUrlValidation";
import {
  AUTOS_MAX_EXTERNAL_VIDEO_URLS,
  normalizeAutosExternalVideoUrl,
  parseBulkAutosExternalVideoUrls,
} from "../app/lib/clasificados/autos/autosExternalVideoUrlValidation";
import {
  normalizeServiciosApplicationVideos,
  normalizeServiciosExternalVideoUrlForEntry,
  SERVICIOS_MAX_VIDEO_URLS,
  type VideoItem,
} from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { getClasificadosServiciosCopy } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy";
import { MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS } from "../app/(site)/servicios/lib/serviciosGalleryVideoCaps";
import { LANE_MEDIA_REGISTRY } from "../app/lib/media/listingMediaConfigs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const src = (rel: string) => stripComments(raw(rel));

const APP_COMPONENT =
  "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const SERVICIOS_OPTS = { normalize: normalizeServiciosExternalVideoUrlForEntry, max: SERVICIOS_MAX_VIDEO_URLS };

/* ==============================================================================================
 * ⚠️4 — shared parser semantics (the exact Autos algorithm).
 * ============================================================================================ */
check("⚠️4 split: newline, comma and whitespace separators; blanks dropped", () => {
  assert.deepEqual(
    splitPastedExternalVideoUrls("https://a.test/1\nhttps://a.test/2, https://a.test/3   https://a.test/4\n\n"),
    ["https://a.test/1", "https://a.test/2", "https://a.test/3", "https://a.test/4"],
  );
  assert.deepEqual(splitPastedExternalVideoUrls("   \n , "), []);
});
check("⚠️4 Servicios bulk: 10 pasted (2 invalid, 1 duplicate) with cap 8 → truthful counters", () => {
  const pasted = [
    "https://youtube.com/shorts/1",
    "http://youtube.com/shorts/2", // http — rejected by the strict validator
    "https://youtube.com/shorts/3",
    "https://youtube.com/shorts/1", // duplicate within the batch
    "not-a-url", // invalid
    "https://youtube.com/shorts/4",
    "https://youtube.com/shorts/5",
    "https://youtube.com/shorts/6",
    "https://youtube.com/shorts/7",
    "https://youtube.com/shorts/8",
  ].join("\n");
  const result = parseBulkExternalVideoUrls(pasted, [], SERVICIOS_OPTS);
  assert.equal(result.added.length, 7, "7 unique valid links");
  assert.equal(result.skippedInvalid, 2);
  assert.equal(result.skippedDuplicate, 1);
  assert.equal(result.skippedLimit, 0);
  assert.ok(result.added.every((u) => u.startsWith("https://")));
});
check("⚠️4 Servicios bulk: existing 6 + 4 pasted → 2 added, 2 skipped by the limit of 8", () => {
  const existing = Array.from({ length: 6 }, (_, i) => `https://vimeo.com/${i}`);
  const pasted = Array.from({ length: 4 }, (_, i) => `https://vimeo.com/new-${i}`).join(" ");
  const result = parseBulkExternalVideoUrls(pasted, existing, SERVICIOS_OPTS);
  assert.equal(result.added.length, 2);
  assert.equal(result.skippedLimit, 2);
  assert.equal(result.skippedInvalid, 0);
  assert.equal(result.skippedDuplicate, 0);
});
check("⚠️4 Servicios bulk: duplicates of EXISTING links are skipped case-insensitively", () => {
  const result = parseBulkExternalVideoUrls(
    "https://YouTube.com/watch?v=abc\nhttps://youtube.com/watch?v=xyz",
    ["https://youtube.com/watch?v=abc"],
    SERVICIOS_OPTS,
  );
  assert.deepEqual(result.added, ["https://youtube.com/watch?v=xyz"]);
  assert.equal(result.skippedDuplicate, 1);
});
check("⚠️4 Servicios bulk: at the cap every valid link is reported as skippedLimit, none dropped silently", () => {
  const existing = Array.from({ length: SERVICIOS_MAX_VIDEO_URLS }, (_, i) => `https://tiktok.com/@x/video/${i}`);
  const result = parseBulkExternalVideoUrls("https://tiktok.com/@x/video/new", existing, SERVICIOS_OPTS);
  assert.deepEqual(result, { added: [], skippedInvalid: 0, skippedDuplicate: 0, skippedLimit: 1 });
});
check("⚠️4 Servicios entry normaliser = single-add semantics (strict https + web-URL sanity)", () => {
  assert.equal(normalizeServiciosExternalVideoUrlForEntry("https://youtube.com/shorts/1"), "https://youtube.com/shorts/1");
  assert.equal(normalizeServiciosExternalVideoUrlForEntry("  https://vimeo.com/9  "), "https://vimeo.com/9");
  assert.equal(normalizeServiciosExternalVideoUrlForEntry("http://youtube.com/shorts/1"), null, "http rejected");
  assert.equal(normalizeServiciosExternalVideoUrlForEntry("youtube.com/shorts/1"), null, "scheme-less rejected");
  assert.equal(normalizeServiciosExternalVideoUrlForEntry("data:video/mp4;base64,AAAA"), null, "data: rejected");
  assert.equal(normalizeServiciosExternalVideoUrlForEntry("blob:https://leonixmedia.com/abc"), null, "blob: rejected");
  assert.equal(normalizeServiciosExternalVideoUrlForEntry(""), null);
});

/* ==============================================================================================
 * ⚠️4 — Autos parity: the wrapper is the shared parser with the Autos normaliser and cap.
 * ============================================================================================ */
check("⚠️4 Autos wrapper ≡ shared parser on mixed fixtures (added, invalid, duplicate, limit)", () => {
  const fixtures: Array<[string, string[]]> = [
    ["https://a.test/1\nhttp://a.test/2, https://a.test/1 junk https://a.test/3", []],
    ["https://b.test/x https://B.test/x https://b.test/y", ["https://b.test/y", "https://b.test/Y"]],
    [
      Array.from({ length: 12 }, (_, i) => `https://c.test/${i}`).join("\n"),
      ["https://c.test/100", "not-a-url", "https://c.test/101"],
    ],
    ["", ["https://d.test/1"]],
  ];
  for (const [pasted, existing] of fixtures) {
    assert.deepEqual(
      parseBulkAutosExternalVideoUrls(pasted, existing),
      parseBulkExternalVideoUrls(pasted, existing, {
        normalize: normalizeAutosExternalVideoUrl,
        max: AUTOS_MAX_EXTERNAL_VIDEO_URLS,
      }),
    );
  }
});
check("⚠️4 Autos wrapper: pre-change expected outputs still hold (behaviour byte-identical)", () => {
  const r1 = parseBulkAutosExternalVideoUrls("https://a.test/1\nhttp://a.test/2, https://a.test/1 junk https://a.test/3", []);
  assert.deepEqual(r1, { added: ["https://a.test/1", "https://a.test/3"], skippedInvalid: 2, skippedDuplicate: 1, skippedLimit: 0 });
  const r2 = parseBulkAutosExternalVideoUrls(
    Array.from({ length: 12 }, (_, i) => `https://c.test/${i}`).join("\n"),
    ["https://c.test/100", "not-a-url", "https://c.test/101"],
  );
  assert.equal(r2.added.length, AUTOS_MAX_EXTERNAL_VIDEO_URLS - 2, "existing 2 valid + 6 added = cap 8");
  assert.equal(r2.skippedLimit, 6);
  assert.equal(r2.skippedInvalid, 0, "an invalid EXISTING entry is ignored, never counted as a pasted error");
});
check("⚠️4 Autos source: wrapper delegates to the shared engine; Autos UI consumer untouched", () => {
  const autos = src("app/lib/clasificados/autos/autosExternalVideoUrlValidation.ts");
  assert.ok(autos.includes("parseBulkExternalVideoUrls(raw, existingUrls, {"), "wrapper delegates");
  assert.ok(autos.includes("normalize: normalizeAutosExternalVideoUrl"));
  assert.ok(autos.includes("max: AUTOS_MAX_EXTERNAL_VIDEO_URLS"));
  assert.ok(!/remainingCapacity/.test(autos), "no second copy of the algorithm left in Autos");
  const field = src("app/(site)/publicar/autos/shared/components/AutosExternalVideoUrlsField.tsx");
  assert.ok(field.includes("parseBulkAutosExternalVideoUrls(bulkDraft, urls)"), "Autos field still calls its wrapper");
});

/* ==============================================================================================
 * ⚠️4 — Servicios adoption points (source).
 * ============================================================================================ */
check("⚠️4 Servicios application: bulk paste wired through the shared parser + shared normaliser; single-add kept", () => {
  // raw(): the component is ~3.8k lines with regex/string literals that defeat the comment stripper.
  const app = raw(APP_COMPONENT);
  assert.ok(app.includes(`import { parseBulkExternalVideoUrls } from "@/app/lib/media/externalVideoUrlValidation"`));
  assert.ok(app.includes("const addVideoUrl = () => {"), "single-add path preserved");
  assert.ok(app.includes("const addVideoUrlsBulk = () => {"), "bulk path added");
  assert.equal((app.match(/normalizeServiciosExternalVideoUrlForEntry\(/g) ?? []).length, 2, "single-add + legacy-row count call the ONE normaliser");
  assert.ok(app.includes("normalize: normalizeServiciosExternalVideoUrlForEntry"), "bulk parser is handed the same normaliser");
  assert.ok(!app.includes("normalizeStrictExternalVideoUrl("), "the component no longer hand-rolls the validator chain");
  assert.ok(app.includes("copy.labels.videoBulkToggle"), "bulk toggle rendered");
  assert.ok(app.includes("onClick={addVideoUrlsBulk}"), "bulk add CTA wired");
  assert.ok(app.includes(".slice(0, SERVICIOS_MAX_VIDEO_URLS)"), "bulk updater is capped defensively too");
});

/* ==============================================================================================
 * ⚠️5 — one canonical cap.
 * ============================================================================================ */
check("⚠️5 cap lockstep: application constant = public gallery cap = media contract = 8", () => {
  assert.equal(SERVICIOS_MAX_VIDEO_URLS, 8);
  assert.equal(MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS, SERVICIOS_MAX_VIDEO_URLS);
  const lane = LANE_MEDIA_REGISTRY.find((r) => r.pipeline === "servicios" && r.lane === "default");
  assert.ok(lane, "servicios/default media lane");
  assert.equal(lane!.maxExternalVideos, SERVICIOS_MAX_VIDEO_URLS);
});
check("⚠️5 normalizeServiciosApplicationVideos caps at the constant and keeps one primary", () => {
  const nine: VideoItem[] = Array.from({ length: 9 }, (_, i) => ({ id: `v${i}`, url: `https://vimeo.com/${i}`, source: "url" }));
  const out = normalizeServiciosApplicationVideos(nine);
  assert.equal(out.length, SERVICIOS_MAX_VIDEO_URLS);
  assert.equal(out.filter((v) => v.isPrimary).length, 1);
  assert.equal(out[0]!.isPrimary, true);
});
check("⚠️5 hint copy derives the cap from the constant (no retyped literal) in both locales", () => {
  for (const lang of ["es", "en"] as const) {
    const hint = getClasificadosServiciosCopy(lang).labels.videosHint;
    assert.ok(hint.includes("{max}"), `${lang}: videosHint uses {max}`);
    assert.ok(!/\b8\b/.test(hint), `${lang}: videosHint carries no literal 8`);
    assert.ok(!/\b4\b/.test(hint), `${lang}: videosHint carries no stale 4`);
  }
  const app = raw(APP_COMPONENT);
  const uses = (app.match(/copy\.labels\.videosHint/g) ?? []).length;
  const replaced = (app.match(/copy\.labels\.videosHint\.replace\("\{max\}", String\(SERVICIOS_MAX_VIDEO_URLS\)\)/g) ?? []).length;
  assert.ok(uses >= 2, "hint is rendered in the media step and in the rules summary");
  assert.equal(replaced, uses, "EVERY videosHint consumer substitutes {max} from the constant");
  const types = raw("app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes.ts");
  assert.ok(
    types.includes("Normalize video list for storage/preview (up to SERVICIOS_MAX_VIDEO_URLS"),
    "video-list normaliser doc no longer claims the stale 'up to 4' cap",
  );
});

/* ==============================================================================================
 * ⚠️6 — helper copy is truthful: external links only.
 * ============================================================================================ */
check("⚠️6 video helper says links-only and no longer implies uploads are an option", () => {
  const es = getClasificadosServiciosCopy("es").labels;
  const en = getClasificadosServiciosCopy("en").labels;
  assert.ok(/enlaces externos/.test(es.videosHelper) && /no se suben archivos/.test(es.videosHelper), es.videosHelper);
  assert.ok(/external links/.test(en.videosHelper) && /not uploaded/.test(en.videosHelper), en.videosHelper);
  assert.ok(!/Recomendado/.test(es.videosHelper) && !/Recommended/.test(en.videosHelper), "no 'recommended' hedge");
  for (const labels of [es, en]) {
    for (const key of ["videoBulkToggle", "videoBulkCancel", "videoBulkPlaceholder", "videoBulkHelper", "videoBulkAdd", "videoBulkEmpty", "videoBulkAddedOne", "videoBulkAddedMany", "videoBulkInvalid", "videoBulkDuplicate", "videoBulkLimit"] as const) {
      assert.ok(typeof labels[key] === "string" && labels[key].length > 0, `${key} present`);
    }
    assert.ok(labels.videoBulkLimit.includes("{max}"), "limit summary derives the cap");
  }
});

if (failures.length) {
  console.error(`\nverify-servicios-video-bulk-entry: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-servicios-video-bulk-entry: PASS");
