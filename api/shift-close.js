import { sql } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // TODO: cek session & role (moderator/supervisor/admin allowed sesuai flag)

    const { work_date, shift, closed_by } = req.body || {};

    if (!work_date || !shift || !["pagi","siang","malam"].includes(shift) || !closed_by) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // ambil total data transaksi pada tanggal & shift tsb (yang tidak deleted)
    const [agg] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'withdraw' THEN 1 ELSE 0 END), 0) AS withdraw_count,
        COALESCE(SUM(CASE WHEN type = 'withdraw' THEN nominal ELSE 0 END), 0) AS withdraw_amount,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN 1 ELSE 0 END), 0) AS deposit_count,
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN nominal ELSE 0 END), 0) AS deposit_amount
      FROM transactions
      WHERE shift = ${shift}
        AND is_deleted = FALSE
        AND approved_at::date = ${work_date}::date
    `;

    const [inserted] = await sql`
      INSERT INTO shift_closings
        (work_date, shift, closed_at, closed_by,
         total_withdraw_count, total_withdraw_amount,
         total_deposit_count, total_deposit_amount)
      VALUES
        (${work_date}, ${shift}, NOW(), ${closed_by},
         ${agg.withdraw_count}, ${agg.withdraw_amount},
         ${agg.deposit_count}, ${agg.deposit_amount})
      RETURNING *
    `;

    return res.status(200).json({ data: inserted });
  } catch (err) {
    console.error("shift-close error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
