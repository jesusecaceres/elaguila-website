export type RentasAnuncioFormLang = "es" | "en";

export type RentasAnuncioFormCopy = {
  sectionTitle: string;
  titleLabel: string;
  rentalTypeLabel: string;
  rentalTypeHint: string;
  specifyOtherTypeLabel: string;
  specifyOtherTypeHint: string;
  conditionsLabel: string;
  conditionsHint: string;
  conditionsPlaceholder: string;
  monthlyRentLabel: string;
  monthlyRentHint: string;
  inListingText: string;
  rentReviewText: string;
  rentExampleText: string;
  depositLabel: string;
  depositHint: string;
  depositReviewText: string;
  depositExampleText: string;
  contractTermLabel: string;
  specifyTermLabel: string;
  specifyTermHint: string;
  specifyTermPlaceholder: string;
  availabilityLabel: string;
  availabilityHint: string;
  availabilityLegacyPrefix: string;
  availabilityLegacySuffix: string;
  furnishedLabel: string;
  furnishedOption: string;
  unfurnishedOption: string;
  petsLabel: string;
  petsAllowedOption: string;
  petsNotAllowedOption: string;
  servicesHeading: string;
  servicesHint: string;
  otherServiceLabel: string;
  specifyServiceLabel: string;
  specifyServiceHint: string;
  requirementsLabel: string;
  requirementsHint: string;
  listingStatusLabel: string;
  zoneLabel: string;
  zoneHint: string;
  addressLine1Label: string;
  addressLine1Hint: string;
  addressLine1Placeholder: string;
  addressLine2Label: string;
  addressLine2Hint: string;
  addressLine2Placeholder: string;
  showExactAddressLabel: string;
  showExactAddressHint: string;
  showExactAddressCheckbox: string;
  crossStreetLabel: string;
  crossStreetHint: string;
  crossStreetPlaceholder: string;
  cityLabel: string;
  cityHint: string;
  stateLabel: string;
  zipLabel: string;
  zipHint: string;
  countryLabel: string;
  countryHint: string;
  legacyLocationSummary: string;
  legacyLocationHint: string;
  previewLocationNote: string;
  descriptionLabel: string;
  descriptionHint: string;
};

