import { sql } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { type, shift, date_from, date_to, limit = 200 } = req.query;

    if (!type || !["withdraw", "deposit"].includes(type)) {
      return res.status(400).json({ error: "Invalid or missing type" });
    }

    const conditions = [];
    const params = [];

    conditions.push(`type = ${params.push(type)}::text`);

    if (shift) {
      conditions.push(`shift = ${params.push(shift)}::text`);
    }

    if (date_from) {
      conditions.push(`approved_at >= ${params.push(date_from)}::timestamptz`);
    }

    if (date_to) {
      conditions.push(`approved_at < ${params.push(date_to)}::timestamptz`);
    }

    const whereClause = conditions.length
      ? sql`WHERE ${sql.unsafe(conditions.join(" AND "))}`
      : sql``;

    const rows = await sql`
      SELECT *
      FROM transactions
      ${whereClause}
      ORDER BY approved_at DESC
      LIMIT ${Number(limit)}
    `;

    return res.status(200).json({ data: rows });
  } catch (err) {
    console.error("transactions error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
