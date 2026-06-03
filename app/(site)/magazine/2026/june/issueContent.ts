export type MagazineLang = "es" | "en" | "vi";

export function resolveMagazineLang(raw: string | null | undefined): MagazineLang {
  if (raw === "en" || raw === "vi") return raw;
  return "es";
}

export const JUNE_2026 = {
  year: "2026",
  monthKey: "june",
  coverImage: "/magazine/2026/june/cover.png",
  pdfUrl: "/magazine/2026/june/leonix-media-june-2026.pdf",
  flipbookUrl: "https://flip.leonixmedia.com/books/leonix-media-june-2026/",
  title: {
    es: "Leonix Media — Junio 2026",
    en: "Leonix Media — June 2026",
    vi: "Leonix Media — Tháng 6 năm 2026",
  },
  monthLabel: {
    es: "Junio",
    en: "June",
    vi: "Tháng 6",
  },
} as const;

export type ReaderCtaKey = "advertise" | "newsletter" | "contact" | "clasificados" | "mediaKit";

export type ReaderSection = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  ctaKey?: ReaderCtaKey;
  ctaLabel?: string;
};

export const MAGAZINE_UI: Record<
  MagazineLang,
  {
    languageEyebrow: string;
    originalMagazineLabel: string;
    languageChooserHint: string;
    readerPreviewBadge: string;
    readerPreviewIntro: string;
    originalEditionNote: string;
    originalEditionTitle: string;
    viewFlipbookSpanish: string;
    openFullReader: string;
    backToMagazine: string;
    readPageTitle: string;
    readPageSubtitle: string;
    closeFlipbook: string;
    langLabels: { es: string; en: string; vi: string };
  }
> = {
  es: {
    languageEyebrow: "IDIOMA DE LECTURA",
    originalMagazineLabel: "Revista original en español",
    languageChooserHint: "Elija un idioma para leer los anuncios y la información principal.",
    readerPreviewBadge: "Vista de lectura traducida",
    readerPreviewIntro:
      "Esta vista resume anuncios, clasificados y contacto en su idioma. La edición visual impresa y digital permanece en español.",
    originalEditionNote:
      "La edición visual original está en español. Esta vista ayuda a leer la información principal en su idioma.",
    originalEditionTitle: "Edición visual original (español)",
    viewFlipbookSpanish: "Ver flipbook en español",
    openFullReader: "Abrir lector completo",
    backToMagazine: "Volver a la revista",
    readPageTitle: "Lector — Junio 2026",
    readPageSubtitle: "Información principal traducida para lectores en español, inglés y vietnamita.",
    closeFlipbook: "Cerrar",
    langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
  },
  en: {
    languageEyebrow: "READING LANGUAGE",
    originalMagazineLabel: "Original Spanish magazine",
    languageChooserHint: "Choose a language to read the ads and key information.",
    readerPreviewBadge: "Translated reader preview",
    readerPreviewIntro:
      "This view summarizes ads, classifieds, and contact details in your language. The print and digital visual edition remains in Spanish.",
    originalEditionNote:
      "The original visual edition is in Spanish. This reader helps you understand the key information in your language.",
    originalEditionTitle: "Original visual edition (Spanish)",
    viewFlipbookSpanish: "View Spanish flipbook",
    openFullReader: "Open full reader",
    backToMagazine: "Back to magazine",
    readPageTitle: "Reader — June 2026",
    readPageSubtitle: "Key information translated for readers in Spanish, English, and Vietnamese.",
    closeFlipbook: "Close",
    langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
  },
  vi: {
    languageEyebrow: "NGÔN NGỮ ĐỌC",
    originalMagazineLabel: "Tạp chí gốc bằng tiếng Tây Ban Nha",
    languageChooserHint: "Chọn ngôn ngữ để đọc quảng cáo và thông tin chính.",
    readerPreviewBadge: "Bản xem trước bản dịch",
    readerPreviewIntro:
      "Phần này tóm tắt quảng cáo, rao vặt và thông tin liên hệ bằng ngôn ngữ của bạn. Phiên bản hình ảnh in và kỹ thuật số vẫn là tiếng Tây Ban Nha.",
    originalEditionNote:
      "Phiên bản hình ảnh gốc bằng tiếng Tây Ban Nha. Phần đọc này giúp bạn hiểu thông tin chính bằng ngôn ngữ của mình.",
    originalEditionTitle: "Phiên bản hình ảnh gốc (tiếng Tây Ban Nha)",
    viewFlipbookSpanish: "Xem flipbook tiếng Tây Ban Nha",
    openFullReader: "Mở trình đọc đầy đủ",
    backToMagazine: "Quay lại tạp chí",
    readPageTitle: "Trình đọc — Tháng 6 năm 2026",
    readPageSubtitle: "Thông tin chính được dịch cho độc giả nói tiếng Tây Ban Nha, Anh và Việt.",
    closeFlipbook: "Đóng",
    langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
  },
};

