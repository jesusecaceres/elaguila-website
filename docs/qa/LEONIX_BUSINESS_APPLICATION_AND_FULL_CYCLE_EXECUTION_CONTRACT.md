# LEONIX MEDIA — BUSINESS APPLICATION FINAL EXECUTION CONTRACT + FULL-CYCLE TRUE QA MASTER

**Status:** Authoritative execution contract for the next repair pass and the complete lifecycle certification that follows.

**Scope:** Servicios, Restaurantes, Comida Local, plus the shared/global systems they consume.

**Primary rule:** This file is the source of truth. Do not summarize, reinterpret, weaken, or replace a numbered acceptance criterion with a looser equivalent.

**Evidence doctrine:**
- TRUE only when the exact required behavior is proven.
- UNKNOWN = FALSE.
- NOT TESTED = FALSE.
- LIKELY = FALSE.
- “Component exists” is not behavioral proof.
- “Build passes” is not behavioral proof.
- A field is not complete until the required input behavior, save/persistence, hard refresh, Preview, Edit, and where applicable Publish/Public behavior are proven.
- Existing filled QA ads/applications are canonical QA assets. Do not force the owner to refill them.

---

# PART I — CURRENT ONE-HOUR PRIORITY: APPLICATION-ONLY FINALIZATION

## 1. Mission

Finish the three business applications themselves first:

1. Servicios
2. Restaurantes
3. Comida Local

Do not expand into Dashboard/Admin/search/public lifecycle work except where the application directly depends on it for Preview, return-to-edit, pricing, persistence, translation, contact controls, coupons, media, or payment handoff.

The immediate objective is to take the already-filled applications, preserve all existing data, correct every screenshot-derived application defect, standardize the shared patterns that were explicitly approved, and end with one strict application-only TRUE/FALSE release gate.

## 2. Locked implementation strategy

Use one dedicated isolated worktree and one branch for this final application pass:

- **Worktree:** `C:\projects\elaguila-website-business-applications-final`
- **Branch:** `fix/business-applications-final-polish-2026-08`

Base from the latest safe state that contains the already-completed bilingual/pricing/hydration fixes plus current main. Do not discard the useful work already completed.

### Required execution gates

- Gate A0 — baseline and exact contract ingestion
- Gate A1 — shared application standards
- Gate A2 — Servicios application finalization
- Gate A3 — Restaurantes application finalization
- Gate A4 — Comida Local application finalization
- Gate A5 — cross-category consistency
- Gate A6 — application-only verifier
- Gate A7 — diff/build/release audit

No broad redesign. No unrelated category work. No migrations unless an exact criterion cannot be fulfilled without one; in that case stop and report the blocker before inventing a schema.

---

# 3. SHARED APPLICATION STANDARDS — LOCKED

These are the approved patterns that should be shared globally where they apply.

## 3.1 Existing filled application protection

1. Existing Servicios filled application must hydrate without owner refill.
2. Existing Restaurantes filled application must hydrate without owner refill.
3. Existing Comida Local filled application must hydrate without owner refill.
4. Hard refresh must preserve existing text values.
5. Hard refresh must preserve selections/chips.
6. Hard refresh must preserve hours.
7. Hard refresh must preserve photos/media.
8. Hard refresh must preserve video URLs.
9. Hard refresh must preserve socials and additional links.
10. Hard refresh must preserve coupons/flyer data where applicable.
11. Hard refresh must preserve category-specific values.
12. Locale changes must not mutate stored canonical values.
13. Locale changes must not create a new listing/application identity.
14. Preview → Edit must return to the same canonical draft/listing.
15. Existing listing/application IDs must not be duplicated by edit, preview, or locale switching.

## 3.2 Unsaved-change protection

16. Real unsaved changes trigger a leave/reload warning.
17. Cancel/Stay preserves all data.
18. Successful save with nothing dirty must not keep producing a false leave warning.
19. Preview → Edit must not incorrectly trigger a destructive leave warning.
20. Explicit discard must require deliberate confirmation.

## 3.3 Languages input — shared standard

21. Use one shared language-entry behavior where storage permits.
22. Fixed/suggested languages can be selected.
23. Existing saved languages hydrate correctly.
24. Custom/Other language field accepts normal typing.
25. Spacebar works in custom language field.
26. Backspace works.
27. Cursor editing works.
28. Paste works.
29. Explicit Add/Accept action works.
30. Added custom language becomes a chip/value.
31. Added custom language can be removed independently.
32. Blank/whitespace-only values cannot create empty chips.
33. Duplicate values are handled cleanly.
34. Multiple custom languages can coexist.
35. Do not impose an arbitrary max-3 restriction when layout/storage support more.
36. Spanish labels are Spanish.
37. English labels are English.
38. Stored identifiers remain language-neutral.
39. The same semantic language cannot duplicate because of locale naming differences.

## 3.4 Hours — Restaurant quality becomes the shared standard

40. Seven days are visible and easy to edit.
41. Open-first/default workflow is fast.
42. Closed toggle works clearly per day.
43. Time editing is simple and aligned.
44. Monday/weekday row alignment is correct.
45. Closed days do not display fake open hours.
46. Special hours can be added where category/storage supports them.
47. More than one special-hours entry can coexist where supported.
48. Special-hours fields should use available horizontal space rather than unnecessary tall stacking when responsive layout allows.
49. Open-now/closed-now computation is truthful.
50. “Open today until…” / “Hoy hasta…” snapshot is preserved where applicable.
51. Existing legacy schedules hydrate through adapters without destructive conversion.
52. Spanish weekday labels remain Spanish.
53. English weekday labels are English.

## 3.5 Phone and WhatsApp

54. Primary phone uses familiar formatting such as `(XXX) XXX-XXXX` where applicable.
55. Normal digit typing works.
56. Backspace/editing does not fight the user.
57. Paste works.
58. Saved phone persists through hard refresh and Preview/Edit.
59. Call CTA uses the real stored number.
60. SMS CTA uses the real stored number.
61. WhatsApp remains separate from US-only phone formatting.
62. International WhatsApp values are not truncated to ten digits.
63. WhatsApp public destination remains truthful.

## 3.6 Additional websites/social links

64. Primary website remains distinct.
65. Additional websites use repeatable **Title + URL + Add another** rows.
66. Multiple additional websites can coexist.
67. Removing one additional website preserves the others.
68. Additional links survive save, hard refresh, Preview, and Edit.
69. Additional websites are not hidden under vague `Ver más` controls.
70. Additional website rows with no value do not render publicly.
71. Social links render only when a real URL exists.
72. Pinterest may be included where the model supports it and it fits visual businesses.
73. Irrelevant network choices (for example Indeed as a customer-facing restaurant social) must not appear.

## 3.7 Rich Correo/contact modal

74. Preserve/adopt the working Restaurant rich Correo interaction as the shared standard.
75. Correo only appears when a real email exists.
76. The modal uses the actual configured email.
77. Copy-email/message/mail-app actions remain truthful.
78. Missing email hides Correo entirely.
79. Correo is bilingual according to active UI locale.

## 3.8 Google / Yelp / Leonix trust treatment

80. Google remains an external reputation source.
81. Yelp remains an external reputation source.
82. External links open their real stored destinations.
83. Missing Google/Yelp data hides the corresponding control.
84. Leonix first-party trust remains visually separate from Google/Yelp.
85. Leonix trust uses lion treatment, not a generic heart/star rating clone.
86. Real counts only; no fake seeded counts.
87. The previously discussed quick-view/drawer/modal concept for Google/Yelp must be audited and either implemented as approved or explicitly reported as still deferred; do not silently drop it.

## 3.9 Translation

88. `/api/translate-ad` must remain intact.
89. Existing `translation_records` behavior/cache remains intact.
90. Original advertiser-entered content is preserved; translation must not destructively overwrite source text.
91. Application-shell locale and ad-content translation are separate concepts.
92. The Restaurant translator capability that the owner explicitly identified as valuable must not disappear.
93. Translation UX must be reconciled across Servicios, Restaurantes, and Comida Local rather than accidentally existing in unrelated locations with no product explanation.
94. Do not claim “global translator” TRUE unless the visible UX is actually available according to the final product decision.

