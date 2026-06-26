import type { SupportedLang } from "@/app/lib/language";
import { getMediaKitPageCopy } from "@/app/lib/leonix/mediaKitPageCopy";
import { getPublicLocaleCopy } from "@/app/lib/leonix/publicFormCopy";
import { getMagazineReaderCopy } from "@/app/lib/magazine/magazineReaderCopy";
import type { MagazineHubPageCopy } from "./types";

type CommunityLang = Exclude<SupportedLang, "es" | "en" | "vi">;

type MagazineHubHeroStatic = Pick<
  MagazineHubPageCopy,
  | "heroTitle"
  | "heroSubtitle"
  | "heroDescription"
  | "currentEyebrow"
  | "archiveEyebrow"
  | "archiveTitle"
  | "archiveIntro"
  | "newsletterTitle"
  | "newsletterMicro"
  | "newsletterAria"
  | "advertiseTitle"
  | "flipModalTitle"
  | "loading"
>;

const MAGAZINE_HUB_HERO: Record<CommunityLang, MagazineHubHeroStatic> = {
  pt: {
    heroTitle: "A Revista",
    heroSubtitle: "Comunidade, cultura e negócios numa edição digital e impressa.",
    heroDescription:
      "Explore a edição atual, veja publicações anteriores e mantenha-se conectado com histórias, negócios e oportunidades da nossa comunidade.",
    currentEyebrow: "EDIÇÃO ATUAL",
    archiveEyebrow: "ARQUIVO",
    archiveTitle: "Edições anteriores",
    archiveIntro: "Veja publicações anteriores da Leonix Media num só lugar.",
    newsletterTitle: "Receba a revista e novidades da Leonix",
    newsletterMicro: "Receba atualizações da Leonix Media. Sem spam.",
    newsletterAria: "Inscrição no boletim da revista",
    advertiseTitle: "Quer aparecer numa próxima edição?",
    flipModalTitle: "Leonix Media — Revista digital",
    loading: "Carregando edições…",
  },
  tl: {
    heroTitle: "Ang Magasin",
    heroSubtitle: "Komunidad, kultura, at negosyo sa digital at print na edisyon.",
    heroDescription:
      "Tuklasin ang kasalukuyang edisyon, tingnan ang mga nakaraang isyu, at manatiling konektado sa mga kwento, negosyo, at oportunidad mula sa ating komunidad.",
    currentEyebrow: "KASALUKUYANG EDYON",
    archiveEyebrow: "ARKIBO",
    archiveTitle: "Mga nakaraang edisyon",
    archiveIntro: "Tingnan ang mga nakaraang publikasyon ng Leonix Media sa isang lugar.",
    newsletterTitle: "Kunin ang magasin at mga update mula sa Leonix",
    newsletterMicro: "Tumanggap ng mga update mula sa Leonix Media. Walang spam.",
    newsletterAria: "Mag-sign up sa newsletter ng magasin",
    advertiseTitle: "Gusto mo bang lumabas sa susunod na edisyon?",
    flipModalTitle: "Leonix Media — Digital na magasin",
    loading: "Naglo-load ng mga edisyon…",
  },
  km: {
    heroTitle: "ទស្សនាវដ្តី",
    heroSubtitle: "សហគមន៍ វប្បធម៌ និងអាជីវកម្មក្នុងកំណែឌីជីថល និងបោះពុម្ព។",
    heroDescription:
      "ស្វែងរកកំណែបច្ចុប្បន្ន មើលការបោះពុម្ពមុនៗ និងរក្សាទំនាក់ទំនងជាមួយរឿងរ៉ាវ អាជីវកម្ម និងឱកាសពីសហគមន៍របស់យើង។",
    currentEyebrow: "កំណែបច្ចុប្បន្ន",
    archiveEyebrow: "បណ្ណសារ",
    archiveTitle: "កំណែមុនៗ",
    archiveIntro: "មើលការបោះពុម្ព Leonix Media ពីមុនទាំងអស់ក្នុងកន្លែងតែមួយ។",
    newsletterTitle: "ទទួលទស្សនាវដ្តី និងព័ត៌មាន Leonix",
    newsletterMicro: "ទទួលបច្ចុប្បន្នភាព Leonix Media។ គ្មាន spam។",
    newsletterAria: "ចុះឈ្មោះព្រឹត្តិបត្រទស្សនាវដ្តី",
    advertiseTitle: "ចង់បង្ហាញក្នុងកំណែបន្ទាប់?",
    flipModalTitle: "Leonix Media — ទស្សនាវដ្តីឌីជីថល",
    loading: "កំពុងផ្ទុកកំណែ…",
  },
  zh: {
    heroTitle: "杂志",
    heroSubtitle: "数字版与印刷版中的社区、文化与商业。",
    heroDescription: "浏览当期、查阅往期，并与我们社区的故事、企业与机会保持联系。",
    currentEyebrow: "当期",
    archiveEyebrow: "存档",
    archiveTitle: "往期",
    archiveIntro: "在同一处浏览 Leonix Media 往期出版物。",
    newsletterTitle: "获取杂志与 Leonix 动态",
    newsletterMicro: "接收 Leonix Media 更新。无垃圾邮件。",
    newsletterAria: "杂志通讯订阅",
    advertiseTitle: "想在下一期出现吗？",
    flipModalTitle: "Leonix Media — 数字杂志",
    loading: "正在加载各期…",
  },
  ja: {
    heroTitle: "マガジン",
    heroSubtitle: "デジタル版と印刷版で届けるコミュニティ、文化、ビジネス。",
    heroDescription:
      "最新号を探索し、過去号を閲覧し、コミュニティのストーリー、ビジネス、機会とつながりましょう。",
    currentEyebrow: "最新号",
    archiveEyebrow: "アーカイブ",
    archiveTitle: "過去号",
    archiveIntro: "Leonix Media の過去の出版物を一か所で閲覧できます。",
    newsletterTitle: "マガジンと Leonix の最新情報を受け取る",
    newsletterMicro: "Leonix Media の更新を受け取ります。スパムはありません。",
    newsletterAria: "マガジンニュースレター登録",
    advertiseTitle: "次号に掲載しませんか？",
    flipModalTitle: "Leonix Media — デジタルマガジン",
    loading: "各号を読み込み中…",
  },
  ko: {
    heroTitle: "매거진",
    heroSubtitle: "디지털 및 인쇄판으로 만나는 커뮤니티, 문화, 비즈니스.",
    heroDescription:
      "현재 호를 탐색하고, 지난 호를 살펴보며, 우리 커뮤니티의 이야기, 비즈니스, 기회와 연결을 유지하세요.",
    currentEyebrow: "현재 호",
    archiveEyebrow: "아카이브",
    archiveTitle: "지난 호",
    archiveIntro: "Leonix Media의 이전 간행물을 한곳에서 살펴보세요.",
    newsletterTitle: "매거진과 Leonix 소식 받기",
    newsletterMicro: "Leonix Media 업데이트를 받습니다. 스팸 없음.",
    newsletterAria: "매거진 뉴스레터 가입",
    advertiseTitle: "다음 호에 등장하고 싶으신가요?",
    flipModalTitle: "Leonix Media — 디지털 매거진",
    loading: "호를 불러오는 중…",
  },
  hi: {
    heroTitle: "पत्रिका",
    heroSubtitle: "डिजिटल और प्रिंट संस्करण में समुदाय, संस्कृति और व्यवसाय।",
    heroDescription:
      "वर्तमान संस्करण देखें, पिछले प्रकाशन ब्राउज़ करें, और हमारे समुदाय की कहानियों, व्यवसायों और अवसरों से जुड़े रहें।",
    currentEyebrow: "वर्तमान संस्करण",
    archiveEyebrow: "आर्काइव",
    archiveTitle: "पिछले संस्करण",
    archiveIntro: "Leonix Media के पिछले प्रकाशन एक ही जगह देखें।",
    newsletterTitle: "पत्रिका और Leonix अपडेट प्राप्त करें",
    newsletterMicro: "Leonix Media अपडेट प्राप्त करें। कोई स्पैम नहीं।",
    newsletterAria: "पत्रिका न्यूज़लेटर साइनअप",
    advertiseTitle: "भविष्य के संस्करण में दिखना चाहते हैं?",
    flipModalTitle: "Leonix Media — डिजिटल पत्रिका",
    loading: "संस्करण लोड हो रहे हैं…",
  },
  hy: {
    heroTitle: "Ամսագիր",
    heroSubtitle: "Համայնք, մշակույթ և բիզնես թվային և տպագիր հրատարակությունում։",
    heroDescription:
      "Ուսումնասիրեք ընթացիկ համարը, դիտեք նախորդ հրատարակությունները և մնացեք կապված մեր համայնքի պատմությունների, բիզնեսների և հնարավորությունների հետ։",
    currentEyebrow: "ԸՆԹԱՑԻԿ ՀԱՄԱՐ",
    archiveEyebrow: "ԱՐԽԻՎ",
    archiveTitle: "Նախորդ համարներ",
    archiveIntro: "Դիտեք Leonix Media-ի նախորդ հրատարակությունները մեկ տեղում։",
    newsletterTitle: "Ստացեք ամսագիրն ու Leonix-ի նորությունները",
    newsletterMicro: "Ստացեք Leonix Media թարմացումներ։ Սպամ չկա։",
    newsletterAria: "Ամսագրի տեղեկագրի բաժանորդագրություն",
    advertiseTitle: "Ցանկանու՞մ եք հայտնվել հաջորդ համարում",
    flipModalTitle: "Leonix Media — Թվային ամսագիր",
    loading: "Համարները բեռնվում են…",
  },
  ru: {
    heroTitle: "Журнал",
    heroSubtitle: "Сообщество, культура и бизнес в цифровом и печатном издании.",
    heroDescription:
      "Изучайте текущий выпуск, просматривайте прошлые публикации и оставайтесь на связи с историями, бизнесом и возможностями нашего сообщества.",
    currentEyebrow: "ТЕКУЩИЙ ВЫПУСК",
    archiveEyebrow: "АРХИВ",
    archiveTitle: "Прошлые выпуски",
    archiveIntro: "Просматривайте прошлые публикации Leonix Media в одном месте.",
    newsletterTitle: "Получайте журнал и новости Leonix",
    newsletterMicro: "Получайте обновления Leonix Media. Без спама.",
    newsletterAria: "Подписка на рассылку журнала",
    advertiseTitle: "Хотите появиться в будущем выпуске?",
    flipModalTitle: "Leonix Media — Цифровой журнал",
    loading: "Загрузка выпусков…",
  },
  pa: {
    heroTitle: "ਰਸਾਲਾ",
    heroSubtitle: "ਡਿਜੀਟਲ ਅਤੇ ਛਪਾਈ ਸੰਸਕਰਣ ਵਿੱਚ ਭਾਈਚਾਰਾ, ਸੱਭਿਆਚਾਰ ਅਤੇ ਕਾਰੋਬਾਰ।",
    heroDescription:
      "ਮੌਜੂਦਾ ਸੰਸਕਰਣ ਦੇਖੋ, ਪਿਛਲੀਆਂ ਪ੍ਰਕਾਸ਼ਨਾਂ ਬ੍ਰਾਊਜ਼ ਕਰੋ, ਅਤੇ ਸਾਡੇ ਭਾਈਚਾਰੇ ਦੀਆਂ ਕਹਾਣੀਆਂ, ਕਾਰੋਬਾਰਾਂ ਅਤੇ ਮੌਕਿਆਂ ਨਾਲ ਜੁੜੇ ਰਹੋ।",
    currentEyebrow: "ਮੌਜੂਦਾ ਸੰਸਕਰਣ",
    archiveEyebrow: "ਆਰਕਾਈਵ",
    archiveTitle: "ਪਿਛਲੇ ਸੰਸਕਰਣ",
    archiveIntro: "Leonix Media ਦੀਆਂ ਪਿਛਲੀਆਂ ਪ੍ਰਕਾਸ਼ਨਾਂ ਇੱਕ ਥਾਂ ਵੇਖੋ।",
    newsletterTitle: "ਰਸਾਲਾ ਅਤੇ Leonix ਅਪਡੇਟ ਪ੍ਰਾਪਤ ਕਰੋ",
    newsletterMicro: "Leonix Media ਅਪਡੇਟ ਪ੍ਰਾਪਤ ਕਰੋ। ਕੋਈ ਸਪੈਮ ਨਹੀਂ।",
    newsletterAria: "ਰਸਾਲਾ ਨਿਊਜ਼ਲੈਟਰ ਸਾਈਨਅੱਪ",
    advertiseTitle: "ਭਵਿੱਖ ਦੇ ਸੰਸਕਰਣ ਵਿੱਚ ਦਿਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
    flipModalTitle: "Leonix Media — ਡਿਜੀਟਲ ਰਸਾਲਾ",
    loading: "ਸੰਸਕਰਣ ਲੋਡ ਹੋ ਰਹੇ ਹਨ…",
  },
};

/** Compose hub UI copy for community languages from existing reader, form, and media kit registries. */
export function buildCommunityMagazineHubCopy(lang: CommunityLang): MagazineHubPageCopy {
  const reader = getMagazineReaderCopy(lang);
  const ui = reader.ui;
  const pub = getPublicLocaleCopy(lang);
  const mk = getMediaKitPageCopy(lang);
  const hero = MAGAZINE_HUB_HERO[lang];

  return {
    heroEyebrow: "LEONIX MEDIA",
    ...hero,
    currentTitle: reader.issueMeta.title,
    currentBody: ui.issuePageIntro,
    readMagazine: ui.viewFlipbookSpanish,
    downloadPdf: ui.downloadPdf,
    newsletterBody: pub.newsletter.body,
    newsletterPlaceholder: pub.newsletter.placeholders.email,
    newsletterButton: pub.newsletter.submit,
    emailLabel: pub.newsletter.fields.email,
    advertiseBody: mk.contactCta.body,
    advertiseCta: mk.hero.requestAdCta,
  };
}
