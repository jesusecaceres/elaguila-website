# Package 13 Migration Execution Matrix

Do not apply migrations from this worktree without explicit non-Production authorization.

| Migration Package | Requires | Creates/Alters | Verify Before | Verify After | Rollback Limit | Runtime Blocked Until Applied |
|---|---|---|---|---|---|---|
| 4A Gemini provider | base Ofertas tables | scan provider compatibility | provider enum/current rows | `gemini_multimodal` accepted | enum rollback requires data cleanup | Gemini scan QA |
| 4B 30-day term | `ofertas_locales` parent | public term fields/constraints | parent status columns | approval starts 30-day term | term history cannot be blindly rewritten | publication QA |
| 5 commercial/identity | Revenue OS readiness | product/payment/entitlement/Leonix ID fields | product keys, prices | $399/$199, AI included, Leonix ID | payment history irreversible | checkout and entitlement QA |
| 6 partner/analytics/source lifecycle | Package 5 identity | partner, analytics, source version columns | source version dependencies | partner/courtesy/source lifecycle queryable | source version history retained | partner/source QA |
| 7 scan/review/publication | source lifecycle | scan jobs, pages, reviewed child items | source asset IDs | page progress, failed pages, approved items | child/source records must remain auditable | AI review/public discovery QA |
| 8 renewal/operations | public term + source lifecycle | renewal attempts, cleanup/recovery contracts | active/expired parents | no-day-loss renewal states | scheduled activations require careful rollback | renewal/recovery QA |

No duplicate table/column/function or destructive SQL is authorized from Package 13. Runtime QA is blocked until the full ordered chain is applied to the approved non-Production environment and verified after each step.
