import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Magazine-coupons API (advertiser-only system).
  // Kept minimal for now; can be connected to DB later.
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  return res.status(200).json({ ok: true, coupons: [] });
}
