import type { SupportedLang } from "@/app/lib/language";
import { FEATURED_SLUGS_BY_CATEGORY, type Product } from "./catalogData";

export type PromoProductFields = { title: string; subtitle: string };

type CommunityLang = Exclude<SupportedLang, "es" | "en">;

const FEATURED_SLUGS = new Set(Object.values(FEATURED_SLUGS_BY_CATEGORY).flat());

/** Fallback subtitle for non-featured catalog items in community languages. */
export const COMMUNITY_GENERIC_SUBTITLE: Record<CommunityLang, string> = {
  vi: "Chúng tôi có thể giúp bạn tìm và báo giá sản phẩm khuyến mãi này.",
  pt: "Podemos ajudar você a encontrar e cotar este produto promocional.",
  tl: "Matutulungan ka naming mahanap at i-quote ang promotional product na ito.",
  km: "យើងអាចជួយអ្នករក និងប quote ផលិតផលផ្សព្វផ្សាយនេះ។",
  zh: "我们可以帮您采购并报价此促销产品。",
  ja: "このプロモーション商品の調達とお見積もりをお手伝いできます。",
  ko: "이 프로모션 제품을 찾고 견적하는 데 도움을 드릴 수 있습니다.",
  hi: "हम इस प्रचार उत्पाद को खोजने और कोट करने में आपकी मदद कर सकते हैं।",
  hy: "Կարող ենք օգնել գտնել և գնահատել այս խթանման ապրանքը։",
  ru: "Мы можем помочь найти и рассчитать стоимость этой рекламной продукции.",
  pa: "Asi is promotional product source te quote kar sakde haan.",
};

