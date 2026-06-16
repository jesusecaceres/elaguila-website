import type { SupportedLang } from "@/app/lib/language";
import { PRODUCTOS_PROMOCION_PAGE_EN } from "./en";
import type { ProductosPromocionPageCopy } from "./types";

function fromEn(partial: Partial<ProductosPromocionPageCopy>): ProductosPromocionPageCopy {
  return { ...PRODUCTOS_PROMOCION_PAGE_EN, ...partial };
}

const VI: ProductosPromocionPageCopy = {
  heroEyebrow: "SẢN PHẨM KHUYẾN MÃI · LEONIX",
  heroTitle: "Sản phẩm khuyến mãi",
  heroSubtitle:
    "Mọi thứ bạn cần để giới thiệu, quảng bá và phát triển doanh nghiệp: danh thiếp, tờ rơi, biển hiệu, banner, quà tặng và hơn thế nữa.",
  helperCopy:
    "Khám phá một số sản phẩm chúng tôi có thể giúp bạn tìm. Nếu bạn không thấy ở đây, chúng tôi vẫn có thể báo giá.",
  requestQuote: "Yêu cầu báo giá",
  call: "Gọi",
  openMap: "Mở bản đồ",
  categoryTabsAria: "Danh mục sản phẩm",
  additionalHeading: "Chúng tôi cũng có thể báo giá",
  additionalHelper: "Nếu bạn không thấy đúng thứ mình cần, chúng tôi vẫn có thể giúp bạn báo giá.",
  customQuoteCallout: "Không thấy sản phẩm bạn cần? Chúng tôi có thể giúp báo giá.",
  customQuoteBtn: "Yêu cầu báo giá tùy chỉnh",
  bottomHeading: "Bạn muốn trao đổi trực tiếp?",
  bottomBody:
    "Ghé thăm, gọi điện hoặc gửi email cho chúng tôi. Chúng tôi giúp bạn chọn đúng sản phẩm cho doanh nghiệp.",
  mailtoSubject: "Yêu cầu báo giá — Sản phẩm khuyến mãi",
  categories: {
    "business-cards": {
      label: "Danh thiếp",
      description: "In ấn chất lượng cao để đại diện thương hiệu của bạn.",
    },
    marketing: {
      label: "In ấn marketing",
      description: "Tài liệu in để quảng bá doanh nghiệp hiệu quả.",
    },
    signs: {
      label: "Biển hiệu và banner",
      description: "Hiển thị khổ lớn ở nơi quan trọng nhất.",
    },
    promo: {
      label: "Sản phẩm khuyến mãi",
      description: "Vật phẩm mang thương hiệu mà khách hàng giữ lại.",
    },
    essentials: {
      label: "Thiết yếu cho doanh nghiệp",
      description: "Bộ kit và gói để khởi động hoặc phát triển doanh nghiệp.",
    },
  },
};

const PT: ProductosPromocionPageCopy = {
  heroEyebrow: "PRODUTOS PROMOCIONAIS · LEONIX",
  heroTitle: "Produtos promocionais",
  heroSubtitle:
    "Tudo o que você precisa para apresentar, promover e fazer crescer seu negócio: cartões, flyers, placas, banners, brindes e muito mais.",
  helperCopy:
    "Explore alguns dos produtos que podemos ajudar você a conseguir. Se não vir aqui, ainda podemos cotar.",
  requestQuote: "Solicitar cotação",
  call: "Ligar",
  openMap: "Abrir mapa",
  categoryTabsAria: "Categorias de produtos",
  additionalHeading: "Também podemos cotar",
  additionalHelper: "Se não vir exatamente o que precisa, ainda podemos ajudar a cotar.",
  customQuoteCallout: "Não vê o que precisa? Podemos ajudar a cotar.",
  customQuoteBtn: "Solicitar cotação personalizada",
  bottomHeading: "Prefere conversar pessoalmente?",
  bottomBody:
    "Visite-nos, ligue ou envie um e-mail. Ajudamos você a escolher os produtos certos para seu negócio.",
  mailtoSubject: "Solicitação de cotação — Produtos promocionais",
  categories: {
    "business-cards": {
      label: "Cartões de visita",
      description: "Impressão de alta qualidade para representar sua marca.",
    },
    marketing: {
      label: "Impressos de marketing",
      description: "Materiais impressos para promover seu negócio com eficiência.",
    },
    signs: {
      label: "Placas e banners",
      description: "Visibilidade em grande formato onde mais importa.",
    },
    promo: {
      label: "Produtos promocionais",
      description: "Itens com sua marca que os clientes guardam.",
    },
    essentials: {
      label: "Essenciais para negócios",
      description: "Kits e pacotes para iniciar ou expandir seu negócio.",
    },
  },
};

