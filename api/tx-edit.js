import { sql } from "./db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // TODO: cek session & role === 'moderator'
    const { transaction_id, updates, reason, edited_by, edited_by_role } = req.body || {};

    if (!transaction_id || !updates || !reason || !edited_by || !edited_by_role) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const [before] = await sql`
      SELECT * FROM transactions WHERE id = ${transaction_id}
    `;

    if (!before) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // build update
    const newData = {
      username: updates.username ?? before.username,
      bank: updates.bank ?? before.bank,
      account_number: updates.account_number ?? before.account_number,
      account_name: updates.account_name ?? before.account_name,
      nominal: updates.nominal ?? before.nominal,
      shift: updates.shift ?? before.shift,
    };

    const [after] = await sql`
      UPDATE transactions
      SET username = ${newData.username},
          bank = ${newData.bank},
          account_number = ${newData.account_number},
          account_name = ${newData.account_name},
          nominal = ${newData.nominal},
          shift = ${newData.shift},
          version = version + 1
      WHERE id = ${transaction_id}
      RETURNING *
    `;

    await sql`
      INSERT INTO edit_logs
        (transaction_id, edited_by, edited_by_role, action, before_data, after_data, reason)
      VALUES
        (${transaction_id}, ${edited_by}, ${edited_by_role}, 'edit',
         ${before}::jsonb, ${after}::jsonb, ${reason})
    `;

    return res.status(200).json({ data: after });
  } catch (err) {
    console.error("tx-edit error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
