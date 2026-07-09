/**
 * NODE FIXTURE SIMULATION — Bienes Raíces parent + child draft hydration proof.
 * Mocks sessionStorage/localStorage and exercises real previewDraft helpers.
 */
import {
  createEmptyAgenteIndividualResidencialState,
  mergePartialAgenteIndividualResidencial,
  type AgenteIndividualResidencialFormState,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import type { BrNegocioAdditionalInventoryPropertyDraft } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioAdditionalInventoryDraft";
import { mergeChildInventoryWithMediaBridge } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryDraftPersistence";

const sessionStore = new Map<string, string>();
const localStore = new Map<string, string>();

function makeStorage(store: Map<string, string>) {
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
  };
}

const g = globalThis as typeof globalThis & {
  window?: typeof globalThis;
  sessionStorage?: Storage;
  localStorage?: Storage;
};

g.window = globalThis as Window & typeof globalThis;
g.sessionStorage = makeStorage(sessionStore) as Storage;
g.localStorage = makeStorage(localStore) as Storage;

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, field: string) {
  assert(a === b, `${field}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function buildChild(id: string, title: string): BrNegocioAdditionalInventoryPropertyDraft {
  const draftId = id.startsWith("br-local-property-") ? id : `br-local-property-${id}`;
  const now = new Date().toISOString();
  return {
    id: draftId,
    title,
    propertyType: "casa",
    propertySubtype: "",
    price: "425000",
    bedrooms: "3",
    bathrooms: "2",
    interiorSqft: "1800",
    lotSqft: "5000",
    streetLine1: "456 Oak Ave",
    streetLine2: "",
    city: "Miami",
    state: "FL",
    zip: "33101",
    country: "US",
    showExactAddress: true,
    description: `${title} description`,
    mainPhotoUrl: "",
    photoUrls: [
      `https://cdn.example.com/${draftId}-main.jpg`,
      `https://cdn.example.com/${draftId}-g2.jpg`,
      `https://cdn.example.com/${draftId}-g3.jpg`,
      "",
      "",
      "",
      "",
    ],
    primaryPhotoIndex: 0,
    videoUrl: `https://youtube.com/watch?v=${draftId}`,
    tourUrl: `https://matterport.com/tour/${draftId}`,
    brochureUrl: `https://cdn.example.com/${draftId}-brochure.pdf`,
    mlsUrl: "",
    listadoUrl: `https://mls.example.com/${draftId}`,
    propertyForm: {
      titulo: title,
      googleBusinessUrl: `https://maps.google.com/business/${draftId}`,
      googleReviewsUrl: `https://maps.google.com/reviews/${draftId}`,
      yelpReviewsUrl: `https://yelp.com/biz/${draftId}`,
      agenteSitioWeb: `https://${draftId}.example.com`,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildParentFixture(): AgenteIndividualResidencialFormState {
  const base = createEmptyAgenteIndividualResidencialState();
  return mergePartialAgenteIndividualResidencial({
    ...base,
    categoriaPropiedad: "residencial",
    titulo: "Hydration Proof Parent Listing",
    precio: "899000",
    tipoPropiedadCodigo: "casa",
    recamaras: "4",
    banos: "3",
    tamanoInteriorSqft: "2400",
    direccionLinea1: "123 Palm Drive",
    ciudad: "Miami",
    direccionEstado: "FL",
    direccionCodigoPostal: "33139",
    descripcionPrincipal: "Parent fixture description for hydration proof.",
    correoPrincipal: "agent@example.com",
    telefonoPrincipal: "3055550100",
    agenteSitioWeb: "https://parent.example.com",
    socialInstagram: "https://instagram.com/parent",
    googleBusinessUrl: "https://maps.google.com/business/parent",
    googleReviewsUrl: "https://maps.google.com/reviews/parent",
    yelpReviewsUrl: "https://yelp.com/biz/parent",
    videoUrls: ["https://youtube.com/watch?v=parent1"],
    tourUrl: "https://matterport.com/tour/parent",
    brochureUrl: "https://cdn.example.com/parent-brochure.pdf",
    listadoUrl: "https://mls.example.com/parent",
    fotosDataUrls: [
      "https://cdn.example.com/parent-main.jpg",
      "https://cdn.example.com/parent-g2.jpg",
      "https://cdn.example.com/parent-g3.jpg",
      "https://cdn.example.com/parent-g4.jpg",
      "",
      "",
      "",
    ],
    fotoPortadaIndex: 0,
    inventoryPackAccepted: true,
    additionalInventoryProperties: [
      buildChild("br-local-property-hydration-proof-a", "Child Property Alpha"),
      buildChild("br-local-property-hydration-proof-b", "Child Property Beta"),
    ],
  });
}

async function main() {
  const {
    BR_AGENTE_RES_PREVIEW_DRAFT_KEY,
    BR_AGENTE_RES_RETURN_KEY,
    BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY,
    bootstrapAgenteIndividualResidencialApplicationState,
    parsePersistedStateFromJson,
    persistAgenteResApplicationDraftResolved,
    resetAgenteResDraftHydrationMemoryForTests,
  } = await import(
    "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft"
  );

  function assertParentFields(saved: AgenteIndividualResidencialFormState, loaded: AgenteIndividualResidencialFormState) {
    eq(loaded.titulo, saved.titulo, "parent.titulo");
    eq(loaded.precio, saved.precio, "parent.precio");
    eq(loaded.recamaras, saved.recamaras, "parent.recamaras");
    eq(loaded.ciudad, saved.ciudad, "parent.ciudad");
    eq(loaded.descripcionPrincipal, saved.descripcionPrincipal, "parent.descripcionPrincipal");
    eq(loaded.correoPrincipal, saved.correoPrincipal, "parent.correoPrincipal");
    eq(loaded.agenteSitioWeb, saved.agenteSitioWeb, "parent.agenteSitioWeb");
    eq(loaded.googleBusinessUrl, saved.googleBusinessUrl, "parent.googleBusinessUrl");
    eq(loaded.googleReviewsUrl, saved.googleReviewsUrl, "parent.googleReviewsUrl");
    eq(loaded.yelpReviewsUrl, saved.yelpReviewsUrl, "parent.yelpReviewsUrl");
    eq(loaded.tourUrl, saved.tourUrl, "parent.tourUrl");
    eq(loaded.brochureUrl, saved.brochureUrl, "parent.brochureUrl");
    eq(loaded.videoUrls?.[0], saved.videoUrls?.[0], "parent.videoUrls[0]");
    eq(loaded.fotosDataUrls?.[0], saved.fotosDataUrls?.[0], "parent.fotosDataUrls[0]");
    eq(loaded.fotosDataUrls?.[2], saved.fotosDataUrls?.[2], "parent.fotosDataUrls[2]");
    assert(loaded.additionalInventoryProperties.length === saved.additionalInventoryProperties.length, "child count");
  }

  function assertChildFields(
    saved: BrNegocioAdditionalInventoryPropertyDraft,
    loaded: BrNegocioAdditionalInventoryPropertyDraft,
  ) {
    eq(loaded.title, saved.title, `child.${saved.id}.title`);
    eq(loaded.price, saved.price, `child.${saved.id}.price`);
    eq(loaded.city, saved.city, `child.${saved.id}.city`);
    eq(loaded.photoUrls[0], saved.photoUrls[0], `child.${saved.id}.photoUrls[0]`);
    eq(loaded.photoUrls[2], saved.photoUrls[2], `child.${saved.id}.photoUrls[2]`);
    eq(loaded.tourUrl, saved.tourUrl, `child.${saved.id}.tourUrl`);
    eq(loaded.brochureUrl, saved.brochureUrl, `child.${saved.id}.brochureUrl`);
    eq(loaded.videoUrl, saved.videoUrl, `child.${saved.id}.videoUrl`);
    eq(
      loaded.propertyForm?.googleBusinessUrl,
      saved.propertyForm?.googleBusinessUrl,
      `child.${saved.id}.googleBusinessUrl`,
    );
  }

  sessionStore.clear();
  localStore.clear();
  resetAgenteResDraftHydrationMemoryForTests();

  const fixture = buildParentFixture();
  await persistAgenteResApplicationDraftResolved(fixture);

  assert(sessionStore.has(BR_AGENTE_RES_PREVIEW_DRAFT_KEY), "preview draft key saved");
  assert(sessionStore.has(BR_AGENTE_RES_RETURN_KEY), "return draft key saved");
  assert(localStore.has(BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY), "localStorage mirror saved");

  const lsRaw = localStore.get(BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY)!;
  const lsParsed = parsePersistedStateFromJson(lsRaw);
  assert(lsParsed?.titulo === fixture.titulo, "localStorage mirror is flat preview shape (not return wrapper)");

  localStore.set(
    BR_AGENTE_RES_DRAFT_LS_FALLBACK_KEY,
    JSON.stringify({ state: fixture, savedAt: Date.now() }),
  );

  resetAgenteResDraftHydrationMemoryForTests();
  const hardRefresh = bootstrapAgenteIndividualResidencialApplicationState();
  assertParentFields(fixture, hardRefresh);
  for (let i = 0; i < fixture.additionalInventoryProperties.length; i++) {
    assertChildFields(fixture.additionalInventoryProperties[i]!, hardRefresh.additionalInventoryProperties[i]!);
  }

  const mergedEmpty = mergePartialAgenteIndividualResidencial({});
  assert(mergedEmpty.titulo === "", "empty merge keeps blank titulo default");
  const mergedFromPartial = mergePartialAgenteIndividualResidencial({ titulo: hardRefresh.titulo });
  eq(mergedFromPartial.titulo, hardRefresh.titulo, "partial merge preserves titulo");

  const childMerged = mergeChildInventoryWithMediaBridge(hardRefresh.additionalInventoryProperties);
  assert(childMerged.length === 2, "child media bridge merge count");

  resetAgenteResDraftHydrationMemoryForTests();
  sessionStore.delete(BR_AGENTE_RES_PREVIEW_DRAFT_KEY);
  const volver = bootstrapAgenteIndividualResidencialApplicationState();
  assertParentFields(fixture, volver);
  eq(
    volver.additionalInventoryProperties[0]?.title,
    fixture.additionalInventoryProperties[0]?.title,
    "volver child 1 title",
  );

  resetAgenteResDraftHydrationMemoryForTests();
  await persistAgenteResApplicationDraftResolved(fixture);
  await persistAgenteResApplicationDraftResolved(createEmptyAgenteIndividualResidencialState());
  assert(sessionStore.has(BR_AGENTE_RES_PREVIEW_DRAFT_KEY), "empty persist did not wipe preview key");

  console.log("OK: bienes-hydration-proof-01 (NODE FIXTURE SIMULATION)");
}

main().catch((err) => {
  console.error("FAIL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
