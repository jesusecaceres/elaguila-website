# Package 13 Real-QA Data Contract

No records were inserted. This document names the exact non-Production records required after explicit staging authorization.

| Record | Required Identity | Expected State | Required Evidence |
|---|---|---|---|
| Standard flyer advertiser | parent UUID, owner ID, Leonix ID, `ofertas_locales_flyer_30d`, source version, scan job, item IDs | paid entitlement, pending review then active | upload, scan progress, review, Preview, checkout/webhook, approval, public product drawer, flyer viewer, shopping list |
| Verified partner flyer advertiser | parent UUID, partner assignment, Leonix ID, flyer product key | partner courtesy active, standard price still canonical | courtesy proof, placement truth, no permanent free term |
| Coupon advertiser | parent UUID, Leonix ID, `ofertas_locales_coupons_30d`, coupon source, coupon IDs | paid entitlement, active coupon | terms, validity, coupon drawer, Business Hub, no shopping list/cart/redemption |
| Rejected/correction case | same parent before and after rejection | changes requested, resubmitted, no second payment, no term start | customer-safe reason, correction payload, Admin resubmission |
| Partial scan failure | source version + scan job + failed page | recovery required | failed page, retry eligibility, no fake worker success |
| Active listing | published_at/expires_at set by approval | public eligible | search result, drawer, source proof, analytics |
| Expired listing | expires_at in the past | public ineligible, owner/Admin history preserved | no active badge, no public link |
| Renewal case | same parent/Leonix ID, renewal attempt | scheduled activation, no-day-loss | renewal payment/courtesy, scheduled window, no duplicate parent |

Test data creation must be a later authorized staging action. No seed SQL is provided here to avoid accidental Production targeting.
