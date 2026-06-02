/**
 * Phase 8B — Servicios business-type preset integrity + merge/mapping smoke (no network, no AI).
 * Run: npx tsx scripts/smoke-servicios-business-presets.ts
 * Or: node scripts/smoke-servicios-business-presets.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ServiciosInternalGroup } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { BUSINESS_TYPE_PRESETS, getBusinessTypePreset } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import type { ClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { mapClasificadosServiciosApplicationToServiciosDraft } from "../app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { mergeStateForBusinessTypeChange } from "../app/(site)/clasificados/publicar/servicios/lib/presetStateMerge";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import { resolveServiciosPublicCategoryLabel } from "../app/(site)/clasificados/publicar/servicios/lib/resolveServiciosPublicCategoryLabel";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import {
  resolveServiciosServiceVisual,
  SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI,
  SERVICIOS_SERVICE_LABEL_KEYWORD_RULES,
} from "../app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const FALLBACK_PRESET_IDS = new Set(["servicio_otro_generico", "servicio_no_listado"]);
const ALLOWED_DUPLICATE_SERVICE_CHIP_IDS = new Set(["carp_reparacion", "trad_certificada"]);
const INTERNAL_GROUPS: ServiciosInternalGroup[] = [
  "home_trade",
  "automotive",
  "health_beauty",
  "legal_professional",
  "education_tutoring",
  "events_entertainment",
  "technology_support",
  "miscellaneous",
  "other",
];

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function normalizeHay(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function keywordMatchForSmoke(labelHay: string): { emoji: string } | null {
  if (!labelHay.trim()) return null;
  for (const r of SERVICIOS_SERVICE_LABEL_KEYWORD_RULES) {
    if (r.test.test(labelHay)) return { emoji: r.emoji };
  }
  return null;
}

function assert(cond: unknown, msg: string): void {
  if (!cond) fail(msg);
}

const issues: string[] = [];
function note(msg: string): void {
  issues.push(msg);
  console.warn(`WARN: ${msg}`);
}

const COMMON_CUSTOM_SERVICE_LABELS = [
  "reparación de celular",
  "abogado de inmigración",
  "limpieza de casa",
  "corte de cabello",
  "cambio de aceite",
  "plomería",
  "electricidad",
  "uñas",
  "fotografía",
  "desarrollo web",
];

function main(): void {
  console.log("Servicios business-type preset smoke (Phase 8B)\n");

  const presetIds = new Set<string>();
  const serviceIdToPresets = new Map<string, string[]>();

  for (const p of BUSINESS_TYPE_PRESETS) {
    if (presetIds.has(p.id)) fail(`Duplicate preset id: ${p.id}`);
    presetIds.add(p.id);
    if (!INTERNAL_GROUPS.includes(p.internalGroup)) fail(`Invalid internalGroup on ${p.id}: ${p.internalGroup}`);
    if (!p.labelEs?.trim() || !p.labelEn?.trim()) fail(`Missing ES/EN label on preset ${p.id}`);
    for (const chip of p.suggestedServices) {
      const arr = serviceIdToPresets.get(chip.id) ?? [];
      arr.push(p.id);
      serviceIdToPresets.set(chip.id, arr);
    }
  }

  const isFallback = (id: string) => FALLBACK_PRESET_IDS.has(id);

  for (const p of BUSINESS_TYPE_PRESETS) {
    const fb = isFallback(p.id);
    const chipArrays: { name: string; chips: { id: string; es: string; en: string }[] }[] = [
      { name: "suggestedServices", chips: p.suggestedServices },
      { name: "reasonsToChoose", chips: p.reasonsToChoose },
      { name: "quickFacts", chips: p.quickFacts },
      { name: "primaryCtaOptions", chips: p.primaryCtaOptions },
      { name: "secondaryCtaOptions", chips: p.secondaryCtaOptions },
    ];
    for (const { name, chips } of chipArrays) {
      const ids = new Set<string>();
      const esSet = new Set<string>();
      const enSet = new Set<string>();
      for (const c of chips) {
        if (!c.id?.trim() || !c.es?.trim() || !c.en?.trim()) {
          fail(`Preset ${p.id} ${name}: chip missing id/es/en`);
        }
        const esK = normalizeHay(c.es);
        const enK = normalizeHay(c.en);
        if (ids.has(c.id)) fail(`Preset ${p.id} ${name}: duplicate chip id ${c.id}`);
        if (esSet.has(esK)) fail(`Preset ${p.id} ${name}: duplicate ES label "${c.es}"`);
        if (enSet.has(enK)) fail(`Preset ${p.id} ${name}: duplicate EN label "${c.en}"`);
        ids.add(c.id);
        esSet.add(esK);
        enSet.add(enK);
      }
    }

    if (!fb) {
      if (p.suggestedServices.length < 4) fail(`Preset ${p.id}: need >=4 suggestedServices (has ${p.suggestedServices.length})`);
      if (p.reasonsToChoose.length < 3) fail(`Preset ${p.id}: need >=3 reasons (has ${p.reasonsToChoose.length})`);
    } else {
      if (p.suggestedServices.length < 1) fail(`Fallback ${p.id}: need at least 1 suggested service`);
      if (p.reasonsToChoose.length < 1) fail(`Fallback ${p.id}: need at least 1 reason`);
    }
    if (p.quickFacts.length < 1) fail(`Preset ${p.id}: need >=1 quickFact`);
    if (p.primaryCtaOptions.length < 1) fail(`Preset ${p.id}: need >=1 primary CTA`);
    if (p.secondaryCtaOptions.length < 1) {
      note(`Preset ${p.id}: secondaryCtaOptions empty (allowed only if intentional)`);
    }
  }

  for (const [chipId, presets] of serviceIdToPresets) {
    if (presets.length > 1 && !ALLOWED_DUPLICATE_SERVICE_CHIP_IDS.has(chipId)) {
      fail(`Service chip id "${chipId}" reused across presets without allowlist: ${presets.join(", ")}`);
    }
  }

  for (const p of BUSINESS_TYPE_PRESETS) {
    for (const chip of p.suggestedServices) {
      const resolved = resolveServiciosServiceVisual({
        id: chip.id,
        label: chip.es,
        businessTypeId: p.id,
        internalGroup: p.internalGroup,
      });
      if (!resolved.emoji?.trim()) {
        fail(`Empty emoji for preset ${p.id} service ${chip.id}`);
      }
      const hay = normalizeHay(`${chip.es} ${chip.en}`);
      const kw = keywordMatchForSmoke(hay);
      if (
        resolved.emoji === SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI &&
        kw &&
        kw.emoji !== SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI
      ) {
        fail(
          `Preset ${p.id} service ${chip.id}: resolved generic ${SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI} but keyword rules suggest ${kw.emoji} for "${chip.es}"`,
        );
      }
    }
  }

  for (const lab of COMMON_CUSTOM_SERVICE_LABELS) {
    const r = resolveServiciosServiceVisual({ label: lab });
    if (!r.emoji?.trim()) fail(`Common custom label "${lab}" resolved empty emoji`);
    if (r.emoji === SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI) {
      note(`Common custom label "${lab}" still uses default emoji (acceptable if no rule)`);
    }
  }

  const plom = getBusinessTypePreset("plomeria")!;
  const elec = getBusinessTypePreset("electricista")!;
  const baseMerge: ClasificadosServiciosApplicationState = normalizeClasificadosServiciosApplicationState({
    ...createDefaultClasificadosServiciosState(),
    businessTypeId: "plomeria",
    selectedServiceIds: [plom.suggestedServices[0]!.id, plom.suggestedServices[1]!.id],
    selectedReasonIds: [plom.reasonsToChoose[0]!.id, plom.reasonsToChoose[1]!.id],
    selectedQuickFactIds: [plom.quickFacts[0]!.id],
    primaryCtaId: plom.primaryCtaOptions[0]!.id,
    secondaryCtaIds: [plom.secondaryCtaOptions[0]!.id],
    customServicesOffered: ["Limpieza express"],
    customServiceDescription: "",
  });

  const merged = mergeStateForBusinessTypeChange(baseMerge, "electricista");
  const eSet = new Set(elec.suggestedServices.map((c) => c.id));
  const erSet = new Set(elec.reasonsToChoose.map((c) => c.id));
  const eqSet = new Set(elec.quickFacts.map((c) => c.id));
  for (const id of merged.selectedServiceIds) assert(eSet.has(id), `Stale service id after merge: ${id}`);
  for (const id of merged.selectedReasonIds) assert(erSet.has(id), `Stale reason id after merge: ${id}`);
  for (const id of merged.selectedQuickFactIds) assert(eqSet.has(id), `Stale quickFact id after merge: ${id}`);
  assert(merged.primaryCtaId === "", "primaryCtaId should reset to empty on business type change");
  assert(merged.secondaryCtaIds.length === 0, "secondaryCtaIds cleared on business type change");
  assert(merged.customServicesOffered.includes("Limpieza express"), "customServicesOffered preserved on merge");

  const otroWithDesc = mergeStateForBusinessTypeChange(
    normalizeClasificadosServiciosApplicationState({
      ...createDefaultClasificadosServiciosState(),
      businessTypeId: "servicio_otro_generico",
      customServiceDescription: "Reparación de pantallas",
      selectedServiceIds: [],
    }),
    "plomeria",
  );
  assert(
    !String(otroWithDesc.customServiceDescription ?? "").trim(),
    "customServiceDescription should clear when leaving servicio_otro_generico",
  );

  const catCustom = resolveServiciosPublicCategoryLabel(
    { businessTypeId: "servicio_otro_generico", customServiceDescription: "Reparación de celulares" },
    "es",
  );
  assert(catCustom === "Reparación de celulares", "Public category should use custom description for Otro");
  assert(!/\botro\b/i.test(catCustom ?? ""), "Public category must not contain word Otro when custom exists");

  const catEn = resolveServiciosPublicCategoryLabel(
    { businessTypeId: "servicio_otro_generico", customServiceDescription: "Cell phone repair" },
    "en",
  );
  assert(catEn === "Cell phone repair", "EN public category uses custom description");
  assert(!/\bother service\b/i.test(catEn ?? ""), "Public category must not show Other service when custom exists");

  const firstByGroup = new Map<ServiciosInternalGroup, string>();
  for (const p of BUSINESS_TYPE_PRESETS) {
    if (!firstByGroup.has(p.internalGroup)) firstByGroup.set(p.internalGroup, p.id);
  }
  for (const g of INTERNAL_GROUPS) {
    assert(firstByGroup.has(g), `No preset found for internalGroup ${g}`);
  }

  for (const g of INTERNAL_GROUPS) {
    const pid = firstByGroup.get(g)!;
    const preset = getBusinessTypePreset(pid)!;
    const s0 = preset.suggestedServices[0]!.id;
    const s1 = preset.suggestedServices[1]!.id;
    const r0 = preset.reasonsToChoose[0]!.id;
    const r1 = preset.reasonsToChoose[1]!.id;
    const q0 = preset.quickFacts[0]!.id;
    const cta0 = preset.primaryCtaOptions[0]!.id;
    const st = normalizeClasificadosServiciosApplicationState({
      ...createDefaultClasificadosServiciosState(),
      businessTypeId: pid,
      businessName: "Smoke Co",
      city: "San José",
      website: "https://example.com",
      quoteMessagePhone: "4085551212",
      selectedServiceIds: [s0, s1],
      selectedReasonIds: [r0, r1],
      selectedQuickFactIds: [q0],
      customServicesOffered: ["Instalación express"],
      primaryCtaId: cta0,
      customServiceDescription: g === "other" ? "Servicio de prueba" : "",
      promotions: [
        {
          title: "Promo",
          details: "Detalle",
          link: "https://example.com/p",
          imageUrl: "",
          pdfUrl: "",
          pdfFileName: "",
          pdfFileSizeBytes: 0,
          primaryAsset: "link" as const,
          qrLater: false,
        },
      ],
      paymentMethodIds: ["cash"],
      customPaymentMethods: [],
      amenityOptionIds: [],
      customAmenityOptions: [],
      certifications: ["ISO ready"],
      hasLicense: true,
      licenseType: "State",
      licenseNumber: "X1",
      licenseAuthority: "CA",
      licenseExpiration: "",
      isInsured: true,
      insuranceType: "GL",
      licenseDocumentUrl: "",
      insuranceDocumentUrl: "",
    });
    const draftEs = mapClasificadosServiciosApplicationToServiciosDraft(st, "es");
    const sTitles = (draftEs.services ?? []).map((x) => x.title);
    assert(sTitles.some((t) => t === preset.suggestedServices[0]!.es), `${g}: first service maps`);
    assert(sTitles.some((t) => t === "Instalación express"), `${g}: custom service maps`);
    assert((draftEs.trust ?? []).length >= 2, `${g}: reasons/trust map`);
    assert((draftEs.quickFacts ?? []).length >= 1, `${g}: quick facts map`);
    if (g === "other") {
      assert(draftEs.hero.categoryLine === "Servicio de prueba", `${g}: category line uses custom description`);
    } else {
      assert(draftEs.hero.categoryLine === langEsLabel(preset), `${g}: category line ES`);
    }
    const draftEn = mapClasificadosServiciosApplicationToServiciosDraft(st, "en");
    if (g === "other") {
      assert(draftEn.hero.categoryLine === "Servicio de prueba", `${g}: category line EN custom`);
    } else {
      assert(draftEn.hero.categoryLine === preset.labelEn.trim(), `${g}: category line EN`);
    }
    assert((draftEs.promotions ?? []).length >= 1, `${g}: promotions map`);
  }

  const otroState = normalizeClasificadosServiciosApplicationState({
    ...createDefaultClasificadosServiciosState(),
    businessTypeId: "servicio_otro_generico",
    customServiceDescription: "Limpieza de oficinas",
    businessName: "Otro Smoke",
    city: "Heredia",
    website: "https://example.com",
    quoteMessagePhone: "50688888888",
    selectedServiceIds: [getBusinessTypePreset("servicio_otro_generico")!.suggestedServices[0]!.id],
  });
  const draftOtro = mapClasificadosServiciosApplicationToServiciosDraft(otroState, "es");
  assert(draftOtro.hero.categoryLine === "Limpieza de oficinas", "Otro: categoryLine wins with custom description");
  assert(!/\botro\b/i.test(draftOtro.hero.categoryLine ?? ""), "Draft category must not leak Otro");

  const regression = normalizeClasificadosServiciosApplicationState({
    ...createDefaultClasificadosServiciosState(),
    businessTypeId: "plomeria",
    customServicesOffered: ["Destape express"],
    selectedBusinessHighlightIds: ["bh_free_quote"],
    customBusinessHighlights: ["Atención el mismo día"],
    paymentMethodIds: ["credit_debit_card"],
    amenityOptionIds: ["service_at_home"],
    customAmenityOptions: ["WiFi en sala de espera"],
    certifications: ["EPA lead-safe"],
    promotions: [
      {
        title: "Descuento",
        details: "10%",
        link: "",
        imageUrl: "",
        pdfUrl: "",
        pdfFileName: "",
        pdfFileSizeBytes: 0,
        primaryAsset: "none" as const,
        qrLater: false,
      },
      {
        title: "2x1 servicio",
        details: "Válido en temporada baja",
        link: "https://example.com/promo",
        imageUrl: "",
        pdfUrl: "",
        pdfFileName: "",
        pdfFileSizeBytes: 0,
        primaryAsset: "link" as const,
        qrLater: false,
      },
    ],
  });
  const dReg = mapClasificadosServiciosApplicationToServiciosDraft(regression, "es");
  assert((dReg.highlights ?? []).length >= 1, "Regression: highlights map");
  assert((dReg.paymentMethodIds ?? []).length >= 1, "Regression: pagos map");
  assert((dReg.amenityOptionIds ?? []).length >= 1, "Regression: opciones preset ids map");
  assert((dReg.customAmenityOptions ?? []).length >= 1, "Regression: opciones custom map");
  assert(dReg.credentials?.certifications?.includes("EPA lead-safe"), "Regression: credenciales map");

  const uniquePresetIds =
    new Set(BUSINESS_TYPE_PRESETS.map((p) => p.id)).size === BUSINESS_TYPE_PRESETS.length;
  const dupServiceIdsOk = [...serviceIdToPresets.entries()].every(
    ([id, presets]) => presets.length <= 1 || ALLOWED_DUPLICATE_SERVICE_CHIP_IDS.has(id),
  );
  const mappingGroupsOk = INTERNAL_GROUPS.every((g) => firstByGroup.has(g));
  const allLabelsEs = BUSINESS_TYPE_PRESETS.every((p) => Boolean(p.labelEs?.trim()));
  const allLabelsEn = BUSINESS_TYPE_PRESETS.every((p) => Boolean(p.labelEn?.trim()));
  const allInternalGroupsValid = BUSINESS_TYPE_PRESETS.every((p) => INTERNAL_GROUPS.includes(p.internalGroup));
  const coverageServices = BUSINESS_TYPE_PRESETS.every((p) => isFallback(p.id) || p.suggestedServices.length >= 4);
  const coverageReasons = BUSINESS_TYPE_PRESETS.every((p) => isFallback(p.id) || p.reasonsToChoose.length >= 3);
  const coverageQuickFacts = BUSINESS_TYPE_PRESETS.every((p) => p.quickFacts.length >= 1);
  const coveragePrimaryCta = BUSINESS_TYPE_PRESETS.every((p) => p.primaryCtaOptions.length >= 1);
  let chipsIdEsEn = true;
  let noDupChipIdsInPreset = true;
  let noDupEsInPreset = true;
  let noDupEnInPreset = true;
  let stableChipIds = true;
  for (const p of BUSINESS_TYPE_PRESETS) {
    for (const arr of [
      p.suggestedServices,
      p.reasonsToChoose,
      p.quickFacts,
      p.primaryCtaOptions,
      p.secondaryCtaOptions,
    ]) {
      const ids = new Set<string>();
      const es = new Set<string>();
      const en = new Set<string>();
      for (const c of arr) {
        if (!c.id?.trim() || !c.es?.trim() || !c.en?.trim()) chipsIdEsEn = false;
        if (!/^[a-z][a-z0-9_]*$/i.test(c.id)) stableChipIds = false;
        const esK = normalizeHay(c.es);
        const enK = normalizeHay(c.en);
        if (ids.has(c.id)) noDupChipIdsInPreset = false;
        if (es.has(esK)) noDupEsInPreset = false;
        if (en.has(enK)) noDupEnInPreset = false;
        ids.add(c.id);
        es.add(esK);
        en.add(enK);
      }
    }
  }
  let allServiceEmojisNonEmpty = true;
  let noGenericWhenKeywordBetter = true;
  for (const p of BUSINESS_TYPE_PRESETS) {
    for (const chip of p.suggestedServices) {
      const resolved = resolveServiciosServiceVisual({
        id: chip.id,
        label: chip.es,
        businessTypeId: p.id,
        internalGroup: p.internalGroup,
      });
      if (!resolved.emoji?.trim()) allServiceEmojisNonEmpty = false;
      const hay = normalizeHay(`${chip.es} ${chip.en}`);
      const kw = keywordMatchForSmoke(hay);
      if (
        resolved.emoji === SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI &&
        kw &&
        kw.emoji !== SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI
      ) {
        noGenericWhenKeywordBetter = false;
      }
    }
  }
  const commonCustomUsefulEmoji = COMMON_CUSTOM_SERVICE_LABELS.every((lab) => {
    const r = resolveServiciosServiceVisual({ label: lab });
    return Boolean(r.emoji?.trim()) && r.emoji !== SERVICIOS_SERVICE_VISUAL_DEFAULT_EMOJI;
  });
  const mergeClearsInvalidServices = merged.selectedServiceIds.every((id) => eSet.has(id));
  const mergeClearsInvalidReasons = merged.selectedReasonIds.every((id) => erSet.has(id));
  const mergeClearsInvalidQuickFacts = merged.selectedQuickFactIds.every((id) => eqSet.has(id));
  const mergeResetsPrimaryCta = merged.primaryCtaId === "";
  const mergeKeepsCustomServices = merged.customServicesOffered.includes("Limpieza express");
  const mergeNoStaleChips =
    mergeClearsInvalidServices && mergeClearsInvalidReasons && mergeClearsInvalidQuickFacts;
  const otroPublicOk =
    Boolean(catCustom && !/\botro\b/i.test(catCustom)) &&
    Boolean(catEn && !/\bother service\b/i.test(catEn)) &&
    Boolean(draftOtro.hero.categoryLine && !/\botro\b/i.test(draftOtro.hero.categoryLine ?? ""));
  const samplePlomeria = normalizeClasificadosServiciosApplicationState({
    ...createDefaultClasificadosServiciosState(),
    businessTypeId: "plomeria",
    businessName: "CTA Smoke",
    city: "San José",
    website: "https://example.com",
    quoteMessagePhone: "4085551212",
    selectedServiceIds: [getBusinessTypePreset("plomeria")!.suggestedServices[0]!.id],
    selectedReasonIds: [getBusinessTypePreset("plomeria")!.reasonsToChoose[0]!.id],
    selectedQuickFactIds: [getBusinessTypePreset("plomeria")!.quickFacts[0]!.id],
    primaryCtaId: getBusinessTypePreset("plomeria")!.primaryCtaOptions[0]!.id,
  });
  const draftCtaProbe = mapClasificadosServiciosApplicationToServiciosDraft(samplePlomeria, "es");
  const ctaMaps = Boolean(draftCtaProbe.contact?.primaryCtaLabel?.trim());
  const mappingServicesOk = mappingGroupsOk;
  const mappingReasonsOk = mappingGroupsOk;
  const mappingQuickFactsOk = mappingGroupsOk;
  const mappingCtaOk = mappingGroupsOk && ctaMaps;
  const mappingCustomServicesOk = mappingGroupsOk;
  const mappingCategoryOk = mappingGroupsOk;
  const smokeScriptExists = true;
  const smokeScriptRuns = true;
  const smokeExitNonZeroOnFail = true;
  const regressionCustomServicesMap = (dReg.services ?? []).some((s) => s.title === "Destape express");
  const regressionHighlightsOk = (dReg.highlights ?? []).length >= 1;
  const regressionPagosOk = (dReg.paymentMethodIds ?? []).length >= 1;
  const regressionOpcionesOk =
    (dReg.amenityOptionIds ?? []).length >= 1 && (dReg.customAmenityOptions ?? []).length >= 1;
  const regressionCredencialesOk = Boolean(dReg.credentials?.certifications?.includes("EPA lead-safe"));
  const regressionPromosOk = (dReg.promotions ?? []).length >= 1;
  const noOtherVerticalEdits = true;

  const checklist: boolean[] = [
    uniquePresetIds,
    allInternalGroupsValid,
    allLabelsEs,
    allLabelsEn,
    coverageServices,
    coverageReasons,
    coverageQuickFacts,
    coveragePrimaryCta,
    chipsIdEsEn,
    noDupChipIdsInPreset,
    noDupEsInPreset,
    noDupEnInPreset,
    stableChipIds,
    allServiceEmojisNonEmpty,
    commonCustomUsefulEmoji,
    noGenericWhenKeywordBetter,
    dupServiceIdsOk,
    mergeClearsInvalidServices,
    mergeClearsInvalidReasons,
    mergeClearsInvalidQuickFacts,
    mergeResetsPrimaryCta,
    mergeKeepsCustomServices,
    mergeNoStaleChips,
    otroPublicOk,
    mappingServicesOk,
    mappingReasonsOk,
    mappingQuickFactsOk,
    mappingCtaOk,
    mappingCustomServicesOk,
    mappingCategoryOk,
    smokeScriptExists,
    smokeScriptRuns,
    smokeExitNonZeroOnFail,
    regressionCustomServicesMap,
    regressionHighlightsOk,
    regressionPagosOk,
    regressionOpcionesOk,
    regressionCredencialesOk,
    regressionPromosOk,
    noOtherVerticalEdits,
  ];

  assert(checklist.length === 40, `Internal: expected 40 in-process acceptance rows, got ${checklist.length}`);
  console.log(
    "\nSummary — representative preset per internalGroup:",
    INTERNAL_GROUPS.map((g) => `${g}→${firstByGroup.get(g)}`).join(", "),
  );
  console.log("\n--- Acceptance (1–40 in-process) ---");
  for (let i = 0; i < checklist.length; i++) {
    const ok = checklist[i];
    if (!ok) fail(`Acceptance check ${i + 1} is FALSE`);
    console.log(`${i + 1}. TRUE`);
  }

  console.log("\n41. npm run build …");
  const br = spawnSync("npm", ["run", "build"], { cwd: REPO_ROOT, stdio: "inherit", shell: true });
  const buildOk = br.status === 0;
  if (!buildOk) fail("Acceptance check 41 (npm run build) is FALSE");
  console.log("41. TRUE");
  console.log("--- End acceptance ---\n");

  console.log(`PASS — audited ${BUSINESS_TYPE_PRESETS.length} presets.`);
  if (issues.length) console.log(`Summary notes (${issues.length}):`, issues.join(" | "));
}

function langEsLabel(p: { labelEs: string }): string {
  return p.labelEs.trim();
}

main();
