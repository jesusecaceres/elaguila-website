# LEONIX QUICK — OWNER QA PACKET (PREPARED, DEFERRED)

Prepared for the owner to run at the final Leonix release gate. **Nothing in this packet has
been executed.** No listing was published, no checkout completed, no payment taken, and no
database row created or modified during technical certification.

- Final application code SHA: `80808e2fd3dd57e71fd921b0f50e85886f4ee6f2`
- Branch: `cursor/remaining-families-closeout-cb29`
- Owner QA: **DEFERRED UNTIL FINAL RELEASE PREVIEW**

## BEFORE YOU START

Owner QA is deferred until the single final Leonix release and owner-QA gate. Per owner PM
policy, additional Vercel Previews are not deployed in the interim because deployments
incur cost and the broader launch scope is not yet complete. This is a scheduling decision,
not a technical gap: the Quick application code is already technically certified at the SHA
above.

When the final release Preview of `80808e2fd3dd57e71fd921b0f50e85886f4ee6f2` is produced at
that gate, substitute its origin for `{PREVIEW}` below. Every path is exact and final; only
the origin is pending.

Use a real account you are comfortable transacting with. Paid steps take real money on the
configured Stripe mode. Where a family is free or team-moderated, that is called out.

## HOW TO READ EACH FAMILY

Each family lists what to click, what you should see, and the one thing most worth
disbelieving. If the "watch for" line happens, stop and report it.

---

## GROUP A — QUICK CLASSIFIEDS (shortened intake into existing pipelines)

Entry point for all of Group A: `{PREVIEW}/publicar/rapido`

### 1. En Venta — free

1. Open `{PREVIEW}/publicar/rapido` and pick **En Venta / Varios**.
2. Answer the 8 questions with something you would really sell. Add at least 2 photos.
3. Continue to preview, then publish.
4. Manage at `{PREVIEW}/dashboard/mis-anuncios?cat=en-venta`.

You should see: your own photos on the preview and on the live ad, first photo as cover.
No charge at any point.

Watch for: a stock or placeholder image appearing instead of your photo.

### 2. Rentas — paid, `rentas_30d`

1. `{PREVIEW}/publicar/rapido` → **Rentas**. Answer 9 questions, add up to 8 photos.
2. Preview, pay, publish.
3. Manage at `{PREVIEW}/dashboard/mis-anuncios?cat=rentas`.

You should see: the price on the card, the checkout total and the charge all agree. A
30-day term, renewable from My Ads without losing the ad id or photos.

Watch for: any price on screen that differs from what Stripe actually charges.

### 3. Empleos — paid, `empleos_job_post_paid`

1. `{PREVIEW}/publicar/rapido` → **Empleos**. Answer 11 questions.
2. **Attach a photo** — this is the step most worth testing.
3. Preview, pay, publish. Manage at `{PREVIEW}/dashboard/mis-anuncios?cat=empleos`.

You should see: your photo on the published job page.

Watch for: the generic fallback job image. Photos used to be silently dropped on this path;
that was repaired, and if a photo cannot be uploaded you should now get a clear bilingual
error instead of a silently published stock image.

### 4. Autos Privado — paid, `autos_privado_30d`

1. `{PREVIEW}/publicar/rapido` → **Autos (particular)**. Answer 10 questions, add real
   vehicle photos. Preview, pay, publish.
2. Manage at `{PREVIEW}/dashboard/mis-anuncios?cat=autos`.

Watch for: being offered dealer features. This is the private-seller lane only.

### 5. Bienes Raíces FSBO — paid, `br_fsbo_45d`

1. `{PREVIEW}/publicar/rapido` → **Bienes Raíces (dueño directo)**. Answer 10 questions,
   add real property photos. Preview, pay, publish.
2. Manage at `{PREVIEW}/dashboard/mis-anuncios?cat=bienes-raices`.

You should see: a 45-day term, not 30.

### 6–9. Clases, Comunidad, Busco, Mascotas — free

Each card on `{PREVIEW}/publicar/rapido` sends you into the **existing** short community
form rather than a new Quick form, because those forms are already short.

1. Open each of the four cards in turn and complete a real submission.
2. Confirm each lands on its existing preview and publishes free.

Watch for: a second, different-looking version of a form you already recognize. You should
land in the form you already know.

---

## GROUP B — QUICK BUSINESS CORE

Entry point: `{PREVIEW}/publicar/negocio-rapido`

### 10. Servicios — monthly, `servicios_base_monthly`

1. `{PREVIEW}/publicar/negocio-rapido` → **Servicios**. Answer 12 questions, add a real
   business image. Preview, pay, publish.
2. Confirm it appears in your existing Business Hub.

Watch for: a new or duplicate Business Hub. It must be the one you already use.

### 11. Restaurantes — monthly, `restaurantes_base_monthly`

1. `{PREVIEW}/publicar/negocio-rapido` → **Restaurantes**. Answer 11 questions, add a real
   restaurant image. Preview, pay, publish.

