# Package 13 QA Control Center

| System | Repository Status | Deterministic QA | Real QA Required | Blocker Owner | Exact Next Action | Pass Criteria | Evidence |
|---|---|---|---|---|---|---|---|
| Checkpoint | complete | scenario contract | authenticated route | Ofertas | run flyer/coupon start | lane persists | screenshot + parent |
| Application | complete | advertiser audit | DB-backed draft | Ofertas | create flyer/coupon records | no duplicate parent | parent UUID |
| Persistence | complete | identity audit | DB-backed resume | Ofertas | refresh/resume | same parent | parent ledger |
| Upload | repository-ready | scenario only | storage upload | Infrastructure | authorize storage QA | source version created | source ID |
| Scan | repository-ready | failure scenarios | Gemini scan | Infrastructure | authorize Gemini QA | progress/pages/errors truthful | scan job |
| Review | complete | review scenarios | DB item review | Ofertas | approve/exclude items | unresolved blocks | review counts |
| Preview | complete | route audit | authenticated preview | Ofertas | render flyer/coupon | says not public | screenshot |
| Commercial | complete | commercial audit | Stripe/webhook | Infrastructure | authorize checkout QA | entitlement active | payment/entitlement |
| Submission | complete | advertiser audit | DB-backed submit | Ofertas | submit scenarios | blocks without entitlement | API result |
| Admin moderation | complete | admin audit | authenticated Admin | Ofertas | reject/resubmit/approve | blockers enforced | admin result |
| Correction | complete | correction audit | DB-backed correction | Ofertas | resubmit same parent | no second payment | parent ledger |
| Publication | complete | term audit | approval activation | Ofertas | approve ready record | 30 days start | timestamps |
| Public discovery | complete | shopper audit | DB-backed search | Ofertas | search product/coupon | approved active only | route screenshot |
| Cards/drawers | complete | shopper audit | browser QA | Ofertas | open cards/drawers | source + Business Hub | screenshot |
| Flyer source | complete | identity audit | real crop/bbox | Ofertas | inspect viewer | exact page/crop | viewer screenshot |
| Business Hub | complete | shopper audit | click QA | Ofertas | call/directions/site/share | canonical analytics | event IDs |
| Shopping list | complete | shopper audit | browser storage QA | Ofertas | add/remove/clear flyer | flyer only | local evidence |
| Coupons | complete | shopper audit | browser QA | Ofertas | open coupon drawer | no list/cart/redemption | screenshot |
| Partner | complete | commercial audit | partner DB record | Infrastructure/Owner | authorize partner fixture | courtesy truthful | assignment ID |
| Analytics | repository-ready | analytics audit | DB-backed events | Globalization/Ofertas | resolve global blockers, then event QA | no fake metrics | event rows |
| Owner ops | complete | owner audit | authenticated owner | Ofertas | run owner detail/list | correct blockers/actions | screenshots |
| Admin ops | complete | admin audit | authenticated Admin | Ofertas | run queue/detail filters | filters real | screenshots |
| Expiration | complete | term audit | time/state QA | Ofertas | expired fixture | no public link | route result |
| Renewal | complete | renewal audit | DB-backed renewal | Ofertas | renewal case | same parent/no-day-loss | renewal attempt |
| Recovery | complete | recovery audit | failed/stale fixture | Ofertas | recovery scenario | no fake success | operation state |
| Cleanup | contract-ready | recovery audit | worker QA | Infrastructure | authorize worker QA | lease/result truthful | cleanup row |
| Notifications | contract-ready | runbook only | notification QA | Infrastructure | authorize adapter | no fake delivery | outbox row |
| ES/EN | complete | copy audits | browser QA | Ofertas | render ES/EN | parity | screenshots |
| Mobile/tablet | complete | responsive audit | browser QA | Ofertas | 390/768/1440 | no overflow | screenshots |
| Accessibility | complete | accessibility audit | keyboard QA | Ofertas | keyboard walk | focus/labels | notes |
| Migrations | documented | matrix audit | migration execution | Infrastructure | apply after authorization | ordered success | migration log |
| Environment | documented | env matrix audit | names validation | Infrastructure | validate names only | no missing names | checklist |
| Staging | blocked | runbook | staging authorization | Owner | approve exact SHA | all tests run | QA packet |
| Preview | blocked | runbook | Preview authorization | Owner/Globalization | approve preview | no Production | URL evidence |
| Production | blocked | runbook | owner release decision | Owner | post-QA decision | explicit approval | release record |

No broad pending QA remains; every row has an exact next action and pass criteria.
