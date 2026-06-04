# MEDIA-DESC-HUB-03 Audit

Gate: **MEDIA-DESC-HUB-03** — Media UX, Public Description, Contact Hub Logic, and Duplicate CTA Cleanup

## Files inspected

- `app/(site)/clasificados/publicar/bienes-raices/privado/**`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/**`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/**`
- `app/(site)/clasificados/publicar/rentas/privado/**`
- `app/(site)/clasificados/publicar/rentas/negocio/**`
- `app/(site)/clasificados/publicar/rentas/shared/**`
- `app/(site)/clasificados/bienes-raices/preview/**`
- `app/(site)/clasificados/lib/LeonixRealEstateSortablePhotoStrip.tsx`
- `app/(site)/clasificados/lib/leonixPublishPublicDescription.ts`

## Files changed

- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.es.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/brAgenteResidencialCopy.en.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewPage.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx`
- `app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/AsesorFinancieroNegocioSection.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm.ts`
- `app/(site)/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx`
- `scripts/media-desc-hub-03-audit.ts`
- `package.json` (audit script only)

Status codes in tables below: | TRUE |, | FALSE |, | N/A |.

## Pipeline matrix

| Pipeline | Stack A Media | Stack B Description | Stack C Contact | Stack D CTA | Preview | Public detail |
| -------- | ------------- | ------------------- | --------------- | ----------- | ------- | ------------- |
| BR Privado | TRUE | TRUE | N/A | N/A | TRUE | TRUE |
| BR Negocio | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Rentas Privado | TRUE | TRUE | N/A | N/A | TRUE | TRUE |
| Rentas Negocio | TRUE | TRUE | N/A | N/A | TRUE | TRUE |

## Sub-pipeline matrix

| Sub-pipeline | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio | Notes |
| ------------ | ---------- | ---------- | -------------- | -------------- | ----- |
| residential / casa / townhouse / condo | TRUE | TRUE | TRUE | TRUE | Shared forms + Agente residencial branch |
| multifamily / investment | N/A | TRUE | N/A | N/A | Agente form category branches unchanged; media/contact stacks shared |
| commercial / office | N/A | TRUE | N/A | TRUE | Agente comercial + Rentas comercial mapping |
| garage / storage | N/A | N/A | TRUE | TRUE | Rentas subtypes via shared publish helpers |
| room / shared-space | N/A | N/A | TRUE | TRUE | Rentas shared `RentasAnuncioFormSection` |
| land / lote / terreno | TRUE | TRUE | TRUE | TRUE | Privado terreno + Agente terreno + Rentas terreno branches |

## Stack A — Media UX

| Requirement | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio |
| ----------- | ---------- | ---------- | -------------- | -------------- |
| Image drag/reorder | TRUE | TRUE | TRUE | TRUE |
| Main image on card | TRUE | TRUE | TRUE | TRUE |
| Video URL/upload clarity | TRUE | TRUE | TRUE | TRUE |
| Tour/brochure/listing URL confirm | N/A | TRUE | N/A | N/A |
| Preview persistence | TRUE | TRUE | TRUE | TRUE |
| Honest local copy | TRUE | TRUE | TRUE | TRUE |

**Agente Step 03 (Fotos y medios):** listado/tour/brochure/video rows use explicit **Usar URL** confirmation and honest “listo para publicar” copy. BR Privado / Rentas already used `LeonixRealEstateSortablePhotoStrip`; Agente Step 03 was the primary gap (arrow reorder + portada dropdown + listado in basic info). Rentas has no separate tour/brochure/listado file rows in publish UI.

## Stack B — Public description

Public **Descripción principal** field strengthened across BR Privado, Rentas shared form, and Agente Step 06 (taller textarea + helper copy). Internal `notasAdicionales` hidden from Agente form and preview output; state retained for old drafts.

| Requirement | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio |
| ----------- | ---------- | ---------- | -------------- | -------------- |
| Internal notes hidden from form | N/A | TRUE | N/A | N/A |
| One stronger public description | TRUE | TRUE | TRUE | TRUE |
| Internal notes not public | N/A | TRUE | N/A | N/A |
| Old drafts safe | TRUE | TRUE | TRUE | TRUE |

**N/A notes:** `notasAdicionales` existed only on Agente residencial Step 06; state retained, UI and preview output removed. Rentas/BR Privado had no internal-notes field.

## Stack C — Contact / business hub

Main agent contact rail unchanged. second agent preview/form limited to photo, name, title, license, phone, email, socials (no WhatsApp/website). **Financiamiento** block stripped of WhatsApp/socials; disclaimer added on Agente preview and BR Negocio lender card.

| Requirement | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio |
| ----------- | ---------- | ---------- | -------------- | -------------- |
| Main agent full contact | N/A | TRUE | N/A | N/A |
| Second agent limited fields | N/A | TRUE | N/A | N/A |
| Financing block rules | N/A | TRUE | N/A | N/A |
| Empty buttons hide | TRUE | TRUE | TRUE | TRUE |
| Raw URL labels avoided | TRUE | TRUE | TRUE | TRUE |

**N/A notes:** Privado/Rentas use lighter inquiry cards without second-agent/financing business hub blocks.

## Stack D — Duplicate CTA cleanup

Agente Step 08 duplicate CTA destination re-entry removed; visibility section renamed to **Acciones visibles para compradores** (no “Interruptores”). Schedule-visit link moved to Step 07 professional section.

| Requirement | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio |
| ----------- | ---------- | ---------- | -------------- | -------------- |
| Duplicate Step 8 fields removed | N/A | TRUE | N/A | N/A |
| “Interruptores” label removed | N/A | TRUE | N/A | N/A |
| Old drafts safe | N/A | TRUE | N/A | N/A |

**N/A notes:** Duplicate CTA destination re-entry existed only on Agente Step 08; Rentas/BR Privado had no equivalent step.

## Analytics

- **Not implemented** in this gate.
- Existing like/save/share, `LeonixShareButton`, `CtaActionSheet`, and contact CTA wrappers **preserved**.

## Unrelated categories

No changes to Autos, Servicios, Restaurantes, Clases, Comunidad, Viajes, Tienda, Empleos, global navigation, DB schema, Stripe, or analytics APIs.
