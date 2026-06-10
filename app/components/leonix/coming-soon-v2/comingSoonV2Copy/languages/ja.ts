import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getJaCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "ホーム", href: "#inicio", active: true },
      { label: "提供内容", href: "#que-obtienes" },
      { label: "仕組み", href: "#como-funciona" },
      { label: "QRアクセス", href: "#qr" },
      { label: "お問い合わせ", href: "#contacto" },
    ],
    launchCta: "ローンチに参加",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — ホーム",
    navAria: "メインナビゲーション",
    langAria: "言語",
    hero: {
      badge: "近日公開",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "スペイン語の" },
            { text: "印刷広告", accent: "burgundy" },
            { text: "。" },
          ],
        },
        {
          parts: [
            { text: "バイリンガルな" },
            { text: "デジタル露出", accent: "burgundy" },
            { text: "。" },
          ],
        },
        {
          parts: [
            { text: "QRによる" },
            { text: "多言語", accent: "burgundy" },
            { text: "アクセス。" },
          ],
        },
      ],
      paragraph:
        "プレミアム雑誌、バイリンガルなデジタルプレゼンス、そして注目を行動に変えるツールを通じて、ベイエリアのラテン系・多文化コミュニティとビジネスをつなぎます。",
      ctas: [
        { label: "広告掲載のご相談", variant: "primary" },
        { label: "メディアキットを見る", variant: "secondary" },
        { label: "ローンチに参加", variant: "green" },
      ],
      trustChips: ["コミュニティのために", "地域の信頼", "デジタルアクション"],
      valueAria: "価値提案",
      trustAria: "信頼",
      mediaVisual: {
        label: "プレミアム雑誌 + デジタルプレゼンス",
        qrOverlay: "スキャン。言語を選択。つながる。",
        magazineAlt: "Leonix Media 雑誌の装飾プレビュー",
      },
      magazineCta: "デジタル版を見る",
    },
    marketplace: {
      eyebrow: "クラシファイド + ローカルマーケットプレイス",
      headline: "コミュニティは必要なものを求めて訪れます。ビジネスは露出を得ます。",
      intro:
        "Leonixは広告だけではありません。賃貸、求人、個人売却の車、出品物、イベント、食、ペットなど、コミュニティが検索・投稿・共有できるローカルマーケットプレイスも構築しています。",
      bridge: "Leonixを訪れる理由が増えるほど、ビジネスが見られる機会も増えます。",
      featuredCard: {
        badge: "New category",
        title: "Local Deals",
        body:
          "Weekly flyers, coupons, and specials from local businesses in a clear experience designed to help the community discover real savings and help businesses gain more visibility.",
        supportingLine:
          "More reasons to visit Leonix means more opportunities for local businesses to be seen.",
      },
      cardsAria: "ローカルマーケットプレイスのカテゴリ",
      cards: [
        {
          title: "アイテムと無料の出品",
          body: "地域のアイテム、家庭用品、工具、衣類、無料の発見、日常的な掲載で近所同士が購入・販売・共有・有用な機会の発見をサポート。",
        },
        {
          title: "賃貸",
          body: "部屋、アパート、スペース、住宅の機会。写真、説明、場所、価格、連絡先付き。",
        },
        {
          title: "求人",
          body: "採用中のビジネスは、仕事や新しい機会を探すコミュニティの人々とつながれます。",
        },
        {
          title: "個人売却の車",
          body: "写真、説明、価格、連絡先付きの車の掲載。地域の買い手向け。",
        },
        {
          title: "食 + イベント",
          body: "ポップアップ、地元の食、活動、コミュニティイベント、また訪れたくなる瞬間。",
        },
        {
          title: "募集 + ペット",
          body: "コミュニティは検索、ニーズの共有、ペット、紛失物、譲渡、地域サポートについてもつながれます。",
        },
      ],
      closing:
        "クラシファイドがトラフィックを呼びます。Negocios Locales がその注目を電話、訪問、顧客に変えます。",
      exploreCta: { label: "クラシファイドを見る" },
    },
    whatYouGet: {
      eyebrow: "提供内容",
      headline: "広告以上のもの：ビジネスのための完全なプレゼンス。",
      intro:
        "Leonixは月刊印刷雑誌、Negocios LocalesのLocal Business Hub、QRによるアクションを組み合わせ、より多くの顧客がビジネスを見つけ、理解し、連絡できるよう支援します。",
      expandMore: "詳しく見る",
      expandLess: "閉じる",
      cards: [
        {
          title: "月刊印刷雑誌",
          body: "ビジネスは地域のラテン系コミュニティ向けに設計された月刊雑誌に掲載される場合があります。",
          detail:
            "Leonixは信頼できる地域露出のための月刊スペイン語印刷雑誌を発行しています。印刷掲載は広告パッケージによります — 契約なしではすべてのビジネスが毎号掲載されるわけではありません。",
          accent: "burgundy",
        },
        {
          title: "バイリンガルなデジタルプレゼンス",
          body: "ビジネスは顧客が選ぶ言語でネイティブフォームとアクションを備えたLeonixウェブページにも掲載できます。",
          detail:
            "デジタルページは印刷広告とLocal Business Hubプロフィールを補完し、顧客がスマートフォンから再訪できる共有可能な情報を提供します。",
          accent: "gold",
        },
        {
          title: "QR + 実際のアクション",
          body: "印刷での注目を電話、メッセージ、地図、ウェブサイト訪問、SNS、オファー、連絡経路に変えます。",
          detail:
            "QRは各月刊号をデジタルアクションにつなぎます。読者はスキャンし、スマホの翻訳ツールやLeonixの言語ページを使い、プラットフォームを行き来せずにビジネスにたどり着けます。",
          accent: "qr",
        },
        {
          title: "Negocios Locales + デジタルプレゼンス",
          body: "SNS、ウェブサイト、電話、所在地、写真、レビュー、オファー、連絡方法を一か所で見つけられる中央ビジネスページを作成します。",
          detail:
            "Negocios Localesは広告以上のもの — オンラインプレゼンスをまとめ、顧客が別々のプラットフォームを探さずにビジネスを発見・探索できます。",
          accent: "green",
        },
        {
          title: "創業ローンチの機会",
          body: "ローンチ段階で Leonix Media とともに最初に掲載されるビジネスの一つになりましょう。",
          detail:
            "ローンチ時、最初のビジネスが Leonix Media の初期ネットワークを形成します。これは早期露出の機会であり — 別の広告フォーマットではありません。",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "仕組み",
      headline: "Leonix でプレゼンスを立ち上げる明確なプロセス。",
      intro: "最初の情報から、印刷・共有・接続の準備が整ったプレゼンスまでご案内します。",
      stepsAria: "プロセスのステップ",
      steps: [
        {
          title: "プレゼンスを選ぶ",
          body: "月刊印刷での露出、Negocios LocalesのデジタルLocal Business Hubページ、QRによる顧客アクション、またはローンチの組み合わせから選びます。",
        },
        {
          title: "情報を送る",
          body: "ロゴ、写真、電話、住所、SNS、リンク、オファー、ビジネスの主要詳細を共有してください。",
        },
        {
          title: "プレゼンスを準備",
          body: "広告、デジタル情報、顧客が理解し連絡できる要素を整理します。",
        },
        {
          title: "ローンチしてつながる",
          body: "ビジネスはコミュニティの前に現れ、関心を電話、メッセージ、訪問、つながりに変える準備が整います。",
        },
      ],
    },
    qrAccess: {
      eyebrow: "QRアクセス",
      headline: "印刷広告から顧客のスマートフォンへ。",
      intro:
        "各月刊号は物理的な雑誌をデジタルアクションにつなげます：スキャン、翻訳、地図を開く、電話、SNS、オファー閲覧、ビジネスへの連絡。",
      callout: "スキャン。翻訳。読む。つながる。",
      explanation:
        "印刷雑誌が配布されると、読者は広告のQRコードをスキャンできます。視覚的な雑誌を読むには、印刷ページ、デスクトップ画面、スクリーンショットでスマホカメラ、Google Lens、Google Translate、Apple Live Textが使えます。Leonixサイトを閲覧するには、Leonixの翻訳ページまたはGoogle Translateのウェブサイトモードをフォールバックとして使えます。ネイティブのLeonix連絡・広告フォームが公式のリード経路です。",
      mobileNote:
        "モバイルでは自分の画面をスキャンしないでください。まずLeonixの言語ページと要約を使ってください。Google LensとApple Live Textは印刷物やスクリーンショット向けのオプションです。",
      openReaderLabel: "QR翻訳の手順を見る",
      heroStripSummary:
        "各月刊印刷号は読者を電話、地図、リンク、SNS、ネイティブLeonix連絡経路につなげます。",
      detailNote: "詳細なQR翻訳ガイド",
      benefitsAria: "QRアクセスのメリット",
      benefits: [
        {
          title: "印刷からスマホへ",
          body: "QRは雑誌の注目を電話、地図、ウェブサイト訪問、SNS、オファー、ネイティブ連絡フォームに変えます。",
        },
        {
          title: "カメラとウェブ翻訳",
          body: "Google Lens、Google Translate、Apple Live Textが視覚ページの読み取りを支援。Google TranslateウェブサイトモードがLeonix閲覧を支援 — ネイティブフォームが公式のまま。",
        },
        {
          title: "スペイン語オリジナルの視覚雑誌",
          body: "PDF/FlipHTML5の視覚版はスペイン語のまま。Leonixは完全翻訳された視覚雑誌を謳いません。",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "メディアキット",
      headline: "メディアキットの内容",
      intro:
        "メディアキットは、Leonix Media が印刷雑誌、デジタルプレゼンス、QR、実際のアクション、広告パッケージをどう組み合わせ、ビジネスをより強く見せ、連絡しやすくするかを説明します。",
      pdfHonestyLine:
        "ダウンロード可能なPDFは、翻訳版を準備中の間、スペイン語オリジナル版の場合があります。サイトは選択した言語でオプションを説明します。",
      cardsAria: "メディアキットの内容",
      cards: [
        {
          title: "Leonixで広告する理由",
          body: "ラテン系・多文化コミュニティとつながりたい地域ビジネスのリーチ、信頼、アクションを Leonix がどう支援するかをご覧ください。",
        },
        {
          title: "QR + アクションボタン",
          body: "印刷広告が顧客の電話、地図、メッセージ、ウェブサイト、SNS、レビューなどにつながる方法をご覧ください。",
        },
        {
          title: "Negocios Locales + デジタルプレゼンス",
          body: "電話、住所、地図、写真、レビュー、SNS、ウェブサイト、連絡ボタンを備えた整理されたプレゼンスについて理解できます。",
        },
        {
          title: "パッケージと次のステップ",
          body: "広告オプション、露出レベル、Leonix Media を始めるプロセスを確認してください。",
        },
      ],
      ctaHeading: "詳細を見る準備はできましたか？",
      viewCta: { label: "メディアキットを見る" },
      downloadCta: { label: "メディアキットをダウンロード" },
      dualPdfEsLabel: "Media Kit（スペイン語オリジナル PDF）",
      dualPdfEnLabel: "Media Kit（英語 PDF）",
      requestInfoCta: { label: "広告情報をリクエスト" },
      supportingLine: "メディアキットを開いて形式、メリット、パッケージ、次のステップをご確認ください。",
    },
    digitalMagazine: {
      eyebrow: "デジタル雑誌",
      headline: "オリジナル視覚版 + 多言語サポート",
      intro:
        "スペイン語オリジナルの視覚雑誌を開き、デザインどおりのページを閲覧できます。Leonixは選択した言語での要約、ハイライト、クイックアクションも提供します（利用可能な場合）。",
      visualNote:
        "視覚的な雑誌ページ（PDF/FlipHTML5）はスペイン語オリジナル版 — すべてのアートワークの自動翻訳ではありません。",
      highlightsNote:
        "Leonixページで選択言語のコンテキストとCTAを利用。Google Lensやスクリーンショットが視覚ページの読み取りを支援。将来のHTMLコンパニオンがオリジナル視覚版を置き換えず言語リーチを改善します。",
      mobileNote:
        "モバイルでは Leonix で言語を選び、要約を使ってください。スマホカメラツールが印刷物や画面ページを支援 — 翻訳のために自分の画面をスキャンしないでください。",
      readHighlightsCta: { label: "選択した言語でハイライトを読む" },
      openOriginalCta: { label: "オリジナルのデジタル雑誌を開く" },
      learnQrCta: { label: "QRアクセスの仕組みを学ぶ" },
    },
    finalCta: {
      eyebrow: "ローンチ準備完了",
      headline: "ローンチ前にスペースを確保してください。",
      body: "Leonix Media は、地域ビジネスとベイエリアのラテン系・多文化コミュニティをつなぐローンチを準備しています。最初から掲載したいなら、今がその時です。",
      ctas: [
        { label: "広告掲載のご相談", variant: "primary" },
        { label: "メディアキットを見る", variant: "secondary", external: true },
        { label: "ローンチに参加", variant: "green" },
      ],
      mediaKitDownload: { label: "メディアキットをダウンロード" },
    },
    contact: {
      title: "お問い合わせ",
      body: "広告、メディアキット、ローンチ段階についてご質問がありますか？お問い合わせください。ビジネスに最適な道をお手伝いします。",
      emailLabel: "メール",
      email: "info@leonixmedia.com",
      phoneLabel: "電話",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "住所",
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
      areaLabel: "エリア",
      area: "San José • Silicon Valley • ラテン系コミュニティ",
    },
    newsletter: {
      title: "ローンチに参加",
      body: "Leonix Media からのニュース、機会、更新情報を受け取る。",
      placeholder: "メールアドレス",
      button: "通知を受け取る",
      formAria: "ニュースレター登録",
      emailLabel: "メールアドレス",
      consent: "Leonix Mediaのローンチ更新を受け取ることに同意します。",
      consentError: "更新の受信に同意してください。",
    },
    footer: "© 2026 Leonix Media。コミュニティのために。",
  });
}
