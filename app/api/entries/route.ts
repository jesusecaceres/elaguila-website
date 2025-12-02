import { NextResponse } from "next/server";

let entries: any[] = []; // temporary storage (gets replaced later with DB)

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Save entry in memory
    entries.push({
      ...data,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid submission" },
      { status: 400 }
    );
  }
}

export async function GET() {
  // You can see all entries while developing
  return NextResponse.json(entries);
}
