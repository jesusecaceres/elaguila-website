import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, prize, date } = body;

    if (!name || !prize || !date) {
      return NextResponse.json(
        { error: "Missing winner fields" },
        { status: 400 }
      );
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_WINNERS_SHEET_ID,
      range: "Winners!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [[name, prize, date]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error adding winner:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
