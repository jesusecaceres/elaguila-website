import {
  DEFAULT_LOCALE,
  OFFICIAL_LOCALES,
  type OfficialLocale,
  type SupportedLang,
  launchUiCopyLang,
} from "@/app/lib/language";

type PluralCopy = {
  one: string;
  other: string;
};

export type RentasServicioIncluidoCopy = {
  water: string;
  electricity: string;
  gas: string;
  internet: string;
  maintenance: string;
  trash: string;
  parking: string;
  laundry: string;
  airConditioning: string;
  security: string;
  pool: string;
};

export type RentasRentalTypeCopy = {
  house: string;
  apartment: string;
  condominium: string;
  townhome: string;
  duplexMultifamily: string;
  aduCasita: string;
  studio: string;
  roomBedroom: string;
  sharedRoom: string;
  sharedSpace: string;
  garage: string;
  parking: string;
  storageUnit: string;
  office: string;
  commercialSpace: string;
  landLot: string;
  other: string;
};

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

export type LaunchUiMessages = {
  common: {
    language: string;
    loading: string;
    required: string;
  };
  actions: {
    back: string;
    preview: string;
    continue: string;
    selectOption: string;
  };
  forms: {
    city: string;
    stateProvince: string;
    postalCode: string;
    addressLine2: string;
  };
  filters: {
    resultCount: PluralCopy;
  };
  preview: {
    back: string;
    preview: string;
  };
  errors: {
    missingKey: string;
  };
  emptyStates: {
    noResults: string;
  };
  rentas: {
    form: RentasAnuncioFormCopy;
    services: RentasServicioIncluidoCopy;
    rentalTypes: RentasRentalTypeCopy;
  };
};

export const LEONIX_I18N_SCHEMA = {
  common: {
    language: "string",
    loading: "string",
    required: "string",
  },
  actions: {
    back: "string",
    preview: "string",
    continue: "string",
    selectOption: "string",
  },
  forms: {
    city: "string",
    stateProvince: "string",
    postalCode: "string",
    addressLine2: "string",
  },
  filters: {
    resultCount: {
      one: "string",
      other: "string",
    },
  },
  preview: {
    back: "string",
    preview: "string",
  },
  errors: {
    missingKey: "string",
  },
  emptyStates: {
    noResults: "string",
  },
  rentas: {
    form: {
      sectionTitle: "string",
      titleLabel: "string",
      rentalTypeLabel: "string",
      rentalTypeHint: "string",
      specifyOtherTypeLabel: "string",
      specifyOtherTypeHint: "string",
      conditionsLabel: "string",
      conditionsHint: "string",
      conditionsPlaceholder: "string",
      monthlyRentLabel: "string",
      monthlyRentHint: "string",
      inListingText: "string",
      rentReviewText: "string",
      rentExampleText: "string",
      depositLabel: "string",
      depositHint: "string",
      depositReviewText: "string",
      depositExampleText: "string",
      contractTermLabel: "string",
      specifyTermLabel: "string",
      specifyTermHint: "string",
      specifyTermPlaceholder: "string",
      availabilityLabel: "string",
      availabilityHint: "string",
      availabilityLegacyPrefix: "string",
      availabilityLegacySuffix: "string",
      furnishedLabel: "string",
      furnishedOption: "string",
      unfurnishedOption: "string",
      petsLabel: "string",
      petsAllowedOption: "string",
      petsNotAllowedOption: "string",
      servicesHeading: "string",
      servicesHint: "string",
      otherServiceLabel: "string",
      specifyServiceLabel: "string",
      specifyServiceHint: "string",
      requirementsLabel: "string",
      requirementsHint: "string",
      listingStatusLabel: "string",
      zoneLabel: "string",
      zoneHint: "string",
      addressLine1Label: "string",
      addressLine1Hint: "string",
      addressLine1Placeholder: "string",
      addressLine2Label: "string",
      addressLine2Hint: "string",
      addressLine2Placeholder: "string",
      showExactAddressLabel: "string",
      showExactAddressHint: "string",
      showExactAddressCheckbox: "string",
      crossStreetLabel: "string",
      crossStreetHint: "string",
      crossStreetPlaceholder: "string",
      cityLabel: "string",
      cityHint: "string",
      stateLabel: "string",
      zipLabel: "string",
      zipHint: "string",
      countryLabel: "string",
      countryHint: "string",
      legacyLocationSummary: "string",
      legacyLocationHint: "string",
      previewLocationNote: "string",
      descriptionLabel: "string",
      descriptionHint: "string",
    },
    services: {
      water: "string",
      electricity: "string",
      gas: "string",
      internet: "string",
      maintenance: "string",
      trash: "string",
      parking: "string",
      laundry: "string",
      airConditioning: "string",
      security: "string",
      pool: "string",
    },
    rentalTypes: {
      house: "string",
      apartment: "string",
      condominium: "string",
      townhome: "string",
      duplexMultifamily: "string",
      aduCasita: "string",
      studio: "string",
      roomBedroom: "string",
      sharedRoom: "string",
      sharedSpace: "string",
      garage: "string",
      parking: "string",
      storageUnit: "string",
      office: "string",
      commercialSpace: "string",
      landLot: "string",
      other: "string",
    },
  },
} as const;