## 3.10 Address UX

95. Canonical street/unit/city/state/postal/country fields remain separate.
96. Existing addresses hydrate.
97. CityAutocomplete is city-level canonicalization only; do not falsely label it as street verification.
98. The original owner requirement for a visible suggested/verified-address UX remains unresolved until a real street-level provider is wired.
99. If no provider is implemented in this one-hour pass, the application must not display fake “Verified Address” claims.
100. Manual address entry remains available.
101. Comida Local home-address privacy is never weakened by address work.
102. Permanent address, service area, and temporary/current location remain distinct concepts.

## 3.11 Media / gallery / flyer

103. Existing media pipeline and durable URLs remain intact.
104. Do not put raw base64/blob media into Stripe payloads.
105. Existing uploaded media remains reusable; no owner re-upload.
106. Restaurant’s strong flyer/coupon viewer becomes the shared/canonical behavior where applicable.
107. Viewer closes at normal zoom and high zoom.
108. Escape closes where supported.
109. Mobile layout is usable.
110. Do not dump raw image/data URLs into a new tab.
111. Photos remain visually primary; do not let video cards overpower the photo experience without deliberate reason.
112. Gallery behavior must preserve photo/video browsing without destructive visual downgrade.

## 3.12 Pricing / Preview handoff

113. Servicios base price remains `$399/month`.
114. Restaurantes base price remains `$399/month`.
115. Comida Local base price remains `$129/month`.
116. Servicios coupons/offers are included; no active +$99 path.
117. Restaurant coupons/offers are included; no active +$99 path.
118. No current-sale Comida `$99`, `$149`, `$199`, or `$399` path.
119. Final application review shows truthful price breakdown.
120. One clear Preview CTA at the final application step.
121. No direct publish bypass before Preview/payment on new paid listings.
122. Preview → Edit returns to the final/current application context, not the beginning.
123. Active paid listing edit must not recharge the base package.
124. Active coupon editing remains available for the duration of the active paid listing without a new coupon charge.

---

# 4. SERVICIOS APPLICATION — EXACT SCREENSHOT-DERIVED CONTRACT

## 4.1 Header / shell

S-001. `LEONIX CLASIFICADOS` eyebrow must be fully visible below the fixed global header.
S-002. Top spacing must not clip or crowd title/eyebrow at 100% zoom.
S-003. Main title/intro remain visually aligned and readable.
S-004. Spanish/English switch remains accessible.
S-005. Steps 1–8 are directly clickable when prerequisites allow.
S-006. Disabled steps explain why they are unavailable.
S-007. Direct step navigation preserves draft state.
S-008. Back/Next preserves draft.

## 4.2 Business type / trade-vs-professional presets

S-009. Business-type dropdown visible labels are alphabetical in Spanish when `lang=es`.
S-010. Business-type dropdown visible labels are alphabetical in English when `lang=en`.
S-011. Sorting changes only rendered order; stored canonical IDs remain unchanged.
S-012. Every selectable business type has a real matching preset.
S-013. Trade presets differ from professional presets.
S-014. `llantas_neumaticos` shows tire-specific suggested services.
S-015. Lawyer/legal types show legal-specific services/reasons, not tire/trade content.
S-016. Suggested services change appropriately by selected business type.
S-017. `Por qué elegirnos` suggestions change appropriately by selected business type.
S-018. Quick facts change appropriately by selected business type.
S-019. CTA choices make sense for the selected profession/trade.
S-020. Weak/generic presets are improved rather than silently falling back to unrelated content.
S-021. Existing business-type selection survives hard refresh.
S-022. `¿No ves tu categoría?` is functional or removed.
S-023. `Otro servicio` remains the truthful fallback.
S-024. Custom `Otro servicio` accepts multi-word typing, Spacebar, backspace, paste, Add, remove, save, refresh, Preview, Edit.

## 4.3 Address

S-025. Existing physical-address fields remain usable.
S-026. City canonicalization works without breaking existing free-text city data.
S-027. A true street-level suggested/verified-address UI is either implemented with a real provider or explicitly reported FALSE/deferred; no fake verified state.
S-028. Directions/public-address behavior remains based on real usable location data.

## 4.4 Media — exact owner layout request

S-029. Maximum highlighted/featured photo concept remains **4**.
S-030. Owner can explicitly select which four are highlighted.
S-031. Highlighted order is explicit and stable.
S-032. Numbering/order defects such as `1/4,2/4,4/4,3/4` are impossible.
S-033. **Highlighted four photos render in their own dedicated section in the application.**
S-034. **Remaining gallery photos render in a separate second section.**
S-035. A single mixed grid with gold stars does NOT satisfy S-033/S-034.
S-036. Existing images hydrate; no owner re-upload.
S-037. Existing media survives hard refresh.
S-038. Video limit is **8**.
S-039. Application copy/validation reflects 8 videos.
S-040. Preview/public/gallery behavior does not silently truncate to stale 4-video logic.
S-041. Photos remain visually more important than videos, unless preserving a fragile working viewer requires no change.
S-042. Uploaded/accepted status is clear and truthful.

## 4.5 About / services / highlights

S-043. Preserve About Us.
S-044. Preserve short slogan/phrase.
S-045. Remove fake AI-helper wording if no AI helper is actually available.
S-046. Suggested services are type-specific.
S-047. Multiple custom services can be added.
S-048. Custom services do not overwrite one another.
S-049. Duplicate services are prevented/handled cleanly.
S-050. `Por qué elegirte` uses available horizontal space better (roughly 3×2 / 3×3 where responsive).
S-051. Avoid one/two orphaned tiny chips under a mostly empty layout.
S-052. Selection caps exist only where a real downstream capacity requires them.
S-053. Helper examples are generic enough for any service business, not tire-specific when the selected type is unrelated.

## 4.6 Quick Facts — exact owner complaint

S-054. Quick Facts are not artificially limited to 2.
S-055. **Multiple custom Quick Facts can be added.**
S-056. One lonely custom `Otro dato rápido` slot does NOT satisfy S-055.
S-057. New custom Quick Fact creates a separate chip/value.
S-058. Adding a second custom Quick Fact does not overwrite the first.
S-059. Custom Quick Facts survive save/hard refresh/Preview/Edit.
S-060. Avoid duplicating facts already prominently shown elsewhere.

## 4.7 Options & Facilities — section-specific custom inputs

S-061. `Servicio` group gets its own `Otro servicio/facilidad` input + Add.
S-062. `Disponibilidad` group gets its own `Otra disponibilidad` input + Add.
S-063. `Clientes que atiende` gets its own `Otro tipo de cliente` input + Add.
S-064. `Accesibilidad e idiomas` gets its own custom input + Add.
S-065. `Descuentos y beneficios` gets its own custom input + Add.
S-066. Each custom entry renders immediately inside the group where it was added.
S-067. A single generic bottom `Otra opción o facilidad` field does NOT satisfy S-061 through S-065.
S-068. Existing legacy generic custom values are preserved non-destructively.
S-069. New categorized custom values do not require a destructive migration unless absolutely unavoidable.
S-070. Each group supports multiple custom entries where storage/layout permits.
S-071. Spacebar/backspace/paste/Add/remove work in every custom input.

## 4.8 Service areas

S-072. Multiple service areas can be added.
S-073. Service areas are structured chips/entries rather than ambiguous comma parsing when feasible.
S-074. Entries are removable independently.
S-075. Existing legacy service-area text/list hydrates.
S-076. Broader service-radius description remains possible.

## 4.9 Languages / hours / contact

S-077. Servicios consumes the shared language standard.
S-078. More than three languages are allowed where layout permits.
S-079. Custom languages work with Spacebar/Add/remove.
S-080. Servicios consumes/preserves the stronger Restaurant-style hours UX.
S-081. Closed toggle works.
S-082. Special hours are available where storage supports them.
S-083. `Hoy / Open today until…` truth can be computed for downstream Preview/public.
S-084. Primary phone behaves correctly.
S-085. WhatsApp remains international-safe.
S-086. Correo uses the rich shared modal.
S-087. Website/directions/booking use exact stored destinations.

## 4.10 Payments / reviews / trust

