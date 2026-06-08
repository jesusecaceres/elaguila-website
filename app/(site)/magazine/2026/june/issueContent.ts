import { normalizeLang, type SupportedLang } from "@/app/lib/language";

export type MagazineLang = SupportedLang;

export function resolveMagazineLang(raw: string | null | undefined): MagazineLang {
  return normalizeLang(raw);
}

/** Hub preview shows this many reader sections before linking to full reader. */
export const READER_PREVIEW_SECTION_COUNT = 4;

export const JUNE_2026 = {
  year: "2026",
  monthKey: "june",
  coverImage: "/magazine/2026/june/cover.png",
  pdfUrl: "/magazine/2026/june/leonix_media_june.pdf",
  flipbookUrl: "https://flip.leonixmedia.com/books/qnda/",
  title: {
    es: "Leonix Media — Revista Junio 2026",
    en: "Leonix Media — June 2026 Magazine",
    vi: "Leonix Media — Tạp chí Tháng 6 năm 2026",
  },
  monthLabel: {
    es: "Junio",
    en: "June",
    vi: "Tháng 6",
  },
} as const;

export type ReaderCtaKey =
  | "advertise"
  | "newsletter"
  | "contact"
  | "clasificados"
  | "mediaKit"
  | "comingSoon";

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
    futureFlipbookNote: string;
    originalEditionNote: string;
    originalEditionTitle: string;
    viewFlipbookSpanish: string;
    downloadPdf: string;
    viewMediaKit: string;
    openFullReader: string;
    backToMagazine: string;
    backToComingSoon: string;
    readPageTitle: string;
    readPageSubtitle: string;
    issuePageTitle: string;
    issuePageIntro: string;
    issuePageReaderCta: string;
    issuePageHubCta: string;
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
    futureFlipbookNote:
      "Las ediciones visuales completas en inglés o vietnamita serán archivos separados cuando estén disponibles. Hoy, el flipbook y PDF originales permanecen en español.",
    originalEditionNote:
      "La edición visual original está en español. Esta vista ayuda a leer la información principal en su idioma.",
    originalEditionTitle: "Edición visual original (español)",
    viewFlipbookSpanish: "Ver flipbook en español",
    downloadPdf: "Descargar PDF original",
    viewMediaKit: "Ver Media Kit",
    openFullReader: "Abrir lector completo",
    backToMagazine: "Volver a la revista",
    backToComingSoon: "Volver a Próximamente",
    readPageTitle: "Lector — Junio 2026",
    readPageSubtitle:
      "Información principal de la edición de junio en español, inglés y vietnamita. La revista visual original sigue en español.",
    issuePageTitle: "Edición Junio 2026",
    issuePageIntro:
      "La edición de lanzamiento de Leonix Media conecta negocios locales, comunidad, cultura y oportunidades. Elija cómo explorarla.",
    issuePageReaderCta: "Abrir lector traducido",
    issuePageHubCta: "Ir al hub de la revista",
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
    futureFlipbookNote:
      "Full visual editions in English or Vietnamese will be separate files when available. Today, the original flipbook and PDF remain in Spanish.",
    originalEditionNote:
      "The original visual edition is in Spanish. This reader helps you understand the key information in your language.",
    originalEditionTitle: "Original visual edition (Spanish)",
    viewFlipbookSpanish: "View Spanish flipbook",
    downloadPdf: "Download original PDF",
    viewMediaKit: "View Media Kit",
    openFullReader: "Open full reader",
    backToMagazine: "Back to magazine",
    backToComingSoon: "Back to Coming Soon",
    readPageTitle: "Reader — June 2026",
    readPageSubtitle:
      "Key information from the June edition in Spanish, English, and Vietnamese. The original visual magazine remains in Spanish.",
    issuePageTitle: "June 2026 Edition",
    issuePageIntro:
      "Leonix Media’s launch edition connects local businesses, community, culture, and opportunities. Choose how to explore it.",
    issuePageReaderCta: "Open translated reader",
    issuePageHubCta: "Go to magazine hub",
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
    futureFlipbookNote:
      "Phiên bản hình ảnh đầy đủ bằng tiếng Anh hoặc Việt sẽ là tệp riêng khi có sẵn. Hiện tại, flipbook và PDF gốc vẫn là tiếng Tây Ban Nha.",
    originalEditionNote:
      "Phiên bản hình ảnh gốc bằng tiếng Tây Ban Nha. Phần đọc này giúp bạn hiểu thông tin chính bằng ngôn ngữ của mình.",
    originalEditionTitle: "Phiên bản hình ảnh gốc (tiếng Tây Ban Nha)",
    viewFlipbookSpanish: "Xem flipbook tiếng Tây Ban Nha",
    downloadPdf: "Tải PDF gốc",
    viewMediaKit: "Xem Media Kit",
    openFullReader: "Mở trình đọc đầy đủ",
    backToMagazine: "Quay lại tạp chí",
    backToComingSoon: "Quay lại Trang sắp ra mắt",
    readPageTitle: "Trình đọc — Tháng 6 năm 2026",
    readPageSubtitle:
      "Thông tin chính của số tháng 6 bằng tiếng Tây Ban Nha, Anh và Việt. Tạp chí hình ảnh gốc vẫn là tiếng Tây Ban Nha.",
    issuePageTitle: "Số Tháng 6 năm 2026",
    issuePageIntro:
      "Số ra mắt Leonix Media kết nối doanh nghiệp địa phương, cộng đồng, văn hóa và cơ hội. Chọn cách khám phá.",
    issuePageReaderCta: "Mở trình đọc bản dịch",
    issuePageHubCta: "Đến trang tạp chí",
    closeFlipbook: "Đóng",
    langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
  },
};

