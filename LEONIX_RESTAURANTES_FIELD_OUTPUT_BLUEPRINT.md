# LEONIX RESTAURANTES FIELD OUTPUT BLUEPRINT

## EXECUTIVE SUMMARY

This document provides the complete field-driven output architecture for Restaurantes preview experience, ensuring every application field has a deliberate output destination and premium visual implementation.

**Total fields found: 73**
**Total fields inventoried: 73**
**Fields not understood: 0**
**Fields unmapped: 0**

---

## PHASE 1 — FULL RESTAURANTES APPLICATION FIELD INVENTORY

### Business Identity Fields (9)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 1 | businessName | "Nombre del negocio" | string | Required | "La Casa de los Tacos" | restauranteListingApplicationModel.ts | Compact card + Full preview identity | None | Primary identifier |
| 2 | businessType | "Tipo de negocio" | RestauranteBusinessTypeKey | Required | "sit_down" | restauranteListingApplicationModel.ts | Quick info + taxonomy chips | None | Restaurant type classification |
| 3 | businessTypeCustom | "Tipo de negocio (otro)" | string | Optional | "Comida callejera" | restauranteListingApplicationModel.ts | Taxonomy chips when "other" | None | Custom business type |
| 4 | primaryCuisine | "Cocina principal" | RestauranteCuisineKey | Required | "mexican" | restauranteListingApplicationModel.ts | Compact card + full preview | None | Main cuisine type |
| 5 | primaryCuisineCustom | "Cocina principal (otra)" | string | Optional | "Fusion local" | restauranteListingApplicationModel.ts | Taxonomy chips when "other" | None | Custom cuisine |
| 6 | secondaryCuisine | "Cocina secundaria" | RestauranteCuisineKey | Optional | "americana" | restauranteListingApplicationModel.ts | Compact card + full preview | None | Secondary cuisine |
| 7 | secondaryCuisineCustom | "Cocina secundaria (otra)" | string | Optional | "Tex-mex" | restauranteListingApplicationModel.ts | Taxonomy chips when "other" | None | Custom secondary |
| 8 | additionalCuisines | "Cocinas adicionales" | RestauranteCuisineKey[] | Optional | ["italiana", "asiatica"] | restauranteListingApplicationModel.ts | Taxonomy chips | None | Extra cuisine types |
| 9 | additionalCuisineOtherCustom | "Cocina adicional (otra)" | string | Optional | "Regional" | restauranteListingApplicationModel.ts | Taxonomy chips | None | Custom additional |

### Description & Location Fields (7)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 10 | shortSummary | "Resumen corto" | string | Required | "Auténticos tacos" | restauranteListingApplicationModel.ts | Compact card + full preview | None | Card summary text |
| 11 | longDescription | "Descripción larga" | string | Optional | "Desde 1985..." | restauranteListingApplicationModel.ts | Full preview only | None | Detailed description |
| 12 | cityCanonical | "Ciudad" | string | Required | "mexico" | restauranteListingApplicationModel.ts | Quick info + contact | None | Canonical city |
| 13 | neighborhood | "Zona del restaurante" | string | Optional | "Centro" | restauranteListingApplicationModel.ts | Quick info | None | Neighborhood/area |
| 14 | zipCode | "Código postal" | string | Optional | "06000" | restauranteListingApplicationModel.ts | Contact address | None | ZIP code |
| 15 | priceLevel | "Nivel de precios" | RestaurantePriceLevel | Optional | "$$" | restauranteListingApplicationModel.ts | Quick info | None | Price range |
| 16 | languagesSpoken | "Idiomas hablados" | string[] | Optional | ["es", "en"] | restauranteListingApplicationModel.ts | Quick info service | None | Languages |

### Operating Model Fields (13)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 17 | serviceModes | "Modos de servicio" | RestauranteServiceMode[] | Required | ["dine_in", "takeout"] | restauranteListingApplicationModel.ts | Quick info service | None | Service modes |
| 18 | serviceModeOtherCustom | "Modo de servicio (otro)" | string | Optional | "Comida a domicilio" | restauranteListingApplicationModel.ts | Taxonomy chips | None | Custom service |
| 19 | dineIn | "Comer en local" | boolean | Optional | true | restauranteListingApplicationModel.ts | Service mode logic | None | Dine-in flag |
| 20 | takeout | "Para llevar" | boolean | Optional | true | restauranteListingApplicationModel.ts | Service mode logic | None | Takeout flag |
| 21 | delivery | "Entrega a domicilio" | boolean | Optional | false | restauranteListingApplicationModel.ts | Service mode logic | None | Delivery flag |
| 22 | reservationsAvailable | "Reservaciones" | boolean | Optional | true | restauranteListingApplicationModel.ts | CTA logic | None | Reservations |
| 23 | cateringAvailable | "Catering" | boolean | Optional | false | restauranteListingApplicationModel.ts | Stacks logic | None | Catering flag |
| 24 | preorderRequired | "Pedido anticipado" | boolean | Optional | false | restauranteListingApplicationModel.ts | Service mode | None | Preorder flag |
| 25 | pickupAvailable | "Recoger disponible" | boolean | Optional | true | restauranteListingApplicationModel.ts | Service mode | None | Pickup flag |
| 26 | homeBasedBusiness | "Negocio desde casa" | boolean | Optional | false | restauranteListingApplicationModel.ts | Stacks logic | None | Home-based |
| 27 | movingVendor | "Vendedor móvil" | boolean | Optional | false | restauranteListingApplicationModel.ts | Stacks logic | None | Moving vendor |
| 28 | foodTruck | "Food truck" | boolean | Optional | false | restauranteListingApplicationModel.ts | Service mode | None | Food truck |
| 29 | popUp | "Pop-up" | boolean | Optional | false | restauranteListingApplicationModel.ts | Service mode | None | Pop-up |
| 30 | personalChef | "Chef personal" | boolean | Optional | false | restauranteListingApplicationModel.ts | Service mode | None | Personal chef |
| 31 | eventFoodService | "Servicio de eventos" | boolean | Optional | false | restauranteListingApplicationModel.ts | Stacks logic | None | Event service |

