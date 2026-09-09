/**
 * Globalization Build 2 — server-side integrity guard against wholesale vehicle-identity
 * substitution on an existing Autos listing row (dealer inventory child, dealer parent, or
 * Privado — the same shared update path serves all three, and the same risk applies to any of
 * them: an owner silently retyping a completely different vehicle into an existing row, keeping
 * the same UUID/Leonix Ad ID/analytics history/likes).
 *
 * This does NOT gate ordinary corrections (price, mileage, description, photos, financing,
 * features, condition, availability, a single typo fix, or adding a previously-missing VIN) —
 * only a genuine identity swap.
 */

export type AutosVehicleIdentityFields = {
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
};

function normalizeVin(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toUpperCase();
}

function normalizeText(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

/**
 * True only when the incoming payload represents a genuinely different vehicle than the one
 * currently stored in this row, not a correction to it.
 *
 * Rule:
 *  1. If both the existing and incoming rows carry a non-empty VIN, a valid VIN uniquely
 *     identifies one specific vehicle — any change to it is a substitution, full stop. A VIN
 *     match takes precedence even if year/make/model also changed (e.g. correcting a typo'd
 *     model year on the same VIN is a legitimate correction, not a substitution).
 *  2. Otherwise (VIN missing on either side — including "a VIN was just added", which is a
 *     legitimate correction, not a substitution), fall back to year+make+model. Only when ALL
 *     THREE differ simultaneously is this treated as a substitution — a single-field edit (a
 *     typo fix to just the model name, or a year correction) is exactly the "one typo
 *     correction" case this guard must allow, not block. A genuine vehicle swap (e.g. a 2020
 *     Honda Civic replaced by a 2024 Ford F-150) changes year AND make AND model together.
 */
export function isAutosChildIdentitySubstitution(
  existing: AutosVehicleIdentityFields,
  incoming: AutosVehicleIdentityFields,
): boolean {
  const oldVin = normalizeVin(existing.vin);
  const newVin = normalizeVin(incoming.vin);
  if (oldVin && newVin) {
    return oldVin !== newVin;
  }

  const oldYear = existing.year ?? null;
  const newYear = incoming.year ?? null;
  const oldMake = normalizeText(existing.make);
  const newMake = normalizeText(incoming.make);
  const oldModel = normalizeText(existing.model);
  const newModel = normalizeText(incoming.model);

  const haveOld = oldYear != null && Boolean(oldMake) && Boolean(oldModel);
  const haveNew = newYear != null && Boolean(newMake) && Boolean(newModel);
  if (!haveOld || !haveNew) return false;

  const yearChanged = oldYear !== newYear;
  const makeChanged = oldMake !== newMake;
  const modelChanged = oldModel !== newModel;
  return yearChanged && makeChanged && modelChanged;
}
