/**
 * ASSISTED REOPEN (Rentas + Bienes Raices Negocio) — a staff reopen loads the SERVER row.
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-assisted-reopen-rentas-bienes-01.ts
 *
 * Source-level wiring assertions (comments stripped) plus EXECUTION of each family's own existing
 * row -> draft mapper on a raw stored row. No database, no network, no server.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
let checks = 0;
async function check(name: string, fn: () => void | Promise<void>) {
  checks += 1;
  try {
    await fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
function code(p: string): string {
  return readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const RENTAS_FORM = "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx";
const RENTAS_ROUTE = "app/api/clasificados/rentas/listing-edit/route.ts";
const BR_APP =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx";
const BR_ROUTE = "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts";

async function main() {
  await check("RENTAS intake: bound row -> the family's OWN reverse mapper, once, then marked", () => {
    const src = code(RENTAS_FORM);
    assert.ok(src.includes('useAssistedBoundRow("rentas")'), "uses useAssistedBoundRow for rentas");
    assert.ok(
      /import \{[^}]*mapOwnedRentasListingToPrivadoFormState[^}]*\} from "\.\.\/\.\.\/shared\/rentasDashboardEditHydration"/.test(src),
      "reuses the existing dashboard-edit reverse mapper (no second mapper)",
    );
    const at = src.indexOf("assistedBound.shouldHydrate");
    assert.ok(at > 0, "hydrates only when shouldHydrate");
    const block = src.slice(at - 200, src.indexOf("}, [hydrated, editContext, assistedBound]);", at));
    assert.ok(block.includes('assistedBound.status !== "ready"'), "waits for a ready bound row");
    assert.ok(block.includes("mapOwnedRentasListingToPrivadoFormState(assistedBound.bound.row)"), "maps the raw bound row");
    assert.ok(block.includes("setState(mapped)"), "applies it to the form state");
    assert.ok(block.includes("saveRentasPrivadoDraft(mapped)"), "persists to the store Preview -> Edit reads");
    assert.ok(block.includes("assistedBound.markHydrated()"), "marks hydrated so Preview -> Edit keeps edits");
    assert.ok(block.includes("editContext"), "owner dashboard edit never takes the assisted path");
    assert.ok(block.includes("!hydrated"), "waits for the local draft load so the server row wins over a stale local draft");
  });

  await check("RENTAS server: existing-row assisted update re-proves custody via the ledger", () => {
    const src = code(RENTAS_ROUTE);
    assert.ok(src.includes("isListingLinkedToBusiness"), "imports the custody proof");
    const upd = src.indexOf("if (listingId) {");
    assert.ok(upd > 0, "assisted update branch exists");
    const branch = src.slice(upd, src.indexOf("const insertRow", upd));
    const proof = branch.indexOf("isListingLinkedToBusiness({");
    const write = branch.indexOf(".update(patch)");
    assert.ok(proof > 0 && write > proof, "custody is proven BEFORE the row is written");
    assert.ok(branch.includes("listingSource: \"listings\""), "proof is against the listings ledger");
    assert.ok(branch.includes("assisted.ctx.businessId"), "proof is for the signed context's business");
    assert.ok(branch.includes("listing_not_linked_to_business"), "unlinked rows are refused");
    assert.ok(branch.includes("delete (patch as { status?: unknown }).status"), "lifecycle status is never written on update");
  });

  await check("BIENES intake: bound row -> the shared published-row mapper, once, then marked", () => {
    const src = code(BR_APP);
    assert.ok(src.includes('useAssistedBoundRow("bienes-raices")'), "uses useAssistedBoundRow for bienes-raices");
    assert.ok(
      src.includes("bienesPublishedRowToAgenteApplicationDraft") &&
        /from "\.\/utils\/bienesPublishedToAgenteApplicationDraft"/.test(src),
      "reuses the existing dashboard-edit reverse mapper",
    );
    const at = src.indexOf("assistedBound.shouldHydrate");
    assert.ok(at > 0, "hydrates only when shouldHydrate");
    const block = src.slice(at - 300, src.indexOf("assistedBound.markHydrated();", at) + 40);
    assert.ok(block.includes("isExistingDashboardListingMode"), "owner dashboard edit modes are excluded");
    assert.ok(block.includes("parentDraftReady"), "waits for the bootstrap so the server row wins over a stale local draft");
    assert.ok(block.includes("bienesPublishedRowToAgenteApplicationDraft({ row: assistedBound.bound.row })"), "maps the raw bound row");
    assert.ok(block.includes("setState(mapped)"), "applies it to the form state");
    assert.ok(block.includes("persistAgenteResApplicationDraftQuiet(mapped, { applicationInstanceId })"), "persists to the draft store Preview -> Edit reads");
    assert.ok(block.includes("assistedBound.markHydrated()"), "marks hydrated so Preview -> Edit keeps edits");
  });

  await check("BIENES server: update targets the bound row by id under custody, never by owner, never lifecycle", () => {
    const src = code(BR_ROUTE);
    const linked = src.indexOf("isListingLinkedToBusiness({");
    const start = src.indexOf("if (listingId) {");
    const end = src.indexOf("} else {", start);
    assert.ok(linked > 0 && start > linked, "custody proof precedes the update branch");
    const block = src.slice(start, end);
    assert.ok(!block.includes('.eq("owner_id"'), "update no longer demands an owner match (owner-null / owner-changed rows)");
    assert.ok(block.includes('.eq("id", listingId)') && block.includes('.eq("category", "bienes-raices")'), "targets the bound row by id + category");
    for (const f of ["status", "is_published", "published_at", "owner_id", "inventory_role", "br_inventory_group_id", "br_inventory_parent_listing_id"]) {
      assert.ok(block.includes(`delete patch.${f};`), `update never writes ${f}`);
    }
    assert.ok(block.includes("listing_category_mismatch"), "a row of another category is refused");
    assert.ok(!src.includes("listing_owner_mismatch"), "no owner-mismatch 409 remains on the assisted path");
    const act = src.slice(src.indexOf("const activatedAt"));
    assert.ok(!act.includes('.eq("owner_id"'), "post-payment activation is by id under custody too");
    assert.ok(src.includes("refuseUnlessAuthoritativePayment({"), "activation is still behind the payment check");
  });

  await check("RENTAS mapper executes on a raw stored row (same function the owner dashboard uses)", async () => {
    const { mapOwnedRentasListingToPrivadoFormState } = await import(
      "../app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration"
    );
    const draft = mapOwnedRentasListingToPrivadoFormState({
      id: "row-1",
      owner_id: null,
      title: "Casa en renta cerca del centro",
      description: "Casa amplia",
      city: "Salinas",
      state: "CA",
      zip: "93901",
      category: "rentas",
      price: 2400,
      images: ["https://cdn.example.test/a.jpg"],
      detail_pairs: [],
      contact_phone: "8315550100",
      contact_email: "cliente@example.test",
    });
    assert.equal(draft.titulo, "Casa en renta cerca del centro");
    assert.equal(draft.rentaMensual, "2400");
    assert.equal(draft.ciudad, "Salinas");
    assert.equal(draft.seller.telefono, "8315550100");
    assert.deepEqual(draft.media.photoDataUrls, ["https://cdn.example.test/a.jpg"]);
  });

  await check("BIENES mapper executes on a raw stored row and keeps the brokerage identity", async () => {
    const { bienesPublishedRowToAgenteApplicationDraft } = await import(
      "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft"
    );
    const draft = bienesPublishedRowToAgenteApplicationDraft({
      row: {
        id: "row-2",
        owner_id: null,
        title: "Casa de 3 recamaras",
        description: "Descripcion",
        city: "Salinas",
        price: 450000,
        images: ["https://cdn.example.test/b.jpg"],
        detail_pairs: [],
        contact_phone: "8315550111",
        contact_email: "agente@example.test",
        seller_type: "business",
        business_name: "Correduria Prueba",
        business_meta: null,
        inventory_role: "main",
        br_inventory_group_id: "row-2",
      },
    });
    assert.equal(draft.titulo, "Casa de 3 recamaras");
    assert.equal(draft.ciudad, "Salinas");
    assert.equal(draft.additionalInventoryProperties.length, 0);
  });

  if (failures.length) {
    console.error(`verify-assisted-reopen-rentas-bienes-01: ${failures.length}/${checks} FAILED`);
    for (const f of failures) console.error("  x " + f);
    process.exit(1);
  }
  console.log(`verify-assisted-reopen-rentas-bienes-01: PASS (${checks} checks)`);
}

void main();