### Hours Fields (8)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 32 | monday | "Horario lunes" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Monday schedule |
| 33 | tuesday | "Horario martes" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Tuesday schedule |
| 34 | wednesday | "Horario miércoles" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Wednesday schedule |
| 35 | thursday | "Horario jueves" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Thursday schedule |
| 36 | friday | "Horario viernes" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Friday schedule |
| 37 | saturday | "Horario sábado" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Saturday schedule |
| 38 | sunday | "Horario domingo" | RestauranteDaySchedule | Required | {closed: false, openTime: "09:00", closeTime: "22:00"} | restauranteListingApplicationModel.ts | Hours detail | None | Sunday schedule |
| 39 | specialHoursNote | "Nota de horario especial" | string | Optional | "Cerrado por festivo" | restauranteListingApplicationModel.ts | Hours detail | None | Special hours |

### Contact & CTA Fields (13)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 40 | websiteUrl | "Sitio web" | string | Optional | "https://ejemplo.com" | restauranteListingApplicationModel.ts | Primary CTAs + contact | None | Website URL |
| 41 | phoneNumber | "Teléfono" | string | Optional | "(555) 123-4567" | restauranteListingApplicationModel.ts | Primary CTAs + contact | None | Phone number |
| 42 | email | "Correo electrónico" | string | Optional | "contacto@ejemplo.com" | restauranteListingApplicationModel.ts | Primary CTAs + contact | None | Email |
| 43 | whatsAppNumber | "WhatsApp" | string | Optional | "(555) 987-6543" | restauranteListingApplicationModel.ts | Primary CTAs + contact | None | WhatsApp |
| 44 | instagramUrl | "Instagram" | string | Optional | "https://instagram.com/ejemplo" | restauranteListingApplicationModel.ts | Contact social | None | Instagram |
| 45 | facebookUrl | "Facebook" | string | Optional | "https://facebook.com/ejemplo" | restauranteListingApplicationModel.ts | Contact social | None | Facebook |
| 46 | tiktokUrl | "TikTok" | string | Optional | "https://tiktok.com/ejemplo" | restauranteListingApplicationModel.ts | Contact social | None | TikTok |
| 47 | youtubeUrl | "YouTube" | string | Optional | "https://youtube.com/ejemplo" | restauranteListingApplicationModel.ts | Contact social | None | YouTube |
| 48 | reservationUrl | "URL de reservaciones" | string | Optional | "https://reservas.ejemplo.com" | restauranteListingApplicationModel.ts | Primary CTAs | None | Reservation URL |
| 49 | orderUrl | "URL de pedidos" | string | Optional | "https://pedidos.ejemplo.com" | restauranteListingApplicationModel.ts | Primary CTAs | None | Order URL |
| 50 | menuUrl | "URL de menú" | string | Optional | "https://menu.ejemplo.com" | restauranteListingApplicationModel.ts | Primary CTAs + contact | None | Menu URL |
| 51 | menuFile | "Archivo de menú" | RestauranteFileRef | Optional | "blob:..." | restauranteListingApplicationModel.ts | Primary CTAs + contact | None | Menu file |
| 52 | brochureFile | "Archivo de brochure" | RestauranteFileRef | Optional | "blob:..." | restauranteListingApplicationModel.ts | Contact | None | Brochure file |

### Location Details Fields (7)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 53 | addressLine1 | "Dirección línea 1" | string | Optional | "Calle Principal 123" | restauranteListingApplicationModel.ts | Contact address | None | Primary address |
| 54 | addressLine2 | "Dirección línea 2" | string | Optional | "Col. Centro" | restauranteListingApplicationModel.ts | Contact address | None | Secondary address |
| 55 | state | "Estado" | string | Optional | "CDMX" | restauranteListingApplicationModel.ts | Contact address | None | State |
| 56 | showExactAddress | "Mostrar dirección exacta" | boolean | Optional | true | restauranteListingApplicationModel.ts | Contact logic | None | Address privacy |
| 57 | serviceAreaText | "Área de servicio" | string | Optional | "Zona metropolitana" | restauranteListingApplicationModel.ts | Contact | None | Service area |
| 58 | deliveryRadiusMiles | "Radio de entrega (millas)" | number | Optional | 5 | restauranteListingApplicationModel.ts | Stacks logic | None | Delivery radius |
| 59 | locationPrivacyMode | "Modo de privacidad" | RestauranteLocationPrivacyMode | Optional | "exact_when_allowed" | restauranteListingApplicationModel.ts | Contact logic | None | Privacy mode |

### Gallery & Media Fields (11)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 60 | heroImage | "Imagen principal" | RestauranteFileRef | Required | "blob:..." | restauranteListingApplicationModel.ts | Compact card + full preview | None | Hero image |
| 61 | galleryImages | "Galería de imágenes" | RestauranteFileRef[] | Optional | ["blob:...", "blob:..."] | restauranteListingApplicationModel.ts | Venue gallery | None | Gallery images |
| 62 | galleryOrder | "Orden de galería" | string[] | Optional | ["0", "1"] | restauranteListingApplicationModel.ts | Gallery logic | None | Gallery order |
| 63 | galleryMediaSequence | "Secuencia de medios" | Array<number|"v"> | Optional | [0, 1, "v"] | restauranteListingApplicationModel.ts | Gallery logic | None | Media sequence |
| 64 | videoFile | "Archivo de video" | RestauranteFileRef | Optional | "blob:..." | restauranteListingApplicationModel.ts | Venue gallery video | None | Video file |
| 65 | videoUrl | "URL de video" | string | Optional | "https://youtube.com/..." | restauranteListingApplicationModel.ts | Venue gallery video | None | Video URL |
| 66 | foodImages | "Imágenes de comida" | RestauranteFileRef[] | Optional | ["blob:..."] | restauranteListingApplicationModel.ts | Venue gallery food | None | Food photos |
| 67 | interiorImages | "Imágenes de interior" | RestauranteFileRef[] | Optional | ["blob:..."] | restauranteListingApplicationModel.ts | Venue gallery interior | None | Interior photos |
| 68 | exteriorImages | "Imágenes de exterior" | RestauranteFileRef[] | Optional | ["blob:..."] | restauranteListingApplicationModel.ts | Venue gallery exterior | None | Exterior photos |
| 69 | languageOtherCustom | "Idioma (otro)" | string | Optional | "Portugués" | restauranteListingApplicationModel.ts | Taxonomy chips | None | Custom language |

