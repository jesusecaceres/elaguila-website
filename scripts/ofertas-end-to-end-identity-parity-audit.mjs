import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const types = readRepoFile("app/lib/ofertas-locales/ofertasLocalesTypes.ts");
const publishMapper = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts");
const scanPanel = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx");
const preview = readRepoFile("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx");
const publicSearch = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const publicDetail = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const owner = readRepoFile("app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts");
const admin = readRepoFile("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");
const renewal = readRepoFile("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");

for (const required of [
  "ofertaLocalId",
  "leonixAdId",
  "sourceAssetVersionId",
  "sourceLifecycleStatus",
  "publicSourceAssetId",
  "primaryAdFormat",
  "commercialProductKey",
  "renewal",
]) {
  assertIncludes("identity continuity", types + publishMapper + scanPanel + preview + publicSearch + publicDetail + owner + admin + renewal, required);
}

assertIncludes("public child identity", publicSearch, "id: row.id");
assertIncludes("public parent identity", publicSearch, "ofertaLocalId: parent.id");
assertIncludes("offer parent identity", publicDetail, "id: row.id");

pass("Package 10 identity parity preserves parent, Leonix ID, product key, source version, child item, owner/admin/public, and renewal contracts");
