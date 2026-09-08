# Ofertas Incident And Rollback Runbook

For every incident record: SYMPTOM, LIKELY CAUSE, IMMEDIATE CONTAINMENT, CUSTOMER IMPACT, SAFE RETRY, DATA INTEGRITY CHECK, ROLLBACK OPTION, ESCALATION, PROHIBITED ACTION.

| Incident | Symptom | Immediate containment | Data integrity check | Rollback option | Prohibited action |
| --- | --- | --- | --- | --- | --- |
| migration failure | migration stops or object missing | pause runtime/workers | migration history and object inventory | restore backup when data affected | edit historical migrations |
| provider constraint mismatch | Gemini provider write fails | disable scans | provider check constraint | deploy compatible runtime after schema fix | bypass constraint blindly |
| Stripe webhook mismatch | webhook rejected or wrong metadata | disable endpoint | payment record/listing/Leonix match | replay only verified events | mark payment paid manually |
| duplicate payment event | repeated event received | rely on idempotency | payment record uniqueness | no-op duplicate | fabricate entitlement |
| duplicate entitlement attempt | entitlement conflict | stop fulfillment retry | parent/payment/package match | retry after conflict resolution | create duplicate parent |
| scan stuck | job does not finish | stop resubmission | scan job/page state | controlled retry | overwrite scan result |
| crop failure | public crop missing | block approval | source/item/crop path ownership | reprocess source | expose raw private path |
| source-version mismatch | wrong source appears | disable activation | active source and item source IDs | rollback runtime or activate prior source | bypass review |
| replacement activation failure | replacement not public | pause replacement | source version/current items | retry activation RPC after schema check | duplicate parent |
| renewal activation failure | scheduled renewal fails | pause worker | renewal attempt/term history uniqueness | retry idempotent RPC | reset expiration arbitrarily |
| cleanup task stuck | processing lease expired | release expired lease | lease/task/status/path | retry after adapter check | delete customer data blindly |
| notification delivery failure | pending/failed events | disable delivery | outbox status/idempotency | retry adapter-confirmed delivery | mark sent without confirmation |
| public stale listing | expired listing visible | disable public surface if severe | `expires_at`/item validity | deploy fixed filter | arbitrarily extend term |
| expired listing still visible | stale term cache | disable worker/public cache | term history and parent cache | repair via audited admin path | delete history |
| partner badge incorrectly shown | badge on non-partner | hide badge path | assignment status/effective dates | correct assignment | fake courtesy payment |
| analytics failure | missing/wrong counts | label unavailable | event identity/category | replay only verified events | invent counts |
| owner/admin authorization failure | unauthorized access | disable affected route | auth claims/session path | patch route auth | expose service credentials |

Escalate payment, credential, schema corruption, or public data exposure incidents immediately. Never edit historical migrations, blindly delete customer data, manually mark payment paid, fabricate entitlement, reset expiration arbitrarily, create duplicate parents, bypass review, or expose service credentials.
