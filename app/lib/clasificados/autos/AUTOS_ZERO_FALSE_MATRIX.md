# Autos zero-false matrix (recovery baseline)

Each item: **current repo proof** after 2026-04-22 recovery pass.

| ID | Statement | Prior risk | Fix / proof now | Final |
| -- | --------- | ---------- | --------------- | ----- |
| Z1 | Repo build acceptable for launch | Unknown after crash | `npm run build` exit **0** (`AUTOS_BUILD_PROOF.md`) | **TRUE** |
| Z2 | Autos launch surfaces compile | Unknown | `tsc` + eslint Autos globs + build include Autos routes | **TRUE** |
| Z3 | Launch-critical lint (Autos slice) | Unknown | `npx eslint …/autos/**` exit **0** | **TRUE** |
| Z4 | Private publish smoke | FALSE | Not run — needs staging + auth | **FALSE** / **HARD BLOCKER** |
| Z5 | Dealer publish smoke | FALSE | Not run | **FALSE** / **HARD BLOCKER** |
| Z6 | Payment success path beyond code | FALSE | Not run — needs Stripe | **FALSE** / **HARD BLOCKER** |
| Z7 | Payment failure/retry | FALSE | Not run | **FALSE** / **HARD BLOCKER** |
| Z8 | Public landing visibility | Partial | Code + script; no live HTTP | **FALSE** (strict runtime) |
| Z9 | Public results visibility | Partial | Same | **FALSE** |
| Z10 | Public detail visibility | Partial | Same | **FALSE** |
| Z11 | Dashboard/admin consistency | Partial | Same | **FALSE** |
| Z12 | CTAs not dead | Partial | Code audit `AUTOS_CTA_AUDIT.md`; no browser | **FALSE** (strict) / **TRUE** (code-only slice) |
| Z13 | Category ready for real public go-live | FALSE | Code + docs green; runtime payments/browse unproven | **FALSE** |

**Executive alignment:** Z4–Z11 remain **FALSE** under “no code-trace-only” launch rules until staging completes S1–S8 from `AUTOS_RUNTIME_SMOKE_PROOF.md`.
