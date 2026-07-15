# Leonix Paid Listing Lifecycle Retrofit Matrix 01

Scope: document current paid/free lifecycle coverage and later adapter work. This matrix does not activate or alter non-Rentas category behavior.

Shared lifecycle target states: pending payment, active, expiring soon, expired, paused, suspended, unknown. Shared duration structures support fixed days, subscription, fixed 1/3/6/12 month terms, and free listings. No 9-month term is introduced.

| Category | Lane | Paid/free/mixed | Package key | Price | Duration type | Activation field | Expiration field | Dashboard action | Edit hydration | Public expiration | Renewal checkout | Renewal webhook | Reminder status | Admin lifecycle | Add-ons | Risk | Next gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Rentas | Privado/Negocio | Paid | `rentas_30d` | $24.99 | fixed_days, 30 | `published_at` + payment metadata | `listings.expires_at` | Renew listing | PARTIAL/ACTIVE | ACTIVE | ACTIVE | ACTIVE | PARTIAL | PARTIAL | none | Shared `listings` drift | Rentas QA renewal |
| Servicios | Base profile | Paid | `servicios_base_monthly` | repo matrix | subscription | `listing_status`/`published_at` | source-specific | Manage/add offers | PARTIAL | MISSING | MISSING | MISSING | MISSING | PARTIAL | offers add-on | separate table/profile_json | Servicios lifecycle adapter |
| Restaurantes | Base profile | Paid | `restaurantes_base_monthly` | repo matrix | subscription | source-specific publish status | source-specific | Manage/add coupons | PARTIAL | MISSING | MISSING | MISSING | MISSING | PARTIAL | coupon/offers add-on | restaurant source table | Restaurantes lifecycle adapter |
| Bienes Raices | Negocio/Agent | Paid | `br_agent_monthly` | $399/mo | subscription | `listings.status`/`is_published` | entitlement/subscription | Inventory add-on | PARTIAL | MISSING | MISSING | MISSING | MISSING | PARTIAL | `br_inventory_pack_monthly` | parent/child rows | BR negocio adapter |
| Bienes Raices | Privado/FSBO | Paid | repo matrix | repo matrix | fixed_days/unknown | `listings.status`/`is_published` | `expires_at` where present | Manage listing | PARTIAL | PARTIAL | MISSING | MISSING | MISSING | PARTIAL | none | shared table drift | FSBO lifecycle adapter |
| Autos | Privado | Paid | `autos_privado_30d` | repo matrix | fixed_days | Autos status | Autos expiration/payment metadata | Manage listing | PARTIAL | PARTIAL | MISSING | MISSING | MISSING | PARTIAL | none | separate service | Autos privado adapter |
| Autos | Dealer | Paid | `autos_dealer_monthly` | repo matrix | subscription | dealer/listing status | entitlement/subscription | Inventory add-on | PARTIAL | MISSING | MISSING | MISSING | MISSING | PARTIAL | inventory pack | dealer inventory groups | Autos dealer adapter |
| Empleos | Regular | Mixed | repo matrix | repo matrix | fixed_days/free | `lifecycle_status` | source-specific | Manage job | PARTIAL | PARTIAL | MISSING | MISSING | MISSING | PARTIAL | fairs/premium lanes separate | multiple packages | Empleos adapter |
| Empleos | Feria | Free/mixed | `empleos_job_fair_free` | free | free | `lifecycle_status` | N/A | Manage job fair | PARTIAL | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | PARTIAL | none | free package truth | Keep free adapter |
| Varios/En Venta | Paid lanes | Mixed | pro/paid lanes | repo truth | visibility window | `republished_at` | visibility window/detail metadata | Refresh/visibility | PARTIAL | PARTIAL | MISSING | MISSING | MISSING | PARTIAL | none | legacy republish semantics | En Venta adapter |
| Clases | Paid lane | Mixed | repo truth | repo truth | unknown | listings status | unknown | No generic republish | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING | none | incomplete paid proof | Clases audit gate |
| Free categories | Community/Busco/etc | Free | none | free | free | listings status | N/A | Manage/archive | PARTIAL | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | NOT APPLICABLE | PARTIAL | none | no paid renewal | Free lifecycle labels only |

Business term readiness: shared types can represent 1, 3, 6, and 12 months for future business packages. This document does not claim any business term is active unless a future category adapter proves it from repository and payment truth.