export const RENTAS_ANUNCIO_FORM_COPY: Record<RentasAnuncioFormLang, RentasAnuncioFormCopy> = {
  es: {
    sectionTitle: "Anuncio",
    titleLabel: "Título",
    rentalTypeLabel: "Tipo de renta",
    rentalTypeHint: "Describe con más detalle qué ofreces; ayuda a la vista previa y a los resultados.",
    specifyOtherTypeLabel: "Especifica el tipo de renta",
    specifyOtherTypeHint: "Se mostrará tal como lo escribas (no solo \"Otro\").",
    conditionsLabel: "Condiciones importantes del alquiler",
    conditionsHint:
      "Agrega reglas, condiciones o detalles importantes del espacio. Evita lenguaje discriminatorio; enfócate en reglas del hogar, ocupación, uso del espacio y requisitos claros.",
    conditionsPlaceholder:
      "Ej. ambiente tranquilo, no fumar, máximo 1 persona, ideal para estudiante o trabajador, se requiere comprobante de ingresos…",
    monthlyRentLabel: "Renta mensual (USD)",
    monthlyRentHint: "Escribe solo números (sin símbolos). Abajo ves cómo quedará en el anuncio.",
    inListingText: "En el anuncio: ",
    rentReviewText: "Revisa el número (debe ser mayor que cero).",
    rentExampleText: "Ejemplo: al escribir 2500 se mostrará la renta en dólares con formato y \"/ mes\".",
    depositLabel: "Depósito (USD)",
    depositHint: "Solo números (dólares enteros). Sin \"/ mes\" en el anuncio.",
    depositReviewText: "Revisa el monto (debe ser mayor que cero).",
    depositExampleText: "Ejemplo: 10000 se mostrará como depósito en dólares con formato.",
    contractTermLabel: "Plazo del contrato",
    specifyTermLabel: "Especifica el plazo",
    specifyTermHint: "Ej. 3 meses renovable, temporada, contrato flexible…",
    specifyTermPlaceholder: "Ej. 3 meses renovable, temporada, contrato flexible…",
    availabilityLabel: "Disponibilidad",
    availabilityHint: "Elige la fecha en que estará disponible (o conserva un texto guardado antes).",
    availabilityLegacyPrefix: "Texto guardado anteriormente: «",
    availabilityLegacySuffix:
      "». Elige una fecha arriba para reemplazarlo, o déjalo y seguirá mostrándose así en el anuncio.",
    furnishedLabel: "Amueblado",
    furnishedOption: "Amueblado",
    unfurnishedOption: "Sin amueblar",
    petsLabel: "Mascotas",
    petsAllowedOption: "Permitidas",
    petsNotAllowedOption: "No permitidas",
    servicesHeading: "Servicios incluidos",
    servicesHint: "Marca lo que aplica. En el anuncio se listan en limpio, sin emojis.",
    otherServiceLabel: "Otro",
    specifyServiceLabel: "Especifica el servicio",
    specifyServiceHint: "Aparece junto a los demás en el anuncio.",
    requirementsLabel: "Requisitos",
    requirementsHint:
      "Ej. comprobante de ingresos, meses de depósito, carta de recomendación, verificación de antecedentes…",
    listingStatusLabel: "Estado del anuncio",
    zoneLabel: "Zona o vecindario",
    zoneHint: "Opcional. Barrio, colonia o referencia local (no sustituye la ciudad).",
    addressLine1Label: "Dirección línea 1",
    addressLine1Hint: "Calle y número para ubicar la propiedad.",
    addressLine1Placeholder: "Calle y número",
    addressLine2Label: "Dirección línea 2",
    addressLine2Hint: "Departamento, unidad, suite, edificio… (opcional).",
    addressLine2Placeholder: "Departamento, unidad, suite…",
    showExactAddressLabel: "Mostrar dirección exacta cuando aplique",
    showExactAddressHint:
      "Si no activas esta opción, mostraremos una ubicación aproximada. / If you do not enable this, we will show an approximate location.",
    showExactAddressCheckbox: "Permitir mostrar la dirección exacta en el anuncio.",
    crossStreetLabel: "Calles principales o cruce cercano (opcional)",
    crossStreetHint:
      "Si no quieres mostrar la dirección exacta, puedes indicar calles principales, un cruce cercano o una referencia general.",
    crossStreetPlaceholder: "Calles principales o cruce cercano",
    cityLabel: "Ciudad",
    cityHint: "Escribe y elige una sugerencia, o escribe la ciudad. Sirve para ubicación y filtros.",
    stateLabel: "Estado / Provincia",
    zipLabel: "Código postal",
    zipHint: "Código postal o ZIP (flexible, acepta cualquier formato).",
    countryLabel: "País",
    countryHint: "Escribe cualquier país o elige una sugerencia.",
    legacyLocationSummary: "Texto de ubicación adicional (borrador anterior)",
    legacyLocationHint: "Solo si necesitas conservar o editar un texto distinto a la dirección principal.",
    previewLocationNote:
      "Para vista previa indica la ciudad * y la referencia (dirección exacta o cruce cercano). El mapa se genera automáticamente a partir de la referencia reunida.",
    descriptionLabel: "Descripción principal",
    descriptionHint:
      "Describe la propiedad, el espacio, las reglas importantes y lo que debe saber la persona interesada.",
  },
  en: {
    sectionTitle: "Listing",
    titleLabel: "Title",
    rentalTypeLabel: "Rental type",
    rentalTypeHint: "Describe in more detail what you offer; helps preview and results.",
    specifyOtherTypeLabel: "Specify rental type",
    specifyOtherTypeHint: "Will be shown exactly as you write it (not just \"Other\").",
    conditionsLabel: "Important rental conditions",
    conditionsHint:
      "Add rules, conditions or important details about the space. Avoid discriminatory language; focus on house rules, occupancy, space use and clear requirements.",
    conditionsPlaceholder:
      "E.g. quiet environment, no smoking, max 1 person, ideal for student or worker, proof of income required…",
    monthlyRentLabel: "Monthly rent (USD)",
    monthlyRentHint: "Enter numbers only (no symbols). Below you'll see how it will appear in the listing.",
    inListingText: "In listing: ",
    rentReviewText: "Review the number (must be greater than zero).",
    rentExampleText: "Example: typing 2500 will display the rent in dollars formatted with \"/ month\".",
    depositLabel: "Deposit (USD)",
    depositHint: "Numbers only (whole dollars). No \"/ month\" in the listing.",
    depositReviewText: "Review the amount (must be greater than zero).",
    depositExampleText: "Example: 10000 will be displayed as a formatted dollar deposit.",
    contractTermLabel: "Contract term",
    specifyTermLabel: "Specify term",
    specifyTermHint: "E.g. 3 renewable months, seasonal, flexible contract…",
    specifyTermPlaceholder: "E.g. 3 renewable months, seasonal, flexible contract…",
    availabilityLabel: "Availability",
    availabilityHint: "Choose the date it will be available (or keep previously saved text).",
    availabilityLegacyPrefix: "Previously saved text: «",
    availabilityLegacySuffix:
      "». Choose a date above to replace it, or leave it and it will continue to show this way in the listing.",
    furnishedLabel: "Furnished",
    furnishedOption: "Furnished",
    unfurnishedOption: "Unfurnished",
    petsLabel: "Pets",
    petsAllowedOption: "Allowed",
    petsNotAllowedOption: "Not allowed",
    servicesHeading: "Utilities included",
    servicesHint: "Check what applies. In the listing they are listed cleanly, without emojis.",
    otherServiceLabel: "Other",
    specifyServiceLabel: "Specify the service",
    specifyServiceHint: "Appears alongside the others in the listing.",
    requirementsLabel: "Requirements",
    requirementsHint:
      "E.g. proof of income, months of deposit, recommendation letter, background check…",
    listingStatusLabel: "Listing status",
    zoneLabel: "Zone or neighborhood",
    zoneHint: "Optional. Neighborhood or local reference (does not replace the city).",
    addressLine1Label: "Address line 1",
    addressLine1Hint: "Street and number to locate the property.",
    addressLine1Placeholder: "Street and number",
    addressLine2Label: "Address line 2",
    addressLine2Hint: "Apartment, unit, suite, building… (optional).",
    addressLine2Placeholder: "Apartment, unit, suite…",
    showExactAddressLabel: "Show exact address when applicable",
    showExactAddressHint:
      "If you do not enable this option, we will show an approximate location.",
    showExactAddressCheckbox: "Allow the exact address to be shown in the listing.",
    crossStreetLabel: "Main streets or nearby cross street (optional)",
    crossStreetHint:
      "If you do not want to show the exact address, you can indicate main streets, a nearby cross street or a general reference.",
    crossStreetPlaceholder: "Main streets or nearby cross street",
    cityLabel: "City",
    cityHint: "Type and choose a suggestion, or enter the city. Used for location and filters.",
    stateLabel: "State / Province",
    zipLabel: "ZIP code",
    zipHint: "Postal code or ZIP (flexible, accepts any format).",
    countryLabel: "Country",
    countryHint: "Enter any country or choose a suggestion.",
    legacyLocationSummary: "Additional location text (previous draft)",
    legacyLocationHint: "Only if you need to keep or edit text different from the main address.",
    previewLocationNote:
      "For preview, enter the city * and a reference (exact address or nearby cross street). The map is generated automatically from the combined reference.",
    descriptionLabel: "Main description",
    descriptionHint:
      "Describe the property, the space, important rules and what interested people should know.",
  },
};

export function getRentasAnuncioFormCopy(lang: RentasAnuncioFormLang): RentasAnuncioFormCopy {
  return RENTAS_ANUNCIO_FORM_COPY[lang];
}
