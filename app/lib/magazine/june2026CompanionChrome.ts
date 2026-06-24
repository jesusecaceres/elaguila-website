import type { SupportedLang } from "@/app/lib/language";

export type CompanionChrome = {
  eyebrow: string;
  pageTitle: string;
  issueLabel: string;
  introSummary: string;
  visualTruthNote: string;
  bodyLanguageNote?: string;
  ctas: {
    actionsTitle: string;
    openVisualMagazine: string;
    qrGuide: string;
    mediaKit: string;
    advertise: string;
    googleTranslate: string;
    backToQrGuide: string;
  };
};

export const COMPANION_CHROME_BY_LANG: Record<SupportedLang, CompanionChrome> = {
  es: {
    eyebrow: "LEONIX · COMPAÑERO LEGIBLE",
    pageTitle: "Compañero legible — Junio 2026",
    issueLabel: "Leonix Media · Junio 2026",
    introSummary:
      "Esta página HTML es un compañero legible para la revista visual de junio. Resume temas, negocios y acciones en tu idioma — no reemplaza el PDF ni el flipbook en español.",
    visualTruthNote:
      "La edición visual original (PDF y flipbook) permanece en español. Leonix no traduce automáticamente ese archivo visual.",
    ctas: {
      actionsTitle: "Acciones rápidas",
      openVisualMagazine: "Abrir revista visual original (español)",
      qrGuide: "Abrir guía QR de traducción",
      mediaKit: "Ver Media Kit",
      advertise: "Anunciar con Leonix",
      googleTranslate: "Traducir LeonixMedia.com con Google",
      backToQrGuide: "Volver a la guía QR",
    },
  },
  en: {
    eyebrow: "LEONIX · READABLE COMPANION",
    pageTitle: "Readable companion — June 2026",
    issueLabel: "Leonix Media · June 2026",
    introSummary:
      "This HTML page is a readable companion to the June visual magazine. It summarizes themes, businesses, and actions in your language — it does not replace the Spanish PDF or flipbook.",
    visualTruthNote:
      "The original visual edition (PDF and flipbook) remains in Spanish. Leonix does not automatically translate that visual file.",
    ctas: {
      actionsTitle: "Quick actions",
      openVisualMagazine: "Open original visual magazine (Spanish)",
      qrGuide: "Open QR translation guide",
      mediaKit: "View Media Kit",
      advertise: "Advertise with Leonix",
      googleTranslate: "Translate LeonixMedia.com with Google",
      backToQrGuide: "Back to QR guide",
    },
  },
  vi: {
    eyebrow: "LEONIX · BẢN ĐỌC ĐƯỢC",
    pageTitle: "Bản đọc được — Tháng 6 2026",
    issueLabel: "Leonix Media · Tháng 6 2026",
    introSummary:
      "Trang HTML này là bản đọc được cho tạp chí hình ảnh tháng 6. Tóm tắt chủ đề, doanh nghiệp và hành động bằng ngôn ngữ của bạn — không thay thế PDF hay flipbook tiếng Tây Ban Nha.",
    visualTruthNote:
      "Bản tạp chí hình ảnh gốc (PDF và flipbook) vẫn bằng tiếng Tây Ban Nha. Leonix không tự dịch tệp hình ảnh đó.",
    bodyLanguageNote:
      "Các phần tóm tắt bên dưới hiện có bằng tiếng Tây Ban Nha hoặc tiếng Anh. Tiêu đề trang, phần giới thiệu và các nút hành động đã được hiển thị bằng ngôn ngữ bạn chọn.",
    ctas: {
      actionsTitle: "Hành động nhanh",
      openVisualMagazine: "Mở tạp chí hình ảnh gốc (tiếng Tây Ban Nha)",
      qrGuide: "Mở hướng dẫn QR dịch",
      mediaKit: "Xem Media Kit",
      advertise: "Quảng cáo với Leonix",
      googleTranslate: "Dịch LeonixMedia.com bằng Google",
      backToQrGuide: "Quay lại hướng dẫn QR",
    },
  },
  pt: {
    eyebrow: "LEONIX · COMPANION LEGÍVEL",
    pageTitle: "Companion legível — Junho 2026",
    issueLabel: "Leonix Media · Junho 2026",
    introSummary:
      "Esta página HTML é um companion legível para a revista visual de junho. Resume temas, negócios e ações no seu idioma — não substitui o PDF nem o flipbook em espanhol.",
    visualTruthNote:
      "A edição visual original (PDF e flipbook) permanece em espanhol. Leonix não traduz automaticamente esse arquivo visual.",
    bodyLanguageNote:
      "Os resumos das seções abaixo estão em espanhol ou inglês por enquanto. O cabeçalho, introdução e botões de ação estão no idioma selecionado.",
    ctas: {
      actionsTitle: "Ações rápidas",
      openVisualMagazine: "Abrir revista visual original (espanhol)",
      qrGuide: "Abrir guia QR de tradução",
      mediaKit: "Ver Media Kit",
      advertise: "Anunciar com Leonix",
      googleTranslate: "Traduzir LeonixMedia.com com Google",
      backToQrGuide: "Voltar ao guia QR",
    },
  },
  tl: {
    eyebrow: "LEONIX · READABLE COMPANION",
    pageTitle: "Readable companion — Hunyo 2026",
    issueLabel: "Leonix Media · Hunyo 2026",
    introSummary:
      "Ang HTML page na ito ay readable companion para sa visual magazine ng Hunyo. Binubuod ang mga tema, negosyo, at aksyon sa iyong wika — hindi pumapalit sa PDF o flipbook na Espanyol.",
    visualTruthNote:
      "Ang orihinal na visual edition (PDF at flipbook) nananatili sa Espanyol. Hindi awtomatikong isinasalin ng Leonix ang visual file.",
    bodyLanguageNote:
      "Ang mga section summary sa ibaba ay nasa Espanyol o Ingles sa ngayon. Ang header, intro, at action buttons ay nasa piniling wika mo.",
    ctas: {
      actionsTitle: "Mabilis na aksyon",
      openVisualMagazine: "Buksan ang orihinal na visual magazine (Espanyol)",
      qrGuide: "Buksan ang QR translation guide",
      mediaKit: "Tingnan ang Media Kit",
      advertise: "Mag-advertise sa Leonix",
      googleTranslate: "Isalin ang LeonixMedia.com gamit ang Google",
      backToQrGuide: "Bumalik sa QR guide",
    },
  },
  km: {
    eyebrow: "LEONIX · ស្ត្រីអាន",
    pageTitle: "ស្ត្រីអាន — ខែមិថុនា ២០២៦",
    issueLabel: "Leonix Media · ខែមិថុនា ២០២៦",
    introSummary:
      "ទំព័រ HTML នេះជាស្ត្រីអានសម្រាប់ទស្សនាវដ្តីរូបភាពខែមិថុនា។ សង្ខេបប្រធានបទ អាជីវកម្ម និងសកម្មភាពជាភាសារបស់អ្នក — មិនជំនួស PDF ឬ flipbook អេស្ប៉ាញទេ។",
    visualTruthNote:
      "ការបោះពុម្ពរូបភាពដើម (PDF និង flipbook) នៅតែជាភាសាអេស្ប៉ាញ។ Leonix មិនបកប្រែឯកសាររូបភាពនោះដោយស្វ័យប្រវត្តិទេ។",
    bodyLanguageNote:
      "សង្ខេបផ្នែកខាងក្រោមនេះមានជាភាសាអេស្ប៉ាញ ឬអង់គ្លេសឥឡូវនេះ។ បឋមកថា ការណែនាំ និងប៊ូតុនសកម្មភាពបង្ហាញជាភាសាដែលអ្នកបានជ្រើស។",
    ctas: {
      actionsTitle: "សកម្មភាពរហ័ស",
      openVisualMagazine: "បើកទស្សនាវដ្តីរូបភាពដើម (អេស្ប៉ាញ)",
      qrGuide: "បើកការណែនាំ QR បកប្រែ",
      mediaKit: "មើល Media Kit",
      advertise: "ផ្សាយពាណិជ្ជកម្មជាមួយ Leonix",
      googleTranslate: "បកប្រែ LeonixMedia.com ជាមួយ Google",
      backToQrGuide: "ត្រឡប់ទៅការណែនាំ QR",
    },
  },
  zh: {
    eyebrow: "LEONIX · 可读版",
    pageTitle: "可读版 — 2026年6月",
    issueLabel: "Leonix Media · 2026年6月",
    introSummary:
      "此 HTML 页面是六月视觉杂志的可读版伴侣。以您的语言概括主题、企业和操作 — 不能替代西班牙语 PDF 或 flipbook。",
    visualTruthNote:
      "原版视觉杂志（PDF 和 flipbook）仍为西班牙语。Leonix 不会自动翻译该视觉文件。",
    bodyLanguageNote:
      "下方章节摘要目前为西班牙语或英语。页眉、简介和操作按钮已显示为您选择的语言。",
    ctas: {
      actionsTitle: "快速操作",
      openVisualMagazine: "打开原版视觉杂志（西班牙语）",
      qrGuide: "打开二维码翻译指南",
      mediaKit: "查看 Media Kit",
      advertise: "与 Leonix 合作广告",
      googleTranslate: "使用 Google 翻译 LeonixMedia.com",
      backToQrGuide: "返回二维码指南",
    },
  },
  ja: {
    eyebrow: "LEONIX · 読みやすい版",
    pageTitle: "読みやすい版 — 2026年6月",
    issueLabel: "Leonix Media · 2026年6月",
    introSummary:
      "この HTML ページは6月の視覚雑誌の読みやすいコンパニオンです。テーマ、ビジネス、アクションをあなたの言語で要約します — スペイン語の PDF や flipbook の代わりにはなりません。",
    visualTruthNote:
      "オリジナルの視覚版（PDF と flipbook）はスペイン語のままです。Leonix はその視覚ファイルを自動翻訳しません。",
    bodyLanguageNote:
      "以下のセクション要約は現在スペイン語または英語です。ページヘッダー、導入、アクションボタンは選択した言語で表示されています。",
    ctas: {
      actionsTitle: "クイックアクション",
      openVisualMagazine: "オリジナル視覚雑誌を開く（スペイン語）",
      qrGuide: "QR翻訳ガイドを開く",
      mediaKit: "Media Kitを見る",
      advertise: "Leonixで広告する",
      googleTranslate: "GoogleでLeonixMedia.comを翻訳",
      backToQrGuide: "QRガイドに戻る",
    },
  },
  ko: {
    eyebrow: "LEONIX · 읽기 쉬운 버전",
    pageTitle: "읽기 쉬운 버전 — 2026년 6월",
    issueLabel: "Leonix Media · 2026년 6월",
    introSummary:
      "이 HTML 페이지는 6월 시각 매거진의 읽기 쉬운 동반자입니다. 주제, 비즈니스, 행동을 당신의 언어로 요약합니다 — 스페인어 PDF나 flipbook을 대체하지 않습니다.",
    visualTruthNote:
      "원본 시각판(PDF 및 flipbook)은 스페인어로 유지됩니다. Leonix는 해당 시각 파일을 자동 번역하지 않습니다.",
    bodyLanguageNote:
      "아래 섹션 요약은 현재 스페인어 또는 영어로 제공됩니다. 페이지 헤더, 소개 및 액션 버튼은 선택한 언어로 표시됩니다.",
    ctas: {
      actionsTitle: "빠른 작업",
      openVisualMagazine: "원본 시각 매거진 열기(스페인어)",
      qrGuide: "QR 번역 가이드 열기",
      mediaKit: "Media Kit 보기",
      advertise: "Leonix로 광고하기",
      googleTranslate: "Google로 LeonixMedia.com 번역",
      backToQrGuide: "QR 가이드로 돌아가기",
    },
  },
  hi: {
    eyebrow: "LEONIX · पठनीय साथी",
    pageTitle: "पठनीय साथी — जून 2026",
    issueLabel: "Leonix Media · जून 2026",
    introSummary:
      "यह HTML पृष्ठ जून की दृश्य पत्रिका के लिए एक पठनीय साथी है। यह विषयों, व्यवसायों और कार्यों को आपकी भाषा में संक्षेप में बताता है — यह स्पेनिश PDF या flipbook का स्थान नहीं लेता।",
    visualTruthNote:
      "मूल दृश्य संस्करण (PDF और flipbook) स्पेनिश में रहता है। Leonix उस दृश्य फ़ाइल का स्वचालित अनुवाद नहीं करता।",
    bodyLanguageNote:
      "नीचे दिए गए सेक्शन सारांश अभी स्पेनिश या अंग्रेज़ी में हैं। पृष्ठ हेडर, परिचय और कार्रवाई बटन आपकी चुनी भाषा में दिखाए जाते हैं।",
    ctas: {
      actionsTitle: "त्वरित कार्रवाइयाँ",
      openVisualMagazine: "मूल दृश्य पत्रिका खोलें (स्पेनिश)",
      qrGuide: "QR अनुवाद गाइड खोलें",
      mediaKit: "Media Kit देखें",
      advertise: "Leonix के साथ विज्ञापन दें",
      googleTranslate: "Google से LeonixMedia.com अनुवाद करें",
      backToQrGuide: "QR गाइड पर वापस जाएँ",
    },
  },
  hy: {
    eyebrow: "LEONIX · ԸՆԹԵՌՆԵԼԻ ՍԱՀՄԱՆԿ",
    pageTitle: "Ընթեռնելի սահմանակ — Հունիս 2026",
    issueLabel: "Leonix Media · Հունիս 2026",
    introSummary:
      "Այս HTML էջը հունիսյան տեսողական ամսագրի ընթեռնելի սահմանակ է։ Ամփոփում է թեմաներ, բիզնեսներ և գործողություններ ձեր լեզվով — չի փոխարինում իսպաներեն PDF-ը կամ flipbook-ը։",
    visualTruthNote:
      "Բնօրինակ տեսողական տարբերակը (PDF և flipbook) մնում է իսպաներեն։ Leonix-ը ավտոմատ չի թարգմանում այդ տեսողական ֆայլը։",
    bodyLanguageNote:
      "Ստորև նշված բաժինների ամփոփումները ներկայումս իսպաներեն կամ անգլերեն են։ Էջի վերնագիր, ներածություն և գործողության կոճակները ցուցադրվում են ձեր ընտրած լեզվով։",
    ctas: {
      actionsTitle: "Արագ գործողություններ",
      openVisualMagazine: "Բացել բնօրինակ տեսողական ամսագիրը (իսպաներեն)",
      qrGuide: "Բացել QR թարգմանության ուղեցույցը",
      mediaKit: "Դիտել Media Kit",
      advertise: "Գովազդել Leonix-ով",
      googleTranslate: "Թարգմանել LeonixMedia.com Google-ով",
      backToQrGuide: "Վերադառնալ QR ուղեցույցին",
    },
  },
  ru: {
    eyebrow: "LEONIX · ЧИТАЕМЫЙ КОМПАНЬОН",
    pageTitle: "Читаемый компаньон — Июнь 2026",
    issueLabel: "Leonix Media · Июнь 2026",
    introSummary:
      "Эта HTML-страница — читаемый компаньон к визуальному журналу июня. Суммирует темы, бизнесы и действия на вашем языке — не заменяет PDF или flipbook на испанском.",
    visualTruthNote:
      "Оригинальная визуальная редакция (PDF и flipbook) остаётся на испанском. Leonix не переводит этот визуальный файл автоматически.",
    bodyLanguageNote:
      "Сводки разделов ниже сейчас на испанском или английском. Заголовок страницы, вводный текст и кнопки действий отображаются на выбранном вами языке.",
    ctas: {
      actionsTitle: "Быстрые действия",
      openVisualMagazine: "Открыть оригинальный визуальный журнал (испанский)",
      qrGuide: "Открыть QR-гид по переводу",
      mediaKit: "Смотреть Media Kit",
      advertise: "Рекламировать с Leonix",
      googleTranslate: "Перевести LeonixMedia.com через Google",
      backToQrGuide: "Назад к QR-гиду",
    },
  },
  pa: {
    eyebrow: "LEONIX · ਪੜ੍ਹਨ ਯੋਗ ਸਾਥੀ",
    pageTitle: "ਪੜ੍ਹਨ ਯੋਗ ਸਾਥੀ — ਜੂਨ 2026",
    issueLabel: "Leonix Media · ਜੂਨ 2026",
    introSummary:
      "ਇਹ HTML ਪੰਨਾ ਜੂਨ ਦੀ ਦ੍ਰਿਸ਼ਟੀਗਤ ਮੈਗਜ਼ੀਨ ਲਈ ਪੜ੍ਹਨ ਯੋਗ ਸਾਥੀ ਹੈ। ਵਿਸ਼ਿਆਂ, ਕਾਰੋਬਾਰਾਂ ਅਤੇ ਕਾਰਵਾਈਆਂ ਦਾ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਾਰਾਂਸ਼ — ਸਪੈਨਿਸ਼ PDF ਜਾਂ flipbook ਦੀ ਜਗ੍ਹਾ ਨਹੀਂ ਲੈਂਦਾ।",
    visualTruthNote:
      "ਮੂਲ ਦ੍ਰਿਸ਼ਟੀਗਤ ਸੰਸਕਰਣ (PDF ਅਤੇ flipbook) ਸਪੈਨਿਸ਼ ਵਿੱਚ ਰਹਿੰਦਾ ਹੈ। Leonix ਉਸ ਦ੍ਰਿਸ਼ਟੀਗਤ ਫਾਈਲ ਦਾ ਆਟੋ ਅਨੁਵਾਦ ਨਹੀਂ ਕਰਦਾ।",
    bodyLanguageNote:
      "ਹੇਠਾਂ ਦਿੱਤੇ ਸੈਕਸ਼ਨ ਸਾਰ ਅਜੇ ਸਪੈਨਿਸ਼ ਜਾਂ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਹਨ। ਪੰਨੇ ਦਾ ਹੈਡਰ, ਜਾਣ-ਪਛਾਣ ਅਤੇ ਕਾਰਵਾਈ ਬਟਨ ਤੁਹਾਡੀ ਚੁਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦਿਖਾਏ ਜਾ ਰਹੇ ਹਨ।",
    ctas: {
      actionsTitle: "ਤੇਜ਼ ਕਾਰਵਾਈਆਂ",
      openVisualMagazine: "ਮੂਲ ਦ੍ਰਿਸ਼ਟੀਗਤ ਮੈਗਜ਼ੀਨ ਖੋਲ੍ਹੋ (ਸਪੈਨਿਸ਼)",
      qrGuide: "QR ਅਨੁਵਾਦ ਗਾਈਡ ਖੋਲ੍ਹੋ",
      mediaKit: "Media Kit ਦੇਖੋ",
      advertise: "Leonix ਨਾਲ ਇਸ਼ਤਿਹਾਰ ਦਿਓ",
      googleTranslate: "Google ਨਾਲ LeonixMedia.com ਦਾ ਅਨੁਵਾਦ ਕਰੋ",
      backToQrGuide: "QR ਗਾਈਡ 'ਤੇ ਵਾਪਸ ਜਾਓ",
    },
  },
};
