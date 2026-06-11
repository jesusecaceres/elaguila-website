import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getPtCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "Início", href: "#inicio", active: true },
      { label: "O que você recebe", href: "#que-obtienes" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "Acesso QR", href: "#qr" },
      { label: "Contato", href: "#contacto" },
    ],
    launchCta: "Participe do lançamento",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Início",
    navAria: "Navegação principal",
    langAria: "Idioma",
    hero: {
      badge: "EM BREVE",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "Publicidade impressa em " },
            { text: "espanhol", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Exposição digital " },
            { text: "bilíngue", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Acesso " },
            { text: "multilíngue", accent: "burgundy" },
            { text: " por " },
            { text: "QR", accent: "gold" },
            { text: "." },
          ],
        },
      ],
      paragraph:
        "Conecte seu negócio à comunidade latina e multicultural da Bay Area por meio de uma revista premium, presença digital bilíngue e ferramentas que transformam atenção em ação.",
      ctas: [
        { label: "Anuncie conosco", variant: "primary" },
        { label: "Ver Media Kit", variant: "secondary" },
        { label: "Participe do lançamento", variant: "green" },
      ],
      trustChips: ["Feito para nossa comunidade", "Confiança local", "Ação digital"],
      valueAria: "Proposta de valor",
      trustAria: "Confiança",
      mediaVisual: {
        label: "Revista premium + presença digital",
        qrOverlay: "Escaneie. Escolha o idioma. Conecte.",
        magazineAlt: "Prévia decorativa da revista Leonix Media",
      },
      magazineCta: "Ver edição digital",
    },
    marketplace: {
      eyebrow: "CLASSIFICADOS + MARKETPLACE LOCAL",
      headline: "A comunidade vem pelo que precisa. Os negócios ganham visibilidade.",
      intro:
        "Leonix não é só publicidade. Também estamos construindo um marketplace local onde a comunidade pode buscar, publicar e compartilhar oportunidades reais: aluguéis, empregos, carros particulares, itens à venda, eventos, comida, pets e mais.",
      bridge:
        "Mais motivos para visitar Leonix significa mais oportunidades para os negócios serem vistos.",
      featuredCard: {
        badge: "New category",
        title: "Local Deals",
        body:
          "Weekly flyers, coupons, and specials from local businesses in a clear experience designed to help the community discover real savings and help businesses gain more visibility.",
        supportingLine:
          "More reasons to visit Leonix means more opportunities for local businesses to be seen.",
      },
      cardsAria: "Categorias do marketplace local",
      cards: [
        {
          title: "Artigos e coisas grátis",
          body: "Itens locais, artigos para casa, ferramentas, roupas, achados grátis e anúncios do dia a dia que ajudam a comunidade a comprar, vender, compartilhar e descobrir oportunidades.",
        },
        {
          title: "Aluguéis",
          body: "Quartos, apartamentos, espaços e oportunidades de moradia com fotos, descrição, localização, preço e contato.",
        },
        {
          title: "Empregos",
          body: "Negócios que estão contratando podem conectar com pessoas da comunidade que buscam trabalho e novas oportunidades.",
        },
        {
          title: "Carros particulares",
          body: "Anúncios de carros com fotos, descrição, preço e contato para compradores locais.",
        },
        {
          title: "Comida + eventos",
          body: "Pop-ups, comida local, atividades, eventos comunitários e momentos que fazem as pessoas voltarem.",
        },
        {
          title: "Procurando + pets",
          body: "A comunidade também pode buscar, compartilhar necessidades, conectar sobre pets, itens perdidos, adoções ou apoio local.",
        },
      ],
      closing:
        "Classificados trazem tráfego. Negocios Locales transforma essa atenção em ligações, visitas e clientes.",
      exploreCta: { label: "Explorar Classificados" },
    },
    whatYouGet: {
      eyebrow: "O QUE VOCÊ RECEBE",
      headline: "Mais que um anúncio: uma presença completa para seu negócio.",
      intro:
        "Leonix combina uma revista impressa mensal, um perfil central em Negocios Locales e ações por QR para ajudar mais clientes a encontrar, entender e contatar seu negócio.",
      expandMore: "Ver mais",
      expandLess: "Ver menos",
      cards: [
        {
          title: "Revista impressa mensal",
          body: "Seu negócio pode aparecer em uma revista mensal pensada para conectar com a comunidade latina local.",
          detail:
            "Leonix publica uma revista impressa mensal em espanhol para visibilidade local de confiança. A colocação na impressão depende do seu pacote publicitário — nem todo negócio aparece em cada edição sem contrato.",
          accent: "burgundy",
        },
        {
          title: "Presença digital bilíngue",
          body: "Seu negócio também pode aparecer em páginas Leonix com formulários e ações nativas no idioma que seus clientes escolherem.",
          detail:
            "As páginas digitais complementam seu anúncio impresso e seu perfil em Negocios Locales com informações compartilháveis às quais os clientes podem voltar pelo celular.",
          accent: "gold",
        },
        {
          title: "QR + ações reais",
          body: "Transforme a atenção impressa em ligações, mensagens, mapas, visitas ao site, redes sociais, ofertas e caminhos de contato.",
          detail:
            "O QR conecta cada edição mensal à ação digital. Os leitores podem escanear, usar ferramentas de tradução do celular ou as páginas Leonix no seu idioma, e chegar ao seu negócio sem pular de plataforma em plataforma.",
          accent: "qr",
        },
        {
          title: "Negocios Locales + presença digital",
          body: "Criamos uma página central para seu negócio onde os clientes podem encontrar suas redes, site, telefone, localização, fotos, avaliações, ofertas e formas de contato em um só lugar.",
          detail:
            "Negocios Locales é mais que um anúncio — reúne sua presença online para que os clientes descubram e explorem seu negócio sem buscar em plataformas separadas.",
          accent: "green",
        },
        {
          title: "Oportunidade de lançamento fundador",
          body: "Faça parte dos primeiros negócios a aparecer com Leonix Media durante a fase de lançamento.",
          detail:
            "Durante o lançamento, os primeiros negócios ajudam a construir a rede inicial da Leonix Media. É uma oportunidade de visibilidade antecipada — não um formato publicitário separado.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "COMO FUNCIONA",
      headline: "Um processo claro para lançar sua presença com Leonix.",
      intro:
        "Guiamos você desde as informações iniciais até uma presença pronta para imprimir, compartilhar e conectar.",
      stepsAria: "Etapas do processo",
      steps: [
        {
          title: "Escolha sua presença",
          body: "Selecione se deseja aparecer na revista impressa mensal, criar sua presença digital em Negocios Locales, ativar ações por QR ou combinar várias opções de lançamento.",
        },
        {
          title: "Envie suas informações",
          body: "Compartilhe logo, fotos, telefone, endereço, redes, links, oferta e os principais detalhes do seu negócio.",
        },
        {
          title: "Preparamos sua presença",
          body: "Organizamos seu anúncio, suas informações digitais e os elementos que ajudam o cliente a entender e contatar seu negócio.",
        },
        {
          title: "Lance e conecte",
          body: "Seu negócio fica pronto para aparecer diante da comunidade e transformar interesse em ligações, mensagens, visitas e conexões.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "ACESSO QR",
      headline: "Do anúncio impresso ao celular do cliente.",
      intro:
        "Cada edição mensal pode conectar a revista física a ações digitais: escanear, traduzir, abrir mapa, ligar, visitar redes, ver ofertas e contatar o negócio.",
      callout: "Escaneie. Traduza. Leia. Conecte.",
      explanation:
        "Quando a revista impressa é distribuída, os leitores podem escanear códigos QR nos anúncios. Para ler a revista visual, podem usar a câmera do celular, Google Lens, Google Translate ou Apple Live Text em páginas impressas, telas de desktop ou capturas. Para navegar o site Leonix, podem usar as páginas traduzidas da Leonix ou o modo site do Google Translate como apoio. Os formulários nativos de contato e publicidade da Leonix continuam sendo o caminho oficial de contato.",
      mobileNote:
        "No celular, não escaneie sua própria tela. Use primeiro as páginas e resumos da Leonix no seu idioma. Google Lens e Apple Live Text são opcionais para impresso ou capturas.",
      openReaderLabel: "Ver passos de tradução QR",
      heroStripSummary:
        "Cada edição impressa mensal pode conectar leitores a ligações, mapas, links, redes e formulários nativos da Leonix.",
      detailNote: "Guia detalhado de tradução QR",
      benefitsAria: "Benefícios do acesso QR",
      benefits: [
        {
          title: "Do impresso ao celular",
          body: "O QR transforma a atenção da revista em ligações, mapas, visitas ao site, redes, ofertas e formulários nativos de contato.",
        },
        {
          title: "Câmera e tradução web",
          body: "Google Lens, Google Translate e Apple Live Text ajudam a ler páginas visuais. O modo site do Google Translate ajuda a navegar a Leonix — os formulários nativos continuam oficiais.",
        },
        {
          title: "Revista visual original em espanhol",
          body: "A edição visual PDF/FlipHTML5 permanece em espanhol. Leonix não promete uma revista visual totalmente traduzida.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "O que você encontrará no Media Kit",
      intro:
        "O Media Kit reúne a explicação completa de como a Leonix Media combina revista impressa, presença digital, QR, ações reais e pacotes publicitários para ajudar seu negócio a parecer mais forte e ser mais fácil de contatar.",
      pdfHonestyLine:
        "O PDF para download pode ser a edição original em espanhol enquanto preparamos versões traduzidas. O site explica as opções no idioma que você selecionar.",
      cardsAria: "Conteúdo do Media Kit",
      cards: [
        {
          title: "Por que anunciar com Leonix",
          body: "Veja como a Leonix ajuda a criar alcance, confiança e ação para negócios locais que querem conectar com a comunidade latina e multicultural.",
        },
        {
          title: "QR + botões de ação",
          body: "Veja como um anúncio impresso pode levar o cliente a ligar, abrir o mapa, enviar mensagem, visitar seu site, ver redes sociais, avaliações e mais.",
        },
        {
          title: "Negocios Locales + presença digital",
          body: "Entenda como seu negócio pode ter uma presença organizada com telefone, endereço, mapa, fotos, avaliações, redes, site e botões de contato.",
        },
        {
          title: "Pacotes e próximos passos",
          body: "Revise opções de publicidade, níveis de visibilidade e o processo para começar com Leonix Media.",
        },
      ],
      ctaHeading: "Pronto para ver os detalhes?",
      viewCta: { label: "Ver Media Kit" },
      downloadCta: { label: "Baixar Media Kit" },
      dualPdfEsLabel: "Media Kit (PDF original em espanhol)",
      dualPdfEnLabel: "Media Kit (PDF em inglês)",
      requestInfoCta: { label: "Solicitar informações publicitárias" },
      supportingLine:
        "Abra o Media Kit para ver formatos, benefícios, pacotes e próximos passos.",
    },
    digitalMagazine: {
      eyebrow: "REVISTA DIGITAL",
      headline: "Edição visual original + apoio multilíngue",
      intro:
        "Você pode abrir a revista visual original em espanhol e ver suas páginas como foram projetadas. Leonix também oferece resumos, destaques e ações rápidas no idioma selecionado quando disponíveis.",
      visualNote:
        "As páginas visuais da revista (PDF/FlipHTML5) são a edição original em espanhol — não uma tradução automática de toda a arte.",
      highlightsNote:
        "Use as páginas Leonix para contexto e CTAs no seu idioma. Google Lens ou capturas podem ajudar a ler páginas visuais. Um futuro companheiro HTML melhorará o alcance multilíngue sem substituir a edição visual original.",
      mobileNote:
        "No celular, escolha seu idioma na Leonix e use os resumos. Ferramentas de câmera do celular podem ajudar com páginas impressas ou na tela — não escaneie sua própria tela para traduzir.",
      readHighlightsCta: { label: "Ler destaques no seu idioma" },
      openOriginalCta: { label: "Abrir revista digital original" },
      learnQrCta: { label: "Como funciona o acesso QR" },
    },
    finalCta: {
      eyebrow: "PRONTO PARA LANÇAR",
      headline: "Reserve seu espaço antes do lançamento.",
      body: "Leonix Media está preparando seu lançamento para conectar negócios locais com a comunidade latina e multicultural da Bay Area. Se você quer aparecer desde o início, este é o momento de levantar a mão.",
      ctas: [
        { label: "Anuncie conosco", variant: "primary" },
        { label: "Ver Media Kit", variant: "secondary", external: true },
        { label: "Participe do lançamento", variant: "green" },
      ],
      mediaKitDownload: { label: "Baixar Media Kit" },
    },
    contact: {
      title: "Contato",
      body: "Tem perguntas sobre publicidade, o Media Kit ou a fase de lançamento? Fale conosco e ajudaremos você a escolher o melhor caminho para seu negócio.",
      emailLabel: "E-mail",
      email: "info@leonixmedia.com",
      phoneLabel: "Telefone",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Endereço",
      address: "871 Coleman Avenue, Suite 201, San Jose, CA 95110",
      areaLabel: "Área",
      area: "San José • Silicon Valley • Comunidade Latina",
    },
    newsletter: {
      title: "Faça parte do lançamento",
      body: "Receba notícias, oportunidades e atualizações da Leonix Media.",
      placeholder: "Seu e-mail",
      button: "Avise-me",
      formAria: "Cadastro na newsletter",
      emailLabel: "E-mail",
      consent: "Concordo em receber atualizações de lançamento da Leonix Media.",
      consentError: "Confirme o consentimento para receber atualizações.",
    },
    footer: "© 2026 Leonix Media. Feito para nossa comunidade.",
  });
}