const esForm = {
  sectionTitle: "Anuncio",
  titleLabel: "Titulo",
  rentalTypeLabel: "Tipo de renta",
  rentalTypeHint: "Describe con mas detalle que ofreces; ayuda a la vista previa y a los resultados.",
  specifyOtherTypeLabel: "Especifica el tipo de renta",
  specifyOtherTypeHint: "Se mostrara tal como lo escribas, no solo como Otro.",
  conditionsLabel: "Condiciones importantes del alquiler",
  conditionsHint:
    "Agrega reglas, condiciones o detalles importantes del espacio. Evita lenguaje discriminatorio; enfocate en reglas del hogar, ocupacion, uso del espacio y requisitos claros.",
  conditionsPlaceholder:
    "Ej. ambiente tranquilo, no fumar, maximo 1 persona, ideal para estudiante o trabajador, se requiere comprobante de ingresos...",
  monthlyRentLabel: "Renta mensual (USD)",
  monthlyRentHint: "Escribe solo numeros (sin simbolos). Abajo ves como quedara en el anuncio.",
  inListingText: "En el anuncio: ",
  rentReviewText: "Revisa el numero (debe ser mayor que cero).",
  rentExampleText: "Ejemplo: al escribir 2500 se mostrara la renta en dolares con formato y \"/ mes\".",
  depositLabel: "Deposito (USD)",
  depositHint: "Solo numeros (dolares enteros). Sin \"/ mes\" en el anuncio.",
  depositReviewText: "Revisa el monto (debe ser mayor que cero).",
  depositExampleText: "Ejemplo: 10000 se mostrara como deposito en dolares con formato.",
  contractTermLabel: "Plazo del contrato",
  specifyTermLabel: "Especifica el plazo",
  specifyTermHint: "Ej. 3 meses renovable, temporada, contrato flexible...",
  specifyTermPlaceholder: "Ej. 3 meses renovable, temporada, contrato flexible...",
  availabilityLabel: "Disponibilidad",
  availabilityHint: "Elige la fecha en que estara disponible (o conserva un texto guardado antes).",
  availabilityLegacyPrefix: "Texto guardado anteriormente: \"",
  availabilityLegacySuffix:
    "\". Elige una fecha arriba para reemplazarlo, o dejalo y seguira mostrandose asi en el anuncio.",
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
  specifyServiceHint: "Aparece junto a los demas en el anuncio.",
  requirementsLabel: "Requisitos",
  requirementsHint:
    "Ej. comprobante de ingresos, meses de deposito, carta de recomendacion, verificacion de antecedentes...",
  listingStatusLabel: "Estado del anuncio",
  zoneLabel: "Zona o vecindario",
  zoneHint: "Opcional. Barrio, colonia o referencia local (no sustituye la ciudad).",
  addressLine1Label: "Direccion linea 1",
  addressLine1Hint: "Calle y numero para ubicar la propiedad.",
  addressLine1Placeholder: "Calle y numero",
  addressLine2Label: "Direccion linea 2",
  addressLine2Hint: "Departamento, unidad, suite, edificio... (opcional).",
  addressLine2Placeholder: "Departamento, unidad, suite...",
  showExactAddressLabel: "Mostrar direccion exacta cuando aplique",
  showExactAddressHint: "Si no activas esta opcion, mostraremos una ubicacion aproximada.",
  showExactAddressCheckbox: "Permitir mostrar la direccion exacta en el anuncio.",
  crossStreetLabel: "Calles principales o cruce cercano (opcional)",
  crossStreetHint:
    "Si no quieres mostrar la direccion exacta, puedes indicar calles principales, un cruce cercano o una referencia general.",
  crossStreetPlaceholder: "Calles principales o cruce cercano",
  cityLabel: "Ciudad",
  cityHint: "Escribe y elige una sugerencia, o escribe la ciudad. Sirve para ubicacion y filtros.",
  stateLabel: "Estado / Provincia",
  zipLabel: "Codigo postal",
  zipHint: "Codigo postal o ZIP (flexible, acepta cualquier formato).",
  countryLabel: "Pais",
  countryHint: "Escribe cualquier pais o elige una sugerencia.",
  legacyLocationSummary: "Texto de ubicacion adicional (borrador anterior)",
  legacyLocationHint: "Solo si necesitas conservar o editar un texto distinto a la direccion principal.",
  previewLocationNote:
    "Para vista previa indica la ciudad * y la referencia (direccion exacta o cruce cercano). El mapa se genera automaticamente a partir de la referencia reunida.",
  descriptionLabel: "Descripcion principal",
  descriptionHint:
    "Describe la propiedad, el espacio, las reglas importantes y lo que debe saber la persona interesada.",
} satisfies RentasAnuncioFormCopy;

