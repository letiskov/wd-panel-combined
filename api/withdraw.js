import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT id, username, bank, rekening, nama, nominal, status, created_at
      FROM withdraws
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    res.status(200).json({ data: rows });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Failed to fetch data from database" });
  }
}