const JA: ProductosPromocionPageCopy = {
  heroEyebrow: "プロモーション商品 · LEONIX",
  heroTitle: "プロモーション商品",
  heroSubtitle:
    "ビジネスの紹介、プロモーション、成長に必要なものすべて：名刺、チラシ、看板、バナー、ノベルティなど。",
  helperCopy:
    "ご用意できる商品の一部をご覧ください。ここにない商品もお見積もり可能です。",
  requestQuote: "見積もり依頼",
  call: "電話",
  openMap: "地図を開く",
  categoryTabsAria: "商品カテゴリ",
  additionalHeading: "こちらもお見積もり可能",
  additionalHelper: "必要なものが見つからなくても、お見積もりをお手伝いできます。",
  customQuoteCallout: "お探しの商品が見つかりませんか？お見積もりをお手伝いします。",
  customQuoteBtn: "カスタム見積もり依頼",
  bottomHeading: "直接お話ししたいですか？",
  bottomBody:
    "ご来店、お電話、メールでご連絡ください。ビジネスに最適な商品選びをお手伝いします。",
  mailtoSubject: "見積もり依頼 — プロモーション商品",
  categories: {
    "business-cards": {
      label: "名刺",
      description: "ブランドを代表する高品質印刷。",
    },
    marketing: {
      label: "マーケティング印刷物",
      description: "ビジネスを効果的に宣伝する印刷物。",
    },
    signs: {
      label: "看板・バナー",
      description: "最も重要な場所での大型表示。",
    },
    promo: {
      label: "プロモーション商品",
      description: "お客様が手元に残すブランド付きアイテム。",
    },
    essentials: {
      label: "ビジネス必需品",
      description: "起業・成長のためのキットとバンドル。",
    },
  },
};

const PA: ProductosPromocionPageCopy = fromEn({
  heroEyebrow: "ਪ੍ਰਚਾਰ ਉਤਪਾਦ · LEONIX",
  heroTitle: "ਪ੍ਰਚਾਰ ਉਤਪਾਦ",
  requestQuote: "Quote manggo",
  call: "Call karo",
  openMap: "Map kholho",
  bottomHeading: "Seedha gal karna chaunde ho?",
  mailtoSubject: "Quote request — Promotional Products",
});


