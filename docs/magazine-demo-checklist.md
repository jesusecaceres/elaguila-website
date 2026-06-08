# Leonix Media — Magazine Demo Checklist

Use this checklist for a production meeting demo of the multilingual magazine path. No secrets or internal keys required.

## Before the meeting

- [ ] Confirm production is green.
- [ ] Open on a phone or narrow browser window for mobile-first demo.
- [ ] Have these entry URLs ready (replace domain if staging):

| Step | URL |
|------|-----|
| Coming Soon (ES) | https://leonixmedia.com/coming-soon-v2?lang=es |
| Coming Soon (EN) | https://leonixmedia.com/coming-soon-v2?lang=en |
| Coming Soon (VI) | https://leonixmedia.com/coming-soon-v2?lang=vi |
| Magazine hub | https://leonixmedia.com/magazine?lang=vi |
| June issue | https://leonixmedia.com/magazine/2026/june?lang=vi |
| Full reader | https://leonixmedia.com/magazine/2026/june/read?lang=vi |

## Demo flow (recommended order)

### 1. Coming Soon — Spanish default

- [ ] Open `/coming-soon-v2?lang=es`.
- [ ] Confirm header shows **Español** | **English** | **More languages** (Tiếng Việt inside dropdown, not a third top pill).
- [ ] Scroll hero and note Leonix value proposition in Spanish.

### 2. Switch to English

- [ ] Click **English** in the header.
- [ ] Confirm URL updates to `?lang=en` and body copy switches to English.
- [ ] Confirm magazine CTA still works.

### 3. Open More Languages → Vietnamese

- [ ] Open **More languages** and select **Tiếng Việt**.
- [ ] Confirm URL is `?lang=vi` (not silently dropped to `?lang=es`).
- [ ] Confirm Coming Soon body shows Vietnamese copy where available.

### 4. Magazine CTA

- [ ] Click **Read the magazine** / **Đọc tạp chí** CTA.
- [ ] Confirm landing at `/magazine?lang=vi` (or current lang).
- [ ] Confirm lang is preserved in the URL.

### 5. Spanish visual original on the hub

- [ ] Point to cover image (`/magazine/2026/june/cover.png`).
- [ ] Click **View Spanish flipbook** / **Ver flipbook en español** — flipbook modal opens (Spanish original).
- [ ] Close modal.
- [ ] Click **Download original PDF** — PDF download starts (`leonix_media_june.pdf`).
- [ ] Read the **original visual edition** note on the page aloud:
  - The print/digital **visual** magazine is in **Spanish**.
  - Full translated **visual** editions (PDF/flipbook) would be **separate assets** in a future phase.

### 6. June issue page

- [ ] Click **June 2026 Edition** / issue title link → `/magazine/2026/june?lang=…`.
- [ ] Confirm original-edition note and future flipbook note are visible.
- [ ] Open flipbook or PDF again if helpful for the room.

### 7. Translated reader (structured content)

- [ ] Click **Open translated reader** / **Abrir lector traducido**.
- [ ] Confirm `/magazine/2026/june/read?lang=…`.
- [ ] Switch header language to **Español**, **English**, and **Tiếng Việt** — reader sections update.
- [ ] Walk through the nine reader sections (any language):
  1. About Leonix Media
  2. About El Águila & the magazine
  3. Featured ads preview
  4. Classifieds preview
  5. Local business profile preview
  6. Digital magazine / QR language access
  7. Want to advertise?
  8. Join the newsletter
  9. Contact / request more information
- [ ] Emphasize: this reader summarizes key information in the selected language; **business names, phones, addresses, and QR targets stay original**.

### 8. CTAs (real, safe links)

- [ ] From reader or hub, show **Advertise with us** → `/contact?interest=advertise&lang=…`.
- [ ] Show **Newsletter** → `/newsletter?source=…&lang=…`.
- [ ] Show **Contact** → `/contact?lang=…`.
- [ ] Show **Explore classifieds** → `/clasificados?lang=…`.

### 9. Navigation back

- [ ] From reader, use **Back to magazine** — lang preserved.
- [ ] Optional: **Back to Coming Soon** — lang preserved.

## Talking points for the room

- **Spanish-first visual product:** Flipbook and PDF are the authentic Spanish print/digital edition.
- **Multilingual reader:** ES/EN/VI structured summaries help visitors understand ads, classifieds, and CTAs without claiming the PDF is translated.
- **Future visual translations:** English/Vietnamese **full visual** editions require separate PDF/flipbook production — not auto-generated on page load.
- **No Google cost on this demo path:** Magazine hub, issue, and reader pages use static hand-authored copy only — no translation API calls on page load.
- **Dynamic ad translation (separate feature):** Listing/ad translation uses the protected translate flow with Supabase durable cache so repeat identical requests do not re-bill Google.

## Quick sanity checks

- [ ] No private/admin/dev routes linked from public magazine pages.
- [ ] No claim that the flipbook/PDF itself is translated.
- [ ] Lang param survives Coming Soon → Magazine → June → Reader → back.
- [ ] Mobile: flipbook modal, reader sections, and header language selector are usable on phone.

## If something breaks

- Hard refresh with `?lang=` intact.
- Try ES first (`?lang=es`), then EN, then VI.
- Flipbook URL: `https://flip.leonixmedia.com/books/qnda/` (Spanish original).
- PDF fallback: `/magazine/2026/june/leonix_media_june.pdf`.
