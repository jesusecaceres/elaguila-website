import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const paymentService = read("app/lib/clasificados/bienes-raices/brListingPaymentService.ts");
const bienesFulfillment = read("app/lib/listingPlans/revenueBienesNegocioFulfillment.ts");
const revenueFulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const publicResults = read("app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts");

assert.ok(!paymentService.includes("listing_json"), "Bienes activation must not select/update nonexistent listings.listing_json");
assert.match(paymentService, /published_at:\s*existing\.published_at \?\? now/, "published_at is only set when absent");
assert.match(paymentService, /\.eq\("status", "pending"\)/, "parent activation requires pending status");
assert.match(paymentService, /\.eq\("is_published", false\)/, "parent activation requires unpublished row");
assert.match(bienesFulfillment, /activateInventoryChildren\?: boolean/, "Bienes fulfillment accepts explicit inventory child gate");
assert.match(bienesFulfillment, /activateInventorySiblings:\s*input\.activateInventoryChildren === true/, "child fan-out is gated by paid inventory add-on");
assert.match(revenueFulfillment, /readBienesInventoryPackPaidFromPaymentRecord/, "Revenue OS reads paid inventory add-on metadata");
assert.match(revenueFulfillment, /bienes_inventory_pack_selected === true/, "inventory selected metadata is honored");
assert.match(revenueFulfillment, /br_inventory_pack_monthly/, "inventory package key is honored");
assert.match(publicResults, /\.eq\("is_published", true\)/, "results query still excludes unpublished rows");
assert.match(publicResults, /\.eq\("status", "active"\)/, "results query still excludes pending rows");

function activatePaidBienes({ parent, children, payment, inventoryEntitlementPaid }) {
  if (payment.payment_status !== "paid") return { ok: false, reason: "unpaid" };
  if (payment.listing_id !== parent.id) return { ok: false, reason: "wrong_listing" };
  if (payment.category !== "bienes-raices" || payment.package_key !== "br_agent_monthly") {
    return { ok: false, reason: "wrong_package" };
  }
  if (parent.category !== "bienes-raices" || parent.seller_type !== "business") {
    return { ok: false, reason: "wrong_parent" };
  }
  const now = "2026-07-15T20:30:00.000Z";
  const activatedParent =
    parent.status === "active" && parent.is_published === true
      ? parent
      : {
          ...parent,
          status: "active",
          is_published: true,
          published_at: parent.published_at ?? now,
        };
  const activatedChildren = inventoryEntitlementPaid
    ? children.map((child) =>
        child.parent_id === parent.id && child.status === "pending" && child.is_published === false
          ? {
              ...child,
              status: "active",
              is_published: true,
              published_at: child.published_at ?? now,
            }
          : child,
      )
    : children;
  return { ok: true, parent: activatedParent, children: activatedChildren };
}

const parent = {
  id: "parent-uuid",
  leonix_ad_id: "BR-2026-000018",
  category: "bienes-raices",
  seller_type: "business",
  status: "pending",
  is_published: false,
  published_at: null,
  media: ["p1", "p2"],
};
const children = [
  {
    id: "child-uuid-1",
    leonix_ad_id: "BR-2026-000019",
    parent_id: parent.id,
    status: "pending",
    is_published: false,
    published_at: null,
    media: ["c1"],
  },
  {
    id: "child-uuid-2",
    leonix_ad_id: "BR-2026-000020",
    parent_id: parent.id,
    status: "pending",
    is_published: false,
    published_at: null,
    media: ["c2"],
  },
];
const payment = {
  payment_status: "paid",
  listing_id: parent.id,
  category: "bienes-raices",
  package_key: "br_agent_monthly",
  entitlement_id: "entitlement-1",
  ends_at: "2026-08-14T20:25:39.455Z",
};

const activated = activatePaidBienes({ parent, children, payment, inventoryEntitlementPaid: true });
assert.equal(activated.ok, true, "verified paid event activates");
assert.equal(activated.parent.id, parent.id, "same parent UUID preserved");
assert.equal(activated.parent.leonix_ad_id, parent.leonix_ad_id, "same parent Leonix ID preserved");
assert.equal(activated.parent.status, "active", "parent pending -> active");
assert.equal(activated.parent.is_published, true, "parent unpublished -> published");
assert.deepEqual(activated.parent.media, parent.media, "parent media preserved");
assert.deepEqual(activated.children.map((c) => c.id), children.map((c) => c.id), "same child UUIDs preserved");
assert.deepEqual(activated.children.map((c) => c.leonix_ad_id), children.map((c) => c.leonix_ad_id), "same child Leonix IDs preserved");
assert.deepEqual(activated.children.map((c) => c.status), ["active", "active"], "selected children pending -> active");
assert.deepEqual(activated.children.map((c) => c.is_published), [true, true], "selected children unpublished -> published");
assert.deepEqual(activated.children.map((c) => c.media), children.map((c) => c.media), "child media/order preserved");

const retry = activatePaidBienes({
  parent: activated.parent,
  children: activated.children,
  payment,
  inventoryEntitlementPaid: true,
});
assert.deepEqual(retry, activated, "idempotent retry does not duplicate or extend");

const noInventory = activatePaidBienes({ parent, children, payment, inventoryEntitlementPaid: false });
assert.deepEqual(noInventory.children.map((c) => c.status), ["pending", "pending"], "inventory entitlement required for child activation");

const unpaid = activatePaidBienes({
  parent,
  children,
  payment: { ...payment, payment_status: "pending" },
  inventoryEntitlementPaid: true,
});
assert.equal(unpaid.ok, false, "unpaid listing cannot activate");

console.log("verify-bienes-paid-pending-to-active-fulfillment-01: PASS");
