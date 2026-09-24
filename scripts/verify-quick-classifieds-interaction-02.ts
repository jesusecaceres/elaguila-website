/**
 * LEONIX QUICK CLASSIFIEDS — PRE-QA FORENSIC verifier (Gate 2 + Gate 3-6 field wiring).
 * Run: npx tsx scripts/verify-quick-classifieds-interaction-02.ts
 *
 * Complements verify-quick-classifieds-onramp-01.ts (§8 static interaction contract) with:
 *  A. RUNTIME proof on the pure validation layer that the owner's representative strings survive
 *     untouched ("San Jose", "East San Jose", "Joe's Landscaping", "María López",
 *     "2 bedroom apartment", "Call after 5 pm", multiline descriptions) and that normalization is
 *     boundary-only (quickStr trims the ends, never the inside; validateQuickStep never mutates).
 *  B. STATIC proof that EVERY visible Quick field key declared in an adapter's steps is READ by the
 *     same adapter's buildAndWriteCanonicalDraft (no decorative / unwired field), and that each
 *     Tier-1 adapter writes the exact canonical destination keys the proof matrix cites.
 *  C. STATIC proof that the intake reducer never resets sibling state (every setter spreads `...d`),
 *     the media step removes / re-orders by id only, and the community family is linked to its
 *     existing short form (never through the generic Quick intake) from both entry surfaces.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { quickDigitsOnly, quickIsLikelyEmail, quickStr, quickWholeDollars, validateQuickStep } from "../app/lib/quickClassifieds/quickClassifiedValidation";
import type { QuickIntakeStep, QuickIntakeValues } from "../app/lib/quickClassifieds/quickClassifiedTypes";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const ADAPTERS = "app/(site)/publicar/rapido/_adapters";
const COMPONENTS = "app/(site)/publicar/rapido/_components";

// A. RUNTIME — representative strings through the pure validation layer -----------------------------
{
  const step: QuickIntakeStep = {
    id: "t",
    title: { es: "t", en: "t" },
    fields: [
      { key: "title", kind: "text", label: { es: "Título", en: "Title" }, required: true, maxLength: 120 },
      { key: "description", kind: "textarea", label: { es: "Descripción", en: "Description" }, required: true, maxLength: 2000 },
      { key: "city", kind: "city", cityMode: "free", label: { es: "Ciudad", en: "City" }, required: true },
      { key: "displayName", kind: "text", label: { es: "Nombre", en: "Name" }, required: true },
      { key: "phone", kind: "phone", label: { es: "Teléfono", en: "Phone" } },
      { key: "email", kind: "email", label: { es: "Correo", en: "Email" } },
      { key: "zip", kind: "zip", label: { es: "ZIP", en: "ZIP" } },
      { key: "price", kind: "currency", label: { es: "Precio", en: "Price" }, required: true },
    ],
    atLeastOne: { keys: ["phone", "email"], message: { es: "contacto", en: "contact" } },
  };
  const values: QuickIntakeValues = {
    title: "2 bedroom apartment",
    description: "Sofá cómodo, casi nuevo.\nCall after 5 pm",
    city: "East San Jose",
    displayName: "Joe's Landscaping",
    phone: "(408) 555-0123",
    email: "maria.lopez@example.com",
    zip: "95116",
    price: "$1,250",
  };
  const snapshot = JSON.stringify(values);
  assert.deepEqual(validateQuickStep(step, values, "es"), [], "representative values pass step validation (es)");
  assert.deepEqual(validateQuickStep(step, values, "en"), [], "representative values pass step validation (en)");
  assert.equal(JSON.stringify(values), snapshot, "validateQuickStep never mutates the typed values");
  // Boundary-only normalization: ends trimmed, inside preserved (apostrophe, accents, inner spaces, newline).
  assert.equal(quickStr({ n: "  Joe's Landscaping  " }, "n"), "Joe's Landscaping");
  assert.equal(quickStr({ n: "María López" }, "n"), "María López");
  assert.equal(quickStr({ n: "San Jose" }, "n"), "San Jose");
  assert.equal(quickStr({ n: "2  bedroom apartment" }, "n"), "2  bedroom apartment", "inner double space preserved");
  assert.equal(quickStr({ n: "Sofá cómodo.\nCall after 5 pm" }, "n"), "Sofá cómodo.\nCall after 5 pm", "multiline preserved");
  assert.equal(quickStr({ n: "Call after 5 pm " }, "n"), "Call after 5 pm");
  assert.equal(quickDigitsOnly("(408) 555-0123"), "4085550123", "phone digits extracted only at validation/adapter time");
  assert.equal(quickWholeDollars("$1,250"), "1250");
  assert.equal(quickWholeDollars("11500"), "11500");
  assert.ok(quickIsLikelyEmail("maria.lopez@example.com"));
  // In-progress typing states are not rejected as required-missing, and partial phone is flagged only on Next.
  const typing: QuickIntakeValues = { ...values, phone: "408" };
  const issues = validateQuickStep(step, typing, "es");
  assert.equal(issues.length, 1, "partial phone flagged exactly once at the step boundary");
  assert.ok(issues[0]!.includes("10 dígitos"));
  // Optional empties are ignored (no phantom errors); toggle false is not "empty".
  assert.deepEqual(validateQuickStep(step, { ...values, zip: "", phone: "" }, "en"), [], "optional empties ignored, email satisfies atLeastOne");
}

// B. STATIC — every visible field key is read by its adapter; Tier-1 canonical destinations present --------
{
  const readsKey = (src: string, key: string): boolean => {
    if (key === "city") return /resolveCity\(values\)/.test(src);
    const re = new RegExp(`\\((values|v), "${key}"\\)|values\\.${key}\\b|"${key}"\\)`);
    return re.test(src);
  };
  const adapterFiles: Record<string, { extraKeys?: string[] }> = {
    "enVentaQuickAdapter.ts": {},
    "rentasPrivadoQuickAdapter.ts": {},
    "autosPrivadoQuickAdapter.ts": {},
    "empleosQuickAdapter.ts": {},
    "bienesRaicesPrivadoQuickAdapter.ts": {},
    "communityQuickAdapters.ts": {},
    "buscoQuickAdapter.ts": {},
    "mascotasQuickAdapter.ts": {},
  };
  const shared = read(`${ADAPTERS}/quickAdapterShared.ts`);
  assert.ok(/key: "phone"/.test(shared) && /key: "whatsapp"/.test(shared) && /key: "email"/.test(shared) && /key: "smsPhone"/.test(shared), "shared contact step declares phone/whatsapp/email/smsPhone");
  for (const [file] of Object.entries(adapterFiles)) {
    const src = read(`${ADAPTERS}/${file}`);
    const declared = new Set([...src.matchAll(/\{\s*key: "([A-Za-z]+)"/g)].map((m) => m[1]!));
    // contact step keys (from quickAdapterShared) + nameKey
    for (const k of ["phone", "whatsapp", "email"]) declared.add(k);
    if (/includeSms: true/.test(src)) declared.add("smsPhone");
    for (const m of src.matchAll(/nameKey: "([A-Za-z]+)"/g)) declared.add(m[1]!);
    if (/cityField\(/.test(src)) declared.add("city");
    const unwired = [...declared].filter((k) => !readsKey(src, k));
    assert.deepEqual(unwired, [], `${file}: every visible Quick field is read by buildAndWriteCanonicalDraft (unwired: ${unwired.join(", ")})`);
  }
  // Tier-1 canonical destination keys (exact writes the proof matrix cites).
  const expectCanonical: Record<string, string[]> = {
    "enVentaQuickAdapter.ts": ["rama:", "itemType:", "condition:", "title:", "priceIsFree,", "price:", "description:", "images:", "primaryImageIndex: 0", "city:", "zip:", 'seller_kind: "individual"', "displayName:", "contactMethod:", "confirmListingAccurate:", "confirmPhotosRepresentItem:", "confirmCommunityRules:"],
    "rentasPrivadoQuickAdapter.ts": ["tipoDeRenta:", "categoriaPropiedad: rentasCategoriaPropiedadForTipo(tipo)", 'posterType: "owner_private"', "titulo:", "rentaMensual:", "deposito:", "disponibilidad:", "descripcion:", "ciudad:", "direccionEstado:", "direccionPais:", "direccionCodigoPostal:", "direccionCruceCercano:", "mostrarDireccionExacta: false", "photoDataUrls:", "nombre:", "telefono:", "whatsapp:", "mensajesTexto:", "correo:", "confirmListingAccurate:", "confirmPhotosRepresentItem:", "confirmCommunityRules:"],
    "autosPrivadoQuickAdapter.ts": ['autosLane: "privado"', "year:", "make:", "model:", "mileage:", "price:", "description:", "city:", "zip:", "dealerName:", "dealerPhoneMobile:", "dealerWhatsapp:", "dealerEmail:", "mediaImages,", "heroImages:", 'sourceType: "file"', "isPrimary: i === 0"],
    "empleosQuickAdapter.ts": ["title:", "businessName:", "jobType:", "jobTypeCustom:", "categorySlug:", "categoryCustom:", "payUnit:", "payAmount:", "schedule:", "description:", "city:", "state,", "stateRegion: state", "country:", "images: mediaToEmpleosImageItems(media)", "contactPerson:", "phone:", "whatsapp:", "email:", "primaryCta: cta", "preferredApplyMethod: cta"],
  };
  for (const [file, keys] of Object.entries(expectCanonical)) {
    const src = read(`${ADAPTERS}/${file}`);
    for (const k of keys) assert.ok(src.includes(k), `${file}: writes canonical destination \`${k}\``);
  }
  // Canonical gate + store + handoff per Tier-1 adapter (re-asserted here so this file stands alone).
  assert.ok(/collectEnVentaCoreBlockers\(ctx\.lang, state\)[\s\S]*persistEnVentaPreviewHandoffAsync\("pro", state\)/.test(read(`${ADAPTERS}/enVentaQuickAdapter.ts`)), "En Venta: canonical gate runs before the canonical store write");
  assert.ok(/gateRentasPrivadoPreview\(state\)[\s\S]*await saveRentasPrivadoDraft\(state\)/.test(read(`${ADAPTERS}/rentasPrivadoQuickAdapter.ts`)), "Rentas: canonical gate runs before the awaited canonical store write");
  assert.ok(/getAutosPreviewCompletenessIssues\("privado", listing\)[\s\S]*rememberAutosDraftNamespaceHint\("privado", ns\)[\s\S]*await saveAutosPrivadoDraftResolved\(ns/.test(read(`${ADAPTERS}/autosPrivadoQuickAdapter.ts`)), "Autos: canonical completeness gate, namespace hint, then awaited namespaced store write");
  assert.ok(/gateEmpleosQuickPreview\(draft, ctx\.lang\)[\s\S]*flushEmpleosDraftToSession\(EMPLEOS_SESSION_KEYS\.quick, draft\)/.test(read(`${ADAPTERS}/empleosQuickAdapter.ts`)), "Empleos: canonical gate runs before the canonical session write");
}

// C. STATIC — reducer never resets siblings; media by id; community family linked direct ----------------------
{
  const intake = read(`${COMPONENTS}/QuickIntakeClient.tsx`);
  assert.ok(intake.includes("setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }))"), "setValue patches one key");
  assert.ok(intake.includes("setDraft((d) => ({ ...d, media }))"), "setMedia keeps values/confirmations/step");
  assert.ok(intake.includes("setDraft((d) => ({ ...d, confirmations }))"), "setConfirmations keeps values/media/step");
  assert.ok(intake.includes("setDraft((d) => ({ ...d, stepIndex: index }))"), "goTo changes only the step index");
  assert.ok(intake.includes("values: { ...missing, ...d.values }"), "prefills never overwrite typed values after hydration");
  assert.ok(intake.includes("validateQuickStep(steps[stepIndex]!, draft.values, lang)") && intake.includes("goTo(stepIndex + 1)"), "validation runs on Next only, then the step advances without touching values");
  const media = read(`${COMPONENTS}/QuickMediaStep.tsx`);
  assert.ok(media.includes("onChange(media.filter((m) => m.id !== id));"), "remove() drops exactly one image by id");
  assert.ok(/const \[item\] = next\.splice\(idx, 1\);\s*next\.unshift\(item\);/.test(media), "makeCover() re-orders by id, never re-reads files");
  const store = read(`${COMPONENTS}/quickIntakeDraftStore.ts`);
  assert.ok(store.includes("values: parsed.values") && store.includes("STORE.inlinePhotoArray(ns(category)") && store.includes("STORE.offloadPhotoArray(ns(category)"), "text values and photos persist together (sessionStorage + heavy-media IndexedDB)");
  // Community family → existing short form, from both entry surfaces (no wrapper in the linked path).
  const chooser = read(`${COMPONENTS}/QuickCategoryChooser.tsx`);
  assert.ok(chooser.includes("(QUICK_COMMUNITY_KEYS as readonly string[]).includes(def.key)") && chooser.includes("direct ? `${def.standardApplicationPath}?lang=${routeLang}` : quickClassifiedCategoryPath("), "customer chooser links community categories to their existing short form");
  const launchpad = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  assert.ok(launchpad.includes("if (isCommunity || def.status === \"blocked\") return withLang(def.standardApplicationPath, lang);"), "staff launchpad links community categories to their existing short form");
  const reg = read("app/lib/quickClassifieds/quickClassifiedRegistry.ts");
  for (const p of ['"/publicar/clases/quick"', '"/publicar/comunidad/quick"', '"/publicar/busco/quick"', '"/publicar/mascotas-y-perdidos/quick"']) {
    assert.ok(reg.includes(`standardApplicationPath: ${p}`), `registry direct short-form path ${p}`);
  }
  // Staff custody truth in copy: launchpad + intake banner say the customer signs in and owns the ad.
  assert.ok(launchpad.includes("El cliente inicia sesión con su correo y el anuncio queda a su nombre."), "launchpad copy states customer ownership (no staff-publish promise)");
  assert.ok(!/publicamos por ti|we publish for you|publish on your behalf|publicar en su nombre/i.test(launchpad), "launchpad never promises staff-side publishing");
  const copy = read("app/lib/quickClassifieds/quickClassifiedCopy.ts");
  assert.ok(copy.includes("Inicia sesión con tu correo y el anuncio quedará a tu nombre."), "staff-link banner states customer ownership");
}

console.log("verify-quick-classifieds-interaction-02: OK");
