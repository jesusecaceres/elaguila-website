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

export function __stripeSessions() {
  return sessions.map((s) => JSON.parse(JSON.stringify(s)));
}
export function __resetStripe() {
  sessions.length = 0;
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
    this.coupons = { create: async (params) => ({ id: `co_test_${sessions.length}`, ...params }) };
    this.promotionCodes = { create: async (params) => ({ id: "promo_test", ...params }) };
    this.prices = { create: async (params) => ({ id: "price_test", ...params }) };
    this.products = { create: async (params) => ({ id: "prod_test", ...params }) };
    this.customers = { create: async (params) => ({ id: "cus_test", ...params }) };
  }
}