const enForm = {
  sectionTitle: "Listing",
  titleLabel: "Title",
  rentalTypeLabel: "Rental type",
  rentalTypeHint: "Describe in more detail what you offer; this helps preview and results.",
  specifyOtherTypeLabel: "Specify rental type",
  specifyOtherTypeHint: "Will be shown exactly as you write it, not just as Other.",
  conditionsLabel: "Important rental conditions",
  conditionsHint:
    "Add rules, conditions, or important details about the space. Avoid discriminatory language; focus on house rules, occupancy, space use, and clear requirements.",
  conditionsPlaceholder:
    "E.g. quiet environment, no smoking, max 1 person, ideal for student or worker, proof of income required...",
  monthlyRentLabel: "Monthly rent (USD)",
  monthlyRentHint: "Enter numbers only (no symbols). Below you will see how it appears in the listing.",
  inListingText: "In listing: ",
  rentReviewText: "Review the number (must be greater than zero).",
  rentExampleText: "Example: typing 2500 will display the rent in dollars formatted with \"/ month\".",
  depositLabel: "Deposit (USD)",
  depositHint: "Numbers only (whole dollars). No \"/ month\" in the listing.",
  depositReviewText: "Review the amount (must be greater than zero).",
  depositExampleText: "Example: 10000 will be displayed as a formatted dollar deposit.",
  contractTermLabel: "Contract term",
  specifyTermLabel: "Specify term",
  specifyTermHint: "E.g. 3 renewable months, seasonal, flexible contract...",
  specifyTermPlaceholder: "E.g. 3 renewable months, seasonal, flexible contract...",
  availabilityLabel: "Availability",
  availabilityHint: "Choose the date it will be available, or keep previously saved text.",
  availabilityLegacyPrefix: "Previously saved text: \"",
  availabilityLegacySuffix:
    "\". Choose a date above to replace it, or leave it and it will continue to show this way in the listing.",
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
    "E.g. proof of income, months of deposit, recommendation letter, background check...",
  listingStatusLabel: "Listing status",
  zoneLabel: "Zone or neighborhood",
  zoneHint: "Optional. Neighborhood or local reference (does not replace the city).",
  addressLine1Label: "Address line 1",
  addressLine1Hint: "Street and number to locate the property.",
  addressLine1Placeholder: "Street and number",
  addressLine2Label: "Address line 2",
  addressLine2Hint: "Apartment, unit, suite, building... (optional).",
  addressLine2Placeholder: "Apartment, unit, suite...",
  showExactAddressLabel: "Show exact address when applicable",
  showExactAddressHint: "If you do not enable this option, we will show an approximate location.",
  showExactAddressCheckbox: "Allow the exact address to be shown in the listing.",
  crossStreetLabel: "Main streets or nearby cross street (optional)",
  crossStreetHint:
    "If you do not want to show the exact address, you can indicate main streets, a nearby cross street, or a general reference.",
  crossStreetPlaceholder: "Main streets or nearby cross street",
  cityLabel: "City",
  cityHint: "Type and choose a suggestion, or enter the city. Used for location and filters.",
  stateLabel: "State / Province",
  zipLabel: "Postal code",
  zipHint: "Postal code or ZIP (flexible, accepts any format).",
  countryLabel: "Country",
  countryHint: "Enter any country or choose a suggestion.",
  legacyLocationSummary: "Additional location text (previous draft)",
  legacyLocationHint: "Only if you need to keep or edit text different from the main address.",
  previewLocationNote:
    "For preview, enter the city * and a reference (exact address or nearby cross street). The map is generated automatically from the combined reference.",
  descriptionLabel: "Main description",
  descriptionHint:
    "Describe the property, the space, important rules, and what interested people should know.",
} satisfies RentasAnuncioFormCopy;

