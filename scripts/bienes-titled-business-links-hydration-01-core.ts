/**
 * NODE FIXTURE INTEGRATION — Bienes titled additional business links lifecycle.
 */
import {
  normalizeBusinessExtraLinks,
  sanitizeBusinessExtraLinksForDraft,
  durableBusinessExtraLinks,
  businessLinkPublicLabel,
  businessLinkHref,
  businessExtraLinksToPreviewCtas,
  parsePublishedBusinessExtraLinks,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/bienesAdditionalBusinessLinks";
import {
  createEmptyAgenteIndividualResidencialFormState,
  mergePartialAgenteIndividualResidencial,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { additionalBusinessLinks } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat";
import { mapAgenteResidencialFormStateToNegocioForPublish } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";
import { buildBusinessMetaJsonFromBienesRaicesNegocioState } from "../app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, field: string) {
  assert(a === b, `${field}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

const LEGACY_MIXED = [
  "https://legacy.example.com",
  { url: "https://reviews.example.com" },
  { title: "Agent Portfolio", url: "https://portfolio.example.com" },
];

const normalizedLegacy = normalizeBusinessExtraLinks(LEGACY_MIXED, 2);
assert(normalizedLegacy.length === 2, "legacy mix caps at max 2 with order preserved");
eq(normalizedLegacy[0]?.url, "https://legacy.example.com", "legacy string url 1");
eq(normalizedLegacy[0]?.title, "", "legacy string empty title");
eq(normalizedLegacy[1]?.url, "https://reviews.example.com", "legacy object url");
eq(normalizedLegacy[1]?.title, "", "legacy object empty title");

const fixtureLinks = [
  { title: "Agent Portfolio", url: "https://example.com/portfolio" },
  { title: "Client Reviews", url: "https://example.com/reviews" },
];

const base = createEmptyAgenteIndividualResidencialFormState();
base.agenteNombre = "Fixture Agent";
base.correoPrincipal = "agent@example.com";
base.fotosDataUrls = ["https://cdn.example.com/photo-a.jpg", "https://cdn.example.com/photo-b.jpg"];
base.businessExtraUrls = fixtureLinks;

const serialized = JSON.stringify(base);
const parsed = JSON.parse(serialized) as Record<string, unknown>;
const hydrated = mergePartialAgenteIndividualResidencial(parsed);

eq(hydrated.businessExtraUrls[0]?.title, "Agent Portfolio", "hydrate title 1");
eq(hydrated.businessExtraUrls[0]?.url, "https://example.com/portfolio", "hydrate url 1");
eq(hydrated.businessExtraUrls[1]?.title, "Client Reviews", "hydrate title 2");
eq(hydrated.businessExtraUrls[1]?.url, "https://example.com/reviews", "hydrate url 2");
eq(hydrated.agenteNombre, "Fixture Agent", "parent agent name preserved");
eq(hydrated.fotosDataUrls.length, 2, "parent photos preserved");

const previewCtas = additionalBusinessLinks(hydrated, "en");
assert(previewCtas.length === 2, "preview has two CTAs");
eq(previewCtas[0]?.label, "Agent Portfolio", "preview label 1");
eq(previewCtas[0]?.href, "https://example.com/portfolio", "preview href 1");
eq(previewCtas[1]?.label, "Client Reviews", "preview label 2");
eq(previewCtas[1]?.href, "https://example.com/reviews", "preview href 2");

const negocio = mapAgenteResidencialFormStateToNegocioForPublish(hydrated);
const published = durableBusinessExtraLinks(negocio.businessExtraUrls, 2);
eq(published[0]?.title, "Agent Portfolio", "publish title 1");
eq(published[0]?.url, "https://example.com/portfolio", "publish url 1");
eq(published[1]?.title, "Client Reviews", "publish title 2");
eq(published[1]?.url, "https://example.com/reviews", "publish url 2");

const metaJson = buildBusinessMetaJsonFromBienesRaicesNegocioState(negocio);
assert(metaJson, "business meta json produced");
const meta = JSON.parse(metaJson!) as Record<string, string>;
const metaLinks = parsePublishedBusinessExtraLinks(meta.negocioBusinessExtraUrls, 2);
eq(metaLinks[0]?.title, "Agent Portfolio", "meta title 1");
eq(metaLinks[1]?.title, "Client Reviews", "meta title 2");

const publicCtas = metaLinks.map((link) => ({
  label: businessLinkPublicLabel(link, "en"),
  href: businessLinkHref(link),
}));
eq(publicCtas[0]?.label, "Agent Portfolio", "public CTA 1");
eq(publicCtas[1]?.label, "Client Reviews", "public CTA 2");

const afterRemove = sanitizeBusinessExtraLinksForDraft([fixtureLinks[0]!], 2);
const rehydrated = mergePartialAgenteIndividualResidencial({
  ...hydrated,
  businessExtraUrls: afterRemove,
});
assert(rehydrated.businessExtraUrls.length === 1, "remove leaves one link");
eq(rehydrated.businessExtraUrls[0]?.title, "Agent Portfolio", "remove keeps portfolio title");

const emptyUrlExcluded = durableBusinessExtraLinks([{ title: "No URL", url: "" }, fixtureLinks[0]!], 2);
assert(emptyUrlExcluded.length === 1, "empty url excluded from publish");
eq(emptyUrlExcluded[0]?.title, "Agent Portfolio", "empty url excluded keeps valid link");

const emptyTitleFallback = businessLinkPublicLabel({ title: "", url: "https://legacy.example.com" }, "en");
eq(emptyTitleFallback, "Visit link", "empty title fallback EN");

const vmLinks = businessExtraLinksToPreviewCtas(fixtureLinks, "en", 2);
eq(vmLinks[0]?.label, "Agent Portfolio", "vm mapper title 1");

console.log("PROOF_TYPE: NODE FIXTURE INTEGRATION");
console.log("bienes-titled-business-links-hydration-01-core PASS");
