
// AUTO-DETECT IMAGE PAGES INSIDE PUBLIC FOLDER
// This placeholder expects pages to be named page1.jpg, page2.png, etc.
// Real detection must happen from uploaded assets (Next.js cannot list public folder at runtime)

export function getMagazinePages(year, month) {
  const base = `/magazines/${year}/${month}`;
  const pages = [];

  // Attempt up to 50 pages
  for (let i = 1; i <= 50; i++) {
    const candidates = [
      `${base}/page${i}.jpg`,
      `${base}/page${i}.jpeg`,
      `${base}/page${i}.png`,
      `${base}/page-${i}.jpg`,
      `${base}/page-${i}.png`,
      `${base}/page_${i}.jpg`
    ];
    pages.push(candidates[0]); // placeholder
  }

  return pages;
}