export const PRODUCTOS_PROMOCION_PAGE_COMMUNITY: Partial<Record<SupportedLang, ProductosPromocionPageCopy>> = {
  vi: VI,
  pt: PT,
  ja: JA,
  pa: PA,
  tl: fromEn({
    heroEyebrow: "PROMOTIONAL PRODUCTS · LEONIX",
    heroTitle: "Promotional products",
    heroSubtitle:
      "Lahat ng kailangan mo para ipakita, i-promote, at palaguin ang negosyo: cards, flyers, signs, banners, promotional items, at iba pa.",
    helperCopy:
      "Tingnan ang ilang produktong matutulungan ka naming makuha. Kung wala rito, maaari pa rin naming i-quote.",
    requestQuote: "Humiling ng quote",
    call: "Tumawag",
    openMap: "Buksan ang mapa",
    categoryTabsAria: "Mga kategorya ng produkto",
    additionalHeading: "Maaari rin naming i-quote",
    additionalHelper: "Kung hindi mo makita ang eksaktong kailangan mo, matutulungan ka pa rin naming mag-quote.",
    customQuoteCallout: "Hindi mo makita ang kailangan mo? Matutulungan ka naming mag-quote.",
    customQuoteBtn: "Humiling ng custom quote",
    bottomHeading: "Mas gusto mong makipag-usap nang personal?",
    bottomBody:
      "Bisitahin kami, tumawag, o mag-email. Matutulungan ka naming pumili ng tamang produkto para sa negosyo mo.",
    mailtoSubject: "Quote request — Promotional Products",
    categories: {
      "business-cards": { label: "Business cards", description: "High-quality print para sa brand mo." },
      marketing: { label: "Marketing print", description: "Printed materials para i-promote ang negosyo." },
      signs: { label: "Signs at banners", description: "Large-format visibility kung saan pinaka-mahalaga." },
      promo: { label: "Promo products", description: "Branded items na itatago ng clients." },
      essentials: { label: "Business essentials", description: "Kits at bundles para magsimula o lumago." },
    },
  }),
  km: fromEn({
    heroEyebrow: "ផលិតផលផ្សព្វផ្សាយ · LEONIX",
    heroTitle: "ផលិតផលផ្សព្វផ្សាយ",
    requestQuote: "ស្នើសុំការប quote",
    call: "ទូរស័ព្ទ",
    openMap: "បើកផែនទី",
    categoryTabsAria: "ប្រភេទផលិតផល",
    additionalHeading: "យើងក៏អាចប quote បាន",
    customQuoteBtn: "ស្នើសុំ custom quote",
    bottomHeading: "ចង់និយាយផ្ទាល់?",
    mailtoSubject: "Quote request — Promotional Products",
  }),
  zh: fromEn({
    heroEyebrow: "促销产品 · LEONIX",
    heroTitle: "促销产品",
    heroSubtitle: "展示、推广和发展业务所需的一切：名片、传单、标牌、横幅、促销品等。",
    helperCopy: "浏览我们可以帮您采购的部分产品。如果这里没有，我们仍可报价。",
    requestQuote: "请求报价",
    call: "致电",
    openMap: "打开地图",
    categoryTabsAria: "产品类别",
    additionalHeading: "我们也可以报价",
    additionalHelper: "如果没有看到您需要的，我们仍可帮您报价。",
    customQuoteCallout: "没有看到需要的？我们可以帮您报价。",
    customQuoteBtn: "请求定制报价",
    bottomHeading: "想当面沟通？",
    bottomBody: "欢迎来访、致电或发邮件。我们帮您选择适合业务的产品。",
    mailtoSubject: "报价请求 — 促销产品",
    categories: {
      "business-cards": { label: "名片", description: "高品质印刷，代表您的品牌。" },
      marketing: { label: "营销印刷品", description: "有效推广业务的印刷材料。" },
      signs: { label: "标牌与横幅", description: "在最重要的地方实现大幅面展示。" },
      promo: { label: "促销产品", description: "客户会保留的品牌物品。" },
      essentials: { label: "商业必需品", description: "创业或发展业务的套装与组合。" },
    },
  }),
  ko: fromEn({
    heroEyebrow: "프로모션 제품 · LEONIX",
    heroTitle: "프로모션 제품",
    requestQuote: "견적 요청",
    call: "전화",
    openMap: "지도 열기",
    categoryTabsAria: "제품 카테고리",
    additionalHeading: "다음도 견적 가능",
    customQuoteCallout: "필요한 것이 보이지 않나요? 견적을 도와드립니다.",
    customQuoteBtn: "맞춤 견적 요청",
    bottomHeading: "직접 상담하시겠어요?",
    mailtoSubject: "견적 요청 — 프로모션 제품",
  }),
  hi: fromEn({
    heroEyebrow: "प्रचार उत्पाद · LEONIX",
    heroTitle: "प्रचार उत्पाद",
    requestQuote: "कोटेशन अनुरोध",
    call: "कॉल करें",
    openMap: "मानचित्र खोलें",
    categoryTabsAria: "उत्पाद श्रेणियाँ",
    additionalHeading: "हम यह भी कोट कर सकते हैं",
    customQuoteBtn: "कस्टम कोटेशन अनुरोध",
    bottomHeading: "सीधे बात करना चाहते हैं?",
    mailtoSubject: "कोटेशन अनुरोध — प्रचार उत्पाद",
  }),
  hy: fromEn({
    heroEyebrow: "Խթանման ապրանքներ · LEONIX",
    heroTitle: "Խթանման ապրանքներ",
    requestQuote: "Հարցում գնահատման",
    call: "Զանգ",
    openMap: "Բացել քարտեզը",
    additionalHeading: "Կարող ենք նաև գնահատել",
    customQuoteBtn: "Անհատական գնահատման հարցում",
    bottomHeading: "Ցանկանու՞մ եք անմիջապես խոսել",
    mailtoSubject: "Quote request — Promotional Products",
  }),
  ru: fromEn({
    heroEyebrow: "РЕКЛАМНАЯ ПРОДУКЦИЯ · LEONIX",
    heroTitle: "Рекламная продукция",
    heroSubtitle:
      "Всё для представления, продвижения и роста бизнеса: визитки, листовки, вывески, баннеры, сувениры и другое.",
    helperCopy:
      "Посмотрите часть продукции, которую мы можем помочь заказать. Если не видите здесь — всё равно можем рассчитать цену.",
    requestQuote: "Запросить расчёт",
    call: "Позвонить",
    openMap: "Открыть карту",
    categoryTabsAria: "Категории продукции",
    additionalHeading: "Мы также можем рассчитать",
    additionalHelper: "Если не видите нужное, мы всё равно поможем с расчётом.",
    customQuoteCallout: "Не видите нужное? Поможем рассчитать.",
    customQuoteBtn: "Запросить индивидуальный расчёт",
    bottomHeading: "Предпочитаете поговорить лично?",
    bottomBody:
      "Приходите, звоните или пишите на email. Поможем выбрать подходящую продукцию для вашего бизнеса.",
    mailtoSubject: "Запрос расчёта — рекламная продукция",
    categories: {
      "business-cards": { label: "Визитки", description: "Качественная печать для представления бренда." },
      marketing: { label: "Маркетинговая печать", description: "Печатные материалы для эффективного продвижения." },
      signs: { label: "Вывески и баннеры", description: "Крупноформатная видимость там, где это важнее всего." },
      promo: { label: "Рекламная продукция", description: "Брендированные изделия, которые клиенты сохраняют." },
      essentials: { label: "Бизнес-наборы", description: "Комплекты для старта или роста бизнеса." },
    },
  }),
};
