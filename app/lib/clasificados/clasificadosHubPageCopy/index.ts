import type { HubCategoryKey } from "@/app/(site)/clasificados/config/clasificadosHub";
import type { SupportedLang } from "@/app/lib/language";

export type ClasificadosCategoryCopy = {
  label: string;
  desc: string;
  note?: string;
};

export type ClasificadosHubPageCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  ctaPost: string;
  ctaExplore: string;
  sectionBrowse: string;
  explore: string;
  trustLine: string;
  ofertasLocalesTitle: string;
  ofertasLocalesDesc: string;
  ofertasLocalesBrowse: string;
  ofertasLocalesPublish: string;
  postInCategory: (categoryLabel: string) => string;
  categories: Record<HubCategoryKey, ClasificadosCategoryCopy>;
};

function postInEs(label: string): string {
  return `Publicar en ${label}`;
}

function postInEn(label: string): string {
  return `Post in ${label}`;
}

const CATEGORIES_ES: Record<HubCategoryKey, ClasificadosCategoryCopy> = {
  "en-venta": {
    label: "Varios",
    desc: "Artículos, muebles, herramientas, ropa y cosas útiles para la comunidad.",
    note: "Publicaciones comunitarias y artículos varios.",
  },
  rentas: { label: "Rentas", desc: "Cuartos, apartamentos, espacios y oportunidades de vivienda." },
  empleos: { label: "Empleos", desc: "Oportunidades de trabajo y negocios que están contratando." },
  autos: { label: "Autos", desc: "Autos de vendedores privados y oportunidades locales." },
  "bienes-raices": {
    label: "Bienes Raíces",
    desc: "Casas, propiedades, terrenos y oportunidades inmobiliarias.",
  },
  servicios: { label: "Servicios", desc: "Profesionales y servicios confiables cerca de ti." },
  restaurantes: { label: "Restaurantes", desc: "Comida local, antojos, menús y lugares para visitar." },
  travel: { label: "Viajes", desc: "Ofertas, agencias y recursos para planear tu viaje." },
  comunidad: { label: "Comunidad y Eventos", desc: "Eventos, actividades y conexiones locales." },
  clases: { label: "Clases", desc: "Cursos, talleres y aprendizaje para la comunidad." },
  busco: {
    label: "Busco / Se busca",
    desc: "Peticiones, necesidades, oportunidades y búsquedas locales.",
  },
  "mascotas-y-perdidos": {
    label: "Mascotas y Perdidos",
    desc: "Mascotas, adopciones, objetos perdidos y apoyo comunitario.",
  },
};

const CATEGORIES_EN: Record<HubCategoryKey, ClasificadosCategoryCopy> = {
  "en-venta": {
    label: "Miscellaneous",
    desc: "Items, furniture, tools, clothing, and useful things for the community.",
    note: "Community posts and miscellaneous items.",
  },
  rentas: { label: "Rentals", desc: "Rooms, apartments, spaces, and housing opportunities." },
  empleos: { label: "Jobs", desc: "Job opportunities and businesses that are hiring." },
  autos: { label: "Autos", desc: "Private seller vehicles and local buying opportunities." },
  "bienes-raices": {
    label: "Real Estate",
    desc: "Homes, properties, land, and real estate opportunities.",
  },
  servicios: { label: "Services", desc: "Trusted professionals and services near you." },
  restaurantes: { label: "Restaurants", desc: "Local food, cravings, menus, and places to visit." },
  travel: { label: "Travel", desc: "Offers, agencies, and resources to plan your trip." },
  comunidad: { label: "Community & Events", desc: "Events, activities, and local connections." },
  clases: { label: "Classes", desc: "Courses, workshops, and learning for the community." },
  busco: {
    label: "Wanted / Looking for",
    desc: "Requests, needs, opportunities, and local searches.",
  },
  "mascotas-y-perdidos": {
    label: "Pets & Lost",
    desc: "Pets, adoptions, lost items, and community support.",
  },
};

