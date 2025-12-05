import { sql } from "./db.js";
import { determineShift } from "./utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // TODO: cek session panel & role (minimal admin)
    // misal pakai cookie/session, untuk sekarang anggap lolos

    const {
      type,             // 'withdraw' | 'deposit'
      username,
      bank,
      account_number,
      account_name,
      nominal,
      operator,         // nama operator WL
      approved_at       // ISO string
    } = req.body || {};

    if (!type || !username || !bank || !account_number || !account_name || !nominal || !operator || !approved_at) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    if (!["withdraw", "deposit"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    const approvedDate = new Date(approved_at);
    const shift = determineShift(approvedDate);

    // ambil & update counter transaksi di settings
    const [settingsRow] = await sql`
      SELECT value FROM settings WHERE key = 'tx_counters'
    `;
    const counters = settingsRow?.value || { withdraw: 1, deposit: 1 };

    const nextNumber = type === "withdraw" ? counters.withdraw : counters.deposit;
    const prefix = type === "withdraw" ? "WD" : "DP";
    const txId = `${prefix}-${String(nextNumber).padStart(6, "0")}`;

    // update counter
    if (type === "withdraw") {
      counters.withdraw = nextNumber + 1;
    } else {
      counters.deposit = nextNumber + 1;
    }

    await sql`
      UPDATE settings
      SET value = ${counters}::jsonb
      WHERE key = 'tx_counters'
    `;

    // insert transaksi
    const [inserted] = await sql`
      INSERT INTO transactions
        (tx_id, type, username, bank, account_number, account_name, nominal,
         shift, approved_at, created_by)
      VALUES
        (${txId}, ${type}, ${username}, ${bank}, ${account_number},
         ${account_name}, ${nominal}, ${shift}, ${approved_at}, ${operator})
      RETURNING *
    `;

    return res.status(200).json({ data: inserted });
  } catch (err) {
    console.error("tx-insert error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
