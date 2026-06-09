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
      cardsAria: "ローカルマーケットプレイスのカテゴリ",
      cards: [
        {
          title: "無料出品 / 販売",
          body: "出品物、家庭用品、工具、衣類など。地域のトラフィックを呼び、近隣で機会を共有するための掲載。",
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
        "Leonixは印刷雑誌、デジタルプレゼンス、QRによるアクションを組み合わせ、より多くの顧客がビジネスを見つけ、理解し、連絡できるよう支援します。",
      expandMore: "詳しく見る",
      expandLess: "閉じる",
      cards: [
        {
          title: "プレミアム印刷雑誌",
          body: "地域のラテン系コミュニティ向けに設計された出版物にビジネスが掲載されます。",
          detail:
            "広告は地域らしく、信頼でき、プロフェッショナルに感じられる雑誌内に掲載されます。目的は見た目の良さだけではなく、地域ビジネスを支援したいコミュニティの前にビジネスを置くことです。",
          accent: "burgundy",
        },
        {
          title: "バイリンガルなデジタルプレゼンス",
          body: "広告は明確でプロフェッショナル、共有しやすいデジタル体験にも存在できます。",
          detail:
            "デジタルプレゼンスにより、広告は1ページで終わりません。顧客はスマートフォンから情報を見つけ、共有し、再訪できます。",
          accent: "gold",
        },
        {
          title: "QR + 実際のアクション",
          body: "注目を電話、メッセージ、地図、リンク、オファー、追加情報に変えます。",
          detail:
            "QRは雑誌から具体的な行動へ導きます：電話、地図を開く、メッセージ送信、ウェブサイト訪問、SNS閲覧、追加情報の依頼。",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "電話、所在地、SNS、写真、レビュー、重要なリンクを整理して表示。",
          detail:
            "Negocios Locales は情報を一か所にまとめ、顧客が複数のプラットフォームを探す必要がなくなります。電話、住所、地図、SNS、写真、リンクを一緒に掲載できます。",
          accent: "green",
        },
        {
          title: "創業ローンチの機会",
          body: "ローンチ段階で Leonix Media とともに最初に掲載されるビジネスの一つになりましょう。",
          detail:
            "ローンチ時、最初のビジネスが Leonix Media の初期ネットワークを形成します。コミュニティがプラットフォームを知り始める中で、早期の露出機会が生まれます。",
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
          title: "道を選ぶ",
          body: "希望するプレゼンスの種類を選択：印刷広告、デジタルプレゼンス、QR、メディアキット、ローンチパッケージ。",
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
      intro: "QRは印刷雑誌と Leonix のデジタル体験をつなぐ——多言語の架け橋です。",
      callout: "スキャン。言語を選択。つながる。",
      explanation:
        "印刷物またはデジタル資料からQRをスキャン。Leonixで言語を選び、要約と地域ビジネス情報を読み、すぐに行動できます。ウェブサイトが多言語の架け橋です。視覚的な雑誌はオリジナル版のままです。",
      mobileNote:
        "モバイルでは、自分のスマートフォン画面をスキャンしないでください。Leonixの言語セレクターと選択した言語の要約を使ってください。Google Lens や Apple 翻訳は印刷物のみのオプションです。",
      benefitsAria: "QRアクセスのメリット",
      benefits: [
        {
          title: "Leonixで言語を選択",
          body: "サイトで選択した言語での要約、ビジネス情報、クイックアクション。",
        },
        {
          title: "より多くの行動方法",
          body: "スマートフォンから電話、地図、メッセージ、リンク、SNS、追加情報の依頼ができます。",
        },
        {
          title: "印刷物ではオプション",
          body: "印刷物では Google Lens や Apple 翻訳がテキスト読み取りに役立つ場合があります。Leonixがデジタルコンテンツへの主な入り口です。",
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
      requestInfoCta: { label: "広告情報をリクエスト" },
      supportingLine: "メディアキットを開いて形式、メリット、パッケージ、次のステップをご確認ください。",
    },
    digitalMagazine: {
      eyebrow: "デジタル雑誌",
      headline: "オリジナルの視覚版を開く——選択した言語のサポート付き",
      intro:
        "オリジナルのデジタル雑誌を開き、デザインどおりのページを閲覧できます。Leonixは選択した言語での要約、ハイライト、クイックアクションも提供します。",
      visualNote:
        "視覚的な雑誌ページ（PDF/FlipHTML5）はオリジナル版です——すべてのアートワークの自動翻訳ではありません。",
      highlightsNote:
        "サイトでは選択した言語の要約とCTAがあり、完全に翻訳された視覚雑誌を約束せずに案内します。",
      mobileNote:
        "モバイルでは Leonix で言語を選び、要約を使ってください。翻訳のために自分の画面をスキャンしないでください。",
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
    },
    footer: "© 2026 Leonix Media。コミュニティのために。",
  });
}
