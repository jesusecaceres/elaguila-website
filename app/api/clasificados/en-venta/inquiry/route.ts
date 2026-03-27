import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  sellerEmail: string;
  message: string;
  listingTitle?: string;
  buyerName?: string;
  buyerEmail?: string;
};

function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

function buildStoredMessage(body: Body): string {
  const parts: string[] = [];
  const name = (body.buyerName ?? "").trim();
  const be = (body.buyerEmail ?? "").trim();
  if (name || be) {
    const who = [name, be ? `<${be}>` : ""].filter(Boolean).join(" ");
    parts.push(`[${who}]`);
  }
  const title = (body.listingTitle ?? "").trim();
  if (title) {
    parts.push(`[Anuncio: ${title}]`);
  }
  parts.push((body.message ?? "").trim());
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
  } catch (e) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { data: userData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const senderId = userData.user.id;

  const sellerEmail = normalizeEmail(String(json.sellerEmail ?? ""));
  const rawMsg = String(json.message ?? "").trim();
  if (!sellerEmail || !rawMsg) {
    return NextResponse.json({ error: "Missing sellerEmail or message" }, { status: 400 });
  }

  const message = buildStoredMessage({ ...json, message: rawMsg });

  let receiverId: string | null = null;
  let listingId: string;

  const { data: listing } = await admin
    .from("listings")
    .select("id, owner_id")
    .eq("category", "en-venta")
    .ilike("contact_email", sellerEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (listing?.owner_id && listing?.id) {
    receiverId = String(listing.owner_id);
    listingId = String(listing.id);
  } else {
    const { data: page, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const match = page?.users?.find((u) => (u.email ?? "").toLowerCase() === sellerEmail);
    if (match?.id) {
      receiverId = match.id;
      listingId = `en-venta-preview:${receiverId}`;
    }
  }

  if (!receiverId) {
    return NextResponse.json({ error: "Seller account not found for this email." }, { status: 404 });
  }

  if (receiverId === senderId) {
    return NextResponse.json({ error: "Cannot send an inquiry to yourself." }, { status: 400 });
  }

  const { error: insErr } = await admin.from("messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    listing_id: listingId!,
    message,
  });

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
