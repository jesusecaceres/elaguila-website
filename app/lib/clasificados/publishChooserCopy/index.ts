import type { SupportedLang } from "@/app/lib/language";

export type PublishChooserCopy = {
  title: string;
  subtitle: string;
  back: string;
  featuredEyebrow: string;
  featuredTitle: string;
  featuredBody: string;
  featuredCta: string;
  featuredNote: string;
  loading: string;
  continueLabel: string;
  ofertasLocalesTitle: string;
  ofertasLocalesPublish: string;
};

const ES: PublishChooserCopy = {
  title: "Publicar anuncio",
  subtitle: "Elige una categoría para continuar.",
  back: "Volver a Clasificados",
  featuredEyebrow: "Publicar · destacado",
  featuredTitle: "Bienes Raíces",
  featuredBody: "Profesional (Negocio) o particular (Privado). Toca para elegir tu camino.",
  featuredCta: "Entrar a publicar BR",
  featuredNote: "Privado + Negocio · un solo toque",
  loading: "Cargando…",
  continueLabel: "Continuar",
  ofertasLocalesTitle: "Ofertas Locales",
  ofertasLocalesPublish: "Publica tus ofertas locales",
};

const EN: PublishChooserCopy = {
  title: "Post a listing",
  subtitle: "Choose a category to continue.",
  back: "Back to Classifieds",
  featuredEyebrow: "Post · featured",
  featuredTitle: "Real estate",
  featuredBody: "Professional (Business) or private seller. Tap to pick your path.",
  featuredCta: "Continue to BR posting",
  featuredNote: "Private + Business · one tap",
  loading: "Loading…",
  continueLabel: "Continue",
  ofertasLocalesTitle: "Local Deals",
  ofertasLocalesPublish: "Publish your local deals",
};

function fromEn(partial: Partial<PublishChooserCopy>): PublishChooserCopy {
  return { ...EN, ...partial };
}

export const PUBLISH_CHOOSER_COPY: Record<SupportedLang, PublishChooserCopy> = {
  es: ES,
  en: EN,
  vi: fromEn({
    title: "Đăng tin",
    subtitle: "Chọn danh mục để tiếp tục.",
    back: "Quay lại Rao vặt",
    featuredTitle: "Bất động sản",
    featuredCta: "Tiếp tục đăng BR",
  }),
  pt: fromEn({
    title: "Publicar anúncio",
    subtitle: "Escolha uma categoria para continuar.",
    back: "Voltar aos Classificados",
    featuredTitle: "Imóveis",
    featuredCta: "Continuar para publicar BR",
    ofertasLocalesTitle: "Ofertas locais",
    ofertasLocalesPublish: "Publique suas ofertas locais",
  }),
  tl: fromEn({
    title: "Mag-post ng listing",
    subtitle: "Pumili ng kategorya para magpatuloy.",
    back: "Bumalik sa Classifieds",
    featuredCta: "Magpatuloy sa BR posting",
    ofertasLocalesTitle: "Mga lokal na alok",
    ofertasLocalesPublish: "I-publish ang iyong lokal na alok",
  }),
  km: fromEn({
    title: "បង្ហោះការផ្សាយ",
    subtitle: "ជ្រើសប្រភេទដើម្បីបន្ត។",
    back: "ត្រឡប់ទៅ Clasificados",
  }),
  zh: fromEn({
    title: "发布信息",
    subtitle: "选择分类以继续。",
    back: "返回分类信息",
    featuredTitle: "房地产",
  }),
  ja: fromEn({
    title: "投稿する",
    subtitle: "カテゴリを選んで続けます。",
    back: "クラシファイドに戻る",
    featuredTitle: "不動産",
    featuredCta: "BR投稿へ進む",
  }),
  ko: fromEn({
    title: "게시하기",
    subtitle: "계속하려면 카테고리를 선택하세요.",
    back: "분류 광고로 돌아가기",
  }),
  hi: fromEn({
    title: "लिस्टिंग पोस्ट करें",
    subtitle: "जारी रखने के लिए श्रेणी चुनें।",
    back: "क्लासिफ़ाइड पर वापस",
  }),
  hy: fromEn({
    title: "Հրապարակել",
    subtitle: "Շարունակելու համար ընտրեք կategորիա։",
    back: "Վերադառնալ դասակարգված",
  }),
  ru: fromEn({
    title: "Разместить объявление",
    subtitle: "Выберите категорию, чтобы продолжить.",
    back: "Назад к объявлениям",
    featuredTitle: "Недвижимость",
  }),
  pa: fromEn({
    title: "Listing ਪੋਸਟ ਕਰੋ",
    subtitle: "ਜਾਰੀ ਰੱਖਣ ਲਈ ਸ਼੍ਰੇਣੀ ਚੁਣੋ।",
    back: "Classifieds 'ਤੇ ਵਾਪਸ",
  }),
};

export function getPublishChooserCopy(lang: SupportedLang): PublishChooserCopy {
  return PUBLISH_CHOOSER_COPY[lang] ?? PUBLISH_CHOOSER_COPY.en;
}