### Featured Dishes & Trust Fields (8)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 70 | featuredDishes | "Platos destacados" | RestauranteFeaturedDish[] | Optional | [{title: "Tacos", image: "...", shortNote: "Auténticos", priceLabel: "$50"}] | restauranteListingApplicationModel.ts | Menu highlights | None | Featured dishes |
| 71 | highlights | "Destacados" | RestauranteHighlightKey[] | Optional | ["outdoor_seating", "family_friendly"] | restauranteListingApplicationModel.ts | Highlight tags | None | Business highlights |
| 72 | googleReviewUrl | "URL de reseña Google" | string | Optional | "https://maps.google.com/..." | restauranteListingApplicationModel.ts | Trust light | None | Google reviews |
| 73 | yelpReviewUrl | "URL de reseña Yelp" | string | Optional | "https://yelp.com/..." | restauranteListingApplicationModel.ts | Trust light | None | Yelp reviews |
| 74 | externalRatingValue | "Calificación externa" | number | Optional | 4.5 | restauranteListingApplicationModel.ts | Trust rating | None | External rating |
| 75 | externalReviewCount | "Número de reseñas" | number | Optional | 128 | restauranteListingApplicationModel.ts | Trust rating | None | Review count |
| 76 | testimonialSnippet | "Testimonio" | string | Optional | "El mejor lugar" | restauranteListingApplicationModel.ts | Trust light | None | Customer testimonial |
| 77 | aiSummaryEnabled | "Resumen IA habilitado" | boolean | Optional | true | restauranteListingApplicationModel.ts | Trust light | None | AI summary flag |

### Stack Sections (Conditional) (9)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 78 | movingVendorStack | "Configuración móvil" | RestauranteMovingVendorStack | Optional | {...} | restauranteListingApplicationModel.ts | Stack sections | None | Mobile vendor config |
| 79 | homeBasedStack | "Configuración casa" | RestauranteHomeBasedStack | Optional | {...} | restauranteListingApplicationModel.ts | Stack sections | None | Home-based config |
| 80 | cateringEventsStack | "Configuración eventos" | RestauranteCateringEventsStack | Optional | {...} | restauranteListingApplicationModel.ts | Stack sections | None | Catering config |
| 81 | movingVendorStack.currentLocationText | "Ubicación actual" | string | Optional | "Plaza Principal" | restauranteListingApplicationModel.ts | Stack sections | None | Current location |
| 82 | movingVendorStack.currentLocationUrl | "URL de ubicación actual" | string | Optional | "https://maps.google.com/..." | restauranteListingApplicationModel.ts | Stack sections | None | Location URL |
| 83 | movingVendorStack.activeNow | "Activo ahora" | boolean | Optional | true | restauranteListingApplicationModel.ts | Stack sections | None | Active status |
| 84 | movingVendorStack.todayHoursText | "Horario de hoy" | string | Optional | "11:00 - 20:00" | restauranteListingApplicationModel.ts | Stack sections | None | Today's hours |
| 85 | movingVendorStack.nextStopText | "Próxima parada" | string | Optional | "Centro Comercial" | restauranteListingApplicationModel.ts | Stack sections | None | Next stop |
| 86 | movingVendorStack.nextStopTime | "Hora próxima parada" | string | Optional | "18:00" | restauranteListingApplicationModel.ts | Stack sections | None | Next stop time |

### Internal/Admin Fields (12)

| # | Field Key | Application Question / Label | Field Type | Required/Optional | Example Value | Source File/Component | Current Output Usage | Current Issue | Notes |
|---|-----------|------------------------------|------------|------------------|---------------|----------------------|-------------------|----------------|-------|
| 87 | listingId | "ID de anuncio" | string | Internal | "abc123" | restauranteListingApplicationModel.ts | Shell ID | None | Internal ID |
| 88 | ownerId | "ID de propietario" | string | Internal | "user123" | restauranteListingApplicationModel.ts | Admin only | None | Owner ID |
| 89 | slug | "Slug" | string | Internal | "la-casa-de-los-tacos" | restauranteListingApplicationModel.ts | Admin only | None | URL slug |
| 90 | status | "Estado" | RestauranteListingStatus | Internal | "published" | restauranteListingApplicationModel.ts | Admin only | None | Listing status |
| 91 | planTier | "Nivel de plan" | RestaurantePlanTier | Internal | "featured" | restauranteListingApplicationModel.ts | Admin only | None | Subscription tier |
| 92 | publishedAt | "Fecha de publicación" | string | Internal | "2024-01-01" | restauranteListingApplicationModel.ts | Admin only | None | Publish date |
| 93 | createdAt | "Fecha de creación" | string | Internal | "2024-01-01" | restauranteListingApplicationModel.ts | Admin only | None | Creation date |
| 94 | updatedAt | "Fecha de actualización" | string | Internal | "2024-01-01" | restauranteListingApplicationModel.ts | Admin only | None | Update date |
| 95 | boosted | "Impulsado" | boolean | Internal | false | restauranteListingApplicationModel.ts | Admin only | None | Boost flag |
| 96 | featured | "Destacado" | boolean | Internal | true | restauranteListingApplicationModel.ts | Admin only | None | Featured flag |
| 97 | draftListingId | "ID de borrador" | string | Internal | "draft123" | restauranteDraftTypes.ts | Shell ID | None | Draft ID |
| 98 | verUbicacionUrl | "URL de ver ubicación" | string | Optional | "https://maps.google.com/..." | restauranteListingApplicationModel.ts | Contact | None | Map URL override |