S-088. Supported payment methods are plentiful enough for real service businesses.
S-089. Recognizable provider logos such as Affirm remain available where supported.
S-090. Payment selections persist.
S-091. Review submission does not fail with an opaque unexplained HTTP 400 for ordinary input.
S-092. Validation feedback is actionable.
S-093. Google/Yelp remain external review sources.
S-094. Leonix first-party trust/review treatment uses the lion and real counts.
S-095. The requested Google/Yelp quick-view/drawer idea is explicitly resolved as implemented or deferred; no silent omission.

## 4.11 Coupons / flyer

S-096. Coupons/offers are included in `$399`.
S-097. No +$99 wording anywhere in the application/final review/Preview/checkout.
S-098. Existing coupon title/description/code/expiration/instructions hydrate.
S-099. Flyer asset is separate from the external “more offers” URL.
S-100. Flyer opens in the canonical Leonix viewer.
S-101. External `Ver más cupones` remains a separate outbound action.
S-102. Active listing can edit coupons while active without new Stripe coupon purchase.

## 4.12 Final application review / Preview handoff

S-103. Step 8 keeps required responsibility/accuracy confirmations.
S-104. Step 8 shows `$399/month` base.
S-105. Step 8 shows coupons/offers as included.
S-106. Final step has one clear Preview CTA.
S-107. No duplicate Preview CTA.
S-108. No direct Publish bypass.
S-109. Preview receives the same current draft/media.
S-110. `Volver a editar` returns to Step 8/current final review state.
S-111. Return-to-edit preserves every field/media item.
S-112. Preview CTA sizes are reduced/normalized.
S-113. Oversized CTA controls are corrected while maintaining mobile tap targets.
S-114. Unnecessary `Ver todos los destacados` / collapse is removed when content cleanly fits.
S-115. `Pagos y beneficios` remains open/visible when the content fits instead of forcing extra clicks.
S-116. Existing filled Servicios ad requires no refill.

---

# 5. RESTAURANTES APPLICATION — EXACT SCREENSHOT-DERIVED CONTRACT

## 5.1 Shell / header / logo

R-001. Preserve premium Restaurant identity; no broad redesign.
R-002. Warm/brown header is softened because the owner found it too strong.
R-003. Use Leonix/category tokens, not arbitrary owner color customization.
R-004. Restaurant logo avoids an ugly forced white box where safe.
R-005. Square logo displays strongly.
R-006. Wide logo contains properly.
R-007. Tall logo contains properly.
R-008. No destructive crop.

## 5.2 Cuisine/styles and grouped selections

R-009. Cuisine/style selection is not restricted to only 3 if layout supports more.
R-010. Target up to ~6 in a clean responsive 2×3 style where appropriate.
R-011. Existing selections hydrate.
R-012. Custom `Otro` accepts multi-word typing/Spacebar/backspace/paste/Add/remove.
R-013. Ambience remains available.
R-014. Food options remain available.
R-015. Amenities remain available.
R-016. Grouped sections that logically need custom entries must have section-specific custom inputs rather than one ambiguous bottom catch-all.
R-017. Custom values render within the correct semantic group.

## 5.3 Languages / hours / special hours

R-018. Restaurant language input follows the shared standard.
R-019. English application shell is genuinely English when `lang=en`.
R-020. Spanish application shell remains Spanish.
R-021. No mixed-language system UI.
R-022. Restaurant’s strong hours UX is preserved.
R-023. Special hours are preserved.
R-024. Multiple special-hours entries are supported where the model allows.
R-025. Open-now/current-status card remains accurate.
R-026. Reload/hard refresh returns to the same intended section/state; it must not always force `focus=coupon-upgrade` unless that was the explicit entry path.

## 5.4 Additional websites / socials

R-027. Primary website remains distinct.
R-028. Additional websites support repeatable **Title + URL** rows.
R-029. Multiple additional websites can coexist.
R-030. Additional websites are not buried under generic `Ver más`.
R-031. Appropriate additional links appear in a clear contact/business area.
R-032. Facebook/Instagram/TikTok/YouTube remain truthful.
R-033. Pinterest is allowed only if supported and useful.
R-034. Indeed is not shown as a customer-facing Restaurant social.

## 5.5 Contact / quote behavior

R-035. Rich Correo modal remains canonical and working.
R-036. Correo is hidden without a real email.
R-037. `Pedir cotización` respects the dedicated configured quote URL when one exists.
R-038. A configured external quote URL must not be hijacked to WhatsApp.
R-039. `Formulario de cotización` opens the actual configured URL.
R-040. `Contactar para evento` uses the intended rich contact mechanism where configured.
R-041. `Cotizar catering` resolves to a real configured destination/action.
R-042. No CTA renders without a real destination.

## 5.6 Catering

R-043. Catering is a real titled section when data exists.
R-044. Catering is not buried only inside generic `Ver más`.
R-045. Catering section is hidden when no catering data exists.
R-046. Catering fields support multi-word typing/Spacebar.
R-047. Catering values persist through hard refresh/Preview/Edit.

## 5.7 Payments

R-048. Payment section supports a useful set of methods.
R-049. Payment snapshot is expanded/clean.
R-050. Selected methods persist.
R-051. Empty/unselected methods do not render as fake options.
R-052. Do not bury a clean payment section under unnecessary collapse.

## 5.8 Coupons

R-053. Restaurant base remains `$399/month`.
R-054. Coupons/offers are included.
R-055. No active +$99 coupon upgrade CTA.
R-056. No active `restaurantes_offers_addon` current-purchase path.
R-057. Existing published Restaurant can add/edit coupons on the same listing without Stripe.
R-058. Existing coupon text/images are preserved.
R-059. Historical entitlement/SKU records may remain read-only for compatibility.
R-060. Hard refresh does not strand the owner in a stale coupon-upgrade state.

## 5.9 Media / flyer / translator

R-061. Restaurant flyer modal remains the canonical strong implementation.
R-062. Viewer stays closable at 100%/175% zoom and on mobile.
R-063. Restaurant gallery modal remains strong.
R-064. Four featured photos + remaining gallery concept is preserved.
R-065. Featured/gallery ordering is durable.
R-066. Photos should not look artificially smaller/weaker than videos if a safe adjustment is possible; if risky, preserve working media rather than breaking it.
R-067. Restaurant translator feature must not disappear.
R-068. Translation placement is explicitly reconciled with the cross-category translation standard.

## 5.10 Final review / Preview

R-069. Final review shows `$399/month`.
R-070. Coupons show included.
R-071. Promo/total breakdown is visible and truthful.
R-072. One clear Preview CTA.
R-073. No duplicate `Continuar a vista previa` controls.
R-074. No direct Publish bypass.
R-075. Preview → Edit preserves current draft/media.
R-076. Preview mapper/quick info/CTA labels/trust/stacks respect locale.
R-077. Existing filled Restaurant ad requires no refill.

---

# 6. COMIDA LOCAL APPLICATION — EXACT SCREENSHOT-DERIVED CONTRACT

## 6.1 Product identity / pricing

C-001. Comida Local remains visibly distinct from Restaurant.
C-002. No `Publicar restaurante` leakage.
C-003. Current price is `$129/month`.
C-004. No current `$99` path.
C-005. No current `$149` path.
C-006. No current `$199` path.
C-007. No current `$399` path.

## 6.2 Seller type registry

C-008. Food truck.
C-009. Cart/puesto.
C-010. Home kitchen/comida desde casa.
C-011. Pop-up.
C-012. Feria/event vendor.
C-013. Local catering.
C-014. Meal prep.
C-015. Bakery/desserts.
C-016. Private/personal chef.
C-017. Delivery-only kitchen.
C-018. Farmers/market vendor.
C-019. Other.
C-020. Spanish labels are natural.
C-021. English labels are real English.
C-022. Stored seller-type IDs remain language-neutral.
C-023. Custom Other seller type supports multi-word typing/Spacebar/Add/remove/persistence.

## 6.3 Conditional seller flows

