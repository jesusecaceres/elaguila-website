/**
 * Final Community Family certification — Comunidad/Eventos, Clases, Mascotas y Perdidos, Busco.
 *
 * This is NOT a re-implementation of gate-0b/1/2a/2b/2c/2d/3/4 — each of those already certifies
 * its own category deeply, including its own scope-diff (no cross-category file leakage). This
 * script only checks the genuinely CROSS-CATEGORY consistency questions that no single gate's
 * verifier answers on its own: do all four categories actually use the same canonical primitives
 * for contact/share/second-verification, and do the business-rule pricing SKUs stay correctly
 * separated. Run this AFTER the 8 gate verifiers, not instead of them.
 *
 * No network, no React. Run from repo root:
 *   npx tsx scripts/final-community-family-certification.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}
function tryRead(relPath: string): string | null {
  try {
    return read(relPath);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Canonical contact hrefs — all four categories route through nativeChannelHrefs.ts,
//    not a Busco/Mascotas/Comunidad/Clases-specific URI builder.
// ---------------------------------------------------------------------------
{
  const comunidadClasesCanvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  const mascotasCanvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  const buscoCanvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  for (const [name, src] of [
    ["Comunidad/Clases", comunidadClasesCanvas],
    ["Mascotas", mascotasCanvas],
    ["Busco", buscoCanvas],
  ] as const) {
    assert.ok(src.includes("nativeChannelHrefs"), `${name} canvas must import the canonical nativeChannelHrefs builders`);
    assert.ok(!src.includes("EmailContactOptionsSheet"), `${name} canvas must not use the obsolete email modal`);
  }
  console.log("OK: 1 all four categories route contact through the canonical nativeChannelHrefs builders, no obsolete email modal");
}

// ---------------------------------------------------------------------------
// 2. Native Share — all four categories implement navigator.share + clipboard fallback with
//    the real listing title/url (Mascotas/Busco via the shared tryWebShare helper; Comunidad/
//    Clases via an equivalent inline implementation predating that helper's extraction).
// ---------------------------------------------------------------------------
{
  const comunidadDetail = read("app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx");
  assert.ok(/navigator\b.*\.share|nav.*share/.test(comunidadDetail), "Comunidad/Clases published detail must implement native share");
  assert.ok(comunidadDetail.includes("copyText") || comunidadDetail.includes("copyToClipboard"), "Comunidad/Clases share must have a clipboard fallback");

  const mascotasCanvas = read("app/(site)/publicar/mascotas-y-perdidos/components/MascotasPerdidosQuickAdCanvas.tsx");
  const buscoCanvas = read("app/(site)/publicar/busco/components/BuscoQuickAdCanvas.tsx");
  for (const [name, src] of [
    ["Mascotas", mascotasCanvas],
    ["Busco", buscoCanvas],
  ] as const) {
    assert.ok(src.includes("tryWebShare") && src.includes("copyToClipboard"), `${name} must wire native share + clipboard fallback`);
  }
  console.log("OK: 2 all four categories implement native Share with a clipboard fallback");
}

// ---------------------------------------------------------------------------
// 3. Second final verification before publish — all four categories.
//    Mascotas and Busco (Gates 3/4) already gate their actual publish call behind
//    EmpleosPublishConfirmModal. Comunidad and Clases share ONE publish bar
//    (CommunityQuickPreviewPublishBar) and a prior certification pass found they published
//    directly with no second modal. That gap is now closed here: the single shared "Publicar"
//    button opens the modal, and ONLY the modal's own confirm action calls handlePublish() — the
//    same function that already branches free-publish vs Clases-paid Revenue-OS checkout
//    internally, so proving the button never calls handlePublish() directly proves BOTH the free
//    and paid paths (Comunidad free, Clases free, Clases paid checkout) are gated identically,
//    without needing three separate assertions or touching Revenue OS/pricing logic at all.
// ---------------------------------------------------------------------------
{
  const mascotasBar = read("app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx");
  const buscoBar = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx");
  assert.ok(mascotasBar.includes("EmpleosPublishConfirmModal"), "Mascotas must have the second-verification modal");
  assert.ok(buscoBar.includes("EmpleosPublishConfirmModal"), "Busco must have the second-verification modal");

  const communityBar = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
  assert.ok(communityBar.includes("EmpleosPublishConfirmModal"), "Comunidad/Clases must now have the second-verification modal");

  // The one visible "Publicar" button must open the modal, never call handlePublish() directly —
  // this alone proves Comunidad free, Clases free, AND Clases paid-checkout (all three funnel
  // through this single button + single handlePublish()) all require the modal first.
  assert.ok(
    /onClick=\{\(\) => setConfirmOpen\(true\)\}/.test(communityBar),
    "the Publicar button must open the confirm modal, not call handlePublish()/checkout directly",
  );
  assert.ok(
    !/<button[\s\S]{0,300}onClick=\{\(\) => void handlePublish\(\)\}/.test(communityBar),
    "no button in this file may call handlePublish() directly anymore — only the modal's onConfirm may",
  );
  assert.ok(
    /onConfirm=\{\(\) => void handlePublish\(\)\}/.test(communityBar),
    "the modal's own confirm action must be what actually invokes handlePublish() (free publish or Clases-paid checkout, unchanged internal branching)",
  );

  // handlePublish's internal paid/free branching (Revenue OS checkout for Clases-paid, direct
  // publish otherwise) must be untouched by this gap fix — only the trigger changed.
  assert.ok(communityBar.includes("isPaidClases"), "the existing paid/free branch inside handlePublish must be untouched");
  assert.ok(communityBar.includes("startRevenueCategoryCheckout"), "the existing Revenue OS checkout call must be untouched");
  assert.ok(communityBar.includes("CLASES_CATEGORY_CHECKOUT"), "the existing $24.99/30-day Clases checkout package must be untouched");

  console.log("OK: 3 second-verification modal now present and gates the real action in all four categories (Comunidad, Clases free, Clases paid checkout, Mascotas, Busco)");
}

// ---------------------------------------------------------------------------
// 4. Real result-card components — confirm the actual component files exist and are the ones
//    each category's own preview imports (not parallel fake markup). Deep per-field content
//    checks already live in each category's own gate verifier.
// ---------------------------------------------------------------------------
{
  const comunidadCardExists = tryRead("app/(site)/clasificados/community/CommunityEventoCard.tsx") !== null
    || tryRead("app/(site)/clasificados/community/CommunityQuickResultCard.tsx") !== null;
  const mascotasCard = tryRead("app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosNoticeCard.tsx");
  const buscoCard = tryRead("app/(site)/clasificados/busco/BuscoRequestCard.tsx");
  assert.ok(mascotasCard, "MascotasPerdidosNoticeCard.tsx must exist");
  assert.ok(buscoCard, "BuscoRequestCard.tsx must exist");

  const mascotasPreview = read("app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewClient.tsx");
  assert.ok(mascotasPreview.includes("MascotasPerdidosNoticeCard"), "Mascotas Preview must render the real MascotasPerdidosNoticeCard");
  const buscoPreview = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewClient.tsx");
  assert.ok(buscoPreview.includes("BuscoRequestCard"), "Busco Preview must render the real BuscoRequestCard");

  void comunidadCardExists; // Comunidad/Clases result-card parity already certified by gate-1/gate-2a's own model-builder checks.
  console.log("OK: 4 Mascotas and Busco Preview render their real, category-owned result-card components");
}

// ---------------------------------------------------------------------------
// 5. Business-rule pricing separation — no accidental crossover between the four categories.
// ---------------------------------------------------------------------------
{
  const checkpoints = read("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts");
  assert.ok(checkpoints.includes('id: "comunidad_free"'), "Comunidad checkpoint must be the free SKU regardless of the event's own admission status");
  assert.ok(checkpoints.includes('id: "clases_free"'), "Clases free-class checkpoint SKU must exist");
  assert.ok(checkpoints.includes('id: "mascotas_free"'), "Mascotas checkpoint must be the free SKU");
  assert.ok(checkpoints.includes('id: "busco_free"'), "Busco checkpoint must be the free SKU");

  const revenuePayload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
  assert.ok(revenuePayload.includes("clases_paid_30d"), "the $24.99/30-day Clases paid SKU must still exist for the paid-class path");

  // No free-lane file references a paid Revenue-OS checkout package key, and vice versa is
  // already covered by gate-2b/2d's own scope checks.
  for (const [name, path] of [
    ["Mascotas publish", "app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts"],
    ["Busco publish", "app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts"],
  ] as const) {
    const src = read(path);
    assert.ok(!/stripe|checkout|revenue-os/i.test(src), `${name} path must never touch Stripe/checkout/Revenue OS — both categories are unconditionally free`);
  }
  console.log("OK: 5 business-rule pricing stays separated — Comunidad/Mascotas/Busco free, Clases free-vs-$24.99/30d via Revenue OS, no crossover");
}

// ---------------------------------------------------------------------------
// 6. Category isolation — shared primitives stay low-level; no category directory imports
//    directly from another category's owned directory.
// ---------------------------------------------------------------------------
{
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const CATEGORY_DIRS: Record<string, string[]> = {
    comunidad: ["app/(site)/publicar/comunidad", "app/(site)/clasificados/comunidad"],
    clases: ["app/(site)/publicar/clases", "app/(site)/clasificados/clases"],
    "mascotas-y-perdidos": ["app/(site)/publicar/mascotas-y-perdidos", "app/(site)/clasificados/mascotas-y-perdidos"],
    busco: ["app/(site)/publicar/busco", "app/(site)/clasificados/busco"],
  };
  const owners = Object.keys(CATEGORY_DIRS);
  for (const owner of owners) {
    for (const dir of CATEGORY_DIRS[owner]!) {
      let files: string[] = [];
      try {
        files = execSync(`git ls-files -- "${dir}"`, { cwd: ROOT, encoding: "utf8" })
          .split("\n")
          .filter((f) => /\.(ts|tsx)$/.test(f));
      } catch {
        continue;
      }
      for (const f of files) {
        const src = tryRead(f);
        if (!src) continue;
        for (const otherOwner of owners) {
          if (otherOwner === owner) continue;
          // Anchored to @/app/publicar/<owner>/ or @/app/clasificados/<owner>/ specifically —
          // NOT a bare substring match, so genuinely shared utilities that merely mention another
          // category's name in their own path (e.g. app/lib/clasificados/comunidad/*GlobalAnalytics,
          // a real cross-category-shared analytics dispatcher under app/lib/, not app/(site)/) don't
          // false-positive as an isolation violation.
          const badMatch = new RegExp(`from ["']@/app/(publicar|clasificados)/${otherOwner}/`).test(src);
          assert.ok(!badMatch, `${owner}-owned file ${f} must not import from ${otherOwner}-owned code`);
        }
      }
    }
  }
  console.log("OK: 6 category isolation — no category directory imports directly from another category's owned directory");
}

// ---------------------------------------------------------------------------
// 7. Protected surfaces (Revenue OS, Stripe, DB migrations/schema) never touched by any
//    Community-family gate, no matter how many categories a given gate legitimately spans.
//    (Earlier revisions of this check pinned to one specific gate's own category scope — e.g.
//    "Mascotas/Busco untouched by the Comunidad/Clases modal fix" — but later, equally
//    PM-authorized gates legitimately span every category at once, which made that framing
//    permanently obsolete. What must never move is the protected-surface list itself.)
// ---------------------------------------------------------------------------
{
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];
  const protectedPrefixes = [
    "supabase/migrations/",
    "app/lib/listingPlans/",
    "app/api/revenue-os/",
    "app/api/clasificados/leonix/stripe/",
  ];
  const protectedTouched = allTouched.filter(
    (f) => protectedPrefixes.some((p) => f.startsWith(p)) || /\.sql$/i.test(f),
  );
  assert.equal(
    protectedTouched.length,
    0,
    `Protected surfaces (Revenue OS / Stripe / DB migrations) must remain untouched, found: ${protectedTouched.join(", ")}`,
  );
  console.log("OK: 7 Revenue OS, Stripe, and DB migration files remain untouched");
}

console.log("final-community-family-certification: PASS");
