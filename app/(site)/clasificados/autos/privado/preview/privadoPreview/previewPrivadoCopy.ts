export type PreviewPrivadoLang = "es" | "en";

export function previewPrivadoCopy(lang: PreviewPrivadoLang) {
  const es = lang === "es";
  return {
    previewKicker: es ? "Vista previa del anuncio" : "Listing preview",
    backToEdit: es ? "Volver a editar" : "Back to edit",
    privateSeller: es ? "Vendedor privado" : "Private seller",
    priceLabel: es ? "Precio" : "Price",
    mileage: es ? "Millaje" : "Mileage",
    location: es ? "Ubicación" : "Location",
    vin: "VIN",
    gallery: es ? "Galería" : "Gallery",
    watchVideo: es ? "Ver video" : "Watch video",
    videoPreviewNote: es
      ? "Video incluido por el vendedor. En esta vista previa no se abre un sitio externo."
      : "Seller-provided video. This preview does not open an external site.",
    close: es ? "Cerrar" : "Close",
    prev: es ? "Anterior" : "Previous",
    next: es ? "Siguiente" : "Next",
    specsEyebrow: es ? "Ficha" : "Specs",
    specsTitle: es ? "Datos del vehículo" : "Vehicle details",
    compactTransmission: es ? "Transmisión" : "Transmission",
    compactDrivetrain: es ? "Tracción" : "Drivetrain",
    compactEngine: es ? "Motor" : "Engine",
    featuresEyebrow: es ? "Equipamiento" : "Equipment",
    featuresTitle: es ? "Características" : "Features",
    featuresChecklist: es ? "Equipamiento seleccionado" : "Selected equipment",
    featuresCustom: es ? "Mejoras agregadas por el vendedor" : "Seller-added upgrades",
    descriptionEyebrow: es ? "Descripción" : "Description",
    descriptionTitle: es ? "Descripción del vehículo" : "Vehicle description",
    contactHeading: es ? "Contacto del vendedor" : "Seller contact",
    call: es ? "Llamar" : "Call",
    whatsapp: "WhatsApp",
    email: es ? "Enviar correo" : "Email seller",
    sms: es ? "Enviar SMS" : "Text seller",
    siteMessage: es ? "Mensaje en el sitio" : "Message on site",
    meetingNote: es ? "Nota para reunirse" : "Meeting note",
    previewActionTitle: es ? "Vista previa" : "Preview",
    previewActionBody: es
      ? "Esta acción estará disponible para compradores cuando el anuncio esté publicado. Aquí solo se muestra el dato real que ingresaste."
      : "This action will be available to buyers when the listing is published. Here we only show the real information you entered.",
    copied: es ? "Copiado" : "Copied",
    copyValue: es ? "Copiar dato" : "Copy detail",
    share: es ? "Copiar enlace de vista previa" : "Copy preview link",
    print: es ? "Imprimir vista previa" : "Print preview",
    trustClear: es ? "Información clara" : "Clear information",
    trustDirect: es ? "Contacto directo" : "Direct contact",
    trustReview: es ? "Publicación en revisión" : "Listing in review",
    trustSupport: es ? "Soporte Leonix" : "Leonix support",
    safetyTitle: es ? "Contacto seguro" : "Safe contact",
    safetyBody: es
      ? "Coordina un lugar público y seguro para ver el vehículo. Leonix no verifica este anuncio en esta vista previa."
      : "Meet in a safe public place to see the vehicle. Leonix does not verify this listing in this preview.",
    milesSuffix: es ? "millas" : "miles",
    condition: {
      new: es ? "Nuevo" : "New",
      used: es ? "Auto usado" : "Used",
      certified: es ? "Certificado por el vendedor" : "Seller-listed certified",
    },
    specLabels: {
      mileage: es ? "Millaje" : "Mileage",
      exterior: es ? "Exterior" : "Exterior",
      interior: es ? "Interior" : "Interior",
      vin: "VIN",
      title: es ? "Título" : "Title status",
      condition: es ? "Condición" : "Condition",
      body: es ? "Carrocería" : "Body",
      fuel: es ? "Combustible" : "Fuel",
      engine: es ? "Motor" : "Engine",
      doors: es ? "Puertas" : "Doors",
      transmission: es ? "Transmisión" : "Transmission",
      drivetrain: es ? "Tracción" : "Drivetrain",
      seats: es ? "Asientos" : "Seats",
      mpg: "MPG",
    },
  };
}
