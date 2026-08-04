# Package 14 QA Execution Board

Use this board only after exact SHA authorization and non-Production approval. No fake results, no owner PASS before owner testing, and no Production evidence.

| ID | SYSTEM | PRECONDITION | TEST ACCOUNT | PARENT UUID | LEONIX AD ID | EXPECTED RESULT | ACTUAL RESULT | EVIDENCE | DEFECT ID | OWNER | STATUS | RETEST | PASS CRITERIA |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QA14-01 | environment identity | Authorized SHA/environment | Admin |  |  | Non-Production matches manifest |  | Screenshot/log |  | QA | Not started |  | Environment is not Production |
| QA14-02 | migration chain | Migration authorization | Admin |  |  | Migrations apply in documented order |  | Migration output |  | Infra | Not started |  | Schema ready |
| QA14-03 | schema verification | Migrations complete | Admin |  |  | Required Ofertas tables/columns/RLS visible |  | SQL evidence |  | Infra | Not started |  | Schema verified |
| QA14-04 | standard flyer advertiser | Test user ready | Advertiser |  |  | Flyer package available at $399 |  | Screenshot |  | Ofertas | Not started |  | Flyer case created |
| QA14-05 | verified partner flyer advertiser | Partner account ready | Advertiser |  |  | Partner placement tracked |  | Screenshot |  | Ofertas | Not started |  | Partner case created |
| QA14-06 | coupon advertiser | Test user ready | Advertiser |  |  | Coupon package available at $199 |  | Screenshot |  | Ofertas | Not started |  | Coupon case created |
| QA14-07 | source upload | Draft exists | Advertiser |  |  | Flyer/PDF/coupon source uploaded |  | Screenshot |  | Ofertas | Not started |  | Source version created |
| QA14-08 | Gemini scan | Source ready and authorized | Advertiser |  |  | Scan job runs only in non-Production |  | Scan evidence |  | Ofertas | Not started |  | Items extracted or failure captured |
| QA14-09 | page progress | Scan active | Advertiser |  |  | Page progress visible |  | Screenshot |  | Ofertas | Not started |  | Progress truthful |
| QA14-10 | partial page failure | Controlled failure case | Advertiser |  |  | Partial failure does not block recoverable pages |  | Screenshot/log |  | Ofertas | Not started |  | Failure is actionable |
| QA14-11 | product review/correction | Items extracted | Advertiser |  |  | Owner can correct scan items |  | Screenshot |  | Ofertas | Not started |  | Review saves corrections |
| QA14-12 | crop and bounding box | Reviewed item | Advertiser |  |  | Exact page/crop/bbox proof visible |  | Screenshot |  | Ofertas | Not started |  | Source proof matches item |
| QA14-13 | Ofertas Preview | Review complete | Advertiser |  |  | Preview is accurate and not public |  | Screenshot |  | Ofertas | Not started |  | Preview ready |
| QA14-14 | Stripe test checkout | Preview/payment ready | Advertiser |  |  | Test checkout completes |  | Stripe test evidence |  | Revenue OS | Not started |  | Test payment success |
| QA14-15 | webhook | Test checkout complete | System |  |  | Webhook creates entitlement |  | Webhook log |  | Revenue OS | Not started |  | Entitlement event received |
| QA14-16 | entitlement | Webhook complete | Advertiser |  |  | Entitlement linked to parent UUID |  | Screenshot/log |  | Ofertas | Not started |  | Parent identity preserved |
| QA14-17 | submission | Entitlement active | Advertiser |  |  | Submission enters Admin review |  | Screenshot |  | Ofertas | Not started |  | Pending review visible |
| QA14-18 | Admin rejection | Submitted case | Admin |  |  | Rejection requires reason |  | Screenshot |  | Ofertas | Not started |  | Owner sees correction path |
| QA14-19 | owner correction | Rejected case | Advertiser |  |  | Same parent corrected |  | Screenshot |  | Ofertas | Not started |  | No repayment/no duplicate parent |
| QA14-20 | resubmission | Corrected case | Advertiser |  |  | Resubmission returns to Admin queue |  | Screenshot |  | Ofertas | Not started |  | Parent identity preserved |
| QA14-21 | Admin approval | Resubmitted case | Admin |  |  | Approval requires readiness |  | Screenshot |  | Ofertas | Not started |  | Public term starts |
| QA14-22 | public activation | Approved case | Shopper |  |  | Public offer becomes eligible |  | Screenshot |  | Ofertas | Not started |  | Active on public surfaces |
| QA14-23 | product search | Active flyer | Shopper |  |  | Product search finds approved items |  | Screenshot |  | Ofertas | Not started |  | Results are truthful |
| QA14-24 | business search | Active business | Shopper |  |  | Business search finds active offer |  | Screenshot |  | Ofertas | Not started |  | Business appears |
| QA14-25 | location filters | Active cases | Shopper |  |  | City/state/postal filters work |  | Screenshot |  | Ofertas | Not started |  | Filters accurate |
| QA14-26 | product drawer | Active flyer item | Shopper |  |  | Drawer shows source proof |  | Screenshot |  | Ofertas | Not started |  | Item identity preserved |
| QA14-27 | coupon drawer | Active coupon | Shopper |  |  | Coupon details visible without cart/redeem |  | Screenshot |  | Ofertas | Not started |  | No fake redemption |
| QA14-28 | exact flyer page/highlight | Active flyer item | Shopper |  |  | Flyer page/highlight matches bbox |  | Screenshot |  | Ofertas | Not started |  | Exact source proof |
| QA14-29 | Business Hub | Active business | Shopper |  |  | Business Hub visible and truthful |  | Screenshot |  | Ofertas | Not started |  | Business details safe |
| QA14-30 | flyer shopping list | Active flyer item | Shopper |  |  | Flyer item can be listed |  | Screenshot |  | Ofertas | Not started |  | No cart/quantity purchasing |
| QA14-31 | coupon shopping-list exclusion | Active coupon | Shopper |  |  | Coupon excludes shopping list/cart |  | Screenshot |  | Ofertas | Not started |  | Coupon-only detail |
| QA14-32 | partner placement | Partner case active | Shopper |  |  | Partner placement is labeled/relevant |  | Screenshot |  | Ofertas | Not started |  | No false endorsement |
| QA14-33 | analytics | Consent allowed | Shopper |  |  | Listing/item events preserve parent/item identity |  | Event evidence |  | Analytics | Not started |  | No Preview impression |
| QA14-34 | expiration | Active term seeded | System |  |  | Offer expires after term |  | Screenshot/log |  | Ofertas | Not started |  | Public eligibility stops |
| QA14-35 | renewal | Expiring/expired case | Advertiser |  |  | Renewal path uses same identity lineage |  | Screenshot |  | Ofertas | Not started |  | Renewal scheduled |
| QA14-36 | recovery | Failed/stale case | Advertiser/Admin |  |  | Recovery actions are explicit |  | Screenshot |  | Ofertas | Not started |  | No dead action |
| QA14-37 | cleanup | QA complete | QA |  |  | Cleanup plan ready before execution |  | Checklist |  | QA | Not started |  | No data left unmanaged |
| QA14-38 | worker authorization | Worker authorization | System |  |  | Worker rejects unauthorized calls |  | Log |  | Infra | Not started |  | Auth enforced |
| QA14-39 | notification outbox | Notification authorization | System |  |  | Outbox records only authorized notifications |  | Log |  | Infra | Not started |  | No real sends unless authorized |
| QA14-40 | mobile | Active cases | Shopper |  |  | Mobile layout usable |  | Screenshot |  | Ofertas | Not started |  | No blocker |
| QA14-41 | tablet | Active cases | Shopper |  |  | Tablet layout usable |  | Screenshot |  | Ofertas | Not started |  | No blocker |
| QA14-42 | desktop | Active cases | Shopper |  |  | Desktop layout usable |  | Screenshot |  | Ofertas | Not started |  | No blocker |
| QA14-43 | ES | Active cases | Shopper |  |  | Spanish copy complete |  | Screenshot |  | Globalization | Not started |  | No missing text |
| QA14-44 | EN | Active cases | Shopper |  |  | English copy complete |  | Screenshot |  | Globalization | Not started |  | No missing text |
| QA14-45 | accessibility | Active cases | Shopper |  |  | Keyboard/labels/contrast acceptable |  | Notes |  | Ofertas | Not started |  | No P0/P1 a11y |
| QA14-46 | console/hydration | Active cases | Shopper/Admin |  |  | No Ofertas console/hydration errors |  | Console screenshot |  | Ofertas | Not started |  | Zero Ofertas blockers |
| QA14-47 | owner acceptance | All required QA complete | Chuy |  |  | Owner accepts or blocks launch |  | Owner note |  | Chuy | Not started |  | Owner PASS recorded |
