/**
 * Focused Prompt 2 selftest — no network, no DB.
 * Run: npx tsx scripts/viajes-prompt2-public-shell-selftest.ts
 */

import { getViajesOpenCardLane } from "../app/(site)/clasificados/viajes/lib/viajesOpenCardStrategy";
import { mapViajesOfferV2ToDetailModel } from "../app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";
import { emptyViajesOfferModelV2 } from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";
import { viajesCanShowPublicMap, viajesPublicAddressLabel } from "../app/(site)/clasificados/viajes/lib/viajesPublicLocation";
import {
  filterViajesMoreFromProvider,
  viajesProviderIdentityKeys,
} from "../app/(site)/clasificados/viajes/lib/viajesProviderMatch";
import { getViajesResultsTripTypeOptions } from "../app/(site)/clasificados/viajes/lib/viajesResultsTripTypeOptions";
import {
  defaultViajesBrowseState,
  parseViajesBrowseFromSearchParams,
  serializeViajesBrowseToSearchParams,
} from "../app/(site)/clasificados/viajes/lib/viajesBrowseContract";
import { VIAJES_CATEGORY_PILLS, VIAJES_DESTINATION_COLLECTIONS, VIAJES_LOCAL_DEPARTURES } from "../app/(site)/clasificados/viajes/data/viajesLandingSampleData";
import { getViajesUi } from "../app/(site)/clasificados/viajes/data/viajesUiCopy";

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  } else {
    console.log("PASS:", msg);
  }
}

const ui = getViajesUi("es");
assert(ui.heroTitle.includes("escapada"), "landing hero title");
assert(ui.results.compactTitle.length > 0, "results compact title");
assert(ui.results.providerRailTitle.includes("Negocios"), "provider rail title");
assert(ui.results.loadMore.includes("Ver más"), "load more copy");
assert(ui.localDepartures.byId.sjc?.title.includes("San José"), "SJC departure copy");
assert(!JSON.stringify(ui.localDepartures).includes("Costa Rica"), "no Costa Rica in localDepartures copy");
assert(!JSON.stringify(ui.localDepartures).includes("SJO"), "no SJO airport code in localDepartures");

assert(VIAJES_CATEGORY_PILLS.length === 6, "six landing intent pills in sample data");
assert(VIAJES_LOCAL_DEPARTURES.some((d) => d.id === "sjc"), "local departures use sjc id");
assert(!VIAJES_DESTINATION_COLLECTIONS.some((d) => /costa rica/i.test(d.name)), "destinations rail has no Costa Rica card");

const tripOpts = getViajesResultsTripTypeOptions("es").filter((o) => o.value);
assert(tripOpts.length === 7, "seven results trip-type options");
assert(tripOpts.some((o) => o.value === "tours"), "includes tours y excursiones");

const browse = defaultViajesBrowseState("es");
browse.src = "business,affiliate";
browse.from = "san-jose";
const qs = serializeViajesBrowseToSearchParams(browse);
const round = parseViajesBrowseFromSearchParams(qs, "es");
assert(round.src === "business,affiliate", "browse src round-trip");
assert(round.from === "san-jose", "browse from round-trip");

const business = emptyViajesOfferModelV2("business", "es");
business.basics.title = "Tour SF";
business.provider.name = "Bay Tours";
business.provider.id = "bay-tours";
business.provider.profileRoute = "bay-tours";
business.provider.socialLinkedin = "https://linkedin.com/company/example";
business.locations.providerOffice = {
  ...business.locations.providerOffice,
  city: "San José",
  stateRegion: "CA",
  publicLabel: "San José, CA",
  showPublicly: true,
  showMap: true,
};
business.highlights = [{ id: "1", label: "Guía local" }];
business.exclusions = [{ id: "2", label: "Propinas" }];
business.itinerary = [{ id: "d1", dayLabel: "Día 1", title: "Salida", description: "Bus", locationLabel: "SJC" }];
const mapped = mapViajesOfferV2ToDetailModel(business, { sparse: true, lang: "es" });
assert(mapped.partner.isAffiliate === false, "business not affiliate");
assert(mapped.partner.editorial !== true, "business not editorial");
assert((mapped.partner.contactChannels ?? []).some((c) => c.kind === "linkedin"), "linkedin channel mapped");
assert(getViajesOpenCardLane(mapped) === "business", "open card lane business");
assert(viajesCanShowPublicMap(business.locations.providerOffice) === true, "public map allowed when flags set");
assert(viajesPublicAddressLabel(business.locations.privateExact) === "", "privateExact hidden by default");

const priv = emptyViajesOfferModelV2("private", "es");
priv.locations.privateExact = {
  ...priv.locations.privateExact,
  street: "123 Secret St",
  city: "San José",
  showPublicly: false,
  showMap: false,
  publicLabel: "should not show",
};
assert(viajesPublicAddressLabel(priv.locations.privateExact) === "", "privateExact never public without showPublicly");
assert(getViajesOpenCardLane(mapViajesOfferV2ToDetailModel(priv, { sparse: true })) === "private", "private lane");

const aff = emptyViajesOfferModelV2("affiliate", "es");
aff.source.outboundUrl = "https://partner.example/book";
aff.source.disclosure = "Socio comercial";
const affMapped = mapViajesOfferV2ToDetailModel(aff, { sparse: true });
assert(getViajesOpenCardLane(affMapped) === "affiliate", "affiliate lane");
assert(affMapped.mainCtaHref.includes("partner.example"), "affiliate outbound CTA");

const editorial = emptyViajesOfferModelV2("editorial", "es");
assert(getViajesOpenCardLane(mapViajesOfferV2ToDetailModel(editorial, { sparse: true })) === "editorial", "editorial lane");

const keys = viajesProviderIdentityKeys(business);
assert(keys.some((k) => k.includes("bay-tours")), "provider identity keys");
const more = filterViajesMoreFromProvider(
  [
    {
      kind: "business",
      id: "1",
      slug: "other",
      businessProfileSlug: "bay-tours",
      businessName: "Bay Tours",
      offerTitle: "Otro",
      destination: "SF",
      departureCity: "San José",
      duration: "1 día",
      price: "Desde $99",
      includedSummary: "",
      imageSrc: "https://example.com/a.jpg",
      imageAlt: "a",
      href: "/clasificados/viajes/oferta/other",
      publishedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  business,
  { excludeSlug: "tour-sf" }
);
assert(more.length === 1, "more-from-provider match");

assert(ui.nearbyEscapes.byId.napa?.title.includes("Napa"), "nearby bento napa");
assert(ui.mobilitySection.byId["autos-de-renta"]?.title.includes("Autos"), "mobility autos card");
assert(ui.staySection.hotels.title.includes("Hoteles"), "stay hotels card");
assert(ui.results.discoveryNearYou.length > 0 && ui.results.discoveryFamilyTrips.length > 0 && ui.results.discoveryGuidesInspiration.length > 0, "discovery trio copy");

if (failed > 0) {
  console.error(`\nPrompt 2 selftest FAILED (${failed})`);
  process.exit(1);
}
console.log("\nPrompt 2 selftest PASS");