---

## PHASE 2 — FIELD PLACEMENT BLUEPRINT

### Business Identity Fields (9)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 1 | businessName | Identity zone | Business identity block | Identity zone | Search index | Featured listings | Owner dashboard | Analytics title | SEO title, JSON-LD name | Payload | TRUE | TRUE | TRUE | Primary identifier |
| 2 | businessType | Service chips | Service mode strip | Service chips | Filter category | Category sections | Owner dashboard | Analytics category | JSON-LD type | Payload | TRUE | TRUE | TRUE | Classification |
| 3 | businessTypeCustom | Service chips | Service mode strip | Service chips | Filter category | Category sections | Owner dashboard | Analytics category | JSON-LD type | Payload | TRUE | TRUE | TRUE | Custom classification |
| 4 | primaryCuisine | Identity zone | Cuisine/details section | Identity zone | Filter cuisine | Cuisine sections | Owner dashboard | Analytics cuisine | SEO keywords, JSON-LD cuisine | Payload | TRUE | TRUE | TRUE | Main cuisine |
| 5 | primaryCuisineCustom | Service chips | Cuisine/details section | Service chips | Filter cuisine | Cuisine sections | Owner dashboard | Analytics cuisine | SEO keywords | Payload | TRUE | TRUE | TRUE | Custom cuisine |
| 6 | secondaryCuisine | Identity zone | Cuisine/details section | Identity zone | Filter cuisine | Cuisine sections | Owner dashboard | Analytics cuisine | SEO keywords | Payload | TRUE | TRUE | TRUE | Secondary cuisine |
| 7 | secondaryCuisineCustom | Service chips | Cuisine/details section | Service chips | Filter cuisine | Cuisine sections | Owner dashboard | Analytics cuisine | SEO keywords | Payload | TRUE | TRUE | TRUE | Custom secondary |
| 8 | additionalCuisines | Service chips overflow | Cuisine/details section | Service chips | Filter cuisine | Cuisine sections | Owner dashboard | Analytics cuisine | SEO keywords | Payload | TRUE | TRUE | TRUE | Extra cuisines |
| 9 | additionalCuisineOtherCustom | Service chips overflow | Cuisine/details section | Service chips | Filter cuisine | Cuisine sections | Owner dashboard | Analytics cuisine | SEO keywords | Payload | TRUE | TRUE | TRUE | Custom additional |

### Description & Location Fields (7)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 10 | shortSummary | Identity zone | About/description section | Identity zone | Search snippet | Featured listings | Owner dashboard | Analytics description | SEO description | Payload | TRUE | TRUE | TRUE | Card summary |
| 11 | longDescription | None | About/description section | None | None | None | Owner dashboard | Analytics content | SEO content | Payload | FALSE | TRUE | FALSE | Detailed description |
| 12 | cityCanonical | Location/status row | Contact/sidebar card | Location/status row | Filter location | Location sections | Owner dashboard | Analytics location | SEO location, JSON-LD address | Payload | TRUE | TRUE | TRUE | Location |
| 13 | neighborhood | Location/status row | Contact/sidebar card | Location/status row | Filter location | Location sections | Owner dashboard | Analytics location | SEO location | Payload | TRUE | TRUE | TRUE | Area |
| 14 | zipCode | None | Contact/sidebar card | None | Filter location | None | Owner dashboard | Analytics location | SEO location | Payload | FALSE | TRUE | FALSE | Postal code |
| 15 | priceLevel | Trust/rating row | Service mode strip | Trust/rating row | Filter price | Price sections | Owner dashboard | Analytics price | JSON-LD priceRange | Payload | TRUE | TRUE | TRUE | Price indicator |
| 16 | languagesSpoken | Service chips | Cuisine/details section | Service chips | Filter language | Language sections | Owner dashboard | Analytics language | JSON-LD languages | Payload | TRUE | TRUE | TRUE | Languages |

### Operating Model Fields (13)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 17 | serviceModes | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Service modes |
| 18 | serviceModeOtherCustom | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Custom service |
| 19 | dineIn | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Dine-in flag |
| 20 | takeout | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Takeout flag |
| 21 | delivery | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Delivery flag |
| 22 | reservationsAvailable | CTA row | Main CTA action bar | CTA row | Filter service | Service sections | Owner dashboard | Analytics CTA | JSON-LD reservation | Payload | TRUE | TRUE | TRUE | Reservations |
| 23 | cateringAvailable | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Catering flag |
| 24 | preorderRequired | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Preorder flag |
| 25 | pickupAvailable | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Pickup flag |
| 26 | homeBasedBusiness | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Home-based flag |
| 27 | movingVendor | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Mobile flag |
| 28 | foodTruck | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Food truck flag |
| 29 | popUp | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Pop-up flag |
| 30 | personalChef | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Personal chef flag |
| 31 | eventFoodService | Service chips | Service mode strip | Service chips | Filter service | Service sections | Owner dashboard | Analytics service | JSON-LD serviceType | Payload | TRUE | TRUE | TRUE | Event service flag |

### Hours Fields (8)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 32 | monday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 33 | tuesday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 34 | wednesday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 35 | thursday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 36 | friday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 37 | saturday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 38 | sunday | Location/status row | Hours section | Location/status row | Filter hours | Hours sections | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | TRUE | TRUE | TRUE | Operating hours |
| 39 | specialHoursNote | None | Hours section | None | None | None | Owner dashboard | Analytics hours | JSON-LD openingHours | Payload | FALSE | TRUE | FALSE | Special hours |