C-024. Food truck/mobile gets current/live-location controls.
C-025. Food truck/mobile gets service area.
C-026. Food truck/mobile gets schedule/hours.
C-027. Food truck/mobile gets real order/contact link.
C-028. Home kitchen exact street address is private by default.
C-029. Home kitchen can show service city/area.
C-030. Home kitchen supports pickup/delivery.
C-031. Home kitchen private fulfillment guidance does not leak publicly.
C-032. Pop-up/feria gets event/location schedule.
C-033. Pop-up/feria gets temporary-location link.
C-034. Catering gets quote/contact.
C-035. Catering gets service radius/area.
C-036. Catering gets event information.
C-037. Meal prep gets recurring pickup/delivery schedule.
C-038. Meal prep gets order URL.
C-039. Switching seller type does not corrupt unrelated saved data.

## 6.4 Service modes

C-040. Pickup.
C-041. Delivery.
C-042. Preorder.
C-043. Scheduled pickup.
C-044. Custom order.
C-045. Catering.
C-046. Events/ferias.
C-047. Mobile service.
C-048. Market pickup.
C-049. Meal prep.
C-050. Limited daily quantity.
C-051. Other.
C-052. Service modes are tailored to Comida Local, not blindly copied from Restaurant.
C-053. Custom Other mode supports multi-word typing/Spacebar/Add/remove/persistence.
C-054. Multiple modes coexist without overwriting one another.

## 6.5 Highlights

C-055. Homemade / hecho en casa.
C-056. Fresh daily.
C-057. Made to order.
C-058. Family owned.
C-059. Local ingredients.
C-060. Custom orders.
C-061. Preorder.
C-062. Pickup.
C-063. Delivery.
C-064. Weekend availability.
C-065. Catering.
C-066. Vegetarian/vegan/gluten-free where truthful.
C-067. No Restaurant-only full-bar/upscale concepts where inappropriate.
C-068. Custom highlight supports multi-word typing/Spacebar/Add/remove/persistence.

## 6.6 Section-specific Other behavior

C-069. Grouped sections that represent different semantics get their own custom `Other` input when appropriate.
C-070. One generic bottom catch-all cannot be used when it loses semantic placement.
C-071. Added custom value appears within the group where it was added.
C-072. Existing legacy custom values remain compatible.

## 6.7 Find Me Today / privacy

C-073. `Encuéntrame Hoy` exists as a real optional feature.
C-074. English label uses approved `Find Me Today` equivalent.
C-075. Configurable destination can be Maps, Instagram, Facebook, TikTok, website, ordering page, event page, or custom URL.
C-076. Optional status text supports multi-word typing/Spacebar.
C-077. Today/current location is distinct from permanent address.
C-078. Today/current location is distinct from normal service area.
C-079. Changing today location does not overwrite permanent address.
C-080. Changing today location does not overwrite service area.
C-081. Updating Find Me Today does not create a new listing.
C-082. Updating Find Me Today does not trigger Stripe.
C-083. Missing destination hides the CTA.
C-084. Private home address does not leak through directions.

## 6.8 Address / contact / links

C-085. Permanent address fields remain separate/canonical.
C-086. Service area remains separate.
C-087. Temporary/current location remains separate.
C-088. A real street-verification provider is required before any `Verified Address` claim.
C-089. Phone uses familiar formatting.
C-090. WhatsApp remains international-safe.
C-091. Email field is real and persists.
C-092. Correo uses rich shared modal only with a real email.
C-093. Additional websites support repeatable Title + URL.
C-094. Multiple additional links coexist.
C-095. Additional links survive hard refresh/Preview/Edit.
C-096. Socials remain truthful.

## 6.9 Languages / hours / media

C-097. Comida Local language input follows shared standard.
C-098. English application shell is fully English.
C-099. Spanish shell remains Spanish.
C-100. English validation messages are English.
C-101. English field labels/helpers/placeholders are English.
C-102. Sidebar/nav respects locale.
C-103. Hours follow shared standard while respecting mobile/event seller realities.
C-104. Legacy availability remains compatible.
C-105. Gallery/media behavior remains strong.
C-106. Empty videos do not create an empty Videos tab.
C-107. Existing media survives hydration/hard refresh.

## 6.10 Preview / checkout

C-108. Preview reads active locale.
C-109. Preview → Edit preserves locale.
C-110. Preview → Checkout preserves locale.
C-111. Checkout locale is not hardcoded to Spanish.
C-112. Final price remains `$129/month`.
C-113. Existing filled Comida Local ad requires no refill.

---

# 7. CROSS-CATEGORY APPLICATION CONSISTENCY GATE

X-001. Shared language component/behavior is consistent across all three.
X-002. Shared hours behavior is consistent without downgrading Restaurant.
X-003. Shared rich Correo behavior is consistent.
X-004. Shared flyer/coupon viewer is consistent where applicable.
X-005. Shared gallery behavior is consistent where applicable.
X-006. Additional websites use the same repeatable pattern.
X-007. Section-specific custom fields follow the same semantic doctrine.
X-008. Existing stored IDs/keys remain unchanged.
X-009. ES/EN shell behavior is complete in all three.
X-010. Translation architecture is preserved and visible placement is explicitly resolved.
X-011. Address UX truth is explicit; no fake verification.
X-012. Existing filled ads survive all application changes.
X-013. Hard refresh does not reset the application.
X-014. Hard refresh returns to the same intended section/state.
X-015. Preview → Edit returns to the same application context.
X-016. Pricing is truthful across all three.
X-017. Coupons are included for Servicios/Restaurantes.
X-018. No stale current-sale +$99/+199 contradictions remain.
X-019. Active paid edit does not recharge the base package.
X-020. No unrelated category files or migrations are introduced.

---

# 8. APPLICATION-ONLY TRUE/FALSE RELEASE REPORT

Claude must return each item below with evidence.

## Shared

1. Existing filled Servicios application preserved: TRUE/FALSE
2. Existing filled Restaurant application preserved: TRUE/FALSE
3. Existing filled Comida Local application preserved: TRUE/FALSE
4. Hard refresh preserves all application data: TRUE/FALSE
5. Same-section/state refresh behavior correct: TRUE/FALSE
6. Shared unsaved-change guard correct: TRUE/FALSE
7. Shared Languages behavior correct: TRUE/FALSE
8. Spacebar/Add/remove verified for all critical custom fields: TRUE/FALSE
9. Shared hours standard correct: TRUE/FALSE
10. Special hours correct where supported: TRUE/FALSE
11. Shared phone behavior correct: TRUE/FALSE
12. WhatsApp international behavior preserved: TRUE/FALSE
13. Shared rich Correo behavior correct: TRUE/FALSE
14. Additional websites repeatable pattern correct: TRUE/FALSE
15. Google/Yelp/Leonix trust separation correct: TRUE/FALSE
16. Translation architecture preserved/reconciled: TRUE/FALSE
17. Address verification truth honest: TRUE/FALSE
18. Media/gallery/flyer behavior preserved: TRUE/FALSE
19. Preview-first application flow correct: TRUE/FALSE
20. Active paid edit avoids base recharge: TRUE/FALSE

## Servicios

21. Header top clipping fixed: TRUE/FALSE
22. Business types alphabetical by locale: TRUE/FALSE
23. Every business type has appropriate preset: TRUE/FALSE
24. Professional/trade presets differ appropriately: TRUE/FALSE
25. Multiple custom services: TRUE/FALSE
26. Multiple custom Quick Facts: TRUE/FALSE
27. Servicio group custom field: TRUE/FALSE
28. Disponibilidad group custom field: TRUE/FALSE
29. Clientes group custom field: TRUE/FALSE
30. Accesibilidad/idiomas custom field: TRUE/FALSE
31. Descuentos/beneficios custom field: TRUE/FALSE
32. Legacy generic custom values preserved: TRUE/FALSE
33. Multiple service areas: TRUE/FALSE
34. Four highlighted photos separate from remaining gallery: TRUE/FALSE
35. Highlighted order explicit/durable: TRUE/FALSE
36. 8-video limit consistent: TRUE/FALSE
37. Fake AI helper wording removed: TRUE/FALSE
38. `Por qué elegirte` layout/copy improved: TRUE/FALSE
39. Review 400 feedback repaired: TRUE/FALSE
40. CTA sizing normalized: TRUE/FALSE
41. Coupons included/no +$99: TRUE/FALSE
42. Flyer viewer canonical: TRUE/FALSE
43. Final review shows $399 + included coupons: TRUE/FALSE
44. One Preview CTA/no direct Publish: TRUE/FALSE
45. `Volver a editar` returns to Step 8/current state: TRUE/FALSE
46. Unnecessary `Ver todos los destacados` collapse removed: TRUE/FALSE
47. Pagos y beneficios left open when content fits: TRUE/FALSE

