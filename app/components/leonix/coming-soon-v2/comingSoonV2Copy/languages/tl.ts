import type { SupportedLang } from "@/app/lib/language";
import type { ComingSoonV2Copy } from "../types";
import { localizeComingSoonV2Copy } from "../assemble";

export function getTlCopy(lang: SupportedLang): ComingSoonV2Copy {
  return localizeComingSoonV2Copy(lang, {
    nav: [
      { label: "Home", href: "#inicio", active: true },
      { label: "Ano ang makukuha mo", href: "#que-obtienes" },
      { label: "Paano ito gumagana", href: "#como-funciona" },
      { label: "QR access", href: "#qr" },
      { label: "Kontak", href: "#contacto" },
    ],
    launchCta: "Sumali sa launch",
    brandName: "Leonix Media",
    langToggle: { es: "Español", en: "English" },
    mainAria: "Leonix Media — Home",
    navAria: "Pangunahing navigation",
    langAria: "Wika",
    hero: {
      badge: "MALAPIT NA",
      title: "Leonix Media",
      valueLines: [
        {
          parts: [
            { text: "Print advertising sa " },
            { text: "Espanyol", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Bilingual " },
            { text: "digital exposure", accent: "burgundy" },
            { text: "." },
          ],
        },
        {
          parts: [
            { text: "Multilingual " },
            { text: "access sa pamamagitan ng ", accent: "burgundy" },
            { text: "QR", accent: "gold" },
            { text: "." },
          ],
        },
      ],
      paragraph:
        "Ikonekta ang iyong negosyo sa Latino at multicultural na komunidad ng Bay Area sa pamamagitan ng premium magazine, bilingual digital presence, at mga tool na ginagawang aksyon ang atensyon.",
      ctas: [
        { label: "Mag-advertise sa amin", variant: "primary" },
        { label: "Tingnan ang Media Kit", variant: "secondary" },
        { label: "Sumali sa launch", variant: "green" },
      ],
      trustChips: ["Ginawa para sa ating komunidad", "Lokal na tiwala", "Digital na aksyon"],
      valueAria: "Value proposition",
      trustAria: "Tiwala",
      mediaVisual: {
        label: "Premium magazine + digital presence",
        qrOverlay: "I-scan. Pumili ng wika. Kumonekta.",
        magazineAlt: "Dekoratibong preview ng Leonix Media magazine",
      },
      magazineCta: "Tingnan ang digital edition",
    },
    marketplace: {
      eyebrow: "CLASSIFIEDS + LOKAL NA MARKETPLACE",
      headline: "Dumadating ang komunidad para sa kailangan nila. Nakakakuha ng visibility ang mga negosyo.",
      intro:
        "Hindi lang advertising ang Leonix. Gumagawa rin kami ng lokal na marketplace kung saan maaaring maghanap, mag-post, at magbahagi ng tunay na oportunidad ang komunidad: rentals, trabaho, private autos, items for sale, events, pagkain, pets, at iba pa.",
      bridge:
        "Mas maraming dahilan para bisitahin ang Leonix ay mas maraming oportunidad para makita ang mga negosyo.",
      featuredCard: {
        badge: "Bagong kategorya",
        title: "Mga Lokal na Alok",
        body:
          "Lingguhang flyer, kupon, at espesyal na alok mula sa mga lokal na negosyo sa malinaw na karanasan na tumutulong sa komunidad na makatipid at sa negosyo na mas makita.",
        supportingLine:
          "Mas maraming dahilan para bisitahin ang Leonix ay mas maraming pagkakataon para makita ang mga lokal na negosyo.",
      },
      cardsAria: "Mga kategorya ng lokal na marketplace",
      cards: [
        {
          title: "Mga item at libreng gamit",
          body: "Mga lokal na item, gamit sa bahay, tools, damit, libreng hanap, at pang-araw-araw na listing na tumutulong sa kapitbahay bumili, magbenta, magbahagi, at tumuklas ng kapaki-pakinabang na oportunidad.",
        },
        {
          title: "Paupahan",
          body: "Mga kwarto, apartment, espasyo, at housing opportunities na may larawan, deskripsyon, lokasyon, presyo, at kontak.",
        },
        {
          title: "Trabaho",
          body: "Ang mga negosyong nagha-hire ay maaaring kumonekta sa mga tao sa komunidad na naghahanap ng trabaho at bagong oportunidad.",
        },
        {
          title: "Mga kotse (pribado)",
          body: "Mga listing ng kotse na may larawan, deskripsyon, presyo, at kontak para sa lokal na mamimili.",
        },
        {
          title: "Pagkain + mga event",
          body: "Pop-ups, lokal na pagkain, aktibidad, community event, at mga sandaling nagpapabalik sa mga tao.",
        },
        {
          title: "Hinahanap + mga alaga",
          body: "Maaari ring maghanap, magbahagi ng pangangailangan, at kumonekta tungkol sa alagang hayop, nawawalang gamit, adoption, o lokal na suporta ang komunidad.",
        },
      ],
      closing:
        "Nagdadala ng traffic ang Classifieds. Ginagawang tawag, bisita, at customer ng Negocios Locales ang atensyong iyon.",
      exploreCta: { label: "Tuklasin ang Classifieds" },
    },
    whatYouGet: {
      eyebrow: "ANO ANG MAKUKUHA MO",
      headline: "Higit sa ad: kumpletong presence para sa iyong negosyo.",
      intro:
        "Pinagsasama ng Leonix ang buwanang print magazine, Local Business Hub sa Negocios Locales, at QR-powered actions para mas maraming customer ang makahanap, makaintindi, at makontak ang iyong negosyo.",
      expandMore: "Alamin pa",
      expandLess: "Itago",
      cards: [
        {
          title: "Buwanang print magazine",
          body: "Maaaring lumabas ang iyong negosyo sa buwanang magazine na dinisenyo para sa lokal na Latino community.",
          detail:
            "Naglalathala ang Leonix ng buwanang Spanish print magazine para sa mapagkakatiwalaang lokal na visibility. Depende sa advertising package ang print placement — hindi lahat ng negosyo ay lumalabas sa bawat edition nang walang kontrata.",
          accent: "burgundy",
        },
        {
          title: "Bilingual digital presence",
          body: "Maaari ring lumabas ang iyong negosyo sa Leonix web pages na may native forms at actions sa wikang pipiliin ng customers.",
          detail:
            "Kinukumpleto ng digital pages ang print ad at Local Business Hub profile mo na may shareable information na maaaring balikan ng customers mula sa phone.",
          accent: "gold",
        },
        {
          title: "QR + tunay na aksyon",
          body: "Gawing tawag, mensahe, maps, website visits, social links, offers, at contact paths ang print attention.",
          detail:
            "Ikinokonekta ng QR ang bawat buwanang edition sa digital action. Maaaring mag-scan, gumamit ng phone translation tools o Leonix language pages ang readers, at maabot ang negosyo mo nang hindi lumilipat-lipat ng platform.",
          accent: "qr",
        },
        {
          title: "Negocios Locales + digital presence",
          body: "Gumagawa kami ng isang central business page kung saan mahahanap ng customers ang social links, website, phone, location, photos, reviews, offers, at contact options sa isang lugar.",
          detail:
            "Higit sa ad ang Negocios Locales — pinagsasama nito ang online presence mo para matuklasan at ma-explore ng customers ang negosyo nang hindi naghahanap sa hiwalay na platform.",
          accent: "green",
        },
        {
          title: "Founder launch opportunity",
          body: "Maging isa sa unang mga negosyong lumabas kasama ang Leonix Media sa launch stage.",
          detail:
            "Sa launch, tinutulungan ng unang mga negosyo na buuin ang paunang network ng Leonix Media. Maagang visibility opportunity ito — hindi hiwalay na advertising format.",
          accent: "founder",
        },
      ],
    },
    howItWorks: {
      eyebrow: "PAANO ITO GUMAGANA",
      headline: "Malinaw na proseso para ilunsad ang iyong presence sa Leonix.",
      intro:
        "Ginagabayan ka namin mula sa unang impormasyon hanggang sa presence na handang i-print, i-share, at ikonekta.",
      stepsAria: "Mga hakbang ng proseso",
      steps: [
        {
          title: "Piliin ang iyong presence",
          body: "Piliin kung gusto mo ng buwanang print visibility, digital Local Business Hub page sa Negocios Locales, QR-powered customer actions, o launch combination.",
        },
        {
          title: "Ipadala ang iyong impormasyon",
          body: "Ibahagi ang logo, photos, phone, address, socials, links, offer, at pangunahing detalye ng iyong negosyo.",
        },
        {
          title: "Inihahanda namin ang iyong presence",
          body: "Ino-organize namin ang iyong ad, digital information, at mga elementong tumutulong sa customer na maintindihan at makontak ang iyong negosyo.",
        },
        {
          title: "Ilunsad at kumonekta",
          body: "Handa nang lumabas ang iyong negosyo sa harap ng komunidad at gawing tawag, mensahe, bisita, at koneksyon ang interes.",
        },
      ],
    },
    qrAccess: {
      eyebrow: "QR ACCESS",
      headline: "Mula sa printed ad patungo sa phone ng customer.",
      intro:
        "Maaaring ikonekta ng bawat buwanang edition ang physical magazine sa digital actions: scan, translate, open maps, call, visit social links, view offers, at kontakin ang negosyo.",
      callout: "I-scan. Isalin. Basahin. Kumonekta.",
      explanation:
        "Kapag naipamahagi ang printed magazine, maaaring i-scan ng readers ang QR codes sa ads. Para basahin ang visual magazine, maaari nilang gamitin ang phone camera, Google Lens, Google Translate, o Apple Live Text sa printed pages, desktop screens, o screenshots. Para mag-browse sa Leonix website, maaari nilang gamitin ang Leonix translated pages o Google Translate Website Mode bilang fallback. Ang native Leonix contact at advertising forms ang opisyal na lead path.",
      mobileNote:
        "Sa mobile, huwag i-scan ang sarili mong screen. Gamitin muna ang Leonix language pages at summaries. Opsiyonal ang Google Lens at Apple Live Text para sa print o screenshots.",
      openReaderLabel: "Tingnan ang mga hakbang sa QR translation",
      heroStripSummary:
        "Maaaring ikonekta ng bawat buwanang print edition ang readers sa calls, maps, links, social profiles, at native Leonix contact paths.",
      detailNote: "Detalyadong gabay sa QR translation",
      benefitsAria: "Mga benepisyo ng QR access",
      benefits: [
        {
          title: "Print to phone action",
          body: "Ginagawang calls, maps, website visits, social links, offers, at native contact forms ng QR ang magazine attention.",
        },
        {
          title: "Camera at website translation",
          body: "Tumutulong ang Google Lens, Google Translate, at Apple Live Text sa visual pages. Tumutulong ang Google Translate Website Mode sa pag-browse sa Leonix — nananatiling opisyal ang native forms.",
        },
        {
          title: "Original visual magazine sa Spanish",
          body: "Nanatili sa Spanish ang PDF/FlipHTML5 visual edition. Hindi inaangkin ng Leonix ang fully translated visual magazine.",
        },
      ],
    },
    mediaKitPreview: {
      eyebrow: "MEDIA KIT",
      headline: "Ano ang makikita mo sa Media Kit",
      intro:
        "Pinagsasama-sama ng Media Kit ang buong paliwanag kung paano pinagsasama ng Leonix Media ang print magazine, digital presence, QR, tunay na aksyon, at advertising packages para mas maging malakas at mas madaling kontakin ang iyong negosyo.",
      pdfHonestyLine:
        "Maaaring ang downloadable PDF ay ang original Spanish edition habang inihahanda namin ang mga translated version. Ipinaliliwanag ng website ang mga opsyon sa wikang pipiliin mo.",
      cardsAria: "Nilalaman ng Media Kit",
      cards: [
        {
          title: "Bakit mag-advertise sa Leonix",
          body: "Tingnan kung paano tumutulong ang Leonix na lumikha ng reach, tiwala, at aksyon para sa lokal na negosyo na gustong kumonekta sa Latino at multicultural community.",
        },
        {
          title: "QR + action buttons",
          body: "Tingnan kung paano maaaring tumawag, buksan ang mapa, magpadala ng mensahe, bisitahin ang website, tingnan ang social media, reviews, at iba pa ang customer mula sa printed ad.",
        },
        {
          title: "Negocios Locales + digital presence",
          body: "Maintindihan kung paano maaaring magkaroon ng organisadong presence ang iyong negosyo na may phone, address, mapa, photos, reviews, social media, website, at contact buttons.",
        },
        {
          title: "Packages at susunod na hakbang",
          body: "Suriin ang advertising options, visibility levels, at proseso para magsimula sa Leonix Media.",
        },
      ],
      ctaHeading: "Handa nang tingnan ang detalye?",
      viewCta: { label: "Tingnan ang Media Kit" },
      downloadCta: { label: "I-download ang Media Kit" },
      dualPdfEsLabel: "Media Kit (orihinal na PDF sa Espanyol)",
      dualPdfEnLabel: "Media Kit (PDF sa Ingles)",
      requestInfoCta: { label: "Humiling ng impormasyon sa advertising" },
      supportingLine:
        "Buksan ang Media Kit para makita ang formats, benefits, packages, at susunod na hakbang.",
    },
    digitalMagazine: {
      eyebrow: "DIGITAL MAGAZINE",
      headline: "Original visual edition + multilingual support",
      intro:
        "Maaari mong buksan ang original Spanish visual magazine at tingnan ang mga pahina ayon sa disenyo. Nag-aalok din ang Leonix ng summaries, highlights, at mabilis na aksyon sa napiling wika kung available.",
      visualNote:
        "Ang visual magazine pages (PDF/FlipHTML5) ay ang original Spanish edition — hindi automatic translation ng buong artwork.",
      highlightsNote:
        "Gamitin ang Leonix pages para sa context at CTAs sa iyong wika. Maaaring tumulong ang Google Lens o screenshots sa visual pages. Magpapabuti ang future HTML companion ng language reach nang hindi pinapalitan ang original visual edition.",
      mobileNote:
        "Sa mobile, pumili ng wika sa Leonix at gamitin ang summaries. Maaaring tumulong ang phone camera tools sa printed o on-screen pages — huwag i-scan ang sarili mong screen para mag-translate.",
      readHighlightsCta: { label: "Basahin ang highlights sa iyong wika" },
      openOriginalCta: { label: "Buksan ang original digital magazine" },
      learnQrCta: { label: "Alamin kung paano gumagana ang QR access" },
    },
    finalCta: {
      eyebrow: "HANDA NANG MAG-LAUNCH",
      headline: "I-reserve ang iyong espasyo bago ang launch.",
      body: "Inihahanda ng Leonix Media ang launch nito para ikonekta ang lokal na negosyo sa Latino at multicultural Bay Area community. Kung gusto mong lumabas mula sa simula, ito na ang oras para magtaas ng kamay.",
      ctas: [
        { label: "Mag-advertise sa amin", variant: "primary" },
        { label: "Tingnan ang Media Kit", variant: "secondary", external: true },
        { label: "Sumali sa launch", variant: "green" },
      ],
      mediaKitDownload: { label: "I-download ang Media Kit" },
    },
    contact: {
      title: "Contact",
      body: "May tanong tungkol sa advertising, Media Kit, o launch stage? Kontakin kami at tutulungan ka naming pumili ng pinakamahusay na landas para sa iyong negosyo.",
      emailLabel: "Email",
      email: "info@leonixmedia.com",
      phoneLabel: "Phone",
      phone: "(408) 303-6500",
      phoneHref: "tel:+14083036500",
      addressLabel: "Address",
      address: "871 Coleman Avenue, Suite 201, San Jose, CA 95110",
      areaLabel: "Area",
      area: "San José • Silicon Valley • Latino Community",
    },
    newsletter: {
      title: "Maging bahagi ng launch",
      body: "Tumanggap ng balita, oportunidad, at updates mula sa Leonix Media.",
      placeholder: "Ang iyong email",
      button: "Abisuhan ako",
      formAria: "Newsletter signup",
      emailLabel: "Email",
      consent: "Sumasang-ayon akong tumanggap ng mga update sa launch ng Leonix Media.",
      consentError: "Pakikumpirma ang pahintulot na tumanggap ng mga update.",
    },
    footer: "© 2026 Leonix Media. Ginawa para sa ating komunidad.",
  });
}