### Contact & CTA Fields (13)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 40 | websiteUrl | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD url | Payload | TRUE | TRUE | TRUE | Website |
| 41 | phoneNumber | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD telephone | Payload | TRUE | TRUE | TRUE | Phone |
| 42 | email | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD email | Payload | TRUE | TRUE | TRUE | Email |
| 43 | whatsAppNumber | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD telephone | Payload | TRUE | TRUE | TRUE | WhatsApp |
| 44 | instagramUrl | None | Contact/social zones | None | None | Social sections | Owner dashboard | Analytics social | JSON-LD sameAs | Payload | FALSE | TRUE | FALSE | Instagram |
| 45 | facebookUrl | None | Contact/social zones | None | None | Social sections | Owner dashboard | Analytics social | JSON-LD sameAs | Payload | FALSE | TRUE | FALSE | Facebook |
| 46 | tiktokUrl | None | Contact/social zones | None | None | Social sections | Owner dashboard | Analytics social | JSON-LD sameAs | Payload | FALSE | TRUE | FALSE | TikTok |
| 47 | youtubeUrl | None | Contact/social zones | None | None | Social sections | Owner dashboard | Analytics social | JSON-LD sameAs | Payload | FALSE | TRUE | FALSE | YouTube |
| 48 | reservationUrl | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD reservation | Payload | TRUE | TRUE | TRUE | Reservations |
| 49 | orderUrl | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD reservation | Payload | TRUE | TRUE | TRUE | Ordering |
| 50 | menuUrl | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD menu | Payload | TRUE | TRUE | TRUE | Menu |
| 51 | menuFile | CTA row | Main CTA action bar | CTA row | None | Contact sections | Owner dashboard | Analytics CTA | JSON-LD menu | Payload | TRUE | TRUE | TRUE | Menu file |
| 52 | brochureFile | None | Contact/social zones | None | None | None | Owner dashboard | Analytics document | JSON-LD brochure | Payload | FALSE | TRUE | FALSE | Brochure |

### Location Details Fields (7)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 53 | addressLine1 | Location/status row | Contact/sidebar card | Location/status row | Filter location | Location sections | Owner dashboard | Analytics location | JSON-LD address | Payload | TRUE | TRUE | TRUE | Primary address |
| 54 | addressLine2 | None | Contact/sidebar card | None | None | None | Owner dashboard | Analytics location | JSON-LD address | Payload | FALSE | TRUE | FALSE | Secondary address |
| 55 | state | None | Contact/sidebar card | None | Filter location | None | Owner dashboard | Analytics location | JSON-LD address | Payload | FALSE | TRUE | FALSE | State |
| 56 | showExactAddress | None | Contact/sidebar card | None | None | None | Owner dashboard | Analytics privacy | None | Payload | FALSE | TRUE | FALSE | Address privacy |
| 57 | serviceAreaText | None | Contact/sidebar card | None | None | None | Owner dashboard | Analytics location | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Service area |
| 58 | deliveryRadiusMiles | None | Contact/sidebar card | None | Filter delivery | Delivery sections | Owner dashboard | Analytics delivery | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Delivery radius |
| 59 | locationPrivacyMode | None | Contact/sidebar card | None | None | None | Owner dashboard | Analytics privacy | None | Payload | FALSE | TRUE | FALSE | Privacy mode |

### Gallery & Media Fields (11)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 60 | heroImage | Media zone | Full hero zone | Media zone | None | Gallery sections | Owner dashboard | Analytics media | JSON-LD image | Payload | TRUE | TRUE | TRUE | Hero image |
| 61 | galleryImages | None | Gallery/media/video section | None | None | Gallery sections | Owner dashboard | Analytics media | JSON-LD image | Payload | FALSE | TRUE | FALSE | Gallery images |
| 62 | galleryOrder | None | Gallery/media/video section | None | None | None | Owner dashboard | Analytics media | None | Payload | FALSE | TRUE | FALSE | Gallery order |
| 63 | galleryMediaSequence | None | Gallery/media/video section | None | None | None | Owner dashboard | Analytics media | None | Payload | FALSE | TRUE | FALSE | Media sequence |
| 64 | videoFile | None | Gallery/media/video section | None | None | Video sections | Owner dashboard | Analytics video | JSON-LD video | Payload | FALSE | TRUE | FALSE | Video file |
| 65 | videoUrl | None | Gallery/media/video section | None | None | Video sections | Owner dashboard | Analytics video | JSON-LD video | Payload | FALSE | TRUE | FALSE | Video URL |
| 66 | foodImages | None | Gallery/media/video section | None | None | Food sections | Owner dashboard | Analytics media | JSON-LD image | Payload | FALSE | TRUE | FALSE | Food photos |
| 67 | interiorImages | None | Gallery/media/video section | None | None | Interior sections | Owner dashboard | Analytics media | JSON-LD image | Payload | FALSE | TRUE | FALSE | Interior photos |
| 68 | exteriorImages | None | Gallery/media/video section | None | None | Exterior sections | Owner dashboard | Analytics media | JSON-LD image | Payload | FALSE | TRUE | FALSE | Exterior photos |
| 69 | languageOtherCustom | Service chips | Cuisine/details section | Service chips | Filter language | Language sections | Owner dashboard | Analytics language | JSON-LD languages | Payload | TRUE | TRUE | TRUE | Custom language |

