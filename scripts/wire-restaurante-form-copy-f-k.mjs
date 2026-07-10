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

// Section F
rep(
  `<HelperText>
            Módulo propio en la ficha abierta (no es la galería G): vende el menú con foto + título + nota. En vista previa
            los dos primeros destacan; el resto se despliega con «Ver más platillos». El precio se muestra en formato USD
            limpio; el enlace es opcional por plato.
          </HelperText>`,
  "<HelperText>{fc.sectionF.intro}</HelperText>",
  "sectionF intro",
);
rep('<span className="text-sm font-semibold">Plato {i + 1}</span>', '<span className="text-sm font-semibold">{fc.common.dishNumber} {i + 1}</span>', "dishNumber");
rep("\n                    Quitar\n", "\n                    {fc.common.remove}\n", "dish remove");
rep("<FieldLabel>Título</FieldLabel>", "<FieldLabel>{fc.sectionF.dishTitleLabel}</FieldLabel>", "dishTitleLabel");
rep("<HelperText>Nombre del plato en el bloque «Platillos destacados».</HelperText>", "<HelperText>{fc.sectionF.dishTitleHelper}</HelperText>", "dishTitleHelper");
rep("<FieldLabel>Nota corta</FieldLabel>", "<FieldLabel>{fc.sectionF.dishNoteLabel}</FieldLabel>", "dishNoteLabel");
rep("<HelperText>Subtítulo bajo el título (ingredientes, estilo).</HelperText>", "<HelperText>{fc.sectionF.dishNoteHelper}</HelperText>", "dishNoteHelper");
rep("<FieldLabel optional>Precio / etiqueta</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionF.dishPriceLabel}</FieldLabel>', "dishPriceLabel");
rep("<HelperText>Número o texto; si es importe, la ficha lo formatea como USD (ej. 12 → $12.00).</HelperText>", "<HelperText>{fc.sectionF.dishPriceHelper}</HelperText>", "dishPriceHelper");
rep("<FieldLabel optional>Enlace al menú</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionF.dishMenuLinkLabel}</FieldLabel>', "dishMenuLinkLabel");
rep("<HelperText>Opcional: ancla a una sección del menú online si aplica.</HelperText>", "<HelperText>{fc.sectionF.dishMenuLinkHelper}</HelperText>", "dishMenuLinkHelper");
rep("<FieldLabel>Imagen</FieldLabel>", "<FieldLabel>{fc.sectionF.dishImageLabel}</FieldLabel>", "dishImageLabel");
rep("<HelperText>Foto del plato; sin foto el bloque igual muestra el título con marcador visual.</HelperText>", "<HelperText>{fc.sectionF.dishImageHelper}</HelperText>", "dishImageHelper");
rep('buttonLabel={featuredUploading[i] ? "Subiendo..." : "Subir imagen"}', 'buttonLabel={featuredUploading[i] ? fc.common.uploading : fc.common.uploadImage}', "featured upload btn");
rep('helperText="Foto del plato."', 'helperText={fc.sectionF.dishImageUploadHelper}', "dishImageUploadHelper");
rep(
  `featuredUploading[i] 
                            ? "📤 Procesando imagen..." 
                            : uploadLabels[\`featured-\${i}\`] ?? (dish.image ? "✅ Imagen guardada en el borrador" : null)`,
  `featuredUploading[i]
                            ? \`📤 \${fc.common.processingImage}\`
                            : uploadLabels[\`featured-\${i}\`] ?? (dish.image ? fc.common.savedInDraft : null)`,
  "featured selectedLabel",
);
rep("\n                          Procesando imagen...\n", "\n                          {fc.common.processingImage}\n", "processing image");
rep("\n                            ✅ Lista\n", "\n                            {fc.common.ready}\n", "ready badge");
rep("\n                + Añadir plato\n", "\n                {fc.common.addDish}\n", "addDish");

// Section G enabled helper
rep(
  `<HelperText>
                Agrega hasta <strong className="text-[color:var(--lx-text-2)]">4</strong> ofertas para que los clientes tengan una razón clara para visitar, ordenar o compartir tu restaurante.
              </HelperText>`,
  "<HelperText>{fc.sectionG.enabledHelper}</HelperText>",
  "sectionG enabledHelper",
);
rep('<span className="text-sm font-semibold">Cupón {i + 1}</span>', '<span className="text-sm font-semibold">{fc.common.couponNumber} {i + 1}</span>', "couponNumber");
rep("<FieldLabel>Título del cupón</FieldLabel>", "<FieldLabel>{fc.sectionG.couponTitleLabel}</FieldLabel>", "couponTitleLabel");
rep('<HelperText>Ej. "2x1 en tacos", "10% de descuento", "Combo familiar"</HelperText>', "<HelperText>{fc.sectionG.couponTitleHelper}</HelperText>", "couponTitleHelper");
rep("<FieldLabel>Descripción</FieldLabel>", "<FieldLabel>{fc.sectionG.couponDescriptionLabel}</FieldLabel>", "couponDescriptionLabel");
rep("<HelperText>Describe la oferta, condiciones o restricciones.</HelperText>", "<HelperText>{fc.sectionG.couponDescriptionHelper}</HelperText>", "couponDescriptionHelper");
rep("<FieldLabel optional>Código de cupón</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.couponCodeLabel}</FieldLabel>', "couponCodeLabel");
rep("<HelperText>Código que el cliente debe mencionar o ingresar (si aplica).</HelperText>", "<HelperText>{fc.sectionG.couponCodeHelper}</HelperText>", "couponCodeHelper");
rep('placeholder="Ej. LEONIX10"', 'placeholder={fc.sectionG.couponCodePlaceholder}', "couponCodePlaceholder");
rep("<FieldLabel optional>Fecha de expiración</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.couponExpirationLabel}</FieldLabel>', "couponExpirationLabel");
rep("<HelperText>Fecha límite de vigencia (si aplica).</HelperText>", "<HelperText>{fc.sectionG.couponExpirationHelper}</HelperText>", "couponExpirationHelper");
rep("<FieldLabel optional>Nota de canje</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.couponRedemptionLabel}</FieldLabel>', "couponRedemptionLabel");
rep("<HelperText>Ej. Menciona este cupón al ordenar.</HelperText>", "<HelperText>{fc.sectionG.couponRedemptionHelper}</HelperText>", "couponRedemptionHelper");
rep("<FieldLabel optional>Imagen del cupón</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.couponImageLabel}</FieldLabel>', "couponImageLabel");
rep("<HelperText>Sube una imagen del cupón o pega una URL.</HelperText>", "<HelperText>{fc.sectionG.couponImageHelper}</HelperText>", "couponImageHelper");
rep("\n                + Añadir cupón\n", "\n                {fc.common.addCoupon}\n", "addCoupon");
rep("<FieldLabel optional>Flyer de cupones o promociones</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.flyerLabel}</FieldLabel>', "flyerLabel");
rep("<HelperText>Sube o pega una imagen con más promociones. Se mostrará debajo de los cupones principales.</HelperText>", "<HelperText>{fc.sectionG.flyerHelper}</HelperText>", "flyerHelper");
rep("<FieldLabel optional>Enlace para ver más ofertas</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.moreOffersUrlLabel}</FieldLabel>', "moreOffersUrlLabel");
rep("<HelperText>URL externa donde los clientes pueden ver más cupones o promociones.</HelperText>", "<HelperText>{fc.sectionG.moreOffersUrlHelper}</HelperText>", "moreOffersUrlHelper");
rep('placeholder="https://ejemplo.com/mas-cupones"', 'placeholder={fc.sectionG.moreOffersUrlPlaceholder}', "moreOffersUrlPlaceholder");
rep("<FieldLabel optional>Texto del botón</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionG.moreOffersButtonLabel}</FieldLabel>', "moreOffersButtonLabel");
rep('<HelperText>Texto personalizado para el botón (por defecto: "Ver más cupones").</HelperText>', "<HelperText>{fc.sectionG.moreOffersButtonHelper}</HelperText>", "moreOffersButtonHelper");
rep('placeholder="Ej. Ver menú con especiales"', 'placeholder={fc.sectionG.moreOffersButtonPlaceholder}', "moreOffersButtonPlaceholder");

// Section H
rep(
  `<HelperText>
            <strong className="text-[color:var(--lx-text-2)]">Hero</strong> = ancla visual superior de la ficha.{" "}
            <strong className="text-[color:var(--lx-text-2)]">Interiores / Comida / Exterior</strong> = grupos
            etiquetados en el detalle (no sustituyen a los platillos F). Usa <strong className="text-[color:var(--lx-text-2)]">Video opcional</strong>{" "}
            para hasta 4 enlaces externos (YouTube, TikTok, etc.).
          </HelperText>`,
  "<HelperText>{fc.sectionH.intro}</HelperText>",
  "sectionH intro",
);
rep("<FieldLabel required>Foto principal (hero)</FieldLabel>", '<FieldLabel required lang={lang}>{fc.sectionH.heroLabel}</FieldLabel>', "heroLabel");
rep(
  `<p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                Si no subes hero, la <strong>primera imagen</strong> del orden en G (galería) actúa como portada en vista previa,
                resultados y publicación.
              </p>`,
  '<p className="mt-1 text-xs text-[color:var(--lx-muted)]">{fc.sectionH.heroFallbackNote}</p>',
  "heroFallbackNote",
);
rep('buttonLabel={mediaUploading.hero ? "Subiendo..." : "Subir imagen"}', 'buttonLabel={mediaUploading.hero ? fc.common.uploading : fc.common.uploadImage}', "hero upload btn");
rep(
  'helperText="Clic o arrastra una imagen aquí. Miniatura en cuanto se guarde en el borrador de sesión."',
  "helperText={fc.sectionH.heroUploadHelper}",
  "heroUploadHelper",
);
rep(
  `mediaUploading.hero 
                      ? "📤 Procesando imagen..."
                      : uploadLabels.hero ??
                        (draft.heroImage?.trim()
                          ? "✅ Imagen guardada en el borrador"
                          : null)`,
  `mediaUploading.hero
                      ? \`📤 \${fc.common.processingImage}\`
                      : uploadLabels.hero ??
                        (draft.heroImage?.trim()
                          ? fc.common.savedInDraft
                          : null)`,
  "hero selectedLabel",
);
rep("\n                    Procesando imagen hero...\n", "\n                    {fc.common.processingHeroImage}\n", "processingHeroImage");
rep("\n                        Reemplazar\n", "\n                        {fc.common.replace}\n", "replace hero");
rep("\n                        Quitar imagen\n", "\n                        {fc.common.removeImage}\n", "removeImage");
rep("<FieldLabel optional>Logo del negocio</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionH.logoLabel}</FieldLabel>', "logoLabel");
rep(
  `<p className="mt-1 text-xs text-[color:var(--lx-muted)]">
                Logo opcional que aparecerá como una pequeña insignia redonda sobre la imagen hero. 
                Formato cuadrado recomendado. Se mostrará en la esquina superior izquierda de la imagen hero.
              </p>`,
  '<p className="mt-1 text-xs text-[color:var(--lx-muted)]">{fc.sectionH.logoHelper}</p>',
  "logoHelper",
);
rep('buttonLabel={mediaUploading.logo ? "Subiendo..." : "Subir logo"}', 'buttonLabel={mediaUploading.logo ? fc.common.uploading : fc.common.uploadLogo}', "logo upload btn");
rep(
  'helperText="Clic o arrastra una imagen cuadrada aquí. El logo se mostrará como una insignia redonda."',
  "helperText={fc.sectionH.logoUploadHelper}",
  "logoUploadHelper",
);
rep(
  `mediaUploading.logo 
                      ? "📤 Procesando logo..."
                      : uploadLabels.logo ?? 
                        (draft.businessLogo?.trim()
                          ? "✅ Logo guardado en el borrador"
                          : null)`,
  `mediaUploading.logo
                      ? \`📤 \${fc.common.processingLogo}\`
                      : uploadLabels.logo ??
                        (draft.businessLogo?.trim()
                          ? fc.common.logoSavedInDraft
                          : null)`,
  "logo selectedLabel",
);
rep("\n                    Procesando logo...\n", "\n                    {fc.common.processingLogo}\n", "processing logo text");
rep('alt="Logo del negocio"', 'alt={fc.sectionH.logoAlt}', "logoAlt");
rep("\n                        Quitar logo\n", "\n                        {fc.common.removeLogo}\n", "removeLogo");

// Section I
rep(
  `<p className="mt-2 text-sm text-[color:var(--lx-muted)]">
            Máximo <strong className="text-[color:var(--lx-text-2)]">6</strong> etiquetas en la ficha; aquí no puedes pasar de
            seis seleccionadas.
          </p>`,
  '<p className="mt-2 text-sm text-[color:var(--lx-muted)]">{fc.sectionI.intro}</p>',
  "sectionI intro",
);

// Section J
rep(
  `<HelperText>
              Opcional. No es obligatorio para publicar. Las opciones aparecen en la vista previa y en la ficha pública
              solo cuando marcas al menos una.
            </HelperText>`,
  "<HelperText>{fc.sectionJ.intro}</HelperText>",
  "sectionJ intro",
);

// Section K
rep(
  `<HelperText>
              Alcance de <strong className="text-[color:var(--lx-text-2)]">catering y comida para eventos</strong>. Aquí
              defines anticipación, dónde solicitar cotización y radio de servicio.
            </HelperText>`,
  "<HelperText>{fc.sectionK.intro}</HelperText>",
  "sectionK intro",
);
rep("<FieldLabel optional>Tamaños de evento</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionK.eventSizesLabel}</FieldLabel>', "K eventSizesLabel");
rep("<HelperText>Qué tamaños de grupo puedes atender.</HelperText>", "<HelperText>{fc.sectionK.eventSizesHelper}</HelperText>", "K eventSizesHelper");
s = s.replace(
  `[
                  ["bookingLeadTimeText", "Anticipación de reserva"],
                  ["cateringInquiryUrl", "URL de solicitud"],
                  ["cateringNote", "Nota"],
                ] as const`,
  `[
                  ["bookingLeadTimeText", fc.sectionK.bookingLeadTimeLabel],
                  ["cateringInquiryUrl", fc.sectionK.inquiryUrlLabel],
                  ["cateringNote", fc.sectionK.cateringNoteLabel],
                ] as const`,
);
rep("<HelperText>Con cuánta anticipación deben contactarte (ej. «mín. 2 semanas»).</HelperText>", "<HelperText>{fc.sectionK.bookingLeadTimeHelper}</HelperText>", "bookingLeadTimeHelper");
rep("<HelperText>Formulario o página donde el cliente pide presupuesto.</HelperText>", "<HelperText>{fc.sectionK.inquiryUrlHelper}</HelperText>", "inquiryUrlHelper");
rep("<HelperText>Añade algo importante para eventos: mínimo de personas, montaje, cargos extra por distancia o condiciones especiales.</HelperText>", "<HelperText>{fc.sectionK.cateringNoteHelper}</HelperText>", "cateringNoteHelper");
rep("<FieldLabel optional>Radio de servicio (millas)</FieldLabel>", '<FieldLabel optional lang={lang}>{fc.sectionK.serviceRadiusLabel}</FieldLabel>', "serviceRadiusLabel");
rep("<HelperText>Distancia aproximada desde tu base de operación donde ofreces catering o servicio en sitio.</HelperText>", "<HelperText>{fc.sectionK.serviceRadiusHelper}</HelperText>", "serviceRadiusHelper");

// Add lang to remaining FieldLabel optional in section D social map
s = s.replace(
  /<FieldLabel optional>\{lab\}<\/FieldLabel>/g,
  '<FieldLabel optional lang={lang}>{lab}</FieldLabel>',
);

// Add lang to section K dynamic labels
s = s.replace(
  /<FieldLabel optional>\{lab\}<\/FieldLabel>\n                  \{k === "bookingLeadTimeText"/,
  '<FieldLabel optional lang={lang}>{lab}</FieldLabel>\n                  {k === "bookingLeadTimeText"',
);

fs.writeFileSync(path, s);
console.log("Phase F-K done");
