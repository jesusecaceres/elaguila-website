# Package 14 Resource-Aware Validation

Package 14 changes are documentation and plain Node audit scripts only. Heavy checks are not justified unless a later edit changes runtime, build-boundary files, package/config, migrations, or a targeted check identifies a compile/build defect.

## Policy

- Run one heavy command at a time.
- Do not run concurrent builds across worktrees.
- Never stop another worktree's process.
- Run lightweight checks during document/audit construction.
- Run full typecheck/build only at integration milestones, exact-HEAD Preview authorization, release readiness, or when runtime/build-boundary changes require it.
- Reuse recent evidence when files changed are docs, deterministic scenarios, and plain Node audits.
- Mark `RESOURCE-DEFERRED — ANOTHER WORKTREE IS RUNNING A HEAVY VALIDATION` when a required heavy check cannot safely start.
- One retry maximum is allowed only for wrapper/process failure evidence, not code-result failure.
- Do not repeat builds merely because docs/audits changed.
- Preview build becomes authoritative only after exact-HEAD Preview is authorized.
- Production build never substitutes for Preview QA.

## Status Vocabulary

| Status | Meaning |
|---|---|
| repository PASS | Repository-wide check passed. |
| deterministic PASS | Static/scenario/audit gate passed without external services. |
| environment BLOCKED | Non-Production environment, database, service, webhook, worker, or account requirement is missing. |
| resource DEFERRED | Required heavy check intentionally deferred because another heavy process is active. |
| real-QA PASS | Database-backed non-Production QA passed with evidence. |
| owner PASS | Chuy accepted the result after owner testing. |

## Recent Evidence Reuse

Reuse is permitted for Package 14 because:

- Package 13 committed at `0cfbda4a6a5888457acd93b9d3c78c710dc0f732`.
- Package 14 does not modify runtime `.ts` or `.tsx` files.
- Package 14 does not modify package/config/lockfiles.
- Package 14 does not modify migrations.
- Package 14 does not require Preview or Production.
- Latest known full typecheck/build blockers are external to Ofertas and unchanged by this package.

Do not treat `RESOURCE-DEFERRED` as PASS or product failure.
