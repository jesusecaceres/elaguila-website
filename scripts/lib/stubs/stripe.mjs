/**
 * The Stripe SDK, replaced by a RECORDER.
 *
 * The checkout route's credit decisions — whose identity selects the wallet, whether a recurring
 * plan may carry credits, what amount is actually charged, and how large a hold is taken — are all
 * made around the session-creation call. Reaching them requires a Stripe client; making an actual
 * Stripe call is prohibited outright. So this records what the route ASKED Stripe to charge, which
 * is the number that matters: a doubled discount or a quadrupled ceiling shows up here as the wrong
 * `unit_amount`, in a test, instead of on a customer's card.
 */
const sessions = [];
/** Subscriptions the code under test may `retrieve` (seeded by tests; a miss throws like Stripe's resource_missing). */
const subscriptions = new Map();
let subscriptionRetrieveFailure = null;
export function __seedSubscription(subscription) {
  subscriptions.set(subscription.id, JSON.parse(JSON.stringify(subscription)));
}
/** Make every `subscriptions.retrieve` fail (Stripe unreachable), to prove the retryable branch. */
export function __failSubscriptionRetrieve(error) {
  subscriptionRetrieveFailure = error ?? Object.assign(new Error("stripe is down"), { code: "api_connection_error" });
}
const coupons = new Map();
let couponFailure = null;

export function __stripeSessions() {
  return sessions.map((s) => JSON.parse(JSON.stringify(s)));
}
export function __resetStripe() {
  sessions.length = 0;
  subscriptions.clear();
  subscriptionRetrieveFailure = null;
  coupons.clear();
  couponFailure = null;
}

/** Every coupon the code under test created, in creation order. */
export function __stripeCoupons() {
  return [...coupons.values()].map((c) => JSON.parse(JSON.stringify(c)));
}

/** Pre-existing coupon, so the retrieve-and-validate path can be driven (including a bad one). */
export function __seedCoupon(coupon) {
  coupons.set(coupon.id, coupon);
}

/** Make the next `coupons.create` fail, so the fail-closed branch can be proven. */
export function __failCouponCreate(error) {
  couponFailure = error ?? Object.assign(new Error("stripe is down"), { code: "api_error" });
}

export default class Stripe {
  constructor() {
    this.checkout = {
      sessions: {
        create: async (params) => {
          sessions.push(params);
          return {
            id: `cs_test_${sessions.length}`,
            url: `https://checkout.stripe.test/${sessions.length}`,
            payment_intent: `pi_test_${sessions.length}`,
            amount_total: params?.line_items?.[0]?.price_data?.unit_amount ?? null,
          };
        },
        retrieve: async (id) => ({ id, payment_status: "unpaid" }),
      },
    };
    // COUPONS ARE RECORDED, AND `retrieve` MISSES BY DEFAULT.
    //
    // The real helpers are retrieve-first / create-if-missing, so a stub whose `retrieve` always
    // succeeded would never exercise creation, and one whose `create` forgot the params could not
    // show WHAT was created — which for an `amount_off` coupon is the whole question. Tests can
    // seed a coupon with `__seedCoupon` to drive the retrieve-and-validate path.
    this.coupons = {
      create: async (params) => {
        if (couponFailure) throw couponFailure;
        const coupon = { id: params?.id ?? `co_test_${coupons.size + 1}`, ...params };
        coupons.set(coupon.id, coupon);
        return coupon;
      },
      retrieve: async (id) => {
        const found = coupons.get(id);
        if (!found) {
          const err = new Error(`No such coupon: ${id}`);
          err.code = "resource_missing";
          throw err;
        }
        return found;
      },
    };
    this.subscriptions = {
      retrieve: async (id) => {
        if (subscriptionRetrieveFailure) throw subscriptionRetrieveFailure;
        const found = subscriptions.get(id);
        if (!found) {
          const err = new Error(`No such subscription: ${id}`);
          err.code = "resource_missing";
          throw err;
        }
        return JSON.parse(JSON.stringify(found));
      },
    };
    this.promotionCodes = { create: async (params) => ({ id: "promo_test", ...params }) };
    this.prices = { create: async (params) => ({ id: "price_test", ...params }) };
    this.products = { create: async (params) => ({ id: "prod_test", ...params }) };
    this.customers = { create: async (params) => ({ id: "cus_test", ...params }) };
  }
}
