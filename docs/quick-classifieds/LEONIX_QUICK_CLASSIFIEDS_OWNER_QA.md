# LEONIX QUICK CLASSIFIEDS — OWNER QA (phone-friendly)

STATUS LINE
- AUTOMATED TECHNICAL PASS: source contracts, focused verifiers, full TypeScript, production build — see the Integration Handoff.
- OWNER/HUMAN QA: **PENDING** (nothing below has been done by a person yet).

PREVIEW
- The Vercel project currently skips every non-production deployment (Ignored Build Step = `if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`).
  Until the PM/owner relaxes that setting for this branch, there is no Preview URL. Once a READY Preview exists, use its
  URL as `<PREVIEW>` below (branch alias: `leonix-media-git-claude-quick-cla-e4a3c0-jesus-caceres-projects.vercel.app`).
- Previews are behind Vercel login (SSO). Sign in with the Vercel account when asked, then continue.
- Everything below is on a Preview, never Production. Paid flows: you may stop at the Stripe page unless you choose to test a real charge.

Use realistic multi-word values exactly as written (they test spaces, apostrophes and accents).

---

## 1. EN VENTA (free) — do this first

START: `<PREVIEW>/publicar/rapido/en-venta?lang=es`
LOGIN: if asked, sign in with your Leonix customer email (magic link). You must land back on the same Quick page.

TYPE
- Departamento: Muebles → Tipo: any → Condición: "Bueno"
- Título: `Sofá de 3 plazas color café`
- Precio: `150`
- Descripción (two lines): `Sofá cómodo, casi nuevo.` then `Llamar después de las 5 pm`
- Ciudad: `East San Jose` (free text is allowed here) · Código postal: leave empty
- Tu nombre: `María López` · Teléfono: `4085550123` · Correo: your email

IMAGE: tap "Agregar fotos" and pick one real photo from the phone (or "Tomar foto").

CLICK: Continuar → Continuar → tick the 3 rule boxes → "Ver mi anuncio".

MUST APPEAR ON PREVIEW: the existing En Venta preview with your photo, "Sofá de 3 plazas color café", $150, East San Jose, María López.
PAYMENT: none (free).
PUBLISH: use the preview's "Publicar" navigation (it returns to the existing En Venta publish bar) and publish.
FINAL PUBLIC AD: your photo (not a placeholder), the title with spaces intact, the description on two lines, phone/email buttons.
EDIT/END: Mis Anuncios → open the ad → Editar works → "Ya se vendió" removes it from public results.

## 2. RENTAS (paid, $24.99 / 30 días)

START: `<PREVIEW>/publicar/rapido/rentas?lang=es`

TYPE
- Tipo de renta: "Cuarto / recámara"
- Título: `Cuarto amueblado en San José`
- Renta mensual: `900` · Depósito: `900` · Disponible desde: pick a date
- Descripción: `2 bedroom apartment, todo incluido. Call after 5 pm`
- Ciudad: `San Jose` · Código postal: `95116` · Cruce o referencia: `King Rd y Story Rd`
- Tu nombre: `Joe's Landscaping` (tests the apostrophe) · WhatsApp: `4085550123`

IMAGE: one real photo.
CLICK: Continuar → Continuar → 3 rule boxes → "Ver mi anuncio".
MUST APPEAR ON PREVIEW: the existing Rentas preview, photo as cover, $900/mes, San Jose, "Joe's Landscaping" with the apostrophe.
PAYMENT: the existing $24.99 checkout must open (same price as before). Stop here unless testing a real charge.
FINAL PUBLIC AD (if paid): `/clasificados/rentas/listing/<id>` shows your photo and text; expiry 30 days.
EDIT/END/RENEW: Mis Anuncios → Rentas → Editar re-opens the existing application; "Ya se rentó" / pausar; "Renovar" opens the existing renewal checkout (same ad, same ID).

## 3. EMPLEOS (paid, $24.99 / 30 días) — THE KEY CHECK

START: `<PREVIEW>/publicar/rapido/empleos?lang=es`

TYPE
- Puesto: `Cocinero de línea` · Empresa: `Taquería La Estrella`
- Tipo de empleo: "Tiempo completo" · Industria: leave the prefilled value
- Pago: "Por hora" → Monto: `20`
- Horario: `Lunes a viernes, 8 am – 4 pm`
- Descripción: `Se busca cocinero con experiencia. María López puede llamar después de las 5 pm`
- Ciudad: `San Jose` · Estado: leave `CA` · País: leave `United States`
- Persona de contacto: `Joe` · Teléfono: `4085550123`

IMAGE: one REAL photo of a kitchen or storefront (not a logo).
CLICK: Continuar → Continuar → "Ver mi anuncio".
MUST APPEAR ON PREVIEW: the existing job preview with YOUR photo as the hero image.
PAYMENT: the existing $24.99 job-post checkout must open. To verify the fix completely, complete one real test payment.
FINAL PUBLIC AD: **YOUR UPLOADED PHOTO MUST APPEAR ON THE PUBLIC JOB AD — NOT THE STOCK KITCHEN PHOTO.** This is the fix being certified.
EDIT/END: Mis Anuncios → Empleos → Editar keeps the photo; "Puesto ocupado" archives it.

## 4. AUTOS (private seller, paid, $24.99 / 30 días)

START: `<PREVIEW>/publicar/rapido/autos?lang=es`

TYPE
- Año: `2016` · Marca: `Toyota` · Modelo: `Camry` · Millas: `98000` · Precio: `11500`
- Descripción: `Título limpio. Call after 5 pm`
- Ciudad: `San Jose` · Código postal: `95122`
- Tu nombre: `María López` · Teléfono: `4085550123`

IMAGE: one real photo of a car.
CLICK: Continuar → Continuar → "Ver mi anuncio".
MUST APPEAR ON PREVIEW: the existing private-auto preview: "2016 Toyota Camry", $11,500, San Jose, your photo in the gallery.
PAYMENT: the existing $24.99 / 30-day checkout must open. Stop unless testing a real charge.
FINAL PUBLIC AD (if paid): the vehicle page shows your photo; expires in 30 days.
END/RENEW: Mis Anuncios → Autos → "Vehículo vendido" removes it; "Renovar" opens the existing renewal (same ad). Editing an active auto ad is not offered (existing rule).

---

## 5. STAFF PWA (Business Concierge)

OPEN: `<PREVIEW>/admin/businesses` (staff login).

CONFIRM WITHOUT SCROLLING FAR
- "⚡ Aplicaciones Rápidas / Quick Applications" is right under the Concierge header.
- Four verbs are obvious: Crear anuncio rápido · Enviar enlace rápido · Administrar anuncio · Perfil de Negocio completo.
- The first row shows En Venta, Rentas, Empleos, Autos.
- "Copiar" puts a real link on the clipboard (paste it in Notes: it starts with the preview host and `/publicar/rapido/…`).
- "Compartir" opens the phone's share sheet (or copies when unsupported).
- Community cards (Busco, Mascotas, Comunidad, Clases) open the existing short forms directly.
- Everything below the launchpad (Hoy, Necesita atención, Businesses…) is unchanged.

## 6. "MI ANUNCIO" DOORWAY

OPEN: `<PREVIEW>/publicar/rapido/mi-anuncio?lang=es` → pick a category → buttons go to Mis Anuncios / Empleos dashboard / contact page. No new screens to learn.

---

RESULT LOG (fill in)
| Flow | Result | Notes |
| --- | --- | --- |
| En Venta | | |
| Rentas | | |
| Empleos (real photo on public ad?) | | |
| Autos | | |
| Staff PWA | | |
| Mi anuncio | | |