const ptForm = {
  sectionTitle: "Anuncio",
  titleLabel: "Titulo",
  rentalTypeLabel: "Tipo de aluguel",
  rentalTypeHint: "Descreva com mais detalhe o que voce oferece; isso ajuda a previa e os resultados.",
  specifyOtherTypeLabel: "Especifique o tipo de aluguel",
  specifyOtherTypeHint: "Sera mostrado exatamente como voce escrever, nao apenas como Outro.",
  conditionsLabel: "Condicoes importantes do aluguel",
  conditionsHint:
    "Adicione regras, condicoes ou detalhes importantes do espaco. Evite linguagem discriminatoria; foque em regras da casa, ocupacao, uso do espaco e requisitos claros.",
  conditionsPlaceholder:
    "Ex. ambiente tranquilo, nao fumar, maximo 1 pessoa, ideal para estudante ou trabalhador, comprovante de renda exigido...",
  monthlyRentLabel: "Aluguel mensal (USD)",
  monthlyRentHint: "Digite apenas numeros (sem simbolos). Abaixo voce vera como aparecera no anuncio.",
  inListingText: "No anuncio: ",
  rentReviewText: "Revise o numero (deve ser maior que zero).",
  rentExampleText: "Exemplo: ao digitar 2500, o aluguel sera exibido em dolares com formato e \"/ mes\".",
  depositLabel: "Deposito (USD)",
  depositHint: "Apenas numeros (dolares inteiros). Sem \"/ mes\" no anuncio.",
  depositReviewText: "Revise o valor (deve ser maior que zero).",
  depositExampleText: "Exemplo: 10000 sera exibido como deposito em dolares formatado.",
  contractTermLabel: "Prazo do contrato",
  specifyTermLabel: "Especifique o prazo",
  specifyTermHint: "Ex. 3 meses renovaveis, temporada, contrato flexivel...",
  specifyTermPlaceholder: "Ex. 3 meses renovaveis, temporada, contrato flexivel...",
  availabilityLabel: "Disponibilidade",
  availabilityHint: "Escolha a data em que estara disponivel, ou mantenha um texto salvo antes.",
  availabilityLegacyPrefix: "Texto salvo anteriormente: \"",
  availabilityLegacySuffix:
    "\". Escolha uma data acima para substituir, ou deixe como esta para continuar aparecendo assim no anuncio.",
  furnishedLabel: "Mobiliado",
  furnishedOption: "Mobiliado",
  unfurnishedOption: "Sem mobilia",
  petsLabel: "Animais de estimacao",
  petsAllowedOption: "Permitidos",
  petsNotAllowedOption: "Nao permitidos",
  servicesHeading: "Servicos incluidos",
  servicesHint: "Marque o que se aplica. No anuncio, eles aparecem de forma limpa, sem emojis.",
  otherServiceLabel: "Outro",
  specifyServiceLabel: "Especifique o servico",
  specifyServiceHint: "Aparece junto com os demais no anuncio.",
  requirementsLabel: "Requisitos",
  requirementsHint:
    "Ex. comprovante de renda, meses de deposito, carta de recomendacao, verificacao de antecedentes...",
  listingStatusLabel: "Status do anuncio",
  zoneLabel: "Zona ou bairro",
  zoneHint: "Opcional. Bairro ou referencia local (nao substitui a cidade).",
  addressLine1Label: "Endereco linha 1",
  addressLine1Hint: "Rua e numero para localizar a propriedade.",
  addressLine1Placeholder: "Rua e numero",
  addressLine2Label: "Endereco linha 2",
  addressLine2Hint: "Apartamento, unidade, suite, edificio... (opcional).",
  addressLine2Placeholder: "Apartamento, unidade, suite...",
  showExactAddressLabel: "Mostrar endereco exato quando aplicavel",
  showExactAddressHint: "Se voce nao ativar esta opcao, mostraremos uma localizacao aproximada.",
  showExactAddressCheckbox: "Permitir mostrar o endereco exato no anuncio.",
  crossStreetLabel: "Ruas principais ou cruzamento proximo (opcional)",
  crossStreetHint:
    "Se nao quiser mostrar o endereco exato, indique ruas principais, um cruzamento proximo ou uma referencia geral.",
  crossStreetPlaceholder: "Ruas principais ou cruzamento proximo",
  cityLabel: "Cidade",
  cityHint: "Digite e escolha uma sugestao, ou informe a cidade. Usado para localizacao e filtros.",
  stateLabel: "Estado / Provincia",
  zipLabel: "Codigo postal",
  zipHint: "Codigo postal ou ZIP (flexivel, aceita qualquer formato).",
  countryLabel: "Pais",
  countryHint: "Digite qualquer pais ou escolha uma sugestao.",
  legacyLocationSummary: "Texto adicional de localizacao (rascunho anterior)",
  legacyLocationHint: "Somente se voce precisar manter ou editar um texto diferente do endereco principal.",
  previewLocationNote:
    "Para a previa, informe a cidade * e uma referencia (endereco exato ou cruzamento proximo). O mapa e gerado automaticamente a partir da referencia combinada.",
  descriptionLabel: "Descricao principal",
  descriptionHint:
    "Descreva a propriedade, o espaco, regras importantes e o que pessoas interessadas devem saber.",
} satisfies RentasAnuncioFormCopy;

