# Leonix Media — Promotional Products Image Manifest (Gate 1C-H)

**Total products:** 113 across 5 categories (full coverage preserved)
**Source images:** `/productos-promocion/source-images/` (36 files indexed)
**Display model (Gate 1C-H):** Featured image cards + compact “También podemos cotizar” / “We can also quote” lists

Close-match products are intentionally shown as **text chips** (not image cards) to avoid repeating the same photo across many SKUs. Image mappings still exist in `imageMap.ts` for featured cards and documentation.

Custom quote CTA per tab: `/tienda/contacto?lang={lang}&service=productos-promocion-personalizado`

---

## Featured image cards by tab (Gate 1C-H)

### business-cards (9 featured / 6 additional)

**Featured (image cards):**
- standard-business-cards
- premium-business-cards
- matte-business-cards
- gloss-business-cards
- foil-business-cards
- spot-uv-business-cards
- painted-edge-business-cards
- plastic-business-cards
- loyalty-cards

**Additional (text list only):**
- suede-business-cards
- silk-business-cards
- fold-over-business-cards
- square-business-cards
- rounded-corner-business-cards
- appointment-cards

### marketing (6 featured / 21 additional)

**Featured:**
- flyers
- brochures
- postcards
- menus
- presentation-folders
- stickers

**Additional:**
- tri-fold-brochures, rack-cards, door-hangers, takeout-menus, greeting-cards, invitations, event-tickets, bookmarks, catalogs, booklets, calendars, labels, ncr-forms, envelopes, letterhead, notepads, carbonless-forms, sell-sheets, table-tents, printed-magnets, coupons

### signs (4 featured / 23 additional)

**Featured:**
- vinyl-banners
- retractable-banners
- yard-signs
- sidewalk-signs

**Excluded from featured (no real source image):** window-clings

**Additional:**
- mesh-banners, fabric-banners, step-and-repeat-banners, x-stand-banners, real-estate-signs, a-frame-signs, window-clings, window-perforated-vinyl, wall-decals, floor-graphics, car-magnets, vehicle-magnets, tabletop-displays, event-tents, flags, feather-flags, posters, foam-board-signs, coroplast-signs, acrylic-signs, aluminum-signs, parking-signs, hanging-signs

### promo (14 featured / 13 additional)

**Featured:**
- tote-bags, mugs, pens, t-shirts, hats, tumblers, water-bottles, keychains, notebooks, event-giveaways, buttons, lanyards, coasters, umbrellas

**Additional:**
- polo-shirts, hoodies, drawstring-bags, pencils, promo-magnets, promo-stickers, mouse-pads, aprons, reusable-cups, phone-accessories, name-badges, wristbands, tote-kits

### essentials (6 featured / 11 additional)

**Featured:**
- branded-starter-kit, grand-opening-kit, restaurant-starter-kit, real-estate-marketing-kit, event-booth-kit, new-business-launch-bundle

**Additional:**
- church-outreach-kit, contractor-marketing-kit, salon-beauty-kit, food-truck-kit, loyalty-program-materials, coupon-cards, gift-certificates, thank-you-cards, review-request-cards, qr-code-table-cards, hiring-recruiting-kit

---

## Featured cards — image assignment summary

| Tab | Featured count | With exact/close image | Placeholder on featured only |
|-----|----------------|------------------------|------------------------------|
| business-cards | 9 | 9 mapped | 0 |
| marketing | 6 | 6 mapped | 0 |
| signs | 4 | 4 mapped | 0 |
| promo | 14 | 14 mapped | 0 |
| essentials | 6 | 6 close-match (bundle concepts) | 0 |

Placeholder cards appear **only** when a product remains featured and has no `imageSrc` or image load fails. Additional-list products never show placeholders.

---

## Products still missing true source images (14)

No asset in source packs — if ever moved back to featured, would show placeholder until asset added:

- door-hangers, greeting-cards, event-tickets, bookmarks, calendars, ncr-forms, carbonless-forms, printed-magnets (marketing)
- window-clings, window-perforated-vinyl, wall-decals, floor-graphics, car-magnets, vehicle-magnets (signs)

---

## Full product image assignments (all 113 SKUs)

Mappings unchanged from Gate 1C-G; see `app/(site)/productos-promocion/imageMap.ts`.

| Match status | Count (all products) |
|--------------|---------------------|
| exact-match | 32 |
| close-match | 67 |
| missing-source-image | 14 |
| **TOTAL** | **113** |

---

## Implementation files

- `catalogData.ts` — `FEATURED_SLUGS_BY_CATEGORY`, `featuredProducts`, `additionalProducts`
- `ProductCatalog.tsx` — featured grid, additional chips, per-tab custom quote CTA
- `imageMap.ts` — slug → source path (applied to featured products only)
