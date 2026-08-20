# Ofertas QA Cleanup 01

Customer-journey repair for New Application identity, scan progress truth, review workspace, Step 7 commercial summary, Preview return paths, and submission language.

## Draft identity

- `applicationSessionId` is Ofertas-local browser session identity.
- `intent=new` / hub navigation starts empty.
- Same-tab refresh of a matching active session restores the current application.
- `intent=continue`, `step`, `review`, or listing id restores the stored application.
- Browser draft reset does not delete database products.

## Promo

Step 7 calls `POST /api/revenue-os/promo/validate` through `validateRevenuePromoForCheckout`. Apply does not redeem. No Ofertas promo table or local discount math.
