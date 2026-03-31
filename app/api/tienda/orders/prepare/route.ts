import { NextResponse } from "next/server";
import { generateTiendaOrderId } from "@/app/lib/tienda/generateTiendaOrderId";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse<{ orderId: string }>> {
  return NextResponse.json({ orderId: generateTiendaOrderId() });
}
