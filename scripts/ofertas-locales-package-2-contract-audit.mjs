import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const files = {
  appCopy: "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  appClient: "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  previewCard: "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
  previewCopy: "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts",
  previewGrid: "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx",
  scanPanel: "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx",
  draftPersistence: "app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts",
  appHelpers: "app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts",
  constants: "app/lib/ofertas-locales/ofertasLocalesConstants.ts",
  formatting: "app/lib/ofertas-locales/ofertasLocalesFormatting.ts",
  previewHelpers: "app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts",
  publicTypes: "app/lib/ofertas-locales/ofertasLocalesTypes.ts",
  publicSearchHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts",
  publicOfferHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts",
  publicOffersRoute: "app/api/ofertas-locales/public-offers/route.ts",
  publicSearchClient: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx",
  publicItemCard: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx",
  publicItemDrawer: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx",
  publicOfferDrawer: "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx",
  publicDetailCopy: "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicDetailCopy.ts",
  ownerDetail: "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
  ownerAi: "app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerAiManageSection.tsx",
  adminList: "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx",
};

const src = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const activeCustomerCopy = [
  src.appCopy,
  src.appClient,
  src.previewCard,
  src.previewCopy,
  src.publicSearchClient,
  src.publicItemCard,
  src.publicItemDrawer,
  src.publicOfferDrawer,
  src.publicDetailCopy,
  src.ownerDetail,
  src.ownerAi,
  src.adminList,
].join("\n");

assert.match(src.constants, /interactive_flyer:[\s\S]*displayPriceUsd:\s*399[\s\S]*durationDays:\s*30[\s\S]*aiIncluded:\s*true/, "Ofertas contract is $399 / 30 days / AI included");
assert.match(src.constants, /coupons:[\s\S]*displayPriceUsd:\s*199[\s\S]*durationDays:\s*30[\s\S]*aiIncluded:\s*true/, "Cupones contract is $199 / 30 days / AI included");
assert.doesNotMatch(activeCustomerCopy, /\$598|598 total|AI add-on|AI addon|complemento AI|agregaste AI|if you added AI|AI Searchable Specials|manual-only|basic non-AI|optional AI package|upgrade to AI/i, "active customer copy must not reintroduce retired commercial language");
assert.match(src.constants, /OFERTAS_LOCALES_APPLICATION_DIGITAL_PRICING_KEYS = \[\s*"digitalCouponListing",\s*"digitalWeeklySpecials",\s*\]/, "active application pricing excludes retired AI add-on key");

assert.match(src.draftPersistence, /legacyPrimaryAdFormatFromStored/, "legacy product keys are normalized");
assert.match(src.draftPersistence, /stored\.productKey[\s\S]*stored\.publishProductKey[\s\S]*stored\.selectedProduct/, "legacy product key fields remain readable");
assert.match(src.appHelpers, /legacy wantsAiSearchableSpecials=false no longer disables AI/, "legacy AI field is compatibility-only");
assert.match(src.appHelpers, /return draft\.wantsAiSearchableSpecials \? draft : \{ \.\.\.draft, wantsAiSearchableSpecials: true \}/, "old AI=false drafts normalize to included AI");

assert.match(src.previewCard, /withClasificadosPublishLang\("\/publicar\/ofertas-locales", resolvedRouteLang, \{ step: 7 \}\)/, "Preview edit URL requests review step");
assert.match(src.appClient, /requestedInitialStep = searchParams\?\.get\("step"\)/, "application reads requested step");
assert.match(src.appClient, /if \(!hasLoadedDraft \|\| initialStepAppliedRef\.current\) return;[\s\S]*setStep\(clampWizardStep\(requested\)\)/, "requested step is applied after hydration and clamped");

