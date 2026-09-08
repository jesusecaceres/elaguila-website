# Virtual Front Desk — Device QA Card (Build 05)

Owner checklist. Complete on a real phone in a few minutes.

**QR / URL:** `https://leonixmedia.com/visitanos?source=office-window`

Before video tests: set Available 30m at `/admin/digital-contact/presence` for Chuy.  
After tests: **Clear status**.

---

## iPhone Safari

- [ ] QR opens `/visitanos?source=office-window`
- [ ] Page loads (no blank / crash)
- [ ] Spanish is default
- [ ] English toggle works
- [ ] Call works
- [ ] WhatsApp works
- [ ] SMS works
- [ ] Email works
- [ ] With staff Available: “Hablar por video” appears
- [ ] Without Available: video CTA hidden; other contact still works
- [ ] Video pre-call: first name required
- [ ] Camera/mic permission prompt appears (or denial still leaves fallbacks)
- [ ] Host gets email; can join from Admin host link
- [ ] Face-to-face connects (or fail → warm fallback)
- [ ] Return to Leonix page still usable
- [ ] ~75s no-answer → Call / WhatsApp / SMS / Email / schedule
- [ ] “Programar una conversación” = request (not booked)
- [ ] After hours (if testing then): office hours message truthful

## Android Chrome

- [ ] Same checks as above

## Pass / Fail

| Device | Pass? | Notes |
|---|---|---|
| iPhone Safari | | |
| Android Chrome | | |

**Do not leave Chuy Available after QA.**
