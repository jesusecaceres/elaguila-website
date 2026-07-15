# Executive Summary

Completed scoped enforcement on the current Leonix `?lang=` foundation for the Rentas private publish blocker. The confirmed Rentas private labels now resolve through a strict ES/EN/PT/TL TypeScript dictionary, dictionary parity is verified by CLI, and a scoped AST audit blocks confirmed hardcoded Rentas UI copy in approved files.

# Existing Foundation Preserved

- Preserved `?lang=es|en|pt|tl`.
- Preserved `app/lib/language.ts` as the authoritative language registry.
- Preserved hidden future languages as inactive/non-public.
- No middleware, route-prefix, database, auth, Stripe, checkout, or category behavior changes.

# Files Inspected

- `package.json` - scripts, dependencies, Next command surface.
- `package-lock.json` - exact installed package versions.
- `next.config.ts` - mixed Next app/runtime configuration.
- `tsconfig.json` - strict TS, JSON import support.
- `eslint.config.mjs` - flat ESLint config.
- `middleware.ts` - confirmed not touched.
- `app/lib/language.ts` - authoritative language registry.
- `app/lib/leonix/languageMetadata.ts` - active/future/held metadata.
- `app/components/LanguagePreferenceSync.tsx` - language query persistence behavior.
- `app/(site)/clasificados/publicar/rentas/privado/page.tsx` - target route entry.
- `app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoApplication.tsx` - private application shell.
- `app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx` - private form.
- `app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx` - confirmed blocker field section.
- `app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts` - included service option labels.
- `app/(site)/clasificados/rentas/shared/rentasRentalTypeTaxonomy.ts` - rental type option labels.
- `.github/workflows/*.yml|*.yaml` - no workflows found.

# Architecture Decision

Dictionary format: TypeScript.

Reason: repo already uses typed TS copy modules and `tsx` is installed. A JSON migration would add churn and was not needed for this enforcement gate.

Locale source of truth: `app/lib/language.ts`.

Runtime fallback: Spanish canonical fallback for invalid, missing, hidden, or malformed locale input.

Client translation delivery: route-resolved official locale passed into the Rentas client application, then tightly scoped dictionary namespaces are used by shared Rentas form helpers.

Global provider: not added.

Route migration: not performed.

# Official and Hidden Languages

Official public languages: `es`, `en`, `pt`, `tl`.

Hidden/future languages remain outside public dictionary support and public selector state. Hidden inputs resolve to Spanish for strict launch UI dictionaries.

# Dictionary Structure

Canonical schema lives in `app/lib/i18n/launchUiDictionaries.ts` as `LEONIX_I18N_SCHEMA`.

Namespaces include `common`, `actions`, `forms`, `filters`, `preview`, `errors`, `emptyStates`, and `rentas`.

The Rentas dictionary includes the confirmed keys for `water`, `maintenance`, `parking`, `specifyService`, `requirements`, `neighborhood`, `listingStatus`, `addressLine2`, `city`, `stateProvince`, `postalCode`, `showExactAddressWhenApplicable`, `back`, `preview`, `continue`, and `selectOption`.

# Runtime Translation Behavior

- `getLaunchUiMessages()` accepts official launch locales and uses Spanish fallback.
- `tLaunchUi()` reports missing keys with `console.error`.
- Runtime helpers do not call `process.exit()` or set `process.exitCode`.
- CLI scripts may set `process.exitCode = 1` on failure.

# Audit Enforcement

Added `scripts/i18n-verify-dicts.ts`.

Added `scripts/i18n-ast-audit.ts`.

Added package scripts:

- `i18n:verify-dictionaries`
- `i18n:audit`
- `i18n:check`

The AST audit scans the approved Rentas/i18n scope and reports file, line, column, rule ID, text, severity, blocker status, and remediation.

# Rentas Blocker Fix

Confirmed private Rentas labels now resolve from dictionary-backed copy:

