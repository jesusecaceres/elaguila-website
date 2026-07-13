/**
 * Fixture + contract proof: Bienes Spacebar + multi-day open-house (no browser).
 * Companion to the runtime Playwright verifier.
 */
import {
  createEmptyAgenteIndividualResidencialState,
  mergePartialAgenteIndividualResidencial,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { mapAgenteResidencialFormStateToNegocioForPublish } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";
import {
  sanitizeBusinessExtraLinksForDraft,
  paddedBusinessExtraLinks,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/bienesAdditionalBusinessLinks";
import {
  buildOpenHouseSlotSummaries,
  normalizeOpenHouseSlots,
} from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat";
import {
  LEONIX_DP_BR_GATE12D_V1,
  buildBrGate12dV1FromNegocioState,
  buildBrLiveGate12dOpenHouseCard,
  serializeBrGate12dV1Payload,
} from "../app/(site)/clasificados/lib/leonixBrGate12d";
import { brShouldIgnoreWizardShortcut } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/application/brWizardKeyboard";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, field: string) {
  assert(a === b, `${field}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

const LINK = "Agent Portfolio and Client Reviews";
const ADDITIONAL = "Saturday and Sunday 11:00 AM–3:00 PM; Monday by appointment.";
const NOTES = "Please call the agent before arriving.";
const ES = "Disponible sábado y domingo de 11:00 AM a 3:00 PM; lunes con cita previa.";

console.log("=== Bienes Spacebar + Multi-day OH fixture core ===");

// Live draft sanitize must preserve trailing Space while typing multi-word titles.
const midType = sanitizeBusinessExtraLinksForDraft([{ title: "Agent Portfolio ", url: "https://example.com" }]);
eq(midType[0]?.title, "Agent Portfolio ", "draft title keeps trailing space");
const padded = paddedBusinessExtraLinks([{ title: "Agent ", url: "" }], 1);
eq(padded[0]?.title, "Agent ", "padded slots keep trailing space");

const legacy = mergePartialAgenteIndividualResidencial({
  openHouseSlots: [
    {
      fecha: "2026-07-17",
      inicio: "10:00",
      fin: "14:00",
      notas: "legacy note",
    } as unknown as {
      fecha: string;
      fechaFin: string;
      inicio: string;
      fin: string;
      diasHorariosAdicionales: string;
      notas: string;
    },
  ],
});
const legacySlot = normalizeOpenHouseSlots(legacy)[0]!;
eq(legacySlot.fecha, "2026-07-17", "legacy fecha → startDate");
eq(legacySlot.fechaFin, "", "legacy endDate empty");
eq(legacySlot.diasHorariosAdicionales, "", "legacy additional empty");
eq(legacySlot.notas, "legacy note", "legacy notes preserved");

const full = mergePartialAgenteIndividualResidencial({
  ...createEmptyAgenteIndividualResidencialState(),
  titulo: "Spacebar Fixture Parent",
  businessExtraUrls: [{ title: LINK, url: "https://example.com/agent-portfolio" }],
  openHouseSlots: [
    {
      fecha: "2026-07-17",
      fechaFin: "2026-07-20",
      inicio: "10:00",
      fin: "14:00",
      diasHorariosAdicionales: ADDITIONAL,
      notas: NOTES,
    },
    {
      fecha: "2026-07-25",
      fechaFin: "2026-07-26",
      inicio: "12:00",
      fin: "16:00",
      diasHorariosAdicionales: "Sunday hours are 1:00 PM to 3:00 PM.",
      notas: "Enter through the side gate.",
    },
  ],
});

eq(full.businessExtraUrls[0]?.title, LINK, "link title multi-word");
assert(LINK.includes(" "), "fixture has spaces");
const slots = normalizeOpenHouseSlots(full);
eq(slots.length, 2, "two independent events");
eq(slots[0]!.fechaFin, "2026-07-20", "end date retained");
eq(slots[0]!.diasHorariosAdicionales, ADDITIONAL, "additional days retained");
eq(slots[0]!.notas, NOTES, "notes retained");
eq(slots[1]!.fecha, "2026-07-25", "second event independent");

const summaries = buildOpenHouseSlotSummaries(full, "en");
assert(summaries[0]!.includes("–") || summaries[0]!.includes("2026"), "preview shows date range");
assert(summaries[0]!.includes("Additional days/hours"), "preview shows additional days");
assert(summaries[0]!.includes(NOTES), "preview shows notes");

const negocio = mapAgenteResidencialFormStateToNegocioForPublish(full);
assert(negocio.cta.openHouseEvents.length === 2, "publish carries both events");
eq(negocio.cta.openHouseEvents[0]!.endDate, "2026-07-20", "publish endDate");
eq(negocio.cta.openHouseEvents[0]!.additionalDaysHours, ADDITIONAL, "publish additionalDaysHours");
eq(negocio.cta.openHouseEvents[0]!.notes, NOTES, "publish notes");

const gate = buildBrGate12dV1FromNegocioState(negocio);
assert(gate.openHouseEvents && gate.openHouseEvents.length === 2, "gate12d events");
const ser = serializeBrGate12dV1Payload(gate)!;
const live = buildBrLiveGate12dOpenHouseCard([{ label: LEONIX_DP_BR_GATE12D_V1, value: ser }], "en");
assert(live && live.rows.some((r) => r.value.includes("2026-07-17")), "public rows show start");
assert(live!.rows.some((r) => r.value.includes(ADDITIONAL)), "public shows additional days");

assert(typeof brShouldIgnoreWizardShortcut === "function", "wizard keyboard helper exported");

// Spanish phrase round-trip
const esState = mergePartialAgenteIndividualResidencial({
  openHouseSlots: [
    {
      fecha: "2026-07-17",
      fechaFin: "2026-07-20",
      inicio: "11:00",
      fin: "15:00",
      diasHorariosAdicionales: ES,
      notas: ES,
    },
  ],
});
eq(normalizeOpenHouseSlots(esState)[0]!.diasHorariosAdicionales, ES, "spanish spaces survive");

console.log("SPACEBAR_MULTIDAY_CORE: PASS");
console.log("PROOF_TYPE: NODE FIXTURE SIMULATION");
