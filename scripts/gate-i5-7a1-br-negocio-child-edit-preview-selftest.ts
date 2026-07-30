/**
 * Gate I.5.7A.1 — behavioral self-test for BR Negocio dashboard Edit/Preview eligibility.
 *
 * The eligibility ternary itself lives inline inside a "use client" JSX component
 * (`LeonixRealEstateListingManageCard.tsx`) and cannot be exercised directly by this repo's
 * DOM-less `tsx` self-test convention — the same limitation gate-g2-3-5's self-test documents for
 * that file's button callback wiring. What CAN be verified mechanically here is the exact set of
 * pure row-classification helpers that component's `isBrNegocioRow` / `isBrNegocioChildRow` /
 * `isBrNegocioMainRow` composite is built from — `isBrNegocioListing`, `isBrInventoryMainListing`,
 * `isBrInventoryProperty` — for representative main, child, and ambiguous/null-role BR Negocio
 * rows, plus BR Privado / non-BR rows that must never be misclassified as BR Negocio at all.
 *
 * As of Gate I.5.7A.1, `LeonixRealEstateListingManageCard.tsx` only resolves a BR Negocio
 * Edit/Preview href (canonical or legacy-fallback) when `isBrNegocioMainRow` is true; every other
 * case resolves to `undefined`/`null`, which the JSX now renders as no button at all. This test
 * proves the row-classification inputs to that gate behave as required. If the component's
 * composite expression changes, this test's local `isBrNegocioMainRowFor` mirror must be updated
 * in the same commit — verified by direct code review, per the established convention.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i5-7a1-br-negocio-child-edit-preview-selftest.ts
 */
import { strict as assert } from "node:assert";

import {
  isBrInventoryMainListing,
  isBrInventoryProperty,
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "../app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy";

/** Mirrors `isBrNegocioMainRow` in LeonixRealEstateListingManageCard.tsx exactly. */
function isBrNegocioMainRowFor(row: BrPropertyInventoryRowLike): boolean {
  const isNegocioRow = isBrNegocioListing(row);
  const isChildRow = isNegocioRow && isBrInventoryProperty(row);
  return isNegocioRow && (isBrInventoryMainListing(row) || (!isChildRow && !row.inventory_role));
}

const BASE_MAIN: BrPropertyInventoryRowLike = {
  id: "11111111-1111-4111-8111-111111111111",
  category: "bienes-raices",
  seller_type: "business",
  detail_pairs: null,
  inventory_role: "main",
};

const BASE_CHILD: BrPropertyInventoryRowLike = {
  id: "22222222-2222-4222-8222-222222222222",
  category: "bienes-raices",
  seller_type: "business",
  detail_pairs: null,
  br_inventory_parent_listing_id: "11111111-1111-4111-8111-111111111111",
  inventory_role: "inventory_property",
};

const AMBIGUOUS_NULL_ROLE: BrPropertyInventoryRowLike = {
  id: "33333333-3333-4333-8333-333333333333",
  category: "bienes-raices",
  seller_type: "business",
  detail_pairs: null,
  inventory_role: null,
};

const BR_PRIVADO_ROW: BrPropertyInventoryRowLike = {
  id: "44444444-4444-4444-8444-444444444444",
  category: "bienes-raices",
  seller_type: "individual",
  detail_pairs: null,
  inventory_role: null,
};

const NON_BR_ROW: BrPropertyInventoryRowLike = {
  id: "55555555-5555-4555-8555-555555555555",
  category: "rentas",
  seller_type: "business",
  detail_pairs: null,
  inventory_role: "main",
};

/* ------------------------------------------------------------------------------------------ *
 * Case 1 — BR Negocio main parent: Edit/Preview eligible.
 * ------------------------------------------------------------------------------------------ */
assert.equal(isBrNegocioListing(BASE_MAIN), true, "main row must classify as BR Negocio");
assert.equal(isBrInventoryMainListing(BASE_MAIN), true, "main row must classify as the main listing");
assert.equal(isBrInventoryProperty(BASE_MAIN), false, "main row must not classify as an inventory child");
assert.equal(isBrNegocioMainRowFor(BASE_MAIN), true, "main row must be Edit/Preview-eligible");

/* ------------------------------------------------------------------------------------------ *
 * Case 2 — BR Negocio inventory child: Edit/Preview must NOT be eligible.
 * ------------------------------------------------------------------------------------------ */
assert.equal(isBrNegocioListing(BASE_CHILD), true, "child row must classify as BR Negocio");
assert.equal(isBrInventoryProperty(BASE_CHILD), true, "child row must classify as an inventory child");
assert.equal(isBrInventoryMainListing(BASE_CHILD), false, "child row must not classify as the main listing");
assert.equal(
  isBrNegocioMainRowFor(BASE_CHILD),
  false,
  "child row must NOT be Edit/Preview-eligible — this is the exact Gate I.5.7A.1 defect closure",
);

/* ------------------------------------------------------------------------------------------ *
 * Case 3 — ambiguous/null inventory_role on an otherwise-BR-Negocio row: established contract
 * treats this as main-eligible (not silently reclassified as a child) — Gate I.5.7A.1 must not
 * invent a new role migration, only reuse the existing contract.
 * ------------------------------------------------------------------------------------------ */
assert.equal(isBrInventoryProperty(AMBIGUOUS_NULL_ROLE), false, "null-role row must not classify as a child");
assert.equal(
  isBrNegocioMainRowFor(AMBIGUOUS_NULL_ROLE),
  true,
  "null/ambiguous-role BR Negocio row must fall back to main-eligible per the established contract",
);

/* ------------------------------------------------------------------------------------------ *
 * Case 4 — BR Privado must never be misclassified as BR Negocio (unaffected by this gate).
 * ------------------------------------------------------------------------------------------ */
assert.equal(isBrNegocioListing(BR_PRIVADO_ROW), false, "BR Privado row must never classify as BR Negocio");
assert.equal(isBrNegocioMainRowFor(BR_PRIVADO_ROW), false, "BR Privado row is never BR-Negocio-main-eligible (irrelevant to its own unrelated Edit/Preview path)");

/* ------------------------------------------------------------------------------------------ *
 * Case 5 — non-BR category rows must never classify as BR Negocio (Rentas etc. unaffected).
 * ------------------------------------------------------------------------------------------ */
assert.equal(isBrNegocioListing(NON_BR_ROW), false, "non-BR category row must never classify as BR Negocio");
assert.equal(isBrNegocioMainRowFor(NON_BR_ROW), false, "non-BR category row is never BR-Negocio-main-eligible");

console.log("gate-i5-7a1-br-negocio-child-edit-preview-selftest: OK");