const tlForm = {
  sectionTitle: "Listing",
  titleLabel: "Pamagat",
  rentalTypeLabel: "Uri ng paupahan",
  rentalTypeHint: "Ilarawan nang mas malinaw ang inaalok mo; nakakatulong ito sa preview at results.",
  specifyOtherTypeLabel: "Tukuyin ang uri ng paupahan",
  specifyOtherTypeHint: "Ipapakita ito gaya ng isinulat mo, hindi lang bilang Other.",
  conditionsLabel: "Mahahalagang kondisyon sa pag-upa",
  conditionsHint:
    "Magdagdag ng rules, kondisyon, o mahahalagang detalye tungkol sa space. Iwasan ang discriminatory language; ituon sa house rules, occupancy, paggamit ng space, at malinaw na requirements.",
  conditionsPlaceholder:
    "Hal. tahimik na lugar, bawal manigarilyo, max 1 tao, bagay sa student o worker, kailangan ng proof of income...",
  monthlyRentLabel: "Buwanang upa (USD)",
  monthlyRentHint: "Numbers only (walang symbols). Makikita sa ibaba kung paano lalabas sa listing.",
  inListingText: "Sa listing: ",
  rentReviewText: "Suriin ang numero (dapat higit sa zero).",
  rentExampleText: "Halimbawa: kapag nag-type ng 2500, lalabas ang upa sa dollars na may format at \"/ month\".",
  depositLabel: "Deposit (USD)",
  depositHint: "Numbers only (whole dollars). Walang \"/ month\" sa listing.",
  depositReviewText: "Suriin ang halaga (dapat higit sa zero).",
  depositExampleText: "Halimbawa: 10000 ay lalabas bilang formatted dollar deposit.",
  contractTermLabel: "Tagal ng kontrata",
  specifyTermLabel: "Tukuyin ang tagal",
  specifyTermHint: "Hal. 3 renewable months, seasonal, flexible contract...",
  specifyTermPlaceholder: "Hal. 3 renewable months, seasonal, flexible contract...",
  availabilityLabel: "Availability",
  availabilityHint: "Piliin ang petsa kung kailan available, o panatilihin ang dating saved text.",
  availabilityLegacyPrefix: "Dating saved text: \"",
  availabilityLegacySuffix:
    "\". Pumili ng petsa sa itaas para palitan ito, o hayaan ito at ganito pa rin lalabas sa listing.",
  furnishedLabel: "May gamit",
  furnishedOption: "May gamit",
  unfurnishedOption: "Walang gamit",
  petsLabel: "Pets",
  petsAllowedOption: "Pinapayagan",
  petsNotAllowedOption: "Hindi pinapayagan",
  servicesHeading: "Kasamang utilities",
  servicesHint: "I-check ang applicable. Sa listing, malinis itong ililista, walang emojis.",
  otherServiceLabel: "Iba pa",
  specifyServiceLabel: "Tukuyin ang serbisyo",
  specifyServiceHint: "Lalabas kasama ng iba sa listing.",
  requirementsLabel: "Requirements",
  requirementsHint:
    "Hal. proof of income, months of deposit, recommendation letter, background check...",
  listingStatusLabel: "Listing status",
  zoneLabel: "Zone o neighborhood",
  zoneHint: "Optional. Neighborhood o local reference (hindi kapalit ng city).",
  addressLine1Label: "Address line 1",
  addressLine1Hint: "Street at number para ma-locate ang property.",
  addressLine1Placeholder: "Street at number",
  addressLine2Label: "Address line 2",
  addressLine2Hint: "Apartment, unit, suite, building... (optional).",
  addressLine2Placeholder: "Apartment, unit, suite...",
  showExactAddressLabel: "Ipakita ang exact address kapag applicable",
  showExactAddressHint: "Kung hindi mo ito i-enable, approximate location ang ipapakita namin.",
  showExactAddressCheckbox: "Payagan na ipakita ang exact address sa listing.",
  crossStreetLabel: "Main streets o malapit na cross street (optional)",
  crossStreetHint:
    "Kung ayaw mong ipakita ang exact address, puwede kang maglagay ng main streets, nearby cross street, o general reference.",
  crossStreetPlaceholder: "Main streets o malapit na cross street",
  cityLabel: "City",
  cityHint: "Mag-type at pumili ng suggestion, o ilagay ang city. Ginagamit para sa location at filters.",
  stateLabel: "State / Province",
  zipLabel: "Postal code",
  zipHint: "Postal code o ZIP (flexible, tumatanggap ng anumang format).",
  countryLabel: "Country",
  countryHint: "Maglagay ng anumang country o pumili ng suggestion.",
  legacyLocationSummary: "Karagdagang location text (dating draft)",
  legacyLocationHint: "Kung kailangan mo lang panatilihin o i-edit ang text na iba sa main address.",
  previewLocationNote:
    "Para sa preview, ilagay ang city * at reference (exact address o nearby cross street). Awtomatikong ginagawa ang mapa mula sa pinagsamang reference.",
  descriptionLabel: "Main description",
  descriptionHint:
    "Ilarawan ang property, space, mahahalagang rules, at dapat malaman ng interested people.",
} satisfies RentasAnuncioFormCopy;