You should see: identity captured now, menus added later in the existing product. Quick
deliberately does not build menus.

### 12. Autos Dealer — monthly, `autos_dealer_monthly`

1. `{PREVIEW}/publicar/negocio-rapido` → **Autos (concesionario)**. Answer 16 questions:
   your dealership **and your first real vehicle**, including a real photo of that vehicle.
2. Preview, pay, publish. Open your existing dealer inventory.

You should see: that first vehicle as a real row in your normal vehicle inventory, with a
working public vehicle page.

Watch for: a placeholder or example vehicle you did not enter, or your dealer logo standing
in for the vehicle photo. Neither should be possible.

### 13. Bienes Raíces Agente/Negocio — monthly, `br_agent_monthly`

1. `{PREVIEW}/publicar/negocio-rapido` → **Bienes Raíces (agente / negocio)**. Answer 19
   questions: your professional identity **and your first real property**, with a real
   property photo.
2. Preview, pay, publish. Open your existing property management.

Watch for: your headshot or company logo being accepted as the property photo.

---

## GROUP C — COMIDA LOCAL

### 14. Comida Local — monthly, `comida_local_base_monthly`

1. Open `{PREVIEW}/publicar/comida-local/rapido`.
2. Answer 7 questions: your business plus **one real dish you actually sell**. Attach a real
   photo — the form requires one.
3. Continue into the existing Comida Local preview, pay, publish.
4. Manage at `{PREVIEW}/dashboard/mis-anuncios?cat=comida-local`.

You should see: the ordinary Comida Local preview you already know, not a new Quick-branded
preview. Hours, socials and extra photos are added later from the dashboard, by design.

Watch for: being allowed to continue with no photo, or a photo that silently disappears.
Upload failure must stop you with a clear message.

---

## GROUP D — REMAINING FAMILIES (no Quick form, by design)

For these five, the correct behavior is that Quick sends you to the destination you already
have. There is no shortened form to test; the test is that the handoff is honest.

### 15. Ofertas Locales — `{PREVIEW}/publicar/ofertas-locales`

Two lanes in one application:

- **Volante interactivo** — $399 for 30 days, includes AI review, auto-publishes on payment.
- **Cupones y promociones** — **$199 for 30 days**, manual entry, no AI, then admin review.

Please pay particular attention here. The coupon lane previously displayed as **free** in
the application while the server package was $199. That was a bug and it was corrected to
$199 everywhere the customer sees it.

1. Start a **coupon**. Confirm the lane card, the final review total, and the checkout
   consent sentence all say **$199**.
2. Start a **flyer** separately. Confirm it still says **$399** everywhere.
3. Manage at `{PREVIEW}/dashboard/ofertas-locales`.

Watch for: any screen still showing the coupon as free or $0, or a coupon checkout whose
consent sentence mentions $399. Both were the specific defects repaired.

### 16. Negocios Locales — `{PREVIEW}/negocios-locales`

A discovery directory, not a product. Confirm there is nothing to submit and that each
sector links onward to its own existing application.

### 17. Viajes — `{PREVIEW}/publicar/viajes`

The existing application. Submissions go to Leonix team review; there is no online payment
today, and Quick deliberately shows no price. Confirm your submission enters review and
appears at `{PREVIEW}/dashboard/viajes`.

Note: the final Viajes business monthly price is still an open owner decision. Nothing in
Quick promises a Viajes price, so this does not block anything.

### 18. Iglesias — `{PREVIEW}/iglesias/registrar`

Free, public, team-moderated. Confirm you can submit without an account and that the Leonix
team review step is clear. There is no owner dashboard for this family, by design.

### 19. Recursos Comunitarios — `{PREVIEW}/recursos-comunitarios`

Editorial content maintained by the Leonix team. Confirm there is no submission form. The
correct staff action is to open the page and share the link.

---

## GROUP E — STAFF

### Staff Quick launchpad — `{PREVIEW}/admin/businesses`

Sign in as staff. On the Command Center you should see the Quick launchpad above the
existing Concierge tools, in this order:

1. **Tier 1 Quick Classifieds**
2. **Quick Business** — Servicios, Restaurantes, Autos Dealer, Bienes
3. **Más opciones** — Comida Local, Ofertas Locales, Negocios Locales, Viajes, Iglesias,
   Recursos

For each card, confirm the primary action opens the destination its label promises.

Watch for: the deep Concierge tooling below having changed. It should be exactly as before;
the launchpad is purely additive.

---

## WHAT TO REPORT BACK

For each family, one line: works / does not work, plus a screenshot if it does not. The
highest-value findings, in order:

1. A price shown on screen that differs from what Stripe charges.
2. A photo you uploaded that does not appear on the published page.
3. A placeholder or example item you did not enter appearing in your inventory.
4. Any second dashboard, second Business Hub, or unfamiliar duplicate of a form you know.
5. The Ofertas coupon lane showing anything other than $199.
