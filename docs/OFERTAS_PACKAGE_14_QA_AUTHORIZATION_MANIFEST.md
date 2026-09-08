# Package 14 QA Authorization Manifest

Real QA may begin only after Chuy authorizes the exact Git state and non-Production environment below. No secret values belong in this file.

## Exact Authorization

| Item | Required Confirmation |
|---|---|
| Git branch | `integration/ofertas-locales-2026-07` |
| Git SHA | `0cfbda4a6a5888457acd93b9d3c78c710dc0f732` |
| Environment | Non-Production only |
| Production exclusion | Confirm the target environment is not Production |
| Ordered migration authorization | Explicit owner authorization before applying migrations in documented order |
| Supabase project/environment | Explicit non-Production project authorization |
| Gemini | Explicit non-Production scan authorization |
| Storage | Explicit non-Production upload/read authorization |
| Stripe | Explicit test-mode checkout/webhook authorization |
| Webhook | Explicit non-Production webhook route authorization |
| Worker | Explicit non-Production worker authorization |
| Notification test authorization | Explicit non-Production notification/outbox authorization |
| Owner test account | Authorized advertiser owner test account only |
| Test users | Authorized advertiser and shopper test users only |
| Admin users | Authorized Leonix Admin test user only |
| Rollback owner | Named before QA starts |
| Evidence owner | Named before QA starts |
| Defect owner | Named before QA starts |
| Stop authority | Chuy or named QA lead |
| Owner acceptance authority | Chuy |

## Fillable Checklist

- [ ] Branch confirmed: `integration/ofertas-locales-2026-07`
- [ ] SHA confirmed: `0cfbda4a6a5888457acd93b9d3c78c710dc0f732`
- [ ] Non-Production environment name recorded: `________________`
- [ ] Production exclusion confirmed.
- [ ] Ordered migration application authorized by: `________________`
- [ ] Supabase non-Production project authorized by: `________________`
- [ ] Gemini non-Production use authorized by: `________________`
- [ ] Storage non-Production use authorized by: `________________`
- [ ] Stripe test-mode use authorized by: `________________`
- [ ] Webhook use authorized by: `________________`
- [ ] Worker use authorized by: `________________`
- [ ] Notification test/outbox use authorized by: `________________`
- [ ] Owner test account authorized: `________________`
- [ ] Advertiser test account authorized: `________________`
- [ ] Admin test account authorized: `________________`
- [ ] Rollback owner: `________________`
- [ ] Evidence owner: `________________`
- [ ] Defect owner: `________________`
- [ ] Stop authority: `________________`
- [ ] Owner acceptance authority: `Chuy`

No Preview, deployment, Production action, database connection, migration application, Gemini call, storage call, Stripe call, webhook call, worker run, or notification send is authorized by this document alone.