const services = {
  es: {
    water: "Agua",
    electricity: "Luz",
    gas: "Gas",
    internet: "Internet",
    maintenance: "Mantenimiento",
    trash: "Basura",
    parking: "Estacionamiento",
    laundry: "Lavanderia",
    airConditioning: "Aire acondicionado",
    security: "Seguridad",
    pool: "Piscina",
  },
  en: {
    water: "Water",
    electricity: "Electricity",
    gas: "Gas",
    internet: "Internet",
    maintenance: "Maintenance",
    trash: "Trash",
    parking: "Parking",
    laundry: "Laundry",
    airConditioning: "Air conditioning",
    security: "Security",
    pool: "Pool",
  },
  pt: {
    water: "Agua",
    electricity: "Eletricidade",
    gas: "Gas",
    internet: "Internet",
    maintenance: "Manutencao",
    trash: "Lixo",
    parking: "Estacionamento",
    laundry: "Lavanderia",
    airConditioning: "Ar-condicionado",
    security: "Seguranca",
    pool: "Piscina",
  },
  tl: {
    water: "Tubig",
    electricity: "Kuryente",
    gas: "Gas",
    internet: "Internet",
    maintenance: "Maintenance",
    trash: "Basura",
    parking: "Parking",
    laundry: "Laundry",
    airConditioning: "Air conditioning",
    security: "Security",
    pool: "Pool",
  },
} satisfies Record<OfficialLocale, RentasServicioIncluidoCopy>;