function hubPage(
  page: Omit<ClasificadosHubPageCopy, "postInCategory" | "categories">,
  categories: Record<HubCategoryKey, ClasificadosCategoryCopy>,
  postIn: (label: string) => string,
): ClasificadosHubPageCopy {
  return { ...page, categories, postInCategory: postIn };
}

const HUB_ES: ClasificadosHubPageCopy = hubPage(
  {
    eyebrow: "LEONIX CLASIFICADOS",
    title: "Clasificados",
    subtitle: "Encuentra y publica oportunidades locales en un espacio hecho para nuestra comunidad.",
    description:
      "Explora artículos en venta, rentas, empleos, autos, servicios, eventos y más. Los anuncios comunitarios mantienen visible lo que nuestra gente busca, ofrece y comparte.",
    ctaPost: "Publicar anuncio",
    ctaExplore: "Explorar categorías",
    sectionBrowse: "Explorar por categoría",
    explore: "EXPLORAR",
    trustLine:
      "Un espacio confiable, familiar y comunitario. Los anuncios gratis siempre permanecen visibles en la búsqueda.",
    ofertasLocalesTitle: "Ofertas Locales",
    ofertasLocalesDesc: "Encuentra especiales, cupones y ofertas semanales de negocios locales.",
    ofertasLocalesBrowse: "Ver ofertas",
    ofertasLocalesPublish: "Publica tus ofertas locales",
  },
  CATEGORIES_ES,
  postInEs,
);

const HUB_EN: ClasificadosHubPageCopy = hubPage(
  {
    eyebrow: "LEONIX CLASSIFIEDS",
    title: "Classifieds",
    subtitle: "Find and post local opportunities in a space built for our community.",
    description:
      "Explore items for sale, rentals, jobs, autos, services, events, and more. Community listings keep visible what our people are looking for, offering, and sharing.",
    ctaPost: "Post listing",
    ctaExplore: "Explore categories",
    sectionBrowse: "Browse by category",
    explore: "EXPLORE",
    trustLine:
      "A trusted, family-safe, community-first marketplace. Free listings always remain visible in search.",
    ofertasLocalesTitle: "Local Deals",
    ofertasLocalesDesc: "Find weekly specials, coupons, and local business offers.",
    ofertasLocalesBrowse: "View deals",
    ofertasLocalesPublish: "Publish your local deals",
  },
  CATEGORIES_EN,
  postInEn,
);

function fromEnHub(
  partial: Partial<Omit<ClasificadosHubPageCopy, "postInCategory" | "categories">> & {
    categories?: Partial<Record<HubCategoryKey, Partial<ClasificadosCategoryCopy>>>;
  },
  postIn?: (label: string) => string,
): ClasificadosHubPageCopy {
  const categories = { ...CATEGORIES_EN };
  if (partial.categories) {
    for (const [key, val] of Object.entries(partial.categories)) {
      const k = key as HubCategoryKey;
      categories[k] = { ...categories[k], ...val };
    }
  }
  const { categories: _c, ...pagePartial } = partial;
  return hubPage({ ...HUB_EN, ...pagePartial }, categories, postIn ?? postInEn);
}