/** Vietnamese — full featured-slug translations (Gate 1C-H, 39 slugs). */
export const COMMUNITY_VI: Record<string, PromoProductFields> = {
  "standard-business-cards": {
    title: "Danh thiếp tiêu chuẩn",
    subtitle: "Lựa chọn cổ điển chuyên nghiệp với mức giá phải chăng.",
  },
  "premium-business-cards": {
    title: "Danh thiếp cao cấp",
    subtitle: "Giấy dày, màu sắc sống động, hoàn thiện vượt trội.",
  },
  "matte-business-cards": {
    title: "Danh thiếp mờ",
    subtitle: "Hoàn thiện mềm mại, thanh lịch, không chói.",
  },
  "gloss-business-cards": {
    title: "Danh thiếp bóng",
    subtitle: "Màu sắc rực rỡ với lớp bóng cao cấp, ấn tượng mạnh.",
  },
  "foil-business-cards": {
    title: "Danh thiếp foil",
    subtitle: "Chi tiết vàng hoặc bạc tạo ấn tượng lâu dài.",
  },
  "spot-uv-business-cards": {
    title: "Danh thiếp Spot UV",
    subtitle: "Lớp bóng chọn lọc làm nổi bật thiết kế của bạn.",
  },
  "painted-edge-business-cards": {
    title: "Danh thiếp cạnh màu",
    subtitle: "Màu sắc ở cạnh giúp bạn nổi bật khác biệt.",
  },
  "plastic-business-cards": {
    title: "Danh thiếp nhựa",
    subtitle: "Chống nước, bền và tạo ấn tượng mạnh.",
  },
  "loyalty-cards": {
    title: "Thẻ khách hàng thân thiết",
    subtitle: "Giữ chân khách hàng bằng điểm, tem hoặc giảm giá.",
  },
  flyers: {
    title: "Tờ rơi",
    subtitle: "Thiết kế bắt mắt cho tác động nhanh và rộng rãi.",
  },
  brochures: {
    title: "Brochure",
    subtitle: "Giới thiệu doanh nghiệp trong định dạng đầy đủ, chuyên nghiệp.",
  },
  postcards: {
    title: "Bưu thiếp",
    subtitle: "Lý tưởng cho thư trực tiếp và khuyến mãi đặc biệt.",
  },
  menus: {
    title: "Thực đơn",
    subtitle: "In ấn chất lượng cho nhà hàng và sự kiện.",
  },
  "presentation-folders": {
    title: "Folder trình bày",
    subtitle: "Thể hiện sự chuyên nghiệp trong mọi cuộc họp kinh doanh.",
  },
  stickers: {
    title: "Sticker",
    subtitle: "Đa dụng, tiết kiệm và dễ nhận diện.",
  },
  "vinyl-banners": {
    title: "Banner vinyl",
    subtitle: "Khổ lớn với giá cạnh tranh cho sử dụng ngoài trời.",
  },
  "retractable-banners": {
    title: "Banner cuốn",
    subtitle: "Dễ lắp đặt và mang theo cho mọi sự kiện.",
  },
  "yard-signs": {
    title: "Biển sân",
    subtitle: "Hiện diện địa phương tại nhà, sự kiện và doanh nghiệp.",
  },
  "sidewalk-signs": {
    title: "Biển vỉa hè",
    subtitle: "Thu hút khách hàng đi ngang qua cửa hàng của bạn.",
  },
  "tote-bags": {
    title: "Túi tote",
    subtitle: "Thương hiệu của bạn hiện diện mỗi lần đi chợ.",
  },
  mugs: {
    title: "Cốc",
    subtitle: "Hiện diện hàng ngày trong thói quen buổi sáng của khách hàng.",
  },
  pens: {
    title: "Bút",
    subtitle: "Vật phẩm khuyến mãi được sử dụng rộng rãi nhất thế giới.",
  },
  "t-shirts": {
    title: "Áo thun",
    subtitle: "Đồng phục và quà tặng mang thương hiệu của bạn đi khắp nơi.",
  },
  hats: {
    title: "Mũ",
    subtitle: "Logo của bạn trên đầu mỗi khách hàng.",
  },
  tumblers: {
    title: "Ly giữ nhiệt",
    subtitle: "Thương hiệu hiện diện mỗi ly cà phê và cuộc họp.",
  },
  "water-bottles": {
    title: "Chai nước",
    subtitle: "Quà tặng cao cấp được ưa chuộng tại sự kiện.",
  },
  keychains: {
    title: "Móc khóa",
    subtitle: "Tiện dụng và luôn bên người — trong túi khách hàng.",
  },
  notebooks: {
    title: "Sổ tay",
    subtitle: "Thương hiệu trên mỗi trang — hữu ích và dễ nhớ.",
  },
  "event-giveaways": {
    title: "Quà tặng sự kiện",
    subtitle: "Bộ vật phẩm hữu ích cho hội chợ và ra mắt sản phẩm.",
  },
  buttons: {
    title: "Huy hiệu",
    subtitle: "Tiết kiệm, vui nhộn và dễ nhận diện tại sự kiện.",
  },
  lanyards: {
    title: "Dây đeo thẻ",
    subtitle: "Cho sự kiện, hội nghị và thẻ nhân viên.",
  },
  coasters: {
    title: "Lót ly",
    subtitle: "Thông tin liên hệ luôn trước mắt khách hàng.",
  },
  umbrellas: {
    title: "Ô",
    subtitle: "Lớn, dễ thấy và hữu ích trong mọi thời tiết.",
  },
  "branded-starter-kit": {
    title: "Bộ khởi đầu thương hiệu",
    subtitle: "Danh thiếp, tờ rơi và biển hiệu để bắt đầu đúng cách.",
  },
  "grand-opening-kit": {
    title: "Bộ khai trương",
    subtitle: "Mọi thứ cho buổi ra mắt nổi bật và ấn tượng.",
  },
  "restaurant-starter-kit": {
    title: "Bộ dụng cụ nhà hàng",
    subtitle: "Thực đơn, bưu thiếp, biển hiệu và danh thiếp cho quán của bạn.",
  },
  "real-estate-marketing-kit": {
    title: "Bộ marketing bất động sản",
    subtitle: "Biển hiệu, bưu thiếp, folder và danh thiếp cho môi giới.",
  },
  "event-booth-kit": {
    title: "Bộ gian hàng sự kiện",
    subtitle: "Lều, banner, bảng và vật liệu trưng bày hội chợ.",
  },
  "new-business-launch-bundle": {
    title: "Gói ra mắt doanh nghiệp mới",
    subtitle: "Bộ kit đầy đủ cho tháng đầu tiên của doanh nghiệp.",
  },
};