export const READER_SECTIONS: Record<MagazineLang, ReaderSection[]> = {
  es: [
    {
      id: "about",
      title: "Sobre Leonix Media y El Águila",
      body: "Leonix Media conecta negocios locales con la comunidad latina y multicultural del Bay Area a través de una revista premium impresa, presencia digital bilingüe y herramientas que convierten la atención en acción.",
    },
    {
      id: "featured-ads",
      title: "Anuncios destacados de la revista",
      body: "Esta edición incluye negocios locales en categorías como restaurantes, servicios, salud, belleza, construcción y más.",
      bullets: [
        "Restaurante y cocina latina — menú, ubicación y contacto original del anunciante.",
        "Servicios profesionales — plomería, electricidad, limpieza y reparaciones.",
        "Salud y bienestar — clínicas, dentistas y servicios comunitarios.",
      ],
    },
    {
      id: "classifieds",
      title: "Vista previa de clasificados",
      body: "Leonix también conecta a la comunidad con oportunidades reales en el marketplace local.",
      bullets: [
        "Rentas y vivienda compartida en el Bay Area.",
        "Empleos y oportunidades de trabajo local.",
        "Autos privados, artículos en venta y servicios de la comunidad.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explorar clasificados",
    },
    {
      id: "local-business",
      title: "Perfil de negocio local",
      body: "Los anunciantes pueden mostrar teléfono, dirección, redes sociales, fotos y enlaces en una presencia organizada dentro de Negocios Locales.",
      bullets: [
        "Información de contacto original del negocio (sin traducción automática de datos comerciales).",
        "Mapa, llamadas y mensajes desde el celular vía QR.",
        "Reseñas y enlaces importantes en un solo lugar.",
      ],
    },
    {
      id: "advertise",
      title: "¿Quieres anunciarte?",
      body: "Aparece en la revista impresa, la edición digital y la presencia bilingüe de Leonix Media. Contáctanos para paquetes de lanzamiento y opciones para negocios locales.",
      ctaKey: "advertise",
      ctaLabel: "Anúnciate con nosotros",
    },
    {
      id: "newsletter",
      title: "Únete al boletín",
      body: "Recibe nuevas ediciones, anuncios importantes y oportunidades locales de Leonix Media.",
      ctaKey: "newsletter",
      ctaLabel: "Suscribirme al boletín",
    },
    {
      id: "contact",
      title: "Contáctanos para más información",
      body: "Estamos listos para ayudarte con publicidad, media kit y presencia digital. Los datos de contacto comercial se mantienen en su forma original.",
      ctaKey: "contact",
      ctaLabel: "Contactar a Leonix Media",
    },
  ],
  en: [
    {
      id: "about",
      title: "About Leonix Media & El Águila",
      body: "Leonix Media connects local businesses with the Latino and multicultural Bay Area community through a premium print magazine, bilingual digital presence, and tools that turn attention into action.",
    },
    {
      id: "featured-ads",
      title: "Featured magazine ads preview",
      body: "This edition highlights local businesses across restaurants, services, health, beauty, construction, and more.",
      bullets: [
        "Latino restaurant & kitchen — menu, location, and original advertiser contact.",
        "Professional services — plumbing, electrical, cleaning, and repairs.",
        "Health & wellness — clinics, dentists, and community services.",
      ],
    },
    {
      id: "classifieds",
      title: "Classifieds preview",
      body: "Leonix also connects the community with real opportunities in the local marketplace.",
      bullets: [
        "Rentals and shared housing in the Bay Area.",
        "Jobs and local employment opportunities.",
        "Private autos, items for sale, and community services.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explore classifieds",
    },
    {
      id: "local-business",
      title: "Local business profile preview",
      body: "Advertisers can showcase phone, address, social media, photos, and links in an organized presence within Local Businesses.",
      bullets: [
        "Original business contact information (commercial data is not auto-translated).",
        "Map, calls, and messages from mobile via QR.",
        "Reviews and important links in one place.",
      ],
    },
    {
      id: "advertise",
      title: "Want to advertise?",
      body: "Appear in the print magazine, digital edition, and Leonix Media bilingual presence. Contact us for launch packages and local business options.",
      ctaKey: "advertise",
      ctaLabel: "Advertise with us",
    },
    {
      id: "newsletter",
      title: "Join the newsletter",
      body: "Receive new editions, important announcements, and local opportunities from Leonix Media.",
      ctaKey: "newsletter",
      ctaLabel: "Subscribe to the newsletter",
    },
    {
      id: "contact",
      title: "Contact us for more information",
      body: "We are ready to help with advertising, media kit, and digital presence. Business contact details remain in their original form.",
      ctaKey: "contact",
      ctaLabel: "Contact Leonix Media",
    },
  ],
  vi: [
    {
      id: "about",
      title: "Giới thiệu Leonix Media & El Águila",
      body: "Leonix Media kết nối doanh nghiệp địa phương với cộng đồng Latinh và đa văn hóa tại Bay Area thông qua tạp chí in cao cấp, hiện diện kỹ thuật số song ngữ và công cụ biến sự chú ý thành hành động.",
    },
    {
      id: "featured-ads",
      title: "Xem trước quảng cáo nổi bật",
      body: "Số này giới thiệu doanh nghiệp địa phương trong các lĩnh vực nhà hàng, dịch vụ, sức khỏe, làm đẹp, xây dựng và hơn thế nữa.",
      bullets: [
        "Nhà hàng & ẩm thực Latinh — thực đơn, địa điểm và thông tin liên hệ gốc của nhà quảng cáo.",
        "Dịch vụ chuyên nghiệp — sửa ống nước, điện, vệ sinh và sửa chữa.",
        "Sức khỏe & thể chất — phòng khám, nha khoa và dịch vụ cộng đồng.",
      ],
    },
    {
      id: "classifieds",
      title: "Xem trước rao vặt",
      body: "Leonix cũng kết nối cộng đồng với cơ hội thực tế trên marketplace địa phương.",
      bullets: [
        "Thuê nhà và ở ghép tại Bay Area.",
        "Việc làm và cơ hội việc làm địa phương.",
        "Xe riêng, đồ bán và dịch vụ cộng đồng.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Khám phá rao vặt",
    },
    {
      id: "local-business",
      title: "Xem trước hồ sơ doanh nghiệp địa phương",
      body: "Nhà quảng cáo có thể hiển thị điện thoại, địa chỉ, mạng xã hội, ảnh và liên kết trong hồ sơ Doanh nghiệp địa phương.",
      bullets: [
        "Thông tin liên hệ doanh nghiệp gốc (dữ liệu thương mại không được dịch tự động).",
        "Bản đồ, gọi điện và nhắn tin từ điện thoại qua QR.",
        "Đánh giá và liên kết quan trọng ở một nơi.",
      ],
    },
    {
      id: "advertise",
      title: "Bạn muốn quảng cáo?",
      body: "Xuất hiện trên tạp chí in, phiên bản kỹ thuật số và hiện diện song ngữ của Leonix Media. Liên hệ để biết gói ra mắt và lựa chọn cho doanh nghiệp địa phương.",
      ctaKey: "advertise",
      ctaLabel: "Quảng cáo cùng chúng tôi",
    },
    {
      id: "newsletter",
      title: "Tham gia bản tin",
      body: "Nhận số mới, thông báo quan trọng và cơ hội địa phương từ Leonix Media.",
      ctaKey: "newsletter",
      ctaLabel: "Đăng ký bản tin",
    },
    {
      id: "contact",
      title: "Liên hệ để biết thêm thông tin",
      body: "Chúng tôi sẵn sàng hỗ trợ quảng cáo, media kit và hiện diện kỹ thuật số. Thông tin liên hệ kinh doanh giữ nguyên bản gốc.",
      ctaKey: "contact",
      ctaLabel: "Liên hệ Leonix Media",
    },
  ],
};

export function readerCtaHref(key: ReaderCtaKey, lang: MagazineLang): string {
  switch (key) {
    case "advertise":
      return `/contact?interest=advertise&lang=${lang}`;
    case "newsletter":
      return `/newsletter?source=magazine-reader&lang=${lang}`;
    case "contact":
      return `/contact?lang=${lang}`;
    case "clasificados":
      return lang === "en" ? "/clasificados?lang=en" : lang === "vi" ? "/clasificados?lang=vi" : "/clasificados?lang=es";
    case "mediaKit":
      return lang === "en"
        ? "/media-kit/leonix-media-kit-en.pdf"
        : "/media-kit/leonix-media-kit-es.pdf";
  }
}
