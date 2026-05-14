/**
 * Minimal valid Clases / Comunidad quick drafts for preview-bar regression tests
 * (sessionStorage seeding + gate sanity). No network.
 */
import {
  emptyClasesQuickDraft,
  emptyComunidadQuickDraft,
  type ClasesQuickDraft,
  type ComunidadQuickDraft,
} from "../app/(site)/publicar/community/shared/types/communityQuickDraft";

/** 1×1 PNG (same fixture style as community-quick-publish-contract-smoke). */
export const MINIMAL_CONTRACT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function buildMinimalClasesQuickDraftForPreviewContract(): ClasesQuickDraft {
  const d = emptyClasesQuickDraft();
  d.title = "Clase contrato";
  d.organizer = "Org contrato";
  d.category = "boxeo";
  d.description = "Descripción corta suficiente para el gate de vista previa.";
  d.mode = "presencial";
  d.audience = "adultos";
  d.skillLevel = "principiante";
  d.registrationRequired = "no";
  d.publicCity = "San Jose";
  d.phone = "4085551234";
  d.publishConfirmations = { infoTruthful: true, mediaAccurate: true, rulesAccepted: true };
  d.images = [{ id: "c1", url: MINIMAL_CONTRACT_PNG, alt: "foto", isMain: true }];
  d.weeklySchedule = d.weeklySchedule.map((row) =>
    row.day === "mon" ? { ...row, closed: false, open: "10:00", close: "11:00" } : row,
  );
  return d;
}

export function buildMinimalComunidadQuickDraftForPreviewContract(): ComunidadQuickDraft {
  const d = emptyComunidadQuickDraft();
  d.title = "Evento contrato";
  d.organizer = "Org evento";
  d.category = "feria";
  d.description = "Descripción corta suficiente para el gate de vista previa.";
  d.audience = "adultos";
  d.registrationRequired = "no";
  d.eventCost = "gratis";
  d.date = "2030-06-15";
  d.eventSessionStart = "10:00";
  d.eventSessionEnd = "11:00";
  d.publicCity = "San Jose";
  d.phone = "4085551234";
  d.publishConfirmations = { infoTruthful: true, mediaAccurate: true, rulesAccepted: true };
  d.images = [{ id: "e1", url: MINIMAL_CONTRACT_PNG, alt: "foto", isMain: true }];
  return d;
}

/** Gate-complete paid class draft — publish must still be blocked in UI + API guard. */
export function buildPaidClasesQuickDraftForPreviewContract(): ClasesQuickDraft {
  const d = buildMinimalClasesQuickDraftForPreviewContract();
  d.classCostType = "pagada";
  d.priceAmount = "25";
  d.priceFrequency = "porClase";
  return d;
}