/** Portuguese — featured slug overrides. */
export const COMMUNITY_PT: Partial<Record<string, PromoProductFields>> = {
  "standard-business-cards": {
    title: "Cartões de visita padrão",
    subtitle: "A opção clássica e profissional a um preço acessível.",
  },
  "premium-business-cards": {
    title: "Cartões de visita premium",
    subtitle: "Papel grosso, cores vibrantes, acabamento superior.",
  },
  flyers: { title: "Flyers", subtitle: "Designs chamativos para impacto imediato e amplo." },
  "vinyl-banners": {
    title: "Banners de vinil",
    subtitle: "Grande formato a preços competitivos para uso externo.",
  },
  "tote-bags": {
    title: "Sacolas tote",
    subtitle: "Sua marca visível em cada ida ao mercado.",
  },
  mugs: { title: "Canecas", subtitle: "Presença diária na rotina matinal dos clientes." },
  pens: { title: "Canetas", subtitle: "O item promocional mais usado no mundo." },
  "branded-starter-kit": {
    title: "Kit inicial de marca",
    subtitle: "Cartões, flyer e placa para começar sua marca bem.",
  },
};

/** Japanese — featured slug overrides. */
export const COMMUNITY_JA: Partial<Record<string, PromoProductFields>> = {
  "standard-business-cards": {
    title: "標準名刺",
    subtitle: "手頃な価格のクラシックでプロフェッショナルな選択肢。",
  },
  "premium-business-cards": {
    title: "プレミアム名刺",
    subtitle: "厚手用紙、鮮やかな色、上質な仕上げ。",
  },
  flyers: { title: "チラシ", subtitle: "即効性と広範囲なインパクトのための目を引くデザイン。" },
  "vinyl-banners": {
    title: "ビニールバナー",
    subtitle: "屋外利用向けの競争力のある価格の大型フォーマット。",
  },
  "tote-bags": { title: "トートバッグ", subtitle: "買い物のたびにブランドが目に入る。" },
  mugs: { title: "マグカップ", subtitle: "お客様の朝のルーティンに毎日の存在感。" },
  pens: { title: "ペン", subtitle: "世界で最も広く使われるプロモーションアイテム。" },
  "branded-starter-kit": {
    title: "ブランドスターターキット",
    subtitle: "名刺、チラシ、看板でブランドを正しくスタート。",
  },
};

/** Punjabi — featured slug overrides (Gurmukhi + common business terms). */
export const COMMUNITY_PA: Partial<Record<string, PromoProductFields>> = {
  "standard-business-cards": {
    title: "Standard business cards",
    subtitle: "Classic professional option accessible price te.",
  },
  "premium-business-cards": {
    title: "Premium business cards",
    subtitle: "Mota paper, vibrant colors, superior finish.",
  },
  flyers: { title: "Flyers", subtitle: "Eye-catching designs turant te wide impact lai." },
  "vinyl-banners": {
    title: "Vinyl banners",
    subtitle: "Outdoor use lai competitive price te large format.",
  },
  "tote-bags": { title: "Tote bags", subtitle: "Tuhada brand har market trip te visible." },
  mugs: { title: "Mugs", subtitle: "Clients di daily morning routine vich presence." },
  pens: { title: "Pens", subtitle: "Duniya da sab ton vadhiya promotional item." },
  "branded-starter-kit": {
    title: "Branded starter kit",
    subtitle: "Cards, flyer te sign — brand sahi shuru karan lai.",
  },
};

const COMMUNITY_FEATURED_BY_LANG: Partial<Record<CommunityLang, Partial<Record<string, PromoProductFields>>>> = {
  vi: COMMUNITY_VI,
  pt: COMMUNITY_PT,
  ja: COMMUNITY_JA,
  pa: COMMUNITY_PA,
};

function communityGeneric(lang: CommunityLang): string {
  return COMMUNITY_GENERIC_SUBTITLE[lang];
}

/** Resolve product title/subtitle for catalog cards by route language. */
export function resolvePromoProductFields(product: Product, lang: SupportedLang): PromoProductFields {
  if (lang === "es") return product.es;
  if (lang === "en") return product.en;

  const communityLang = lang as CommunityLang;
  const featuredMap = COMMUNITY_FEATURED_BY_LANG[communityLang];
  const featured = featuredMap?.[product.slug];
  if (featured) return featured;

  const generic = communityGeneric(communityLang);
  return {
    title: product.en.title,
    subtitle: generic,
  };
}

export { FEATURED_SLUGS };