## Restaurantes

48. Header softened without redesign: TRUE/FALSE
49. Logo presentation improved/no destructive crop: TRUE/FALSE
50. Cuisine/style capacity expanded appropriately: TRUE/FALSE
51. Group-specific custom inputs correct: TRUE/FALSE
52. Special hours/open-now preserved: TRUE/FALSE
53. Reload does not force coupon section unless intended: TRUE/FALSE
54. Additional websites repeatable/not hidden: TRUE/FALSE
55. Rich Correo preserved: TRUE/FALSE
56. Quote URL beats WhatsApp fallback when configured: TRUE/FALSE
57. Event/catering CTAs truthful: TRUE/FALSE
58. Catering titled/open when present: TRUE/FALSE
59. Payment snapshot improved: TRUE/FALSE
60. Coupons included/no +$99 path: TRUE/FALSE
61. Existing published coupon edit requires no Stripe: TRUE/FALSE
62. Flyer/gallery canonical behavior preserved: TRUE/FALSE
63. Translator preserved/reconciled: TRUE/FALSE
64. Final review $399 truth: TRUE/FALSE
65. One Preview CTA/no direct Publish: TRUE/FALSE
66. English application/preview shell complete: TRUE/FALSE

## Comida Local

67. Distinct product identity preserved: TRUE/FALSE
68. Current $129 pricing everywhere: TRUE/FALSE
69. Complete seller-type registry: TRUE/FALSE
70. Seller-type conditional sections correct: TRUE/FALSE
71. Service modes tailored to Comida Local: TRUE/FALSE
72. Highlights tailored to Comida Local: TRUE/FALSE
73. Group-specific custom inputs correct: TRUE/FALSE
74. Find Me Today complete: TRUE/FALSE
75. Permanent/service/current location separation: TRUE/FALSE
76. Home address privacy preserved: TRUE/FALSE
77. Phone/WhatsApp behavior correct: TRUE/FALSE
78. Email/Correo behavior correct: TRUE/FALSE
79. Additional websites repeatable: TRUE/FALSE
80. English shell/validation/nav complete: TRUE/FALSE
81. Hours/media preserved: TRUE/FALSE
82. Preview/Edit/Checkout locale preserved: TRUE/FALSE
83. Existing filled Comida Local application preserved: TRUE/FALSE

## Release

84. No unrelated files changed: TRUE/FALSE
85. No destructive migration required: TRUE/FALSE
86. Targeted application verifier passes: TRUE/FALSE
87. TypeScript introduces zero new errors: TRUE/FALSE
88. `git diff --check` passes: TRUE/FALSE
89. `npm run build` passes: TRUE/FALSE
90. READY FOR APPLICATION OWNER QA: TRUE/FALSE

If any launch-critical item is FALSE, item 90 must be FALSE.

---

# PART II — FULL-CYCLE TRUE QA MASTER (AFTER APPLICATIONS ARE GREEN)

This part is deliberately broader than the immediate application pass. It certifies the whole commercial lifecycle for Servicios, Restaurantes, Comida Local, and the shared systems they depend on.

## A. QA environment and fixture truth

1. Deployment origin identified.
2. Actual Supabase project ref identified.
3. Deployment ↔ expected project mapping matches.
4. Preview uses Staging Supabase.
5. Preview is not repointed to Production for convenience.
6. Production site uses Production Supabase.
7. QA seller exists in exact Auth project.
8. QA buyer exists where required.
9. QA admin/owner exists where required.
10. Credentials never printed.
11. Credentials never logged.
12. Passwords not reset merely to bypass environment mismatch.
13. Production smoke account not used against Staging.
14. Staging account not assumed to exist in Production.
15. Application/listing ID exists in exact target DB.
16. Record belongs to intended owner.
17. Production ID not used against Staging.
18. Staging ID not used against Production.
19. Existing real QA application reused when available.
20. Owner not forced to refill a completed application for QA.
21. New fixture, if necessary, created through real UI.
22. Direct DB insertion not used to fake a completed application.
23. Environment/account mismatch classified as QA environment failure.
24. Missing Production row after Staging test is not called a persistence failure.
25. QA preflight identifies environment.
26. QA preflight identifies Supabase project.
27. QA preflight identifies QA user existence.
28. QA preflight identifies listing/application existence.
29. SAFE TO QA becomes FALSE on mismatch.
30. Preflight does not expose secrets.
31. Staging Servicios schema present.
32. Staging Restaurantes schema present.
33. Staging Comida Local schema present.
34. Staging Revenue OS schema present.
35. Staging Community Trust schema present.
36. Staging parity work did not copy Production customer data.
37. Production not modified just to make Preview work.

## B. Draft / identity / leave guard

38. Servicios unsaved-exit protection works.
39. Restaurantes unsaved-exit protection works.
40. Comida Local unsaved-exit protection works.
41. Warning appears for real unsaved changes.
42. Warning absent after successful save with no dirty state.
43. Save Draft works.
44. Hard refresh preserves draft.
45. Leaving and returning preserves draft where intended.
46. Existing draft hydrates into correct application.
47. Existing values not silently dropped.
48. Existing photos preserved.
49. Existing videos preserved.
50. Existing flyer/coupon assets preserved.
51. Preview uses same canonical identity.
52. Preview → Edit uses same canonical identity.
53. Preview → Edit preserves every field.
54. Preview → Edit preserves every photo.
55. Preview → Edit preserves video URLs.
56. Edit/save does not create duplicate listing row.
57. Publish does not create duplicate row when same-row behavior required.
58. User Dashboard edit opens same canonical listing.
59. Admin sees same canonical listing.

## C. Phone / SMS / WhatsApp

60. Shared primary phone behavior used where required.
61. User can type digits normally.
62. Formatting does not fight typing.
63. Backspace works normally.
64. Cursor editing works.
65. Selection/replacement works.
66. Paste works.
67. Saved phone survives refresh.
68. Saved phone survives Preview.
69. Saved phone survives Preview → Edit.
70. Published phone matches saved value.
71. Call CTA uses correct phone.
72. SMS CTA uses correct phone.
73. Missing phone hides Call.
74. Missing phone hides SMS.
75. WhatsApp remains international-safe.
76. WhatsApp not forced through US-only formatter.
77. International WhatsApp can be entered.
78. WhatsApp persists.
79. Public WhatsApp opens correct destination.
80. Missing WhatsApp hides CTA.

## D. Languages keyboard proof

81. LanguagesInput works in Servicios.
82. LanguagesInput works in Restaurantes.
83. LanguagesInput works in Comida Local.
84. Multiple fixed languages can be selected.
85. Existing languages hydrate.
86. Other can be selected.
87. Custom field appears.
88. Custom field accepts letters.
89. SPACEBAR works.
90. Multi-word language can be entered.
91. Backspace works.
92. Cursor movement works.
93. Paste works.
94. Add works.
95. Added value becomes visible chip.
96. Custom language removable.
97. Removing one does not remove another.
98. Blank value blocked.
99. Whitespace-only blocked.
100. Duplicate handled cleanly.
101. Custom language survives Save Draft.
102. Survives hard refresh.
103. Survives Preview.
104. Survives Preview → Edit.
105. Survives publish.
106. Renders publicly.
107. No unwanted max-3 restriction.
108. English labels English.
109. Spanish labels Spanish.

## E. Hours / Open Now

110. Servicios hours editor works.
111. Restaurant hours editor works.
112. Comida hours editor/adaptation works.
113. All 7 days editable.
114. Closed toggle works per day.
115. Open time input works.
116. Close time input works.
117. Keyboard entry works.
118. Hours survive Save Draft.
119. Survive hard refresh.
120. Survive Preview.
121. Survive Preview → Edit.
122. Survive publish.
123. Legacy schedule hydrates.
124. Open Now truthful when open.
125. Closed Now truthful when closed.
126. Closed days do not show fake hours.
127. Missing hours hide hours section.
128. Special hours render only with real data.
129. Mobile/event sellers are not treated as permanent-location restaurants.

