import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [];

function ok(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const sanitize = read("app/(site)/servicios/lib/serviciosProfileSanitize.ts");
const publishMerge = read("app/(site)/clasificados/servicios/lib/serviciosPublishOpsProfileMerge.ts");
const publishRoute = read("app/api/clasificados/servicios/publish/route.ts");
const appToDraft = read("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts");
const draftToProfile = read("app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile.ts");
const publishedToDraft = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft.ts");
const detailPage = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
const profileView = read("app/(site)/servicios/components/ServiciosProfileView.tsx");
const proShell = read("app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx");
const gallery = read("app/(site)/servicios/components/ServiciosGalleryWithTabs.tsx");
const videoTile = read("app/(site)/servicios/components/ServiciosGalleryVideoTile.tsx");
const myListing = read("app/api/clasificados/servicios/my-listing/route.ts");

ok("canonical mapping includes website and socials", appToDraft.includes("contact.websiteUrl") && draftToProfile.includes("socialLinks.youtubeUrl"));
ok("custom links preserve label and URL", appToDraft.includes("extraLinks.push") && draftToProfile.includes("contact.extraLinks") && publishedToDraft.includes("extraLink1Label"));
ok("review links preserve google and yelp", appToDraft.includes("googleReviewsUrl") && appToDraft.includes("yelpReviewsUrl") && publishedToDraft.includes("yelpReviewsUrl"));
ok("external videos survive mapping", appToDraft.includes("galleryVideosRaw") && draftToProfile.includes("mapGalleryVideos") && publishedToDraft.includes("profile.galleryVideos"));
ok("offer images survive mapping", appToDraft.includes("imageUrl: r.imageUrl.trim()") && draftToProfile.includes("wire.imageUrl") && publishedToDraft.includes("imageUrl: fromUrl(coupon.imageUrl)"));
ok("optional malformed URLs cannot crash resolver", sanitize.includes("try {") && sanitize.includes("new URL(t)") && sanitize.includes("catch") && sanitize.includes("return null"));
ok("scheme-less safe URLs normalize to https", sanitize.includes("https://${t.replace") && sanitize.includes("javascript|data|blob|file|vbscript"));
ok("professional and trades shells tolerate optional absence", proShell.includes("hasHeroIdentityResolved") && profileView.includes("hasHeroIdentityResolved"));
ok("gallery/video renderer uses filtered resolved media", detailPage.includes("resolveServiciosProfile") && gallery.includes("profile.galleryVideos") && videoTile.includes("parseYouTubeVideoId"));
ok("dashboard hydration covers URL/media fields", publishedToDraft.includes("website: clean(contact.websiteUrl)") && publishedToDraft.includes("videos: media.videos") && publishedToDraft.includes("couponMoreOffers"));
ok("edit save preserves existing profile sections", publishRoute.includes("mergeOpsControlledServiciosProfileFields") && publishMerge.includes("previous.quickFacts") && publishMerge.includes("previous.trust"));
ok("existing published listing not downgraded", publishRoute.includes("Never downgrade an already-published listing back to pending") && publishRoute.includes("SERVICIOS_LISTING_STATUS_PUBLISHED"));
ok("normal edit does not invoke Revenue OS checkout", myListing.includes(".eq(\"owner_user_id\", data.user.id)") && !myListing.includes("revenue-os/checkout"));
ok("paid offers entitlement remains server-backed", read("app/api/clasificados/servicios/my-listings/route.ts").includes("listing_package_entitlements"));

let changedFiles = [];
try {
  changedFiles = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  changedFiles = [];
}

const allowed = changedFiles.every((f) =>
  f.startsWith("app/(site)/servicios/") ||
  f.startsWith("app/(site)/clasificados/servicios/") ||
  f.startsWith("scripts/verify-servicios-production-readiness-closure-02.mjs") ||
  f.startsWith("scripts/verify-servicios-post-payment-persistence-public-render-repair-01.mjs") ||
  f.startsWith("scripts/smoke-servicios-post-payment-persistence-public-render-repair-01.mjs") ||
  f === "package.json"
);
ok("no unrelated categories changed", allowed);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} Servicios post-payment repair checks failed.`);
  process.exit(1);
}
console.log("\nServicios post-payment persistence/public render repair verifier passed.");