const rentalTypes = {
  es: {
    house: "Casa",
    apartment: "Apartamento",
    condominium: "Condominio",
    townhome: "Townhome",
    duplexMultifamily: "Duplex / Multifamiliar",
    aduCasita: "ADU / Casita",
    studio: "Estudio",
    roomBedroom: "Cuarto / Recamara",
    sharedRoom: "Cuarto compartido",
    sharedSpace: "Espacio compartido",
    garage: "Garaje",
    parking: "Estacionamiento",
    storageUnit: "Bodega / Almacen",
    office: "Oficina",
    commercialSpace: "Local comercial",
    landLot: "Terreno / Lote",
    other: "Otro",
  },
  en: {
    house: "House",
    apartment: "Apartment",
    condominium: "Condominium",
    townhome: "Townhome",
    duplexMultifamily: "Duplex / Multifamily",
    aduCasita: "ADU / Casita",
    studio: "Studio",
    roomBedroom: "Room / Bedroom",
    sharedRoom: "Shared room",
    sharedSpace: "Shared space",
    garage: "Garage",
    parking: "Parking",
    storageUnit: "Storage unit",
    office: "Office",
    commercialSpace: "Commercial space",
    landLot: "Land / lot",
    other: "Other",
  },
  pt: {
    house: "Casa",
    apartment: "Apartamento",
    condominium: "Condominio",
    townhome: "Townhome",
    duplexMultifamily: "Duplex / Multifamiliar",
    aduCasita: "ADU / Casita",
    studio: "Estudio",
    roomBedroom: "Quarto",
    sharedRoom: "Quarto compartilhado",
    sharedSpace: "Espaco compartilhado",
    garage: "Garagem",
    parking: "Estacionamento",
    storageUnit: "Deposito",
    office: "Escritorio",
    commercialSpace: "Espaco comercial",
    landLot: "Terreno / Lote",
    other: "Outro",
  },
  tl: {
    house: "Bahay",
    apartment: "Apartment",
    condominium: "Condominium",
    townhome: "Townhome",
    duplexMultifamily: "Duplex / Multifamily",
    aduCasita: "ADU / Casita",
    studio: "Studio",
    roomBedroom: "Room / Bedroom",
    sharedRoom: "Shared room",
    sharedSpace: "Shared space",
    garage: "Garage",
    parking: "Parking",
    storageUnit: "Storage unit",
    office: "Office",
    commercialSpace: "Commercial space",
    landLot: "Land / lot",
    other: "Iba pa",
  },
} satisfies Record<OfficialLocale, RentasRentalTypeCopy>;