## F. Media / gallery / video / flyer

130. Uploaded media ends as durable HTTPS URL.
131. `data:` URLs cannot publish.
132. `blob:` URLs cannot publish.
133. Stripe does not carry raw image blobs/base64.
134. Photo upload completes.
135. Photo survives draft save.
136. Survives hard refresh.
137. Survives Preview.
138. Survives Preview → Edit.
139. Survives publish.
140. Gallery opens clicked photo.
141. Gallery navigation works.
142. Gallery closes.
143. Gallery usable on mobile.
144. Empty gallery hidden.
145. Videos render only when URLs exist.
146. No Videos tab with zero videos.
147. Video URLs persist across lifecycle.
148. Flyer/coupon viewer opens real asset.
149. Viewer does not expose raw URL.
150. Viewer usable desktop.
151. Viewer usable mobile.
152. Missing flyer/coupon hides section.
153. Comida does not invent unsupported flyer/coupon product behavior.

## G. Global hide-if-empty doctrine

154. Real value → render.
155. Missing value → hide.
156. No blank optional card.
157. No empty heading.
158. No dead icon.
159. No slash-circle public placeholder.
160. No empty href.
161. No fake fallback URL.
162. No fake website CTA.
163. No fake Correo CTA.
164. No fake social icon.
165. No fake Google CTA.
166. No fake Yelp CTA.
167. No fake directions CTA.
168. No fake coupon.
169. No fake payment logo.
170. No fake testimonial.
171. No fake trust count.
172. Missing content stays hidden after refresh.
173. Adding real content makes section render.

## H. Servicios application/public/payment acceptance

174. Product checkpoint clearly represents Servicios.
175. Price $399/month.
176. No stale coupon +$99 charge.
177. Coupons/offers included.
178. Spanish copy correct.
179. English system UI genuinely English.
180. Service/category selection works.
181. Otro servicio works.
182. Otro service accepts typing.
183. Spacebar works.
184. Backspace works.
185. Custom Otro persists after save.
186. Persists refresh.
187. Appears Preview.
188. Survives Preview → Edit.
189. Survives publish.
190. Description supports multi-word typing.
191. `Por qué elegirte` helper appropriate/no fake AI.
192. Languages pass section D.
193. Hours pass section E.
194. Phone passes section C.
195. Structured service areas can be added.
196. Multiple service areas persist.
197. Service areas survive refresh.
198. Survive Preview/Edit.
199. Website accepts valid URL.
200. Missing website hides public CTA.
201. Social URLs persist.
202. Missing socials hide icons.
203. Payment methods selectable.
204. Payment selections persist.
205. Unselected methods hidden.
206. Gallery passes section F.
207. Flyer/coupon passes section F.
208. Review accepts valid review.
209. Invalid review gives meaningful validation.
210. Review API avoids opaque unexplained 400.
211. Review success real.
212. Final review shows correct data.
213. Preview mandatory before first payment.
214. No direct publish bypass.
215. New unpaid listing goes Preview → Payment.
216. New unpaid checkout $399 base.
217. Successful payment activates same intended listing.
218. Volver a editar returns to final/in-progress review.
219. Does not dump user at initial gateway.
220. Preserves fields.
221. Preserves media.
222. Active paid edit does not recharge $399.
223. Expired/unentitled requires checkout.
224. Legitimate add-ons remain billable.
225. Public business name correct.
226. Public logo/content correct.
227. Call CTA works.
228. SMS CTA works.
229. WhatsApp works when configured.
230. Correo works with real email.
231. Website works.
232. Directions only with usable public location.
233. Service areas correct.
234. Languages correct.
235. Hours/Open Now correct.
236. Gallery works.
237. Flyer/coupon viewer works.
238. Hide-if-empty passes.
239. Dashboard listing correct.
240. Edit opens same row.
241. Admin finds correct listing.
242. Admin lifecycle status correct.

## I. Restaurantes application/public/payment acceptance

243. Restaurant price $399/month.
244. No stale +$99 coupon charge.
245. Coupons/offers included.
246. Spanish app UI correct.
247. English app UI genuinely English.
248. Cuisine/style supports expanded capacity.
249. Selection layout usable mobile.
250. Custom cuisine/style Other works.
251. Typing works custom cuisine/style.
252. Spacebar works custom cuisine/style.
253. Custom cuisine/style persists.
254. Languages pass section D.
255. Hours pass section E.
256. Phone/WhatsApp pass section C.
257. Catering fields appear where relevant.
258. Catering data enterable.
259. Catering text accepts multi-word.
260. Spacebar works catering text.
261. Catering persists.
262. Additional websites repeatable title+URL.
263. Title accepts typing.
264. Spacebar works title.
265. URL accepts valid URL.
266. Multiple websites coexist.
267. Removing one preserves others.
268. Websites survive refresh.
269. Survive Preview/Edit/Publish.
270. Socials truthful.
271. Indeed not exposed as customer social.
272. Google review URL persists.
273. Yelp review URL persists.
274. Missing Google/Yelp hide controls.
275. Payment options persist.
276. Logo not destructively cropped.
277. Wide logo acceptable.
278. Tall logo acceptable.
279. Square logo acceptable.
280. Header food-appropriate/not overpowering.
281. Final review shows $399.
282. Preview mandatory.
283. No direct publish bypass.
284. New unpaid Restaurant requires Stripe.
285. Active paid edit does not recharge $399.
286. Expired/unentitled requires checkout.
287. Volver a editar preserves draft.
288. Preview → Edit preserves media.
289. Dedicated Catering section appears when catering exists.
290. Catering hidden when absent.
291. Catering not buried only inside generic `Ver más`.
292. Pedir cotización opens configured real destination.
293. Not hijacked to WhatsApp when quote URL exists.
294. Formulario de cotización opens entered URL.
295. Contactar para evento opens intended rich action.
296. Cotizar catering opens real destination only.
297. Correo rich contact works.
298. Missing email hides Correo.
299. Website CTA works.
300. Call works.
301. SMS works.
302. WhatsApp works.
303. Google opens correct URL.
304. Yelp opens correct URL.
305. Missing Google/Yelp hide fully.
306. Additional websites render correct title/destination.
307. Missing additional links create no blank rows.
308. Cuisine/styles display correctly.
309. Ambience/options only if real.
310. Payment methods only if selected.
311. Hours/Open Now correct.
312. Languages correct.
313. Gallery correct.
314. Flyer/coupon correct.
315. Community Trust uses lion/real counts.
316. Google/Yelp separate from Leonix Trust.
317. Optional-content doctrine passes.
318. Dashboard listing correct.
319. Edit opens same listing.
320. Admin listing/status correct.

## J. Comida Local product identity / conditional flows

321. Visibly distinct from Restaurant.
322. No Publicar restaurante leakage.
323. Current price $129.
324. No current $99.
325. No current $149.
326. No current $199.
327. No current $399.
328. Historical pricing remains historical only.
329. Food truck type works.
330. Cart/puesto works.
331. Home kitchen works.
332. Pop-up works.
333. Feria/event vendor works.
334. Catering local works.
335. Meal prep works.
336. Bakery/dessert works.
337. Private chef works.
338. Delivery-only kitchen works.
339. Farmers/market vendor works.
340. Other seller type works.
341. Custom seller type accepts typing.
342. Spacebar works.
343. Backspace works.
344. Persists refresh.
345. Appears Preview/Edit/Public.
346. English seller labels English.
347. Spanish labels Spanish.
348. Stored keys language-neutral.
349. Mobile seller sees current/live location controls.
350. Sees service area.
351. Sees schedule/hours.
352. Sees real order/contact controls.
353. Home kitchen exact address private by default.
354. Can show service city/area.
355. Pickup/delivery works.
356. Pop-up/event seller can enter event/location.
357. Event schedule/date works where supported.
358. Catering sees quote/contact.
359. Catering service area/radius works where implemented.
360. Catering availability accepts multi-word.
361. Spacebar works catering availability.
362. Meal prep sees recurring pickup/delivery/order controls.
363. Meal-prep order URL persists.
364. Irrelevant Restaurant clutter not shown.
365. Switching seller type does not corrupt unrelated saved data.
366. Conditional data survives refresh.
367. Survives Preview/Edit/Publish.

