/**
 * Build 06 — Human Connection Router asserts.
 * Run: npx tsx scripts/digital-contact-human-connection-06-assert.ts
 */

import type { DigitalContactProfile } from "../app/lib/digitalContact/digitalContactTypes";
import {
  resolveHumanConnectionChannels,
  DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO,
} from "../app/lib/digitalContact/humanConnection/resolveHumanConnectionChannels";
import { validateFacetimeDestination } from "../app/lib/digitalContact/humanConnection/channelValidation";
import { getDigitalContactProfile } from "../app/lib/digitalContact/digitalContactRegistry";

let passed = 0;
let failed = 0;

function assertEq(name: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(name: string, cond: boolean) {
  assertEq(name, cond, true);
}

function base(overrides: Partial<DigitalContactProfile> = {}): DigitalContactProfile {
  return {
    slug: "test",
    fullName: "Test",
    title: "T",
    company: "Leonix",
    legalEntity: "Leonix Global LLC",
    phoneDisplay: "(555) 111-2222",
    phoneDigits: "15551112222",
    email: "test@example.com",
    website: "https://leonixmedia.com",
    address: { line1: "1 Main", city: "San Jose", state: "CA", postalCode: "95110" },
    photoPath: null,
    trustChips: [],
    socials: [],
    active: true,
    ...overrides,
  };
}

function types(
  p: DigitalContactProfile,
  managed?: { browserVideo?: boolean; googleMeet?: boolean; scheduleRequest?: boolean },
) {
  return resolveHumanConnectionChannels({
    profile: p,
    surface: "digital_contact",
    managed,
  }).channels.map((c) => c.type);
}

// 1. phone only
{
  const t = types(base({ email: "", whatsappDigits: undefined, phoneDigits: "15551112222" }));
  assertTrue("1 has phone", t.includes("phone"));
  assertTrue("1 has sms", t.includes("sms"));
  assertTrue("1 no email", !t.includes("email"));
  assertTrue("1 no browser video", !t.includes("browser_video"));
}

// 2. WhatsApp + phone
{
  const t = types(base({ whatsappDigits: "15551113333" }));
  assertTrue("2 whatsapp", t.includes("whatsapp"));
  assertTrue("2 phone", t.includes("phone"));
}

// 3. email only
{
  const t = types(
    base({
      phoneDigits: "",
      phoneDisplay: "",
      email: "only@example.com",
      capabilities: { allowScheduling: false },
    }),
  );
  assertTrue("3 email only", t.includes("email"));
  assertTrue("3 no phone", !t.includes("phone"));
  assertTrue("3 no schedule", !t.includes("schedule_request"));
}

// 4. FaceTime unconfigured → hidden
{
  const t = types(base());
  assertTrue("4 no facetime", !t.includes("facetime"));
}

// 5. FaceTime configured validly
{
  const t = types(
    base({
      connectionDestinations: { facetimeUrl: "facetime:test@example.com" },
    }),
  );
  assertTrue("5 facetime present", t.includes("facetime"));
}

// 6. Meet unconfigured → hidden
{
  const t = types(base(), { googleMeet: false });
  assertTrue("6 no meet", !t.includes("google_meet"));
}

// 7. Browser video unconfigured → hidden
{
  const t = types(base({ capabilities: { allowVideo: true } }), { browserVideo: false });
  assertTrue("7 no browser video", !t.includes("browser_video"));
}

// 8. Browser video fully eligible → returned
{
  const t = types(base({ capabilities: { allowVideo: true } }), { browserVideo: true });
  assertTrue("8 browser video", t.includes("browser_video"));
  assertEq("8 primary live", t[0], "browser_video");
}

// 9. schedule enabled only when backend gate is true
{
  const t = types(base({ capabilities: { allowScheduling: true } }), { scheduleRequest: true });
  assertTrue("9 schedule", t.includes("schedule_request"));
}

// 10. schedule disabled on digital_contact (capability false)
{
  const t = types(base({ capabilities: { allowScheduling: false } }), { scheduleRequest: true });
  assertTrue("10 no schedule", !t.includes("schedule_request"));
}

// 11. VFD capability force still requires schedule backend gate
{
  const r = resolveHumanConnectionChannels({
    profile: base({ capabilities: { allowScheduling: false } }),
    surface: "virtual_front_desk",
    forceOfferSchedule: true,
    managed: { scheduleRequest: true },
  });
  assertTrue("11 vfd schedule", r.channels.some((c) => c.type === "schedule_request"));
}

// 11b. capability alone without backend → hidden (Build 07 launch truth)
{
  const t = types(base({ capabilities: { allowScheduling: true } }), { scheduleRequest: false });
  assertTrue("11b schedule gated", !t.includes("schedule_request"));
}

// 12. invalid facetime → hidden
{
  assertEq("12 js facetime", validateFacetimeDestination("javascript:alert(1)"), null);
  assertEq("12 http random", validateFacetimeDestination("http://evil.com"), null);
  const t = types(base({ connectionDestinations: { facetimeUrl: "javascript:alert(1)" } }));
  assertTrue("12 not routed", !t.includes("facetime"));
}

// 13. no Daily required for phone/whatsapp/email/facetime
{
  for (const ch of DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO) {
    assertTrue(`13 ${ch} listed`, DIRECT_CHANNELS_WITHOUT_MANAGED_VIDEO.includes(ch));
  }
  const t = types(base({ connectionDestinations: { facetimeUrl: "facetime:a@b.com" } }), {
    browserVideo: false,
  });
  assertTrue("13 phone without daily", t.includes("phone"));
  assertTrue("13 whatsapp without daily", t.includes("whatsapp"));
  assertTrue("13 email without daily", t.includes("email"));
  assertTrue("13 facetime without daily", t.includes("facetime"));
  assertTrue("13 no browser video", !t.includes("browser_video"));
}

// 14. ordering with live video: browser_video then whatsapp then phone
{
  const r = resolveHumanConnectionChannels({
    profile: base({ whatsappDigits: "15551112222" }),
    surface: "digital_contact",
    managed: { browserVideo: true },
  });
  const t = r.channels.map((c) => c.type);
  assertEq("14 first video", t[0], "browser_video");
  assertTrue("14 whatsapp before phone", t.indexOf("whatsapp") < t.indexOf("phone"));
}

// 15. no live: phone primary before whatsapp
{
  const r = resolveHumanConnectionChannels({
    profile: base({ whatsappDigits: "15551112222" }),
    surface: "digital_contact",
    managed: { browserVideo: false },
  });
  assertEq("15 primary phone", r.primaryType, "phone");
}

// 16. Chuy real profile — Meet is owner-approved ECP destination (Build 09B); FaceTime not invented
{
  const chuy = getDigitalContactProfile("chuy")!;
  const t = types(chuy, { browserVideo: false, scheduleRequest: false });
  assertTrue("16 chuy phone", t.includes("phone"));
  assertTrue("16 chuy whatsapp", t.includes("whatsapp"));
  assertTrue("16 chuy email", t.includes("email"));
  assertTrue("16 chuy schedule gated", !t.includes("schedule_request"));
  assertTrue("16 chuy no facetime invent", !t.includes("facetime"));
  assertTrue("16 chuy meet from ecp", t.includes("google_meet"));
  assertEq(
    "16 chuy meet url ecp",
    chuy.connectionDestinations?.googleMeetUrl,
    "https://meet.google.com/hdd-xkzj-npj",
  );
}

// 17. duplicate types removed
{
  const r = resolveHumanConnectionChannels({
    profile: base(),
    surface: "digital_contact",
  });
  const set = new Set(r.channels.map((c) => c.type));
  assertEq("17 unique", set.size, r.channels.length);
}

// 18. Meet managed false even if somehow wanted without provider
{
  const t = types(base(), { googleMeet: false, browserVideo: false });
  assertTrue("18 meet hidden", !t.includes("google_meet"));
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