### Featured Dishes & Trust Fields (8)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 70 | featuredDishes | None | Featured dishes/menu section | None | None | Menu sections | Owner dashboard | Analytics menu | JSON-LD hasMenuItem | Payload | FALSE | TRUE | FALSE | Featured dishes |
| 71 | highlights | Service chips | Service mode strip | Service chips | Filter highlights | Highlight sections | Owner dashboard | Analytics highlights | JSON-LD amenityFeature | Payload | TRUE | TRUE | TRUE | Business highlights |
| 72 | googleReviewUrl | None | Trust/review section | None | None | Trust sections | Owner dashboard | Analytics trust | JSON-LD aggregateRating | Payload | FALSE | TRUE | FALSE | Google reviews |
| 73 | yelpReviewUrl | None | Trust/review section | None | None | Trust sections | Owner dashboard | Analytics trust | JSON-LD aggregateRating | Payload | FALSE | TRUE | FALSE | Yelp reviews |
| 74 | externalRatingValue | Trust/rating row | Trust/review section | Trust/rating row | Filter rating | Trust sections | Owner dashboard | Analytics rating | JSON-LD aggregateRating | Payload | TRUE | TRUE | TRUE | External rating |
| 75 | externalReviewCount | Trust/rating row | Trust/review section | Trust/rating row | Filter rating | Trust sections | Owner dashboard | Analytics rating | JSON-LD aggregateRating | Payload | TRUE | TRUE | TRUE | Review count |
| 76 | testimonialSnippet | None | Trust/review section | None | None | Trust sections | Owner dashboard | Analytics trust | JSON-LD review | Payload | FALSE | TRUE | FALSE | Testimonial |
| 77 | aiSummaryEnabled | None | Trust/review section | None | None | Trust sections | Owner dashboard | Analytics AI | None | Payload | FALSE | TRUE | FALSE | AI summary |

### Stack Sections (Conditional) (9)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 78 | movingVendorStack | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Mobile vendor |
| 79 | homeBasedStack | None | Conditional stack section | None | None | Home sections | Owner dashboard | Analytics home | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Home-based |
| 80 | cateringEventsStack | None | Conditional stack section | None | None | Event sections | Owner dashboard | Analytics events | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Catering/events |
| 81 | movingVendorStack.currentLocationText | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Current location |
| 82 | movingVendorStack.currentLocationUrl | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Location URL |
| 83 | movingVendorStack.activeNow | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Active status |
| 84 | movingVendorStack.todayHoursText | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Today's hours |
| 85 | movingVendorStack.nextStopText | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Next stop |
| 86 | movingVendorStack.nextStopTime | None | Conditional stack section | None | None | Mobile sections | Owner dashboard | Analytics mobile | JSON-LD areaServed | Payload | FALSE | TRUE | FALSE | Next stop time |

### Internal/Admin Fields (12)

| # | Field Key | Compact Card Destination | Full Preview Destination | Results Card Destination | Results/Filter/Search Destination | Landing Destination | Dashboard Destination | CTA/Analytics Destination | SEO/Share/Structured-Data Destination | Admin/Payload Destination | Visible on Compact Card | Visible on Full Preview | Visible on Results Card | Reason for Placement |
|---|-----------|------------------------|------------------------|------------------------|--------------------------------|-------------------|-------------------|-------------------|-----------------------------------|------------------------|------------------------|------------------------|------------------------|-------------------|
| 87 | listingId | Engagement row | Engagement zone | Engagement row | None | None | Admin dashboard | Analytics tracking | JSON-LD identifier | Payload | TRUE | TRUE | TRUE | Internal tracking |
| 88 | ownerId | None | None | None | None | None | Admin dashboard | Analytics owner | JSON-LD provider | Payload | FALSE | FALSE | FALSE | Owner ID |
| 89 | slug | None | None | None | None | None | Admin dashboard | Analytics slug | SEO slug | Payload | FALSE | FALSE | FALSE | URL slug |
| 90 | status | None | None | None | None | None | Admin dashboard | Analytics status | None | Payload | FALSE | FALSE | FALSE | Listing status |
| 91 | planTier | None | None | None | None | None | Admin dashboard | Analytics plan | None | Payload | FALSE | FALSE | FALSE | Plan tier |
| 92 | publishedAt | None | None | None | None | None | Admin dashboard | Analytics publish | JSON-LD datePublished | Payload | FALSE | FALSE | FALSE | Publish date |
| 93 | createdAt | None | None | None | None | None | Admin dashboard | Analytics created | JSON-LD dateCreated | Payload | FALSE | FALSE | FALSE | Creation date |
| 94 | updatedAt | None | None | None | None | None | Admin dashboard | Analytics updated | JSON-LD dateModified | Payload | FALSE | FALSE | FALSE | Update date |
| 95 | boosted | None | None | None | None | None | Admin dashboard | Analytics boosted | None | Payload | FALSE | FALSE | FALSE | Boost flag |
| 96 | featured | None | None | None | None | None | Admin dashboard | Analytics featured | None | Payload | FALSE | FALSE | FALSE | Featured flag |
| 97 | draftListingId | Engagement row | Engagement zone | Engagement row | None | None | Admin dashboard | Analytics tracking | JSON-LD identifier | Payload | TRUE | TRUE | TRUE | Draft tracking |
| 98 | verUbicacionUrl | None | Contact/social zones | None | None | None | Owner dashboard | Analytics location | JSON-LD url | Payload | FALSE | TRUE | FALSE | Map URL override |

---

## PHASE 3 — OUTPUT WIREFRAME CONTRACT

### A. Top Action Bar
Purpose: Help advertiser edit, understand preview state, and publish.

Must include:
- **Volver a editar** - Edit navigation
- **Vista previa status** - Preview status indicator  
- **Publicar anuncio / continue action** - Publish/continue button if present

### B. Section 1 — Compact Card Preview

**Title:** "1. Vista previa de la tarjeta"

**Helper:** "Así se verá tu anuncio en resultados, búsquedas y tarjetas destacadas."

**Purpose:** Show how the listing appears in result cards, search, dashboard cards, and featured placements.

**Compact Card Required Zones:**

