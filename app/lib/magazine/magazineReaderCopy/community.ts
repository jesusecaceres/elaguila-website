import type { MagazineReaderLangBundle } from "./types";

export const COMMUNITY_READER_COPY: Record<
  "pt" | "tl" | "km" | "zh" | "ja" | "ko" | "hi" | "hy" | "ru" | "pa",
  MagazineReaderLangBundle
> = {
  pt: {
    issueMeta: {
      title: "Leonix Media — Revista Junho 2026",
      monthLabel: "Junho",
    },
    ui: {
      languageEyebrow: "IDIOMA DE LEITURA",
      originalMagazineLabel: "Revista original em espanhol",
      languageChooserHint: "Escolha um idioma para ler os anúncios e as informações principais.",
      readerPreviewBadge: "Pré-visualização de leitura traduzida",
      readerPreviewIntro:
        "Esta vista resume anúncios, classificados e contacto no seu idioma. A edição visual impressa e digital permanece em espanhol.",
      futureFlipbookNote:
        "Edições visuais completas em outros idiomas poderão ser arquivos separados quando estiverem disponíveis. Hoje, o flipbook e o PDF originais permanecem em espanhol.",
      originalEditionNote:
        "A edição visual original está em espanhol. Este leitor ajuda a compreender as informações principais no seu idioma.",
      originalEditionTitle: "Edição visual original (espanhol)",
      viewFlipbookSpanish: "Ver flipbook em espanhol",
      downloadPdf: "Baixar PDF original",
      viewMediaKit: "Ver kit de mídia",
      openFullReader: "Abrir leitor completo",
      backToMagazine: "Voltar à revista",
      backToComingSoon: "Voltar a Em breve",
      readPageTitle: "Leitor — Junho 2026",
      readPageSubtitle:
        "Este leitor ajuda a compreender as informações principais da edição de junho em português. A revista visual original permanece em espanhol.",
      issuePageTitle: "Edição Junho 2026",
      issuePageIntro:
        "A edição de lançamento da Leonix Media conecta negócios locais, comunidade, cultura e oportunidades. Escolha como explorá-la.",
      issuePageReaderCta: "Abrir leitor traduzido",
      issuePageHubCta: "Ir ao hub da revista",
      closeFlipbook: "Fechar",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "DO IMPRESSO · QR",
      printSourceTitle: "Bem-vindo da revista impressa",
      printSourceIntro:
        "Você escaneou o QR da Leonix. Este leitor é a ponte multilíngue: escolha o idioma, leia resumos e ações e abra a edição visual original quando quiser.",
      printSourceStepScan: "Escaneie o QR a partir de materiais impressos ou digitais da Leonix.",
      printSourceStepLanguage: "Escolha seu idioma na Leonix para ler resumos e informações locais.",
      printSourceStepHighlights: "Use resumos e CTAs no seu idioma — o site é a ponte multilíngue.",
      printSourceStepOriginal:
        "Abra a revista digital original (PDF/flipbook) quando quiser ver a edição visual em espanhol.",
      printSourceMobileNote:
        "Se já estiver no celular, não escaneie a própria tela. Use o seletor de idioma acima e este leitor.",
      printQrCaption: "QR oficial · Junho 2026 · leonixmedia.com",
      openLanguageReader: "Abrir leitor no seu idioma",
      mediaKitPdfEsLabel: "Media Kit (PDF espanhol original)",
      mediaKitPdfEnLabel: "Media Kit (PDF English)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Sobre a Leonix Media",
        body: "A Leonix Media conecta negócios locais com a comunidade latina e multicultural da Bay Area por meio de publicidade impressa em espanhol, presença digital bilíngue e ferramentas que transformam atenção em ligações, visitas e conexões reais.",
      },
      {
        id: "about-magazine",
        title: "Sobre El Águila e a revista",
        body: "A Leonix Media é a revista premium do ecossistema El Águila: comunidade, cultura e negócios numa edição digital e impressa. A edição de junho de 2026 reúne histórias locais, anúncios de negócios, inspiração comunitária e pontes para o marketplace de classificados.",
        bullets: [
          "Revista impressa premium pensada para a comunidade latina local.",
          "Edição digital com flipbook e PDF em espanhol (visual original).",
          "Conexão com classificados, Negocios Locales e ações por QR.",
        ],
      },
      {
        id: "featured-ads",
        title: "Pré-visualização de anúncios em destaque",
        body: "Esta edição inclui espaço publicitário para negócios locais. Os anúncios mostram categoria, mensagem principal e informações de contacto originais do anunciante — sem nomes inventados nem preços nesta vista de leitura.",
        bullets: [
          "Restaurantes e comida local — menu, localização e contacto do anunciante.",
          "Serviços profissionais — canalização, eletricidade, limpeza e reparos.",
          "Saúde, beleza e bem-estar — clínicas, dentistas e serviços comunitários.",
          "Cultura, desporto, receitas e inspiração para a comunidade.",
        ],
      },
      {
        id: "classifieds",
        title: "Pré-visualização de classificados",
        body: "A Leonix não é só publicidade. O marketplace local conecta a comunidade a oportunidades reais: arrendamentos, empregos, carros particulares, artigos à venda, eventos, comida, animais de estimação e mais.",
        bullets: [
          "Arrendamentos e habitação na Bay Area.",
          "Empregos e oportunidades de trabalho local.",
          "Carros particulares, artigos à venda e serviços comunitários.",
          "Procura, animais de estimação e apoio local.",
        ],
        ctaKey: "clasificados",
        ctaLabel: "Explorar classificados",
      },
      {
        id: "local-business",
        title: "Pré-visualização de perfil de negócio local",
        body: "Negocios Locales organiza telefone, morada, mapa, redes sociais, fotos e links numa única presença digital. Os dados comerciais e de contacto mantêm-se na forma original.",
        bullets: [
          "Telefone, morada e redes do negócio — dados comerciais não são traduzidos automaticamente.",
          "Mapa, chamadas e mensagens a partir do celular.",
          "Fotos, avaliações e links importantes num só lugar.",
        ],
      },
      {
        id: "qr-access",
        title: "Revista digital e acesso multilíngue por QR",
        body: "A revista mantém a identidade em espanhol para servir primeiro a nossa comunidade latina. Com o QR, os clientes abrem a experiência digital e podem usar ferramentas de tradução do dispositivo ou navegador quando necessário.",
        bullets: [
          "Escaneie a partir do anúncio impresso para ações concretas no celular.",
          "Tradução do navegador, Google Lens ou Apple Translate quando aplicável.",
          "Esta vista de leitura estruturada complementa — não substitui — o flipbook visual em espanhol.",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Conhecer a Leonix Media",
      },
      {
        id: "advertise",
        title: "Quer anunciar?",
        body: "Conecte o seu negócio a leitores locais através da revista impressa, edição digital e presença bilíngue. Contacte-nos para conhecer o Media Kit e opções de lançamento — sem preços nem garantias nesta vista.",
        ctaKey: "advertise",
        ctaLabel: "Anuncie connosco",
      },
      {
        id: "newsletter",
        title: "Junte-se à newsletter",
        body: "Seja dos primeiros a receber novas edições, anúncios importantes, oportunidades locais e atualizações da Leonix Media.",
        ctaKey: "newsletter",
        ctaLabel: "Subscrever a newsletter",
      },
      {
        id: "contact",
        title: "Contacto / pedir mais informações",
        body: "Estamos prontos para ajudar com publicidade, Media Kit e presença digital. Os dados de contacto comercial mantêm-se na forma original.",
        bullets: [
          "Consultas sobre anúncios na revista impressa e digital.",
          "Media Kit e pacotes de lançamento — pedir detalhes por contacto.",
          "Informação comercial sem tradução automática nesta vista.",
        ],
        ctaKey: "contact",
        ctaLabel: "Entrar em contato com a Leonix",
      },
    ],
  },

  tl: {
    issueMeta: {
      title: "Leonix Media — Magasin Hunyo 2026",
      monthLabel: "Hunyo",
    },
    ui: {
      languageEyebrow: "WIKA NG PAGBABASA",
      originalMagazineLabel: "Orihinal na magasin sa Espanyol",
      languageChooserHint: "Pumili ng wika para basahin ang mga ad at pangunahing impormasyon.",
      readerPreviewBadge: "Isinalin na preview ng reader",
      readerPreviewIntro:
        "Binubuod ng view na ito ang mga ad, classifieds, at contact sa iyong wika. Ang visual na print at digital edition ay nananatiling Espanyol.",
      futureFlipbookNote:
        "Ang kumpletong visual editions sa ibang wika ay maaaring hiwalay na file kapag available. Ngayon, ang orihinal na flipbook at PDF ay nananatiling Espanyol.",
      originalEditionNote:
        "Ang orihinal na visual edition ay Espanyol. Tinutulungan ka ng reader na ito na maunawaan ang pangunahing impormasyon sa iyong wika.",
      originalEditionTitle: "Orihinal na visual edition (Espanyol)",
      viewFlipbookSpanish: "Tingnan ang Espanyol na flipbook",
      downloadPdf: "I-download ang orihinal na PDF",
      viewMediaKit: "Tingnan ang Media Kit",
      openFullReader: "Buksan ang buong reader",
      backToMagazine: "Bumalik sa magasin",
      backToComingSoon: "Bumalik sa Malapit Na",
      readPageTitle: "Mambabasa — Hunyo 2026",
      readPageSubtitle:
        "Tinutulungan ka ng reader na ito na maunawaan ang pangunahing impormasyon mula sa Hunyo edition sa Filipino. Ang orihinal na visual na magasin ay nananatiling Espanyol.",
      issuePageTitle: "Hunyo 2026 Edition",
      issuePageIntro:
        "Ang launch edition ng Leonix Media ay nag-uugnay ng local businesses, komunidad, kultura, at oportunidad. Piliin kung paano mo ito tuklasin.",
      issuePageReaderCta: "Buksan ang isinalin na reader",
      issuePageHubCta: "Pumunta sa magazine hub",
      closeFlipbook: "Isara",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "MULA SA PRINT · QR",
      printSourceTitle: "Maligayang pagdating mula sa naka-print na magasin",
      printSourceIntro:
        "Na-scan mo ang Leonix QR. Ang reader na ito ang multilingual bridge: pumili ng wika, basahin ang mga buod at aksyon, at buksan ang orihinal na visual edition kapag gusto mo.",
      printSourceStepScan: "I-scan ang QR mula sa Leonix print o digital materials.",
      printSourceStepLanguage: "Piliin ang iyong wika sa Leonix para basahin ang mga buod at impormasyon ng local business.",
      printSourceStepHighlights: "Gamitin ang mga buod at CTA sa iyong wika — ang website ang multilingual bridge.",
      printSourceStepOriginal:
        "Buksan ang orihinal na digital magazine (PDF/flipbook) kapag gusto mo ang Espanyol na visual edition.",
      printSourceMobileNote:
        "Kung nasa phone ka na, huwag i-scan ang sarili mong screen. Gamitin ang language selector sa itaas at ang reader na ito.",
      printQrCaption: "Opisyal na QR · Hunyo 2026 · leonixmedia.com",
      openLanguageReader: "Buksan ang reader sa iyong wika",
      mediaKitPdfEsLabel: "Media Kit (orihinal na Espanyol na PDF)",
      mediaKitPdfEnLabel: "Media Kit (PDF English)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Tungkol sa Leonix Media",
        body: "Iniuugnay ng Leonix Media ang mga local business sa Latino at multicultural na komunidad sa Bay Area sa pamamagitan ng Espanyol na print advertising, bilingual digital presence, at mga tool na ginagawang tawag, pagbisita, at tunay na koneksyon ang atensyon.",
      },
      {
        id: "about-magazine",
        title: "Tungkol sa El Águila at ang magasin",
        body: "Ang Leonix Media ay ang premium magazine sa loob ng El Águila ecosystem: komunidad, kultura, at negosyo sa digital at print edition. Ang Hunyo 2026 issue ay nagdadala ng local stories, business ads, community inspiration, at tulay patungo sa classifieds marketplace.",
        bullets: [
          "Premium print magazine na dinisenyo para sa local Latino community.",
          "Digital edition na may flipbook at PDF sa Espanyol (orihinal na visual).",
          "Koneksyon sa classifieds, Negocios Locales, at QR-driven actions.",
        ],
      },
      {
        id: "featured-ads",
        title: "Preview ng featured ads",
        body: "Kasama sa edition na ito ang advertising space para sa local businesses. Ipinapakita ng mga ad ang kategorya, pangunahing mensahe, at orihinal na contact information ng advertiser — walang imbentong pangalan o presyo sa reader view na ito.",
        bullets: [
          "Restaurants at local food — menu, lokasyon, at contact ng advertiser.",
          "Professional services — plumbing, electrical, cleaning, at repairs.",
          "Health, beauty at wellness — clinics, dentists, at community services.",
          "Kultura, sports, recipes, at community inspiration.",
        ],
      },
      {
        id: "classifieds",
        title: "Preview ng classifieds",
        body: "Hindi lang advertising ang Leonix. Ang local marketplace ay nag-uugnay sa komunidad sa tunay na oportunidad: rentals, trabaho, private autos, items for sale, events, pagkain, pets, at higit pa.",
        bullets: [
          "Rentals at housing sa Bay Area.",
          "Trabaho at local employment opportunities.",
          "Private autos, items for sale, at community services.",
          "Wanted posts, pets, at local support.",
        ],
        ctaKey: "clasificados",
        ctaLabel: "Tuklasin ang classifieds",
      },
      {
        id: "local-business",
        title: "Preview ng local business profile",
        body: "Inaayos ng Negocios Locales ang phone, address, map, social media, photos, at links sa isang digital presence. Ang business at contact data ay nananatili sa orihinal na anyo.",
        bullets: [
          "Phone, address, at social ng negosyo — hindi awtomatikong isinasalin ang commercial data.",
          "Map, tawag, at mensahe mula sa mobile.",
          "Photos, reviews, at mahalagang links sa isang lugar.",
        ],
      },
      {
        id: "qr-access",
        title: "Digital magazine at QR language access",
        body: "Pinapanatili ng magasin ang Espanyol na pagkakakilanlan para unahin ang Latino community natin. Sa QR, binubuksan ng customers ang digital experience at maaaring gumamit ng device o browser translation tools kapag kailangan.",
        bullets: [
          "Mag-scan mula sa print ads patungo sa konkretong aksyon sa mobile.",
          "Browser translation, Google Lens, o Apple Translate kapag applicable.",
          "Kinukumpleto ng structured reader na ito — hindi pinapalitan — ang Espanyol na visual flipbook.",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Alamin ang Leonix Media",
      },
      {
        id: "advertise",
        title: "Gusto mong mag-advertise?",
        body: "I-connect ang iyong negosyo sa local readers sa pamamagitan ng print magazine placement, digital edition visibility, at bilingual presence. Makipag-ugnayan para sa Media Kit at launch options — walang presyo o garantiya sa view na ito.",
        ctaKey: "advertise",
        ctaLabel: "Mag-advertise sa amin",
      },
      {
        id: "newsletter",
        title: "Sumali sa newsletter",
        body: "Maging isa sa unang makakatanggap ng bagong editions, mahalagang anunsyo, local opportunities, at Leonix Media updates.",
        ctaKey: "newsletter",
        ctaLabel: "Mag-subscribe sa newsletter",
      },
      {
        id: "contact",
        title: "Contact / humiling ng karagdagang impormasyon",
        body: "Handa kaming tumulong sa advertising, Media Kit, at digital presence. Ang business contact details ay nananatili sa orihinal na anyo.",
        bullets: [
          "Mga tanong tungkol sa print at digital magazine advertising.",
          "Media Kit at launch packages — humiling ng detalye sa pamamagitan ng contact.",
          "Ang commercial information ay hindi awtomatikong isinasalin sa view na ito.",
        ],
        ctaKey: "contact",
        ctaLabel: "Makipag-ugnayan sa Leonix Media",
      },
    ],
  },

  km: {
    issueMeta: {
      title: "Leonix Media — ទស្សនាវដ្តី ខែមិថុនា 2026",
      monthLabel: "មិថុនា",
    },
    ui: {
      languageEyebrow: "ភាសាសម្រាប់អាន",
      originalMagazineLabel: "ទស្សនាវដ្តីដើមជាភាសាអេស្ប៉ាញ",
      languageChooserHint: "ជ្រើសរើសភាសា ដើម្បីអានការផ្សាយពាណិជ្ជកម្ម និងព័ត៌មានសំខាន់ៗ។",
      readerPreviewBadge: "មើលជាមុនអ្នកអានដែលបានបកប្រែ",
      readerPreviewIntro:
        "ទិដ្ឋភាពនេះសង្ខេបការផ្សាយពាណិជ្ជកម្ម ប្រកាសចាត់ថ្នាក់ និងព័ត៌មានទំនាក់ទំនងជាភាសារបស់អ្នក។ កំណែរូបភាពបោះពុម្ព និងឌីជីថលនៅតែជាភាសាអេស្ប៉ាញ។",
      futureFlipbookNote:
        "កំណែរូបភាពពេញលេញជាភាសាផ្សេងៗអាចមានជាឯកសារដាច់ដោយឡែកនៅពេលអាចប្រើបាន។ ថ្ងៃនេះ flipbook និង PDF ដើមនៅតែជាភាសាអេស្ប៉ាញ។",
      originalEditionNote:
        "កំណែរូបភាពដើមជាភាសាអេស្ប៉ាញ។ អ្នកអាននេះជួយឲ្យអ្នកយល់ព័ត៌មានសំខាន់ៗជាភាសារបស់អ្នក។",
      originalEditionTitle: "កំណែរូបភាពដើម (អេស្ប៉ាញ)",
      viewFlipbookSpanish: "មើល flipbook ភាសាអេស្ប៉ាញ",
      downloadPdf: "ទាញយក PDF ដើម",
      viewMediaKit: "មើល Media Kit",
      openFullReader: "បើកអ្នកអានពេញលេញ",
      backToMagazine: "ត្រឡប់ទៅទស្សនាវដ្តី",
      backToComingSoon: "ត្រឡប់ទៅ មកដល់ឆាប់ៗ",
      readPageTitle: "អ្នកអាន — ខែមិថុនា 2026",
      readPageSubtitle:
        "អ្នកអាននេះជួយអ្នកយល់ព័ត៌មានសំខាន់ៗពីកំណែខែមិថុនាជាភាសាដែលបានជ្រើសរើស។ ទស្សនាវដ្តីរូបភាពដើមនៅតែជាភាសាអេស្ប៉ាញ។",
      issuePageTitle: "កំណែ ខែមិថុនា 2026",
      issuePageIntro:
        "កំណែចេញផ្សាយដំបូងរបស់ Leonix Media ភ្ជាប់អាជីវកម្មមូលដ្ឋាន សហគមន៍ វប្បធម៌ និងឱកាស។ ជ្រើសរើសវិធីស្វែងយល់របស់អ្នក។",
      issuePageReaderCta: "បើកអ្នកអានដែលបានបកប្រែ",
      issuePageHubCta: "ទៅកាន់មជ្ឈមណ្ឌលទស្សនាវដ្តី",
      closeFlipbook: "បិទ",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "ពីបោះពុម្ព · QR",
      printSourceTitle: "ស្វាគមន៍ពីទស្សនាវដ្តីបោះពុម្ព",
      printSourceIntro:
        "អ្នកបានស្កេន Leonix QR។ អ្នកអាននេះគឺជាស្ពានពហុភាសា៖ ជ្រើសភាសា អានសង្ខេប និងសកម្មភាព ហើយបើកកំណែរូបភាពដើមពេលអ្នកចង់បាន។",
      printSourceStepScan: "ស្កេន QR ពីសម្ភារៈបោះពុម្ព ឬឌីជីថលរបស់ Leonix។",
      printSourceStepLanguage:
        "ជ្រើសភាសារបស់អ្នកនៅលើ Leonix ដើម្បីអានសង្ខេប និងព័ត៌មានអាជីវកម្មមូលដ្ឋាន។",
      printSourceStepHighlights:
        "ប្រើសង្ខេប និង CTA ជាភាសារបស់អ្នក — គេហទំព័រជាស្ពានពហុភាសា។",
      printSourceStepOriginal:
        "បើកទស្សនាវដ្តីឌីជីថលដើម (PDF/flipbook) ពេលអ្នកចង់មើលកំណែរូបភាពភាសាអេស្ប៉ាញ។",
      printSourceMobileNote:
        "បើអ្នកកំពុងប្រើទូរស័ព្ទរួចហើយ សូមកុំស្កេនអេក្រង់របស់ខ្លួនឯង។ ប្រើជម្រើសភាសាខាងលើ និងអ្នកអាននេះ។",
      printQrCaption: "QR ផ្លូវការ · ខែមិថុនា 2026 · leonixmedia.com",
      openLanguageReader: "បើកអ្នកអានជាភាសារបស់អ្នក",
      mediaKitPdfEsLabel: "Media Kit (PDF អេស្ប៉ាញដើម)",
      mediaKitPdfEnLabel: "Media Kit (PDF English)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "អំពី Leonix Media",
        body: "Leonix Media ភ្ជាប់អាជីវកម្មមូលដ្ឋានជាមួយសហគមន៍ Latino និងពហុវប្បធម៌នៅ Bay Area តាមរយៈការផ្សាយពាណិជ្ជកម្មបោះពុម្ពភាសាអេស្ប៉ាញ វត្តមានឌីជីថលពីរភាសា និងឧបករណ៍ដែលបម្លែងការចាប់អារម្មណ៍ទៅជាការហៅទូរស័ព្ទ ការទស្សនា និងការភ្ជាប់ពិតប្រាកដ។",
      },
      {
        id: "about-magazine",
        title: "អំពី El Águila និងទស្សនាវដ្តី",
        body: "Leonix Media ជាទស្សនាវដ្តីគុណភាពខ្ពស់ក្នុងប្រព័ន្ធអេកូ El Águila៖ សហគមន៍ វប្បធម៌ និងអាជីវកម្ម ក្នុងកំណែឌីជីថល និងបោះពុម្ព។ ចេញផ្សាយខែមិថុនា 2026 នាំមកនូវរឿងរ៉ាវមូលដ្ឋាន ការផ្សាយពាណិជ្ជកម្មអាជីវកម្ម ការលើកទឹកចិត្តសហគមន៍ និងស្ពានទៅកាន់ទីផ្សារ classifieds។",
        bullets: [
          "ទស្សនាវដ្តីបោះពុម្ពគុណភាពខ្ពស់ សម្រាប់សហគមន៍ Latino មូលដ្ឋាន។",
          "កំណែឌីជីថលមាន flipbook និង PDF ជាភាសាអេស្ប៉ាញ (រូបភាពដើម)។",
          "ការភ្ជាប់ទៅ classifieds, Negocios Locales និងសកម្មភាពតាម QR។",
        ],
      },
      {
        id: "featured-ads",
        title: "មើលជាមុនការផ្សាយពាណិជ្ជកម្មពិសេស",
        body: "កំណែនេះរួមមានកន្លែងផ្សាយពាណិជ្ជកម្មសម្រាប់អាជីវកម្មមូលដ្ឋាន។ ការផ្សាយពាណិជ្ជកម្មបង្ហាញប្រភេទ សារសំខាន់ និងព័ត៌មានទំនាក់ទំនងដើមរបស់អ្នកផ្សាយ — មិនបង្កើតឈ្មោះ ឬតម្លៃថ្មីនៅក្នុងទិដ្ឋភាពអ្នកអាននេះទេ។",
        bullets: [
          "ភោជនីយដ្ឋាន និងអាហារមូលដ្ឋាន — ម៉ឺនុយ ទីតាំង និងទំនាក់ទំនងអ្នកផ្សាយ។",
          "សេវាកម្មវិជ្ជាជីវៈ — បំពង់ទឹក អគ្គិសនី សម្អាត និងជួសជុល។",
          "សុខភាព សម្រស់ និងសុខុមាលភាព — គ្លីនិក ពេទ្យធ្មេញ និងសេវាកម្មសហគមន៍។",
          "វប្បធម៌ កីឡា រូបមន្តម្ហូប និងការលើកទឹកចិត្តសហគមន៍។",
        ],
      },
      {
        id: "classifieds",
        title: "មើលជាមុន classifieds",
        body: "Leonix មិនមែនមានតែការផ្សាយពាណិជ្ជកម្មប៉ុណ្ណោះទេ។ ទីផ្សារមូលដ្ឋានភ្ជាប់សហគមន៍ទៅឱកាសពិត៖ ជួលផ្ទះ ការងារ រថយន្តឯកជន ទំនិញលក់ ព្រឹត្តិការណ៍ អាហារ សត្វចិញ្ចឹម និងច្រើនទៀត។",
        bullets: [
          "ការជួល និងលំនៅឋាននៅ Bay Area។",
          "ការងារ និងឱកាសការងារមូលដ្ឋាន។",
          "រថយន្តឯកជន ទំនិញលក់ និងសេវាកម្មសហគមន៍។",
          "ប្រកាសស្វែងរក សត្វចិញ្ចឹម និងការគាំទ្រមូលដ្ឋាន។",
        ],
        ctaKey: "clasificados",
        ctaLabel: "ស្វែងរក classifieds",
      },
      {
        id: "local-business",
        title: "មើលជាមុនប្រវត្តិអាជីវកម្មមូលដ្ឋាន",
        body: "Negocios Locales រៀបចំលេខទូរស័ព្ទ អាសយដ្ឋាន ផែនទី បណ្ដាញសង្គម រូបថត និងតំណភ្ជាប់ក្នុងវត្តមានឌីជីថលតែមួយ។ ទិន្នន័យអាជីវកម្ម និងទំនាក់ទំនងត្រូវបានរក្សាទុកជាទម្រង់ដើម។",
        bullets: [
          "លេខទូរស័ព្ទ អាសយដ្ឋាន និងបណ្ដាញសង្គមអាជីវកម្ម — ទិន្នន័យពាណិជ្ជកម្មមិនត្រូវបានបកប្រែស្វ័យប្រវត្តិ។",
          "ផែនទី ការហៅ និងសារ ពីទូរស័ព្ទចល័ត។",
          "រូបថត មតិវាយតម្លៃ និងតំណសំខាន់ៗនៅកន្លែងតែមួយ។",
        ],
      },
      {
        id: "qr-access",
        title: "ការចូលប្រើទស្សនាវដ្តីឌីជីថល និងភាសាតាម QR",
        body: "ទស្សនាវដ្តីរក្សាអត្តសញ្ញាណភាសាអេស្ប៉ាញ ដើម្បីបម្រើសហគមន៍ Latino របស់យើងជាចម្បង។ ជាមួយ QR អតិថិជនអាចបើកបទពិសោធន៍ឌីជីថល និងប្រើឧបករណ៍បកប្រែរបស់ឧបករណ៍ ឬកម្មវិធីរុករកពេលចាំបាច់។",
        bullets: [
          "ស្កេនពីការផ្សាយពាណិជ្ជកម្មបោះពុម្ពទៅសកម្មភាពពិតលើទូរស័ព្ទ។",
          "ការបកប្រែកម្មវិធីរុករក, Google Lens ឬ Google Translate នៅពេលសមស្រប។",
          "អ្នកអានរចនាសម្ព័ន្ធនេះជួយបន្ថែម — មិនជំនួស — flipbook រូបភាពភាសាអេស្ប៉ាញទេ។",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "ស្វែងយល់អំពី Leonix Media",
      },
      {
        id: "advertise",
        title: "ចង់ផ្សាយពាណិជ្ជកម្មមែនទេ?",
        body: "ភ្ជាប់អាជីវកម្មរបស់អ្នកជាមួយអ្នកអានមូលដ្ឋាន តាមរយៈទីតាំងផ្សាយក្នុងទស្សនាវដ្តីបោះពុម្ព ការមើលឃើញក្នុងកំណែឌីជីថល និងវត្តមានពីរភាសា។ ទាក់ទងយើងសម្រាប់ Media Kit និងជម្រើសចាប់ផ្តើម — ទិដ្ឋភាពនេះមិនបង្ហាញតម្លៃ ឬការធានាទេ។",
        ctaKey: "advertise",
        ctaLabel: "ផ្សាយពាណិជ្ជកម្មជាមួយយើង",
      },
      {
        id: "newsletter",
        title: "ចូលរួម newsletter",
        body: "ក្លាយជាមនុស្សដំបូងៗក្នុងការទទួលបានកំណែថ្មីៗ សេចក្តីប្រកាសសំខាន់ៗ ឱកាសមូលដ្ឋាន និងព័ត៌មានថ្មីពី Leonix Media។",
        ctaKey: "newsletter",
        ctaLabel: "ជាវ newsletter",
      },
      {
        id: "contact",
        title: "ទំនាក់ទំនង / ស្នើសុំព័ត៌មានបន្ថែម",
        body: "យើងរួចរាល់ក្នុងការជួយផ្នែកផ្សាយពាណិជ្ជកម្ម Media Kit និងវត្តមានឌីជីថល។ ព័ត៌មានទំនាក់ទំនងអាជីវកម្មនៅតែជាទម្រង់ដើម។",
        bullets: [
          "សំណួរអំពីការផ្សាយពាណិជ្ជកម្មទស្សនាវដ្តីបោះពុម្ព និងឌីជីថល។",
          "Media Kit និងកញ្ចប់ចាប់ផ្តើម — ស្នើសុំព័ត៌មានលម្អិតតាមរយៈទំនាក់ទំនង។",
          "ព័ត៌មានពាណិជ្ជកម្មមិនត្រូវបានបកប្រែស្វ័យប្រវត្តិក្នុងទិដ្ឋភាពនេះទេ។",
        ],
        ctaKey: "contact",
        ctaLabel: "ទាក់ទង Leonix Media",
      },
    ],
  },

  zh: {
    issueMeta: {
      title: "Leonix Media — 2026年6月杂志",
      monthLabel: "六月",
    },
    ui: {
      languageEyebrow: "阅读语言",
      originalMagazineLabel: "原始西班牙语杂志",
      languageChooserHint: "请选择一种语言阅读广告和关键信息。",
      readerPreviewBadge: "翻译阅读预览",
      readerPreviewIntro:
        "此视图会用你的语言总结广告、分类信息和联系方式。印刷版与数字视觉版仍为西班牙语。",
      futureFlipbookNote:
        "未来若有其他语言的完整视觉版，可能会以单独文件提供。当前原始 flipbook 和 PDF 仍为西班牙语。",
      originalEditionNote:
        "原始视觉版为西班牙语。此阅读器帮助你用自己的语言理解关键信息。",
      originalEditionTitle: "原始视觉版（西班牙语）",
      viewFlipbookSpanish: "查看西班牙语 flipbook",
      downloadPdf: "下载原始 PDF",
      viewMediaKit: "查看 Media Kit",
      openFullReader: "打开完整阅读器",
      backToMagazine: "返回杂志",
      backToComingSoon: "返回“即将推出”",
      readPageTitle: "阅读器 — 2026年6月",
      readPageSubtitle:
        "此阅读器帮助你以所选语言理解六月刊的关键信息。原始视觉杂志仍为西班牙语。",
      issuePageTitle: "2026年6月刊",
      issuePageIntro:
        "Leonix Media 首发刊连接本地商家、社区、文化与机会。选择你想要的浏览方式。",
      issuePageReaderCta: "打开翻译阅读器",
      issuePageHubCta: "前往杂志中心",
      closeFlipbook: "关闭",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "来自印刷版 · QR",
      printSourceTitle: "来自印刷杂志的欢迎",
      printSourceIntro:
        "你已扫描 Leonix 的 QR。此阅读器是多语言桥梁：选择语言，阅读摘要和操作，然后在需要时打开原始视觉版。",
      printSourceStepScan: "从 Leonix 印刷或数字材料扫描 QR 码。",
      printSourceStepLanguage: "在 Leonix 选择语言以阅读摘要和本地商家信息。",
      printSourceStepHighlights: "用你的语言查看摘要和 CTA——网站就是多语言桥梁。",
      printSourceStepOriginal:
        "当你想看西班牙语视觉版时，打开原始数字杂志（PDF/flipbook）。",
      printSourceMobileNote:
        "如果你已经在手机上，请不要扫描自己的屏幕。请使用上方语言选择器和此阅读器。",
      printQrCaption: "官方 QR · 2026年6月 · leonixmedia.com",
      openLanguageReader: "以你的语言打开阅读器",
      mediaKitPdfEsLabel: "Media Kit（原始西班牙语 PDF）",
      mediaKitPdfEnLabel: "Media Kit（English PDF）",
    },
    sections: [
      {
        id: "about-leonix",
        title: "关于 Leonix Media",
        body: "Leonix Media 通过西班牙语印刷广告、双语数字展示以及将关注转化为来电、到店和真实连接的工具，把本地商家与湾区 Latino 及多元文化社区连接起来。",
      },
      {
        id: "about-magazine",
        title: "关于 El Águila 与本杂志",
        body: "Leonix Media 是 El Águila 生态中的高端杂志：在数字与印刷版本中呈现社区、文化与商业。2026年6月刊带来本地故事、商家广告、社区灵感，以及通往 classifieds 市场的桥梁。",
        bullets: [
          "为本地 Latino 社区打造的高品质印刷杂志。",
          "西班牙语数字版，包含 flipbook 与 PDF（原始视觉版）。",
          "连接 classifieds、Negocios Locales 和基于 QR 的操作。",
        ],
      },
      {
        id: "featured-ads",
        title: "精选广告预览",
        body: "本期包含本地商家的广告版位。广告展示类别、核心信息和广告主原始联系方式——此阅读视图不会虚构名称或价格。",
        bullets: [
          "餐厅与本地美食——菜单、位置和广告主联系方式。",
          "专业服务——水管、电工、清洁和维修。",
          "健康、美容与养生——诊所、牙医和社区服务。",
          "文化、体育、食谱与社区灵感。",
        ],
      },
      {
        id: "classifieds",
        title: "classifieds 预览",
        body: "Leonix 不仅仅是广告。本地市场把社区与真实机会连接起来：租房、工作、私人车辆、二手出售、活动、美食、宠物等。",
        bullets: [
          "Bay Area 的租房与住房信息。",
          "工作与本地就业机会。",
          "私人车辆、二手出售和社区服务。",
          "求购信息、宠物和本地互助。",
        ],
        ctaKey: "clasificados",
        ctaLabel: "浏览 classifieds",
      },
      {
        id: "local-business",
        title: "本地商家资料预览",
        body: "Negocios Locales 将电话、地址、地图、社交媒体、照片和链接整合为一个数字展示。商家与联系方式数据保持原始形式。",
        bullets: [
          "商家电话、地址和社媒——商业数据不会自动翻译。",
          "手机端可直接查看地图、拨号和发消息。",
          "照片、评价和重要链接集中在一处。",
        ],
      },
      {
        id: "qr-access",
        title: "数字杂志与 QR 多语言访问",
        body: "杂志保持西班牙语身份，优先服务我们的 Latino 社区。通过 QR，客户可打开数字体验，并在需要时使用设备或浏览器翻译工具。",
        bullets: [
          "从印刷广告扫码，直接进入手机上的具体操作。",
          "可使用浏览器翻译、Google Lens 或 Google Translate。",
          "此结构化阅读器是补充，而非替代西班牙语视觉 flipbook。",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "了解 Leonix Media",
      },
      {
        id: "advertise",
        title: "想投放广告？",
        body: "通过印刷杂志版位、数字版曝光和双语展示，让你的商家触达本地读者。联系获取 Media Kit 与上线方案——此视图不包含价格或保证。",
        ctaKey: "advertise",
        ctaLabel: "与我们投放广告",
      },
      {
        id: "newsletter",
        title: "加入 newsletter",
        body: "第一时间获取新刊、重要公告、本地机会和 Leonix Media 更新。",
        ctaKey: "newsletter",
        ctaLabel: "订阅 newsletter",
      },
      {
        id: "contact",
        title: "联系 / 索取更多信息",
        body: "我们可协助广告投放、Media Kit 与数字展示。商用联系方式保持原始形式。",
        bullets: [
          "咨询印刷和数字杂志广告。",
          "Media Kit 与上线套餐——通过联系渠道获取详情。",
          "此视图中的商业信息不会自动翻译。",
        ],
        ctaKey: "contact",
        ctaLabel: "联系 Leonix Media",
      },
    ],
  },

  ja: {
    issueMeta: {
      title: "Leonix Media — 2026年6月号マガジン",
      monthLabel: "6月",
    },
    ui: {
      languageEyebrow: "閲覧言語",
      originalMagazineLabel: "オリジナルのスペイン語マガジン",
      languageChooserHint: "広告と重要情報を読む言語を選択してください。",
      readerPreviewBadge: "翻訳リーダープレビュー",
      readerPreviewIntro:
        "この表示では、広告・クラシファイド・連絡先情報をあなたの言語で要約します。印刷版とデジタルのビジュアル版はスペイン語のままです。",
      futureFlipbookNote:
        "将来、他言語のフルビジュアル版が利用可能になれば別ファイルとして提供される場合があります。現時点ではオリジナルの flipbook と PDF はスペイン語のままです。",
      originalEditionNote:
        "オリジナルのビジュアル版はスペイン語です。このリーダーは、重要情報をあなたの言語で理解するための補助です。",
      originalEditionTitle: "オリジナルビジュアル版（スペイン語）",
      viewFlipbookSpanish: "スペイン語 flipbook を見る",
      downloadPdf: "オリジナル PDF をダウンロード",
      viewMediaKit: "Media Kit を見る",
      openFullReader: "フルリーダーを開く",
      backToMagazine: "マガジンに戻る",
      backToComingSoon: "近日公開に戻る",
      readPageTitle: "リーダー — 2026年6月",
      readPageSubtitle:
        "このリーダーは、6月号の重要情報を選択した言語で理解するのに役立ちます。オリジナルのビジュアルマガジンはスペイン語のままです。",
      issuePageTitle: "2026年6月号",
      issuePageIntro:
        "Leonix Media の創刊号は、地域ビジネス・コミュニティ・文化・機会をつなぎます。閲覧方法を選んでください。",
      issuePageReaderCta: "翻訳リーダーを開く",
      issuePageHubCta: "マガジンハブへ移動",
      closeFlipbook: "閉じる",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "印刷版から · QR",
      printSourceTitle: "印刷マガジンからようこそ",
      printSourceIntro:
        "Leonix の QR をスキャンしました。このリーダーは多言語ブリッジです。言語を選び、要約とアクションを確認し、必要なときにオリジナルのビジュアル版を開いてください。",
      printSourceStepScan: "Leonix の印刷物またはデジタル素材から QR をスキャンします。",
      printSourceStepLanguage:
        "Leonix で言語を選び、要約とローカルビジネス情報を読みます。",
      printSourceStepHighlights:
        "あなたの言語で要約と CTA を確認できます — ウェブサイトが多言語ブリッジです。",
      printSourceStepOriginal:
        "スペイン語のビジュアル版を見たい場合は、オリジナルのデジタルマガジン（PDF/flipbook）を開きます。",
      printSourceMobileNote:
        "すでにスマートフォンで見ている場合は、自分の画面をスキャンしないでください。上の言語セレクターとこのリーダーを使ってください。",
      printQrCaption: "公式QR · 2026年6月 · leonixmedia.com",
      openLanguageReader: "あなたの言語でリーダーを開く",
      mediaKitPdfEsLabel: "Media Kit（オリジナルのスペイン語 PDF）",
      mediaKitPdfEnLabel: "Media Kit（English PDF）",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Leonix Media について",
        body: "Leonix Media は、スペイン語の印刷広告、バイリンガルのデジタル展開、そして注目を電話・来店・実際のつながりへ変えるツールを通じて、地域ビジネスと Bay Area の Latino および多文化コミュニティを結びます。",
      },
      {
        id: "about-magazine",
        title: "El Águila とマガジンについて",
        body: "Leonix Media は El Águila エコシステム内のプレミアムマガジンです。コミュニティ、文化、ビジネスをデジタル版と印刷版で届けます。2026年6月号には地域の物語、ビジネス広告、コミュニティのインスピレーション、そして classifieds マーケットへの導線が含まれます。",
        bullets: [
          "地域の Latino コミュニティ向けに設計されたプレミアム印刷マガジン。",
          "スペイン語のデジタル版（flipbook と PDF、オリジナルビジュアル）。",
          "classifieds、Negocios Locales、QR導線アクションへの接続。",
        ],
      },
      {
        id: "featured-ads",
        title: "注目広告プレビュー",
        body: "この号には地域ビジネス向けの広告枠が含まれます。広告にはカテゴリ、主メッセージ、広告主の元の連絡先情報を表示し、このリーダービューで架空の名称や価格は追加しません。",
        bullets: [
          "レストラン・地域フード — メニュー、場所、広告主連絡先。",
          "専門サービス — 配管、電気、清掃、修理。",
          "健康・美容・ウェルネス — クリニック、歯科、コミュニティサービス。",
          "文化、スポーツ、レシピ、コミュニティのインスピレーション。",
        ],
      },
      {
        id: "classifieds",
        title: "classifieds プレビュー",
        body: "Leonix は広告だけではありません。地域マーケットプレイスは、賃貸、仕事、個人車両、販売品、イベント、フード、ペットなど、実際の機会へコミュニティをつなぎます。",
        bullets: [
          "Bay Area の賃貸・住居情報。",
          "仕事と地域の雇用機会。",
          "個人車両、販売品、コミュニティサービス。",
          "募集投稿、ペット、地域サポート。",
        ],
        ctaKey: "clasificados",
        ctaLabel: "classifieds を見る",
      },
      {
        id: "local-business",
        title: "ローカルビジネスプロフィールのプレビュー",
        body: "Negocios Locales は電話、住所、地図、SNS、写真、リンクを1つのデジタルプレゼンスに整理します。ビジネス情報と連絡先情報は元の形式のまま保持されます。",
        bullets: [
          "電話・住所・SNS — 商用データは自動翻訳されません。",
          "モバイルから地図、通話、メッセージへアクセス。",
          "写真、レビュー、重要リンクを1か所に集約。",
        ],
      },
      {
        id: "qr-access",
        title: "デジタルマガジンとQR言語アクセス",
        body: "マガジンはスペイン語アイデンティティを維持し、私たちの Latino コミュニティを第一に支えます。QR により、利用者はデジタル体験を開き、必要に応じて端末やブラウザの翻訳ツールを使えます。",
        bullets: [
          "印刷広告からスキャンして、モバイル上の具体的な行動へ。",
          "ブラウザ翻訳、Google Lens、または Google Translate を活用可能。",
          "この構造化リーダーはスペイン語ビジュアル flipbook を補完し、置き換えるものではありません。",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Leonix Media について知る",
      },
      {
        id: "advertise",
        title: "広告を出したいですか？",
        body: "印刷マガジン掲載、デジタル版での可視性、バイリンガル展開で地域読者にリーチしましょう。Media Kit と開始オプションはお問い合わせください — このビューには価格や保証は含まれません。",
        ctaKey: "advertise",
        ctaLabel: "広告掲載を相談する",
      },
      {
        id: "newsletter",
        title: "newsletter に参加",
        body: "新しい号、重要なお知らせ、地域の機会、Leonix Media の更新をいち早く受け取りましょう。",
        ctaKey: "newsletter",
        ctaLabel: "newsletter を購読",
      },
      {
        id: "contact",
        title: "お問い合わせ / 詳細情報をリクエスト",
        body: "広告、Media Kit、デジタル展開についてサポートします。ビジネス連絡先情報は元の形式のままです。",
        bullets: [
          "印刷版・デジタル版マガジン広告に関するご相談。",
          "Media Kit とローンチパッケージ — お問い合わせから詳細をご請求ください。",
          "このビューの商用情報は自動翻訳されません。",
        ],
        ctaKey: "contact",
        ctaLabel: "Leonix Media に連絡",
      },
    ],
  },

  ko: {
    issueMeta: {
      title: "Leonix Media — 2026년 6월 매거진",
      monthLabel: "6월",
    },
    ui: {
      languageEyebrow: "읽기 언어",
      originalMagazineLabel: "원본 스페인어 매거진",
      languageChooserHint: "광고와 핵심 정보를 읽을 언어를 선택하세요.",
      readerPreviewBadge: "번역 리더 미리보기",
      readerPreviewIntro:
        "이 화면은 광고, 구인/구매 정보, 연락처를 선택한 언어로 요약합니다. 인쇄판과 디지털 비주얼 에디션은 스페인어로 유지됩니다.",
      futureFlipbookNote:
        "향후 다른 언어의 전체 비주얼 에디션은 별도 파일로 제공될 수 있습니다. 현재 원본 flipbook과 PDF는 스페인어로 유지됩니다.",
      originalEditionNote:
        "원본 비주얼 에디션은 스페인어입니다. 이 리더는 핵심 정보를 사용자의 언어로 이해하도록 돕습니다.",
      originalEditionTitle: "원본 비주얼 에디션(스페인어)",
      viewFlipbookSpanish: "스페인어 flipbook 보기",
      downloadPdf: "원본 PDF 다운로드",
      viewMediaKit: "Media Kit 보기",
      openFullReader: "전체 리더 열기",
      backToMagazine: "매거진으로 돌아가기",
      backToComingSoon: "Coming Soon으로 돌아가기",
      readPageTitle: "리더 — 2026년 6월",
      readPageSubtitle:
        "이 리더는 6월호의 핵심 정보를 선택한 언어로 이해하도록 돕습니다. 원본 비주얼 매거진은 스페인어로 유지됩니다.",
      issuePageTitle: "2026년 6월호",
      issuePageIntro:
        "Leonix Media 창간호는 지역 비즈니스, 커뮤니티, 문화, 기회를 연결합니다. 원하는 탐색 방식을 선택하세요.",
      issuePageReaderCta: "번역 리더 열기",
      issuePageHubCta: "매거진 허브로 이동",
      closeFlipbook: "닫기",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "인쇄본에서 · QR",
      printSourceTitle: "인쇄 매거진에서 오신 것을 환영합니다",
      printSourceIntro:
        "Leonix QR을 스캔하셨습니다. 이 리더는 다국어 브리지입니다: 언어를 선택하고 요약과 액션을 확인한 뒤, 원할 때 원본 비주얼 에디션을 열어보세요.",
      printSourceStepScan: "Leonix 인쇄물 또는 디지털 자료의 QR 코드를 스캔하세요.",
      printSourceStepLanguage: "Leonix에서 언어를 선택해 요약과 지역 비즈니스 정보를 읽으세요.",
      printSourceStepHighlights: "선택한 언어의 요약과 CTA를 사용하세요 — 웹사이트가 다국어 브리지입니다.",
      printSourceStepOriginal:
        "스페인어 비주얼 에디션을 보려면 원본 디지털 매거진(PDF/flipbook)을 여세요.",
      printSourceMobileNote:
        "이미 휴대폰을 사용 중이라면 자신의 화면을 다시 스캔하지 마세요. 위 언어 선택기와 이 리더를 사용하세요.",
      printQrCaption: "공식 QR · 2026년 6월 · leonixmedia.com",
      openLanguageReader: "내 언어로 리더 열기",
      mediaKitPdfEsLabel: "Media Kit (원본 스페인어 PDF)",
      mediaKitPdfEnLabel: "Media Kit (English PDF)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Leonix Media 소개",
        body: "Leonix Media는 스페인어 인쇄 광고, 이중언어 디지털 존재감, 그리고 관심을 전화·방문·실제 연결로 전환하는 도구를 통해 지역 비즈니스와 Bay Area의 Latino 및 다문화 커뮤니티를 연결합니다.",
      },
      {
        id: "about-magazine",
        title: "El Águila와 매거진 소개",
        body: "Leonix Media는 El Águila 생태계의 프리미엄 매거진입니다: 디지털/인쇄 에디션으로 커뮤니티, 문화, 비즈니스를 연결합니다. 2026년 6월호는 지역 이야기, 비즈니스 광고, 커뮤니티 영감, 그리고 classifieds 마켓플레이스로 가는 다리를 제공합니다.",
        bullets: [
          "지역 Latino 커뮤니티를 위해 설계된 프리미엄 인쇄 매거진.",
          "스페인어 디지털 에디션: flipbook 및 PDF(원본 비주얼).",
          "classifieds, Negocios Locales, QR 기반 액션과의 연결.",
        ],
      },
      {
        id: "featured-ads",
        title: "주요 광고 미리보기",
        body: "이번 호에는 지역 비즈니스를 위한 광고 공간이 포함됩니다. 광고는 카테고리, 핵심 메시지, 광고주의 원본 연락처 정보를 보여주며, 이 리더 화면에서는 이름이나 가격을 임의로 만들지 않습니다.",
        bullets: [
          "레스토랑 및 지역 음식 — 메뉴, 위치, 광고주 연락처.",
          "전문 서비스 — 배관, 전기, 청소, 수리.",
          "건강·미용·웰니스 — 클리닉, 치과, 커뮤니티 서비스.",
          "문화, 스포츠, 레시피, 커뮤니티 영감.",
        ],
      },
      {
        id: "classifieds",
        title: "classifieds 미리보기",
        body: "Leonix는 광고만 제공하지 않습니다. 지역 마켓플레이스는 임대, 일자리, 개인 차량, 판매 물품, 이벤트, 음식, 반려동물 등 실제 기회와 커뮤니티를 연결합니다.",
        bullets: [
          "Bay Area 임대 및 주거 정보.",
          "일자리와 지역 고용 기회.",
          "개인 차량, 판매 물품, 커뮤니티 서비스.",
          "구함 게시물, 반려동물, 지역 지원.",
        ],
        ctaKey: "clasificados",
        ctaLabel: "classifieds 둘러보기",
      },
      {
        id: "local-business",
        title: "지역 비즈니스 프로필 미리보기",
        body: "Negocios Locales는 전화번호, 주소, 지도, 소셜 미디어, 사진, 링크를 하나의 디지털 존재감으로 정리합니다. 비즈니스/연락처 데이터는 원본 형태로 유지됩니다.",
        bullets: [
          "전화, 주소, 소셜 정보 — 상업 데이터는 자동 번역되지 않습니다.",
          "모바일에서 지도, 통화, 메시지로 바로 연결.",
          "사진, 리뷰, 중요 링크를 한곳에서 확인.",
        ],
      },
      {
        id: "qr-access",
        title: "디지털 매거진 및 QR 언어 접근",
        body: "매거진은 스페인어 정체성을 유지해 Latino 커뮤니티를 우선적으로 지원합니다. QR로 디지털 경험을 열고, 필요 시 기기 또는 브라우저 번역 도구를 사용할 수 있습니다.",
        bullets: [
          "인쇄 광고에서 스캔해 모바일의 구체적 행동으로 이동.",
          "브라우저 번역, Google Lens, Google Translate 사용 가능.",
          "이 구조화된 리더는 스페인어 비주얼 flipbook을 보완하며 대체하지 않습니다.",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Leonix Media 알아보기",
      },
      {
        id: "advertise",
        title: "광고를 원하시나요?",
        body: "인쇄 매거진 게재, 디지털 에디션 노출, 이중언어 존재감을 통해 지역 독자와 연결하세요. Media Kit 및 런칭 옵션은 문의해 주세요 — 이 화면에는 가격이나 보장이 포함되지 않습니다.",
        ctaKey: "advertise",
        ctaLabel: "광고 문의하기",
      },
      {
        id: "newsletter",
        title: "newsletter 구독",
        body: "새로운 호, 중요한 공지, 지역 기회, Leonix Media 업데이트를 가장 먼저 받아보세요.",
        ctaKey: "newsletter",
        ctaLabel: "newsletter 구독하기",
      },
      {
        id: "contact",
        title: "연락 / 추가 정보 요청",
        body: "광고, Media Kit, 디지털 존재감 관련 지원을 제공합니다. 비즈니스 연락처 정보는 원본 형태로 유지됩니다.",
        bullets: [
          "인쇄/디지털 매거진 광고 관련 문의.",
          "Media Kit 및 런칭 패키지 — 연락을 통해 상세 정보 요청.",
          "이 화면의 상업 정보는 자동 번역되지 않습니다.",
        ],
        ctaKey: "contact",
        ctaLabel: "Leonix Media 연락하기",
      },
    ],
  },

  hi: {
    issueMeta: {
      title: "Leonix Media — जून 2026 पत्रिका",
      monthLabel: "जून",
    },
    ui: {
      languageEyebrow: "पढ़ने की भाषा",
      originalMagazineLabel: "मूल स्पेनिश पत्रिका",
      languageChooserHint: "विज्ञापन और मुख्य जानकारी पढ़ने के लिए भाषा चुनें।",
      readerPreviewBadge: "अनुवादित रीडर पूर्वावलोकन",
      readerPreviewIntro:
        "यह दृश्य विज्ञापनों, classifieds और संपर्क विवरण को आपकी भाषा में संक्षेप करता है। प्रिंट और डिजिटल विजुअल संस्करण स्पेनिश में ही रहता है।",
      futureFlipbookNote:
        "भविष्य में अन्य भाषाओं के पूर्ण विजुअल संस्करण अलग फ़ाइलों के रूप में उपलब्ध हो सकते हैं। आज मूल flipbook और PDF स्पेनिश में ही हैं।",
      originalEditionNote:
        "मूल विजुअल संस्करण स्पेनिश में है। यह रीडर आपकी भाषा में मुख्य जानकारी समझने में मदद करता है।",
      originalEditionTitle: "मूल विजुअल संस्करण (स्पेनिश)",
      viewFlipbookSpanish: "स्पेनिश flipbook देखें",
      downloadPdf: "मूल PDF डाउनलोड करें",
      viewMediaKit: "Media Kit देखें",
      openFullReader: "पूरा रीडर खोलें",
      backToMagazine: "पत्रिका पर वापस जाएँ",
      backToComingSoon: "Coming Soon पर वापस जाएँ",
      readPageTitle: "रीडर — जून 2026",
      readPageSubtitle:
        "यह रीडर जून संस्करण की मुख्य जानकारी को आपकी चुनी हुई भाषा में समझने में मदद करता है। मूल विजुअल पत्रिका स्पेनिश में ही रहती है।",
      issuePageTitle: "जून 2026 संस्करण",
      issuePageIntro:
        "Leonix Media का लॉन्च संस्करण स्थानीय व्यवसायों, समुदाय, संस्कृति और अवसरों को जोड़ता है। इसे देखने का तरीका चुनें।",
      issuePageReaderCta: "अनुवादित रीडर खोलें",
      issuePageHubCta: "मैगज़ीन हब पर जाएँ",
      closeFlipbook: "बंद करें",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "प्रिंट से · QR",
      printSourceTitle: "मुद्रित पत्रिका से आपका स्वागत है",
      printSourceIntro:
        "आपने Leonix QR स्कैन किया है। यह रीडर बहुभाषी पुल है: भाषा चुनें, सारांश और क्रियाएँ पढ़ें, और चाहें तो मूल विजुअल संस्करण खोलें।",
      printSourceStepScan: "Leonix के प्रिंट या डिजिटल सामग्री से QR स्कैन करें।",
      printSourceStepLanguage:
        "Leonix पर अपनी भाषा चुनें ताकि आप सारांश और स्थानीय व्यवसाय जानकारी पढ़ सकें।",
      printSourceStepHighlights:
        "अपनी भाषा में सारांश और CTA का उपयोग करें — वेबसाइट ही बहुभाषी पुल है।",
      printSourceStepOriginal:
        "जब आप स्पेनिश विजुअल संस्करण देखना चाहें, तो मूल डिजिटल पत्रिका (PDF/flipbook) खोलें।",
      printSourceMobileNote:
        "यदि आप पहले से फोन पर हैं, तो अपनी ही स्क्रीन स्कैन न करें। ऊपर भाषा चयनकर्ता और इस रीडर का उपयोग करें।",
      printQrCaption: "आधिकारिक QR · जून 2026 · leonixmedia.com",
      openLanguageReader: "अपनी भाषा में रीडर खोलें",
      mediaKitPdfEsLabel: "Media Kit (मूल स्पेनिश PDF)",
      mediaKitPdfEnLabel: "Media Kit (English PDF)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Leonix Media के बारे में",
        body: "Leonix Media स्पेनिश प्रिंट विज्ञापन, द्विभाषी डिजिटल उपस्थिति और ऐसे टूल्स के माध्यम से स्थानीय व्यवसायों को Bay Area के Latino और बहुसांस्कृतिक समुदाय से जोड़ता है, जो ध्यान को कॉल, विज़िट और वास्तविक कनेक्शन में बदलते हैं।",
      },
      {
        id: "about-magazine",
        title: "El Águila और पत्रिका के बारे में",
        body: "Leonix Media, El Águila इकोसिस्टम की प्रीमियम पत्रिका है: डिजिटल और प्रिंट संस्करण में समुदाय, संस्कृति और व्यवसाय को जोड़ती है। जून 2026 अंक में स्थानीय कहानियाँ, व्यवसायिक विज्ञापन, सामुदायिक प्रेरणा और classifieds मार्केटप्लेस से जुड़ाव शामिल है।",
        bullets: [
          "स्थानीय Latino समुदाय के लिए डिज़ाइन की गई प्रीमियम प्रिंट पत्रिका।",
          "स्पेनिश में डिजिटल संस्करण: flipbook और PDF (मूल विजुअल)।",
          "classifieds, Negocios Locales और QR-आधारित क्रियाओं से जुड़ाव।",
        ],
      },
      {
        id: "featured-ads",
        title: "प्रमुख विज्ञापनों का पूर्वावलोकन",
        body: "इस संस्करण में स्थानीय व्यवसायों के लिए विज्ञापन स्थान शामिल है। विज्ञापन श्रेणी, मुख्य संदेश और विज्ञापनदाता की मूल संपर्क जानकारी दिखाते हैं — इस रीडर दृश्य में कोई नाम या कीमतें गढ़ी नहीं जातीं।",
        bullets: [
          "रेस्तरां और स्थानीय भोजन — मेन्यू, स्थान और विज्ञापनदाता संपर्क।",
          "पेशेवर सेवाएँ — प्लंबिंग, इलेक्ट्रिकल, क्लीनिंग और मरम्मत।",
          "स्वास्थ्य, सौंदर्य और वेलनेस — क्लीनिक, दंत चिकित्सक और सामुदायिक सेवाएँ।",
          "संस्कृति, खेल, रेसिपी और सामुदायिक प्रेरणा।",
        ],
      },
      {
        id: "classifieds",
        title: "classifieds पूर्वावलोकन",
        body: "Leonix सिर्फ विज्ञापन नहीं है। स्थानीय मार्केटप्लेस समुदाय को वास्तविक अवसरों से जोड़ता है: किराया, नौकरियाँ, निजी वाहन, बिक्री की वस्तुएँ, कार्यक्रम, भोजन, पालतू जानवर और बहुत कुछ।",
        bullets: [
          "Bay Area में किराया और आवास।",
          "नौकरियाँ और स्थानीय रोजगार अवसर।",
          "निजी वाहन, बिक्री की वस्तुएँ और सामुदायिक सेवाएँ।",
          "वांछित पोस्ट, पालतू जानवर और स्थानीय सहायता।",
        ],
        ctaKey: "clasificados",
        ctaLabel: "classifieds देखें",
      },
      {
        id: "local-business",
        title: "स्थानीय व्यवसाय प्रोफ़ाइल पूर्वावलोकन",
        body: "Negocios Locales फ़ोन, पता, मैप, सोशल मीडिया, फ़ोटो और लिंक को एक डिजिटल उपस्थिति में संगठित करता है। व्यवसाय और संपर्क डेटा मूल रूप में ही रहता है।",
        bullets: [
          "व्यवसाय का फ़ोन, पता और सोशल — वाणिज्यिक डेटा का स्वतः अनुवाद नहीं होता।",
          "मोबाइल से मैप, कॉल और मैसेज तक पहुँच।",
          "फ़ोटो, रिव्यू और महत्वपूर्ण लिंक एक ही जगह।",
        ],
      },
      {
        id: "qr-access",
        title: "डिजिटल पत्रिका और QR भाषा पहुँच",
        body: "पत्रिका अपनी स्पेनिश पहचान बनाए रखती है ताकि पहले हमारे Latino समुदाय की सेवा कर सके। QR के साथ ग्राहक डिजिटल अनुभव खोलते हैं और आवश्यकता होने पर डिवाइस या ब्राउज़र अनुवाद टूल्स का उपयोग कर सकते हैं।",
        bullets: [
          "प्रिंट विज्ञापनों से स्कैन करके मोबाइल पर सीधे क्रियाओं तक पहुँचें।",
          "ब्राउज़र अनुवाद, Google Lens या Google Translate का उपयोग करें।",
          "यह संरचित रीडर स्पेनिश विजुअल flipbook का पूरक है — उसका विकल्प नहीं।",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Leonix Media के बारे में जानें",
      },
      {
        id: "advertise",
        title: "विज्ञापन देना चाहते हैं?",
        body: "प्रिंट पत्रिका प्लेसमेंट, डिजिटल संस्करण दृश्यता और द्विभाषी उपस्थिति के माध्यम से अपने व्यवसाय को स्थानीय पाठकों से जोड़ें। Media Kit और लॉन्च विकल्पों के लिए संपर्क करें — इस दृश्य में कीमत या गारंटी शामिल नहीं है।",
        ctaKey: "advertise",
        ctaLabel: "हमारे साथ विज्ञापन दें",
      },
      {
        id: "newsletter",
        title: "newsletter से जुड़ें",
        body: "नई आवृत्तियाँ, महत्वपूर्ण घोषणाएँ, स्थानीय अवसर और Leonix Media अपडेट सबसे पहले प्राप्त करें।",
        ctaKey: "newsletter",
        ctaLabel: "newsletter सदस्यता लें",
      },
      {
        id: "contact",
        title: "संपर्क / अधिक जानकारी का अनुरोध",
        body: "हम विज्ञापन, Media Kit और डिजिटल उपस्थिति में मदद के लिए तैयार हैं। व्यावसायिक संपर्क विवरण मूल रूप में ही रहते हैं।",
        bullets: [
          "प्रिंट और डिजिटल पत्रिका विज्ञापन संबंधी प्रश्न।",
          "Media Kit और लॉन्च पैकेज — संपर्क के माध्यम से विवरण माँगें।",
          "इस दृश्य में व्यावसायिक जानकारी स्वतः अनुवादित नहीं होती।",
        ],
        ctaKey: "contact",
        ctaLabel: "Leonix Media से संपर्क करें",
      },
    ],
  },

  hy: {
    issueMeta: {
      title: "Leonix Media — 2026 թ. հունիսի ամսագիր",
      monthLabel: "Հունիս",
    },
    ui: {
      languageEyebrow: "ԸՆԹԵՐՑՄԱՆ ԼԵԶՈՒ",
      originalMagazineLabel: "Բնօրինակ իսպաներեն ամսագիր",
      languageChooserHint: "Ընտրեք լեզուն՝ գովազդներն ու հիմնական տեղեկությունը կարդալու համար։",
      readerPreviewBadge: "Թարգմանված reader-ի նախադիտում",
      readerPreviewIntro:
        "Այս տեսքում ձեր լեզվով ամփոփվում են գովազդները, classifieds-ը և կապի տվյալները։ Տպագիր և թվային տեսողական տարբերակը մնում է իսպաներեն։",
      futureFlipbookNote:
        "Ապագայում այլ լեզուներով ամբողջական տեսողական տարբերակները կարող են հասանելի լինել առանձին ֆայլերով։ Այս պահին բնօրինակ flipbook-ը և PDF-ը մնում են իսպաներեն։",
      originalEditionNote:
        "Բնօրինակ տեսողական տարբերակը իսպաներեն է։ Այս reader-ը օգնում է ձեր լեզվով հասկանալ հիմնական տեղեկությունը։",
      originalEditionTitle: "Բնօրինակ տեսողական տարբերակ (իսպաներեն)",
      viewFlipbookSpanish: "Բացել իսպաներեն flipbook-ը",
      downloadPdf: "Ներբեռնել բնօրինակ PDF-ը",
      viewMediaKit: "Բացել Media Kit-ը",
      openFullReader: "Բացել ամբողջ reader-ը",
      backToMagazine: "Վերադառնալ ամսագրին",
      backToComingSoon: "Վերադառնալ Coming Soon",
      readPageTitle: "Ընթերցող — Հունիս 2026",
      readPageSubtitle:
        "Այս reader-ը օգնում է հունիսյան համարի հիմնական տեղեկությունը հասկանալ ընտրված լեզվով։ Բնօրինակ տեսողական ամսագիրը մնում է իսպաներեն։",
      issuePageTitle: "2026-ի հունիսյան համար",
      issuePageIntro:
        "Leonix Media-ի մեկնարկային համարը միավորում է տեղական բիզնեսը, համայնքը, մշակույթը և հնարավորությունները։ Ընտրեք՝ ինչպես ուսումնասիրել այն։",
      issuePageReaderCta: "Բացել թարգմանված reader-ը",
      issuePageHubCta: "Գնալ ամսագրի հաբ",
      closeFlipbook: "Փակել",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "ՏՊԱԳՐԻՑ · QR",
      printSourceTitle: "Բարի գալուստ տպագիր ամսագրից",
      printSourceIntro:
        "Դուք սկանավորել եք Leonix QR-ը։ Այս reader-ը բազմալեզու կամուրջ է՝ ընտրեք լեզուն, կարդացեք ամփոփումներն ու գործողությունները, ապա բացեք բնօրինակ տեսողական տարբերակը երբ ցանկանաք։",
      printSourceStepScan: "Սկանավորեք QR-ը Leonix տպագիր կամ թվային նյութերից։",
      printSourceStepLanguage:
        "Leonix-ում ընտրեք ձեր լեզուն՝ ամփոփումներն ու տեղական բիզնեսի տեղեկությունը կարդալու համար։",
      printSourceStepHighlights:
        "Օգտագործեք ամփոփումներն ու CTA-ները ձեր լեզվով — կայքը բազմալեզու կամուրջն է։",
      printSourceStepOriginal:
        "Երբ ուզեք տեսնել իսպաներեն տեսողական տարբերակը, բացեք բնօրինակ թվային ամսագիրը (PDF/flipbook)։",
      printSourceMobileNote:
        "Եթե արդեն հեռախոսով եք, մի սկանավորեք ձեր սեփական էկրանը։ Օգտագործեք վերևի լեզվի ընտրիչը և այս reader-ը։",
      printQrCaption: "Պաշտոնական QR · Հունիս 2026 · leonixmedia.com",
      openLanguageReader: "Բացել reader-ը ձեր լեզվով",
      mediaKitPdfEsLabel: "Media Kit (բնօրինակ իսպաներեն PDF)",
      mediaKitPdfEnLabel: "Media Kit (English PDF)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Leonix Media-ի մասին",
        body: "Leonix Media-ն տեղական բիզնեսը կապում է Bay Area-ի Latino և բազմամշակութային համայնքի հետ՝ իսպաներեն տպագիր գովազդի, երկլեզու թվային ներկայության և գործիքների միջոցով, որոնք ուշադրությունը վերածում են զանգերի, այցելությունների և իրական կապերի։",
      },
      {
        id: "about-magazine",
        title: "El Águila-ի և ամսագրի մասին",
        body: "Leonix Media-ն El Águila էկոհամակարգի premium ամսագիրն է՝ համայնք, մշակույթ և բիզնես՝ թվային ու տպագիր տարբերակներով։ 2026-ի հունիսյան համարը ներկայացնում է տեղական պատմություններ, բիզնես գովազդներ, համայնքային ներշնչում և կամուրջներ դեպի classifieds շուկա։",
        bullets: [
          "Premium տպագիր ամսագիր՝ ստեղծված տեղական Latino համայնքի համար։",
          "Թվային տարբերակ flipbook-ով և PDF-ով իսպաներեն (բնօրինակ տեսողական)։",
          "Կապ classifieds-ի, Negocios Locales-ի և QR-ով գործողությունների հետ։",
        ],
      },
      {
        id: "featured-ads",
        title: "Առանձնացված գովազդների նախադիտում",
        body: "Այս համարում կա գովազդային տարածք տեղական բիզնեսների համար։ Գովազդներում նշվում են կատեգորիան, հիմնական ուղերձը և գովազդատուի բնօրինակ կապի տվյալները — այս reader տեսքում հորինված անուններ կամ գներ չկան։",
        bullets: [
          "Ռեստորաններ և տեղական սնունդ — մենյու, հասցե և գովազդատուի կապ։",
          "Մասնագիտական ծառայություններ — սանտեխնիկա, էլեկտրիկա, մաքրում և նորոգում։",
          "Առողջություն, գեղեցկություն և բարեկեցություն — կլինիկաներ, ատամնաբույժներ, համայնքային ծառայություններ։",
          "Մշակույթ, սպորտ, բաղադրատոմսեր և համայնքային ներշնչում։",
        ],
      },
      {
        id: "classifieds",
        title: "Classifieds-ի նախադիտում",
        body: "Leonix-ը միայն գովազդ չէ։ Տեղական շուկան համայնքը կապում է իրական հնարավորությունների հետ՝ վարձակալություն, աշխատանք, անձնական ավտոմեքենաներ, վաճառքի իրեր, միջոցառումներ, սնունդ, կենդանիներ և ավելին։",
        bullets: [
          "Վարձակալություն և բնակարանային առաջարկներ Bay Area-ում։",
          "Աշխատանք և տեղական զբաղվածության հնարավորություններ։",
          "Անձնական ավտոմեքենաներ, վաճառքի իրեր և համայնքային ծառայություններ։",
          "Wanted հայտարարություններ, կենդանիներ և տեղական աջակցություն։",
        ],
        ctaKey: "clasificados",
        ctaLabel: "Բացել classifieds-ը",
      },
      {
        id: "local-business",
        title: "Տեղական բիզնես պրոֆիլի նախադիտում",
        body: "Negocios Locales-ը մեկ թվային ներկայության մեջ հավաքում է հեռախոս, հասցե, քարտեզ, սոցիալական ցանցեր, լուսանկարներ և հղումներ։ Բիզնեսի և կապի տվյալները մնում են իրենց բնօրինակ ձևով։",
        bullets: [
          "Բիզնես հեռախոս, հասցե և սոցիալական ցանցեր — առևտրային տվյալները ավտոմատ չեն թարգմանվում։",
          "Քարտեզ, զանգեր և հաղորդագրություններ բջջայինից։",
          "Լուսանկարներ, կարծիքներ և կարևոր հղումներ մեկ տեղում։",
        ],
      },
      {
        id: "qr-access",
        title: "Թվային ամսագիր և QR լեզվային հասանելիություն",
        body: "Ամսագիրը պահպանում է իր իսպաներեն ինքնությունը՝ նախ ծառայելու մեր Latino համայնքին։ QR-ի միջոցով հաճախորդները բացում են թվային փորձառությունը և անհրաժեշտության դեպքում կարող են օգտագործել սարքի կամ բրաուզերի թարգմանչական գործիքներ։",
        bullets: [
          "Սկանավորեք տպագիր գովազդից և անցեք բջջայինում կոնկրետ գործողությունների։",
          "Օգտագործեք բրաուզերի թարգմանություն, Google Lens կամ Google Translate։",
          "Այս կառուցված reader-ը լրացնում է, բայց չի փոխարինում իսպաներեն տեսողական flipbook-ը։",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Իմանալ Leonix Media-ի մասին",
      },
      {
        id: "advertise",
        title: "Ցանկանո՞ւմ եք գովազդել",
        body: "Կապեք ձեր բիզնեսը տեղական ընթերցողների հետ՝ տպագիր ամսագրում տեղադրմամբ, թվային տարբերակում տեսանելիությամբ և երկլեզու ներկայությամբ։ Կապ հաստատեք Media Kit-ի և մեկնարկի տարբերակների համար — այս տեսքում գներ կամ երաշխիքներ չկան։",
        ctaKey: "advertise",
        ctaLabel: "Գովազդել մեզ հետ",
      },
      {
        id: "newsletter",
        title: "Միացեք newsletter-ին",
        body: "Առաջիններից մեկը եղեք՝ ստանալու նոր համարներ, կարևոր հայտարարություններ, տեղական հնարավորություններ և Leonix Media-ի թարմացումներ։",
        ctaKey: "newsletter",
        ctaLabel: "Բաժանորդագրվել newsletter-ին",
      },
      {
        id: "contact",
        title: "Կապ / լրացուցիչ տեղեկության հարցում",
        body: "Մենք պատրաստ ենք օգնել գովազդի, Media Kit-ի և թվային ներկայության հարցերում։ Բիզնես կապի տվյալները մնում են բնօրինակ ձևով։",
        bullets: [
          "Հարցեր տպագիր և թվային ամսագրի գովազդի մասին։",
          "Media Kit և մեկնարկային փաթեթներ — մանրամասները խնդրեք կապի միջոցով։",
          "Այս տեսքում առևտրային տեղեկությունը ավտոմատ չի թարգմանվում։",
        ],
        ctaKey: "contact",
        ctaLabel: "Կապ հաստատել Leonix Media-ի հետ",
      },
    ],
  },

  ru: {
    issueMeta: {
      title: "Leonix Media — Журнал за июнь 2026",
      monthLabel: "Июнь",
    },
    ui: {
      languageEyebrow: "ЯЗЫК ЧТЕНИЯ",
      originalMagazineLabel: "Оригинальный журнал на испанском",
      languageChooserHint: "Выберите язык, чтобы читать объявления и ключевую информацию.",
      readerPreviewBadge: "Предпросмотр переведенного reader",
      readerPreviewIntro:
        "Этот режим кратко показывает объявления, classifieds и контакты на вашем языке. Печатная и цифровая визуальная версия остается на испанском.",
      futureFlipbookNote:
        "Полные визуальные версии на других языках могут появиться отдельными файлами в будущем. Сейчас оригинальные flipbook и PDF остаются на испанском.",
      originalEditionNote:
        "Оригинальная визуальная версия на испанском. Этот reader помогает понять ключевую информацию на вашем языке.",
      originalEditionTitle: "Оригинальная визуальная версия (испанский)",
      viewFlipbookSpanish: "Открыть испанский flipbook",
      downloadPdf: "Скачать оригинальный PDF",
      viewMediaKit: "Открыть Media Kit",
      openFullReader: "Открыть полный reader",
      backToMagazine: "Назад к журналу",
      backToComingSoon: "Назад к Coming Soon",
      readPageTitle: "Читатель — Июнь 2026",
      readPageSubtitle:
        "Этот reader помогает понять ключевую информацию июньского выпуска на выбранном языке. Оригинальный визуальный журнал остается на испанском.",
      issuePageTitle: "Выпуск за июнь 2026",
      issuePageIntro:
        "Запусковый выпуск Leonix Media объединяет местный бизнес, сообщество, культуру и возможности. Выберите, как вам удобнее его изучать.",
      issuePageReaderCta: "Открыть переведенный reader",
      issuePageHubCta: "Перейти в хаб журнала",
      closeFlipbook: "Закрыть",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "ИЗ ПЕЧАТИ · QR",
      printSourceTitle: "Добро пожаловать из печатного журнала",
      printSourceIntro:
        "Вы отсканировали QR Leonix. Этот reader — многоязычный мост: выберите язык, прочитайте краткие блоки и действия, затем при желании откройте оригинальную визуальную версию.",
      printSourceStepScan: "Сканируйте QR с печатных или цифровых материалов Leonix.",
      printSourceStepLanguage:
        "Выберите язык в Leonix, чтобы читать краткие блоки и информацию о local business.",
      printSourceStepHighlights:
        "Используйте краткие блоки и CTA на своем языке — сайт и есть многоязычный мост.",
      printSourceStepOriginal:
        "Чтобы увидеть испанскую визуальную версию, откройте оригинальный цифровой журнал (PDF/flipbook).",
      printSourceMobileNote:
        "Если вы уже на телефоне, не сканируйте собственный экран. Используйте переключатель языка выше и этот reader.",
      printQrCaption: "Официальный QR · Июнь 2026 · leonixmedia.com",
      openLanguageReader: "Открыть reader на вашем языке",
      mediaKitPdfEsLabel: "Media Kit (оригинальный испанский PDF)",
      mediaKitPdfEnLabel: "Media Kit (English PDF)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "О Leonix Media",
        body: "Leonix Media соединяет local business с Latino и мультикультурным сообществом Bay Area через испанскую печатную рекламу, двуязычное цифровое присутствие и инструменты, которые превращают внимание в звонки, визиты и реальные связи.",
      },
      {
        id: "about-magazine",
        title: "О El Águila и журнале",
        body: "Leonix Media — премиальный журнал в экосистеме El Águila: сообщество, культура и бизнес в цифровом и печатном формате. Выпуск за июнь 2026 включает местные истории, рекламные блоки бизнеса, вдохновение для сообщества и мост к marketplace classifieds.",
        bullets: [
          "Премиальный печатный журнал для местного Latino-сообщества.",
          "Цифровой выпуск с flipbook и PDF на испанском (оригинальная визуальная версия).",
          "Связь с classifieds, Negocios Locales и действиями через QR.",
        ],
      },
      {
        id: "featured-ads",
        title: "Превью избранной рекламы",
        body: "Этот выпуск содержит рекламные места для local business. В объявлениях показываются категория, главное сообщение и оригинальные контактные данные рекламодателя — без вымышленных названий и цен в этом reader-режиме.",
        bullets: [
          "Рестораны и local food — меню, локация и контакт рекламодателя.",
          "Профессиональные услуги — сантехника, электрика, уборка и ремонт.",
          "Здоровье, красота и wellness — клиники, стоматологи и услуги сообщества.",
          "Культура, спорт, рецепты и вдохновение сообщества.",
        ],
      },
      {
        id: "classifieds",
        title: "Превью classifieds",
        body: "Leonix — это не только реклама. Локальный marketplace связывает сообщество с реальными возможностями: аренда, работа, частные авто, товары на продажу, события, еда, питомцы и другое.",
        bullets: [
          "Аренда и жилье в Bay Area.",
          "Работа и местные возможности трудоустройства.",
          "Частные авто, товары на продажу и услуги сообщества.",
          "Объявления wanted, питомцы и местная поддержка.",
        ],
        ctaKey: "clasificados",
        ctaLabel: "Смотреть classifieds",
      },
      {
        id: "local-business",
        title: "Превью профиля local business",
        body: "Negocios Locales объединяет телефон, адрес, карту, соцсети, фото и ссылки в одном цифровом профиле. Бизнес- и контактные данные сохраняются в оригинальном виде.",
        bullets: [
          "Телефон, адрес и соцсети бизнеса — коммерческие данные не переводятся автоматически.",
          "Карта, звонки и сообщения с мобильного.",
          "Фото, отзывы и важные ссылки в одном месте.",
        ],
      },
      {
        id: "qr-access",
        title: "Цифровой журнал и языковой доступ по QR",
        body: "Журнал сохраняет испанскую идентичность, чтобы в первую очередь служить нашему Latino-сообществу. Через QR пользователи открывают цифровой опыт и при необходимости используют инструменты перевода устройства или браузера.",
        bullets: [
          "Сканируйте из печатной рекламы и переходите к конкретным действиям на мобильном.",
          "Используйте перевод в браузере, Google Lens или Google Translate.",
          "Этот структурированный reader дополняет, а не заменяет испанский визуальный flipbook.",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Узнать о Leonix Media",
      },
      {
        id: "advertise",
        title: "Хотите разместить рекламу?",
        body: "Свяжите ваш бизнес с местными читателями через размещение в печатном журнале, видимость в цифровом выпуске и двуязычное присутствие. Свяжитесь с нами по Media Kit и вариантам запуска — без цен и гарантий в этом режиме.",
        ctaKey: "advertise",
        ctaLabel: "Рекламироваться у нас",
      },
      {
        id: "newsletter",
        title: "Подписка на newsletter",
        body: "Получайте новые выпуски, важные объявления, локальные возможности и обновления Leonix Media в числе первых.",
        ctaKey: "newsletter",
        ctaLabel: "Подписаться на newsletter",
      },
      {
        id: "contact",
        title: "Контакты / запросить информацию",
        body: "Мы готовы помочь с рекламой, Media Kit и цифровым присутствием. Контактные данные бизнеса остаются в оригинальном формате.",
        bullets: [
          "Вопросы по рекламе в печатном и цифровом журнале.",
          "Media Kit и launch-пакеты — запросите детали через контакт.",
          "Коммерческая информация в этом режиме не переводится автоматически.",
        ],
        ctaKey: "contact",
        ctaLabel: "Связаться с Leonix Media",
      },
    ],
  },

  pa: {
    issueMeta: {
      title: "Leonix Media — ਜੂਨ 2026 ਮੈਗਜ਼ੀਨ",
      monthLabel: "ਜੂਨ",
    },
    ui: {
      languageEyebrow: "ਪੜ੍ਹਨ ਦੀ ਭਾਸ਼ਾ",
      originalMagazineLabel: "ਅਸਲ ਸਪੇਨੀ ਮੈਗਜ਼ੀਨ",
      languageChooserHint: "ਇਸ਼ਤਿਹਾਰਾਂ ਅਤੇ ਮੁੱਖ ਜਾਣਕਾਰੀ ਨੂੰ ਪੜ੍ਹਨ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ।",
      readerPreviewBadge: "ਅਨੁਵਾਦਿਤ reader ਝਲਕ",
      readerPreviewIntro:
        "ਇਸ ਦ੍ਰਿਸ਼ ਵਿੱਚ ਇਸ਼ਤਿਹਾਰ, classifieds ਅਤੇ ਸੰਪਰਕ ਜਾਣਕਾਰੀ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸੰਖੇਪ ਕੀਤੀ ਜਾਂਦੀ ਹੈ। ਪ੍ਰਿੰਟ ਅਤੇ ਡਿਜ਼ਿਟਲ ਵਿਜ਼ੂਅਲ ਸੰਸਕਰਣ ਸਪੇਨੀ ਵਿੱਚ ਹੀ ਰਹਿੰਦਾ ਹੈ।",
      futureFlipbookNote:
        "ਭਵਿੱਖ ਵਿੱਚ ਹੋਰ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਪੂਰੇ ਵਿਜ਼ੂਅਲ ਸੰਸਕਰਣ ਵੱਖਰੀਆਂ ਫ਼ਾਈਲਾਂ ਵਜੋਂ ਉਪਲਬਧ ਹੋ ਸਕਦੇ ਹਨ। ਅੱਜ ਅਸਲ flipbook ਅਤੇ PDF ਸਪੇਨੀ ਵਿੱਚ ਹੀ ਹਨ।",
      originalEditionNote:
        "ਅਸਲ ਵਿਜ਼ੂਅਲ ਸੰਸਕਰਣ ਸਪੇਨੀ ਵਿੱਚ ਹੈ। ਇਹ reader ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ ਮੁੱਖ ਜਾਣਕਾਰੀ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।",
      originalEditionTitle: "ਅਸਲ ਵਿਜ਼ੂਅਲ ਸੰਸਕਰਣ (ਸਪੇਨੀ)",
      viewFlipbookSpanish: "ਸਪੇਨੀ flipbook ਵੇਖੋ",
      downloadPdf: "ਅਸਲ PDF ਡਾਊਨਲੋਡ ਕਰੋ",
      viewMediaKit: "Media Kit ਵੇਖੋ",
      openFullReader: "ਪੂਰਾ reader ਖੋਲ੍ਹੋ",
      backToMagazine: "ਮੈਗਜ਼ੀਨ ਵੱਲ ਵਾਪਸ",
      backToComingSoon: "Coming Soon ਵੱਲ ਵਾਪਸ",
      readPageTitle: "ਪਠਕ — ਜੂਨ 2026",
      readPageSubtitle:
        "ਇਹ reader ਜੂਨ ਅੰਕ ਦੀ ਮੁੱਖ ਜਾਣਕਾਰੀ ਤੁਹਾਡੀ ਚੁਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸਮਝਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ। ਅਸਲ ਵਿਜ਼ੂਅਲ ਮੈਗਜ਼ੀਨ ਸਪੇਨੀ ਵਿੱਚ ਹੀ ਰਹਿੰਦਾ ਹੈ।",
      issuePageTitle: "ਜੂਨ 2026 ਸੰਸਕਰਣ",
      issuePageIntro:
        "Leonix Media ਦਾ ਲਾਂਚ ਸੰਸਕਰਣ ਸਥਾਨਕ ਕਾਰੋਬਾਰਾਂ, ਕਮਿਊਨਿਟੀ, ਸਭਿਆਚਾਰ ਅਤੇ ਮੌਕਿਆਂ ਨੂੰ ਜੋੜਦਾ ਹੈ। ਇਸਨੂੰ ਖੰਗਾਲਣ ਦਾ ਤਰੀਕਾ ਚੁਣੋ।",
      issuePageReaderCta: "ਅਨੁਵਾਦਿਤ reader ਖੋਲ੍ਹੋ",
      issuePageHubCta: "ਮੈਗਜ਼ੀਨ ਹੱਬ 'ਤੇ ਜਾਓ",
      closeFlipbook: "ਬੰਦ ਕਰੋ",
      langLabels: { es: "Español", en: "English", vi: "Tiếng Việt" },
      printSourceBadge: "ਪ੍ਰਿੰਟ ਤੋਂ · QR",
      printSourceTitle: "ਛਪੀ ਮੈਗਜ਼ੀਨ ਵੱਲੋਂ ਸੁਆਗਤ",
      printSourceIntro:
        "ਤੁਸੀਂ Leonix QR ਸਕੈਨ ਕੀਤਾ ਹੈ। ਇਹ reader ਬਹੁਭਾਸ਼ੀ ਪੁਲ ਹੈ: ਭਾਸ਼ਾ ਚੁਣੋ, ਸੰਖੇਪ ਅਤੇ ਕਾਰਵਾਈਆਂ ਪੜ੍ਹੋ, ਫਿਰ ਜਦੋਂ ਚਾਹੋ ਅਸਲ ਵਿਜ਼ੂਅਲ ਸੰਸਕਰਣ ਖੋਲ੍ਹੋ।",
      printSourceStepScan: "Leonix ਦੇ ਪ੍ਰਿੰਟ ਜਾਂ ਡਿਜ਼ਿਟਲ ਮਟਰੀਅਲ ਤੋਂ QR ਸਕੈਨ ਕਰੋ।",
      printSourceStepLanguage:
        "Leonix 'ਤੇ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ ਤਾਂ ਜੋ ਤੁਸੀਂ ਸੰਖੇਪ ਅਤੇ local business ਜਾਣਕਾਰੀ ਪੜ੍ਹ ਸਕੋ।",
      printSourceStepHighlights:
        "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਸੰਖੇਪ ਅਤੇ CTA ਵਰਤੋ — ਵੈਬਸਾਈਟ ਹੀ ਬਹੁਭਾਸ਼ੀ ਪੁਲ ਹੈ।",
      printSourceStepOriginal:
        "ਜਦੋਂ ਤੁਸੀਂ ਸਪੇਨੀ ਵਿਜ਼ੂਅਲ ਸੰਸਕਰਣ ਵੇਖਣਾ ਚਾਹੋ, ਅਸਲ ਡਿਜ਼ਿਟਲ ਮੈਗਜ਼ੀਨ (PDF/flipbook) ਖੋਲ੍ਹੋ।",
      printSourceMobileNote:
        "ਜੇ ਤੁਸੀਂ ਪਹਿਲਾਂ ਹੀ ਫ਼ੋਨ 'ਤੇ ਹੋ, ਆਪਣੀ ਹੀ ਸਕ੍ਰੀਨ ਸਕੈਨ ਨਾ ਕਰੋ। ਉੱਪਰ ਦਿੱਤਾ ਭਾਸ਼ਾ ਚੁਣਨ ਵਾਲਾ ਅਤੇ ਇਹ reader ਵਰਤੋ।",
      printQrCaption: "ਅਧਿਕਾਰਤ QR · ਜੂਨ 2026 · leonixmedia.com",
      openLanguageReader: "ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ reader ਖੋਲ੍ਹੋ",
      mediaKitPdfEsLabel: "Media Kit (ਅਸਲ ਸਪੇਨੀ PDF)",
      mediaKitPdfEnLabel: "Media Kit (English PDF)",
    },
    sections: [
      {
        id: "about-leonix",
        title: "Leonix Media ਬਾਰੇ",
        body: "Leonix Media ਸਪੇਨੀ ਪ੍ਰਿੰਟ ਇਸ਼ਤਿਹਾਰਬਾਜ਼ੀ, ਦੋਭਾਸ਼ੀ ਡਿਜ਼ਿਟਲ ਮੌਜੂਦਗੀ ਅਤੇ ਅਜੇਹੇ ਸਾਧਨਾਂ ਰਾਹੀਂ ਜੋ ਧਿਆਨ ਨੂੰ ਕਾਲਾਂ, ਮੁਲਾਕਾਤਾਂ ਅਤੇ ਅਸਲੀ ਜੋੜਾਂ ਵਿੱਚ ਬਦਲਦੇ ਹਨ, local business ਨੂੰ Bay Area ਦੀ Latino ਅਤੇ ਬਹੁ-ਸੱਭਿਆਚਾਰਕ ਕਮਿਊਨਿਟੀ ਨਾਲ ਜੋੜਦਾ ਹੈ।",
      },
      {
        id: "about-magazine",
        title: "El Águila ਅਤੇ ਮੈਗਜ਼ੀਨ ਬਾਰੇ",
        body: "Leonix Media, El Águila ਇਕੋਸਿਸਟਮ ਦਾ premium ਮੈਗਜ਼ੀਨ ਹੈ: ਡਿਜ਼ਿਟਲ ਅਤੇ ਪ੍ਰਿੰਟ ਸੰਸਕਰਣ ਵਿੱਚ ਕਮਿਊਨਿਟੀ, ਸਭਿਆਚਾਰ ਅਤੇ ਕਾਰੋਬਾਰ। ਜੂਨ 2026 ਅੰਕ ਵਿੱਚ ਸਥਾਨਕ ਕਹਾਣੀਆਂ, ਬਿਜ਼ਨਸ ਇਸ਼ਤਿਹਾਰ, ਕਮਿਊਨਿਟੀ ਪ੍ਰੇਰਣਾ ਅਤੇ classifieds ਮਾਰਕੀਟਪਲੇਸ ਤੱਕ ਪੁਲ ਸ਼ਾਮਲ ਹਨ।",
        bullets: [
          "ਸਥਾਨਕ Latino ਕਮਿਊਨਿਟੀ ਲਈ ਡਿਜ਼ਾਈਨ ਕੀਤਾ premium ਪ੍ਰਿੰਟ ਮੈਗਜ਼ੀਨ।",
          "ਸਪੇਨੀ ਡਿਜ਼ਿਟਲ ਸੰਸਕਰਣ flipbook ਅਤੇ PDF ਨਾਲ (ਅਸਲ ਵਿਜ਼ੂਅਲ)।",
          "classifieds, Negocios Locales ਅਤੇ QR-ਚਲਿਤ ਕਾਰਵਾਈਆਂ ਨਾਲ ਕਨੈਕਸ਼ਨ।",
        ],
      },
      {
        id: "featured-ads",
        title: "featured ads ਝਲਕ",
        body: "ਇਸ ਸੰਸਕਰਣ ਵਿੱਚ local business ਲਈ ਇਸ਼ਤਿਹਾਰ ਸਥਾਨ ਹੈ। ਇਸ਼ਤਿਹਾਰ ਸ਼੍ਰੇਣੀ, ਮੁੱਖ ਸੁਨੇਹਾ ਅਤੇ ਇਸ਼ਤਿਹਾਰਦਾਤਾ ਦੀ ਅਸਲ ਸੰਪਰਕ ਜਾਣਕਾਰੀ ਦਿਖਾਉਂਦੇ ਹਨ — ਇਸ reader ਦ੍ਰਿਸ਼ ਵਿੱਚ ਨਾ ਕਲਪਿਤ ਨਾਂ ਹਨ ਨਾ ਕੀਮਤਾਂ।",
        bullets: [
          "ਰੈਸਟੋਰੈਂਟ ਅਤੇ local food — ਮੈਨੂ, ਥਾਂ ਅਤੇ ਇਸ਼ਤਿਹਾਰਦਾਤਾ ਸੰਪਰਕ।",
          "ਪੇਸ਼ਾਵਰ ਸੇਵਾਵਾਂ — ਪਲੰਬਿੰਗ, ਇਲੈਕਟ੍ਰਿਕਲ, ਕਲੀਨਿੰਗ ਅਤੇ ਮੁਰੰਮਤ।",
          "ਸਿਹਤ, ਸੁੰਦਰਤਾ ਅਤੇ wellness — ਕਲਿਨਿਕ, ਡੈਂਟਿਸਟ ਅਤੇ ਕਮਿਊਨਿਟੀ ਸੇਵਾਵਾਂ।",
          "ਸਭਿਆਚਾਰ, ਖੇਡਾਂ, recipes ਅਤੇ ਕਮਿਊਨਿਟੀ ਪ੍ਰੇਰਣਾ।",
        ],
      },
      {
        id: "classifieds",
        title: "classifieds ਝਲਕ",
        body: "Leonix ਸਿਰਫ਼ ਇਸ਼ਤਿਹਾਰ ਨਹੀਂ ਹੈ। local marketplace ਕਮਿਊਨਿਟੀ ਨੂੰ ਅਸਲ ਮੌਕਿਆਂ ਨਾਲ ਜੋੜਦਾ ਹੈ: ਕਿਰਾਏ, ਨੌਕਰੀਆਂ, private autos, ਵਿਕਰੀ ਲਈ ਸਮਾਨ, ਇਵੈਂਟ, ਖਾਣਾ, pets ਅਤੇ ਹੋਰ ਬਹੁਤ ਕੁਝ।",
        bullets: [
          "Bay Area ਵਿੱਚ ਕਿਰਾਏ ਅਤੇ ਰਹਾਇਸ਼।",
          "ਨੌਕਰੀਆਂ ਅਤੇ ਸਥਾਨਕ ਰੋਜ਼ਗਾਰ ਮੌਕੇ।",
          "private autos, ਵਿਕਰੀ ਲਈ ਸਮਾਨ ਅਤੇ ਕਮਿਊਨਿਟੀ ਸੇਵਾਵਾਂ।",
          "Wanted ਪੋਸਟਾਂ, pets ਅਤੇ ਸਥਾਨਕ ਸਹਾਇਤਾ।",
        ],
        ctaKey: "clasificados",
        ctaLabel: "classifieds ਵੇਖੋ",
      },
      {
        id: "local-business",
        title: "local business ਪ੍ਰੋਫ਼ਾਈਲ ਝਲਕ",
        body: "Negocios Locales ਫ਼ੋਨ, ਪਤਾ, ਨਕਸ਼ਾ, ਸੋਸ਼ਲ ਮੀਡੀਆ, ਫੋਟੋਆਂ ਅਤੇ ਲਿੰਕ ਇੱਕ ਹੀ ਡਿਜ਼ਿਟਲ ਮੌਜੂਦਗੀ ਵਿੱਚ ਸੰਗਠਿਤ ਕਰਦਾ ਹੈ। business ਅਤੇ ਸੰਪਰਕ ਡਾਟਾ ਅਸਲ ਰੂਪ ਵਿੱਚ ਹੀ ਰਹਿੰਦਾ ਹੈ।",
        bullets: [
          "business ਫ਼ੋਨ, ਪਤਾ ਅਤੇ ਸੋਸ਼ਲ — ਵਪਾਰਕ ਡਾਟਾ ਆਟੋ-ਟ੍ਰਾਂਸਲੇਟ ਨਹੀਂ ਹੁੰਦਾ।",
          "ਮੋਬਾਈਲ ਤੋਂ ਨਕਸ਼ਾ, ਕਾਲ ਅਤੇ ਸੁਨੇਹੇ।",
          "ਫੋਟੋਆਂ, ਰਿਵਿਊ ਅਤੇ ਜ਼ਰੂਰੀ ਲਿੰਕ ਇੱਕ ਥਾਂ।",
        ],
      },
      {
        id: "qr-access",
        title: "ਡਿਜ਼ਿਟਲ ਮੈਗਜ਼ੀਨ ਅਤੇ QR ਭਾਸ਼ਾਈ ਪਹੁੰਚ",
        body: "ਮੈਗਜ਼ੀਨ ਆਪਣੀ ਸਪੇਨੀ ਪਹਿਚਾਣ ਬਣਾਈ ਰੱਖਦੀ ਹੈ ਤਾਂ ਜੋ ਪਹਿਲਾਂ ਸਾਡੀ Latino ਕਮਿਊਨਿਟੀ ਦੀ ਸੇਵਾ ਕਰ ਸਕੇ। QR ਨਾਲ ਗਾਹਕ ਡਿਜ਼ਿਟਲ ਅਨੁਭਵ ਖੋਲ੍ਹਦੇ ਹਨ ਅਤੇ ਲੋੜ ਪੈਣ 'ਤੇ ਡਿਵਾਈਸ ਜਾਂ ਬਰਾਊਜ਼ਰ ਅਨੁਵਾਦ ਸਾਧਨ ਵਰਤ ਸਕਦੇ ਹਨ।",
        bullets: [
          "ਪ੍ਰਿੰਟ ਇਸ਼ਤਿਹਾਰ ਤੋਂ ਸਕੈਨ ਕਰਕੇ ਮੋਬਾਈਲ 'ਤੇ ਸਿੱਧੀਆਂ ਕਾਰਵਾਈਆਂ ਕਰੋ।",
          "ਬਰਾਊਜ਼ਰ ਅਨੁਵਾਦ, Google Lens ਜਾਂ Google Translate ਵਰਤੋ।",
          "ਇਹ structured reader ਸਪੇਨੀ ਵਿਜ਼ੂਅਲ flipbook ਨੂੰ ਪੂਰਾ ਕਰਦਾ ਹੈ — ਬਦਲਦਾ ਨਹੀਂ।",
        ],
        ctaKey: "comingSoon",
        ctaLabel: "Leonix Media ਬਾਰੇ ਜਾਣੋ",
      },
      {
        id: "advertise",
        title: "ਇਸ਼ਤਿਹਾਰ ਦੇਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
        body: "ਪ੍ਰਿੰਟ ਮੈਗਜ਼ੀਨ ਪਲੇਸਮੈਂਟ, ਡਿਜ਼ਿਟਲ ਸੰਸਕਰਣ ਵਿੱਚ ਦਿਖਾਈ ਅਤੇ ਦੋਭਾਸ਼ੀ ਮੌਜੂਦਗੀ ਰਾਹੀਂ ਆਪਣੇ business ਨੂੰ ਸਥਾਨਕ ਪਾਠਕਾਂ ਨਾਲ ਜੋੜੋ। Media Kit ਅਤੇ ਲਾਂਚ ਵਿਕਲਪਾਂ ਲਈ ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ — ਇਸ ਦ੍ਰਿਸ਼ ਵਿੱਚ ਕੀਮਤ ਜਾਂ ਗਾਰੰਟੀ ਨਹੀਂ ਦਿੱਤੀ ਜਾਂਦੀ।",
        ctaKey: "advertise",
        ctaLabel: "ਸਾਡੇ ਨਾਲ ਇਸ਼ਤਿਹਾਰ ਦਿਓ",
      },
      {
        id: "newsletter",
        title: "newsletter ਨਾਲ ਜੁੜੋ",
        body: "ਨਵੇਂ ਅੰਕ, ਮਹੱਤਵਪੂਰਣ ਘੋਸ਼ਣਾਵਾਂ, ਸਥਾਨਕ ਮੌਕੇ ਅਤੇ Leonix Media ਅੱਪਡੇਟ ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਪ੍ਰਾਪਤ ਕਰੋ।",
        ctaKey: "newsletter",
        ctaLabel: "newsletter ਲਈ subscribe ਕਰੋ",
      },
      {
        id: "contact",
        title: "ਸੰਪਰਕ / ਹੋਰ ਜਾਣਕਾਰੀ ਦੀ ਬੇਨਤੀ",
        body: "ਅਸੀਂ ਇਸ਼ਤਿਹਾਰਬਾਜ਼ੀ, Media Kit ਅਤੇ ਡਿਜ਼ਿਟਲ ਮੌਜੂਦਗੀ ਵਿੱਚ ਮਦਦ ਲਈ ਤਿਆਰ ਹਾਂ। business ਸੰਪਰਕ ਵੇਰਵੇ ਅਸਲ ਰੂਪ ਵਿੱਚ ਹੀ ਰਹਿੰਦੇ ਹਨ।",
        bullets: [
          "ਪ੍ਰਿੰਟ ਅਤੇ ਡਿਜ਼ਿਟਲ ਮੈਗਜ਼ੀਨ ਇਸ਼ਤਿਹਾਰਬਾਜ਼ੀ ਬਾਰੇ ਸਵਾਲ।",
          "Media Kit ਅਤੇ launch packages — ਸੰਪਰਕ ਰਾਹੀਂ ਵੇਰਵੇ ਮੰਗੋ।",
          "ਇਸ ਦ੍ਰਿਸ਼ ਵਿੱਚ ਵਪਾਰਕ ਜਾਣਕਾਰੀ ਆਟੋ-ਟ੍ਰਾਂਸਲੇਟ ਨਹੀਂ ਹੁੰਦੀ।",
        ],
        ctaKey: "contact",
        ctaLabel: "Leonix Media ਨਾਲ ਸੰਪਰਕ ਕਰੋ",
      },
    ],
  },
};

