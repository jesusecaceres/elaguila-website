import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

const INQUIRY_CATEGORIES = ["en-venta", "rentas"] as const;

type Body = {
  sellerEmail?: string;
  message: string;
  listingTitle?: string;
  /** Ignored for identity — server derives buyer from auth + profiles. */
  buyerName?: string;
  buyerEmail?: string;
  /** Published listing UUID — preferred when provided. */
  listingId?: string;
  /** Seller auth user id — must match sellerEmail via Auth when used. */
  sellerOwnerId?: string;
};

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

async function resolveBuyerFromSender(
  admin: ReturnType<typeof getAdminSupabase>,
  senderId: string
): Promise<{ buyerName: string; buyerEmail: string }> {
  const { data: authUser, error: authErr } = await admin.auth.admin.getUserById(senderId);
  if (authErr || !authUser.user) {
    return { buyerName: "", buyerEmail: "" };
  }
  const u = authUser.user;
  const buyerEmail = (u.email ?? "").trim();
  const meta = u.user_metadata as Record<string, unknown> | undefined;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta?.name === "string" && meta.name.trim()) ||
    "";

  const { data: profile } = await admin.from("profiles").select("display_name").eq("id", senderId).maybeSingle();
  const row = profile as { display_name?: string | null } | null;
  const buyerName =
    (row?.display_name?.trim() || "").trim() ||
    fromMeta ||
    (buyerEmail ? buyerEmail.split("@")[0] : "");

  return { buyerName, buyerEmail };
}

function buildStoredMessage(input: {
  buyerName: string;
  buyerEmail: string;
  listingTitle?: string;
  listingId: string;
  message: string;
}): string {
  const parts: string[] = [];
  const name = input.buyerName.trim();
  const be = input.buyerEmail.trim();
  if (name || be) {
    const who = [name, be ? `<${be}>` : ""].filter(Boolean).join(" ");
    parts.push(`[${who}]`);
  }
  if (input.listingId) {
    parts.push(`[Listing ID: ${input.listingId}]`);
  }
  const title = (input.listingTitle ?? "").trim();
  if (title) {
    parts.push(`[Anuncio: ${title}]`);
  }
  parts.push((input.message ?? "").trim());
  return parts.filter(Boolean).join("\n\n").slice(0, 2000);
}

export async function POST(req: Request) {
  let json: Body;
  try {
    json = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = getAdminSupabase();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: userData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const senderId = userData.user.id;

  const rawMsg = String(json.message ?? "").trim();
  if (!rawMsg) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const sellerEmailNorm = normalizeEmail(String(json.sellerEmail ?? ""));

  const listingIdIn = String(json.listingId ?? "").trim();
  const sellerOwnerIdIn = String(json.sellerOwnerId ?? "").trim();

  let receiverId: string | null = null;
  let listingIdOut: string;

  // 1) Explicit listing id (strongest)
  if (listingIdIn && isUuid(listingIdIn)) {
    const { data: row, error: listErr } = await admin
      .from("listings")
      .select("id, owner_id, category")
      .eq("id", listingIdIn)
      .in("category", [...INQUIRY_CATEGORIES])
      .maybeSingle();

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    if (!row?.owner_id) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    receiverId = String(row.owner_id);
    listingIdOut = String(row.id);
  }

  // 2) Seller owner id + verified email (Auth must match sellerEmail)
  if (!receiverId && sellerOwnerIdIn && isUuid(sellerOwnerIdIn)) {
    if (!sellerEmailNorm) {
      return NextResponse.json({ error: "Missing sellerEmail for this inquiry." }, { status: 400 });
    }

    const { data: ownerAuth, error: ownerErr } = await admin.auth.admin.getUserById(sellerOwnerIdIn);
    if (ownerErr || !ownerAuth.user) {
      return NextResponse.json({ error: "Seller account not found." }, { status: 404 });
    }
    const ownerEmail = normalizeEmail(ownerAuth.user.email ?? "");
    if (!ownerEmail || ownerEmail !== sellerEmailNorm) {
      return NextResponse.json({ error: "Seller context does not match." }, { status: 400 });
    }

    const { data: ownedListing } = await admin
      .from("listings")
      .select("id, category")
      .in("category", [...INQUIRY_CATEGORIES])
      .eq("owner_id", sellerOwnerIdIn)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    receiverId = sellerOwnerIdIn;
    const cat = (ownedListing?.category ?? "en-venta").toLowerCase();
    listingIdOut = ownedListing?.id ? String(ownedListing.id) : `${cat}-preview:${sellerOwnerIdIn}`;
  }

  // 3) Email fallback (last resort)
  if (!receiverId) {
    if (!sellerEmailNorm) {
      return NextResponse.json({ error: "Missing seller contact or listing context." }, { status: 400 });
    }

    const { data: listing } = await admin
      .from("listings")
      .select("id, owner_id")
      .in("category", [...INQUIRY_CATEGORIES])
      .ilike("contact_email", sellerEmailNorm)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (listing?.owner_id && listing?.id) {
      receiverId = String(listing.owner_id);
      listingIdOut = String(listing.id);
    } else {
      const { data: page, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) {
        return NextResponse.json({ error: listErr.message }, { status: 500 });
      }
      const match = page?.users?.find((u) => (u.email ?? "").toLowerCase() === sellerEmailNorm);
      if (match?.id) {
        receiverId = match.id;
        listingIdOut = `en-venta-preview:${receiverId}`;
      }
    }
  }

  if (!receiverId) {
    return NextResponse.json({ error: "Seller account not found for this email." }, { status: 404 });
  }

  if (receiverId === senderId) {
    return NextResponse.json({ error: "Cannot send an inquiry to yourself." }, { status: 400 });
  }

  const { buyerName, buyerEmail } = await resolveBuyerFromSender(admin, senderId);

  const message = buildStoredMessage({
    buyerName,
    buyerEmail,
    listingTitle: json.listingTitle,
    listingId: listingIdOut!,
    message: rawMsg,
  });

  const { error: insErr } = await admin.from("messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    listing_id: listingIdOut!,
    message,
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