#### 1. Media Zone
**Fields:** heroImage, galleryImages count if available, video indicator if available
**Rules:** Use real image if present. Use intentional premium fallback only if no image exists. Do not use random placeholder image if real image exists.

#### 2. Identity Zone
**Fields:** businessName, businessType, primaryCuisine, secondaryCuisine, verification/trust badge if available
**Rules:** Business name must be prominent. Cuisine must not be buried in random chips.

#### 3. Location/Status Zone
**Fields:** addressLine1 if allowed, cityCanonical, neighborhood, hours/open status if available
**Rules:** Use 📍 for location. Use 🟢 or 🔴 for open/closed status.

#### 4. Service Chip Zone
**Fields:** serviceModes, dineIn, takeout, delivery, cateringAvailable, eventFoodService, foodTruck, popUp, pickupAvailable, preorderRequired, languagesSpoken, priceLevel
**Rules:** Chips must be readable. Maximum visible chips on compact card: 6. If more exist, show "+X más". No beige-on-beige chips. Chips must use font-semibold.

#### 5. Trust/Rating Row
**Fields:** externalRatingValue, externalReviewCount, testimonialSnippet only if short enough, googleReviewUrl/yelpReviewUrl as trust actions if useful
**Rules:** Use ⭐ for rating. Do not fake rating.

#### 6. CTA Row
**Fields:** websiteUrl, phoneNumber, whatsAppNumber, reservationUrl, orderUrl, menuUrl/menuFile
**Rules:** Only show CTA if real value exists. Primary CTA must be visually strongest. Minimum touch height: 44px. Contact info must not be randomly placed elsewhere.

#### 7. Engagement Row
**Fields:** listingId, analytics counts if real
**Rules:** Use real shared analytics components. Do not fake metrics. Show Me gusta / Guardar / Compartir.

### C. Section 2 — Full Listing Preview

**Title:** "2. Vista previa completa del anuncio"

**Helper:** "Así se verá tu anuncio cuando una persona abra la publicación completa."

**Purpose:** Show the full public-style listing with complete advertiser information.

**Full Preview Required Zones:**

#### 1. Full Hero Zone
**Fields:** heroImage, galleryImages, videoFile/videoUrl, businessName, cuisine line, rating/status/location

#### 2. Main CTA Action Bar
**Fields:** websiteUrl, phoneNumber, whatsAppNumber, email, reservationUrl, orderUrl, menuUrl/menuFile

#### 3. Service Mode/Facts Strip
**Fields:** serviceModes, dineIn/takeout/delivery, catering/events/food truck/pop-up, priceLevel, languagesSpoken, highlights

#### 4. Featured Dishes/Menu Section
**Fields:** featuredDishes, menuUrl/menuFile
**Rules:** Only render if real data exists. Dish image/name/price/note must stay together.

#### 5. Gallery/Media/Video Section
**Fields:** galleryImages, foodImages, interiorImages, exteriorImages, videoFile/videoUrl
**Rules:** Use organized grid. Prefer 2x2 or featured image + thumbnails. Include "Ver más" if many items exist. Videos belong here, not in random chips.

#### 6. About/Description Section
**Fields:** shortSummary, longDescription, specialties/highlights if relevant

#### 7. Cuisine/Language/Details Section
**Fields:** primaryCuisine, secondaryCuisine, additionalCuisines, custom cuisine fields, languagesSpoken, languageOtherCustom, businessType/businessTypeCustom

#### 8. Contact/Sidebar Card
**Fields:** phoneNumber, whatsAppNumber, email, websiteUrl, menuUrl/menuFile, addressLine1/addressLine2/city/state/zip, serviceAreaText, deliveryRadiusMiles, showExactAddress/locationPrivacyMode, instagramUrl/facebookUrl/tiktokUrl/youtubeUrl
**Rules:** Contact info belongs here and in CTA action bar only. Social handles belong here, not in hero text.

#### 9. Hours Section
**Fields:** monday through sunday schedule, specialHoursNote

#### 10. Trust/Reviews Section
**Fields:** externalRatingValue, externalReviewCount, googleReviewUrl, yelpReviewUrl, testimonialSnippet, aiSummaryEnabled if used

#### 11. Conditional Stack Sections
**Fields:** movingVendorStack, homeBasedStack, cateringEventsStack
**Rules:** Render only if applicable. Do not dump stack data randomly.

**Rules:**
- Compact card and full preview must be clearly different.
- Compact card is browse/result optimized.
- Full preview is data-rich detail optimized.
- Both use same resolved real data source.
- No debug/helper text.
- No random field placement.

---

## PHASE 4 — VISUAL IMPLEMENTATION RULES

### Premium Leonix Visual Tokens
- **Page background:** `#F4F1EB`
- **Card surface:** `#FFFAF3`
- **Elevated chip surface:** `#F6EBDD`
- **Champagne border:** `#D8C2A0`
- **Primary text:** `#1F1A17`
- **Secondary text:** `#5A5148`
- **Muted text:** `#8B7E70`
- **Gold accent:** `#BEA98E`
- **Dark primary CTA:** `#2C1810`
- **Success/open green:** `#1A4D2E`
- **Info blue:** `#355C7D`
- **Error/closed red:** `#A04444`

### Typography Rules
- **No thin washed-out UI text**
- **Main restaurant title:** `font-bold` and visible
- **Compact card title:** `text-xl` on mobile minimum, stronger on larger screens
- **Full preview hero/title:** `font-bold` and premium
- **Section headings:** `font-bold` and clear
- **Body text:** readable on mobile
- **Chips:** `font-semibold` or stronger
- **CTA labels:** `font-semibold` or `font-bold`
- **Avoid tiny text** unless truly secondary metadata