## K. Comida service modes / highlights / Find Me Today

368. Pickup works.
369. Delivery works.
370. Preorder works.
371. Scheduled pickup works.
372. Custom order works.
373. Catering works.
374. Events works.
375. Mobile works.
376. Market pickup works.
377. Meal prep works.
378. Limited daily quantity works.
379. Other works.
380. Custom Other service text accepts typing.
381. Spacebar works.
382. Custom mode persists.
383. English labels correct.
384. Spanish labels correct.
385. Stored keys language-neutral.
386. Multiple modes coexist.
387. Removing one preserves unrelated modes.
388. Comida-specific highlights exist.
389. Hecho en casa works.
390. Receta familiar works.
391. Ingredientes frescos works.
392. Dietary highlights do not imply fake certification.
393. Other highlight works.
394. Custom highlight accepts typing.
395. Spacebar works.
396. Persists.
397. English highlight labels correct.
398. Spanish labels correct.
399. Stored keys unchanged.
400. Encuéntrame Hoy exists.
401. English label correct.
402. Spanish label correct.
403. Today location separate from permanent address.
404. Separate from service area.
405. Changing today location does not overwrite permanent address.
406. Does not overwrite service area.
407. Current-location URL persists.
408. Status text accepts multi-word.
409. Spacebar works.
410. Status survives refresh.
411. Survives Preview/Edit/Publish.
412. CTA only with real destination.
413. Opens correct destination.
414. Missing destination hides CTA.
415. Home-kitchen street private by default.
416. Street not public unless intentionally allowed.
417. City/service area can render without private street.
418. Directions hidden for private address.
419. Directions hidden without usable destination.

## L. Comida email / links / hours / media

420. Email field exists.
421. Accepts typing.
422. Accepts @ and punctuation.
423. Persists Save.
424. Survives refresh.
425. Survives Preview.
426. Survives Preview → Edit.
427. Survives publish.
428. Correo only with real email.
429. Correo uses rich action sheet.
430. Email analytics event works.
431. Website persists/opens.
432. Facebook persists/opens.
433. Instagram persists/opens.
434. TikTok persists/opens.
435. YouTube persists/opens.
436. Missing socials hide.
437. Additional website title accepts typing.
438. Spacebar works title.
439. URL accepts valid URL.
440. Multiple links coexist.
441. Removing one preserves others.
442. Links survive refresh/Preview/Edit/Publish.
443. Public link has real title/destination.
444. Menu/order opens real destination.
445. WhatsApp order uses real destination.
446. Languages pass section D.
447. Hours pass section E.
448. Existing availability note compatible.
449. Weekly hours do not corrupt legacy schedule.
450. Gallery works.
451. No empty video tab.
452. No empty gallery.
453. Public business type matches saved value.
454. Public service modes match saved values.
455. Public highlights match saved values.
456. English taxonomy English.
457. Spanish taxonomy Spanish.
458. Address privacy correct publicly.
459. Find Me Today correct publicly.
460. Hide-if-empty doctrine passes.
461. Dashboard opens correct listing.
462. Edit opens same listing.
463. Admin finds correct listing.

## M. Community Trust

464. Servicios supported.
465. Restaurant supported.
466. Comida Local supported.
467. Staging migration applied.
468. Production migration status explicitly known.
469. Production not falsely claimed migrated.
470. Servicios real UI vote works.
471. Restaurant real UI vote works.
472. Comida real UI vote works.
473. Count increments correctly.
474. Toggle/repeat vote correct.
475. Counts are real DB counts.
476. No fake seeded counts.
477. Lion trust treatment preserved.
478. Not replaced by generic heart.
479. Google counts separate.
480. Yelp counts separate.
481. Servicios regression absent.
482. Restaurant regression absent.

## N. Revenue OS active entitlement

483. Entitlement decision server-authoritative.
484. Client cannot bypass payment alone.
485. Canonical entitlement source determines active status.
486. New Servicios requires payment.
487. Active Servicios edit no base recharge.
488. Expired/unentitled Servicios requires payment.
489. New Restaurant requires payment.
490. Active Restaurant edit no base recharge.
491. Expired/unentitled Restaurant requires payment.
492. New Comida requires $129.
493. Active Comida edit no recharge.
494. Expired/unentitled Comida requires payment.
495. Active Autos Dealer edit no recharge $399.
496. New/unentitled Autos Dealer requires payment.
497. Active Bienes edit no recharge.
498. New/unentitled Bienes requires payment.
499. payment_failed/pending grace does not cause duplicate base charge when entitlement active.
500. Legitimate add-ons remain billable.
501. Add-on checkout does not recharge base.
502. Edit response payment state truthful.
503. Successful new checkout activates correct listing.
504. Failed checkout does not publish.
505. Cancelled checkout leaves recoverable state.

## O. Newsletter V2

506. Opt-in visible where intended.
507. Email being subscribed visible.
508. Email editable where expected.
509. Email control typing normal.
510. Keyboard behavior normal.
511. Invalid email cannot fake success.
512. Null session email cannot silently skip while showing success.
513. Checked opt-in makes real capture request.
514. Unchecked opt-in sends no subscribe request.
515. Previously unsubscribed not silently resubscribed.
516. SUCCESS means successful write.
517. ALREADY_SUBSCRIBED truthful.
518. PENDING_VERIFICATION truthful.
519. FAILED visible.
520. No fire-and-forget fake success.
521. Retry idempotent.
522. Repeat request no duplicate subscription.
523. Servicios metadata correct.
524. Restaurant metadata correct.
525. Comida metadata correct.
526. Generic signup source correct.
527. Verification token/state foundation works.
528. Double-opt-in not marked TRUE unless email delivery+verification works.
529. Missing outbound delivery marked PENDING/PARTIAL.
530. Unsubscribe persists.
531. Checkout does not override unsubscribe without explicit opt-in.
532. Servicios newsletter real QA works.
533. Restaurant newsletter real QA works.
534. Comida newsletter real QA works.

## P. Address foundation

535. Canonical address contract exists.
536. Street separate.
537. Unit separate.
538. City separate.
539. State separate.
540. Postal separate.
541. Country separate.
542. Formatted address separate.
543. Latitude/longitude supported.
544. Verification status explicit.
545. Provider explicit.
546. Provider place ID supported.
547. Manual state supported.
548. unverified != verified.
549. user_confirmed distinct where supported.
550. provider_suggested distinct where supported.
551. manual not called provider-verified.
552. No fake provider.
553. CityAutocomplete not represented as full verification.
554. Manual entry allowed.
555. City/state/ZIP normalization works.
556. Unit not dropped.
557. Canonical stored address and public visibility separate.
558. Private address can remain hidden.
559. Public exact-address flag honored.
560. Directions permission honored.
561. Directions builder rejects unusable destination.
562. Protects private address.
563. Comida home-kitchen privacy regression passes.
564. No category silently migrated to new address foundation.
565. No Verified Address claim without real provider.

## Q. Translation / ES-EN

566. `/api/translate-ad` works.
567. Existing translation records preserved.
568. User-entered content not silently changed.
569. Servicios English UI actually English.
570. Restaurant English UI actually English.
571. Comida English UI actually English.
572. Spanish UI remains Spanish.
573. Comida seller types bilingual.
574. Comida service modes bilingual.
575. Comida highlights bilingual.
576. Stored enum keys do not change by locale.
577. Locale switch does not erase draft.
578. Locale switch does not duplicate values.

## R. Analytics

579. Listing view event works.
580. Listing open event works where defined.
581. Call event works.
582. SMS event works.
583. WhatsApp event works.
584. Email event works.
585. Website event works.
586. Directions event works.
587. Share event works where supported.
588. Quote/catering event works where supported.
589. Analytics use canonical listing ID.
590. Edit does not reset analytics identity.
591. Missing CTA does not create phantom event.

## S. Results / Public