export const READER_SECTIONS: Record<MagazineLang, ReaderSection[]> = {
  es: [
    {
      id: "about-leonix",
      title: "Sobre Leonix Media",
      body: "Leonix Media conecta negocios locales con la comunidad latina y multicultural del Bay Area a través de publicidad impresa en español, presencia digital bilingüe y herramientas que convierten la atención en llamadas, visitas y conexiones reales.",
    },
    {
      id: "about-magazine",
      title: "Sobre El Águila y la revista",
      body: "Leonix Media es la revista premium del ecosistema El Águila: comunidad, cultura y negocios en una edición digital e impresa. La edición de junio 2026 reúne historias locales, anuncios de negocios, inspiración comunitaria y puentes hacia el marketplace de clasificados.",
      bullets: [
        "Revista impresa premium diseñada para la comunidad latina local.",
        "Edición digital con flipbook y PDF en español (original visual).",
        "Conexión con clasificados, Negocios Locales y acciones por QR.",
      ],
    },
    {
      id: "featured-ads",
      title: "Vista previa de anuncios destacados",
      body: "Esta edición incluye espacios publicitarios para negocios locales. Los anuncios muestran la categoría, el mensaje principal y la información de contacto original del anunciante — sin nombres inventados ni precios en esta vista de lectura.",
      bullets: [
        "Restaurantes y comida local — menú, ubicación y contacto del anunciante.",
        "Servicios profesionales — plomería, electricidad, limpieza y reparaciones.",
        "Salud, belleza y bienestar — clínicas, dentistas y servicios comunitarios.",
        "Cultura, deportes, recetas e inspiración para la comunidad.",
      ],
    },
    {
      id: "classifieds",
      title: "Vista previa de clasificados",
      body: "Leonix no es solo publicidad. El marketplace local conecta a la comunidad con oportunidades reales: rentas, empleos, autos privados, artículos en venta, eventos, comida, mascotas y más.",
      bullets: [
        "Rentas y vivienda en el Bay Area.",
        "Empleos y oportunidades de trabajo local.",
        "Autos privados, artículos en venta y servicios comunitarios.",
        "Busco, mascotas y apoyo local.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explorar clasificados",
    },
    {
      id: "local-business",
      title: "Vista previa de perfil de negocio local",
      body: "Negocios Locales organiza teléfono, dirección, mapa, redes sociales, fotos y enlaces en una sola presencia digital. Los datos comerciales y de contacto se mantienen en su forma original.",
      bullets: [
        "Teléfono, dirección y redes del negocio — sin traducción automática de datos comerciales.",
        "Mapa, llamadas y mensajes desde el celular.",
        "Fotos, reseñas y enlaces importantes en un solo lugar.",
      ],
    },
    {
      id: "qr-access",
      title: "Revista digital y acceso multilingüe por QR",
      body: "La revista mantiene su identidad en español para servir primero a nuestra comunidad latina. Con el QR, los clientes abren la experiencia digital y pueden usar herramientas de traducción del dispositivo o navegador cuando lo necesiten.",
      bullets: [
        "Escanea desde el anuncio impreso hacia acciones concretas en el celular.",
        "Traducción del navegador, Google Lens o Apple Translate cuando aplique.",
        "Esta vista de lectura estructurada complementa — no reemplaza — el flipbook visual en español.",
      ],
      ctaKey: "comingSoon",
      ctaLabel: "Conocer Leonix Media",
    },
    {
      id: "advertise",
      title: "¿Quieres anunciarte?",
      body: "Conecta tu negocio con lectores locales a través de la revista impresa, edición digital y presencia bilingüe. Contáctanos para conocer el Media Kit y opciones de lanzamiento — sin precios ni garantías en esta vista.",
      ctaKey: "advertise",
      ctaLabel: "Anúnciate con nosotros",
    },
    {
      id: "newsletter",
      title: "Únete al boletín",
      body: "Sé de los primeros en recibir nuevas ediciones, anuncios importantes, oportunidades locales y actualizaciones de Leonix Media.",
      ctaKey: "newsletter",
      ctaLabel: "Suscribirme al boletín",
    },
    {
      id: "contact",
      title: "Contacto / solicitar más información",
      body: "Estamos listos para ayudarte con publicidad, Media Kit y presencia digital. Los datos de contacto comercial se mantienen en su forma original.",
      bullets: [
        "Consultas sobre anuncios en revista impresa y digital.",
        "Media Kit y paquetes de lanzamiento — solicitar detalles por contacto.",
        "Información comercial sin traducción automática en esta vista.",
      ],
      ctaKey: "contact",
      ctaLabel: "Contactar a Leonix Media",
    },
  ],
  en: [
    {
      id: "about-leonix",
      title: "About Leonix Media",
      body: "Leonix Media connects local businesses with the Latino and multicultural Bay Area community through Spanish print advertising, bilingual digital presence, and tools that turn attention into calls, visits, and real connections.",
    },
    {
      id: "about-magazine",
      title: "About El Águila & the magazine",
      body: "Leonix Media is the premium magazine within the El Águila ecosystem: community, culture, and business in a digital and print edition. The June 2026 issue brings local stories, business ads, community inspiration, and bridges to the classifieds marketplace.",
      bullets: [
        "Premium print magazine designed for the local Latino community.",
        "Digital edition with flipbook and PDF in Spanish (original visual).",
        "Connection to classifieds, Local Businesses, and QR-driven actions.",
      ],
    },
    {
      id: "featured-ads",
      title: "Featured ads preview",
      body: "This edition includes advertising space for local businesses. Ads show category, main message, and the advertiser’s original contact information — no invented names or pricing in this reader view.",
      bullets: [
        "Restaurants & local food — menu, location, and advertiser contact.",
        "Professional services — plumbing, electrical, cleaning, and repairs.",
        "Health, beauty & wellness — clinics, dentists, and community services.",
        "Culture, sports, recipes, and community inspiration.",
      ],
    },
    {
      id: "classifieds",
      title: "Classifieds preview",
      body: "Leonix is not only advertising. The local marketplace connects the community with real opportunities: rentals, jobs, private autos, items for sale, events, food, pets, and more.",
      bullets: [
        "Rentals and housing in the Bay Area.",
        "Jobs and local employment opportunities.",
        "Private autos, items for sale, and community services.",
        "Wanted posts, pets, and local support.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Explore classifieds",
    },
    {
      id: "local-business",
      title: "Local business profile preview",
      body: "Local Businesses organizes phone, address, map, social media, photos, and links in one digital presence. Business and contact data remain in their original form.",
      bullets: [
        "Business phone, address, and social — commercial data is not auto-translated.",
        "Map, calls, and messages from mobile.",
        "Photos, reviews, and important links in one place.",
      ],
    },
    {
      id: "qr-access",
      title: "Digital magazine & QR language access",
      body: "The magazine keeps its Spanish identity to serve our Latino community first. With QR, customers open the digital experience and can use device or browser translation tools when needed.",
      bullets: [
        "Scan from print ads to concrete actions on mobile.",
        "Browser translation, Google Lens, or Apple Translate when applicable.",
        "This structured reader complements — it does not replace — the Spanish visual flipbook.",
      ],
      ctaKey: "comingSoon",
      ctaLabel: "Learn about Leonix Media",
    },
    {
      id: "advertise",
      title: "Want to advertise?",
      body: "Connect your business with local readers through print magazine placement, digital edition visibility, and bilingual presence. Contact us for the Media Kit and launch options — no pricing or guarantees in this view.",
      ctaKey: "advertise",
      ctaLabel: "Advertise with us",
    },
    {
      id: "newsletter",
      title: "Join the newsletter",
      body: "Be among the first to receive new editions, important announcements, local opportunities, and Leonix Media updates.",
      ctaKey: "newsletter",
      ctaLabel: "Subscribe to the newsletter",
    },
    {
      id: "contact",
      title: "Contact / request more information",
      body: "We are ready to help with advertising, Media Kit, and digital presence. Business contact details remain in their original form.",
      bullets: [
        "Questions about print and digital magazine advertising.",
        "Media Kit and launch packages — request details via contact.",
        "Commercial information is not auto-translated in this view.",
      ],
      ctaKey: "contact",
      ctaLabel: "Contact Leonix Media",
    },
  ],
  vi: [
    {
      id: "about-leonix",
      title: "Giới thiệu Leonix Media",
      body: "Leonix Media kết nối doanh nghiệp địa phương với cộng đồng Latinh và đa văn hóa tại Bay Area thông qua quảng cáo in bằng tiếng Tây Ban Nha, hiện diện kỹ thuật số song ngữ và công cụ biến sự chú ý thành cuộc gọi, lượt ghé thăm và kết nối thực tế.",
    },
    {
      id: "about-magazine",
      title: "Giới thiệu El Águila & tạp chí",
      body: "Leonix Media là tạp chí cao cấp trong hệ sinh thái El Águila: cộng đồng, văn hóa và kinh doanh trong phiên bản kỹ thuật số và in. Số tháng 6 năm 2026 gồm câu chuyện địa phương, quảng cáo doanh nghiệp, cảm hứng cộng đồng và cầu nối tới marketplace rao vặt.",
      bullets: [
        "Tạp chí in cao cấp dành cho cộng đồng Latinh địa phương.",
        "Phiên bản kỹ thuật số với flipbook và PDF tiếng Tây Ban Nha (hình ảnh gốc).",
        "Kết nối với rao vặt, Doanh nghiệp địa phương và hành động qua QR.",
      ],
    },
    {
      id: "featured-ads",
      title: "Xem trước quảng cáo nổi bật",
      body: "Số này có không gian quảng cáo cho doanh nghiệp địa phương. Quảng cáo hiển thị danh mục, thông điệp chính và thông tin liên hệ gốc của nhà quảng cáo — không có tên hay giá được bịa trong phần đọc này.",
      bullets: [
        "Nhà hàng & ẩm thực địa phương — thực đơn, địa điểm và liên hệ nhà quảng cáo.",
        "Dịch vụ chuyên nghiệp — sửa ống nước, điện, vệ sinh và sửa chữa.",
        "Sức khỏe, làm đẹp & thể chất — phòng khám, nha khoa và dịch vụ cộng đồng.",
        "Văn hóa, thể thao, công thức và cảm hứng cộng đồng.",
      ],
    },
    {
      id: "classifieds",
      title: "Xem trước rao vặt",
      body: "Leonix không chỉ là quảng cáo. Marketplace địa phương kết nối cộng đồng với cơ hội thực tế: thuê nhà, việc làm, xe riêng, đồ bán, sự kiện, ẩm thực, thú cưng và hơn thế.",
      bullets: [
        "Thuê nhà và chỗ ở tại Bay Area.",
        "Việc làm và cơ hội việc làm địa phương.",
        "Xe riêng, đồ bán và dịch vụ cộng đồng.",
        "Tìm kiếm, thú cưng và hỗ trợ địa phương.",
      ],
      ctaKey: "clasificados",
      ctaLabel: "Khám phá rao vặt",
    },
    {
      id: "local-business",
      title: "Xem trước hồ sơ doanh nghiệp địa phương",
      body: "Doanh nghiệp địa phương sắp xếp điện thoại, địa chỉ, bản đồ, mạng xã hội, ảnh và liên kết trong một hiện diện kỹ thuật số. Dữ liệu kinh doanh và liên hệ giữ nguyên bản gốc.",
      bullets: [
        "Điện thoại, địa chỉ và mạng xã hội — dữ liệu thương mại không được dịch tự động.",
        "Bản đồ, gọi điện và nhắn tin từ điện thoại.",
        "Ảnh, đánh giá và liên kết quan trọng ở một nơi.",
      ],
    },
    {
      id: "qr-access",
      title: "Tạp chí kỹ thuật số & truy cập đa ngôn ngữ qua QR",
      body: "Tạp chí giữ bản sắc tiếng Tây Ban Nha để phục vụ cộng đồng Latinh trước. Với QR, khách hàng mở trải nghiệm kỹ thuật số và có thể dùng công cụ dịch trên thiết bị hoặc trình duyệt khi cần.",
      bullets: [
        "Quét từ quảng cáo in sang hành động cụ thể trên điện thoại.",
        "Dịch trình duyệt, Google Lens hoặc Apple Translate khi phù hợp.",
        "Phần đọc có cấu trúc này bổ sung — không thay thế — flipbook hình ảnh tiếng Tây Ban Nha.",
      ],
      ctaKey: "comingSoon",
      ctaLabel: "Tìm hiểu Leonix Media",
    },
    {
      id: "advertise",
      title: "Bạn muốn quảng cáo?",
      body: "Kết nối doanh nghiệp với độc giả địa phương qua tạp chí in, phiên bản kỹ thuật số và hiện diện song ngữ. Liên hệ để biết Media Kit và lựa chọn ra mắt — không có giá hay cam kết trong phần xem này.",
      ctaKey: "advertise",
      ctaLabel: "Quảng cáo cùng chúng tôi",
    },
    {
      id: "newsletter",
      title: "Tham gia bản tin",
      body: "Hãy là người đầu tiên nhận số mới, thông báo quan trọng, cơ hội địa phương và cập nhật từ Leonix Media.",
      ctaKey: "newsletter",
      ctaLabel: "Đăng ký bản tin",
    },
    {
      id: "contact",
      title: "Liên hệ / yêu cầu thêm thông tin",
      body: "Chúng tôi sẵn sàng hỗ trợ quảng cáo, Media Kit và hiện diện kỹ thuật số. Thông tin liên hệ kinh doanh giữ nguyên bản gốc.",
      bullets: [
        "Câu hỏi về quảng cáo tạp chí in và kỹ thuật số.",
        "Media Kit và gói ra mắt — yêu cầu chi tiết qua liên hệ.",
        "Thông tin thương mại không được dịch tự động trong phần xem này.",
      ],
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
      return lang === "en"
        ? "/clasificados?lang=en"
        : lang === "vi"
          ? "/clasificados?lang=vi"
          : "/clasificados?lang=es";
    case "mediaKit":
      return lang === "en"
        ? "/media-kit/leonix-media-kit-en.pdf"
        : "/media-kit/leonix-media-kit-es.pdf";
    case "comingSoon":
      return `/coming-soon-v2?lang=${lang}`;
  }
}

export function mediaKitHref(lang: MagazineLang): string {
  return lang === "en"
    ? "/media-kit/leonix-media-kit-en.pdf"
    : "/media-kit/leonix-media-kit-es.pdf";
}

export function comingSoonHref(lang: MagazineLang): string {
  return `/coming-soon-v2?lang=${lang}`;
}