assert.match(src.formatting, /looksInternational[\s\S]*return clean/, "international phone display is not forced into US format");
assert.match(src.previewHelpers, /digits\.length === 10[\s\S]*tel:\+1/, "10-digit US phone becomes dial-safe +1 tel href");
assert.match(src.previewHelpers, /digits\.length < 8[\s\S]*return ""/, "incomplete WhatsApp numbers are blocked");
assert.match(src.appClient, /onChange=\{\(e\) => updateDraft\(\{ email: e\.target\.value \}\)\}/, "email is not trimmed while typing");
assert.match(src.appClient, /onBlur=\{\(e\) => updateDraft\(\{ email: normalizeOfertaLocalEmailInput\(e\.target\.value\) \}\)\}/, "email normalizes on blur");
assert.match(src.appClient, /onBlur=\{\(\) => handleUrlBlur\(field\)\}/, "URLs normalize at blur boundary");
assert.doesNotMatch(src.appClient, /onKeyDown=\{[^}]*preventDefault|onKeyPress=\{[^}]*preventDefault|replace\(\/\\s\/g/, "customer text fields do not use destructive key/space handlers");

assert.match(src.publicTypes, /sourceCropHref: string \| null/, "public item type exposes real crop href");
assert.match(src.publicSearchHelpers, /sourceCropHref: getSafeOfertaLocalSourceAssetHref\(row\.source_crop_url\)/, "source_crop_url maps to public item model");
assert.match(src.publicItemCard, /item\.sourceCropHref[\s\S]*item\.sourceAssetHref[\s\S]*onError=\{\(\) => setFailedImageHref\(previewHref\)\}/, "public cards prefer crop and fall back on broken image");
assert.match(src.publicItemDrawer, /item\.sourceCropHref[\s\S]*item\.sourceAssetHref[\s\S]*onError=\{\(\) => setFailedImageHref\(previewHref\)\}/, "public drawer uses same real crop identity and fallback");
assert.match(src.publicSearchHelpers, /sourcePage: row\.source_page/, "source page remains projected");
assert.match(src.publicSearchHelpers, /sourceBbox: parseOfertaLocalPublicSourceBbox\(row\.source_bbox\)/, "source bbox remains available for detail hub overlays");

assert.match(src.publicOffersRoute, /coupon_text/, "Cupones public offers include stored terms/details");
assert.match(src.publicOfferHelpers, /description: sanitizeText\(row\.description, 8000\)/, "coupon description is projected safely");
assert.match(src.publicOfferHelpers, /couponText: sanitizeText\(row\.coupon_text, 4000\)/, "coupon terms are projected safely");
assert.match(src.publicOfferDrawer, /active: "Active"[\s\S]*upcoming: "Upcoming"[\s\S]*expired: "Expired"/, "coupon active/upcoming/expired EN states exist");
assert.match(src.publicOfferDrawer, /active: "Activo"[\s\S]*upcoming: "Próximo"[\s\S]*expired: "Vencido"/, "coupon active/upcoming/expired ES states exist");
assert.match(src.publicOfferDrawer, /whitespace-pre-wrap break-words/, "coupon long terms and line breaks remain accessible");
assert.doesNotMatch(src.publicOfferDrawer, /addToList|shoppingList|quantity|claim|redeem|redemption code/i, "Cupones drawer has no cart/list/claim controls");
assert.match(src.publicSearchClient, /const floatingShoppingListCart = !isCupones \?/, "Cupones surface does not render shopping-list cart");
assert.match(src.publicSearchClient, /\{!isCupones && selectedItem \?/, "Cupones surface does not open product shopping-list drawer");

assert.match(src.ownerDetail, /AI analysis included|Análisis con IA incluido/, "owner dashboard uses included AI wording");
assert.match(src.ownerAi, /AI analysis is included|análisis con IA está incluido/, "owner AI manager uses included analysis wording");
assert.match(src.adminList, /Análisis con IA incluido|IA incluida/, "admin review uses included AI wording");

console.log("Package 2 Ofertas/Cupones contract audit passed.");