- `Agua` -> `rentas.services.water`
- `Mantenimiento` -> `rentas.services.maintenance`
- `Estacionamiento` -> `rentas.services.parking`
- `Especifica el servicio` -> `rentas.form.specifyServiceLabel`
- `Requisitos` -> `rentas.form.requirementsLabel`
- `Zona o vecindario` -> `rentas.form.zoneLabel`
- `Estado del anuncio` -> `rentas.form.listingStatusLabel`
- `Dirección línea 2` -> `rentas.form.addressLine2Label`
- `Ciudad` -> `rentas.form.cityLabel`
- `Estado / Provincia` -> `rentas.form.stateLabel`
- `Código postal` -> `rentas.form.zipLabel`
- `Mostrar dirección exacta cuando aplique` -> `rentas.form.showExactAddressLabel`

# User-Content Protection

No user-generated listing content is passed through translation helpers. Field values such as descriptions, custom services, requirements text, address text, city input, and custom neighborhood text remain user-entered values.

# CI Decision

CI integration: design only.

Reason: no `.github/workflows/*.yml` or `.github/workflows/*.yaml` files exist in this repo. No new workflow was created because the scoped gate explicitly prefers not inventing duplicate workflow infrastructure.

Future insertion point: if a validation workflow is added later, run `npm run i18n:verify-dictionaries` and `npm run i18n:audit` after dependency installation and before typecheck/build.

# Checks Run

- `git branch --show-current` - `main`
- `git status --short` - clean at baseline, dirty only after scoped edits.
- `git diff --name-only` - no baseline tracked changes before edits.
- `npm run i18n:verify-dictionaries` - passed.
- `npm run i18n:audit` - passed after one real blocker cleanup.
- `npm run i18n:check` - passed.
- `npm run typecheck` - failed on unrelated pre-existing e2e TypeScript errors only; no edited i18n/Rentas files reported after fixes.
- Build not run because typecheck still fails on unrelated e2e files and build would add `.next` churn without producing a trustworthy green result.

# Remaining Blockers

Approved-scope i18n blockers: none known.

Repository typecheck blocker: unrelated e2e TypeScript errors remain in:

- `e2e/autos/autos-a5-recovery-25-child-media-persistence.spec.ts`
- `e2e/community/community-preview-publish-bar.spec.ts`
- `e2e/community/community-preview-published-shell-parity.spec.ts`

# Chuy Targeted QA Routes

- `/clasificados/publicar/rentas/privado?lang=es&propiedad=residencial`
- `/clasificados/publicar/rentas/privado?lang=en&propiedad=residencial`
- `/clasificados/publicar/rentas/privado?lang=pt&propiedad=residencial`
- `/clasificados/publicar/rentas/privado?lang=tl&propiedad=residencial`

Status: code verified. Browser QA was not run. Chuy targeted QA required.

# TRUE/FALSE Final Inspection

Objective completed: TRUE
Existing `?lang` foundation preserved: TRUE
Official ES/EN/PT/TL registry enforced: TRUE
Hidden languages remain inactive: TRUE
Strict dictionary structure active: TRUE
Dictionary verifier passes: TRUE
Scoped AST audit passes: TRUE
Rentas EN blocker fixed: TRUE
Rentas PT coverage present: TRUE
Rentas TL coverage present: TRUE
No user content translated: TRUE
No route migration: TRUE
No middleware change: TRUE
No global client provider: TRUE
No database/auth/payment changes: TRUE
No unrelated design/category changes: TRUE
No runtime process exit: TRUE
Typecheck acceptable: FALSE - unrelated e2e type errors remain
Build acceptable: FALSE - skipped after typecheck failure
No edited-file blockers: TRUE
Ready for Chuy targeted QA: TRUE
Ready to commit: FALSE

# Commit Decision

Do not commit yet. Approved-scope i18n enforcement is complete, but repo-wide typecheck/build is not fully green due unrelated e2e errors.
