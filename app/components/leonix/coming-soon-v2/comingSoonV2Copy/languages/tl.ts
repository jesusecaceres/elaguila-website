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
      { label: "Contact", href: "#contacto" },
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
      cardsAria: "Mga kategorya ng lokal na marketplace",
      cards: [
        {
          title: "Libreng items / for sale",
          body: "Items for sale, gamit sa bahay, tools, damit, at iba pa. Mga listing na dinisenyo para sa lokal na traffic at pagbabahagi ng oportunidad sa kapitbahay.",
        },
        {
          title: "Rentals",
          body: "Mga kwarto, apartment, espasyo, at housing opportunities na may photos, description, location, presyo, at contact.",
        },
        {
          title: "Trabaho",
          body: "Ang mga negosyong nagha-hire ay maaaring kumonekta sa mga tao sa komunidad na naghahanap ng trabaho at bagong oportunidad.",
        },
        {
          title: "Private autos",
          body: "Mga listing ng kotse na may photos, description, presyo, at contact para sa lokal na buyers.",
        },
        {
          title: "Pagkain + events",
          body: "Pop-ups, lokal na pagkain, activities, community events, at mga sandaling nagpapabalik sa mga tao.",
        },
        {
          title: "Hinahanap + pets",
          body: "Maaari ring maghanap, magbahagi ng pangangailangan, at kumonekta tungkol sa pets, nawawalang items, adoption, o lokal na suporta ang komunidad.",
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
        "Pinagsasama ng Leonix ang print magazine, digital presence, at QR-powered actions para mas maraming customer ang makahanap, makaintindi, at makontak ang iyong negosyo.",
      expandMore: "Alamin pa",
      expandLess: "Itago",
      cards: [
        {
          title: "Premium print magazine",
          body: "Lumalabas ang iyong negosyo sa publication na dinisenyo para sa lokal na Latino community.",
          detail:
            "Ang iyong ad ay nasa loob ng magazine na dinisenyo para maging lokal, mapagkakatiwalaan, at propesyonal. Hindi lang maganda ang layunin; ilalagay ang iyong negosyo sa harap ng komunidad na gustong suportahan ang lokal na negosyo.",
          accent: "burgundy",
        },
        {
          title: "Bilingual digital presence",
          body: "Maaari ring mamuhay ang iyong ad sa malinaw, propesyonal, at madaling i-share na digital experience.",
          detail:
            "Tinutulungan ng digital presence na hindi huminto ang ad sa isang pahina. Mahahanap, maibabahagi, at mababalikan ng customers ang iyong impormasyon mula sa kanilang phone.",
          accent: "gold",
        },
        {
          title: "QR + tunay na aksyon",
          body: "Gawing tawag, mensahe, maps, links, offers, at karagdagang impormasyon ang atensyon.",
          detail:
            "Tinutulungan ng QR na ilipat ang mga tao mula sa magazine patungo sa konkretong aksyon: tumawag, buksan ang mapa, magpadala ng mensahe, bisitahin ang website, tingnan ang social media, o humingi ng karagdagang impormasyon.",
          accent: "qr",
        },
        {
          title: "Negocios Locales",
          body: "Organisadong presence para sa phone, location, socials, photos, reviews, at mahahalagang links.",
          detail:
            "Ino-organize ng Negocios Locales ang iyong impormasyon sa isang lugar para hindi na kailangang maghanap sa iba't ibang platform ang customer. Phone, address, mapa, socials, photos, at links ay maaaring magkasama.",
          accent: "green",
        },
        {
          title: "Founder launch opportunity",
          body: "Maging isa sa unang mga negosyong lumabas kasama ang Leonix Media sa launch stage.",
          detail:
            "Sa launch, tinutulungan ng unang mga negosyo na buuin ang paunang network ng Leonix Media. Nagbibigay ito ng maagang visibility habang natutuklasan ng komunidad ang platform.",
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
          title: "Piliin ang iyong landas",
          body: "Piliin ang uri ng presence na gusto mo: print ad, digital presence, QR, Media Kit, o launch package.",
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
        "Ikinokonekta ng QR ang print magazine sa digital experience ng Leonix — ang iyong multilingual bridge.",
      callout: "I-scan. Pumili ng wika. Kumonekta.",
      explanation:
        "I-scan ang QR mula sa printed o digital materials. Sa Leonix pipili ka ng wika, magbabasa ng summaries at impormasyon ng lokal na negosyo, at gagawa ng mabilis na aksyon. Ang website ang multilingual bridge; nananatili ang original edition ng visual magazine.",
      mobileNote:
        "Sa mobile, huwag subukang i-scan ang sarili mong phone screen. Gamitin ang language selector ng Leonix at ang summaries sa iyong wika. Opsiyonal lang ang Google Lens o Apple Translate para sa printed materials.",
      benefitsAria: "Mga benepisyo ng QR access",
      benefits: [
        {
          title: "Pumili ng wika sa Leonix",
          body: "Summaries, impormasyon ng negosyo, at mabilis na aksyon sa wikang pipiliin mo sa site.",
        },
        {
          title: "Mas maraming paraan para kumilos",
          body: "Mula sa phone, maaari silang tumawag, buksan ang maps, magpadala ng mensahe, bisitahin ang links, tingnan ang social media, o humingi ng karagdagang impormasyon.",
        },
        {
          title: "Opsiyonal sa print",
          body: "Para sa printed materials, maaaring tumulong ang Google Lens o Apple Translate sa pagbasa ng text. Ang Leonix pa rin ang pangunahing pintuan sa digital content.",
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
      requestInfoCta: { label: "Humiling ng impormasyon sa advertising" },
      supportingLine:
        "Buksan ang Media Kit para makita ang formats, benefits, packages, at susunod na hakbang.",
    },
    digitalMagazine: {
      eyebrow: "DIGITAL MAGAZINE",
      headline: "Buksan ang original visual edition — may suporta sa iyong wika",
      intro:
        "Maaari mong buksan ang original digital magazine at tingnan ang mga pahina ayon sa disenyo. Nag-aalok din ang Leonix ng summaries, highlights, at mabilis na aksyon sa wikang pipiliin mo.",
      visualNote:
        "Ang visual magazine pages (PDF/FlipHTML5) ay ang original edition — hindi automatic translation ng buong artwork.",
      highlightsNote:
        "Sa site makikita mo ang summaries at CTAs sa iyong wika para gabayan ka nang hindi nagsasabing fully translated ang visual magazine.",
      mobileNote:
        "Sa mobile, pumili ng wika sa Leonix at gamitin ang summaries. Huwag i-scan ang sarili mong screen para mag-translate.",
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
      address: "871 Coleman Avenue, Suite 202, San Jose, CA 95110",
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
    },
    footer: "© 2026 Leonix Media. Ginawa para sa ating komunidad.",
  });
}