export const CLASIFICADOS_HUB_PAGE_COPY: Record<SupportedLang, ClasificadosHubPageCopy> = {
  es: HUB_ES,
  en: HUB_EN,
  vi: fromEnHub({
    eyebrow: "LEONIX CLASIFICADOS",
    title: "Rao vặt",
    subtitle: "Tìm và đăng cơ hội địa phương trong không gian dành cho cộng đồng của chúng ta.",
    description:
      "Khám phá hàng bán, thuê nhà, việc làm, xe, dịch vụ, sự kiện và hơn nữa. Tin cộng đồng giữ cho những gì mọi người tìm kiếm, cung cấp và chia sẻ luôn hiển thị.",
    ctaPost: "Đăng tin",
    ctaExplore: "Khám phá danh mục",
    sectionBrowse: "Khám phá theo danh mục",
    explore: "KHÁM PHÁ",
    trustLine:
      "Không gian đáng tin cậy, an toàn cho gia đình và ưu tiên cộng đồng. Tin miễn phí luôn hiển thị trong tìm kiếm.",
    ofertasLocalesTitle: "Ưu đãi địa phương",
    ofertasLocalesDesc: "Tìm khuyến mãi, coupon và ưu đãi hàng tuần từ doanh nghiệp địa phương.",
    ofertasLocalesBrowse: "Xem ưu đãi",
    ofertasLocalesPublish: "Đăng ưu đãi địa phương",
    categories: {
      "en-venta": { label: "Đa dạng", desc: "Đồ dùng, nội thất, công cụ, quần áo và hàng hữu ích cho cộng đồng." },
      rentas: { label: "Cho thuê", desc: "Phòng, căn hộ, không gian và cơ hội nhà ở." },
      empleos: { label: "Việc làm", desc: "Cơ hội việc làm và doanh nghiệp đang tuyển dụng." },
      autos: { label: "Ô tô", desc: "Xe của người bán cá nhân và cơ hội mua bán địa phương." },
      "bienes-raices": {
        label: "Bất động sản",
        desc: "Nhà, đất, bất động sản và cơ hội đầu tư.",
      },
      servicios: { label: "Dịch vụ", desc: "Chuyên gia và dịch vụ đáng tin cậy gần bạn." },
      restaurantes: { label: "Nhà hàng", desc: "Ẩm thực địa phương, thực đơn và địa điểm đáng ghé thăm." },
      travel: { label: "Du lịch", desc: "Ưu đãi, đại lý và tài nguyên để lên kế hoạch chuyến đi." },
      comunidad: { label: "Cộng đồng & Sự kiện", desc: "Sự kiện, hoạt động và kết nối địa phương." },
      clases: { label: "Lớp học", desc: "Khóa học, workshop và học tập cho cộng đồng." },
      busco: {
        label: "Cần tìm",
        desc: "Yêu cầu, nhu cầu, cơ hội và tìm kiếm địa phương.",
      },
      "mascotas-y-perdidos": {
        label: "Thú cưng & Đồ thất lác",
        desc: "Thú cưng, nhận nuôi, đồ thất lạc và hỗ trợ cộng đồng.",
      },
    },
  }, (label) => `Đăng trong ${label}`),
  pt: fromEnHub({
    eyebrow: "LEONIX CLASSIFICADOS",
    title: "Classificados",
    subtitle: "Encontre e publique oportunidades locais em um espaço feito para a nossa comunidade.",
    description:
      "Explore itens à venda, aluguéis, empregos, autos, serviços, eventos e mais. Anúncios comunitários mantêm visível o que a nossa gente busca, oferece e compartilha.",
    ctaPost: "Publicar anúncio",
    ctaExplore: "Explorar categorias",
    sectionBrowse: "Explorar por categoria",
    explore: "EXPLORAR",
    trustLine:
      "Um espaço confiável, familiar e comunitário. Anúncios gratuitos permanecem visíveis na busca.",
    ofertasLocalesTitle: "Ofertas locais",
    ofertasLocalesDesc: "Encontre especiais, cupons e ofertas semanais de negócios locais.",
    ofertasLocalesBrowse: "Ver ofertas",
    ofertasLocalesPublish: "Publique suas ofertas locais",
    categories: {
      "en-venta": { label: "Diversos", desc: "Itens, móveis, ferramentas, roupas e coisas úteis para a comunidade." },
      rentas: { label: "Aluguéis", desc: "Quartos, apartamentos, espaços e oportunidades de moradia." },
      empleos: { label: "Empregos", desc: "Oportunidades de trabalho e negócios contratando." },
      autos: { label: "Autos", desc: "Carros de vendedores particulares e oportunidades locais." },
      "bienes-raices": { label: "Imóveis", desc: "Casas, propriedades, terrenos e oportunidades imobiliárias." },
      servicios: { label: "Serviços", desc: "Profissionais e serviços confiáveis perto de você." },
      restaurantes: { label: "Restaurantes", desc: "Comida local, cardápios e lugares para visitar." },
      travel: { label: "Viagens", desc: "Ofertas, agências e recursos para planejar sua viagem." },
      comunidad: { label: "Comunidade e Eventos", desc: "Eventos, atividades e conexões locais." },
      clases: { label: "Aulas", desc: "Cursos, workshops e aprendizado para a comunidade." },
      busco: { label: "Procuro", desc: "Pedidos, necessidades, oportunidades e buscas locais." },
      "mascotas-y-perdidos": {
        label: "Pets e Perdidos",
        desc: "Animais, adoções, itens perdidos e apoio comunitário.",
      },
    },
  }, (label) => `Publicar em ${label}`),
  tl: fromEnHub({
    eyebrow: "LEONIX CLASSIFIEDS",
    title: "Classifieds",
    subtitle: "Maghanap at mag-post ng lokal na oportunidad sa espasyong ginawa para sa ating komunidad.",
    description:
      "Tuklasin ang binebentang gamit, paupahan, trabaho, kotse, serbisyo, event, at iba pa. Pinapanatiling nakikita ng community listing ang hinahanap, inaalok, at ibinabahagi ng ating mga tao.",
    ctaPost: "Mag-post ng listing",
    ctaExplore: "Tuklasin ang mga kategorya",
    sectionBrowse: "Tuklasin ayon sa kategorya",
    explore: "TUKLASIN",
    trustLine:
      "Mapagkakatiwalaang, pampamilya, at community-first na marketplace. Laging nakikita sa search ang libreng listing.",
    ofertasLocalesTitle: "Mga lokal na alok",
    ofertasLocalesDesc: "Maghanap ng lingguhang espesyal, kupon, at alok mula sa lokal na negosyo.",
    ofertasLocalesBrowse: "Tingnan ang mga alok",
    ofertasLocalesPublish: "I-publish ang iyong lokal na alok",
    categories: {
      "en-venta": { label: "Iba-iba", desc: "Gamit, muwebles, tools, damit, at kapaki-pakinabang na bagay para sa komunidad." },
      rentas: { label: "Paupahan", desc: "Kwarto, apartment, espasyo, at housing opportunity." },
      empleos: { label: "Trabaho", desc: "Oportunidad sa trabaho at negosyong nagha-hire." },
      autos: { label: "Mga kotse", desc: "Kotse mula sa pribadong seller at lokal na pagbili." },
      "bienes-raices": { label: "Real estate", desc: "Bahay, property, lupa, at real estate opportunity." },
      servicios: { label: "Serbisyo", desc: "Mapagkakatiwalaang propesyonal at serbisyo malapit sa iyo." },
      restaurantes: { label: "Restaurant", desc: "Lokal na pagkain, menu, at lugar na pwedeng bisitahin." },
      travel: { label: "Biyahe", desc: "Alok, ahensya, at resource para planuhin ang biyahe." },
      comunidad: { label: "Komunidad at Event", desc: "Event, aktibidad, at lokal na koneksyon." },
      clases: { label: "Mga klase", desc: "Kurso, workshop, at pag-aaral para sa komunidad." },
      busco: { label: "Hinahanap", desc: "Kahilingan, pangangailangan, oportunidad, at lokal na paghahanap." },
      "mascotas-y-perdidos": {
        label: "Alaga at Nawawala",
        desc: "Alagang hayop, adoption, nawawalang gamit, at suporta sa komunidad.",
      },
    },
  }, (label) => `Mag-post sa ${label}`),
  km: fromEnHub({
    title: "ការផ្សាយពាណិជ្ជកម្ម",
    subtitle: "រក និងបង្ហោះឱកាសក្នុងតំបន់ក្នុងកន្លែងសម្រាប់សហគមន៍របស់យើង។",
    ctaPost: "បង្ហោះការផ្សាយ",
    sectionBrowse: "រុករកតាមប្រភេទ",
    explore: "រុករក",
  }, (label) => `បង្ហោះក្នុង ${label}`),
  zh: fromEnHub({
    title: "分类信息",
    subtitle: "在我们为社区打造的空间中查找和发布本地机会。",
    ctaPost: "发布信息",
    ctaExplore: "浏览分类",
    sectionBrowse: "按分类浏览",
    explore: "浏览",
    ofertasLocalesTitle: "本地优惠",
    ofertasLocalesBrowse: "查看优惠",
  }, (label) => `在${label}发布`),
  ja: fromEnHub({
    title: "クラシファイド",
    subtitle: "コミュニティのために作られたスペースで、地域の機会を見つけて投稿できます。",
    ctaPost: "投稿する",
    ctaExplore: "カテゴリを見る",
    sectionBrowse: "カテゴリから探す",
    explore: "探す",
    ofertasLocalesTitle: "ローカル特典",
    ofertasLocalesBrowse: "特典を見る",
    categories: {
      rentas: { label: "賃貸", desc: "部屋、アパート、スペース、住宅の機会。" },
      empleos: { label: "求人", desc: "仕事の機会と採用中のビジネス。" },
      servicios: { label: "サービス", desc: "近くの信頼できるプロとサービス。" },
    },
  }, (label) => `${label}に投稿`),
  ko: fromEnHub({
    title: "분류 광고",
    subtitle: "우리 커뮤니티를 위해 만든 공간에서 지역 기회를 찾고 게시하세요.",
    ctaPost: "게시하기",
    sectionBrowse: "카테고리별 탐색",
    explore: "탐색",
  }, (label) => `${label}에 게시`),
  hi: fromEnHub({
    title: "क्लासिफ़ाइड",
    subtitle: "हमारे समुदाय के लिए बने स्थान में स्थानीय अवसर खोजें और पोस्ट करें।",
    ctaPost: "लिस्टिंग पोस्ट करें",
    sectionBrowse: "श्रेणी के अनुसार देखें",
    explore: "देखें",
  }, (label) => `${label} में पोस्ट करें`),
  hy: fromEnHub({
    title: "Դասակարգված",
    subtitle: "Գտեք և հրապարակեք տեղական հնարավորություններ մեր համայնքի համար ստեղծված տարածքում։",
    ctaPost: "Հրապարակել",
    sectionBrowse: "Դիտել ըստ կategորիայի",
    explore: "ԴԻՏԵԼ",
  }, (label) => `Հրապարակել ${label}-ում`),
  ru: fromEnHub({
    title: "Объявления",
    subtitle: "Находите и публикуйте местные возможности в пространстве для нашего сообщества.",
    ctaPost: "Разместить объявление",
    sectionBrowse: "Смотреть по категориям",
    explore: "СМОТРЕТЬ",
    categories: {
      rentas: { label: "Аренда", desc: "Комнаты, квартиры, жильё." },
      empleos: { label: "Работа", desc: "Вакансии и работодатели." },
    },
  }, (label) => `Опубликовать в ${label}`),
  pa: fromEnHub({
    title: "Classifieds",
    subtitle: "ਸਾਡੇ ਭਾਈਚਾਰੇ ਲਈ ਬਣੀ ਥਾਂ ਵਿੱਚ ਸਥਾਨਕ ਮੌਕੇ ਲੱਭੋ ਅਤੇ ਪੋਸਟ ਕਰੋ।",
    ctaPost: "Listing ਪੋਸਟ ਕਰੋ",
    sectionBrowse: "ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਦੇਖੋ",
    explore: "ਦੇਖੋ",
  }, (label) => `${label} ਵਿੱਚ ਪੋਸਟ ਕਰੋ`),
};

export function getClasificadosHubPageCopy(lang: SupportedLang): ClasificadosHubPageCopy {
  return CLASIFICADOS_HUB_PAGE_COPY[lang] ?? CLASIFICADOS_HUB_PAGE_COPY.en;
}

export function getClasificadosCategoryCopy(
  lang: SupportedLang,
  category: HubCategoryKey,
): ClasificadosCategoryCopy {
  return getClasificadosHubPageCopy(lang).categories[category];
}
