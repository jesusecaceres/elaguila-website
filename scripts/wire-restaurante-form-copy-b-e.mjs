import fs from "fs";

const path =
  "C:/projects/elaguila-website/app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
let s = fs.readFileSync(path, "utf8");

function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.warn("MISSING:", label);
    return;
  }
  s = s.replaceAll(oldStr, newStr);
  console.log("OK:", label);
}

// Section B
rep(
  `<p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            Los <strong>modos de servicio</strong> son opcionales. Por defecto se asume restaurante físico/local. Usa esta
            sección si el negocio también ofrece catering/eventos, delivery, takeout, reservas, etc. La selección mejora el
            listado pero no se requiere para vista previa.
          </p>`,
  "<p className=\"mt-2 text-xs text-[color:var(--lx-text-2)]\">{fc.sectionB.serviceModesIntro}</p>",
  "sectionB serviceModesIntro",
);
rep(
  `<HelperText>
            Marca <strong className="text-[color:var(--lx-text)]">Catering y eventos</strong> si necesitas la sección extra{" "}
            <strong>K</strong>. Usa <strong className="text-[color:var(--lx-text)]">Modos y servicios disponibles</strong>{" "}
            para la identidad de servicio en datos y vista previa.
          </HelperText>`,
  "<HelperText>{fc.sectionB.helper}</HelperText>",
  "sectionB helper",
);
rep(
  `<p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">
            Catering y eventos (stack K)
          </p>`,
  "<p className=\"mt-4 text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]\">{fc.sectionB.cateringStackLabel}</p>",
  "cateringStackLabel",
);
rep(
  `<div className="text-base font-bold text-[color:var(--lx-text)]">Catering y eventos</div>`,
  '<div className="text-base font-bold text-[color:var(--lx-text)]">{fc.sectionB.cateringCardTitle}</div>',
  "cateringCardTitle",
);
rep(
  `<p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">
                Activa la configuración de <strong className="text-[color:var(--lx-text-2)]">catering y eventos</strong>.
              </p>`,
  "<p className=\"mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]\">{fc.sectionB.cateringCardBody}</p>",
  "cateringCardBody",
);
rep("\n                  Catering\n", "\n                  {fc.sectionB.cateringCheckbox}\n", "cateringCheckbox");
rep("\n                  Comida para eventos\n", "\n                  {fc.sectionB.eventFoodCheckbox}\n", "eventFoodCheckbox");
rep(
  `<p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">Configuración de catering y eventos</p>`,
  '<p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">{fc.sectionB.cateringConfigTitle}</p>',
  "cateringConfigTitle",
);
rep("<FieldLabel optional>Tamaños de evento</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionB.eventSizesLabel}</FieldLabel>', "B eventSizesLabel");
rep("<HelperText>Capacidad de eventos que puedes atender.</HelperText>", "<HelperText>{fc.sectionB.eventSizesHelper}</HelperText>", "B eventSizesHelper");
rep("<FieldLabel optional>URL de consulta de catering</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionB.cateringInquiryUrlLabel}</FieldLabel>', "cateringInquiryUrlLabel");
rep("<HelperText>Enlace para que los clientes soliciten información de catering.</HelperText>", "<HelperText>{fc.sectionB.cateringInquiryUrlHelper}</HelperText>", "cateringInquiryUrlHelper");
rep(
  `<p className="text-sm font-semibold text-[color:var(--lx-text)]">
              Modos y servicios disponibles <span className="text-red-600">*</span>
            </p>`,
  '<p className="text-sm font-semibold text-[color:var(--lx-text)]">{fc.sectionB.serviceModesTitle} <span className="text-red-600">*</span></p>',
  "serviceModesTitle",
);
rep(
  `<p className="mt-2 text-sm text-[color:var(--lx-muted)]">
              Una sola lista para comer en local, para llevar, entrega, recogida, reservas, catering, eventos y más. Al
              menos una opción para la vista previa con validación.
            </p>`,
  '<p className="mt-2 text-sm text-[color:var(--lx-muted)]">{fc.sectionB.serviceModesBody}</p>',
  "serviceModesBody",
);
rep("<FieldLabel optional>Especifica el modo de servicio (Otro)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionB.serviceModeOtherLabel}</FieldLabel>', "serviceModeOtherLabel");
rep(
  `<HelperText>
                Texto corto que verá el cliente en la <strong className="text-[color:var(--lx-text-2)]">franja Servicio</strong>{" "}
                (información rápida) y como etiqueta «Modo: …» cuando aplique; forma parte de la identidad canónica igual que
                los demás modos marcados.
              </HelperText>`,
  "<HelperText>{fc.sectionB.serviceModeOtherHelper}</HelperText>",
  "serviceModeOtherHelper",
);
rep('placeholder="Ej. venta en ferias, solo suscripciones…"', 'placeholder={fc.sectionB.serviceModeOtherPlaceholder}', "serviceModeOtherPlaceholder");
rep(
  `<p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">Configuración de entrega</p>`,
  '<p className="text-sm font-semibold text-[color:var(--lx-text)] mb-3">{fc.sectionB.deliveryConfigTitle}</p>',
  "deliveryConfigTitle",
);
rep("<FieldLabel optional>Radio de entrega (millas)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionB.deliveryRadiusLabel}</FieldLabel>', "deliveryRadiusLabel");
rep(
  `<HelperText>
                  Alcance aproximado cuando ofreces <strong className="text-[color:var(--lx-text-2)]">entrega</strong>. Déjalo vacío si no entregas o si prefieres no especificar radio.
                </HelperText>`,
  "<HelperText>{fc.sectionB.deliveryRadiusHelper}</HelperText>",
  "deliveryRadiusHelper",
);

// Section C
rep(
  `<p className="mt-2 text-xs text-[color:var(--lx-text-2)]">
            <span className="font-semibold text-red-600">*</span> Completa cada día (cerrado u horario) o indica la situación
            con las notas de abajo — necesario para la vista previa estructural.
          </p>`,
  '<p className="mt-2 text-xs text-[color:var(--lx-text-2)]"><span className="font-semibold text-red-600">*</span> {fc.sectionC.requiredNote}</p>',
  "sectionC requiredNote",
);
rep(
  `<HelperText>
            La cuadrícula semanal es la base en la ficha. Las notas <strong>no sustituyen</strong> horarios salvo que así lo
            indiques; sirven para excepciones, feriados o cambios puntuales visibles junto al bloque de horas.
          </HelperText>`,
  "<HelperText>{fc.sectionC.helper}</HelperText>",
  "sectionC helper",
);
rep("<FieldLabel optional>Nota de horario especial</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionC.specialHoursLabel}</FieldLabel>', "specialHoursLabel");
rep(
  `<HelperText>
                Aviso <strong className="text-[color:var(--lx-text-2)]">recurrente o general</strong> (p. ej. «cerrado lunes
                festivos», «cocina cierra a las 9 pm»): no reemplaza la cuadrícula semanal. Se muestra en el resumen de horario cuando aplica y en el bloque
                «Horarios completos» bajo la lista de días.
              </HelperText>`,
  "<HelperText>{fc.sectionC.specialHoursHelper}</HelperText>",
  "specialHoursHelper",
);

// Section D
rep(
  `<p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            <span className="text-red-600">*</span> Al menos una vía de contacto (sitio, teléfono, correo, redes, menú/archivo,
            etc.) para la vista previa mínima.
          </p>`,
  '<p className="mt-2 text-sm text-[color:var(--lx-muted)]"><span className="text-red-600">*</span> {fc.sectionD.requiredNote}</p>',
  "sectionD requiredNote",
);
rep(
  `<HelperText>
            Los enlaces web se convierten en botones en la ficha. <strong className="text-[color:var(--lx-text-2)]">Menú URL</strong>{" "}
            abre la carta en el sitio del restaurante (vista previa: confirmación y luego pestaña nueva).{" "}
            <strong className="text-[color:var(--lx-text-2)]">Menú archivo</strong> se abre en un visor dentro de la vista previa
            (PDF/imagen). Si hay ambos, verás dos botones: menú en línea y carta en archivo; el bloque de contacto también puede
            repetir el archivo para descarga/visualización.
          </HelperText>`,
  "<HelperText>{fc.sectionD.helper}</HelperText>",
  "sectionD helper",
);
rep(
  `<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Contacto principal</p>`,
  '<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.primaryContactHeader}</p>',
  "primaryContactHeader",
);
rep("<FieldLabel optional>Sitio web</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.websiteLabel}</FieldLabel>', "websiteLabel");
rep("<HelperText>Destino principal de tu marca; botón «Sitio web» en la fila de acciones.</HelperText>", "<HelperText>{fc.sectionD.websiteHelper}</HelperText>", "websiteHelper");
rep("<FieldLabel optional>Teléfono</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.phoneLabel}</FieldLabel>', "phoneLabel");
rep("<HelperText>Visible y usable para «Llamar»; se formateará automáticamente como (408) 555-1234.</HelperText>", "<HelperText>{fc.sectionD.phoneHelper}</HelperText>", "phoneHelper");
rep("<FieldLabel optional>WhatsApp (número)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.whatsAppLabel}</FieldLabel>', "whatsAppLabel");
rep("<HelperText>Genera el botón de WhatsApp con el número en formato internacional.</HelperText>", "<HelperText>{fc.sectionD.whatsAppHelper}</HelperText>", "whatsAppHelper");
rep("<FieldLabel optional>Correo</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.emailLabel}</FieldLabel>', "emailLabel");
rep(
  `<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Redes sociales</p>`,
  '<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.socialHeader}</p>',
  "socialHeader",
);
rep(
  `<HelperText className="!mt-0">Enlaces a perfiles; iconos de plataforma en la ficha solo cuando completes la URL.</HelperText>`,
  '<HelperText className="!mt-0">{fc.sectionD.socialHelper}</HelperText>',
  "socialHelper",
);
s = s.replace(
  `[
                    ["instagramUrl", "Instagram (URL)"],
                    ["facebookUrl", "Facebook (URL)"],
                    ["tiktokUrl", "TikTok (URL)"],
                    ["youtubeUrl", "YouTube (URL)"],
                    ["snapchatUrl", "Snapchat (URL)"],
                    ["xTwitterUrl", "X / Twitter (URL)"],
                  ] as const`,
  `[
                    ["instagramUrl", fc.sectionD.instagramLabel],
                    ["facebookUrl", fc.sectionD.facebookLabel],
                    ["tiktokUrl", fc.sectionD.tiktokLabel],
                    ["youtubeUrl", fc.sectionD.youtubeLabel],
                    ["snapchatUrl", fc.sectionD.snapchatLabel],
                    ["xTwitterUrl", fc.sectionD.xTwitterLabel],
                  ] as const`,
);
rep(
  `<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Opiniones / reputación</p>`,
  '<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.reviewsHeader}</p>',
  "reviewsHeader",
);
rep(
  `<HelperText className="!mt-0">
                Enlaces opcionales a reseñas públicas; solo aparecen en la ficha cuando los completes.
              </HelperText>`,
  '<HelperText className="!mt-0">{fc.sectionD.reviewsHelper}</HelperText>',
  "reviewsHelper",
);
rep("<FieldLabel optional>Google reseñas o perfil</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.googleReviewsLabel}</FieldLabel>', "googleReviewsLabel");
rep(
  `<HelperText>
                    Enlace a tu perfil de Google o reseñas públicas. Aparece como acceso de opiniones cuando lo completas.
                  </HelperText>`,
  "<HelperText>{fc.sectionD.googleReviewsHelper}</HelperText>",
  "googleReviewsHelper",
);
rep("<FieldLabel optional>Yelp</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.yelpLabel}</FieldLabel>', "yelpLabel");
rep(
  `<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Acciones de restaurante</p>`,
  '<p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">{fc.sectionD.actionsHeader}</p>',
  "actionsHeader",
);
rep(
  `<HelperText className="!mt-0">
                Enlaces de reservas, pedidos y menú. El archivo de menú se abre en visor dentro de la vista previa.
              </HelperText>`,
  '<HelperText className="!mt-0">{fc.sectionD.actionsHelper}</HelperText>',
  "actionsHelper",
);
rep("<FieldLabel optional>Reservas (URL)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.reservationLabel}</FieldLabel>', "reservationLabel");
rep("<HelperText>Enlace directo a reservar. Botón «Reservar» si existe.</HelperText>", "<HelperText>{fc.sectionD.reservationHelper}</HelperText>", "reservationHelper");
rep("<FieldLabel optional>Pedidos (URL)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.orderLabel}</FieldLabel>', "orderLabel");
rep("<HelperText>Donde el cliente ordena en línea. Botón «Ordenar» si existe.</HelperText>", "<HelperText>{fc.sectionD.orderHelper}</HelperText>", "orderHelper");
rep("<FieldLabel optional>Menú (URL)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.menuUrlLabel}</FieldLabel>', "menuUrlLabel");
rep("<HelperText>Página pública donde está la carta en línea.</HelperText>", "<HelperText>{fc.sectionD.menuUrlHelper}</HelperText>", "menuUrlHelper");
rep("<FieldLabel optional>Menú (archivo — vista previa local)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionD.menuFileLabel}</FieldLabel>', "menuFileLabel");
rep(
  `<HelperText>
                    PDF o imagen de la carta guardada en el borrador de sesión.{" "}
                    <strong className="text-[color:var(--lx-text-2)]">Estado actual:</strong>{" "}
                    {draft.menuFile ? "✅ Archivo aceptado y listo para vista previa" : "⭕ Sin archivo"}
                  </HelperText>`,
  `<HelperText>
                    {fc.sectionD.menuFileHelperPrefix}{" "}
                    {draft.menuFile ? fc.sectionD.menuFileReady : fc.sectionD.menuFileEmpty}
                  </HelperText>`,
  "menuFileHelper",
);
rep('buttonLabel="Subir archivo"', 'buttonLabel={fc.common.uploadFile}', "uploadFile");
rep('helperText="PDF o imagen. Se guarda en el borrador de sesión."', 'helperText={fc.sectionD.menuFileUploadHelper}', "menuFileUploadHelper");
rep(
  'uploadLabels.menu ?? (draft.menuFile ? "✅ Archivo guardado en el borrador" : null)',
  "uploadLabels.menu ?? (draft.menuFile ? fc.common.fileSavedInDraft : null)",
  "menu file saved label",
);
rep('<span className="text-xs font-medium text-green-700">✅ Archivo aceptado</span>', '<span className="text-xs font-medium text-green-700">{fc.common.fileAccepted}</span>', "fileAccepted");
rep("\n                        Quitar archivo\n", "\n                        {fc.common.removeFile}\n", "removeFile");

// Section E
rep(
  `<HelperText>
            Esta dirección se usa para mostrar a los clientes dónde está tu restaurante y para generar el botón de mapa /
            direcciones en la ficha.
          </HelperText>`,
  "<HelperText>{fc.sectionE.intro}</HelperText>",
  "sectionE intro",
);
rep("<FieldLabel optional>Dirección / número y calle</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionE.addressLine1Label}</FieldLabel>', "addressLine1Label");
rep("<HelperText>Calle y número del local.</HelperText>", "<HelperText>{fc.sectionE.addressLine1Helper}</HelperText>", "addressLine1Helper");
rep("<FieldLabel optional>Dirección línea 2</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionE.addressLine2Label}</FieldLabel>', "addressLine2Label");
rep("<HelperText>Suite, piso, edificio o indicaciones; opcional.</HelperText>", "<HelperText>{fc.sectionE.addressLine2Helper}</HelperText>", "addressLine2Helper");
rep("<FieldLabel optional>Ciudad</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionE.cityLabel}</FieldLabel>', "cityLabel");
rep(
  `<HelperText>
                Sugerencias de ciudades de California cuando coinciden; puedes escribir cualquier ciudad.
              </HelperText>`,
  "<HelperText>{fc.sectionE.cityHelper}</HelperText>",
  "cityHelper",
);
rep('placeholder="Ej. San José, Portland, Austin…"', 'placeholder={fc.sectionE.cityPlaceholder}', "cityPlaceholder");
rep("<FieldLabel optional>Estado / Región</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionE.stateLabel}</FieldLabel>', "stateLabel");
rep("<HelperText>Estado, provincia o región donde opera el restaurante.</HelperText>", "<HelperText>{fc.sectionE.stateHelper}</HelperText>", "stateHelper");
rep('placeholder="Ej. California, Jalisco, Madrid…"', 'placeholder={fc.sectionE.statePlaceholder}', "statePlaceholder");
rep("<FieldLabel optional>Código postal</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionE.zipLabel}</FieldLabel>', "zipLabel");
rep("<HelperText>Código postal de 5 dígitos; se incluye en la dirección y en la búsqueda del mapa.</HelperText>", "<HelperText>{fc.sectionE.zipHelper}</HelperText>", "zipHelper");
rep("<FieldLabel optional>País</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionE.countryLabel}</FieldLabel>', "countryLabel");
rep("<HelperText>País donde opera el restaurante. Se usa para búsqueda y claridad para los clientes.</HelperText>", "<HelperText>{fc.sectionE.countryHelper}</HelperText>", "countryHelper");
rep('placeholder="Ej. Estados Unidos, México, España…"', 'placeholder={fc.sectionE.countryPlaceholder}', "countryPlaceholder");

fs.writeFileSync(path, s);
console.log("Phase B-E done");