export const LAUNCH_UI_DICTIONARIES = {
  es: {
    common: { language: "Idioma", loading: "Cargando...", required: "Requerido" },
    actions: { back: "Volver", preview: "Vista previa", continue: "Continuar", selectOption: "Selecciona una opcion" },
    forms: { city: "Ciudad", stateProvince: "Estado / Provincia", postalCode: "Codigo postal", addressLine2: "Direccion linea 2" },
    filters: { resultCount: { one: "{count} resultado", other: "{count} resultados" } },
    preview: { back: "Volver", preview: "Vista previa" },
    errors: { missingKey: "Falta una traduccion de interfaz." },
    emptyStates: { noResults: "No hay resultados." },
    rentas: { form: esForm, services: services.es, rentalTypes: rentalTypes.es },
  },
  en: {
    common: { language: "Language", loading: "Loading...", required: "Required" },
    actions: { back: "Back", preview: "Preview", continue: "Continue", selectOption: "Select an option" },
    forms: { city: "City", stateProvince: "State / Province", postalCode: "Postal code", addressLine2: "Address line 2" },
    filters: { resultCount: { one: "{count} result", other: "{count} results" } },
    preview: { back: "Back", preview: "Preview" },
    errors: { missingKey: "Missing UI translation." },
    emptyStates: { noResults: "No results." },
    rentas: { form: enForm, services: services.en, rentalTypes: rentalTypes.en },
  },
  pt: {
    common: { language: "Idioma", loading: "Carregando...", required: "Obrigatorio" },
    actions: { back: "Voltar", preview: "Previa", continue: "Continuar", selectOption: "Selecione uma opcao" },
    forms: { city: "Cidade", stateProvince: "Estado / Provincia", postalCode: "Codigo postal", addressLine2: "Endereco linha 2" },
    filters: { resultCount: { one: "{count} resultado", other: "{count} resultados" } },
    preview: { back: "Voltar", preview: "Previa" },
    errors: { missingKey: "Traducao de interface ausente." },
    emptyStates: { noResults: "Nenhum resultado." },
    rentas: { form: ptForm, services: services.pt, rentalTypes: rentalTypes.pt },
  },
  tl: {
    common: { language: "Wika", loading: "Naglo-load...", required: "Required" },
    actions: { back: "Bumalik", preview: "Preview", continue: "Magpatuloy", selectOption: "Pumili ng option" },
    forms: { city: "City", stateProvince: "State / Province", postalCode: "Postal code", addressLine2: "Address line 2" },
    filters: { resultCount: { one: "{count} result", other: "{count} results" } },
    preview: { back: "Bumalik", preview: "Preview" },
    errors: { missingKey: "May kulang na UI translation." },
    emptyStates: { noResults: "Walang results." },
    rentas: { form: tlForm, services: services.tl, rentalTypes: rentalTypes.tl },
  },
} satisfies Record<OfficialLocale, LaunchUiMessages>;

export function getLaunchUiMessages(lang: SupportedLang | OfficialLocale): LaunchUiMessages {
  const locale = launchUiCopyLang(lang);
  const messages = LAUNCH_UI_DICTIONARIES[locale] ?? LAUNCH_UI_DICTIONARIES[DEFAULT_LOCALE];
  if (process.env.NODE_ENV !== "production" && !LAUNCH_UI_DICTIONARIES[locale]) {
    console.error(`[i18n] Missing launch UI dictionary for locale "${locale}".`);
  }
  return messages;
}

export function tLaunchUi(path: string, lang: SupportedLang | OfficialLocale): string {
  const locale = launchUiCopyLang(lang);
  const messages = getLaunchUiMessages(locale) as unknown as Record<string, unknown>;
  const value = path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object" && key in node) return (node as Record<string, unknown>)[key];
    return undefined;
  }, messages);
  if (typeof value === "string") return value;
  const fallback = path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object" && key in node) return (node as Record<string, unknown>)[key];
    return undefined;
  }, LAUNCH_UI_DICTIONARIES[DEFAULT_LOCALE] as unknown as Record<string, unknown>);
  console.error(`[i18n] Missing launch UI key "${path}" for locale "${locale}".`);
  if (typeof fallback === "string") return process.env.NODE_ENV === "production" ? fallback : `[[${path}]]`;
  return process.env.NODE_ENV === "production" ? "" : `[[${path}]]`;
}

export { OFFICIAL_LOCALES };
