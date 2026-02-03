import type { NextApiRequest, NextApiResponse } from "next";

type Entry = Record<string, any> & { submittedAt: string };

// Dev-only in-memory storage.
// NOTE: In serverless deployments this may reset between invocations.
// Replace with Supabase later.
let entries: Entry[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return res.status(200).json(entries);
  }

  if (req.method === "POST") {
    try {
      const data = req.body ?? {};

      entries.push({
        ...data,
        submittedAt: new Date().toISOString(),
      });

      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid submission" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
