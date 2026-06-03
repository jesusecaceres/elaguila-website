/**
 * CTA-R2 gate checks for `buildRestaurantContactHub` (run: npx tsx scripts/restaurant-contact-hub-qa.ts)
 */
import { buildRestaurantContactHub } from "../app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub";
import {
  buildRestaurantPublicAddressQuery,
  resolveRestaurantMapsHref,
} from "../app/(site)/clasificados/restaurantes/application/restauranteContactHref";
import type { RestauranteListingDraft } from "../app/(site)/clasificados/restaurantes/application/restauranteDraftTypes";
import { createEmptyRestauranteDraft } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
}

const base = (): RestauranteListingDraft => ({
  ...createEmptyRestauranteDraft(),
  businessName: "Chuy's Tacos",
  phoneNumber: "(408) 555-1234",
});

// Phone-only listing
{
  const hub = buildRestaurantContactHub({ ...base(), phoneNumber: "(408) 555-1234" });
  assert(Boolean(hub?.hasAny), "phone-only has hub");
  assert(hub!.contactUs.some((b) => b.id === "call"), "phone-only has call");
  assert(!hub!.contactUs.some((b) => b.id === "email"), "phone-only no email");
  assert(hub!.social.length === 0, "phone-only no social");
}

// Empty listing
{
  const hub = buildRestaurantContactHub({
    ...createEmptyRestauranteDraft(),
    businessName: "Empty",
  });
  assert(hub === undefined, "empty draft returns undefined hub");
}

// Mobile vendor with current location
{
  const hub = buildRestaurantContactHub({
    ...base(),
    movingVendor: true,
    movingVendorStack: {
      currentLocationText: "Downtown SJ",
      currentLocationUrl: "https://maps.google.com/?q=San+Jose",
    },
  });
  assert(hub!.findUs.some((b) => b.id === "current-location"), "moving vendor shows Ver dónde está hoy");
  assert(!hub!.orderReserve.some((b) => b.id === "current-location"), "current location not in orderReserve");
}

// Mobile vendor without URL
{
  const hub = buildRestaurantContactHub({
    ...base(),
    movingVendor: true,
    movingVendorStack: { currentLocationText: "Downtown SJ" },
  });
  assert(!hub!.findUs.some((b) => b.id === "current-location"), "no current location CTA without URL");
}

// Home-based private address
{
  const hub = buildRestaurantContactHub({
    ...base(),
    homeBasedBusiness: true,
    showExactAddress: false,
    addressLine1: "123 Secret St",
    orderUrl: "https://order.example.com",
    homeBasedStack: { pickupInstructions: "Ring bell" },
  });
  assert(!hub!.location?.addressLine1, "home private hides street");
  assert(hub!.orderReserve.some((b) => b.id === "order"), "home shows order CTA in orderReserve");
  assert(Boolean(hub!.location?.supportingText?.includes("Ring")), "pickup instructions as text");
}

// Catering
{
  const hub = buildRestaurantContactHub({
    ...base(),
    cateringAvailable: true,
    whatsAppNumber: "14085551234",
  });
  assert(hub!.catering.length > 0, "catering section populated");
}

// Reviews
{
  const hub = buildRestaurantContactHub({
    ...base(),
    googleReviewUrl: "https://g.page/r/example/review",
    yelpReviewUrl: "https://www.yelp.com/biz/example",
  });
  assert(hub!.reviews.length === 2, "both review links");
}

// Order / menu / website grouping
{
  const hub = buildRestaurantContactHub({
    ...base(),
    menuUrl: "https://menu.example.com",
    reservationUrl: "https://reserve.example.com",
    orderUrl: "https://order.example.com",
    websiteUrl: "https://www.example.com",
  });
  assert(hub!.orderReserve.length === 4, "orderReserve has menu, reserve, order, website");
  assert(hub!.findUs.length === 0, "no stray website in findUs");
}

// Address-driven maps (Gate R-C2)
{
  const d = {
    ...createEmptyRestauranteDraft(),
    addressLine1: "87 N King Rd",
    addressLine2: "Suite 2",
    cityCanonical: "San Jose",
    state: "CA",
    zipCode: "95116",
    showExactAddress: true,
  };
  const q = buildRestaurantPublicAddressQuery(d, true);
  assert(Boolean(q?.includes("San Jose")), "address query includes city");
  const href = resolveRestaurantMapsHref(d, true);
  assert(Boolean(href?.includes(encodeURIComponent("87"))), "maps href is encoded");
}

console.log("OK: restaurant-contact-hub-qa passed");
