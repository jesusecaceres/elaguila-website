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
      cardsAria: "Categorias do marketplace local",
      cards: [
        {
          title: "Itens grátis / à venda",
          body: "Itens à venda, artigos para casa, ferramentas, roupas e mais. Anúncios pensados para atrair tráfego local e compartilhar oportunidades entre vizinhos.",
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
        "Leonix combina revista impressa, presença digital e ações por QR para ajudar mais clientes a encontrar, entender e contatar seu negócio.",
      expandMore: "Ver mais",
      expandLess: "Ver menos",
      cards: [
        {
          title: "Revista impressa premium",
          body: "Seu negócio aparece em uma publicação pensada para conectar com a comunidade latina local.",
          detail:
            "Seu anúncio aparece dentro de uma revista feita para parecer local, confiável e profissional. O objetivo não é só ficar bonito; é colocar seu negócio diante de uma comunidade que quer apoiar negócios locais.",
          accent: "burgundy",
        },
        {
          title: "Presença digital bilíngue",
          body: "Seu anúncio também pode viver em uma experiência digital clara, profissional e fácil de compartilhar.",
          detail:
            "Sua presença digital ajuda o anúncio a ir além de uma única página. Os clientes podem encontrar suas informações, compartilhá-las e voltar a elas pelo celular.",
          accent: "gold",
        },
        {
          title: "QR + ações reais",
          body: "Transforme atenção em ligações, mensagens, mapas, links, ofertas e mais informações.",
          detail:
            "O QR ajuda a levar as pessoas da revista a uma ação concreta: ligar, abrir um mapa, enviar mensagem, visitar um site, ver redes sociais ou pedir mais informações.",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "Uma presença organizada para mostrar telefone, localização, redes, fotos, avaliações e links importantes.",
          detail:
            "Negocios Locales organiza suas informações em um só lugar para que o cliente não precise buscar em plataformas separadas. Telefone, endereço, mapa, redes, fotos e links podem ficar juntos.",
          accent: "green",
        },
        {
          title: "Oportunidade de lançamento fundador",
          body: "Faça parte dos primeiros negócios a aparecer com Leonix Media durante a fase de lançamento.",
          detail:
            "Durante o lançamento, os primeiros negócios ajudam a construir a rede inicial da Leonix Media. Isso cria oportunidade de visibilidade antecipada enquanto a comunidade começa a conhecer a plataforma.",
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
          title: "Escolha seu caminho",
          body: "Selecione o tipo de presença que deseja: anúncio impresso, presença digital, QR, Media Kit ou pacote de lançamento.",
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
        "O QR conecta a revista impressa à experiência digital da Leonix — sua ponte multilíngue.",
      callout: "Escaneie. Traduza. Leia. Conecte.",
      explanation:
        "Escaneie o QR em materiais impressos ou digitais. Na Leonix você escolhe seu idioma, lê resumos e informações de negócios locais e toma ação rápida. O site é a ponte multilíngue; a revista visual mantém sua edição original.",
      mobileNote:
        "No celular, não tente escanear a tela do seu próprio telefone. Use o seletor de idioma da Leonix e os resumos no seu idioma. Google Lens ou Apple Translate são opcionais apenas para materiais impressos.",
      openReaderLabel: "Ver passos de tradução QR",
      heroStripSummary:
        "Use o guia QR para traduzir a revista visual e volte à Leonix para links e ações.",
      detailNote: "Guia detalhado de tradução QR",
      benefitsAria: "Benefícios do acesso QR",
      benefits: [
        {
          title: "Escolha seu idioma na Leonix",
          body: "Resumos, informações de negócios e ações rápidas no idioma que você selecionar no site.",
        },
        {
          title: "Mais formas de agir",
          body: "Pelo celular, podem ligar, abrir mapas, enviar mensagens, visitar links, ver redes sociais ou pedir mais informações.",
        },
        {
          title: "Opcional no impresso",
          body: "Para materiais impressos, Google Lens ou Apple Translate podem ajudar a ler texto. Leonix continua sendo a porta principal para o conteúdo digital.",
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
      requestInfoCta: { label: "Solicitar informações publicitárias" },
      supportingLine:
        "Abra o Media Kit para ver formatos, benefícios, pacotes e próximos passos.",
    },
    digitalMagazine: {
      eyebrow: "REVISTA DIGITAL",
      headline: "Abra a edição visual original — com apoio no seu idioma",
      intro:
        "Você pode abrir a revista digital original e ver suas páginas como foram projetadas. Leonix também oferece resumos, destaques e ações rápidas no idioma que você escolher.",
      visualNote:
        "As páginas visuais da revista (PDF/FlipHTML5) são a edição original — não uma tradução automática de toda a arte.",
      highlightsNote:
        "No site você encontrará resumos e CTAs no seu idioma para orientar sem prometer uma revista visual totalmente traduzida.",
      mobileNote:
        "No celular, escolha seu idioma na Leonix e use os resumos. Não escaneie sua própria tela para traduzir.",
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
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
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
    },
    footer: "© 2026 Leonix Media. Feito para nossa comunidade.",
  });
}
