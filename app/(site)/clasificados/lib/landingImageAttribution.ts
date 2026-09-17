/**
 * Single source of truth for attribution on every controlled Leonix
 * landing/discovery photo that is NOT CC0 / Public Domain (those need no
 * attribution and are intentionally omitted here).
 *
 * Populated from the curated free-license sourcing pass (Openverse —
 * Flickr, Wikimedia, etc.) for the category landing-page image system.
 * Every entry here corresponds to a real installed file under
 * `public/child-categories/`.
 *
 * Not rendered on the landing cards themselves (no attribution clutter on
 * the UI) — this file exists so a future credits/legal page can list
 * required attribution without re-deriving it from scratch.
 *
 * Regenerate by re-running the sourcing pass rather than hand-editing;
 * if you replace an image locally, update or remove its row here too.
 */
export interface LandingImageAttribution {
  /** Path under /public this attribution applies to, e.g. "/child-categories/servicios/plomeria.jpg" */
  localPath: string;
  creator: string;
  creatorUrl?: string;
  /** Origin platform, e.g. "flickr", "wikimedia" */
  source: string;
  /** Direct asset URL the image was downloaded from */
  sourceUrl: string;
  /** Human-facing source/listing page, when available */
  foreignLandingUrl?: string;
  /** e.g. "CC BY 2.0", "CC BY-SA 4.0" */
  license: string;
  licenseUrl?: string;
}

export const LANDING_IMAGE_ATTRIBUTIONS: LandingImageAttribution[] = [
  {
    localPath: "/child-categories/servicios/belleza-barberia.jpg",
    creator: "Jason Lander",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/3130/2525458116_d1845ce0ea_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/8566600@N07/2525458116",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/servicios/tutoria.jpg",
    creator: "Lupuca",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/7378/8720604364_85c5931a14_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/95639384@N08/8720604364",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  {
    localPath: "/child-categories/viajes/cabos.jpg",
    creator: "jdlasica",
    creatorUrl: "https://www.flickr.com/photos/36521958135@N01",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4257/35093343981_4a071e4f68_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/36521958135@N01/35093343981",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/cancun-col.jpg",
    creator: "ricardodiaz11",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4074/4895563425_4de74900bb_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/41652235@N00/4895563425",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/cancun.jpg",
    creator: "jurvetson",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/3730/11105309355_7b7eae22f6_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/44124348109@N01/11105309355",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/couples.jpg",
    creator: "hernanpba",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/7642/16938152892_255b3aaf90_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/67430875@N03/16938152892",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  {
    localPath: "/child-categories/viajes/cr.jpg",
    creator: "David Berkowitz",
    creatorUrl: "https://www.flickr.com/photos/25897810@N00",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/6038/6883635426_48dd4455a0_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/25897810@N00/6883635426",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/editorial-canals.jpg",
    creator: "Ray in Manila",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/8879/28182099584_46c5aed5c6_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/21186555@N07/28182099584",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/editorial-pack-light.jpg",
    creator: "Velotton",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4695/38891747004_ffb287e209_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/126535469@N04/38891747004",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/editorial-resort-pool.jpg",
    creator: "Prayitno / Thank you for (12 millions +) view",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/8332/8412342861_dcacbddeb6_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/34128007@N04/8412342861",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/hero.jpg",
    creator: "Studio Sarah Lou",
    creatorUrl: "https://www.flickr.com/photos/86665756@N00",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4086/5044961957_3a23f43b72_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/86665756@N00/5044961957",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/groups.jpg",
    creator: "Grand Canyon NPS",
    creatorUrl: "https://www.flickr.com/photos/50693818@N08",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/8471/8136455491_afb4c3d229_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/50693818@N08/8136455491",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/maui.jpg",
    creator: "Rose Braverman",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/7041/6824540918_52fb4f3b88_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/75446397@N08/6824540918",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/mid-scenic.jpg",
    creator: "Grand Canyon NPS",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/5043/5374360748_8de3d95e82_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/50693818@N08/5374360748",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/near.jpg",
    creator: "Rennett Stowe",
    creatorUrl: "https://www.flickr.com/photos/10393601@N08",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/5333/9315404013_7cffbe1390_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/10393601@N08/9315404013",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/oak.jpg",
    creator: "Librarygroover",
    creatorUrl: "https://www.flickr.com/photos/7200755@N07",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/5213/5468815154_de4e314403_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/7200755@N07/5468815154",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/puerto-vallarta.jpg",
    creator: "Kurayba",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/5028/5670990623_4f21771820_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/48503330@N08/5670990623",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
  },
  {
    localPath: "/child-categories/viajes/riviera.jpg",
    creator: "Marit & Toomas Hinnosaar",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4030/4473787522_9918f5d435_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/27519540@N04/4473787522",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/romantic.jpg",
    creator: "David N Cooper",
    creatorUrl: "https://www.flickr.com/photos/84548414@N02",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/8429/7743234318_d958794361_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/84548414@N02/7743234318",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/sc.jpg",
    creator: "rafael-castillo",
    creatorUrl: "https://www.flickr.com/photos/7972895@N02",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4010/4705160161_4ef077a4f0_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/7972895@N02/4705160161",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/sfo.jpg",
    creator: "jitze",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/4124/5189326294_d39fca3b1f_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/40648743@N00/5189326294",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/sjo.jpg",
    creator: "Kossy@FINEDAYS",
    creatorUrl: "https://www.flickr.com/photos/47385088@N00",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/151/354401232_507d5d38ff_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/47385088@N00/354401232",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    localPath: "/child-categories/viajes/yosemite.jpg",
    creator: "Chase Lindberg Photography",
    source: "flickr",
    sourceUrl: "https://live.staticflickr.com/3512/5763418254_e2f42b2224_b.jpg",
    foreignLandingUrl: "https://www.flickr.com/photos/48355364@N08/5763418254",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
];
