// Package F Build F2, promo concurrency closure — DEFERRED runtime certification.
//
// This script is NOT run automatically by this build. It requires:
//   1. The migration `supabase/migrations/20260812150000_promo_customer_redemption_slot_reservation_rpc.sql`
//      applied to a real, non-Production Supabase project (F3 Preview environment or equivalent).
//   2. SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL pointed at that project.
//
// Run manually during F3 Preview certification:
//   node scripts/certify-promo-redemption-concurrency-f3.mjs
//
// Creates one throwaway `leonix_promo_codes` row (per_customer_limit=1), exercises the RPC
// directly, and deletes everything it created on exit (success or failure).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("certify-promo-redemption-concurrency-f3: missing Supabase credentials. Not running.");
  process.exit(2);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(ok ? `✓ ${name}` : `✗ ${name}: ${detail ?? ""}`);
}

async function reserve({ promoCodeId, ownerUserId, email, perCustomerLimit, paymentRecordId }) {
  return supabase.rpc("reserve_promo_customer_redemption_slot", {
    p_promo_code_id: promoCodeId,
    p_owner_user_id: ownerUserId ?? null,
    p_email: email ?? null,
    p_per_customer_limit: perCustomerLimit,
    p_payment_record_id: paymentRecordId,
    p_listing_id: "certification-listing",
    p_leonix_ad_id: null,
    p_category: "servicios",
    p_package_key: "servicios_base_monthly",
    p_placement_tier: null,
    p_discount_cents: 100,
  });
}

async function main() {
  const testCode = `F3-CERT-${Date.now()}`;
  const { data: promo, error: promoErr } = await supabase
    .from("leonix_promo_codes")
    .insert({
      code: testCode,
      code_type: "manual",
      status: "active",
      promo_type: "percent_off",
      percent_off: 10,
      is_active: true,
      non_stackable: true,
      one_time_use: false,
      per_customer_limit: 1,
      metadata: { certification_only: true },
    })
    .select("id")
    .single();

  if (promoErr || !promo?.id) {
    console.error("Could not create test promo code:", promoErr?.message);
    process.exit(1);
  }
  const promoCodeId = promo.id;
  const createdRedemptionIds = [];

  try {
    // A. Sequential same customer: first succeeds, second (limit=1) is blocked.
    const custA = `f3-cert-customer-a-${Date.now()}`;
    const seq1 = await reserve({ promoCodeId, email: `${custA}@example.test`, perCustomerLimit: 1, paymentRecordId: null });
    const seq1Row = seq1.data?.[0];
    record("A. Sequential — first attempt reserved", seq1Row?.reserved === true, JSON.stringify(seq1.error ?? seq1Row));
    if (seq1Row?.redemption_id) createdRedemptionIds.push(seq1Row.redemption_id);

    const seq2 = await reserve({ promoCodeId, email: `${custA}@example.test`, perCustomerLimit: 1, paymentRecordId: null });
    const seq2Row = seq2.data?.[0];
    record(
      "A. Sequential — second attempt blocked (limit reached)",
      seq2Row?.reserved === false && seq2Row?.blocked_reason === "per_customer_limit_reached",
      JSON.stringify(seq2Row),
    );

    // B. Concurrent same customer: fire two reservations in parallel, exactly one must win.
    const custB = `f3-cert-customer-b-${Date.now()}`;
    const [conc1, conc2] = await Promise.all([
      reserve({ promoCodeId, email: `${custB}@example.test`, perCustomerLimit: 1, paymentRecordId: null }),
      reserve({ promoCodeId, email: `${custB}@example.test`, perCustomerLimit: 1, paymentRecordId: null }),
    ]);
    const concRows = [conc1.data?.[0], conc2.data?.[0]];
    const reservedCount = concRows.filter((r) => r?.reserved === true).length;
    for (const r of concRows) if (r?.redemption_id) createdRedemptionIds.push(r.redemption_id);
    record(
      "B. Concurrent same customer — exactly one of two simultaneous attempts reserved",
      reservedCount === 1,
      `reserved count = ${reservedCount}, rows = ${JSON.stringify(concRows)}`,
    );

    // C. Different customers: both should succeed independently.
    const custC1 = `f3-cert-customer-c1-${Date.now()}`;
    const custC2 = `f3-cert-customer-c2-${Date.now()}`;
    const [diff1, diff2] = await Promise.all([
      reserve({ promoCodeId, email: `${custC1}@example.test`, perCustomerLimit: 1, paymentRecordId: null }),
      reserve({ promoCodeId, email: `${custC2}@example.test`, perCustomerLimit: 1, paymentRecordId: null }),
    ]);
    const diffRows = [diff1.data?.[0], diff2.data?.[0]];
    for (const r of diffRows) if (r?.redemption_id) createdRedemptionIds.push(r.redemption_id);
    record(
      "C. Different customers — both attempts reserved independently",
      diffRows.every((r) => r?.reserved === true),
      JSON.stringify(diffRows),
    );

    // per_customer_limit > 1 generalization check.
    const custD = `f3-cert-customer-d-${Date.now()}`;
    const multi1 = await reserve({ promoCodeId, email: `${custD}@example.test`, perCustomerLimit: 2, paymentRecordId: null });
    const multi2 = await reserve({ promoCodeId, email: `${custD}@example.test`, perCustomerLimit: 2, paymentRecordId: null });
    const multi3 = await reserve({ promoCodeId, email: `${custD}@example.test`, perCustomerLimit: 2, paymentRecordId: null });
    for (const r of [multi1.data?.[0], multi2.data?.[0], multi3.data?.[0]]) {
      if (r?.redemption_id) createdRedemptionIds.push(r.redemption_id);
    }
    record(
      "per_customer_limit=2 — first two reserved, third blocked",
      multi1.data?.[0]?.reserved === true && multi2.data?.[0]?.reserved === true && multi3.data?.[0]?.reserved === false,
      JSON.stringify([multi1.data?.[0], multi2.data?.[0], multi3.data?.[0]]),
    );
  } finally {
    if (createdRedemptionIds.length) {
      await supabase.from("leonix_promo_code_redemptions").delete().in("id", createdRedemptionIds);
    }
    await supabase.from("leonix_promo_codes").delete().eq("id", promoCodeId);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} runtime checks passed.`);
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("certify-promo-redemption-concurrency-f3: uncaught error:", err);
  process.exit(1);
});
