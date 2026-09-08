/**
 * Globalization P2 — Gate 7: shared phone-formatting contract self-test.
 *
 * Confirmed defect: `app/lib/leonix/phoneFormat.ts`'s `formatUsPhone` (used by the shared
 * `<PhoneInput>` component, Admin lead tooling, Tienda, and the Global Contact Form) produced
 * `(408)123-4567` — missing the space after the area code — while Bienes Raíces's and Servicios'
 * own, separate phone formatters already correctly produced `(408) 123-4567`. Fixed the one
 * shared, broken formatter (not the already-correct ones) so every consumer now agrees. Also
 * confirmed and fixed a second, distinct defect: the paid Empleos application's own contact field
 * component (`EmpleosPremiumCtaFieldGroup.tsx`) applied no formatting/masking to its phone field
 * at all (a plain unmasked text input), unlike the free Empleos lane's own field group, which
 * already used the correct shared formatter.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-p2-phone-formatting-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatUsPhone, getPhoneValidationMessage } from "../app/lib/leonix/phoneFormat";
import { formatUsPhoneDisplay } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import { formatPhoneInputDisplay } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { formatEmpleosPhoneDisplay } from "../app/(site)/publicar/empleos/shared/lib/empleosPhoneDisplay";

const REPO_ROOT = path.resolve(__dirname, "..");
function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const SAMPLE_10_DIGITS = "4085550182";
const EXPECTED = "(408) 555-0182";

/* ================================================================================================
 * 1. All four real phone-formatting implementations in the codebase now agree on the same output
 * for the same 10-digit input — the approved (XXX) XXX-XXXX syntax.
 * ============================================================================================== */
assert.equal(formatUsPhone(SAMPLE_10_DIGITS), EXPECTED, "the shared leonix phoneFormat.ts formatter must produce (XXX) XXX-XXXX");
assert.equal(formatUsPhoneDisplay(SAMPLE_10_DIGITS), EXPECTED, "Bienes Raíces's own formatter must remain (XXX) XXX-XXXX (was already correct, must not regress)");
assert.equal(formatPhoneInputDisplay(SAMPLE_10_DIGITS), EXPECTED, "Servicios' own formatter must remain (XXX) XXX-XXXX (was already correct, must not regress)");
assert.equal(formatEmpleosPhoneDisplay(SAMPLE_10_DIGITS), EXPECTED, "Empleos' own display formatter must remain (XXX) XXX-XXXX (was already correct, must not regress)");

/* ================================================================================================
 * 2. Partial input while typing must never regress to the pre-fix no-space form.
 * ============================================================================================== */
assert.equal(formatUsPhone("4085550"), "(408) 555-0", "partial input must still get the space after the area code");
assert.equal(formatUsPhone("408"), "(408", "3-digit partial input has no closing paren yet, unchanged");

/* ================================================================================================
 * 3. The validation-message example text was updated to match, not left showing the old syntax.
 * ============================================================================================== */
assert.ok(getPhoneValidationMessage("es").includes("(408) 123-4567"), "Spanish validation message example must use the approved spaced syntax");
assert.ok(getPhoneValidationMessage("en").includes("(408) 123-4567"), "English validation message example must use the approved spaced syntax");

/* ================================================================================================
 * 4. The shared <PhoneInput> component's maxLength was widened from 13 to 14 to fit the added
 * space character — otherwise the last digit would be silently truncated while typing.
 * ============================================================================================== */
{
  const src = readSource("app/components/forms/PhoneInput.tsx");
  assert.ok(src.includes("maxLength={14}"), "<PhoneInput> must allow 14 characters, not the old pre-fix 13");
  assert.ok(!src.includes("maxLength={13}"), "the old, too-short maxLength must not remain");
}

/* ================================================================================================
 * 5. The paid Empleos application's own phone field (EmpleosPremiumCtaFieldGroup.tsx) now applies
 * the same shared formatting as every other phone field, instead of being a raw, unmasked input.
 * ============================================================================================== */
{
  const src = readSource("app/(site)/publicar/empleos/shared/components/EmpleosPremiumCtaFieldGroup.tsx");
  assert.ok(src.includes("formatPhoneInputDisplay"), "the paid Empleos phone field must use the shared phone formatter");
  assert.ok(
    /onChange=\{\(e\)\s*=>\s*onChange\(\{\s*phone:\s*formatPhoneInputDisplay\(e\.target\.value\)\s*\}\)\}/.test(src),
    "the phone field's onChange must format the value through the shared formatter before storing it",
  );
}

console.log("gate-p2-phone-formatting-selftest: OK");