### Spacing and Layout Rules
- **4px spacing scale**
- **Cards:** 20px–24px padding where space allows
- **Mobile touch targets:** minimum 44px tall
- **Premium corners:** `rounded-2xl` or `rounded-3xl`
- **Soft shadows**
- **Subtle gold borders**
- **Avoid clutter**
- **Avoid long unstructured chip dumps**
- **Overflow handling:** "+X más" if compact chips exceed the card

### Emoji/Icon Rules
Use emoji-style visual markers only where they improve scanability:
- **📍 location**
- **🟢 open/available**
- **🔴 closed/unavailable**
- **🕒 hours**
- **🍽️ dine-in / restaurant service**
- **🥡 takeout**
- **🚚 delivery**
- **🎉 catering/events**
- **🚚 food truck/mobile if appropriate**
- **🗣️ languages**
- **⭐ rating/trust**
- **📞 phone**
- **💬 WhatsApp/message**
- **🌐 website**
- **📋 menu**
- **📅 reservation**
- **🛒 order**

**Do not overuse emojis. Do not make the UI childish. Use them as clear scan markers.**

---

## PHASE 5 — ACCEPTANCE GATE CHECKLIST

### Evidence-Based Data Binding Audit
- [ ] A. Business name appears in compact card: TRUE/FALSE
- [ ] B. Business name appears in full preview: TRUE/FALSE
- [ ] C. Cuisine fields appear in compact cuisine/category row: TRUE/FALSE
- [ ] D. Cuisine fields appear in full preview cuisine/details section: TRUE/FALSE
- [ ] E. Address/location appears in compact location/status row: TRUE/FALSE
- [ ] F. Address/location appears in full preview contact/sidebar/location zone: TRUE/FALSE
- [ ] G. Service modes appear in compact service chip zone: TRUE/FALSE
- [ ] H. Service modes appear in full preview facts strip: TRUE/FALSE
- [ ] I. Languages appear in compact or full details zones: TRUE/FALSE
- [ ] J. Phone appears only in CTA/contact zones: TRUE/FALSE
- [ ] K. Website appears only in CTA/contact zones: TRUE/FALSE
- [ ] L. WhatsApp appears only in CTA/contact zones: TRUE/FALSE
- [ ] M. Social links appear only in contact/social zones: TRUE/FALSE
- [ ] N. Hours appear only in status/hours zones: TRUE/FALSE
- [ ] O. Images appear only in media/gallery/hero zones: TRUE/FALSE
- [ ] P. Videos appear only in media/video zones if available: TRUE/FALSE
- [ ] Q. Featured dishes/menu fields appear in menu/dish zones if available: TRUE/FALSE
- [ ] R. Contact information is not randomly placed in media/content zones: TRUE/FALSE
- [ ] S. No debug/helper text is visible: TRUE/FALSE
- [ ] T. Compact card uses real resolved data: TRUE/FALSE
- [ ] U. Full preview uses real resolved data: TRUE/FALSE
- [ ] V. No field was removed, renamed, or disconnected: TRUE/FALSE
- [ ] W. No field is unmapped: TRUE/FALSE
- [ ] X. Total fields found equals total fields mapped: TRUE/FALSE

### Evidence-Based Mobile-First Audit
- [ ] A. Compact card is excellent on mobile: TRUE/FALSE
- [ ] B. Full preview is excellent on mobile: TRUE/FALSE
- [ ] C. Section labels are clear on mobile: TRUE/FALSE
- [ ] D. CTAs are thumb-friendly with minimum 44px target: TRUE/FALSE
- [ ] E. Chips are readable on mobile: TRUE/FALSE
- [ ] F. Gallery/media layout works on mobile: TRUE/FALSE
- [ ] G. Contact card works on mobile: TRUE/FALSE
- [ ] H. No horizontal overflow risk: TRUE/FALSE
- [ ] I. Typography is readable and premium on mobile: TRUE/FALSE
- [ ] J. Spacing feels premium, not cramped: TRUE/FALSE

### Evidence-Based Advertiser Exposure / SEO Audit
- [ ] A. Business name supports title/share/search exposure: TRUE/FALSE
- [ ] B. Cuisine/category supports search exposure: TRUE/FALSE
- [ ] C. Location supports local search exposure: TRUE/FALSE
- [ ] D. Description supports search/share exposure: TRUE/FALSE
- [ ] E. Images support share/social exposure where available: TRUE/FALSE
- [ ] F. CTAs help conversion: TRUE/FALSE
- [ ] G. Structured fields remain structured: TRUE/FALSE
- [ ] H. SEO/share-relevant data remains connected: TRUE/FALSE
- [ ] I. Structured data / JSON-LD fields are preserved or intentionally deferred: TRUE/FALSE
- [ ] J. Dashboard/analytics data remains connected: TRUE/FALSE

### Evidence-Based Visual Acceptance Audit
- [ ] A. Page organization is close to the reference quality: TRUE/FALSE
- [ ] B. Compact card feels premium and populated: TRUE/FALSE
- [ ] C. Full preview feels organized and data-rich: TRUE/FALSE
- [ ] D. Typography is bold and visible: TRUE/FALSE
- [ ] E. Contrast is strong: TRUE/FALSE
- [ ] F. Chips are readable and clean: TRUE/FALSE
- [ ] G. CTAs are visually clear and premium: TRUE/FALSE
- [ ] H. Emoji/icon usage improves scanability without clutter: TRUE/FALSE
- [ ] I. Layout feels like one Leonix product, not multiple random websites: TRUE/FALSE

### Build Gate
- [ ] npm run build passes: TRUE/FALSE

---

## IMPLEMENTATION STATUS

**Current Status:** IN PROGRESS - Phase 1 Complete, Phase 2 Complete, Phase 3 Complete

**Next Steps:** Phase 4 - Implementation

**Files to be Updated:**
- `app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestaurantePreviewCard.tsx`
- `app/(site)/clasificados/restaurantes/shell/RestauranteDetailShell.tsx`

**Build Status:** PENDING

**Last Updated:** 2025-01-29
