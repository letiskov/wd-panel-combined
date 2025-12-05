import { neon } from "@neondatabase/serverless";

// IMPORTANT:
// Set DATABASE_URL on Vercel -> Project -> Settings -> Environment Variables
// Example: postgres://user:password@host/dbname?sslmode=require

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const rows = await sql`
      SELECT
        id,
        username,
        bank,
        account_number,
        account_name,
        nominal,
        created_at
      FROM withdraws
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return res.status(200).json({ data: rows });
  } catch (error) {
    console.error("Error querying Neon:", error);
    return res.status(500).json({ error: "Failed to fetch data from database" });
  }
}