592. Published Servicios appears where intended.
593. Published Restaurant appears where intended.
594. Published Comida appears where intended.
595. Result card opens correct canonical detail.
596. Public detail loads for public listing.
597. Draft/unpaid not accidentally public.
598. Removed/expired follows visibility rules.
599. Business name correct.
600. Logo/photo correct.
601. Republish removes stale prior-draft content.
602. Language route points to same listing identity.

## T. Dashboard / Admin / lifecycle

603. Seller Dashboard shows Servicios.
604. Shows Restaurant.
605. Shows Comida Local.
606. Dashboard lifecycle status matches DB.
607. Edit opens same canonical row.
608. Save Changes active paid does not recharge.
609. Republish preserves same row.
610. Renew only when genuinely needed.
611. Admin finds each listing.
612. Admin owner correct.
613. Admin category correct.
614. Admin status correct.
615. Admin action does not duplicate listing.
616. Deactivation/removal follows lifecycle.
617. Published record remains editable after logout/login or refresh.

## U. True Servicios E2E

618. Real environment-matched seller login succeeds.
619. Existing real Servicios listing/application opens.
620. Normal text typing works.
621. Spacebar works normal multi-word text.
622. Custom language typing + Spacebar proven.
623. Otro service typing + Spacebar proven.
624. Phone formatting proven.
625. Hours edit proven.
626. Service area edit proven.
627. Optional link/social add/remove proven.
628. Save Draft.
629. Hard refresh.
630. All changes remain.
631. Preview.
632. All data/media correct.
633. Volver a editar.
634. Same ID remains.
635. Active paid Save/Republish avoids base Stripe.
636. Public same-row update works.
637. CTA smoke passes.
638. Community Trust UI vote passes.
639. Dashboard same row.
640. Admin same row.

## V. True Restaurantes E2E

641. Real seller login succeeds.
642. Existing real Restaurant opens.
643. Normal text + Spacebar works.
644. Custom cuisine/style + Spacebar works.
645. Custom language + Spacebar works.
646. Catering text + Spacebar works.
647. Additional website title accepts multiple words.
648. Spacebar works in title.
649. Save Draft.
650. Hard refresh.
651. Values remain.
652. Preview.
653. Cuisine/styles correct.
654. Catering section correct.
655. Additional website correct.
656. Google/Yelp match actual data.
657. Quote destination correct.
658. Correo rich contact works.
659. Volver a editar preserves same draft.
660. Active paid edit avoids base Stripe.
661. Public same-row update works.
662. Community Trust vote works.
663. Dashboard/Admin remain same row.

## W. True Comida Local E2E

664. Real environment-matched seller login succeeds.
665. Real Comida QA application exists/created through UI.
666. Seller type works.
667. Custom seller type multi-word + Spacebar works.
668. Conditional seller sections work.
669. Service modes work.
670. Other service-mode multi-word + Spacebar works.
671. Highlights work.
672. Other highlight multi-word + Spacebar works.
673. Custom language multi-word + Spacebar works.
674. Hours work.
675. Email persists.
676. Additional website title multi-word + Spacebar works.
677. Encuéntrame Hoy status multi-word + Spacebar works.
678. Permanent address separate from today location.
679. Home address remains private.
680. Save Draft.
681. Hard refresh.
682. Every entered value remains.
683. Preview.
684. Every intended value/media appears.
685. Missing optional content hidden.
686. English taxonomy correct.
687. Spanish taxonomy correct.
688. Preview → Edit preserves same draft.
689. New unpaid requires $129 checkout.
690. Active paid edit does not recharge $129.
691. Successful payment/publish same row.
692. Public detail works.
693. Find Me Today works only with real destination.
694. Correo works only with real email.
695. Community Trust UI vote works.
696. Dashboard/Admin remain same row.

## X. Negative / failure paths

697. Invalid URL does not create working-looking dead CTA.
698. Invalid email does not fake Correo success.
699. Empty Other cannot create blank chip.
700. Whitespace-only Other cannot create blank chip.
701. Duplicate custom value handled cleanly.
702. Missing phone hides Call/SMS.
703. Missing WhatsApp hides WhatsApp.
704. Missing website hides Website.
705. Missing email hides Correo.
706. Missing social hides icon.
707. Missing Google hides Google.
708. Missing Yelp hides Yelp.
709. Missing media hides gallery/video shell.
710. Missing catering hides catering section.
711. Missing today-location destination hides Find Me Today.
712. Private address hides exact location/directions.
713. Failed newsletter write shows FAILED.
714. New unpaid listing cannot bypass payment.
715. Active entitlement edit cannot reopen base checkout accidentally.
716. Failed payment does not publish.
717. Refresh does not duplicate listing.
718. Preview → Edit does not duplicate listing.
719. Double-click/retry does not duplicate subscription/listing.
720. Unauthorized user cannot edit another owner’s listing.

## Y. Final acceptance

721. Servicios TRUE QA completed with real environment/account/listing.
722. Restaurant TRUE QA completed with real environment/account/listing.
723. Comida TRUE QA completed with real environment/account/listing.
724. Community Trust UI QA completed Servicios.
725. Completed Restaurant.
726. Completed Comida.
727. Active entitlement manually verified Servicios.
728. Verified Restaurant.
729. Verified Comida.
730. Verified Autos Dealer.
731. Verified Bienes.
732. Newsletter manually verified Servicios.
733. Verified Restaurant.
734. Verified Comida.
735. Unsubscribe/resubscribe manually verified.
736. Comida address privacy manually verified.
737. No fake Verified Address claim.
738. Every critical custom/free-text field manually tested typing.
739. Every critical custom/free-text field manually tested Spacebar.
740. Every critical custom/free-text field manually tested backspace.
741. Every applicable field tested through Save Draft.
742. Every applicable field tested through hard refresh.
743. Every applicable field tested through Preview.
744. Every applicable field tested through Preview → Edit.
745. Every applicable field verified after Publish/Public rendering.
746. All current-sale prices correct.
747. All active-edit no-recharge rules correct.
748. No dead public controls.
749. No blank optional cards.
750. No fake placeholder data.
751. No cross-environment QA contamination.
752. No credentials/secrets exposed.
753. No Production customer data copied to Staging.
754. No unresolved launch-blocking FALSE remains.
755. FINAL BUSINESS CATEGORY + GLOBAL QA ACCEPTANCE = TRUE only if every required launch-critical item is TRUE or explicitly N/A with evidence.

---

# PART III — REQUIRED CLAUDE EXECUTION DISCIPLINE

## 1. Before coding

- Read this file completely.
- Return a compact table of Gate A0-A7 with intended file scopes.
- Do not rewrite or summarize away any requirement.
- Record current `origin/main`, existing final-audit branch/head, and chosen clean worktree/branch.
- Confirm no other worktree is being modified.
- Reuse existing real filled application data contracts; no destructive schema/key rename.

## 2. During coding

- Work gate by gate.
- After each gate run targeted tests only.
- Do not run repeated full builds.
- Do not touch unrelated categories.
- Do not “fix” a requirement by hiding/removing a feature unless the contract explicitly allows removal.
- Do not call a requirement TRUE from source inspection when it requires browser behavior.
- Preserve existing canonical IDs and stored keys.
- Prefer thin adapters around shared primitives rather than competing implementations.

## 3. Final verification

Run:
- application-only verifier
- existing hydration compatibility verifier
- bilingual verifier
- Revenue active-entitlement verifier
- Newsletter verifier where application checkout is touched
- Address foundation verifier where address code is touched
- TypeScript (classify new vs known baseline errors)
- `git diff --check`
- one final `npm run build`

## 4. Required final report

Return:

- WORKTREE
- BRANCH
- BASE HEAD
- FINAL HEAD
- FILES CHANGED
- GATES A0-A7 TRUE/FALSE
- APPLICATION LEDGER totals: TRUE / FALSE / N/A / NOT TESTED
- Every remaining FALSE with exact reason
- Every browser-only item still requiring owner QA
- TypeScript new errors
- TypeScript baseline errors
- Build PASS/FAIL
- Diff check PASS/FAIL
- Existing ads require refill TRUE/FALSE (expected FALSE)
- READY FOR APPLICATION OWNER QA TRUE/FALSE
- READY FOR PR TRUE/FALSE
- PUSHED YES/NO

STOP.
